const router = require("express").Router();
const usersController = require("../controller/users.controller");
router.get("/list-filter", usersController.listFilterUsersController());

module.exports = router;
