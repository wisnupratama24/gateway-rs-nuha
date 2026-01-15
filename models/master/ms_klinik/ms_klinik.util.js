const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findKlinikById = async function ({ id_ms_klinik }) {
	return await new Promise((resolve, reject) => {
		if (!id_ms_klinik) {
			return reject(new RequiredError({ message: "Id ms klinik dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_klinik where "deletedAt" is null and id_ms_klinik = ${id_ms_klinik}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findKlinikByKode = async function ({ kode_klinik }) {
	return await new Promise((resolve, reject) => {
		if (!kode_klinik) {
			return reject(new RequiredError({ message: "Kode klinik dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_klinik where "deletedAt" is null and kode_klinik = '${kode_klinik}'`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findManyKlinikByKode = async function ({ kode_klinik }) {
	return await new Promise((resolve, reject) => {
		if (!kode_klinik.length) {
			return reject(new RequiredError({ message: "Kode klinik dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from master.ms_klinik where "deletedAt" is null and kode_klinik in (${kode_klinik.map((item) => `'${item}'`).join(",")})`)
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
