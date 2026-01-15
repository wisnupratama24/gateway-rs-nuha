let jwt = require("../../helpers/jwt/jwt");
const { UnauthorizedError } = require("../../helpers/error");

async function authRegulerHandler(req, res, next) {
	try {
		if (res.headersSent) {
			// Jika headers telah dikirimkan, lanjutkan ke middleware selanjutnya
			return next();
		} else if (req.headers.token) {
			let headersToken = req.headers.token;
			let hasil = await jwt.verifyToken({ token: headersToken });
			req.headers.user = hasil;
			return next();
		} else {
			// 401 Unauthorized - tidak ada token
			throw new UnauthorizedError({ message: "Anda belum login" });
		}
	} catch (error) {
		next(error); // Tangani kesalahan dengan memanggil next() dengan parameter error
	}
}

module.exports = {
	authRegulerHandler,
};
