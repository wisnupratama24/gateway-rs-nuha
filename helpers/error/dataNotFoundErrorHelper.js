class DataNotFoundError extends Error {
	constructor({ message, data }) {
		super("data not found");
		this.data = data;
		this.message = message;
	}
}

module.exports = DataNotFoundError;
