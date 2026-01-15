const { ForbiddenError, ErrorInFunction } = require("../error");
const CryptoJS = require("crypto-js");
const { KEY_ENCRYPT } = require("../env/env.config");

class Enkripsi {
	static async encodingToken({ data }) {
		try {
			if (!KEY_ENCRYPT || KEY_ENCRYPT.length < 16) {
				throw new ForbiddenError({ message: "Panjang kode enkripsi kurang sesuai, maximum 16 karakter", data: null });
			}

			if (!data) {
				return;
			}

			const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(data), KEY_ENCRYPT).toString();

			return encryptedValue;
		} catch (error) {
			throw new ErrorInFunction({ message: "Proses encrypt gagal, cek key encrypt", data: error });
		}
	}

	static async decodingToken({ encryptedData }) {
		try {
			if (!KEY_ENCRYPT || KEY_ENCRYPT.length < 16) {
				throw new ForbiddenError({ message: "Panjang kode enkripsi kurang sesuai, maximum 16 karakter", data: null });
			}

			if (!encryptedData) {
				return;
			}

			const bytes = CryptoJS.AES.decrypt(encryptedData, KEY_ENCRYPT);
			const decryptedValue = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
			return decryptedValue;
		} catch (error) {
			throw new ErrorInFunction({ message: "Proses decrypt gagal, cek key decrypt", data: error });
		}
	}

	static async encodingClient({ data, key_encrypt_client }) {
		try {
			if (!key_encrypt_client || key_encrypt_client.length < 16) {
				throw new ForbiddenError({ message: "Panjang kode enkripsi kurang sesuai, maximum 16 karakter", data: null });
			}

			if (!data) {
				return;
			}

			const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(data), key_encrypt_client).toString();

			return encryptedValue;
		} catch (error) {
			throw new ErrorInFunction({ message: "Proses encrypt gagal, cek key encrypt", data: error });
		}
	}

	static async decodingClient({ encryptedData, key_encrypt_client }) {
		try {
			if (!key_encrypt_client || key_encrypt_client.length < 16) {
				throw new ForbiddenError({ message: "Panjang kode enkripsi kurang sesuai, maximum 16 karakter", data: null });
			}

			if (!encryptedData) {
				return;
			}

			const bytes = CryptoJS.AES.decrypt(encryptedData, key_encrypt_client.toString());
			const stringBytes = bytes.toString(CryptoJS.enc.Utf8);
			const decryptedValue = JSON.parse(stringBytes);
			return decryptedValue;
		} catch (error) {
			throw new ErrorInFunction({ message: "Proses decrypt gagal, cek key decrypt", data: error });
		}
	}

	static async encodingQueryClient({ data, key_encrypt_client }) {
		try {
			if (!key_encrypt_client || key_encrypt_client.length < 16) {
				throw new ForbiddenError({ message: "Panjang kode enkripsi kurang sesuai, maximum 16 karakter", data: null });
			}

			if (!data) {
				return;
			}

			const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(data), key_encrypt_client).toString();
			const encodedData = encodeURIComponent(encryptedValue);
			return encodedData;
		} catch (error) {
			throw new ErrorInFunction({ message: "Proses encrypt gagal, cek key encrypt", data: error });
		}
	}

	static async decodingQueryClient({ encryptedData, key_encrypt_client }) {
		try {
			if (!key_encrypt_client || key_encrypt_client.length < 16) {
				throw new ForbiddenError({ message: "Panjang kode enkripsi kurang sesuai, maximum 16 karakter", data: null });
			}

			if (!encryptedData) {
				return;
			}
			const decodedData = decodeURIComponent(encryptedData);
			const bytes = CryptoJS.AES.decrypt(decodedData, key_encrypt_client.toString());
			const stringBytes = bytes.toString(CryptoJS.enc.Utf8);
			const decryptedValue = JSON.parse(stringBytes);
			return decryptedValue;
		} catch (error) {
			throw new ErrorInFunction({ message: "Proses decrypt gagal, cek key decrypt", data: error });
		}
	}
}

module.exports = Enkripsi;
