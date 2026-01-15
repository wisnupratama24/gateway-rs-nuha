const router = require("express").Router();

router.use("/users", require("../users/router/index"));
module.exports = router;
