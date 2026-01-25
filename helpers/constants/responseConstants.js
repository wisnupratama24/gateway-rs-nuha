exports.WORDING_RESPONSE = {
	BERHASIL: "Berhasil",
	TERBUAT: "Data Berhasil dibuat",
	SYSTEM_ERROR: "Internal Server Error!",
	DATA_TIDAK_DITEMUKAN: (data) => {
		return `Data ${data} Tidak ditemukan`;
	},
	DATA_SUDAH_DIGUNAKAN: (data) => {
		return `Data ${data} sudah digunakan`;
	},
	FORBIDDEN: (data) => {
		return `${data}`;
	},
};

exports.CODE_RESPONSE = {
	BERHASIL: 200,
	TERBUAT: 201,
	SYSTEM_ERROR: 500,
	DUPLIKAT: 204,
	DATA_TIDAK_DITEMUKAN: 202,
	ERROR_VALIDASI: 400,
	FORBIDDEN: 403,
	GAGAL_VALIDASI: 203,
	LIST_TIDAK_DITEMUKAN: 404,
	BAD_REQUEST: 400,
};

exports.StatusProses = {
	MENUNGGU: 0,
	PROSES: 1,
	SELESAI: 2,
	GAGAL: 3,
};

exports.StatusProsesString = {
	MENUNGGU: "Sedang menunggu untuk diproses",
	PROSES: "Sedang diproses",
	SELESAI: "Selesai diproses",
	GAGAL: "Gagal diproses, ",
};
