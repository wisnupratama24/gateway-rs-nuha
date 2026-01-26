# 📚 Workshop: Dashboard Monitoring RS NUHA
## Panduan Teknis - Sinkronisasi & Konsumsi Data

---

## 📋 Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Persiapan Lingkungan](#2-persiapan-lingkungan)
3. [Alur Sinkronisasi Data](#3-alur-sinkronisasi-data)
4. [Konsumsi Data Dashboard](#4-konsumsi-data-dashboard)
5. [Referensi API Endpoints](#5-referensi-api-endpoints)

---

## 1. Gambaran Umum Sistem

### 🎯 Apa yang Kita Bangun?

Sistem **Dashboard Monitoring** yang menampilkan:
- **Jadwal Dokter Praktik** - Dokter mana yang praktik hari ini
- **Booking Pasien** - Berapa pasien yang sudah booking
- **Statistik Real-time** - Data agregasi untuk monitoring

### 🏗️ Arsitektur Sistem

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   NUHA SIMRS    │       │   Gateway RS    │       │    Dashboard    │
│   (API Source)  │◀────▶│   NUHA (Node)   │─────▶│   Frontend      │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   PostgreSQL    │
                          │   (Database)    │
                          └─────────────────┘
```

**Penjelasan Arsitektur:**
- **NUHA SIMRS** - Sistem Informasi Rumah Sakit utama (backend/API)
- **Gateway RS NUHA** - Service Node.js yang mengambil data dari NUHA SIMRS
- **PostgreSQL** - Database lokal untuk menyimpan data yang sudah di-sync
- **Dashboard Frontend** - Tampilan web untuk monitoring

**Alur Data:**
1. **Sync** → Gateway me-hit API NUHA SIMRS → Simpan ke PostgreSQL
2. **Stats** → Gateway query data dari PostgreSQL → Kirim ke Dashboard

---

## 2. Persiapan Lingkungan

### 📦 Prasyarat

Pastikan sudah terinstall:
- **Node.js** (v20+) - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/) (Opsional, jika tidak memiliki remote server)
- **Git** - [Download](https://git-scm.com/) (Opsional)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd gateway-rs-nuha
```

### Step 2: Jalankan Docker Compose

Docker Compose akan menjalankan **PostgreSQL** dan **Redis** secara otomatis.

```bash
# Jalankan containers (background mode)
docker-compose up -d

# Cek status containers
docker-compose ps
```

**Contoh Output:**
```
NAME                      STATUS    PORTS
gateway_nuha_postgres     running   0.0.0.0:5432->5432/tcp
gateway_nuha_redis        running   0.0.0.0:6379->6379/tcp
```

> 💡 **Tip:** Jika error "port already in use", pastikan tidak ada PostgreSQL/Redis dan atau aplikasi lain yang running dengan menggunakan port yang sama.

### Step 3: Setup Environment Variables

Buat file `.env` dari template:

```bash
cp .env.example .env
```

**Konfigurasi Penting di `.env`:**

```env
# Server
PORT_EXPRESS=3033

# Database PostgreSQL
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=simrs_nuha
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=redis://localhost:6379

# Timezone (penting untuk cron jobs)
TIMEZONE=Asia/Jakarta
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Jalankan Migration Database

Sebelum menjalankan aplikasi, buat tabel yang diperlukan:

```bash
# Via psql (jika terinstall)
psql -U postgres -d simrs_nuha -f migration_dashboard_multi_sync.sql

# Atau via Docker
docker exec -i gateway_nuha_postgres psql -U postgres -d simrs_nuha < migration_dashboard_multi_sync.sql
```

### Step 6: Jalankan Aplikasi

```bash
npm run dev
```

**Expected Output:**
```
Active in port 3033
Database OK
Redis Connected
[DashboardCron] ✅ Dashboard cron jobs initialized (2 jobs registered)
```

---

## 3. Alur Sinkronisasi Data

### 🔄 Apa itu Sinkronisasi?

Sinkronisasi adalah proses **mengambil data dari NUHA SIMRS** (API) dan **menyimpannya ke database lokal** (PostgreSQL) untuk keperluan dashboard.

### 📊 Diagram Alur Sync

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROSES SINKRONISASI                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐     ┌───────────────────┐     │
│  │ Trigger  │───▶│ Base Sync    │───▶│ Specialized Sync  │     │
│  │ (Manual/ │    │ Service      │     │ Service           │     │
│  │  Cron)   │    │              │     │ (Jadwal/Booking)  │     │
│  └──────────┘    └──────┬───────┘     └─────────┬─────────┘     │
│                         │                       │               │
│                         ▼                       ▼               │
│               ┌──────────────────────────────────────┐          │
│               │     HIT API NUHA SIMRS (Pagination)  │          │
│               │  ┌─────────────────────────────┐     │          │
│               │  │ Page 1 → Fetch 100 records  │     │          │
│               │  │ Page 2 → Fetch 100 records  │     │          │
│               │  │ ...                         │     │          │
│               │  │ Page N → Fetch remaining    │     │          │
│               │  └─────────────────────────────┘     │          │
│               └──────────────────┬───────────────────┘          │
│                                  │                              │
│                                  ▼                              │
│               ┌──────────────────────────────────────┐          │
│               │         UPSERT TO DATABASE           │          │
│               │  • IF exists → UPDATE                │          │
│               │  • IF not exists → INSERT            │          │
│               └──────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🧩 Komponen Sync

#### 1. **Base Sync Service** (`base-sync.service.js`)

Komponen inti yang menangani logic umum:
- Pagination otomatis (ambil data per-halaman)
- Upsert logic (insert atau update)
- Error handling

```javascript
// Pseudocode alur sync
async syncData(config, Model, mappingFunction) {
    let page = 1;
    let totalPages = 1;
    
    while (page <= totalPages) {
        // 1. Fetch data dari NUHA SIMRS API
        const response = await fetchFromNuhaAPI(page);
        
        // 2. Hitung total halaman (sekali saja)
        if (page === 1) {
            totalPages = Math.ceil(response.count / 100);
        }
        
        // 3. Map dan simpan setiap record
        for (const record of response.data) {
            const mappedData = mappingFunction(record);
            await upsert(Model, mappedData);
        }
        
        page++;
    }
}
```

#### 2. **Jadwal Sync Service** (`jadwal-sync.service.js`)

Khusus untuk sinkronisasi **jadwal praktik dokter** dari NUHA SIMRS:
- Source API: `id_laporan_view = 123`
- Target: Tabel `dashboard_123`
- Unique Key: `(id_dokter, tanggal, jam_mulai)`

#### 3. **Booking Sync Service** (`booking-sync.service.js`)

Khusus untuk sinkronisasi **booking pasien** dari NUHA SIMRS:
- Source API: `id_laporan_view = 239`
- Target: Tabel `dashboard_239`
- Unique Key: `booking_id`

### 🗓️ Cron Jobs (Sinkronisasi Otomatis)

Sistem secara otomatis menjalankan sync setiap **Minggu jam 00:00**:

| Job Name | Schedule | Deskripsi |
|----------|----------|-----------|
| `JadwalDokterWeeklySync` | Minggu 00:00 | Sync jadwal dokter 14 hari kedepan |
| `BookingPasienWeeklySync` | Minggu 00:00 | Sync booking pasien 14 hari kedepan |

### 🔧 Manual Sync via API

Untuk testing atau kebutuhan ad-hoc:

```bash
# Sync Jadwal Dokter saja
curl -X POST http://localhost:3033/dashboard/sync-jadwal

# Sync Booking saja
curl -X POST http://localhost:3033/dashboard/sync-booking

# Sync Semua (Jadwal + Booking)
curl -X POST http://localhost:3033/dashboard/sync-all
```

---

## 4. Konsumsi Data Dashboard

### 📈 Apa itu Dashboard Stats?

Setelah data tersinkronisasi, kita perlu **mengambil data agregat** untuk ditampilkan di dashboard. Ini dilakukan dengan **query SQL yang dioptimasi** langsung ke database.

### 📊 Diagram Alur Stats

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROSES GET STATS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐     ┌───────────────────┐     │
│  │ Frontend │───▶│ Controller   │───▶│ Dashboard Service │     │
│  │ Request  │    │ getDashboard │     │ getDashboardStats │     │
│  └──────────┘    │ Data()       │     │ ()                │     │
│                  └──────────────┘     └─────────┬─────────┘     │
│                                                 │               │
│                                                 ▼               │
│               ┌──────────────────────────────────────┐          │
│               │         RAW SQL QUERIES              │          │
│               │  ┌─────────────────────────────┐     │          │
│               │  │ _getTotals()                │     │          │
│               │  │ _getBookingByDoctor()       │     │          │
│               │  │ _getBookingBySpecialization │     │          │
│               │  │ _getPracticingBySpec()      │     │          │
│               │  └─────────────────────────────┘     │          │
│               └──────────────────┬───────────────────┘          │
│                                  │                              │
│                                  ▼                              │
│               ┌───────────────────────────────────────┐         │
│               │   JOIN: dashboard_123 + dashboard_239 │         │
│               │   (Jadwal Dokter + Booking Pasien)    │         │
│               └──────────────────┬────────────────────┘         │
│                                  │                              │
│                                  ▼                              │
│               ┌──────────────────────────────────────┐          │
│               │         JSON RESPONSE                │          │
│               │  {                                   │          │
│               │    date, generatedAt, totals,        │          │
│               │    bookingByDoctor,                  │          │
│               │    bookingBySpecialization,          │          │
│               │    practicingBySpecialization        │          │
│               │  }                                   │          │
│               └──────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🔗 Relasi Tabel (JOIN)

Untuk menghitung **jumlah booking per slot jadwal dokter**, kita menggunakan JOIN:

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
WHERE d123.tanggal = '2026-01-26'
GROUP BY d123.id_dokter, d123.nama_dokter;
```

**Penjelasan JOIN:**
- **Condition 1-2:** Match dokter dan tanggal yang sama
- **Condition 3-4:** Booking berada dalam rentang jam praktik
- **Condition 5:** Hanya booking yang masih aktif

### 📤 Format Response

```json
{
  "date": "2026-01-26",
  "generatedAt": "2026-01-26T10:15:30+07:00",
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
  ],
  "practicingBySpecialization": [
    {
      "specialization": "ANAK",
      "doctors": 5,
      "doctorList": [
        { "id": "101", "name": "dr. Andi" },
        { "id": "103", "name": "dr. Citra" }
      ]
    }
  ]
}
```

---

## 5. Referensi API Endpoints

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
#### Bash/Terminal:
```bash
# Sync All
curl -X POST http://localhost:3033/dashboard/sync-all

# Get Stats
curl http://localhost:3033/dashboard/stats

# Get Stats dengan tanggal
curl "http://localhost:3033/dashboard/stats?tanggal=2026-01-26"
```

---

## 📌 Troubleshooting

### Docker tidak bisa start
```bash
# Restart Docker Desktop
# Kemudian jalankan ulang:
docker-compose down
docker-compose up -d
```

### Database connection error
1. Pastikan container PostgreSQL running: `docker-compose ps` jika database dijalankan di local docker, atau `docker ps` jika dijalankan di remote server
2. Cek konfigurasi `.env` (DB_HOST, DB_PORT, dst)
3. Pastikan migration (file .sql) sudah dijalankan

### Sync gagal (timeout/error)
1. Cek koneksi ke API eksternal
2. Lihat log di terminal untuk detail error
3. Coba sync manual per-type (jadwal dulu, baru booking)

---

## 🎓 Ringkasan

| Komponen | File | Fungsi |
|----------|------|--------|
| Base Sync | `base-sync.service.js` | Logic inti pagination & upsert |
| Jadwal Sync | `jadwal-sync.service.js` | Sync jadwal dokter |
| Booking Sync | `booking-sync.service.js` | Sync booking pasien |
| Dashboard Service | `dashboard.service.js` | Query stats dengan JOIN |
| Controller | `dashboard.controller.js` | Handle HTTP requests |
| Router | `router/index.js` | Define endpoints |
| Cron | `cron/dashboard.cron.js` | Scheduled sync jobs |

---

**🎉 Selamat! Anda telah mempelajari arsitektur service Penerapan Open API RS NUHA.**

*Dokumen Workshop RS NUHA - 2026*
