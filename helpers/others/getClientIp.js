/**
 * Get real client IP address from request
 * Handles load balancer, proxy, and direct connections
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
	// Priority 1: req.ip (setelah trust proxy di-set)
	if (req.ip && req.ip !== "::1" && req.ip !== "127.0.0.1" && req.ip !== "::ffff:127.0.0.1") {
		let ip = req.ip;
		// Normalize IPv6 mapped IPv4
		if (ip.startsWith("::ffff:")) {
			ip = ip.substring(7);
		}
		return ip;
	}

	// Priority 2: X-Forwarded-For (format: "client, proxy1, proxy2")
	const forwarded = req.headers["x-forwarded-for"];
	if (forwarded) {
		const ip = forwarded.split(",")[0].trim();
		if (ip && ip !== "::1" && ip !== "127.0.0.1") {
			// Normalize IPv6 mapped IPv4
			if (ip.startsWith("::ffff:")) {
				return ip.substring(7);
			}
			return ip;
		}
	}

	// Priority 3: X-Real-IP
	if (req.headers["x-real-ip"]) {
		const ip = req.headers["x-real-ip"].trim();
		if (ip && ip !== "::1" && ip !== "127.0.0.1") {
			if (ip.startsWith("::ffff:")) {
				return ip.substring(7);
			}
			return ip;
		}
	}

	// Priority 4: Cloudflare
	if (req.headers["cf-connecting-ip"]) {
		return req.headers["cf-connecting-ip"].trim();
	}

	// Priority 5: Akamai/Cloudflare Enterprise
	if (req.headers["true-client-ip"]) {
		return req.headers["true-client-ip"].trim();
	}

	// Fallback: connection remote address
	const ip = req.connection?.remoteAddress || req.socket?.remoteAddress || req.headers["remote-addr"] || "unknown";

	// Normalize IPv6 mapped IPv4
	if (ip && ip.startsWith("::ffff:")) {
		return ip.substring(7);
	}

	return ip;
}

module.exports = getClientIp;
