const router = require("express").Router();

router.use("/master", require("../master/router/index"));

module.exports = router;
