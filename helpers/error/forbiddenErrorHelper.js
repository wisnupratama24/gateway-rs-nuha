class ForbiddenError extends Error {
	constructor({ message, data }) {
		super("Forbidden error");
		this.data = data;
		this.message = message;
	}
}

module.exports = ForbiddenError;
