const modelUser = require("../../../../models/master/ms_users/ms_users.model");
const dbHelper = require("../../../../config/db/helper/dbHelper");
const userUtil = require("../util/users.util");
const msUserUtil = require("../../../../models/master/ms_users/ms_users.util");
const encryptPassword = require("../../../../helpers/others/password");
const { DataDuplicateError, DataNotFoundError, ForbiddenError } = require("../../../../helpers/error");
const crudOperation = require("../../../../helpers/models/crudOperationHelper");
const { MAX_PASSWORD_DAYS, KEY_ENCRYPT } = require("../../../../helpers/env/env.config");
const moment = require("moment");
const { findRsByKode } = require("../../../../models/master/ms_rumah_sakit/ms_rumah_sakit.util");
const { findKlinikByKode } = require("../../../../models/master/ms_klinik/ms_klinik.util");
class UserService {
	static async getAllUsersService({ sort_key, sort_by, limit, offset, where = "" }) {
		try {
			return await Promise.all([
				dbHelper.executeSelectQuery(
					`select id_ms_users, nama_lengkap, status, email, nomor_hp, tipe, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy", "createdCode", "updatedCode", "deletedCode" from master.ms_users ${where} order by ${sort_key} ${sort_by} limit ${limit} offset ${offset}`,
				),
				dbHelper.executeSelectQuery(`select count(id_ms_users) from master.ms_users ${where}`),
			]);
		} catch (error) {
			throw error;
		}
	}

	static async getResourceUsersService({ limit, where = "" }) {
		try {
			let query = `select id_ms_users as value, nama_lengkap as label from master.ms_users ${where} `;

			if (limit) {
				query += `limit ${limit}`;
			}

			return await Promise.all([dbHelper.executeSelectQuery(query)]);
		} catch (error) {
			throw error;
		}
	}

	static async createUsersService({ req, nama_lengkap, email, password, status, transaction, nomor_hp, tipe, kode_pengirim, keterangan }) {
		try {
			const [emailExist, nameExist] = await Promise.all([userUtil.findDuplicateUserByParam({ email }), userUtil.findDuplicateUserByParam({ nama_lengkap })]);

			if (emailExist.length) {
				throw new DataDuplicateError({ statusCode: 400, message: "Email sudah terdaftar!" });
			} else if (nameExist.length) {
				throw new DataDuplicateError({ statusCode: 400, message: "Nama lengkap sudah terdaftar!" });
			} else {
				const passwordEncrypt = await encryptPassword.generatePassword({ password });
				const tanggal_kadaluarsa_password = moment().add(parseInt(MAX_PASSWORD_DAYS) ?? 180, "days");
				let data = { nama_lengkap, email, password: passwordEncrypt, status, nomor_hp, tanggal_kadaluarsa_password, tipe, kode_pengirim, keterangan };
				return await crudOperation.create({ req, data, transaction, model: modelUser });
			}
		} catch (error) {
			throw error;
		}
	}

	static async updateUsersService({ req, nama_lengkap, email, status, transaction, nomor_hp, id_ms_users, tipe, kode_pengirim, keterangan }) {
		try {
			const [emailExist, nameExist, findId] = await Promise.all([
				userUtil.findDuplicateUserByParam({ email, id_ms_users }),
				userUtil.findDuplicateUserByParam({ nama_lengkap, id_ms_users }),
				msUserUtil.findUserById({ id_ms_users }),
			]);

			if (emailExist.length) {
				throw new DataDuplicateError({ statusCode: 400, message: "Email sudah terdaftar!" });
			} else if (nameExist.length) {
				throw new DataDuplicateError({ statusCode: 400, message: "Nama lengkap sudah terdaftar!" });
			} else if (!findId) {
				throw new DataNotFoundError({ message: "User tidak ditemukan!" });
			} else {
				let data = { nama_lengkap, email, status, nomor_hp, tipe, kode_pengirim, keterangan };
				return await crudOperation.update({ req, data, transaction, model: modelUser, where: { id_ms_users } });
			}
		} catch (error) {
			throw error;
		}
	}

	static async deleteUsersService({ req, id_ms_users, transaction }) {
		try {
			const usersExist = await msUserUtil.findUserById({ id_ms_users });
			if (!usersExist) {
				throw new DataNotFoundError({ message: "User tidak ditemukan!", data: null });
			} else {
				return await crudOperation.delete({ req, transaction, model: modelUser, where: { id_ms_users } });
			}
		} catch (error) {
			throw error;
		}
	}

	static async loginUsersService({ email, password, tipe }) {
		try {
			const dataUsers = await userUtil.findDuplicateUserByParam({ email, status: true });
			let secret_key = KEY_ENCRYPT;
			let time_secret_key = moment().add(parseInt(MAX_PASSWORD_DAYS) ?? 180, "days");
			if (dataUsers.length !== 1) {
				throw new DataNotFoundError({ message: "User tidak ditemukan!", data: null });
			} else if (tipe && dataUsers[0].tipe !== tipe) {
				throw new ForbiddenError({ message: "Login tidak sesuai dengan tipe user admin!", data: null });
			} else if ((await encryptPassword.comparePassword({ password, hashed: dataUsers[0].password })) === false) {
				throw new ForbiddenError({ message: "Password salah!", data: null });
			} else {
				if (dataUsers[0].tipe === 1) {
					const findRs = await findRsByKode({ kode_rs: dataUsers[0].kode_pengirim });
					if (!findRs) {
						throw new ForbiddenError({ message: "Master Rs tidak aktif!", data: null });
					} else {
						secret_key = findRs.secret_key;
						time_secret_key = findRs.time_secret_key;
					}
				} else if (dataUsers[0].tipe === 2) {
					const findKlinik = await findKlinikByKode({ kode_klinik: dataUsers[0].kode_pengirim });
					if (!findKlinik) {
						throw new ForbiddenError({ message: "Master Klinik tidak aktif!", data: null });
					} else {
						secret_key = findKlinik.secret_key;
						time_secret_key = findKlinik.time_secret_key;
					}
				}

				// Check if password is expired
				const isPasswordExpired = moment().isAfter(moment(dataUsers[0].tanggal_kadaluarsa_password));
				if (isPasswordExpired) {
					throw new ForbiddenError({ message: "Password telah kadaluarsa, harap reset password!", data: null });
				}

				return { ...dataUsers[0], secret_key, time_secret_key };
			}
		} catch (error) {
			console.log(error);
			throw error;
		}
	}

	static async updatePasswordUsersService({ req, is_admin, id_ms_users, password, old_password }) {
		try {
			const [findId] = await Promise.all([msUserUtil.findUserById({ id_ms_users })]);

			const new_password = await encryptPassword.generatePassword({ password });

			if (!findId) {
				throw new DataNotFoundError({ message: "User tidak ditemukan!" });
			} else {
				if (!is_admin) {
					const validation = await encryptPassword.comparePassword({ old_password, hashed: findId.password });
					if (!validation) {
						throw new ForbiddenError({ message: "Password lama salah!", data: null });
					}
				}

				const tanggal_kadaluarsa_password = moment().add(parseInt(MAX_PASSWORD_DAYS) ?? 180, "days");

				let data = { password: new_password, tanggal_kadaluarsa_password };
				return await crudOperation.update({ req, data, model: modelUser, where: { id_ms_users } });
			}
		} catch (error) {
			throw error;
		}
	}
}

module.exports = UserService;
