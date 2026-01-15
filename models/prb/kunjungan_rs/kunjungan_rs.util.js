const dbHelper = require("../../../config/db/helper/dbHelper");
const { RequiredError } = require("../../../helpers/error");

exports.findByIdAndKode = async function ({ id_kunjungan_rs, kode_rs }) {
	return await new Promise((resolve, reject) => {
		if (!id_kunjungan_rs) {
			return reject(new RequiredError({ message: "id_kunjungan_rs dibutuhkan" }));
		} else if (!kode_rs) {
			return reject(new RequiredError({ message: "kode_rs dibutuhkan" }));
		}
		dbHelper
			.executeSelectQuery(`select * from prb.kunjungan_rs where "deletedAt" is null and id_kunjungan_rs = ${id_kunjungan_rs} and kode_rs = '${kode_rs}' `)
			.then((data) => {
				resolve(data[0]);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
