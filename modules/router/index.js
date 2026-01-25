const router = require("express").Router();

router.use("/master", require("../master/router/index"));
router.use("/dashboard", require("../dashboard/router/index"));
router.use("/dokter", require("../dokter/router/index"));

module.exports = router;
