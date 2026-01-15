const { errorServer, error404, error204, error403, error400, error401 } = require("../../helpers/response/responseHelper");
const { DataDuplicateError, ValidationError, ForbiddenError, UnauthorizedError, RequiredError, DataNotFoundError, ErrorInFunction, axiosErrorHelper } = require("../../helpers/error");
const { APP_AREA, APP_ENV } = require("../../helpers/env/env.config");
async function ErrorHandler(error, req, res, next) {
	if (error && !res.headerSent) {
		console.log(error);
		if (APP_ENV === "PROD" && APP_AREA === "SERVER") {
			console.error = function () {};
			console.log = function () {};
		}

		if (error.name === "SequelizeDatabaseError" || error.name === "SequelizeValidationError") {
			let data_error = errorServer({ error });
			return res.status(500).json(data_error);
		} else if (error instanceof ValidationError) {
			let data_error = error400({ message: error.message, error: error?.data });
			return res.status(400).json(data_error); // 400 Bad Request
		} else if (error instanceof DataNotFoundError) {
			let data_error = error404({ message: error.message });
			return res.status(404).json(data_error); // 404 Not Found
		} else if (error instanceof DataDuplicateError) {
			let data_error = error204({ message: error.message });
			return res.status(409).json(data_error); // 409 Conflict
		} else if (error instanceof UnauthorizedError) {
			let data_error = error401({ message: error.message, error: error?.data });
			return res.status(401).json(data_error); // 401 Unauthorized
		} else if (error instanceof ForbiddenError) {
			let data_error = error403({ message: error.message, error: error?.data });
			return res.status(403).json(data_error); // 403 Forbidden
		} else if (error instanceof RequiredError) {
			let data_error = error403({ message: error.message, error: error?.data });
			return res.status(400).json(data_error); // 400 Bad Request
		} else if (error instanceof ErrorInFunction) {
			let data_error = error400({ message: error.message, error: error?.data });
			return res.status(400).json(data_error); // 400 Bad Request
		} else if (error instanceof axiosErrorHelper) {
			return res.status(400).json(error400({ message: error.message, error: error?.data })); // 400 Bad Request
		} else {
			return res.status(500).json(errorServer({ error }));
		}
	} else {
		next();
	}
}

module.exports = ErrorHandler;
