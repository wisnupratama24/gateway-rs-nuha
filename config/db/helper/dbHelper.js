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

exports.queryReplacement = async (querystring, replacements = {}) => {
	try {
		return await DB.query(querystring, {
			replacements,
			type: QueryTypes.RAW,
		});
	} catch (error) {
		throw error;
	}
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
	try {
		await transaction.commit();
	} catch (error) {
		throw error;
	}
};

exports.rollbackTransaction = async (transaction) => {
	try {
		await transaction.rollback();
	} catch (error) {
		throw error;
	}
};
