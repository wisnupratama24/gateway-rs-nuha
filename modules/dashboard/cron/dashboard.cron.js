const { addCronJob } = require("../../../helpers/cronJob/cronjobCronjobConfig");
const generateCronExpression = require("../../../helpers/cronJob/generatorCronjob");
const { TIME_UNITS } = require("../../../helpers/cronJob/cronjobConstants");
const DashboardService = require("../service/dashboard.service");

/**
 * Inisialisasi Cron Job untuk Modul Dashboard
 */
const initDashboardCron = () => {
	// Schedule: Sekali seminggu (Default: Setiap Minggu jam 00:00)
	const weeklySchedule = generateCronExpression({
		unit: TIME_UNITS.WEEK,
		interval: 1,
		hour: 0,
		minute: 0,
	});

	addCronJob({
		name: "DashboardWeeklySync",
		schedule: weeklySchedule,
		task: async () => {
			console.log("[Cron] Memulai Sinkronisasi Mingguan Data Dashboard...");
			try {
				const result = await DashboardService.syncData();
				console.log(`[Cron] Sinkronisasi Selesai. Total Update: ${result.updated}, Insert: ${result.inserted}`);
			} catch (error) {
				console.error("[Cron] Sinkronisasi Gagal:", error.message);
			}
		},
	});
};

module.exports = { initDashboardCron };
