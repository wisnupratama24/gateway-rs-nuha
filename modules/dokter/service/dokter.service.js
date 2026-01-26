const moment = require("moment");
const ExternalService = require("../../../helpers/external_service/ExternalServiceHelper");
const { CLIENT_1 } = require("../../../config/redis");
const { EXTERNAL_API_URL, EXTERNAL_API_BASE_URL, EXTERNAL_API_TOKEN, EXTERNAL_API_KEY, EXTERNAL_REFRESH_TOKEN } = require("../../../helpers/env/envConfig");
class DokterService {
	static async getJadwalDokterService(params) {
		try {
			const url = `${EXTERNAL_API_URL}${EXTERNAL_API_BASE_URL}`;

			let getToken = await this.getToken();

			// Konfigurasi Header (Token & API Key)
			const headers = {
				"Content-Type": "application/json",
				token: getToken.data_token.token,
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

	static async getToken() {
		const url = `${EXTERNAL_API_URL}/v3/view/view-table/refresh-token-access`;

		let data_token = {
			token: "",
			refresh_token: "",
		};

		let cache_baru = await CLIENT_1.get(`open_api_token`);

		if (cache_baru) {
			data_token.token = JSON.parse(cache_baru).token;
			data_token.refresh_token = JSON.parse(cache_baru).refresh_token;

			return { data_token };
		} else {
			const headers = {
				"Content-Type": "application/json",
				token: EXTERNAL_API_TOKEN,
				refresh_token: EXTERNAL_REFRESH_TOKEN,
				"x-api-key": EXTERNAL_API_KEY,
			};

			const response = await ExternalService.post({ url: url, headers: headers });

			data_token.token = response.data.token;
			data_token.refresh_token = response.data.refresh_token;

			await CLIENT_1.set(`open_api_token`, JSON.stringify({ token: data_token.token, refresh_token: data_token.refresh_token }, null, 2), { EX: 43200 }); // 12 jam

			return { data_token };
		}
	}
}

module.exports = DokterService;
