const AXIOS_ERROR_HELPER = require("./axiosErrorHelper");

function fromAxiosError(error) {
	if (error.response) {
		// The request was made and the server responded with a status code
		// that falls out of the range of 2xx
		return new AXIOS_ERROR_HELPER({
			statusCode: error.response.status,
			message: error.message,
			data: error.response.data,
			headers: error.response.headers,
			request: error.request,
			config: error.config,
		});
	} else if (error.request) {
		// The request was made but no response was received
		return new AXIOS_ERROR_HELPER({
			statusCode: null,
			message: error.message,
			data: null,
			headers: null,
			request: error.request,
			config: error.config,
		});
	} else {
		// Something happened in setting up the request that triggered an Error
		return new AXIOS_ERROR_HELPER({
			statusCode: null,
			message: error.message,
			data: null,
			headers: null,
			request: null,
			config: error.config,
		});
	}
}

module.exports = fromAxiosError;
