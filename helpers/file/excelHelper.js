const formatResponse = require("../response/responseHelper");

class ExcelHelper {
	static download(res, workbook, filename) {
		try {
			res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
			res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
			return workbook.xlsx.write(res).then(function () {});
		} catch (error) {
			res.status(500).json(formatResponse.error_server(error));
		}
	}
}

module.exports = ExcelHelper;
