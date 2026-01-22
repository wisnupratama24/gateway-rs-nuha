const router = require("express").Router();
const usersController = require("../controller/list.controller");
const { validate, query } = require("../../../../middlewares/validation");
router.get(
	"/list-filter",
	validate([
		query("limit").notEmpty().isInt({ min: 1, max: 100 }).withMessage("Limit harus berupa angka antara 1-100").toInt(),
		query("pages").notEmpty().isInt({ min: 1 }).withMessage("Pages harus berupa angka positif (minimal 1)").toInt(),
	]),
	usersController.listFilterUsersController(),
);

module.exports = router;
