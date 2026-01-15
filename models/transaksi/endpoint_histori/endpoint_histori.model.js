const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");

const endpoint_histori = DB.define(
	"endpoint_histori",
	{
		id_endpoint_histori: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		id_ms_endpoint: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		tipe_pengirim: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				isIn: [[1, 2]],
			},
		},
		kode_pengirim: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		request: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		response: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		status: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		...DEFAULT_FIELDS_MODEL,
	},
	{
		schema: "transaksi",
		freezeTableName: true,
		paranoid: true,
	},
);

// endpoint_histori.sync({ alter: true });

module.exports = endpoint_histori;
