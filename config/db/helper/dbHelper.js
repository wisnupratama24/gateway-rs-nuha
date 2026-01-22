const { QueryTypes } = require("sequelize");
const { DB } = require("../index");

exports.executeSelectQuery = async (querystring) => {
	try {
		const result = await DB.query(querystring, { type: QueryTypes.SELECT });
		return result;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

exports.queryReplacement = async (querystring, replacements = {}, transaction = null) => {
	return DB.query(querystring, {
		replacements,
		type: QueryTypes.RAW,
		transaction,
	});
};

exports.queryRawReplace = async (querystring, replacements = {}) => {
	let rawQuery = querystring;
	for (const key in replacements) {
		const value = replacements[key];
		const regex = new RegExp(`:${key}`, "g");
		rawQuery = rawQuery.replace(regex, typeof value === "string" ? `'${value}'` : value);
	}
	return rawQuery;
};

exports.executeQueryRaw = async (querystring, { transaction }) => {
	try {
		const result = await DB.query(querystring, { type: QueryTypes.RAW, transaction });
		return result;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

exports.startTransaction = async () => {
	return DB.transaction();
};

exports.commitTransaction = async (transaction) => {
	await transaction.commit();
};

exports.rollbackTransaction = async (transaction) => {
	await transaction.rollback();
};
