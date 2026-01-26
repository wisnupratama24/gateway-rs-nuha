let jwt = require("jsonwebtoken");
const { KEY_JWT } = require("../env/envConfig");
const { ErrorInFunction } = require("../error");

class Jwt {
	/** =========================================== */
	/** WEB VERSION */
	/** =========================================== */
	static async generateToken({ data }) {
		try {
			if (data) {
				return jwt.sign(data, KEY_JWT);
			} else {
				throw new ErrorInFunction({ data: null, message: "data di jwt tidak ada" });
			}
		} catch (error) {
			throw new ErrorInFunction({ data: error, message: "Token generation error" });
		}
	}

	static async verifyToken({ token }) {
		try {
			if (token) {
				return jwt.verify(token, KEY_JWT);
			} else {
				throw new ErrorInFunction({ data: null, message: "token jwt belum dikirim" });
			}
		} catch (error) {
			throw new ErrorInFunction({ data: error, message: "Token verification error" });
		}
	}

	/** =========================================== */
	/** WEB VERSION */
	/** =========================================== */

	static async client_generateToken({ data, key_client }) {
		try {
			if (data && key_client) {
				return jwt.sign(data, key_client);
			} else if (!data) {
				throw new ErrorInFunction({ data: null, message: "data tidak ada" });
			} else if (!key_client) {
				throw new ErrorInFunction({ data: null, message: "key client tidak ada" });
			} else {
				throw new ErrorInFunction({ data: null, message: "data dan key client tidak ada" });
			}
		} catch (error) {
			throw new ErrorInFunction({ data: error, message: "Token generation error" });
		}
	}

	static async client_verifyToken({ token, key_client }) {
		try {
			if (token) {
				return jwt.verify(token, key_client);
			} else {
				throw new ErrorInFunction({ data: null, message: "token tidak ada" });
			}
		} catch (error) {
			throw new ErrorInFunction({ data: error, message: "Token verification error" });
		}
	}
}

module.exports = Jwt;
