const router = require("express").Router();
const dokterController = require("../controller/dokter.controller");
const { validate, query } = require("../../../middlewares/validation");

router.get(
	"/jadwal-dokter",
	validate([
		query("limit").notEmpty().isInt({ min: 1, max: 100 }).withMessage("Limit harus berupa angka antara 1-100").toInt(),
		query("pages").notEmpty().isInt({ min: 1 }).withMessage("Pages harus berupa angka positif (minimal 1)").toInt(),
	]),
	dokterController.listJadwalDokter(123),
);

router.get(
	"/detail-jadwal-dokter",
	validate([
		query("limit").notEmpty().isInt({ min: 1, max: 100 }).withMessage("Limit harus berupa angka antara 1-100").toInt(),
		query("pages").notEmpty().isInt({ min: 1 }).withMessage("Pages harus berupa angka positif (minimal 1)").toInt(),
		query("id_dokter").notEmpty().isInt({ min: 1 }).withMessage("ID Dokter harus berupa angka positif").toInt(),
	]),
	dokterController.listJadwalDokter(107),
);

module.exports = router;
