const router = require("express").Router();
const DashboardController = require("../controller/dashboard.controller");

/**
 * ========================================
 * DASHBOARD ROUTER
 * ========================================
 *
 * Router untuk Modul Dashboard & Sync
 * Prefix: /dashboard
 *
 * ENDPOINTS:
 * 1. Sync Endpoints (POST)
 * 2. Stats Endpoints (GET)
 */

// ========================================
// SYNC ENDPOINTS (POST)
// ========================================

// Sync Jadwal Dokter Saja
// POST /dashboard/sync-jadwal
router.post("/sync-jadwal", DashboardController.triggerSyncJadwal());

// TODO: WORKSHOP EXERCISE
// Peserta akan menambahkan route /sync-booking di sini
// Lihat panduan di docs/WORKSHOP_HANDS_ON.md Step 7

// Sync ALL Types
// POST /dashboard/sync-all
router.post("/sync-all", DashboardController.triggerSyncAll());

// ========================================
// STATS ENDPOINTS (GET)
// ========================================

// GET /dashboard/stats → Dashboard stats dengan JOIN queries
router.get("/stats", DashboardController.getDashboardData());

module.exports = router;
