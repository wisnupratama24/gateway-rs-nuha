const { DataTypes } = require("sequelize");
const { DB } = require("../../config/db/index");

/**
 * ========================================
 * MODEL: dashboard_239 (Booking Pasien Sync)
 * ========================================
 *
 * Purpose:
 *   Model Sequelize untuk tabel dashboard_239
 *   Menyimpan data booking pasien hasil sinkronisasi dari API Eksternal
 *
 * API Source:
 *   - Endpoint: /v3/view/view-table/list-filter-access
 *   - id_laporan_view: 239
 *   - Filter: waktu_registrasi_awal, waktu_registrasi_akhir
 *
 * Unique Key:
 *   - booking_id (untuk UPSERT mechanism)
 *
 * Use Cases:
 *   - Dashboard booking/registrasi pasien
 *   - Stats by status, asuransi, dokter, spesialis
 */
const dashboard_239 = DB.define(
	"dashboard_239",
	{
		// ========================================
		// PRIMARY KEY
		// ========================================
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},

		// ========================================
		// UNIQUE KEY (PENTING untuk UPSERT!)
		// ========================================
		booking_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
			comment: "ID Booking dari sistem eksternal (UNIQUE)",
		},

		// ========================================
		// DATA TAGIHAN & PASIEN
		// ========================================
		id_tagihan: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		no_rm: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		nama_rm: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		nik_rm: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		telepon: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		no_hp: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},

		// ========================================
		// STATUS & REGISTRASI
		// ========================================
		status_booking: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Status booking: Aktif/Batal/dll",
		},
		status_registrasi: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		tanggal_registrasi_filter: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		status_rekam_medis: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},

		// ========================================
		// ANTRIAN & BOOKING INFO
		// ========================================
		tanggal_antrian: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: "Tanggal antrian (untuk filter dashboard)",
		},
		antrian: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Nomor antrian (misal: BF - 31)",
		},
		asal_booking: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Mobile/Onsite/dll",
		},

		// ========================================
		// ASURANSI & RUJUKAN
		// ========================================
		no_asuransi: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		no_rujukan: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		no_kontrol: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		asuransi: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "BPJS/UMUM/dll",
		},

		// ========================================
		// SPESIALIS & DOKTER INFO
		// ========================================
		code: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Kode spesialis (misal: SAR, JAN)",
		},
		id_spesialis: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		spesialis: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		id_jadwal_dokter: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		id_dokter: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		dokter: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		poliklinik: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},

		// ========================================
		// JADWAL PRAKTIK
		// ========================================
		hari: {
			type: DataTypes.STRING(20),
			allowNull: true,
		},
		mulai: {
			type: DataTypes.STRING(10),
			allowNull: true,
			comment: "Jam mulai praktik",
		},
		selesai: {
			type: DataTypes.STRING(10),
			allowNull: true,
			comment: "Jam selesai praktik",
		},

		// ========================================
		// KUOTA
		// ========================================
		kuota: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		kuota_jkn: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		kuota_vip: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},

		// ========================================
		// CATATAN & ALASAN
		// ========================================
		catatan: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		alasan_batal: {
			type: DataTypes.TEXT,
			allowNull: true,
		},

		// ========================================
		// METADATA SISTEM
		// ========================================
		versi: {
			type: DataTypes.STRING(10),
			allowNull: true,
		},
		inserted_user: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		inserted_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		updated_user: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		update_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},

		// ========================================
		// TIMESTAMPS SYNC (Dikelola sistem sync)
		// ========================================
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		last_synced_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: "Timestamp terakhir sync dari API",
		},
	},
	{
		// ========================================
		// TABLE OPTIONS
		// ========================================
		tableName: "dashboard_239",
		schema: "public",
		freezeTableName: true,
		timestamps: false, // Kita manage manual

		// Indexes sudah didefinisikan di migration SQL
		// Sequelize hanya perlu tahu unique constraint
		indexes: [
			{
				unique: true,
				fields: ["booking_id"],
				name: "dashboard_239_booking_id_key",
			},
		],
	},
);

/**
 * ========================================
 * SYNC OPTIONS (Development Only)
 * ========================================
 *
 * Uncomment untuk auto-migrate struktur table
 * PERINGATAN: Jangan gunakan di production!
 */
// dashboard_239.sync({ alter: true });

module.exports = dashboard_239;
