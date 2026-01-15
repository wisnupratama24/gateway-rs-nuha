const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");

const ms_endpoint = DB.define(
	"ms_endpoint",
	{
		id_ms_endpoint: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		method: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isIn: [["GET", "POST", "PUT", "DELETE", "PATCH"]],
			},
		},
		tipe_pengirim: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				isIn: [[1, 2]],
			},
		},
		endpoint: {
			type: DataTypes.TEXT,
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
		...DEFAULT_FIELDS_MODEL,
	},
	{
		schema: "master",
		freezeTableName: true,
		paranoid: true,
	},
);

// ms_endpoint.sync({ alter: true });

module.exports = ms_endpoint;
