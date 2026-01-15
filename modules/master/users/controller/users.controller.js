const { successList } = require("../../../../helpers/response/responseHelper");
const UserService = require("../service/users.service");
class UsersController {
	static listFilterUsersController() {
		return async (req, res, next) => {
			try {
				let { limit } = req.query;
				console.log(req.query);
				await UserService.getAllUsersService({ limit });
				res.locals.response = successList({ data: [], pages: 0, count: 0, limit });
			} catch (error) {
				next(error);
			}
			next();
		};
	}
}

module.exports = UsersController;
