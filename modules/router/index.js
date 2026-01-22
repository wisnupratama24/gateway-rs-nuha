const router = require("express").Router();

router.use("/master", require("../master/router/index"));
router.use("/dashboard", require("../dashboard/router/index"));

module.exports = router;
