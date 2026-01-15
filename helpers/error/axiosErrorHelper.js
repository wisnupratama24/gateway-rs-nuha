class AxiosErrorHelper extends Error {
	constructor({ statusCode, message, data, headers, request, config }) {
		super(message);
		this.statusCode = statusCode;
		this.data = data;
		this.headers = headers;
		this.request = request;
		this.config = config;
	}
}

module.exports = AxiosErrorHelper;
