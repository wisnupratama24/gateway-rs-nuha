const axios = require("axios");

class external_service {
	static async post({ url, body, headers, timeout = null }) {
		try {
			// Langsung await axios, karena axios sudah return Promise
			const result = await axios.post(url, body, { headers, timeout });

			return result.data;
		} catch (error) {
			console.log(error);
			console.log(`Hit ep selesai=============> axios errooorrrr`);

			throw {
				status: 400,
				message: "Gagal mengambil data dari API Eksternal.",
				error: error.message,
			};
		}
	}
}

module.exports = external_service;
