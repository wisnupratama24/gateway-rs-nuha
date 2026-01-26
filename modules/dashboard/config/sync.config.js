/**
 * ========================================
 * SYNC CONFIGURATION
 * ========================================
 *
 * File ini berisi konfigurasi untuk semua jenis sinkronisasi
 * yang didukung oleh sistem dashboard.
 *
 * Setiap sync type memiliki:
 * - id_laporan_view: ID laporan di API eksternal
 * - dateFields: Mapping nama field tanggal untuk request
 * - modelName: Nama model Sequelize yang digunakan
 * - uniqueKeys: Field yang digunakan untuk UPSERT
 * - description: Deskripsi singkat
 *
 * ========================================
 * CARA MENAMBAH SYNC TYPE BARU:
 * ========================================
 *
 * 1. Tambahkan konfigurasi di bawah dengan format yang sama
 * 2. Buat model baru di models/dashboard/
 * 3. Buat migration SQL baru
 * 4. Buat specialized service yang extends BaseSyncService
 * 5. Register di cron job (opsional)
 *
 * Contoh:
 * ```
 * LAB_RESULTS: {
 *     id_laporan_view: 300,
 *     dateFields: {
 *         start: 'tanggal_hasil_awal',
 *         end: 'tanggal_hasil_akhir'
 *     },
 *     modelName: 'dashboard_300',
 *     uniqueKeys: ['id_hasil_lab'],
 *     description: 'Sinkronisasi hasil laboratorium'
 * }
 * ```
 */

module.exports = {
	/**
	 * ========================================
	 * SYNC TYPE 1: JADWAL DOKTER
	 * ========================================
	 *
	 * Sinkronisasi jadwal praktik dokter untuk dashboard
	 * - Digunakan untuk menampilkan statistik dokter praktik
	 * - Group by: Spesialisasi
	 * - Schedule: Weekly (Minggu 00:00)
	 */
	JADWAL_DOKTER: {
		// ID Laporan di API Eksternal
		id_laporan_view: 123,

		// Mapping field tanggal untuk request API
		// Key: internal name | Value: field name di API
		dateFields: {
			start: "filter_tanggal_awal", // Field tanggal mulai
			end: "filter_tanggal_akhir", // Field tanggal akhir
		},

		// Nama model Sequelize (nama file tanpa .js)
		modelName: "dashboard_123",

		// Field yang menjadi UNIQUE KEY untuk UPSERT
		// Kombinasi field ini harus unique di table
		uniqueKeys: ["id_dokter", "tanggal", "jam_mulai"],

		// Deskripsi sync type
		description: "Sinkronisasi jadwal praktik dokter",

		// Default range tanggal (hari)
		defaultDaysRange: 14, // Sync 14 hari ke depan
	},

	/**
	 * ========================================
	 * SYNC TYPE 2: BOOKING PASIEN
	 * ========================================
	 *
	 * Sinkronisasi data booking/registrasi pasien
	 * - Digunakan untuk dashboard booking
	 * - Group by: Status, Asuransi, Dokter, Spesialis
	 * - Schedule: Weekly (Minggu 00:00)
	 */
	BOOKING_PASIEN: {
		// ID Laporan di API Eksternal
		id_laporan_view: 239,

		// Mapping field tanggal untuk request API
		dateFields: {
			start: "waktu_registrasi_awal", // Field waktu registrasi mulai
			end: "waktu_registrasi_akhir", // Field waktu registrasi akhir
		},

		// Nama model Sequelize
		modelName: "dashboard_239",

		// Field yang menjadi UNIQUE KEY untuk UPSERT
		uniqueKeys: ["booking_id"],

		// Deskripsi sync type
		description: "Sinkronisasi data booking/registrasi pasien",

		// Default range tanggal (hari)
		defaultDaysRange: 14, // Sync 14 hari ke depan
	},

	/**
	 * ========================================
	 * HELPER: Get Config by Type
	 * ========================================
	 *
	 * Utility function untuk get config berdasarkan sync type
	 *
	 * @param {string} syncType - 'JADWAL_DOKTER' atau 'BOOKING_PASIEN'
	 * @returns {object} Config object
	 *
	 * Usage:
	 * ```
	 * const config = SYNC_CONFIG.getConfig('JADWAL_DOKTER');
	 * ```
	 */
	getConfig(syncType) {
		if (!this[syncType]) {
			throw new Error(`[SYNC_CONFIG] Sync type '${syncType}' tidak ditemukan`);
		}
		return this[syncType];
	},

	/**
	 * ========================================
	 * HELPER: Get All Sync Types
	 * ========================================
	 *
	 * Utility untuk mendapatkan semua sync types yang tersedia
	 *
	 * @returns {array} Array of sync type names
	 *
	 * Usage:
	 * ```
	 * const types = SYNC_CONFIG.getAllTypes();
	 * // Returns: ['JADWAL_DOKTER', 'BOOKING_PASIEN']
	 * ```
	 */
	getAllTypes() {
		// Filter hanya property yang bukan function
		return Object.keys(this).filter((key) => typeof this[key] !== "function");
	},
};
