const DashboardService = require("../service/dashboard.service");

/**
 * Controller untuk Modul Dashboard.
 * Menghubungkan Request HTTP dengan Service Layer.
 */
class DashboardController {
	/**
	 * Endpoint untuk memicu sinkronisasi manual.
	 * POST /v3/dashboard/sync
	 */
	static triggerSync() {
		return async (req, res, next) => {
			try {
				// Panggil Service Sync
				const result = await DashboardService.syncData();

				// Format Response
				res.status(200).json({
					meta_data: {
						status: 200,
						message: "Sinkronisasi data berhasil dijalankan.",
					},
					data: result,
				});
			} catch (error) {
				console.error("[DashboardController] Error in triggerSync:", error.message);
				next(error);
			}
		};
	}

	/**
	 * Endpoint untuk mengambil data statistik dashboard.
	 * GET /v3/dashboard/stats
	 */
	static getDashboardData() {
		return async (req, res, next) => {
			try {
				const { tanggal } = req.query;
				if (tanggal) {
					console.log(`[Dashboard] Mengambil data untuk tanggal: ${tanggal}`);
				}
				// Ambil Data Statistik
				const stats = await DashboardService.getDashboardStats(tanggal);

				// Format Response menggunakan Helper
				// successData(response, data, message, statusCode)
				// Kita manual saja biar sesuai format JSON user
				res.status(200).json(stats);
			} catch (error) {
				next(error);
			}
		};
	}
}

module.exports = DashboardController;
