const CONSTANTS = require("../constants/responseConstants");

class FormatResponse {
	// 200
	static successList({ data, pages, count, limit, additionalData }) {
		// count = 0
		if (count === undefined || count === null) {
			count = "0";
		}
		count = parseInt(count);
		pages = parseInt(pages);
		limit = parseInt(limit);

		if (isNaN(pages)) pages = 0;
		if (isNaN(limit)) limit = 0;
		if (isNaN(count)) count = 0;

		return {
			data: {
				list: data,
				...additionalData,
				meta_data: {
					count,
					pages,
					limit,
				},
			},
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.BERHASIL,
				message: CONSTANTS.WORDING_RESPONSE.BERHASIL,
			},
		};
	}

	static successResource({ data }) {
		return {
			data,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.BERHASIL,
				message: CONSTANTS.WORDING_RESPONSE.BERHASIL,
			},
		};
	}

	static successObject({ data, additionalData }) {
		return {
			data,
			...additionalData,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.BERHASIL,
				message: CONSTANTS.WORDING_RESPONSE.BERHASIL,
			},
		};
	}

	static successUpdate(data, additionalData) {
		return {
			data,
			...additionalData,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.BERHASIL,
				message: "Berhasil mengubah data",
			},
		};
	}

	static successDelete({ data, additionalData }) {
		return {
			data,
			...additionalData,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.BERHASIL,
				message: "Berhasil menghapus data",
			},
		};
	}

	// 201
	static successCreate({ data, additionalData }) {
		return {
			data,
			...additionalData,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.TERBUAT,
				message: CONSTANTS.WORDING_RESPONSE.BERHASIL,
			},
		};
	}

	static errorServer({ error }) {
		return {
			data: null,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.SYSTEM_ERROR,
				message: error.message || CONSTANTS.WORDING_RESPONSE.SYSTEM_ERROR,
				error,
			},
		};
	}

	// TIDAK DITEMUKAN PRIMARY KEY
	static error404({ message }) {
		return {
			data: null,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.LIST_TIDAK_DITEMUKAN,
				message,
			},
		};
	}

	static error400({ message, error }) {
		return {
			data: null,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.BAD_REQUEST,
				message,
				error,
			},
		};
	}

	static error204({ message }) {
		return {
			data: null,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.DUPLIKAT,
				message,
			},
		};
	}

	static error203({ message, data }) {
		return {
			data,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.GAGAL_VALIDASI,
				message,
			},
		};
	}

	// TIDAK DITEMUKAN SECONDARY ATAU OPTIONAL KEY
	static error202({ message }) {
		return {
			data: null,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.DATA_TIDAK_DITEMUKAN,
				message,
			},
		};
	}

	static error403({ message, error }) {
		return {
			data: null,
			meta_data: {
				status: CONSTANTS.CODE_RESPONSE.FORBIDDEN,
				message,
				error,
			},
		};
	}

	static error401({ message, error }) {
		return {
			data: null,
			meta_data: {
				status: 401,
				message,
				error,
			},
		};
	}
}

module.exports = FormatResponse;
