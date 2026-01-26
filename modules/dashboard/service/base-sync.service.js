const DashboardUtil = require("../util/dashboard.util");
const moment = require("moment");

/**
 * ========================================
 * BASE SYNC SERVICE
 * ========================================
 *
 * Class dasar untuk semua service sinkronisasi dashboard.
 * Berisi core logic yang di-reuse oleh semua sync types:
 * - Pagination loop (fetch semua halaman dari API)
 * - Upsert mechanism (insert or update)
 * - Stats tracking (inserted, updated, total_fetched)
 * - Error handling
 *
 * ========================================
 * CARA PENGGUNAAN:
 * ========================================
 *
 * 1. Buat specialized service yang extends BaseSyncService
 * 2. Load config dari sync.config.js
 * 3. Panggil method syncData() dengan config
 *
 * Contoh:
 * ```javascript
 * class JadwalSyncService extends BaseSyncService {
 *     async syncJadwalDokter() {
 *         const config = SYNC_CONFIG.JADWAL_DOKTER;
 *         const Model = require(`../../../models/dashboard/${config.modelName}.model`);
 *         return this.syncData(config, Model, this.mapJadwalData);
 *     }
 * }
 * ```
 *
 * ========================================
 * DESIGN PATTERN:
 * ========================================
 *
 * Pattern: Template Method Pattern
 * - Base class menyediakan skeleton algorithm (pagination + upsert)
 * - Subclass menyediakan specific implementation (mapping function)
 *
 * Benefits:
 * - DRY (Don't Repeat Yourself)
 * - Konsisten (semua sync menggunakan logic yang sama)
 * - Maintainable (fix bug di 1 tempat, semua sync terfix)
 * - Scalable (tambah sync baru mudah)
 */
class BaseSyncService {
	/**
	 * ========================================
	 * CORE METHOD: Sync Data
	 * ========================================
	 *
	 * Method utama untuk melakukan sinkronisasi data dari API Eksternal.
	 *
	 * ALUR KERJA:
	 * 1. Setup date range (default: hari ini s/d N hari ke depan)
	 * 2. Loop pagination:
	 *    a. Fetch data dari API (1 halaman)
	 *    b. Hitung total pages (hanya di halaman pertama)
	 *    c. Upsert setiap record ke database
	 *    d. Rate limiting (delay 200ms)
	 *    e. Next page
	 * 3. Return statistik sync
	 *
	 * @param {object} config - Konfigurasi sync dari sync.config.js
	 * @param {object} Model - Sequelize model untuk upsert
	 * @param {function} mapFunction - Function untuk mapping data API ke model
	 * @returns {object} Stats: {inserted, updated, total_fetched}
	 */
	async syncData(config, Model, mapFunction) {
		// ========================================
		// STEP 1: Inisialisasi Stats Tracker
		// ========================================
		const stats = {
			inserted: 0, // Jumlah record baru yang di-INSERT
			updated: 0, // Jumlah record existing yang di-UPDATE
			total_fetched: 0, // Total record yang di-fetch dari API
		};

		// ========================================
		// STEP 2: Setup Date Range
		// ========================================
		// Format: YYYY-MM-DDTHH:mm:ss+00:00 (ISO 8601 dengan timezone)
		const startDate = moment().format("YYYY-MM-DD") + "T00:00:00+00:00";
		const endDate = moment().add(config.defaultDaysRange, "days").format("YYYY-MM-DD") + "T23:59:59+00:00";

		console.log(`[BaseSyncService] Sync range: ${startDate} s/d ${endDate} (${config.defaultDaysRange} hari)`);

		// ========================================
		// STEP 3: Inisialisasi Pagination Variables
		// ========================================
		let page = 1; // Halaman saat ini
		let totalPages = 1; // Total halaman (akan di-update setelah fetch pertama)
		const limit = 10; // Records per page (sesuai API)

		console.log(`[BaseSyncService] Memulai sinkronisasi: ${config.description}...`);

		try {
			// ========================================
			// STEP 4: PAGINATION LOOP
			// ========================================
			// Loop ini akan berjalan sampai semua halaman ter-fetch
			while (page <= totalPages) {
				console.log(`[BaseSyncService] Mengambil halaman ${page} dari ${totalPages}...`);

				// -------------------------------------
				// 4a. Fetch Data dari API Eksternal
				// -------------------------------------
				const response = await DashboardUtil.fetchDataFromExternal({
					id_laporan_view: config.id_laporan_view,
					pages: page,
					limit: limit,
					// Gunakan dynamic date field names dari config
					[config.dateFields.start]: startDate,
					[config.dateFields.end]: endDate,
				});

				// -------------------------------------
				// 4b. Hitung Total Pages (Halaman Pertama Saja)
				// -------------------------------------
				if (page === 1) {
					// Fallback check: meta_data bisa di root atau di data
					const metaData = response.data?.meta_data || response.meta_data || {};
					console.log(metaData);
					const count = metaData.count || 0;
					totalPages = Math.ceil(count / limit);
					console.log(`[BaseSyncService] Total data ditemukan: ${count} records (${totalPages} halaman)`);
				}

				// -------------------------------------
				// 4c. Extract Data List
				// -------------------------------------
				const dataList = response.data?.list || [];
				stats.total_fetched += dataList.length;

				// -------------------------------------
				// 4d. Upsert Setiap Record
				// -------------------------------------
				for (const record of dataList) {
					await this.upsertRecord(Model, record, mapFunction, stats);
				}

				// -------------------------------------
				// 4e. Rate Limiting (Hindari 429 Too Many Requests)
				// -------------------------------------
				page++;
				await new Promise((resolve) => setTimeout(resolve, 200)); // Delay 200ms
			}

			// ========================================
			// STEP 5: Log Summary & Return Stats
			// ========================================
			console.log(`[BaseSyncService] Sync selesai!`);
			console.log(`[BaseSyncService] Total fetched: ${stats.total_fetched}`);
			console.log(`[BaseSyncService] Inserted: ${stats.inserted}`);
			console.log(`[BaseSyncService] Updated: ${stats.updated}`);

			return stats;
		} catch (error) {
			// ========================================
			// ERROR HANDLING
			// ========================================
			console.error(`[BaseSyncService] Error fatal:`, error.message);
			throw error; // Re-throw untuk ditangani di controller
		}
	}

	/**
	 * ========================================
	 * HELPER METHOD: Upsert Single Record
	 * ========================================
	 *
	 * Method untuk melakukan INSERT atau UPDATE single record.
	 *
	 * CARA KERJA UPSERT (Sequelize):
	 * - Sequelize akan cek apakah record dengan unique key sudah ada
	 * - Jika TIDAK ADA → INSERT (created = true)
	 * - Jika SUDAH ADA → UPDATE (created = false)
	 *
	 * Note: Unique key sudah didefinisikan di:
	 * - Model (indexes config)
	 * - Migration SQL (UNIQUE CONSTRAINT)
	 *
	 * @param {object} Model - Sequelize model
	 * @param {object} record - Data record dari API
	 * @param {function} mapFunction - Function untuk mapping data
	 * @param {object} stats - Stats tracker object
	 */
	async upsertRecord(Model, record, mapFunction, stats) {
		try {
			// -------------------------------------
			// STEP 1: Mapping Data API → Model
			// -------------------------------------
			// Setiap sync type punya mapping function sendiri
			// karena struktur data API bisa berbeda
			const dataToSave = mapFunction(record);

			// -------------------------------------
			// STEP 2: Sequelize UPSERT
			// -------------------------------------
			// Return: [instance, created]
			// - instance: Record yang ter-insert/update
			// - created: boolean (true = INSERT, false = UPDATE)
			const [, created] = await Model.upsert(dataToSave);

			// -------------------------------------
			// STEP 3: Update Stats
			// -------------------------------------
			if (created) {
				stats.inserted++; // Record baru
			} else {
				stats.updated++; // Record existing (ter-update)
			}
		} catch (error) {
			// Log error tapi tidak throw (skip record yang bermasalah)
			// Ini prevent 1 record rusak membatalkan seluruh sync
			console.error(`[BaseSyncService] Gagal simpan record:`, error.message);
		}
	}
}

module.exports = BaseSyncService;
