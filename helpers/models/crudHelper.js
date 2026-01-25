const MOMENT = require("moment");
const CUSTOM = require("../utils/custom");

class CrudAddition {
	static helper_create(req) {
		return {
			createdName: req.headers?.user?.nama_lengkap || "DEFAULT", //req.headers.user.nama_lengkap,
			createdCode: `${CUSTOM.format_ip(req.ip)}`, //req.ip_client,
			createdBy: req.headers?.user?.id_ms_users || 1, //req.headers.user.id_ms_users,
		};
	}
	static helper_update(req) {
		return {
			updatedName: req.headers?.user?.nama_lengkap || "DEFAULT", //req.headers.user.nama_lengkap,
			updatedCode: `${CUSTOM.format_ip(req.ip)}`, //req.ip_client,
			updatedBy: req.headers?.user?.id_ms_users || 1, //req.headers.user.id_ms_users,
		};
	}
	static helper_delete(req) {
		return {
			deletedName: req.headers?.user?.nama_lengkap || "DEFAULT", //req.headers.user.nama_lengkap,
			deletedCode: `${CUSTOM.format_ip(req.ip)}`, //req.ip_client,
			deletedBy: req.headers?.user?.id_ms_users || 1, //req.headers.user.id_ms_users,
			deletedAt: MOMENT(),
		};
	}
}

module.exports = CrudAddition;
