const axios = require("axios");

class ExternalService {
	static async post({ url, body, headers, timeout = null }) {
		try {
			// Langsung await axios, karena axios sudah return Promise
			const result = await axios.post(url, body, { headers, timeout });
			console.log(result);
			return result.data;
		} catch (error) {
			console.log(error);
			throw {
				status: 400,
				message: "Gagal mengambil data dari API Eksternal.",
				error: error.message,
			};
		}
	}
}

module.exports = ExternalService;
