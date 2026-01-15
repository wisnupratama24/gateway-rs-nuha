const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findRsById = async function ({ id_ms_rumah_sakit }) {
	return await new Promise((resolve, reject) => {
		if (!id_ms_rumah_sakit) {
			return reject(new RequiredError({ message: "Id ms rumah sakit dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_rumah_sakit where "deletedAt" is null and id_ms_rumah_sakit = ${id_ms_rumah_sakit}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findRsByKode = async function ({ kode_rs }) {
	return await new Promise((resolve, reject) => {
		if (!kode_rs) {
			return reject(new RequiredError({ message: "Kode Rs dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_rumah_sakit where "deletedAt" is null and kode_rs = '${kode_rs}'`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
