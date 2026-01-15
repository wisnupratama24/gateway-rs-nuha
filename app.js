require("dotenv").config();

const EXPRESS = require("express");
const CORS = require("cors");
const MORGAN = require("morgan");
const MOMENT = require("moment");
MORGAN.token("date", function () {
	var p = MOMENT().format();
	return p;
});

const { DB } = require("./config/db/index");
let { CLIENT_1, CLIENT_2 } = require("./config/redis/index");
const SESSION = require("express-session");
const { RedisStore } = require("connect-redis");

const APP = EXPRESS();
const HTTP = require("http");
const SERVER = HTTP.createServer(APP);
const WEB_SOCKET = require("./config/socket/index");
const { PORT_EXPRESS, KEY_JWT, ALLOWED_ORIGINS, ALLOWED_IPS, HTTPS_ONLY, BODY_PARSER_LIMIT } = require("./helpers/env/env.config");

const PORT = PORT_EXPRESS || 999;

const BODY_PARSER = require("body-parser");
const HPP = require("hpp");
const HELMET = require("helmet");
APP.use(
	HELMET({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"],
			},
		},
		crossOriginEmbedderPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" },
		crossOriginOpenerPolicy: { policy: "same-origin" },
		dnsPrefetchControl: true,
		frameguard: { action: "deny" },
		hidePoweredBy: true,
		hsts: {
			maxAge: 31536000,
			includeSubDomains: true,
			preload: true,
		},
		ieNoOpen: true,
		noSniff: true,
		originAgentCluster: true,
		permittedCrossDomainPolicies: false,
		referrerPolicy: { policy: "no-referrer" },
		xssFilter: true,
	}),
);
APP.use(MORGAN(":remote-user [:date[web]] - :method :url :status :res[content-length] - :response-time ms"));
// CORS configuration - lebih ketat untuk security
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (mobile apps, Postman, etc.)
		if (!origin) return callback(null, true);

		// If ALLOWED_ORIGINS is set, use whitelist
		if (ALLOWED_ORIGINS && ALLOWED_ORIGINS.length > 0) {
			if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		} else {
			// If not set, allow all origins (development mode)
			callback(null, true);
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "token", "X-API-Key", "X-Requested-With"],
	exposedHeaders: ["Content-Range", "X-Content-Range"],
	maxAge: 86400, // 24 hours
};

APP.use(CORS(corsOptions));

// HTTPS Only Check (jika di-enable via ENV)
if (HTTPS_ONLY) {
	APP.use((req, res, next) => {
		// Check if request is HTTPS
		// req.secure akan true jika trust proxy di-set dan X-Forwarded-Proto = https
		const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || req.protocol === "https";

		if (!isSecure && process.env.APP_ENV === "PROD") {
			return res.status(403).json({
				data: null,
				meta_data: {
					status: 403,
					message: "HTTPS required",
				},
			});
		}
		next();
	});
}

// IP Whitelist Check (jika di-enable via ENV)
if (ALLOWED_IPS && ALLOWED_IPS.length > 0) {
	APP.use((req, res, next) => {
		// Get client IP
		const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.ip || "unknown";
		// Normalize IPv6 mapped IPv4
		const normalizedIp = clientIp.startsWith("::ffff:") ? clientIp.substring(7) : clientIp;

		// Check if IP is in whitelist
		if (!ALLOWED_IPS.includes(normalizedIp) && !ALLOWED_IPS.includes(clientIp)) {
			return res.status(403).json({
				data: null,
				meta_data: {
					status: 403,
					message: "IP address not allowed",
				},
			});
		}

		next();
	});
}

// Body parser with size limits for security
APP.use(EXPRESS.json({ limit: BODY_PARSER_LIMIT, strict: true }));

APP.use(BODY_PARSER.json());
APP.use(BODY_PARSER.urlencoded({ extended: false }));
APP.use(HPP({ checkBody: false }));

APP.use(EXPRESS.urlencoded({ limit: BODY_PARSER_LIMIT, extended: true, parameterLimit: 100 }));

// APP.use('/', EXPRESS.static('assets'));
const Middlewares = require("./middlewares/index");
Middlewares.configure(APP);
// Security: Remove X-Powered-By header
APP.disable("x-powered-by");

// Additional security headers
APP.use((req, res, next) => {
	// Prevent clickjacking
	res.setHeader("X-Frame-Options", "DENY");

	// Prevent MIME type sniffing
	res.setHeader("X-Content-Type-Options", "nosniff");

	// XSS Protection (legacy, but still useful)
	res.setHeader("X-XSS-Protection", "1; mode=block");

	// Referrer Policy
	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

	// Permissions Policy (formerly Feature Policy)
	res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

	next();
});

WEB_SOCKET(SERVER);

const store = new RedisStore({ client: CLIENT_1 });

// Session configuration - enhanced security
const isProduction = process.env.APP_ENV === "PROD";
APP.use(
	SESSION({
		store,
		secret: KEY_JWT,
		name: "sessionId", // Don't use default session name
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: isProduction, // Only send over HTTPS in production
			httpOnly: true, // Prevent XSS attacks
			sameSite: isProduction ? "strict" : "lax", // CSRF protection
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
		rolling: true, // Reset expiration on activity
	}),
);

// listen on the specified port
SERVER.listen(PORT, async () => {
	console.log(`Active in port ${PORT}`);
	try {
		await CLIENT_1.connect();
		await CLIENT_2.connect();

		await DB.authenticate()
			.then(async () => {
				console.log("Database OK");
			})
			.catch((error) => {
				console.error("Database Error", error);
			});
	} catch (error) {
		console.error("Database Error", error);
	}
});
