const { Sequelize } = require("sequelize");
const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = require("../../helpers/env/envConfig");

const DB = new Sequelize({
	pool: {
		max: 1000,
		min: 0,
		idle: 200000,
		acquire: 1000000,
	},
	database: DB_NAME,
	username: DB_USER,
	password: DB_PASS,
	host: DB_HOST,
	port: DB_PORT,
	dialect: "postgres",
	logging: false,
});

module.exports = { DB };
