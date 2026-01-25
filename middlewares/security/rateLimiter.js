const { CLIENT_1 } = require("../../config/redis/index");
const { RATE_LIMIT_ENABLED, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, RATE_LIMIT_LOGIN_MAX } = require("../../helpers/env/envConfig");
const getClientIp = require("../../helpers/utils/getClientIp");
const crypto = require("crypto");

/**
 * Rate limiter middleware using Redis
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds (default: from env or 15 minutes)
 * @param {number} options.max - Maximum number of requests per window (default: from env or 100)
 * @param {string} options.message - Error message when limit is exceeded
 */
const rateLimiter = (options = {}) => {
	const {
		windowMs = RATE_LIMIT_WINDOW_MS, // From env or default: 15 minutes
		max = RATE_LIMIT_MAX, // From env or default: 100 requests per windowMs
		message = "Too many requests from this IP, please try again later.",
	} = options;

	return async (req, res, next) => {
		// Skip rate limiting jika disabled via ENV
		if (!RATE_LIMIT_ENABLED) {
			return next();
		}

		try {
			// Get rate limit identifier dengan priority:
			// 1. API Key (jika ada)
			// 2. User ID (jika authenticated)
			// 3. IP Address (fallback)

			let identifier;
			// Priority 1: API Key
			if (req.headers["x-api-key"] || req.headers["authorization"]?.startsWith("Bearer ")) {
				const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
				// Hash API Key untuk identifier (jangan pakai plain key)
				const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex").substring(0, 16);
				identifier = `apikey:${apiKeyHash}`;
			} else if (req.headers?.user?.id_ms_users) {
				identifier = `user:${req.headers.user.id_ms_users}`;
			} else {
				const clientIp = getClientIp(req);
				identifier = `ip:${clientIp}`;
			}

			const key = `rate_limit:${identifier}`;

			// Get current count from Redis
			const current = await CLIENT_1.get(key);

			if (current === null) {
				// First request, set counter
				await CLIENT_1.set(key, "1", { EX: Math.ceil(windowMs / 1000) });
				return next();
			}

			const count = parseInt(current, 10);

			if (count >= max) {
				// Rate limit exceeded
				res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
				console.log("Rate limit exceeded");
				return res.status(429).json({
					data: null,
					meta_data: {
						status: 429,
						message,
					},
				});
			}

			// Increment counter
			await CLIENT_1.incr(key);

			// Set headers
			res.setHeader("X-RateLimit-Limit", max);
			res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count - 1));
			res.setHeader("X-RateLimit-Reset", new Date(Date.now() + windowMs).toISOString());

			next();
		} catch (error) {
			// If Redis fails, allow request (fail open)
			console.error("Rate limiter error:", error);
			next();
		}
	};
};

// Pre-configured rate limiters
const createRateLimiters = () => ({
	// General API rate limiter
	general: rateLimiter({
		windowMs: RATE_LIMIT_WINDOW_MS, // From env or default: 15 minutes
		max: RATE_LIMIT_MAX, // From env or default: 100 requests per 15 minutes
		message: "Too many requests, please try again later.",
	}),

	// Strict rate limiter for auth endpoints
	strict: rateLimiter({
		windowMs: RATE_LIMIT_WINDOW_MS, // From env or default: 15 minutes
		max: RATE_LIMIT_LOGIN_MAX, // From env or default: 5 requests per 15 minutes
		message: "Too many authentication attempts, please try again later.",
	}),

	// Login rate limiter
	login: rateLimiter({
		windowMs: RATE_LIMIT_WINDOW_MS, // From env or default: 15 minutes
		max: RATE_LIMIT_LOGIN_MAX, // From env or default: 5 login attempts per 15 minutes
		message: "Too many login attempts, please try again later.",
	}),
});

module.exports = {
	rateLimiter,
	...createRateLimiters(),
};
