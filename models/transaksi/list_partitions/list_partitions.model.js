const { DataTypes } = require("sequelize");
const { DB } = require("../../../config/db/index");
const { DEFAULT_FIELDS_MODEL } = require("../../../helpers/models/modelHelper");

const list_partitions = DB.define(
	"list_partitions",
	{
		id_list_partitions: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		schema: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		parent: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		fullname: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isIn: [["list", "range"]],
			},
		},
		is_monthly: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
		},
		is_yearly: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
		},
		column: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		value: {
			type: DataTypes.JSON,
			allowNull: false,
		},
		meta_data: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		...DEFAULT_FIELDS_MODEL,
	},
	{
		schema: "transaksi",
		freezeTableName: true,
		paranoid: true,
	},
);

// list_partitions.sync({ alter: true });

module.exports = list_partitions;
