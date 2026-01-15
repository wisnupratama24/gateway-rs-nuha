const { error404 } = require("../../helpers/response/responseHelper");

function NotFoundHandler(req, res, next) {
	if (res.headersSent) {
		return next();
	} else if (!res.locals?.response) {
		res.status(404).json(error404({ message: "Url Not Found!" }));
	} else {
		return next();
	}
}

module.exports = NotFoundHandler;
