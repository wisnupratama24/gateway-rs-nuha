let ExcelJS = require("exceljs");
const minio = require("../file/minio");
const Stream = require("stream");

class ExportJs {
	//export excel ke minio
	static exportToSpreadsheets(path, filename, sheet) {
		return new Promise((resolve, reject) => {
			try {
				const stream = new Stream.PassThrough();
				let options = {
					// filename: path + filename + ".xlsx",
					stream: stream,
					useStyles: true,
					useSharedStrings: true,
				};

				let workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);

				for (let j = 0; j < sheet.length; j++) {
					let worksheet = workbook.addWorksheet(sheet[j].sheetname || "Sheet " + j);
					worksheet.columns = sheet[j].headers;
					for (let i = 0; i < sheet[j].data.length; i++) {
						worksheet.addRow(sheet[j].data[i]);
					}
					worksheet.commit();
				}
				workbook.commit();
				const filePath = path;
				const fileName = filename + ".xlsx";

				minio
					.uploadFile(fileName, filePath, stream)
					.then((result) => {
						resolve(result);
					})
					.catch((err) => {
						reject(err);
						console.log("err minion", err);
					});
			} catch (error) {
				reject(error);
			}
		});
	}

	// KONVERSI LANGSUNG DATA EXCEL => DATA OBJEK (TANPA HARUS SIMPAN FILE)
	static async spreadsheetToJson(file) {
		return new Promise((resolve, reject) => {
			const workbook = new ExcelJS.Workbook();
			workbook.xlsx
				.load(file.data)
				.then((workbook) => {
					const jsonData = [];
					workbook.eachSheet((sheet) => {
						const sheetData = {
							sheetname: sheet.name,
							column_data: [],
							row_data: [],
						};
						sheet.eachRow((row, rowIndex) => {
							const rowData = {};
							if (rowIndex === 1) {
								// Header row
								row.eachCell((cell, colIndex) => {
									const columnHeader = cell.value; // Use cell value as column header
									sheetData.column_data.push({
										header: columnHeader,
										key: columnHeader, // Use cell value as key
										width: sheet.getColumn(colIndex).width,
									});
								});
							} else {
								// Data row
								row.eachCell((cell, colIndex) => {
									const columnHeader = sheetData.column_data[colIndex - 1].key;
									const cellValue = cell.value === undefined || cell.value === null || cell.value === "" ? null : cell.value;
									rowData[columnHeader] = cellValue;
								});
								// Add index (row number) to row data
								rowData.index = rowIndex;
								sheetData.row_data.push(rowData);
							}
						});
						jsonData.push(sheetData);
					});

					// Fill missing keys in header row with null
					const headerKeys = jsonData[0].column_data.map((column) => column.key);
					jsonData[0].row_data.forEach((row) => {
						headerKeys.forEach((headerKey) => {
							if (row[headerKey] === undefined) {
								row[headerKey] = null;
							}
						});
					});

					resolve(jsonData);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	// KONVERSI DATA OBJEK => FORMAT WORKBOOK EXCEL JS (AGAR READY TO DOWNLOAD)
	static async jsonToSpreadsheet(data) {
		const workbook = new ExcelJS.Workbook();
		const filename = data.filename;
		const worksheets = data.worksheets;

		worksheets.forEach((sheetData) => {
			const worksheet = workbook.addWorksheet(sheetData.sheetname);

			// MEMBUAT JUDUL KOLOM
			worksheet.columns = sheetData.column_data.map((column) => ({
				header: column.header,
				key: column.key,
				width: column.width,
			}));

			// STYLING JUDUL KOLOM (FONT CENTER, FONT BOLD, FILL COLUMN YELLOW)
			const headerRow = worksheet.getRow(1);
			headerRow.eachCell((cell) => {
				cell.font = { bold: true };
				cell.alignment = { vertical: "middle", horizontal: "center" };
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FFFF00" },
				};
			});

			// TAMBAH BARIS DATA
			const rowData = Array.isArray(sheetData.row_data) ? sheetData.row_data : [];
			rowData.forEach((row) => {
				const validatedRow = {};
				for (let key in row) {
					validatedRow[key] =
						row[key] === "null" || row[key] === null || row[key] === "undefined" || row[key] === undefined || ((row[key] === "NaN" || isNaN(row[key])) && typeof row[key] !== "string")
							? ""
							: row[key];
				}
				worksheet.addRow(validatedRow);
			});
		});

		return { hasil: workbook, nama_file: filename };
	}

	// KONVERSI DATA OBJEK => STREAM BUFFER
	static async jsonToExcelStream(data) {
		const stream = new Stream.PassThrough();
		const options = {
			stream: stream,
			useStyles: true,
			useSharedStrings: true,
		};

		const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
		const filename = data.filename + ".xlsx";
		const worksheets = data.worksheets;

		worksheets.forEach((sheetData) => {
			const worksheet = workbook.addWorksheet(sheetData.sheetname);

			// MEMBUAT JUDUL KOLOM
			worksheet.columns = sheetData.column_data.map((column) => ({
				header: column.header,
				key: column.key,
				width: column.width,
			}));

			// STYLING JUDUL KOLOM (FONT CENTER, FONT BOLD, FILL COLUMN YELLOW)
			const headerRow = worksheet.getRow(1);
			headerRow.eachCell((cell) => {
				cell.font = { bold: true };
				cell.alignment = { vertical: "middle", horizontal: "center" };
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FFFF00" },
				};
			});
			headerRow.commit(); // Commit header row after formatting

			// TAMBAH BARIS DATA
			const rowData = Array.isArray(sheetData.row_data) ? sheetData.row_data : [];
			rowData.forEach((row) => {
				const worksheetRow = worksheet.addRow(row);
				worksheetRow.commit(); // Commit each row immediately after adding it
			});
		});
		workbook.commit();

		return { hasil: stream, nama_file: filename };
	}
}
module.exports = ExportJs;
