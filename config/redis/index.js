const { createClient } = require("redis");
const { REDIS_HOST } = require("../../helpers/env/envConfig");

// Connect to Redis
const CLIENT_1 = createClient({
	url: REDIS_HOST,
	pingInterval: 10000,
});

CLIENT_1.on("connect", () => {
	console.log("Redis 1 Connected");
});

CLIENT_1.on("error", (err) => {
	console.error("Redis 1 Error", err);
});

const CLIENT_2 = createClient({
	url: REDIS_HOST,
	pingInterval: 10000,
});

CLIENT_2.on("connect", () => {
	console.log("Redis 2 Connected");
});

CLIENT_2.on("error", (err) => {
	console.error("Redis 2 Error", err);
});

module.exports = {
	CLIENT_1,
	CLIENT_2,
};
