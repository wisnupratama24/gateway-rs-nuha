const { body, param, query, validationResult } = require("express-validator");
const { ValidationError } = require("../../helpers/error");

/**
 * Middleware wrapper untuk express-validator
 * Mengintegrasikan dengan ValidationError yang sudah ada
 */
const validate = (validations) => {
	return async (req, res, next) => {
		// Run all validations
		await Promise.all(validations.map((validation) => validation.run(req)));

		// Check for errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((err) => ({
				field: err.path || err.param,
				message: err.msg,
				value: err.value,
			}));
			return next(new ValidationError({ message: "Validation failed", data: errorMessages }));
		}

		next();
	};
};

module.exports = {
	validate,
	body,
	param,
	query,
};
