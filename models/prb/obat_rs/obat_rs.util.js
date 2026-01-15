const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findById = async function ({ id_obat_rs }) {
	return await new Promise((resolve, reject) => {
		if (!id_obat_rs) {
			return reject(new RequiredError({ message: "id_obat_rs dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from prb.obat_rs where "deletedAt" is null and id_obat_rs = ${id_obat_rs}`)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

exports.findByIdKunjunganRs = async function ({ id_kunjungan_rs, limit, pages, kode_rs, kode_klinik }) {
	return await new Promise((resolve, reject) => {
		let query = `SELECT obat.*
		FROM prb.obat_rs obat
		LEFT JOIN prb.kunjungan_rs kr 
		ON kr.id_kunjungan_rs = obat.id_kunjungan_rs 
		AND kr."deletedAt" IS NULL
		WHERE obat."deletedAt" IS NULL 
		AND obat.id_kunjungan_rs = ${id_kunjungan_rs}`;
		if (!id_kunjungan_rs) {
			return reject(new RequiredError({ message: "id_kunjungan_rs dibutuhkan" }));
		}

		if (kode_rs) {
			query += `and kr.kode_rs = '${kode_rs}' `;
		}

		if (kode_klinik) {
			query += `and kr.kode_klinik = '${kode_klinik}' `;
		}

		let offset = 0;
		if (pages && limit) {
			offset = (pages - 1) * limit;
			query += `limit ${limit} offset ${offset}`;
		}
		dbHelper
			.executeSelectQuery(query)
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
