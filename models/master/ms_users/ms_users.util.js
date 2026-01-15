const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findUserById = async function ({ id_ms_users }) {
	return await new Promise((resolve, reject) => {
		if (!id_ms_users) {
			return reject(new RequiredError({ message: "Id ms users dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_users where "deletedAt" is null and id_ms_users = ${id_ms_users}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findUserByKodeTipe = async function ({ tipe, kode_pengirim }) {
	return await new Promise((resolve, reject) => {
		if (!tipe) {
			return reject(new RequiredError({ message: "tipe dibutuhkan" }));
		}

		if (!kode_pengirim) {
			return reject(new RequiredError({ message: "kode pengirim dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_users where "deletedAt" is null and tipe = ${tipe} and kode_pengirim = '${kode_pengirim}'`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
