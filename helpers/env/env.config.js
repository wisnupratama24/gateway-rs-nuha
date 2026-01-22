module.exports = {
	PORT_EXPRESS: process.env.PORT_EXPRESS,
	APP_ENV: process.env.APP_ENV,
	DB_NAME: process.env.DB_NAME,
	DB_USER: process.env.DB_USER,
	DB_PASS: process.env.DB_PASS,
	DB_HOST: process.env.DB_HOST,
	DB_PORT: process.env.DB_PORT,
	REDIS_HOST: process.env.REDIS_HOST,
	MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
	MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
	MINIO_SECRETKEY: process.env.MINIO_SECRETKEY,
	MINIO_BUCKET: process.env.MINIO_BUCKET,
	KEY_JWT: process.env.KEY_JWT,
	SESSION_TIME: process.env.SESSION_TIME,
	BASE_URL: process.env.BASE_URL,
	TIMEZONE: process.env.TIMEZONE,
	APP_AREA: process.env.APP_AREA,
	MAX_PASSWORD_DAYS: process.env.MAX_PASSWORD_DAYS,
	CRON_RELOAD_PARTITIONS: process.env.CRON_RELOAD_PARTITIONS,
	KEY_ENCRYPT: process.env.KEY_ENCRYPT,
	MAX_ENCRYPT_DAYS: process.env.MAX_ENCRYPT_DAYS,
	IS_ENCRYPT: process.env.IS_ENCRYPT === "true" ? true : false,
	// CORS Configuration
	ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : null,
	// IP Whitelist Configuration (comma-separated)
	ALLOWED_IPS: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(",").map((ip) => ip.trim()) : null,
	// HTTPS Only (enforce HTTPS in production)
	HTTPS_ONLY: process.env.HTTPS_ONLY === "true" || process.env.HTTPS_ONLY === "1",
	// Trust Proxy (untuk load balancer)
	TRUST_PROXY: process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1" || parseInt(process.env.TRUST_PROXY) || false,
	// Rate Limiting Configuration
	RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "false" && process.env.RATE_LIMIT_ENABLED !== "0", // Default: true (enabled)
	RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
	RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Default: 100 requests per window
	RATE_LIMIT_LOGIN_MAX: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5, // Default: 5 login attempts per window
	// Body Parser Configuration
	BODY_PARSER_LIMIT: process.env.BODY_PARSER_LIMIT || "10mb", // Default: 10mb
	X_API_KEY: process.env.X_API_KEY,
	TOKEN: process.env.TOKEN,
	REFRESH_TOKEN: process.env.REFRESH_TOKEN
};
