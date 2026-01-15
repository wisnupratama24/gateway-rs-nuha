const { default: CronTime } = require("cron-time-generator");
const { TIME_UNITS, ERRORS } = require("./cronjobConstants");
const { ErrorInFunction } = require("../error");

const generateCronExpression = ({ interval, unit, dayOfWeek, hour, minute }) => {
	if (typeof hour !== "number" || typeof minute !== "number" || typeof interval !== "number") {
		throw new ErrorInFunction({ message: "hour, minute, interval must be a number" });
	}

	if (!hour) hour = 0;
	if (!minute) minute = 0;
	if (!interval) interval = 1;
	switch (unit) {
		case TIME_UNITS.SECOND:
			console.log(`Generating created cron job with interval ${interval} ${unit}`);
			return CronTime.every(interval / 60).minutes();
		case TIME_UNITS.MINUTE:
			console.log(`Generating created cron job with interval ${interval} ${unit}`);
			return CronTime.every(interval).minutes();
		case TIME_UNITS.HOUR:
			console.log(`Generating created cron job with interval ${interval} ${unit}`);
			return CronTime.every(interval).hours();
		case TIME_UNITS.DAY:
			console.log(`Generating created cron job with interval ${interval} ${unit} AT "00:00:00"`);
			return CronTime.every(interval).days();
		case TIME_UNITS.DAY_AT:
			console.log(`Generating created cron job with interval every day AT "${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}:00"`);
			return CronTime.everyDayAt(hour, minute);
		case TIME_UNITS.WEEK:
			console.log(`Generating created cron job with interval ${interval} ${unit} AT "${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}:00"`);
			return CronTime.every(interval * 7).days();
		case TIME_UNITS.WEEK_AT:
			console.log(`Generating created cron job with interval every week AT "${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}:00"`);
			return CronTime.everyWeekAt(interval, hour, minute);
		case TIME_UNITS.WEEKDAY_AT:
			// monday is 1
			// Monday to friday
			console.log(`Generating created cron job with interval ${interval} "${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}:00" `);
			return CronTime.everyWeekDayAt(dayOfWeek, hour, minute);
		case TIME_UNITS.WEEKEND_AT:
			//saturday is 6
			// sunday is 0
			//Saturday and Sunday
			console.log(`Generating created cron job with interval ${interval} "${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}:00"`);
			return CronTime.everyWeekendAt(dayOfWeek, hour, minute);
		case TIME_UNITS.MONTH:
			console.log(`Generating created cron job with interval ${interval} ${unit} with date ${dayOfWeek} at "${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`}:00"`);
			return CronTime.everyMonthOn(dayOfWeek, hour, minute);
		default:
			throw new ErrorInFunction({ message: ERRORS.INVALID_UNIT });
	}
};

//cara pakai
// const cron = generateCronExpression({ interval: 1, unit: TIME_UNITS.MINUTE, dayOfWeek: 0, hour: 0, minute: 0 })
// console.log({cron})
module.exports = generateCronExpression;
