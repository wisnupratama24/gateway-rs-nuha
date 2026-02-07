# 🛠️ Workshop Hands-On: Membuat Booking Sync

Panduan step-by-step untuk membuat fitur **Sync Booking Pasien** dari awal sampai selesai.

---

## 📋 Overview

Anda akan membangun fitur sync booking yang meliputi:
1. Memanggil API eksternal
2. Membuat tabel database
3. Membuat Model Sequelize
4. Membuat Service sync
5. Menambahkan ke Controller, Router, dan Scheduler

**Referensi:** Lihat implementasi `jadwal-sync` sebagai contoh.

---

## Step 1: Analisa Response API

Sebelum coding, pahami dulu struktur data dari API.

### 1.1 Panggil API untuk melihat response

```bash
# Gunakan endpoint yang sudah ada untuk test
curl --location --globoff '{{base_url}}/v3/view/view-table/list-filter-access' \
--header 'Accept: application/json, text/plain, */*' \
--header 'Accept-Language: id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7' \
--header 'Connection: keep-alive' \
--header 'Content-Type: application/json' \
--header 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' \
--header 'token: {{token}}' \
--header 'x-api-key: {{api_key}}' \
--data '{
    "id_laporan_view": 239,
    "pages": 1,
    "limit": 10,
    "waktu_registrasi_awal": "2026-02-01T17:00:00+00:00",
    "waktu_registrasi_akhir": "2026-02-10T17:00:00+00:00"
}'
```

### 1.2 Struktur Response Booking (id_laporan_view: 239)

```json
{
  "count": 434,
  "limit": 10,
  "page": 1,
  "list": [
    {
      "booking_id": 1435755,
      "id_dokter": 48,
      "nama_dokter": "dr. Ahmad",
      "no_rm": "00123456",
      "nama_pasien": "Budi Santoso",
      "status_booking": "Aktif",
      "tanggal_antrian": "2026-02-06",
      "mulai": "08:00:00",
      "selesai": "08:15:00",
      // ... 37 fields total
    }
  ]
}
```

### 1.3 Field Penting untuk Booking

| Kategori | Field | Type | Keterangan |
| -------- | ----- | ---- | ---------- |
| **Key** | `booking_id` | INT | Primary Key (Unique dari API) |
| **Pasien** | `no_rm`, `nama_rm`, `nik_rm` | VARCHAR | Data rekam medis pasien |
| **Kontak** | `telepon`, `no_hp` | VARCHAR | Nomor kontak pasien |
| **Status** | `status_booking`, `status_registrasi` | VARCHAR | Status booking/registrasi |
| **Antrian** | `tanggal_antrian`, `antrian` | TIMESTAMP, VARCHAR | Info antrian pasien |
| **Asuransi** | `asuransi`, `no_asuransi`, `no_rujukan` | VARCHAR | Data penjamin |
| **Dokter** | `id_dokter`, `dokter`, `id_spesialis`, `spesialis` | INT, VARCHAR | Info dokter & spesialis |
| **Jadwal** | `hari`, `mulai`, `selesai` | VARCHAR | Jadwal appointment |
| **Kuota** | `kuota`, `kuota_jkn`, `kuota_vip` | INT | Kuota slot |

> **Note:** Total ada **40+ field** di tabel ini. Lihat `migration_dashboard_multi_sync.sql` untuk daftar lengkap.

---

## Step 2: Buat Tabel Database

### 2.1 Buat file migration

Buat file baru: `migrations/create_dashboard_239.sql`

```sql
-- File: docs/migration_dashboard_multi_sync.sql (bagian dashboard_239)
-- Jalankan file lengkap yang sudah disediakan!

CREATE TABLE IF NOT EXISTS public.dashboard_239 (
    -- PRIMARY KEY
    id SERIAL4 PRIMARY KEY,
    
    -- UNIQUE KEY: booking_id (dari API)
    booking_id INTEGER NOT NULL UNIQUE,
    
    -- DATA TAGIHAN & PASIEN
    id_tagihan INTEGER,
    no_rm VARCHAR(50),
    nama_rm VARCHAR(255),
    nik_rm VARCHAR(50),
    telepon VARCHAR(50),
    no_hp VARCHAR(50),
    
    -- STATUS & REGISTRASI
    status_booking VARCHAR(50),
    status_registrasi VARCHAR(100),
    tanggal_registrasi_filter TIMESTAMP,
    status_rekam_medis VARCHAR(100),
    
    -- ANTRIAN & BOOKING INFO
    tanggal_antrian TIMESTAMP,
    antrian VARCHAR(50),
    asal_booking VARCHAR(50),
    
    -- ASURANSI & RUJUKAN
    no_asuransi VARCHAR(100),
    no_rujukan VARCHAR(100),
    no_kontrol VARCHAR(100),
    asuransi VARCHAR(100),
    
    -- SPESIALIS & DOKTER INFO
    code VARCHAR(50),               -- kode_spesialis
    id_spesialis INTEGER,
    spesialis VARCHAR(100),
    id_jadwal_dokter INTEGER,
    id_dokter INTEGER,
    dokter VARCHAR(255),
    poliklinik VARCHAR(100),
    
    -- JADWAL PRAKTIK
    hari VARCHAR(20),
    mulai VARCHAR(10),              -- jam mulai
    selesai VARCHAR(10),            -- jam selesai
    
    -- KUOTA
    kuota INTEGER,
    kuota_jkn INTEGER,
    kuota_vip INTEGER,
    
    -- CATATAN & ALASAN
    catatan TEXT,
    alasan_batal TEXT,
    
    -- METADATA SISTEM
    versi VARCHAR(10),
    inserted_user VARCHAR(100),
    inserted_date TIMESTAMP,
    updated_user VARCHAR(100),
    update_date TIMESTAMP,
    
    -- TIMESTAMPS SYNC
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_dashboard_239_tanggal_antrian ON public.dashboard_239(tanggal_antrian);
CREATE INDEX IF NOT EXISTS idx_dashboard_239_status_booking ON public.dashboard_239(status_booking);
CREATE INDEX IF NOT EXISTS idx_dashboard_239_id_dokter ON public.dashboard_239(id_dokter);
CREATE INDEX IF NOT EXISTS idx_dashboard_239_id_spesialis ON public.dashboard_239(id_spesialis);
CREATE INDEX IF NOT EXISTS idx_dashboard_239_asuransi ON public.dashboard_239(asuransi);
```

### 2.2 Jalankan Migration

```bash
# Via DBeaver/Navicat: Execute SQL file
# Atau via command line:
docker exec -i gateway-nuha-db psql -U postgres -d gateway_nuha_db < migrations/create_dashboard_239.sql
```

---

## Step 3: Buat Sequelize Model

### 3.1 Buat file model

Buat file baru: `models/dashboard/dashboard_239.model.js`

```javascript
const { DataTypes } = require("sequelize");
const { DB } = require("../../config/db/index");

/**
 * MODEL: Dashboard 239 (Booking Pasien)
 */
const Dashboard239 = DB.define(
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
        // UNIQUE KEY: booking_id (dari API)
        // ========================================
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        // ========================================
        // DATA TAGIHAN & PASIEN
        // ========================================
        id_tagihan: {
            type: DataTypes.INTEGER,
        },
        no_rm: {
            type: DataTypes.STRING(50),
        },
        nama_rm: {
            type: DataTypes.STRING(255),
        },
        nik_rm: {
            type: DataTypes.STRING(50),
        },
        telepon: {
            type: DataTypes.STRING(50),
        },
        no_hp: {
            type: DataTypes.STRING(50),
        },
        // ========================================
        // STATUS & REGISTRASI
        // ========================================
        status_booking: {
            type: DataTypes.STRING(50),
        },
        status_registrasi: {
            type: DataTypes.STRING(100),
        },
        tanggal_registrasi_filter: {
            type: DataTypes.DATE,
        },
        status_rekam_medis: {
            type: DataTypes.STRING(100),
        },
        // ========================================
        // ANTRIAN & BOOKING INFO
        // ========================================
        tanggal_antrian: {
            type: DataTypes.DATE,
        },
        antrian: {
            type: DataTypes.STRING(50),
        },
        asal_booking: {
            type: DataTypes.STRING(50),
        },
        // ========================================
        // ASURANSI & RUJUKAN
        // ========================================
        no_asuransi: {
            type: DataTypes.STRING(100),
        },
        no_rujukan: {
            type: DataTypes.STRING(100),
        },
        no_kontrol: {
            type: DataTypes.STRING(100),
        },
        asuransi: {
            type: DataTypes.STRING(100),
        },
        // ========================================
        // SPESIALIS & DOKTER INFO
        // ========================================
        code: {
            type: DataTypes.STRING(50),     // kode_spesialis
        },
        id_spesialis: {
            type: DataTypes.INTEGER,
        },
        spesialis: {
            type: DataTypes.STRING(100),
        },
        id_jadwal_dokter: {
            type: DataTypes.INTEGER,
        },
        id_dokter: {
            type: DataTypes.INTEGER,
        },
        dokter: {
            type: DataTypes.STRING(255),
        },
        poliklinik: {
            type: DataTypes.STRING(100),
        },
        // ========================================
        // JADWAL PRAKTIK
        // ========================================
        hari: {
            type: DataTypes.STRING(20),
        },
        mulai: {
            type: DataTypes.STRING(10),     // jam mulai
        },
        selesai: {
            type: DataTypes.STRING(10),     // jam selesai
        },
        // ========================================
        // KUOTA
        // ========================================
        kuota: {
            type: DataTypes.INTEGER,
        },
        kuota_jkn: {
            type: DataTypes.INTEGER,
        },
        kuota_vip: {
            type: DataTypes.INTEGER,
        },
        // ========================================
        // CATATAN & ALASAN
        // ========================================
        catatan: {
            type: DataTypes.TEXT,
        },
        alasan_batal: {
            type: DataTypes.TEXT,
        },
        // ========================================
        // METADATA SISTEM
        // ========================================
        versi: {
            type: DataTypes.STRING(10),
        },
        inserted_user: {
            type: DataTypes.STRING(100),
        },
        inserted_date: {
            type: DataTypes.DATE,
        },
        updated_user: {
            type: DataTypes.STRING(100),
        },
        update_date: {
            type: DataTypes.DATE,
        },
        // ========================================
        // TIMESTAMPS SYNC (Dikelola oleh sistem sync)
        // ========================================
        last_synced_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "dashboard_239",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Dashboard239;
```

---

## Step 4: Tambah Config di sync.config.js

Buka file `modules/dashboard/config/sync.config.js` dan tambahkan:

```javascript
/**
 * SYNC TYPE 2: BOOKING PASIEN
 */
BOOKING_PASIEN: {
    id_laporan_view: 239,
    
    dateFields: {
        start: "waktu_registrasi_awal",
        end: "waktu_registrasi_akhir",
    },
    
    modelName: "dashboard_239",
    
    uniqueKeys: ["booking_id"],
    
    description: "Sinkronisasi data booking/registrasi pasien",
    
    defaultDaysRange: 14,
},
```

---

## Step 5: Buat Booking Sync Service

### 5.1 Buat file service

Buat file baru: `modules/dashboard/service/booking-sync.service.js`

```javascript
const BaseSyncService = require("./base-sync.service");
const SYNC_CONFIG = require("../config/sync.config");

/**
 * BOOKING SYNC SERVICE
 * Extends BaseSyncService untuk sinkronisasi booking pasien.
 */
class BookingSyncService extends BaseSyncService {
    /**
     * Sync Booking Pasien
     */
    async syncBooking() {
        // Load config
        const config = SYNC_CONFIG.BOOKING_PASIEN;
        
        // Load model dinamis
        const Model = require(`../../../models/dashboard/${config.modelName}.model`);
        
        // Panggil base syncData dengan mapping function
        return this.syncData(config, Model, this.mapBookingData);
    }

    /**
     * Mapping function: API Response → Model fields
     * Memetakan semua field dari response API ke field tabel database
     */
    mapBookingData(booking) {
        return {
            // UNIQUE KEY
            booking_id: booking.booking_id,
            // DATA TAGIHAN & PASIEN
            id_tagihan: booking.id_tagihan,
            no_rm: booking.no_rm,
            nama_rm: booking.nama_rm,
            nik_rm: booking.nik_rm,
            telepon: booking.telepon,
            no_hp: booking.no_hp,
            // STATUS & REGISTRASI
            status_booking: booking.status_booking,
            status_registrasi: booking.status_registrasi,
            tanggal_registrasi_filter: booking.tanggal_registrasi_filter,
            status_rekam_medis: booking.status_rekam_medis,
            // ANTRIAN & BOOKING INFO
            tanggal_antrian: booking.tanggal_antrian,
            antrian: booking.antrian,
            asal_booking: booking.asal_booking,
            // ASURANSI & RUJUKAN
            no_asuransi: booking.no_asuransi,
            no_rujukan: booking.no_rujukan,
            no_kontrol: booking.no_kontrol,
            asuransi: booking.asuransi,
            // SPESIALIS & DOKTER INFO
            code: booking.code,
            id_spesialis: booking.id_spesialis,
            spesialis: booking.spesialis,
            id_jadwal_dokter: booking.id_jadwal_dokter,
            id_dokter: booking.id_dokter,
            dokter: booking.dokter,
            poliklinik: booking.poliklinik,
            // JADWAL PRAKTIK
            hari: booking.hari,
            mulai: booking.mulai,
            selesai: booking.selesai,
            // KUOTA
            kuota: booking.kuota,
            kuota_jkn: booking.kuota_jkn,
            kuota_vip: booking.kuota_vip,
            // CATATAN & ALASAN
            catatan: booking.catatan,
            alasan_batal: booking.alasan_batal,
            // METADATA SISTEM
            versi: booking.versi,
            inserted_user: booking.inserted_user,
            inserted_date: booking.inserted_date,
            updated_user: booking.updated_user,
            update_date: booking.update_date,
        };
    }
}

module.exports = new BookingSyncService();
```

---

## Step 6: Tambah Controller Method

Buka `modules/dashboard/controller/dashboard.controller.js` dan tambahkan:

```javascript
// Di bagian import, tambahkan:
const BookingSyncService = require("../service/booking-sync.service");

// Tambahkan method baru:
static triggerSyncBooking() {
    return async (req, res, next) => {
        try {
            console.log("[DashboardController] Trigger manual sync: Booking Pasien");
            
            const result = await BookingSyncService.syncBooking();
            
            res.status(200).json({
                meta_data: {
                    status: 200,
                    message: "Sinkronisasi booking pasien berhasil.",
                },
                data: result,
            });
        } catch (error) {
            console.error("[DashboardController] Error:", error.message);
            next(error);
        }
    };
}
```

---

## Step 7: Tambah Router Endpoint

Buka `modules/dashboard/router/index.js` dan tambahkan:

```javascript
// Sync Booking Pasien
// POST /dashboard/sync-booking
router.post("/sync-booking", DashboardController.triggerSyncBooking());
```

---

## Step 8: Test Manual Sync

### 8.1 Restart server

```bash
npm run dev
```

### 8.2 Test endpoint

```bash
curl -X POST http://localhost:3033/dashboard/sync-booking
```

### 8.3 Expected Response

```json
{
  "meta_data": {
    "status": 200,
    "message": "Sinkronisasi booking pasien berhasil."
  },
  "data": {
    "inserted": 150,
    "updated": 0,
    "total_fetched": 150
  }
}
```

### 8.4 Cek data di database

```sql
SELECT COUNT(*) FROM dashboard_239;
SELECT * FROM dashboard_239 LIMIT 5;
```

---

## Step 9: Tambah Query Stats Dashboard

Buka `modules/dashboard/service/dashboard.service.js` dan tambahkan method:

### 9.1 Get Booking by Doctor

```javascript
/**
 * Get Booking by Doctor (JOIN query)
 */
static async _getBookingByDoctor(targetDate) {
    const results = await DB.query(
        `
        SELECT 
            d123.id_dokter as doctor_id,
            d123.nama_dokter as doctor_name,
            COUNT(d239.booking_id) as bookings
        FROM dashboard_123 d123
        LEFT JOIN dashboard_239 d239
            ON d123.id_dokter = d239.id_dokter
            AND d123.tanggal = DATE(d239.tanggal_antrian)
            AND d239.status_booking = 'Aktif'
        WHERE d123.tanggal = :targetDate
        GROUP BY d123.id_dokter, d123.nama_dokter
        ORDER BY bookings DESC
        `,
        {
            replacements: { targetDate },
            type: DB.QueryTypes.SELECT,
        }
    );

    return results.map((row) => ({
        doctorId: String(row.doctor_id),
        doctorName: row.doctor_name,
        bookings: parseInt(row.bookings),
    }));
}
```

### 9.2 Get Booking by Specialization

```javascript
/**
 * Get Booking by Specialization (JOIN query)
 */
static async _getBookingBySpecialization(targetDate) {
    const results = await DB.query(
        `
        SELECT 
            d239.id_spesialis as specialization_id,
            d239.spesialis as specialization_name,
            COUNT(d239.booking_id) as bookings
        FROM dashboard_239 d239
        WHERE DATE(d239.tanggal_antrian) = :targetDate
            AND d239.status_booking = 'Aktif'
        GROUP BY d239.id_spesialis, d239.spesialis
        ORDER BY bookings DESC
        `,
        {
            replacements: { targetDate },
            type: DB.QueryTypes.SELECT,
        }
    );

    return results.map((row) => ({
        specializationId: String(row.specialization_id),
        specializationName: row.specialization_name,
        bookings: parseInt(row.bookings),
    }));
}
```

### 9.3 Integrasikan ke getDashboardStats()

Panggil kedua method di `getDashboardStats()` dan tambahkan ke return object:

---

## Step 10: Tambah ke Scheduler

Buka `modules/dashboard/cron/dashboard.cron.js` dan tambahkan:

```javascript
// Import
const BookingSyncService = require("../service/booking-sync.service");

// Di dalam initDashboardCron(), tambahkan:
const bookingSchedule = generateCronExpression({
    unit: TIME_UNITS.WEEK,
    interval: 1,
    hour: 0,
    minute: 0,
});

addCronJob({
    name: "BookingPasienWeeklySync",
    schedule: bookingSchedule,
    task: async () => {
        console.log("[Cron] Memulai Sinkronisasi: Booking Pasien...");
        try {
            const result = await BookingSyncService.syncBooking();
            console.log(`[Cron] ✅ Booking Sync Selesai. Updated: ${result.updated}`);
        } catch (error) {
            console.error("[Cron] ❌ Booking Sync Gagal:", error.message);
        }
    },
});
```

---

## ✅ Checklist Selesai

- [ ] Step 1: Analisa API Response
- [ ] Step 2: Buat Tabel Database
- [ ] Step 3: Buat Sequelize Model
- [ ] Step 4: Tambah Config
- [ ] Step 5: Buat Sync Service
- [ ] Step 6: Tambah Controller Method
- [ ] Step 7: Tambah Router Endpoint
- [ ] Step 8: Test Manual Sync
- [ ] Step 9: Tambah Query Stats
- [ ] Step 10: Tambah Scheduler

---

## 🎉 Selamat!

Anda telah berhasil membuat fitur Booking Sync dari awal.

**Konsep yang dipelajari:**
1. **API Analysis** - Memahami struktur response
2. **Database Design** - Membuat tabel dengan index
3. **Sequelize Model** - ORM mapping
4. **Service Pattern** - Extends base class
5. **Controller/Router** - HTTP handling
6. **Scheduler** - Cron job automation

*Workshop RS NUHA - 2026*
