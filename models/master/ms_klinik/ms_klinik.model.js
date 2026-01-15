const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");
const { KEY_ENCRYPT } = require("../../../helpers/env/env.config");

const ms_klinik = DB.define(
	"ms_klinik",
	{
		id_ms_klinik: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		kode_klinik: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		nama_klinik: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		keterangan: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		secret_key: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: KEY_ENCRYPT,
		},
		time_secret_key: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		...DEFAULT_FIELDS_MODEL,
	},
	{
		schema: "master",
		freezeTableName: true,
		paranoid: true,
	},
);

// ms_klinik.sync({ alter: true });

module.exports = ms_klinik;
