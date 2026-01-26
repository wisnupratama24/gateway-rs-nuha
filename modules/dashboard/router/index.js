const router = require("express").Router();
const DashboardController = require("../controller/dashboard.controller");

/**
 * ========================================
 * DASHBOARD ROUTER (Refactored)
 * ========================================
 *
 * Router untuk Modul Dashboard & Sync
 * Prefix: /v3/dashboard (atau /dashboard tergantung main router)
 *
 * ENDPOINTS:
 * 1. Sync Endpoints (POST)
 * 2. Backward Compatibility Endpoints
 */

// ========================================
// SYNC ENDPOINTS (POST)
// ========================================

// Sync Jadwal Dokter Saja
// POST /dashboard/sync-jadwal
router.post("/sync-jadwal", DashboardController.triggerSyncJadwal());

// Sync Booking Pasien Saja
// POST /dashboard/sync-booking
router.post("/sync-booking", DashboardController.triggerSyncBooking());

// Sync ALL Types (Jadwal + Booking)
// POST /dashboard/sync-all
router.post("/sync-all", DashboardController.triggerSyncAll());

// ========================================
// BACKWARD COMPATIBILITY ENDPOINTS
// ========================================
// Endpoints lama masih di-support untuk tidak break existing integrations

// GET /dashboard/stats → Dashboard stats dengan JOIN queries (NEW!)
router.get("/stats", DashboardController.getDashboardData());

module.exports = router;
