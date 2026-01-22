const dbHelper = require("../../../config/db/helper/dbHelper");
const DashboardUtil = require("../util/dashboard.util");
const moment = require("moment");

/**
 * Service untuk Modul Dashboard & Sinkronisasi.
 * Menangani logika bisnis untuk menarik data eksternal dan menyajikan statistik.
 */
class DashboardService {
	/**
	 * Memicu proses sinkronisasi data dari API Eksternal ke DB Lokal.
	 * Alur:
	 * 1. Loop halaman (Pagination) sampai semua data terambil.
	 * 2. Upsert (Insert/Update) ke database lokal untuk mencegah duplikasi.
	 */
	static async syncData() {
		const stats = { inserted: 0, updated: 0, total_fetched: 0 };

		// Setup Range Tanggal (Misal: Hari ini sampai 7 hari kedepan, atau sesuai kebutuhan user)
		// Default: H-1 sampai H+7 agar cover data yang mungkin berubah
		const startDate = moment().format("YYYY-MM-DD") + "T00:00:00+00:00";
		const endDate = moment().add(30, "days").format("YYYY-MM-DD") + "T23:59:59+00:00";

		let page = 1;
		let totalPages = 1; // Akan diupdate setelah hit pertama
		const limit = 10; // Bisa diperbesar jika performa API eksternal bagus

		console.log(`[Sync] Memulai sinkronisasi data jadwal...`);

		try {
			// LOOP PAGINATION
			while (page <= totalPages) {
				console.log(`[Sync] Mengambil halaman ${page} dari ${totalPages}...`);

				// 1. Ambil Data dari Utils
				const response = await Promise.resolve(
					DashboardUtil.fetchDataFromExternal({
						pages: page,
						limit: limit,
						tanggal_awal: startDate,
						tanggal_akhir: endDate,
					}),
				);

				// Update Total Pages di iterasi pertama
				if (page === 1 && response.meta_data) {
					console.log("[Sync] Response Meta Data:", response.data.meta_data);
					const count = response.data.meta_data.count || 0;
					totalPages = Math.ceil(count / limit);
					console.log(`[Sync] Total data ditemukan: ${count} (${totalPages} halaman)`);
				}

				const listJadwal = response.data?.list || [];
				stats.total_fetched += listJadwal.length;

				// 2. Proses Upsert ke Database
				for (const jadwal of listJadwal) {
					await this.upsertJadwal(jadwal, stats);
				}

				page++; // Lanjut ke halaman berikutnya

				// Jeda 200ms agar friendly ke server tujuan
				await new Promise((resolve) => setTimeout(resolve, 200));
			}

			console.log(`[Sync] Selesai. Total Insert: ${stats.inserted}, Update: ${stats.updated}`);
			return stats;
		} catch (error) {
			console.error("[Sync] Error fatal:", error);
			throw error;
		}
	}

	/**
	 * Helper Private untuk melakukan UPSERT ke tabel dashboard_123.
	 */
	static async upsertJadwal(jadwal, stats) {
		// Query Upsert PostgreSQL
		// Jika konflik (id_dokter, tanggal, jam_mulai), lakukan UPDATE. Jika tidak, INSERT.
		const query = `
            INSERT INTO public.dashboard_123 
            (id_dokter, nama_dokter, kode_spesialis, nama_spesialis, tanggal, hari, jam_mulai, jam_selesai, status_praktik, updated_at, last_synced_at)
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON CONFLICT (id_dokter, tanggal, jam_mulai) 
            DO UPDATE SET 
                nama_dokter = EXCLUDED.nama_dokter,
                status_praktik = EXCLUDED.status_praktik,
                jam_selesai = EXCLUDED.jam_selesai,
                updated_at = NOW(),
                last_synced_at = NOW()
        `;

		const values = [
			jadwal.id_dokter,
			jadwal.nama_dokter,
			jadwal.kode_spesialis,
			jadwal.nama_spesialis,
			jadwal.tanggal_char, // Format YYYY-MM-DD
			jadwal.day_name,
			jadwal.time_start,
			jadwal.time_finish,
			jadwal.status_praktik,
		];
		console.log(`[Sync] Memproses jadwal dokter ${jadwal.nama_dokter} pada ${jadwal.tanggal_char}...`);
		try {
			await dbHelper.queryReplacement(query, values);
			// Catatan: dbHelper mungkin return sesuatu, disini kita asumsi sukses = data processed
			// Secara ideal kita cek return value untuk tahu insert vs update, tp simplify dulu.
			stats.updated++;
		} catch (error) {
			console.error(error);
			console.error(`[Sync] Gagal simpan record dokter ${jadwal.nama_dokter}:`, error.message);
		}
	}

	/**
	 * Mengambil Data Dashboard dalam Format JSON Spesifik.
	 */
	static async getDashboardStats(tanggal) {
		const today = tanggal || moment().add(1, "days").format("YYYY-MM-DD");

		// Ambil semua data hari ini dari lokal DB
		const query = `
            SELECT * FROM public.dashboard_123 
            WHERE to_char(tanggal, 'YYYY-MM-DD') = '${today}'
        `;

		const rows = await dbHelper.executeSelectQuery(query);
		console.log(`[Dashboard] Data ditemukan untuk tanggal ${today}: ${rows.length} records.`);
		// Inisialisasi Sets dan Maps untuk Aggregasi Data
		let doctorsTotal = new Set();
		let doctorsPracticing = new Set();
		let doctorsOnLeave = new Set(); // Jika status berisi 'Cuti' / 'Libur'

		let bookingByDocMap = {};
		let bookingBySpecMap = {};
		let practiceBySpecMap = {};

		// Loop Data Raw SQL -> Aggregation Logic
		rows.forEach((row) => {
			// 1. Hitung Total Dokter (Unique)
			doctorsTotal.add(row.id_dokter);

			// 2. Cek Status Praktik
			// Sesuaikan string 'Praktik' dengan data riil dari API
			if (row.status_praktik?.toLowerCase().includes("tidak praktik")) {
				// Asumsi non-praktik = cuti/libur/tutup
				doctorsOnLeave.add(row.id_dokter);
			} else {
				doctorsPracticing.add(row.id_dokter);

				// Grouping Practicing by Spec
				if (!practiceBySpecMap[row.nama_spesialis]) {
					practiceBySpecMap[row.nama_spesialis] = {
						specialization: row.nama_spesialis,
						doctors: new Set(),
						doctorList: [], // Kita pakai Set untuk unique ID dulu, nanti convert
					};
				}

				// Cek duplikasi dokter di list spesialis ini
				const specGroup = practiceBySpecMap[row.nama_spesialis];
				if (!specGroup.doctors.has(row.id_dokter)) {
					specGroup.doctors.add(row.id_dokter);
					specGroup.doctorList.push({ id: row.id_dokter, name: row.nama_dokter });
				}
			}

			// 3. Hitung Booking (Sementara 0 atau count slot)
			// Asumsi: Row jadwal = slot yang tersedia? atau sekedar jadwal?
			// Sesuai request user: field 'bookings' disediakan walau data mungkin 0.
			const bookingCount = 0; // Default 0

			// Per Dokter
			if (!bookingByDocMap[row.id_dokter]) {
				bookingByDocMap[row.id_dokter] = {
					doctorId: row.id_dokter,
					doctorName: row.nama_dokter,
					bookings: 0,
				};
			}
			bookingByDocMap[row.id_dokter].bookings += bookingCount;

			// Per Spesialis
			if (!bookingBySpecMap[row.nama_spesialis]) {
				bookingBySpecMap[row.nama_spesialis] = {
					specialization: row.nama_spesialis,
					bookings: 0,
				};
			}
			bookingBySpecMap[row.nama_spesialis].bookings += bookingCount;
		});

		// Formatting Hasil Akhir ke JSON
		return {
			date: today,
			generatedAt: moment().format(),
			totals: {
				doctorsTotal: doctorsTotal.size,
				doctorsPracticing: doctorsPracticing.size,
				doctorsNotPracticing: doctorsTotal.size - doctorsPracticing.size,
				doctorsOnLeave: doctorsOnLeave.size,
			},
			bookingByDoctor: Object.values(bookingByDocMap),
			bookingBySpecialization: Object.values(bookingBySpecMap),
			practicingBySpecialization: Object.values(practiceBySpecMap).map((item) => ({
				specialization: item.specialization,
				doctors: item.doctors.size, // Jumlah count
				doctorList: item.doctorList,
			})),
		};
	}
}

module.exports = DashboardService;
