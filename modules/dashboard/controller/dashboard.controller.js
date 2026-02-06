const JadwalSyncService = require("../service/jadwal-sync.service");
const DashboardService = require("../service/dashboard.service");

/**
 * ========================================
 * DASHBOARD CONTROLLER
 * ========================================
 *
 * Controller untuk handle HTTP requests dashboard.
 *
 * ENDPOINTS STRUCTURE:
 * - POST /dashboard/sync-jadwal → Sync jadwal dokter
 * - POST /dashboard/sync-booking → (TODO: Peserta workshop akan membuatnya)
 * - POST /dashboard/sync-all → Sync semua types sekaligus
 * - GET /dashboard/stats → Dashboard stats dengan JOIN queries
 */
class DashboardController {
	/**
	 * ========================================
	 * ENDPOINT: Sync Jadwal Dokter
	 * ========================================
	 *
	 * Trigger manual sinkronisasi jadwal praktik dokter.
	 *
	 * Method: POST
	 * Route: /dashboard/sync-jadwal
	 */
	static triggerSyncJadwal() {
		return async (req, res, next) => {
			try {
				console.log("[DashboardController] Trigger manual sync: Jadwal Dokter");

				// Panggil Jadwal Sync Service
				const result = await JadwalSyncService.syncJadwalDokter();

				// Format Response
				res.status(200).json({
					meta_data: {
						status: 200,
						message: "Sinkronisasi jadwal dokter berhasil dijalankan.",
					},
					data: result,
				});
			} catch (error) {
				console.error("[DashboardController] Error in triggerSyncJadwal:", error.message);
				next(error);
			}
		};
	}

	// ========================================
	// TODO: WORKSHOP EXERCISE
	// ========================================
	// Peserta akan menambahkan method triggerSyncBooking() di sini
	// Lihat panduan di docs/WORKSHOP_HANDS_ON.md Step 6

	/**
	 * ========================================
	 * ENDPOINT: Sync All Types
	 * ========================================
	 *
	 * Trigger sinkronisasi SEMUA sync types sekaligus.
	 *
	 * Method: POST
	 * Route: /dashboard/sync-all
	 *
	 * NOTE: Saat ini hanya sync jadwal dokter.
	 * Setelah peserta menyelesaikan workshop, booking akan ditambahkan.
	 */
	static triggerSyncAll() {
		return async (req, res, next) => {
			try {
				console.log("[DashboardController] Trigger manual sync: ALL TYPES");

				// Sync Jadwal Dokter
				const jadwalResult = await JadwalSyncService.syncJadwalDokter();

				// TODO: Tambahkan booking sync setelah workshop selesai
				// const bookingResult = await BookingSyncService.syncBooking();

				// Format Response
				res.status(200).json({
					meta_data: {
						status: 200,
						message: "Sinkronisasi semua data berhasil dijalankan.",
					},
					data: {
						jadwalDokter: jadwalResult,
						// bookingPasien: bookingResult, // TODO: Uncomment setelah workshop
					},
				});
			} catch (error) {
				console.error("[DashboardController] Error in triggerSyncAll:", error.message);
				next(error);
			}
		};
	}

	static getDashboardData() {
		return async (req, res, next) => {
			try {
				const { tanggal } = req.query;
				console.log(`[DashboardController] Fetching dashboard stats for date: ${tanggal || "today"}`);
				// Get stats dari Dashboard Service (dengan JOIN queries)
				const stats = await DashboardService.getDashboardStats(tanggal);

				// Return JSON
				res.status(200).json(stats);
			} catch (error) {
				console.error("[DashboardController] Error in getDashboardData:", error.message);
				next(error);
			}
		};
	}
}

module.exports = DashboardController;
