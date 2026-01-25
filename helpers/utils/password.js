const BCRYPT = require("bcrypt");

const { ForbiddenError } = require("../error");

class Password {
	static async generatePassword({ password }) {
		try {
			if (!password) {
				throw new ForbiddenError({ message: "password cannot be empty", data: null });
			}
			return await BCRYPT.hash(password, 10);
		} catch (err) {
			throw err;
		}
	}

	static async generatePassword_mobile({ password }) {
		try {
			if (!password) {
				throw new ForbiddenError({ message: "password cannot be empty", data: null });
			}
			return await BCRYPT.hash(password, 12);
		} catch (err) {
			throw err;
		}
	}

	static async comparePassword({ password, hashed }) {
		try {
			if (!password) {
				throw new ForbiddenError({ message: "password cannot be empty", data: null });
			} else if (!hashed) {
				throw new ForbiddenError({ message: "hashed cannot be empty", data: null });
			}
			return await BCRYPT.compare(password, hashed);
		} catch (err) {
			throw err;
		}
	}
}

module.exports = Password;
