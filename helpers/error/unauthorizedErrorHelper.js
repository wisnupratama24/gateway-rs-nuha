class UnauthorizedError extends Error {
	constructor({ message, data }) {
		super("Unauthorized error");
		this.data = data;
		this.message = message;
	}
}

module.exports = UnauthorizedError;
