const BaseSyncService = require("./base-sync.service");
const SYNC_CONFIG = require("../config/sync.config");

/**
 * ========================================
 * JADWAL SYNC SERVICE
 * ========================================
 *
 * Service khusus untuk sinkronisasi jadwal praktik dokter.
 * Extends BaseSyncService untuk reuse core pagination + upsert logic.
 *
 * Responsibilities:
 * - Sync jadwal dokter dari API Eksternal (id_laporan_view: 123)
 * - Generate dashboard stats dengan raw SQL (performa optimal)
 * - Grouping by spesialisasi
 *
 * API Source:
 * - Endpoint: /v3/view/view-table/list-filter-access
 * - Filter: filter_tanggal_awal, filter_tanggal_akhir
 * - Table: dashboard_123
 */
class JadwalSyncService extends BaseSyncService {
	/**
	 * ========================================
	 * METHOD: Sync Jadwal Dokter
	 * ========================================
	 *
	 * Trigger sinkronisasi jadwal dokter dari API Eksternal.
	 *
	 * ALUR:
	 * 1. Load config dari SYNC_CONFIG.JADWAL_DOKTER
	 * 2. Load Sequelize model dashboard_123
	 * 3. Panggil base syncData() dengan mapping function
	 * 4. Return stats
	 *
	 * @returns {object} Stats: {inserted, updated, total_fetched}
	 */
	async syncJadwalDokter() {
		// -------------------------------------
		// STEP 1: Load Config
		// -------------------------------------
		const config = SYNC_CONFIG.JADWAL_DOKTER;

		// -------------------------------------
		// STEP 2: Load Model (Dynamic Import)
		// -------------------------------------
		// Kenapa dynamic? Agar config bisa flexible
		// Ganti modelName di config → otomatis ganti model
		const Model = require(`../../../models/dashboard/${config.modelName}.model`);

		// -------------------------------------
		// STEP 3: Panggil Base Sync dengan Mapping Function
		// -------------------------------------
		// this.mapJadwalData adalah function untuk mapping data API → Model
		// Function ini specific untuk jadwal dokter (field names berbeda)
		return this.syncData(config, Model, this.mapJadwalData);
	}

	/**
	 * ========================================
	 * MAPPING FUNCTION: API Data → Model
	 * ========================================
	 *
	 * Function untuk mapping data dari API response ke field Model.
	 * Setiap sync type punya mapping function sendiri karena
	 * struktur data API bisa berbeda.
	 *
	 * API Response Structure (Contoh):
	 * ```
	 * {
	 *   id_dokter: 57,
	 *   tanggal_char: "2026-01-19",
	 *   time_start: "16:00",
	 *   time_finish: "18:00",
	 *   nama_dokter: "dr. John Doe",
	 *   kode_spesialis: "SAR",
	 *   nama_spesialis: "SARAF",
	 *   day_name: "senin",
	 *   status_praktik: "Aktif"
	 * }
	 * ```
	 *
	 * @param {object} jadwal - Record dari API
	 * @returns {object} Data yang siap di-upsert ke model
	 */
	mapJadwalData(jadwal) {
		return {
			// ========================================
			// UNIQUE KEY (3 field gabungan)
			// ========================================
			id_dokter: jadwal.id_dokter,
			tanggal: jadwal.tanggal_char, // Format: YYYY-MM-DD
			jam_mulai: jadwal.time_start, // Format: HH:mm

			// ========================================
			// DATA PENDUKUNG
			// ========================================
			nama_dokter: jadwal.nama_dokter,
			kode_spesialis: jadwal.kode_spesialis,
			nama_spesialis: jadwal.nama_spesialis,
			hari: jadwal.day_name,
			jam_selesai: jadwal.time_finish,
			status_praktik: jadwal.status_praktik,

			// ========================================
			// TIMESTAMPS (Manual Update)
			// ========================================
			// Karena timestamps: false di model config
			updated_at: new Date(),
			last_synced_at: new Date(),
		};
	}
}

module.exports = new JadwalSyncService();
