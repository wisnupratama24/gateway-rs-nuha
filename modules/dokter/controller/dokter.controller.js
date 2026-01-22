const { successList } = require("../../../helpers/response/responseHelper");
const DokterService = require("../service/dokter.services");
class DokterController {
	static listJadwalDokter(id_laporan_view) {
		return async (req, res, next) => {
			try {
				let { pages, limit, tanggal_awal, tanggal_akhir, id_dokter, kode_spesialis } = req.query;
				const response = await DokterService.getJadwalDokterService({ pages, limit, tanggal_awal, tanggal_akhir, id_laporan_view: id_laporan_view || 123, id_dokter, kode_spesialis });
				res.locals.response = successList({ data: response.data.list, pages: response.data.meta_data.pages, count: response.data.meta_data.count, limit });
			} catch (error) {
				next(error);
			}
			next();
		};
	}
}

module.exports = DokterController;
