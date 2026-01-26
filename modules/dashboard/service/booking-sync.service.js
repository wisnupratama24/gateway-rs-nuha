const BaseSyncService = require("./base-sync.service");
const SYNC_CONFIG = require("../config/sync.config");

/**
 * ========================================
 * BOOKING SYNC SERVICE
 * ========================================
 *
 * Service khusus untuk sinkronisasi data booking/registrasi pasien.
 * Extends BaseSyncService untuk reuse core pagination + upsert logic.
 *
 * Responsibilities:
 * - Sync booking pasien dari API Eksternal (id_laporan_view: 239)
 * - Generate dashboard stats dengan raw SQL (performa optimal)
 * - Grouping by: status_booking, asuransi, dokter, spesialis
 *
 * API Source:
 * - Endpoint: /v3/view/view-table/list-filter-access
 * - Filter: waktu_registrasi_awal, waktu_registrasi_akhir
 * - Table: dashboard_239
 */
class BookingSyncService extends BaseSyncService {
	/**
	 * ========================================
	 * METHOD: Sync Booking Pasien
	 * ========================================
	 *
	 * Trigger sinkronisasi booking pas ien dari API Eksternal.
	 *
	 * ALUR:
	 * 1. Load config dari SYNC_CONFIG.BOOKING_PASIEN
	 * 2. Load Sequelize model dashboard_239
	 * 3. Panggil base syncData() dengan mapping function
	 * 4. Return stats
	 *
	 * @returns {object} Stats: {inserted, updated, total_fetched}
	 */
	async syncBooking() {
		// -------------------------------------
		// STEP 1: Load Config
		// -------------------------------------
		const config = SYNC_CONFIG.BOOKING_PASIEN;

		// -------------------------------------
		// STEP 2: Load Model (Dynamic Import)
		// -------------------------------------
		const Model = require(`../../../models/dashboard/${config.modelName}.model`);

		// -------------------------------------
		// STEP 3: Panggil Base Sync dengan Mapping Function
		// -------------------------------------
		// this.mapBookingData adalah function untuk mapping data API → Model
		// Function ini specific untuk booking (37 fields dari API response)
		return this.syncData(config, Model, this.mapBookingData);
	}

	/**
	 * ========================================
	 * MAPPING FUNCTION: API Data → Model
	 * ========================================
	 *
	 * Function untuk mapping data dari API response ke field Model.
	 * Booking data memiliki 37 fields yang perlu di-map.
	 *
	 * API Response Structure (Simplified):
	 * ```
	 * {
	 *   booking_id: 1435755,
	 *   no_rm: "001063850",
	 *   nama_rm: "DHUWI SETIYARINI",
	 *   status_booking: "Aktif",
	 *   tanggal_antrian: "2026-01-19 07:00:00",
	 *   asuransi: "UMUM",
	 *   dokter: "dr. John Doe",
	 *   ... (27 more fields)
	 * }
	 * ```
	 *
	 * @param {object} booking - Record dari API
	 * @returns {object} Data yang siap di-upsert ke model
	 */
	mapBookingData(booking) {
		return {
			// ========================================
			// UNIQUE KEY
			// ========================================
			booking_id: booking.booking_id,

			// ========================================
			// DATA TAGIHAN & PASIEN
			// ========================================
			id_tagihan: booking.id_tagihan,
			no_rm: booking.no_rm,
			nama_rm: booking.nama_rm,
			nik_rm: booking.nik_rm,
			telepon: booking.telepon,
			no_hp: booking.no_hp,

			// ========================================
			// STATUS & REGISTRASI
			// ========================================
			status_booking: booking.status_booking,
			status_registrasi: booking.status_registrasi,
			tanggal_registrasi_filter: booking.tanggal_registrasi_filter,
			status_rekam_medis: booking.status_rekam_medis,

			// ========================================
			// ANTRIAN & BOOKING INFO
			// ========================================
			tanggal_antrian: booking.tanggal_antrian,
			antrian: booking.antrian,
			asal_booking: booking.asal_booking,

			// ========================================
			// ASURANSI & RUJUKAN
			// ========================================
			no_asuransi: booking.no_asuransi,
			no_rujukan: booking.no_rujukan,
			no_kontrol: booking.no_kontrol,
			asuransi: booking.asuransi,

			// ========================================
			// SPESIALIS & DOKTER INFO
			// ========================================
			code: booking.code, // kode_spesialis
			id_spesialis: booking.id_spesialis,
			spesialis: booking.spesialis,
			id_jadwal_dokter: booking.id_jadwal_dokter,
			id_dokter: booking.id_dokter,
			dokter: booking.dokter,
			poliklinik: booking.poliklinik,

			// ========================================
			// JADWAL PRAKTIK
			// ========================================
			hari: booking.hari,
			mulai: booking.mulai,
			selesai: booking.selesai,

			// ========================================
			// KUOTA
			// ========================================
			kuota: booking.kuota,
			kuota_jkn: booking.kuota_jkn,
			kuota_vip: booking.kuota_vip,

			// ========================================
			// CATATAN & ALASAN
			// ========================================
			catatan: booking.catatan,
			alasan_batal: booking.alasan_batal,

			// ========================================
			// METADATA SISTEM
			// ========================================
			versi: booking.versi,
			inserted_user: booking.inserted_user,
			inserted_date: booking.inserted_date,
			updated_user: booking.updated_user,
			update_date: booking.update_date,

			// ========================================
			// TIMESTAMPS (Manual Update)
			// ========================================
			updated_at: new Date(),
			last_synced_at: new Date(),
		};
	}
}

module.exports = new BookingSyncService();
