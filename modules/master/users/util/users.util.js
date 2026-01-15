const dbHelper = require("../../../../config/db/helper/dbHelper");

class userUtil {
	static async findDuplicateUserByParam({ nama_lengkap, email, status, nomor_hp, id_ms_users }) {
		return await new Promise((resolve, reject) => {
			let where = "";
			if (nama_lengkap) {
				where += ` and nama_lengkap ='${nama_lengkap}' `;
			}

			if (nomor_hp) {
				where += ` and nomor_hp ='${nomor_hp}' `;
			}

			if (email) {
				where += ` and email ='${email}' `;
			}

			if (id_ms_users) {
				where += ` and id_ms_users != ${id_ms_users} `;
			}

			if (status === true) {
				where += ` and status is true `;
			} else if (status === false) {
				where += ` and status is false `;
			}

			dbHelper
				.executeSelectQuery(`select * from master.ms_users where "deletedAt" is null  ${where} `)
				.then((data) => {
					resolve(data);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}
}

module.exports = userUtil;
