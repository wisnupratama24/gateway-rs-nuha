const axios = require("axios");
const { EXTERNAL_API_URL, EXTERNAL_API_TOKEN, EXTERNAL_API_KEY } = require("../../../helpers/env/env.config");

/**
 * Utility untuk mengambil data dari API Eksternal.
 * (Workshop Gateway - Modul Dashboard)
 */
class DashboardUtil {
	/**
	 * Mengambil data jadwal dari eksternal API.
	 * Menggunakan pagination (pages & limit).
	 *
	 * @param {Object} params - Parameter filter { limit, pages, tanggal_awal, tanggal_akhir }
	 * @returns {Object} Response data dari API (termasuk meta_data)
	 */
	static async fetchDataFromExternal(params) {
		try {
			const url = `${EXTERNAL_API_URL}/v3/view/view-table/list-filter-access`;
			// Konfigurasi Header (Token & API Key)
			const config = {
				headers: {
					"Content-Type": "application/json",
					token: EXTERNAL_API_TOKEN,
					"x-api-key": EXTERNAL_API_KEY,
				},
			};

			// Body Request
			const body = {
				id_laporan_view: 123, // ID Laporan Tetap untuk Jadwal Dokter
				pages: params.pages || 1,
				limit: params.limit || 10,
				// Gunakan nama field sesuai cURL yang valid
				filter_tanggal_awal: params.tanggal_awal,
				filter_tanggal_akhir: params.tanggal_akhir,
				id_dokter: null,
				kode_spesialis: null,
			};

			const response = await axios.post(url, body, config);
			return response.data; // Return full x	response { data, meta_data }
		} catch (error) {
			console.error("[DashboardUtil] Error fetching external data:", error.message);
			// Lempar error agar bisa dihandle service
			throw new Error("Gagal mengambil data dari API Eksternal. Cek koneksi atau token.");
		}
	}
}

module.exports = DashboardUtil;
