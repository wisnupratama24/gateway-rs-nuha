const DashboardUtil = require("../util/dashboard.util");
const moment = require("moment");
// Import Model
const ModelDashboard123 = require("../../../models/dashboard/dashboard.model");

/**
 * Service untuk Modul Dashboard & Sinkronisasi.
 * Menangani logika bisnis untuk menarik data eksternal dan menyajikan statistik.
 */
class DashboardService {
	/**
	 * Memicu proses sinkronisasi data dari API Eksternal ke DB Lokal.
	 * Alur:
	 * 1. Loop halaman (Pagination) sampai semua data terambil.
	 * 2. Upsert (Insert/Update) ke database lokal menggunakan Sequelize Model.
	 */
	static async syncData() {
		const stats = { inserted: 0, updated: 0, total_fetched: 0 };

		// Setup Range Tanggal (User preferensi: 30 hari kedepan)
		const startDate = moment().format("YYYY-MM-DD") + "T00:00:00+00:00";
		const endDate = moment().add(14, "days").format("YYYY-MM-DD") + "T23:59:59+00:00";

		let page = 1;
		let totalPages = 1;
		const limit = 10;

		console.log(`[Sync] Memulai sinkronisasi data jadwal...`);

		try {
			// LOOP PAGINATION
			while (page <= totalPages) {
				console.log(`[Sync] Mengambil halaman ${page} dari ${totalPages}...`);

				// 1. Ambil Data dari Utils
				const response = await DashboardUtil.fetchDataFromExternal({
					pages: page,
					limit: limit,
					tanggal_awal: startDate,
					tanggal_akhir: endDate,
				});

				// Update Total Pages di iterasi pertama
				if (page === 1) {
					// Fallback check untuk lokasi meta_data
					const metaData = response.data?.meta_data || response.meta_data || {};
					const count = metaData.count || 0;
					totalPages = Math.ceil(count / limit);
					console.log(`[Sync] Total data ditemukan: ${count} (${totalPages} halaman)`);
				}

				const listJadwal = response.data?.list || [];
				stats.total_fetched += listJadwal.length;

				// 2. Proses Upsert ke Database menggunakan Model Sequelize
				for (const jadwal of listJadwal) {
					await this.upsertJadwal(jadwal, stats);
				}

				page++;
				await new Promise((resolve) => setTimeout(resolve, 200));
			}

			console.log(`[Sync] Selesai. Total Insert/Update: ${stats.updated}`);
			return stats;
		} catch (error) {
			console.error("[Sync] Error fatal:", error);
			throw error;
		}
	}

	/**
	 * Helper Private untuk melakukan UPSERT menggunakan Sequelize Model.
	 */
	static async upsertJadwal(jadwal, stats) {
		try {
			// Mapping data API ke field Model
			const dataToSave = {
				id_dokter: jadwal.id_dokter,
				tanggal: jadwal.tanggal_char, // YYYY-MM-DD
				jam_mulai: jadwal.time_start, // Key unique gabungan

				nama_dokter: jadwal.nama_dokter,
				kode_spesialis: jadwal.kode_spesialis,
				nama_spesialis: jadwal.nama_spesialis,
				hari: jadwal.day_name,
				jam_selesai: jadwal.time_finish,
				status_praktik: jadwal.status_praktik,

				// Timestamp update manual karena kita pakai upsert
				updated_at: new Date(),
				last_synced_at: new Date(),
			};

			// Sequelize Upsert
			const [, created] = await ModelDashboard123.upsert(dataToSave);

			if (created) {
				stats.inserted++;
			} else {
				stats.updated++;
			}
		} catch (error) {
			console.error(`[Sync] Gagal simpan record dokter ${jadwal.nama_dokter}:`, error.message);
		}
	}

	/**
	 * Mengambil Data Dashboard dalam Format JSON Spesifik.
	 */
	static async getDashboardStats(tanggal) {
		// User preferensi: Tanggal parameter atau besok (H+1) defaultnya
		const targetDate = tanggal || moment().add(1, "days").format("YYYY-MM-DD");

		// Ambil data menggunakan Model.findAll
		const rows = await ModelDashboard123.findAll({
			where: {
				tanggal: targetDate,
			},
			raw: true,
		});

		// Inisialisasi Sets dan Maps untuk Aggregasi Data
		let doctorsTotal = new Set();
		let doctorsPracticing = new Set();
		let doctorsOnLeave = new Set();

		let bookingByDocMap = {};
		let bookingBySpecMap = {};
		let practiceBySpecMap = {};

		// Loop Data -> Aggregation Logic
		rows.forEach((row) => {
			// 1. Hitung Total Dokter (Unique)
			doctorsTotal.add(row.id_dokter);

			// 2. Cek Status Praktik
			// Logic User: jika contains 'tidak praktik', masuk onLeave
			if (row.status_praktik && row.status_praktik.toLowerCase().includes("tidak praktik")) {
				doctorsOnLeave.add(row.id_dokter);
			} else {
				doctorsPracticing.add(row.id_dokter);

				// Grouping Practicing by Spec
				if (!practiceBySpecMap[row.nama_spesialis]) {
					practiceBySpecMap[row.nama_spesialis] = {
						specialization: row.nama_spesialis,
						doctors: new Set(),
						doctorList: [],
					};
				}

				const specGroup = practiceBySpecMap[row.nama_spesialis];
				if (!specGroup.doctors.has(row.id_dokter)) {
					specGroup.doctors.add(row.id_dokter);
					specGroup.doctorList.push({ id: row.id_dokter, name: row.nama_dokter });
				}
			}

			// 3. Hitung Booking (Default 0)
			const bookingCount = 0;

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
			date: targetDate,
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
				doctors: item.doctors.size,
				doctorList: item.doctorList,
			})),
		};
	}
}

module.exports = DashboardService;
