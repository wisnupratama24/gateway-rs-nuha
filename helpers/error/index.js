const DataDuplicateError = require("./dataDuplicateErrorHelper");
const ValidationError = require("./validationErrorHelper");
const ForbiddenError = require("./forbiddenErrorHelper");
const UnauthorizedError = require("./unauthorizedErrorHelper");
const RequiredError = require("./requiredErrorHelper");
const DataNotFoundError = require("./dataNotFoundErrorHelper");
const ErrorInFunction = require("./errorInFunctionErrorHelper");
const axiosErrorHelper = require("./axiosErrorHelper");

module.exports = {
	DataDuplicateError,
	ValidationError,
	ForbiddenError,
	UnauthorizedError,
	RequiredError,
	DataNotFoundError,
	ErrorInFunction,
	axiosErrorHelper,
};
