const moment = require("moment");
const { DB } = require("../../../config/db/index");

/**
 * ========================================
 * DASHBOARD SERVICE (Pure SQL Optimized)
 * ========================================
 *
 * Service untuk generate dashboard stats dengan pure raw SQL.
 * Data diambil dari dashboard_123 (jadwal dokter).
 *
 * KENAPA RAW SQL?
 * - Avoid ORM overhead (tidak load semua data ke memory)
 * - Database-level aggregation (GROUP BY, COUNT, JOIN di PostgreSQL)
 * - Optimal untuk large datasets
 * - Single query per stats (minimized round trips)
 *
 * OUTPUT FORMAT:
 * {
 *   date: "2026-01-22",
 *   generatedAt: "2026-01-22T10:15:30+07:00",
 *   totals: { doctorsTotal, doctorsPracticing, ... },
 *   practicingBySpecialization: [...]
 * }
 *
 * TODO: Setelah peserta menyelesaikan workshop booking sync,
 * tambahkan bookingByDoctor dan bookingBySpecialization
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
			// STEP 3: Query Practicing by Specialization
			// -------------------------------------
			const practicingBySpecialization = await this._getPracticingBySpecialization(targetDate);

			// TODO: WORKSHOP EXERCISE
			// Setelah menyelesaikan booking sync, peserta akan menambahkan:
			// const bookingByDoctor = await this._getBookingByDoctor(targetDate);
			// const bookingBySpecialization = await this._getBookingBySpecialization(targetDate);

			// -------------------------------------
			// STEP 4: Format Final Output
			// -------------------------------------
			return {
				date: targetDate,
				generatedAt: moment().format(),
				totals,
				practicingBySpecialization,
				// TODO: Uncomment setelah workshop selesai
				// bookingByDoctor,
				// bookingBySpecialization,
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

	// ========================================
	// TODO: WORKSHOP EXERCISE - BOOKING QUERIES
	// ========================================
	// Peserta akan menambahkan method berikut setelah booking sync selesai:
	// 1. _getBookingByDoctor(targetDate)
	// 2. _getBookingBySpecialization(targetDate)
	//
	// Hint: Gunakan LEFT JOIN antara dashboard_123 dan dashboard_239
	// Lihat panduan di docs/WORKSHOP_HANDS_ON.md Step 9

	/**
	 * ========================================
	 * PRIVATE: Get Practicing by Specialization
	 * ========================================
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
