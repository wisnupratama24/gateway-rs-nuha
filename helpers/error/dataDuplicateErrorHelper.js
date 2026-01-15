class DataDuplicateError extends Error {
	constructor({ message, data }) {
		super("data duplicate");
		this.data = data;
		this.message = message;
	}
}

module.exports = DataDuplicateError;
