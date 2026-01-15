const { ErrorInFunction } = require("../../error");
const crypto = require("crypto");
const ALGORITHM = "aes-256-gcm";
const KEY_SIZE = 32; // 256 bits for aes-256-gcm
const IV_SIZE = 12; // Recommended size for GCM mode
const SALT_SIZE = 16; // Salt size for key derivation
const ITERATION_COUNT = 100000;

function generateKeyMaterial({ secret_key, salt }) {
	try {
		return crypto.pbkdf2Sync(secret_key, salt, ITERATION_COUNT, KEY_SIZE, "sha256");
	} catch (error) {
		throw new ErrorInFunction("Key material generation failed: " + error.message);
	}
}

function encryptText({ data, secret_key }) {
	try {
		if (!data) {
			return;
		} else if (!secret_key) {
			throw new ErrorInFunction({ data: null, message: "Secret key is empty" });
		}

		const salt = crypto.randomBytes(SALT_SIZE);
		const keyMaterial = generateKeyMaterial({ secret_key, salt });
		const iv = crypto.randomBytes(IV_SIZE);

		const cipher = crypto.createCipheriv(ALGORITHM, keyMaterial, iv);
		const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
		const tag = cipher.getAuthTag();

		return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
	} catch (error) {
		throw error;
	}
}

function decryptText({ encryptedData, secret_key }) {
	try {
		if (!encryptedData) {
			return;
		} else if (!secret_key) {
			throw new ErrorInFunction({ data: null, message: "Secret key is empty" });
		}

		const data = Buffer.from(encryptedData, "base64");
		const salt = data.subarray(0, SALT_SIZE);
		const iv = data.subarray(SALT_SIZE, SALT_SIZE + IV_SIZE);
		const tag = data.subarray(SALT_SIZE + IV_SIZE, SALT_SIZE + IV_SIZE + 16);
		const encryptedText = data.subarray(SALT_SIZE + IV_SIZE + 16);

		const keyMaterial = generateKeyMaterial({ secret_key, salt });
		const decipher = crypto.createDecipheriv(ALGORITHM, keyMaterial, iv);
		decipher.setAuthTag(tag);

		const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
		return decrypted.toString("utf8");
	} catch (error) {
		throw new ErrorInFunction({ message: "Error Decrypt", data: error });
	}
}

function encodeQueryString({ queryObj, secret_key }) {
	try {
		if (!queryObj) {
			return;
		} else if (!secret_key) {
			throw new ErrorInFunction({ data: null, message: "Secret key is empty" });
		}

		const queryString = new URLSearchParams(queryObj).toString();
		return encryptText({ data: queryString, secret_key });
	} catch (error) {
		throw error;
	}
}

function decodeQueryString({ encryptedQueryString, secret_key }) {
	try {
		if (!encryptedQueryString) {
			return;
		} else if (!secret_key) {
			throw new ErrorInFunction({ data: null, message: "Secret key is empty" });
		}

		const decryptedQueryString = decryptText({ encryptedData: encryptedQueryString, secret_key });
		const queryParams = new URLSearchParams(decryptedQueryString);
		const queryObj = {};
		for (const [key, value] of queryParams) {
			queryObj[key] = value;
		}
		return queryObj;
	} catch (error) {
		throw error;
	}
}

function jsonStringifyEncrypt({ jsonObject, secret_key }) {
	try {
		if (!jsonObject) {
			return;
		} else if (!secret_key) {
			throw new ErrorInFunction({ data: null, message: "Secret key is empty" });
		}

		const jsonString = JSON.stringify(jsonObject);
		return encryptText({ data: jsonString, secret_key });
	} catch (error) {
		throw error;
	}
}

function jsonParseDecrypt({ encryptedJsonString, secret_key }) {
	try {
		if (!encryptedJsonString) {
			return;
		} else if (!secret_key) {
			throw new ErrorInFunction({ data: null, message: "Secret key is empty" });
		}

		const decryptedJsonString = decryptText({ encryptedData: encryptedJsonString, secret_key });
		return JSON.parse(decryptedJsonString);
	} catch (error) {
		throw error;
	}
}

// (async) => {
// 	try {
// 		const plaintext = "Hello Worldeee";
// 		const plaintextQuery = "pages=1&limit=10&sort_by=desc&sort_key=id_list_partitions";
// 		const secret_key = "password_is_password";
// 		const plaintJson = { data: "this is data", secret: "this is secret" };

// 		const encryptedData = encryptText({ data: plaintext, secret_key });
// 		console.log("EncryptedText:", encryptedData);

// 		const decryptedData = decryptText({ encryptedData, secret_key });
// 		console.log("DecryptedText:", decryptedData);

// 		const encryptedDataJson = jsonStringifyEncrypt({ jsonObject: plaintJson, secret_key });
// 		console.log("EncryptedJSON:", encryptedDataJson);

// 		const decryptedDataJson = jsonParseDecrypt({ encryptedJsonString: encryptedDataJson, secret_key });
// 		console.log("DecryptedJSON:", decryptedDataJson);

// 		const encryptedQuery = encodeQueryString({ queryObj: plaintextQuery, secret_key });
// 		console.log("EncryptedQuery:", encryptedQuery);
// 		const decryptedQuery = decodeQueryString({ encryptedQueryString: encryptedQuery, secret_key });
// 		console.log("DecryptedQuery:", decryptedQuery);
// 	} catch (error) {
// 		throw error;
// 	}
// };

module.exports = {
	encryptText,
	decryptText,
	encodeQueryString,
	decodeQueryString,
	jsonStringifyEncrypt,
	jsonParseDecrypt,
};
