const JadwalSyncService = require("../service/jadwal-sync.service");
const BookingSyncService = require("../service/booking-sync.service");
const DashboardService = require("../service/dashboard.service");

/**
 * ========================================
 * DASHBOARD CONTROLLER (Refactored)
 * ========================================
 *
 * Controller untuk handle HTTP requests dashboard.
 * Mendukung multiple sync types dengan endpoints terpisah.
 *
 * PERUBAHAN dari versi sebelumnya:
 * - Sebelumnya: 1 sync endpoint untuk jadwal dokter saja
 * - Sekarang: Multiple endpoints untuk different sync types
 *
 * ENDPOINTS STRUCTURE:
 * - POST /dashboard/sync-jadwal → Sync jadwal dokter
 * - POST /dashboard/sync-booking → Sync booking pasien
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

	/**
	 * ========================================
	 * ENDPOINT: Sync Booking Pasien
	 * ========================================
	 *
	 * Trigger manual sinkronisasi booking/registrasi pasien.
	 *
	 * Method: POST
	 * Route: /dashboard/sync-booking
	 */
	static triggerSyncBooking() {
		return async (req, res, next) => {
			try {
				console.log("[DashboardController] Trigger manual sync: Booking Pasien");

				// Panggil Booking Sync Service
				const result = await BookingSyncService.syncBooking();

				// Format Response
				res.status(200).json({
					meta_data: {
						status: 200,
						message: "Sinkronisasi booking pasien berhasil dijalankan.",
					},
					data: result,
				});
			} catch (error) {
				console.error("[DashboardController] Error in triggerSyncBooking:", error.message);
				next(error);
			}
		};
	}

	/**
	 * ========================================
	 * ENDPOINT: Sync All Types
	 * ========================================
	 *
	 * Trigger sinkronisasi SEMUA sync types sekaligus.
	 * Useful untuk initial sync atau bulk refresh.
	 *
	 * Method: POST
	 * Route: /dashboard/sync-all
	 *
	 * ALUR:
	 * 1. Sync jadwal dokter
	 * 2. Sync booking pasien
	 * 3. Combine results
	 *
	 * Response:
	 * ```
	 * {
	 *   meta_data: { status: 200, message: "..." },
	 *   data: {
	 *     jadwalDokter: { inserted: 50, updated: 30, ... },
	 *     bookingPasien: { inserted: 200, updated: 88, ... }
	 *   }
	 * }
	 * ```
	 */
	static triggerSyncAll() {
		return async (req, res, next) => {
			try {
				console.log("[DashboardController] Trigger manual sync: ALL TYPES");

				// -------------------------------------
				// Sync Semua Types Secara Parallel
				// -------------------------------------
				// Menggunakan Promise.all agar lebih cepat
				// (tidak sequential, tapi parallel)
				const [jadwalResult, bookingResult] = await Promise.all([JadwalSyncService.syncJadwalDokter(), BookingSyncService.syncBooking()]);

				// Format Response
				res.status(200).json({
					meta_data: {
						status: 200,
						message: "Sinkronisasi semua data berhasil dijalankan.",
					},
					data: {
						jadwalDokter: jadwalResult,
						bookingPasien: bookingResult,
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
