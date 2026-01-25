const authRegular = require("./authRegular");

async function authHandler(req, res, next) {
	try {
		if (res.headersSent) {
			// If headers have already been sent, just call the next middleware
			return next();
		} else {
			await authRegular.authRegularHandler(req, res, next);
		}
	} catch (error) {
		next(error);
	}
}

module.exports = authHandler;
