const moment = require("moment");
const { DB } = require("../../../config/db/index");

/**
 * ========================================
 * DASHBOARD SERVICE (Pure SQL Optimized)
 * ========================================
 *
 * Service untuk generate dashboard stats dengan pure raw SQL.
 * Menggabungkan data dari dashboard_123 (jadwal dokter) dan dashboard_239 (booking pasien).
 *
 * KENAPA RAW SQL?
 * - Avoid ORM overhead (tidak load semua data ke memory)
 * - Database-level aggregation (GROUP BY, COUNT, JOIN di PostgreSQL)
 * - Optimal untuk large datasets
 * - Single query per stats (minimized round trips)
 *
 * RELASI TABEL:
 * dashboard_123 (jadwal dokter) LEFT JOIN dashboard_239 (booking)
 * ON id_dokter + tanggal
 *
 * OUTPUT FORMAT:
 * {
 *   date: "2026-01-22",
 *   generatedAt: "2026-01-22T10:15:30+07:00",
 *   totals: { doctorsTotal, doctorsPracticing, ... },
 *   bookingByDoctor: [...],
 *   bookingBySpecialization: [...],
 *   practicingBySpecialization: [...]
 * }
 */
class DashboardService {
	/**
	 * ========================================
	 * MAIN METHOD: Get Dashboard Stats
	 * ========================================
	 *
	 * Mengambil statistik dashboard untuk tanggal tertentu.
	 * Semua data di-aggregate di database level (pure SQL).
	 *
	 * @param {string} tanggal - Format: YYYY-MM-DD (optional, default: hari ini)
	 * @returns {object} Dashboard stats
	 */
	static async getDashboardStats(tanggal) {
		// -------------------------------------
		// STEP 1: Setup Target Date
		// -------------------------------------
		const targetDate = tanggal || moment().format("YYYY-MM-DD");

		console.log(`[DashboardService] Generating dashboard stats for: ${targetDate}`);

		try {
			// -------------------------------------
			// STEP 2: Query Totals (Dokter Counts)
			// -------------------------------------
			const totals = await this._getTotals(targetDate);

			// -------------------------------------
			// STEP 3: Query Booking by Doctor
			// -------------------------------------
			const bookingByDoctor = await this._getBookingByDoctor(targetDate);

			// -------------------------------------
			// STEP 4: Query Booking by Specialization
			// -------------------------------------
			const bookingBySpecialization = await this._getBookingBySpecialization(targetDate);

			// -------------------------------------
			// STEP 5: Query Practicing by Specialization
			// -------------------------------------
			const practicingBySpecialization = await this._getPracticingBySpecialization(targetDate);

			// -------------------------------------
			// STEP 6: Format Final Output
			// -------------------------------------
			return {
				date: targetDate,
				generatedAt: moment().format(),
				totals,
				bookingByDoctor,
				bookingBySpecialization,
				practicingBySpecialization,
			};
		} catch (error) {
			console.error(`[DashboardService] Error generating stats:`, error.message);
			throw error;
		}
	}

	/**
	 * ========================================
	 * PRIVATE: Get Totals (Dokter Counts)
	 * ========================================
	 *
	 * Query untuk menghitung total dokter by status praktik.
	 *
	 * Output:
	 * {
	 *   doctorsTotal: 120,
	 *   doctorsPracticing: 35,
	 *   doctorsNotPracticing: 70,
	 *   doctorsOnLeave: 15
	 * }
	 */
	static async _getTotals(targetDate) {
		const [result] = await DB.query(
			`
			SELECT 
				COUNT(DISTINCT id_dokter) as doctors_total,
				COUNT(DISTINCT CASE 
					WHEN LOWER(status_praktik) NOT LIKE '%tidak praktik%' 
						AND LOWER(status_praktik) NOT LIKE '%cuti%'
						AND LOWER(status_praktik) NOT LIKE '%libur%'
					THEN id_dokter 
				END) as doctors_practicing,
				COUNT(DISTINCT CASE 
					WHEN 
						LOWER(status_praktik) LIKE '%tidak praktik%' 
						OR LOWER(status_praktik) LIKE '%cuti%' 
						OR LOWER(status_praktik) LIKE '%libur%'
					THEN id_dokter 
				END) as doctors_on_leave
			FROM dashboard_123
			WHERE tanggal = :targetDate
		`,
			{
				replacements: { targetDate },
				type: DB.QueryTypes.SELECT,
			},
		);

		const total = parseInt(result?.doctors_total) || 0;
		const practicing = parseInt(result?.doctors_practicing) || 0;
		const onLeave = parseInt(result?.doctors_on_leave) || 0;

		return {
			doctorsTotal: total,
			doctorsPracticing: practicing,
			doctorsNotPracticing: total - practicing,
			doctorsOnLeave: onLeave,
		};
	}

	/**
	 * ========================================
	 * PRIVATE: Get Booking by Doctor
	 * ========================================
	 *
	 * Query untuk menghitung jumlah booking per dokter.
	 * Menggunakan LEFT JOIN antara dashboard_123 dan dashboard_239.
	 *
	 * Output:
	 * [
	 *   { doctorId: 101, doctorName: "dr. Andi", bookings: 8 },
	 *   { doctorId: 102, doctorName: "dr. Budi", bookings: 3 }
	 * ]
	 */
	static async _getBookingByDoctor(targetDate) {
		const results = await DB.query(
			`
			SELECT 
				d123.id_dokter as doctor_id,
				d123.nama_dokter as doctor_name,
				COUNT(d239.booking_id) as bookings
			FROM dashboard_123 d123
			LEFT JOIN dashboard_239 d239
				ON d123.id_dokter = d239.id_dokter
				AND d123.tanggal = DATE(d239.tanggal_antrian)
				AND d123.jam_mulai <= d239.mulai
				AND d123.jam_selesai > d239.mulai
				AND d239.status_booking = 'Aktif'
			WHERE d123.tanggal = :targetDate
			GROUP BY d123.id_dokter, d123.nama_dokter
			ORDER BY bookings DESC, doctor_name ASC
		`,
			{
				replacements: { targetDate },
				type: DB.QueryTypes.SELECT,
			},
		);

		return results.map((row) => ({
			doctorId: String(row.doctor_id),
			doctorName: row.doctor_name,
			bookings: parseInt(row.bookings),
		}));
	}

	/**
	 * ========================================
	 * PRIVATE: Get Booking by Specialization
	 * ========================================
	 *
	 * Query untuk menghitung jumlah booking per spesialisasi.
	 * Menggunakan LEFT JOIN dan GROUP BY spesialisasi.
	 *
	 * Output:
	 * [
	 *   { specialization: "Sp. Anak", bookings: 12 },
	 *   { specialization: "Sp. Penyakit Dalam", bookings: 9 }
	 * ]
	 */
	static async _getBookingBySpecialization(targetDate) {
		const results = await DB.query(
			`
			SELECT 
				d123.nama_spesialis as specialization,
				COUNT(d239.booking_id) as bookings
			FROM dashboard_123 d123
			LEFT JOIN dashboard_239 d239
				ON d123.id_dokter = d239.id_dokter
				AND d123.tanggal = DATE(d239.tanggal_antrian)
				AND d123.jam_mulai <= d239.mulai
				AND d123.jam_selesai > d239.mulai
				AND d239.status_booking = 'Aktif'
			WHERE d123.tanggal = :targetDate
			GROUP BY d123.nama_spesialis
			ORDER BY bookings DESC, specialization ASC
		`,
			{
				replacements: { targetDate },
				type: DB.QueryTypes.SELECT,
			},
		);

		return results.map((row) => ({
			specialization: row.specialization,
			bookings: parseInt(row.bookings),
		}));
	}

	/**
	 * ========================================
	 * PRIVATE: Get Practicing by Specialization
	 * ========================================
	 *
	 * Query untuk menghitung dokter praktik per spesialisasi
	 * dengan list dokter dalam format JSON.
	 *
	 * Menggunakan PostgreSQL json_agg untuk aggregasi list.
	 *
	 * Output:
	 * [
	 *   {
	 *     specialization: "Sp. Anak",
	 *     doctors: 2,
	 *     doctorList: [
	 *       { id: "101", name: "dr. Andi" },
	 *       { id: "103", name: "dr. Citra" }
	 *     ]
	 *   }
	 * ]
	 */
	static async _getPracticingBySpecialization(targetDate) {
		const results = await DB.query(
			`
			SELECT 
				nama_spesialis as specialization,
				COUNT(DISTINCT id_dokter) as doctors,
				json_agg(
					jsonb_build_object(
						'id', id_dokter::text,
						'name', nama_dokter
					)
					ORDER BY nama_dokter
				) as doctor_list
			FROM dashboard_123
			WHERE tanggal = :targetDate
			GROUP BY nama_spesialis
			ORDER BY nama_spesialis ASC
		`,
			{
				replacements: { targetDate },
				type: DB.QueryTypes.SELECT,
			},
		);

		return results.map((row) => ({
			specialization: row.specialization,
			doctors: parseInt(row.doctors),
			doctorList: row.doctor_list || [],
		}));
	}
}

module.exports = DashboardService;
