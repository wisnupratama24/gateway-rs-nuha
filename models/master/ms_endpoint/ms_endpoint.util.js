const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findEndpoint = async function ({ endpoint, method, tipe_pengirim }) {
	return await new Promise((resolve, reject) => {
		if (!endpoint) {
			return reject(new RequiredError({ message: "Endpoint value dibutuhkan" }));
		} else if (!method) {
			return reject(new RequiredError({ message: "Method value dibutuhkan" }));
		} else if (!tipe_pengirim) {
			return reject(new RequiredError({ message: "Tipe pengirim value dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_endpoint where "deletedAt" is null and endpoint = '${endpoint}' and method = '${method}' and tipe_pengirim = ${tipe_pengirim}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findById = async function ({ id_ms_endpoint }) {
	return await new Promise((resolve, reject) => {
		if (!id_ms_endpoint) {
			return reject(new RequiredError({ message: "id_ms_endpoint value dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_endpoint where "deletedAt" is null and id_ms_endpoint = ${id_ms_endpoint}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
