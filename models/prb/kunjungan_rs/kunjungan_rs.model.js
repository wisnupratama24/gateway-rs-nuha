const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");

const kunjungan_rs = DB.define(
	"kunjungan_rs",
	{
		id_kunjungan_rs: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		kode_rs: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		kode_klinik: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		id_kunjungan_pasien: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		tanggal_kunjungan_pasien: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		nik_pasien: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		nama_pasien: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		norm_pasien: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		tanggal_lahir_pasien: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		alamat_pasien: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		email_pasien: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		kode_diagnosa_prb: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		nama_diagnosa_prb: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		id_dokter_dpjp: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		kode_bridge_dokter_dpjp: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		nama_dokter_dpjp: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		keterangan: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		saran: {
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

// kunjungan_rs.sync({ alter: true });
//terdapat partitions by kode klinik, cek public.list_partitions

module.exports = kunjungan_rs;
