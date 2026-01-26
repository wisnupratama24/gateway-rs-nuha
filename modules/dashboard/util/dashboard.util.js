const axios = require("axios");
const { EXTERNAL_API_URL, EXTERNAL_API_TOKEN, EXTERNAL_API_KEY } = require("../../../helpers/env/env.config");

/**
 * ========================================
 * DASHBOARD UTILITY (Refactored)
 * ========================================
 *
 * Utility untuk mengambil data dari API Eksternal.
 * Mendukung multiple sync types dengan dynamic parameters.
 *
 * Perubahan dari versi sebelumnya:
 * - id_laporan_view sekarang dynamic (tidak hardcode)
 * - Date field names flexible (menggunakan spread operator)
 * - Support semua jenis filter dari sync config
 */
class DashboardUtil {
	/**
	 * ========================================
	 * METHOD: Fetch Data from External API
	 * ========================================
	 *
	 * Mengambil data dari eksternal API dengan pagination.
	 * Method ini sekarang generic dan bisa digunakan oleh semua sync types.
	 *
	 * PERUBAHAN PENTING:
	 * - Sebelumnya: id_laporan_view hardcode (123)
	 * - Sekarang: id_laporan_view dynamic dari params
	 *
	 * CARA PAKAI (Contoh dari BaseSyncService):
	 * ```
	 * const response = await DashboardUtil.fetchDataFromExternal({
	 *     id_laporan_view: 123,  // atau 239, atau sync type lainnya
	 *     pages: 1,
	 *     limit: 10,
	 *     filter_tanggal_awal: "2026-01-01T00:00:00+00:00",  // untuk jadwal
	 *     filter_tanggal_akhir: "2026-01-15T23:59:59+00:00", // untuk jadwal
	 *     // ATAU
	 *     waktu_registrasi_awal: "2026-01-01T00:00:00+00:00",  // untuk booking
	 *     waktu_registrasi_akhir: "2026-01-15T23:59:59+00:00"  // untuk booking
	 * });
	 * ```
	 *
	 * @param {Object} params - Parameter filter (dynamic based on sync type)
	 * @param {number} params.id_laporan_view - ID Laporan di API (123, 239, dll)
	 * @param {number} params.pages - Halaman yang ingin diambil
	 * @param {number} params.limit - Jumlah record per halaman
	 * @param {*} params.* - Other params (flexible: date fields, filters, dll)
	 * @returns {Object} Response data dari API (termasuk meta_data)
	 */
	static async fetchDataFromExternal(params) {
		try {
			const url = `${EXTERNAL_API_URL}/v3/view/view-table/list-filter-access`;

			// -------------------------------------
			// STEP 1: Setup HTTP Headers
			// -------------------------------------
			const config = {
				headers: {
					"Content-Type": "application/json",
					token: EXTERNAL_API_TOKEN,
					"x-api-key": EXTERNAL_API_KEY,
				},
			};

			// -------------------------------------
			// STEP 2: Build Request Body (Dynamic)
			// -------------------------------------
			// Menggunakan spread operator agar bisa terima semua params
			// Ini membuat util flexible untuk berbagai sync types
			const body = {
				// Pagination (wajib)
				pages: params.pages || 1,
				limit: params.limit || 10,

				// Spread remaining params (date fields, filters, dll)
				// Ini akan include semua params yang dikirim dari BaseSyncService
				// Contoh: filter_tanggal_awal, waktu_registrasi_awal, dll
				...params,

				// Default filters (opsional)
				id_dokter: params.id_dokter || null,
				kode_spesialis: params.kode_spesialis || null,
			};

			// -------------------------------------
			// STEP 3: HTTP POST Request
			// -------------------------------------
			const response = await axios.post(url, body, config);

			// Return full response (data + meta_data)
			return response.data;
		} catch (error) {
			// -------------------------------------
			// ERROR HANDLING
			// -------------------------------------
			console.error("[DashboardUtil] Error fetching external data:", error.message);

			// Re-throw dengan pesan yang jelas untuk debugging
			throw new Error("Gagal mengambil data dari API Eksternal. Cek koneksi atau token.");
		}
	}
}

module.exports = DashboardUtil;
