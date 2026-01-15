const modelUser = require("../../../../models/master/ms_users/ms_users.model");
const dbHelper = require("../../../../config/db/helper/dbHelper");
const userUtil = require("../util/users.util");
const encryptPassword = require("../../../../helpers/others/password");
const { DataDuplicateError } = require("../../../../helpers/error");
const crudOperation = require("../../../../helpers/models/crudOperationHelper");
const { MAX_PASSWORD_DAYS } = require("../../../../helpers/env/env.config");
const moment = require("moment");
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
}

module.exports = UserService;
