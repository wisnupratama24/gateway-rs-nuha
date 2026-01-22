const router = require("express").Router();
const dokterController = require("../controller/dokter.controller");
const { validate, query } = require("../../../middlewares/validation");
router.get(
	"/jadwal-dokter",
	validate([
		query("limit").notEmpty().isInt({ min: 1, max: 100 }).withMessage("Limit harus berupa angka antara 1-100").toInt(),
		query("pages").notEmpty().isInt({ min: 1 }).withMessage("Pages harus berupa angka positif (minimal 1)").toInt(),
	]),
	dokterController.listJadwalDokter(),
);

module.exports = router;
