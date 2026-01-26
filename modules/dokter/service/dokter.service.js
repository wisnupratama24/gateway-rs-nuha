const moment = require("moment");
const ExternalService = require("../../../helpers/external_service/externalServiceHelper");
const { EXTERNAL_API_URL, EXTERNAL_API_BASE_URL, EXTERNAL_API_TOKEN, EXTERNAL_API_KEY } = require("../../../helpers/env/envConfig");
class DokterService {
	static async getJadwalDokterService(params) {
		try {
			const url = `${EXTERNAL_API_URL}${EXTERNAL_API_BASE_URL}`;
			// Konfigurasi Header (Token & API Key)
			const headers = {
				"Content-Type": "application/json",
				token: EXTERNAL_API_TOKEN,
				"x-api-key": EXTERNAL_API_KEY,
			};

			const filter_tanggal_awal = moment.utc(params.tanggal_awal, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DD[T]HH:mm:ssZ");
			const filter_tanggal_akhir = moment.utc(params.tanggal_akhir, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DD[T]HH:mm:ssZ");

			// Body Request
			const body = {
				id_laporan_view: params.id_laporan_view, // ID Laporan Tetap untuk Jadwal Dokter
				pages: params.pages || 1,
				limit: params.limit || 10,
				// Gunakan nama field sesuai cURL yang valid
				filter_tanggal_awal: filter_tanggal_awal,
				filter_tanggal_akhir: filter_tanggal_akhir,
				id_dokter: parseInt(params.id_dokter) || null,
				kode_spesialis: params.kode_spesialis || null,
			};

			const response = await ExternalService.post({ url, body, headers });

			return { data: response.data, meta_data: response.meta_data }; // Return full x	response { data, meta_data }
		} catch (error) {
			// console.log(error);
			console.error("Error fetching external data:", error.message);
			// Lempar error agar bisa dihandle service
			throw new Error("Gagal mengambil data dari API Eksternal. Cek koneksi atau token.");
		}
	}
}

module.exports = DokterService;
