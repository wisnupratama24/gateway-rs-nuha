const { CronJob } = require("cron");

const CronJobs = new Map(); // Menggunakan Map untuk menyimpan cron job dengan nama

const addCronJob = ({ name, schedule, task }) => {
	if (CronJobs.has(name)) {
		console.error(`Cron job dengan nama '${name}' sudah ada.`);
		return null;
	}

	const job = new CronJob(schedule, task);
	CronJobs.set(name, job);
	job.start();
	console.log(`Cron job '${name}' ditambahkan dengan jadwal: ${schedule}`);
	return job;
};

const removeCronJob = ({ name }) => {
	const job = CronJobs.get(name);
	if (job) {
		job.stop();
		CronJobs.delete(name);
		console.log(`Cron job '${name}' dihapus.`);
	} else {
		console.log(`Cron job dengan nama '${name}' tidak ditemukan.`);
	}
};

const getCronJob = ({ name }) => {
	return CronJobs.get(name);
};

const getAllCronJobs = () => {
	return Array.from(CronJobs.entries()).map(([name, job]) => ({
		name,
		schedule: job.cronTime.source,
	}));
};

// // cara pakai
// const cron = generateCronExpression({ interval: 1, unit: TIME_UNITS.MINUTE, dayOfWeek: 0, hour: 0, minute: 0 })

// // nambah cronjob
// addCronJob({name : "test", schedule : cron, task : () => {
//   console.log("Cron Job");
// }})
// addCronJob({name : "test2", schedule : cron, task : () => {
//     console.log("Cron Job2");
//   }})
// console.log({CronJobs})
// // hapus cronjob
// removeCronJob({name : "test"})

// //get all cronjob yg aktif
// console.log(getAllCronJobs())

module.exports = {
	addCronJob,
	removeCronJob,
	getCronJob,
	getAllCronJobs,
};
