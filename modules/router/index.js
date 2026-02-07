const router = require("express").Router();

router.use("/dokter", require("../dokter/router/index"));

module.exports = router;
