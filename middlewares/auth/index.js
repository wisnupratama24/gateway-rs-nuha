const authReguler = require("./auth_reguler");

async function authHandler(req, res, next) {
	try {
		if (res.headersSent) {
			// If headers have already been sent, just call the next middleware
			return next();
		} else {
			await authReguler.authRegulerHandler(req, res, next);
		}
	} catch (error) {
		next(error);
	}
}

module.exports = authHandler;
