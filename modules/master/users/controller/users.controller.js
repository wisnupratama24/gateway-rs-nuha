const { successList } = require("../../../../helpers/response/responseHelper");
class UsersController {
	static listFilterUsersController() {
		return async (req, res, next) => {
			try {
				let { limit } = req.query;
				console.log(req.query);
				res.locals.response = successList({ data: [], pages: 0, count: 0, limit });
			} catch (error) {
				next(error);
			}
			next();
		};
	}
}

module.exports = UsersController;
