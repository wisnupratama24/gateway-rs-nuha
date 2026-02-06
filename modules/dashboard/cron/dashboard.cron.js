const { addCronJob } = require("../../../helpers/cronJob/cronjobConfig");
const generateCronExpression = require("../../../helpers/cronJob/generatorCronjob");
const { TIME_UNITS } = require("../../../helpers/cronJob/cronjobConstants");
const JadwalSyncService = require("../service/jadwal-sync.service");

/**
 * ========================================
 * DASHBOARD CRON JOBS
 * ========================================
 *
 * Inisialisasi Cron Jobs untuk sinkronisasi otomatis dashboard.
 *
 * REGISTERED CRON JOBS:
 * 1. JadwalDokterWeeklySync - Sync jadwal dokter (Weekly Sunday 00:00)
 *
 * CARA MENAMBAH CRON BARU:
 * 1. Import service baru
 * 2. Generate cron expression dengan `generateCronExpression(...)`
 * 3. Register dengan `addCronJob({ name, schedule, task })`
 *
 * TODO: Peserta workshop akan menambahkan BookingPasienWeeklySync di sini
 * Lihat panduan di docs/WORKSHOP_HANDS_ON.md Step 10
 */
const initDashboardCron = () => {
	// ========================================
	// CRON JOB #1: Jadwal Dokter Sync
	// ========================================
	// Schedule: Sekali seminggu (Setiap Minggu jam 00:00)
	const jadwalSchedule = generateCronExpression({
		unit: TIME_UNITS.WEEK,
		interval: 1, // 1 Minggu sekali
		hour: 0,
		minute: 0,
	});

	addCronJob({
		name: "JadwalDokterWeeklySync",
		schedule: jadwalSchedule,
		task: async () => {
			console.log("[Cron] Memulai Sinkronisasi Mingguan: Jadwal Dokter...");
			try {
				const result = await JadwalSyncService.syncJadwalDokter();
				console.log(`[Cron] ✅ Jadwal Dokter Sync Selesai. Updated: ${result.updated}, Inserted: ${result.inserted}`);
			} catch (error) {
				console.error("[Cron] ❌ Jadwal Dokter Sync Gagal:", error.message);
			}
		},
	});

	// ========================================
	// TODO: WORKSHOP EXERCISE
	// ========================================
	// CRON JOB #2: Booking Pasien Sync
	// Peserta akan menambahkan cron job untuk booking sync di sini
	// Contoh:
	// const BookingSyncService = require("../service/booking-sync.service");
	// const bookingSchedule = generateCronExpression({ unit: TIME_UNITS.WEEK, interval: 1, hour: 0, minute: 0 });
	// addCronJob({ name: "BookingPasienWeeklySync", schedule: bookingSchedule, task: async () => {...} });

	console.log("[DashboardCron] ✅ Dashboard cron jobs initialized (1 job registered)");
};

module.exports = { initDashboardCron };
