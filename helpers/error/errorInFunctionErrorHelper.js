class ErrorInFunction extends Error {
	constructor({ message, data }) {
		super("error in fuction");
		this.data = data;
		this.message = message;
	}
}

module.exports = ErrorInFunction;
