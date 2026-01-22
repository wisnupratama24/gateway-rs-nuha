const router = require("express").Router();
const DashboardController = require("../controller/dashboard.controller");
/**
 * Router untuk Modul Dashboard & Sync
 * Prefix: /v3/dashboard
 */

// Route: Trigger Sinkronisasi Data Manual
// POST /v3/dashboard/sync
router.post("/sync", DashboardController.triggerSync());

// Route: Get Dashboard Statistics
// GET /v3/dashboard/stats
router.get("/stats", DashboardController.getDashboardData());

module.exports = router;
