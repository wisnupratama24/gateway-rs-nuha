const { DataTypes } = require("sequelize");
const { DB } = require("../../config/db/index");

/**
 * Model Sequelize untuk tabel dashboard_123
 * Menyimpan data jadwal dokter hasil sinkronisasi dari API Eksternal
 */
const dashboard_123 = DB.define(
	"dashboard_123",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		id_dokter: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		tanggal: {
			type: DataTypes.DATEONLY, // YYYY-MM-DD
			allowNull: false,
		},
		jam_mulai: {
			type: DataTypes.STRING(10),
			allowNull: false,
		},

		// Data pendukung
		nama_dokter: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		kode_spesialis: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		nama_spesialis: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		hari: {
			type: DataTypes.STRING(20),
			allowNull: true,
		},
		jam_selesai: {
			type: DataTypes.STRING(10),
			allowNull: true,
		},
		status_praktik: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},

		// Metadata Time
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
		},
	},
	{
		tableName: "dashboard_123",
		schema: "public",
		freezeTableName: true,
		timestamps: false, // Kita manage manual atau gunakan default fields jika mau
		indexes: [
			{
				unique: true,
				fields: ["id_dokter", "tanggal", "jam_mulai"],
			},
		],
	},
);

// dashboard_123.sync({ alter: true }); // Uncomment jika ingin auto-migrate struktur (dev only)

module.exports = dashboard_123;
