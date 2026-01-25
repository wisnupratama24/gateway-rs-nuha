async function SuccessHandler(req, res, next) {
	if (res.headersSent) {
		// If headers have already been sent, just call the next middleware
		return next();
	} else if (res.locals?.response) {
		let dataResponse = res.locals.response;
		res.status(200).json(dataResponse);
	} else {
		return res.status(500).json({
			data: null,
			meta_data: {
				status: 500,
				message: "Tidak ditemukan response dari server ",
			},
		});
	}
}

module.exports = SuccessHandler;
