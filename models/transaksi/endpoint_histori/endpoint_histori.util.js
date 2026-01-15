const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findByParam = async function ({ id_ms_endpoint, kode_pengirim, tipe_pengirim }) {
	return await new Promise((resolve, reject) => {
		let where = "";

		if (id_ms_endpoint) {
			where += ` and id_ms_endpoint = ${id_ms_endpoint} `;
		}

		if (kode_pengirim) {
			where += ` and kode_pengirim = '${kode_pengirim}' `;
		}

		if (tipe_pengirim) {
			where += ` and tipe_pengirim = ${tipe_pengirim} `;
		}

		dbHelper
			.executeSelectQuery(`select * from public.endpoint_histori where "deletedAt" is null ${where}`)
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findById = async function ({ id_endpoint_histori }) {
	return await new Promise((resolve, reject) => {
		if (!id_endpoint_histori) {
			return reject(new RequiredError({ message: "id_endpoint_histori value dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from public.endpoint_histori where "deletedAt" is null and id_endpoint_histori = ${id_endpoint_histori}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
