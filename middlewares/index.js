// Import middleware and routers
const SanitizeInput = require("./sanitize/sanitizeInputMiddleware");
const errorHandler = require("./error/errorHelper");
const successHandler = require("./success/succesResponse");
const notfound_response = require("./error/notFoundResponse");
const routers = require("../modules/router/index");
const authHandler = require("./auth/index");
const { RATE_LIMIT_ENABLED } = require("../helpers/env/env.config");
const { general: rateLimiterGeneral } = require("./security/rateLimiter");

class Middlewares {
	static configure(app) {
		// Use middleware
		// Rate limiting (jika enabled via ENV)
		if (RATE_LIMIT_ENABLED) {
			app.use(rateLimiterGeneral);
		}
		app.use(SanitizeInput);
		app.use(authHandler);
		// Use routers
		app.use("/", routers);
		app.use(errorHandler);
		app.use(notfound_response);
		app.use(successHandler);
	}
}

module.exports = Middlewares;
