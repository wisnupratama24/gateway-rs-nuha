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
curl http://localhost:3033/dokter/view-table
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

| Field | Type | Keterangan |
|-------|------|------------|
| `booking_id` | INT | Primary Key (Unique) |
| `id_dokter` | INT | FK ke dashboard_123 |
| `tanggal_antrian` | DATE | Tanggal booking |
| `status_booking` | VARCHAR | Status: Aktif/Batal/dll |
| `mulai` / `selesai` | TIME | Jam appointment |

---

## Step 2: Buat Tabel Database

### 2.1 Buat file migration

Buat file baru: `migrations/create_dashboard_239.sql`

```sql
-- ========================================
-- TABEL: dashboard_239 (Booking Pasien)
-- ========================================

CREATE TABLE IF NOT EXISTS dashboard_239 (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Unique identifier dari API
    booking_id INTEGER UNIQUE NOT NULL,
    
    -- Data Dokter
    id_dokter INTEGER,
    nama_dokter VARCHAR(255),
    nama_spesialis VARCHAR(255),
    
    -- Data Pasien
    no_rm VARCHAR(50),
    nama_pasien VARCHAR(255),
    
    -- Data Booking
    tanggal_antrian DATE,
    mulai TIME,
    selesai TIME,
    status_booking VARCHAR(50),
    
    -- Asuransi
    nama_penjamin VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query performa
CREATE INDEX IF NOT EXISTS idx_d239_dokter ON dashboard_239(id_dokter);
CREATE INDEX IF NOT EXISTS idx_d239_tanggal ON dashboard_239(tanggal_antrian);
CREATE INDEX IF NOT EXISTS idx_d239_status ON dashboard_239(status_booking);
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
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        id_dokter: {
            type: DataTypes.INTEGER,
        },
        nama_dokter: {
            type: DataTypes.STRING(255),
        },
        nama_spesialis: {
            type: DataTypes.STRING(255),
        },
        no_rm: {
            type: DataTypes.STRING(50),
        },
        nama_pasien: {
            type: DataTypes.STRING(255),
        },
        tanggal_antrian: {
            type: DataTypes.DATEONLY,
        },
        mulai: {
            type: DataTypes.TIME,
        },
        selesai: {
            type: DataTypes.TIME,
        },
        status_booking: {
            type: DataTypes.STRING(50),
        },
        nama_penjamin: {
            type: DataTypes.STRING(255),
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
     */
    mapBookingData(booking) {
        return {
            booking_id: booking.booking_id,
            id_dokter: booking.id_dokter,
            nama_dokter: booking.nama_dokter,
            nama_spesialis: booking.nama_spesialis,
            no_rm: booking.no_rm,
            nama_pasien: booking.nama_pasien,
            tanggal_antrian: booking.tanggal_antrian,
            mulai: booking.mulai,
            selesai: booking.selesai,
            status_booking: booking.status_booking,
            nama_penjamin: booking.nama_penjamin,
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

Kemudian panggil di `getDashboardStats()` dan tambahkan ke return object.

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
