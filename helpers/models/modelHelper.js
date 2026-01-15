const { DataTypes } = require("sequelize");

exports.DEFAULT_FIELDS_MODEL = {
	createdBy: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	createdName: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	createdCode: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	updatedBy: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	updatedName: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	updatedCode: {
		type: DataTypes.STRING,
		allowNull: true,
	},

	deletedBy: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	deletedName: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	deletedCode: {
		type: DataTypes.STRING,
		allowNull: true,
	},
};
