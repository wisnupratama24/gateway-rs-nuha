const CRUD_HELPER = require("./crudHelper");
const { ErrorInFunction } = require("../error");

exports.create = async ({ req, model, data, transaction }) => {
	return new Promise((resolve, reject) => {
		try {
			if (!model) {
				reject(new ErrorInFunction({ data: null, message: "Model Tidak Boleh Kosong" }));
			} else if (!data) {
				reject(new ErrorInFunction({ data: null, message: "Data Tidak Boleh Kosong" }));
			}
			const result = model.create(
				{
					...data,
					...CRUD_HELPER.helper_create(req),
				},
				{ transaction },
			);
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};

exports.bulkCreate = async ({ req, model, data, transaction, updateOnDuplicate, where, conflictWhere, conflictAttributes }) => {
	return new Promise((resolve, reject) => {
		try {
			// TODO update on duplicated
			let input = data.map((x) => {
				return {
					...x,
					...CRUD_HELPER.helper_create(req),
					...CRUD_HELPER.helper_update(req),
				};
			});

			if (!model) {
				reject(new ErrorInFunction({ data: null, message: "Model Tidak Boleh Kosong" }));
			} else if (!data.length) {
				// Pass through if array empty
				resolve();
			} else {
				const result = model.bulkCreate(input, {
					transaction,
					updateOnDuplicate,
					where,
					conflictWhere: conflictWhere,
					conflictAttributes: conflictAttributes,
				});
				resolve(result);
			}
		} catch (error) {
			reject(error);
		}
	});
};

exports.update = async ({ req, model, data, where, transaction }) => {
	return new Promise((resolve, reject) => {
		try {
			if (!where) {
				reject(ErrorInFunction({ data: null, message: "Where Tidak Boleh Kosong" }));
			} else if (!model) {
				reject(new ErrorInFunction({ data: null, message: "Model Tidak Boleh Kosong" }));
			} else if (!data) {
				reject(new ErrorInFunction({ data: null, message: "Data Tidak Boleh Kosong" }));
			}
			const result = model.update(
				{
					...data,
					...CRUD_HELPER.helper_update(req),
				},
				{
					where: { ...where },
					returning: true,
					transaction,
				},
			);
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};

exports.delete = async ({ req, model, where, transaction }) => {
	return new Promise((resolve, reject) => {
		try {
			if (!where) {
				reject(ErrorInFunction({ data: null, message: "Where Tidak Boleh Kosong" }));
			} else if (!model) {
				reject(new ErrorInFunction({ data: null, message: "Model Tidak Boleh Kosong" }));
			}
			const result = model.update(
				{
					...CRUD_HELPER.helper_delete(req),
				},
				{
					where: { ...where },
					transaction,
					returning: true,
				},
			);
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};

exports.hard_delete = async ({ model, where, transaction }) => {
	return new Promise((resolve, reject) => {
		try {
			if (!where) {
				reject(ErrorInFunction({ data: null, message: "Where Tidak Boleh Kosong" }));
			} else if (!model) {
				reject(ErrorInFunction({ data: null, message: "Model Tidak Boleh Kosong" }));
			}
			const result = model.destroy({
				where: { ...where },
				transaction,
				returning: true,
			});
			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
};
