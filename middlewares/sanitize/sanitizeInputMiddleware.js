const format_responseHelper = require("../../helpers/response/responseHelper");

const CleanKeyword = (inputStr) => {
	if (typeof inputStr !== "string") {
		return inputStr;
	}

	// More comprehensive SQL injection prevention
	const sqlKeywords = [
		/UNION[\s]+SELECT/gi,
		/SELECT[\s]+.*[\s]+FROM/gi,
		/INSERT[\s]+INTO/gi,
		/UPDATE[\s]+.*[\s]+SET/gi,
		/DELETE[\s]+FROM/gi,
		/DROP[\s]+(TABLE|DATABASE)/gi,
		/CREATE[\s]+(TABLE|DATABASE)/gi,
		/ALTER[\s]+TABLE/gi,
		/EXEC[\s]*\(/gi,
		/EXECUTE[\s]*\(/gi,
		/SCRIPT[\s]*>/gi,
		/JAVASCRIPT:/gi,
		/VBSCRIPT:/gi,
		/ONLOAD[\s]*=/gi,
		/ONERROR[\s]*=/gi,
	];

	// Remove SQL keywords
	let cleaned = inputStr;
	sqlKeywords.forEach((pattern) => {
		cleaned = cleaned.replace(pattern, "");
	});

	// Remove dangerous characters
	const dangerousChars = [";", "--", "/*", "*/", "xp_", "sp_"];
	dangerousChars.forEach((char) => {
		cleaned = cleaned.split(char).join("");
	});

	// Remove HTML/script tags
	cleaned = cleaned.replace(/<[^>]*>/g, "");
	cleaned = cleaned.replace(/&lt;|&gt;|&amp;|&quot;|&#x27;/g, "");

	return cleaned;
};
const CleanInput = (input) => {
	if (typeof input === "object" && input !== null) {
		for (let key in input) {
			// Use Object.prototype.hasOwnProperty.call() to avoid issues
			if (Object.prototype.hasOwnProperty.call(input, key)) {
				if (typeof input[key] === "string") {
					// Remove characters commonly used in SQL injection
					// input[key] = input[key].replace(/[\';\-\-]/g, '');
					input[key] = CleanKeyword(input[key]);
				}
			}
		}
	}
	return input;
};

const cleanMiddleware = (req, res, next) => {
	try {
		// Clean query parameters
		req.query = CleanInput(req.query);

		// Clean request body
		req.body = CleanInput(req.body);

		// Clean route parameters
		req.params = CleanInput(req.params);

		// Additional security: Check for suspicious patterns
		const allInputs = JSON.stringify({ ...req.query, ...req.body, ...req.params });
		const suspiciousPatterns = [
			/\.\.\//g, // Path traversal
			/\.\.\\/g, // Path traversal (Windows)
			/eval\s*\(/gi, // Code execution
			/function\s*\(/gi, // Function injection
		];

		for (const pattern of suspiciousPatterns) {
			if (pattern.test(allInputs)) {
				return res.status(400).json({
					data: null,
					meta_data: {
						status: 400,
						message: "Invalid input detected",
					},
				});
			}
		}

		next();
	} catch (error) {
		res.locals.response = format_responseHelper.error_server(error);
		next();
	}
};

module.exports = cleanMiddleware;
