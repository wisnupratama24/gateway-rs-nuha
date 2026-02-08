# 📚 Workshop: Dashboard Monitoring RS NUHA
## Panduan Teknis - Sinkronisasi & Konsumsi Data

---

## 📋 Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Persiapan Lingkungan](#2-persiapan-lingkungan)
3. [Alur Sinkronisasi Data](#3-alur-sinkronisasi-data)
4. [Mekanisme Token & Retry](#4-mekanisme-token--retry)
5. [Scheduler (Cron Jobs)](#5-scheduler-cron-jobs)
6. [Konsumsi Data Dashboard](#6-konsumsi-data-dashboard)
7. [Referensi API Endpoints](#7-referensi-api-endpoints)
8. [Diagram Visual](#8-diagram-visual)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Gambaran Umum Sistem (Sesi 2)

### 🔗 Konteks Workshop
> *"Mempelajari cara lain dalam memanfaatkan Open API NUHA. Jika di Sesi 1 kita langsung mengkonsumsi data secara real-time, kali ini kita akan menyimpan data terlebih dahulu agar bisa diolah sesuai kebutuhan."*

### ⚔️ Perbandingan Strategi: Direct vs Gateway

| Fitur | Sesi 1: Direct API | Sesi 2: Gateway Sync (Kita Disini) |
|-------|--------------------|---------------------------------------|
| **Sumber Data** | Hit langsung ke API SIMRS | Query ke Database Lokal (Postgres) |
| **Latency** | Tergantung Server RS (500ms - 2s) | Instant (<50ms) |
| **Beban Server** | Tinggi (setiap refresh = hit API) | Ringan (Hit API hanya saat Sync) |
| **Kegunaan** | Cek Status Pasien Real-time, Validasi | Dashboard, Laporan, dsb. |

### 🎯 Apa yang Kita Bangun?

Kita akan membangun **"Bendungan Data"** (Gateway) yang berfungsi:
1.  **Sync Worker:** Menyedot data dari NUHA SIMRS secara berkala (misal: tiap minggu).
2.  **Data Warehouse:** Menyimpan data tersebut ke PostgreSQL lokal.
3.  **API:** Menyajikan data statistik ke Dashboard dari gudang data kita sendiri.

### 🏗️ Arsitektur Sistem

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   NUHA SIMRS    │       │   Gateway RS    │       │    Dashboard    │
│   (Sumber Air)  │◀────▶│     (Pipa)      │─────▶│   (Konsumen)    │
│                 │       │   Node.js Sync  │       │                 │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   PostgreSQL    │
                          │    (Tandon)     │
                          │                 │
                          │   + Redis       │
                          │  (Token Cache)  │
                          └─────────────────┘
```

---

## 2. Persiapan Lingkungan

### 📦 Prasyarat

Pastikan sudah terinstall:
- **Node.js** (v20+) - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/) (Opsional)
- **Text Editor** (VS Code recommended)

### Step 1: Dapatkan Source Code

**Opsi A: Git Clone**
```bash
git clone https://github.com/wisnupratama24/gateway-rs-nuha.git
cd gateway-rs-nuha
```

**Opsi B: Copy dari Google Drive**
1. Download ZIP dari Google Drive
2. Extract ke folder project
3. Buka terminal di folder tersebut

### Step 2: Install Dependencies

```bash
npm install
```

📦 Ini akan menginstall semua package dari `package.json`:
- express, sequelize, pg (database)
- redis (caching)
- axios (HTTP client)
- node-cron (scheduler)
- dotenv (environment)

### Step 3: Jalankan Docker Compose

```bash
docker-compose up -d
```

🐳 Ini akan menjalankan container:
- **gateway-nuha-db** (PostgreSQL:15) → Port `6000`
- **gateway-nuha-redis** (Redis:Alpine) → Port `6001`

**Verifikasi container berjalan:**
```bash
docker ps
```

### Step 4: Setup Environment Variables

```bash
copy .env.example .env
```

**Edit file `.env` sesuai konfigurasi Docker:**

```env
# Server
PORT_EXPRESS=3033
TIMEZONE=Asia/Jakarta

# Database PostgreSQL (⚠️ Perhatikan port Docker!)
DB_HOST=127.0.0.1
DB_PORT=6000
DB_USER=postgres
DB_PASS=postgres
DB_NAME=gateway_nuha_db

# Redis (⚠️ Perhatikan port Docker!)
REDIS_HOST=redis://127.0.0.1:6001

# API External (NUHA SIMRS)
EXTERNAL_API_URL=http://10.100.2.36:7102
EXTERNAL_API_TOKEN=<token_dari_admin>
EXTERNAL_API_KEY=<api_key_dari_admin>
EXTERNAL_API_REFRESH_TOKEN=<refresh_token_dari_admin>
```

> ⚠️ **PENTING:** 
> - Gunakan `127.0.0.1` bukan `localhost` (menghindari IPv6 issue di Windows)
> - Port database adalah `6000` (bukan 5432) sesuai Docker mapping
> - Port redis adalah `6001` (bukan 6379) sesuai Docker mapping

### Step 5: Jalankan Migration Database

**Via DBeaver / Navicat:**
1. Buat koneksi ke PostgreSQL (`127.0.0.1:6000`)
2. Buka database `gateway_nuha_db`
3. Execute SQL file: `migration_dashboard_multi_sync.sql`

**Via Command Line:**
```bash
docker exec -i gateway-nuha-db psql -U postgres -d gateway_nuha_db < migration_dashboard_multi_sync.sql
```

### Step 6: Jalankan Aplikasi

```bash
npm run dev
```

**✅ Expected Output:**
```
Active in port 3033
Redis 1 Connected
Redis 2 Connected
Database OK
[DashboardCron] ✅ Dashboard cron jobs initialized (2 jobs registered)
```

---

## 3. Alur Sinkronisasi Data

### 🔄 Apa itu Sinkronisasi?

Sinkronisasi adalah proses **mengambil data dari NUHA SIMRS** (API) dan **menyimpannya ke database lokal** (PostgreSQL) untuk keperluan dashboard.

### 📊 Alur Sync (Step by Step)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALUR SYNC-JADWAL                            │
└─────────────────────────────────────────────────────────────────────┘

1️⃣ CLIENT                    POST /dashboard/sync-jadwal
        │
        ▼
2️⃣ ROUTER                    router.post("/sync-jadwal", ...)
        │
        ▼
3️⃣ CONTROLLER                triggerSyncJadwal()
        │                      └─> jadwalSyncService.syncJadwalDokter()
        ▼
4️⃣ JADWAL SYNC SERVICE       Load config SYNC_CONFIG.JADWAL_DOKTER
        │                      Load Model Dashboard123
        ▼
5️⃣ BASE SYNC SERVICE         syncData(config, Model, mapFunction)
        │
        ├─▶ STEP 1: Setup Date Range (T-1 s/d T+7)
        ├─▶ STEP 2: Init Pagination (page=1, limit=10)
        │
        └─▶ STEP 3: PAGINATION LOOP ──────────────────────┐
             │                                             │
             ├─▶ Fetch API (DashboardUtil)  ───────▶ [6️⃣ TOKEN]
             ├─▶ Hitung totalPages (jika page==1)          │
             ├─▶ Loop setiap record:                       │
             │    └─▶ upsertRecord()  ─────────────▶ [7️⃣ UPSERT]
             ├─▶ page++, delay 200ms                       │
             └─▶ if (page <= totalPages) ──────────────────┘
        │
        ▼
8️⃣ RESPONSE                  { success: true, stats: { inserted, updated } }
```
Bisa dilihat di folder diagrams

### 🧩 Komponen Sync

| Layer | File | Fungsi |
|-------|------|--------|
| **Router** | `router/index.js` | Menerima request POST |
| **Controller** | `dashboard.controller.js` | Handle request, panggil service |
| **Sync Service** | `jadwal-sync.service.js` | Load config, inisiasi sync |
| **Base Service** | `base-sync.service.js` | Core logic: pagination + upsert |
| **Utility** | `dashboard.util.js` | Token management + API call |
| **Model** | `Dashboard123.model.js` | Sequelize model untuk upsert |

---

## 4. Mekanisme Token & Retry

### 🔑 Token Caching dengan Redis

Sistem mengimplementasikan **token caching** untuk mengurangi hit ke endpoint refresh token:

```javascript
// dashboard.util.js - getToken()

static async getToken() {
    // STEP 1: Cek cache Redis
    let cachedToken = await CLIENT_1.get("open_api_token");
    
    if (cachedToken) {
        // Token ADA di cache → Gunakan langsung
        return JSON.parse(cachedToken);
    } else {
        // Token TIDAK ADA → Refresh dari API
        const response = await axios.post(REFRESH_TOKEN_URL, {}, { headers });
        
        // Simpan ke Redis dengan TTL 12 jam
        await CLIENT_1.set("open_api_token", JSON.stringify(newToken), { EX: 43200 });
        
        return newToken;
    }
}
```

### 🔄 Retry Mechanism (401 Handler)

Jika token expired saat fetch data, sistem otomatis retry:

```javascript
// dashboard.util.js - _fetchWithRetry()

static async _fetchWithRetry(params, retryCount = 0) {
    try {
        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        // Jika error 401 (Unauthorized) dan belum max retry
        if (error.response?.status === 401 && retryCount < MAX_RETRY) {
            // Hapus cache token
            await this._clearTokenCache();
            
            // Retry dengan token baru
            return await this._fetchWithRetry(params, retryCount + 1);
        }
        throw error;
    }
}
```

### 📝 Alur Token Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN MANAGEMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

    Fetch Data Request
           │
           ▼
    ┌──────────────┐     HIT?      ┌────────────────┐
    │ Cek Redis    │──────────────▶│ Gunakan Token  │
    │ Cache        │               │ dari Cache     │
    └──────┬───────┘               └───────┬────────┘
           │ MISS                          │
           ▼                               ▼
    ┌──────────────┐               ┌────────────────┐
    │ Refresh Token│               │ Hit API NUHA   │
    │ dari API     │               │ dengan Token   │
    └──────┬───────┘               └───────┬────────┘
           │                               │
           ▼                               │
    ┌──────────────┐                       │
    │ Simpan ke    │                       │  Error 401?
    │ Redis (12jam)│                       │      │
    └──────────────┘                       ▼      ▼
                                    ┌─────────────────┐
                                    │ Clear Cache     │
                                    │ & Retry (max 3) │
                                    └─────────────────┘
```

---

## 5. Scheduler (Cron Jobs)

### ⏰ Registrasi Cron Jobs

Saat aplikasi startup, cron jobs otomatis diregister:

```javascript
// dashboard.cron.js - initDashboardCron()

const jadwalSchedule = generateCronExpression({
    unit: TIME_UNITS.WEEK,
    interval: 1,    // 1 Minggu sekali
    hour: 0,        // Jam 00:00
    minute: 0
});
// Result: "0 0 */7 * *"

addCronJob({
    name: "JadwalDokterWeeklySync",
    schedule: jadwalSchedule,
    task: async () => {
        await JadwalSyncService.syncJadwalDokter();
    }
});
```

### 📅 Registered Cron Jobs

| Job Name | Schedule | Cron Expression | Deskripsi |
|----------|----------|-----------------|-----------|
| `JadwalDokterWeeklySync` | Minggu 00:00 | `0 0 */7 * *` | Sync jadwal dokter |
| `BookingPasienWeeklySync` | Minggu 00:00 | `0 0 */7 * *` | Sync booking pasien |

### 📝 Cron Expression Cheatsheet

```
 ┌───────────── minute (0 - 59)
 │ ┌─────────── hour (0 - 23)
 │ │ ┌───────── day of month (1 - 31)
 │ │ │ ┌─────── month (1 - 12)
 │ │ │ │ ┌───── day of week (0 - 6)
 │ │ │ │ │
 * * * * *

Contoh:
0 0 */7 * *   → Setiap 7 hari jam 00:00
0 2 * * 0     → Setiap Minggu jam 02:00
*/30 * * * *  → Setiap 30 menit
0 8-17 * * *  → Setiap jam dari 08:00-17:00
```

---

## 6. Konsumsi Data Dashboard

### 📈 Apa itu Dashboard Stats?

Setelah data tersinkronisasi, kita perlu **mengambil data agregat** untuk ditampilkan di dashboard dengan **query SQL yang dioptimasi**.

### 🔗 Relasi Tabel (JOIN)

```sql
SELECT 
    d123.id_dokter,
    d123.nama_dokter,
    COUNT(d239.booking_id) as bookings
FROM dashboard_123 d123
LEFT JOIN dashboard_239 d239
    ON d123.id_dokter = d239.id_dokter           -- Dokter sama
    AND d123.tanggal = DATE(d239.tanggal_antrian) -- Tanggal sama
    AND d123.jam_mulai <= d239.mulai             -- Booking dalam slot
    AND d123.jam_selesai > d239.mulai            -- waktu praktik
    AND d239.status_booking = 'Aktif'
WHERE d123.tanggal = '2026-02-05'
GROUP BY d123.id_dokter, d123.nama_dokter;
```

### 📤 Format Response

```json
{
  "date": "2026-02-05",
  "generatedAt": "2026-02-05T10:15:30+07:00",
  "totals": {
    "doctorsTotal": 58,
    "doctorsPracticing": 56,
    "doctorsNotPracticing": 2,
    "doctorsOnLeave": 0
  },
  "bookingByDoctor": [
    { "doctorId": "101", "doctorName": "dr. Andi", "bookings": 8 },
    { "doctorId": "102", "doctorName": "dr. Budi", "bookings": 3 }
  ],
  "bookingBySpecialization": [
    { "specialization": "ANAK", "bookings": 12 },
    { "specialization": "PENYAKIT DALAM", "bookings": 9 }
  ]
}
```

---

## 7. Referensi API Endpoints

### 🔌 Base URL

```
http://localhost:3033/dashboard
```

### 📝 Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/sync-jadwal` | Sync jadwal dokter |
| `POST` | `/sync-booking` | Sync booking pasien |
| `POST` | `/sync-all` | Sync jadwal + booking |
| `GET` | `/stats` | Get dashboard statistics |
| `GET` | `/stats?tanggal=YYYY-MM-DD` | Get stats untuk tanggal tertentu |

### 📖 Contoh Penggunaan

```bash
# Sync Jadwal Dokter
curl -X POST http://localhost:3033/dashboard/sync-jadwal

# Sync Booking
curl -X POST http://localhost:3033/dashboard/sync-booking

# Sync Semua
curl -X POST http://localhost:3033/dashboard/sync-all

# Get Stats Hari Ini
curl http://localhost:3033/dashboard/stats

# Get Stats Tanggal Tertentu
curl "http://localhost:3033/dashboard/stats?tanggal=2026-02-05"
```

---

## 8. Diagram Visual

### 📊 File Diagram (draw.io)

Tersedia beberapa diagram untuk membantu pemahaman:

| File | Keterangan |
|------|------------|
| `diagrams/installation_flow.drawio` | Alur instalasi dari clone s/d running service |
| `diagrams/ALUR SERVICE SYNC JADWAL.drawio` | Alur detail sync jadwal dokter |
| `diagrams/ALURS SERVICE SCHEDULER.drawio` | Alur scheduler/cron jobs |

### 📂 Struktur Folder Diagrams

```
diagrams/
├── installation_flow.drawio        # Step 1-6 instalasi
├── ALUR SERVICE SYNC JADWAL.drawio # Flow sync manual/cron
└── ALURS SERVICE SCHEDULER.drawio  # Flow scheduler & cron jobs
```

**Cara membuka:**
1. Buka https://app.diagrams.net/
2. File → Import from → Device
3. Pilih file `.drawio` dari folder `diagrams/`

---

## 9. Troubleshooting

### ❌ Redis Error: ECONNREFUSED

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solusi:**
1. Cek port di `.env` → gunakan `6001` (bukan 6379)
2. Pastikan container redis running: `docker ps`
3. Gunakan `127.0.0.1` atau `localhost`

### ❌ Database Error: ECONNREFUSED

```
Error: connect ECONNREFUSED ::1:5432
```

**Solusi:**
1. Cek `DB_PORT` di `.env` → gunakan `6000` (bukan 5432)
2. Cek `DB_HOST` → gunakan `127.0.0.1` (bukan localhost)
3. Pastikan container db running: `docker ps`

### ❌ Token Error: 400/401

```
Error: Request failed with status code 400
```

**Solusi:**
1. Token expired → minta token baru dari admin NUHA
2. Update `EXTERNAL_API_TOKEN` dan `EXTERNAL_API_REFRESH_TOKEN` di `.env`
3. Restart aplikasi: `npm run dev`

### ❌ Docker tidak bisa start

```bash
# Restart Docker Desktop, lalu:
docker-compose down
docker-compose up -d
```

### ❌ Port already in use

```bash
# Cek proses yang menggunakan port
netstat -ano | findstr :3033

# Kill proses (ganti PID dengan yang ditemukan)
taskkill /PID <PID> /F
```

---

## 🎓 Ringkasan Komponen

| Komponen | File | Fungsi |
|----------|------|--------|
| Base Sync | `base-sync.service.js` | Logic inti pagination & upsert |
| Jadwal Sync | `jadwal-sync.service.js` | Sync jadwal dokter |
| Booking Sync | `booking-sync.service.js` | Sync booking pasien |
| Dashboard Util | `dashboard.util.js` | Token caching & API call dengan retry |
| Dashboard Service | `dashboard.service.js` | Query stats dengan JOIN |
| Controller | `dashboard.controller.js` | Handle HTTP requests |
| Router | `router/index.js` | Define endpoints |
| Cron | `cron/dashboard.cron.js` | Scheduled sync jobs |

---

## 🔑 4 Konsep Kunci yang Dipelajari

1. **Pagination** → Fetch data per-halaman untuk menghindari timeout
2. **Token Caching** → Simpan token di Redis, refresh otomatis jika expired
3. **Upsert** → INSERT jika baru, UPDATE jika sudah ada
4. **Scheduler** → Cron jobs untuk sinkronisasi otomatis

---

**🎉 Selamat! Anda telah mempelajari arsitektur service Penerapan Open API RS NUHA.**

*Dokumen Workshop RS NUHA - 2026*
