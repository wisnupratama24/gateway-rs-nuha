const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");

const ms_users = DB.define(
	"ms_users",
	{
		id_ms_users: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		email: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		password: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		status: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		nama_lengkap: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		tanggal_kadaluarsa_password: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		tipe: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				isIn: [[1, 2, 3]], // Validation for 'tipe' to only allow 1, 2, or 3
			},
			//1 rs, 2 klinik, 3 web
		},
		kode_pengirim: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		nomor_hp: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		keterangan: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		...DEFAULT_FIELDS_MODEL,
	},
	{
		schema: "master",
		freezeTableName: true,
		paranoid: true,
	},
);

// ms_users.sync({ alter: true });

module.exports = ms_users;
