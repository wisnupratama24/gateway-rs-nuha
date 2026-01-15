const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");

const obat_rs = DB.define(
	"obat_rs",
	{
		id_obat_rs: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		id_kunjungan_rs: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		id_obat: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		nama_obat: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		signa_1: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		signa_2: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		jumlah_obat: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		satuan_obat: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		kode_obat_bpjs: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		aturan_pakai: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		satuan_pakai: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		keterangan: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		status: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		...DEFAULT_FIELDS_MODEL,
	},
	{
		schema: "prb",
		freezeTableName: true,
		paranoid: true,
	},
);

// obat_rs.sync({ alter: true });

module.exports = obat_rs;
