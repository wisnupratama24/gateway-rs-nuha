-- ========================================
-- MIGRATION: Multi-Sync Dashboard Architecture
-- ========================================
--
-- File ini berisi definisi tabel untuk semua sync types dashboard yang digunakan untuk workshop penerapan open api.
-- Eksekusi file ini akan membuat:
-- 1. Tabel dashboard_123 (Jadwal Dokter)
-- 2. Tabel dashboard_239 (Booking Pasien)
--
-- Usage:
--   psql -U postgres -d your_database -f migration_dashboard_multi_sync.sql atau jalankan manual dengan cara copy/paste di DBMS
--
-- ========================================
-- ========================================
-- TABEL 1: dashboard_123 (Jadwal Dokter)
-- ========================================
-- 
-- Purpose: Menyimpan data jadwal praktik dokter
-- API Source: id_laporan_view = 123
-- Unique Key: (id_dokter, tanggal, jam_mulai)
CREATE TABLE IF NOT EXISTS public.dashboard_123 (
    -- ========================================
    -- PRIMARY KEY
    -- ========================================
    id SERIAL4 PRIMARY KEY,
    -- ========================================
    -- UNIQUE KEY (Composite: 3 fields)
    -- ========================================
    id_dokter INTEGER NOT NULL,
    tanggal DATE NOT NULL,
    -- mapping dari tanggal_char (API)
    jam_mulai VARCHAR(10) NOT NULL,
    -- mapping dari time_start (API)
    -- ========================================
    -- DATA DOKTER & SPESIALIS
    -- ========================================
    nama_dokter VARCHAR(255),
    kode_spesialis VARCHAR(50),
    nama_spesialis VARCHAR(100),
    -- ========================================
    -- JADWAL PRAKTIK
    -- ========================================
    hari VARCHAR(20),
    -- mapping dari day_name (API)
    jam_selesai VARCHAR(10),
    -- mapping dari time_finish (API)
    status_praktik VARCHAR(50),
    -- 'Praktik', 'Cuti', 'Tidak Praktik', dll
    -- ========================================
    -- TIMESTAMPS SYNC (Dikelola sistem sync)
    -- ========================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Constraint Unik untuk mencegah duplikasi data jadwal yang sama
    CONSTRAINT unique_schedule UNIQUE (id_dokter, tanggal, jam_mulai)
);
-- ========================================
-- INDEXES: dashboard_123
-- ========================================
-- Index untuk filter by tanggal (sering dipakai di stats)
CREATE INDEX IF NOT EXISTS idx_dashboard_123_tanggal ON public.dashboard_123(tanggal);
-- Index untuk filter by spesialis (untuk grouping)
CREATE INDEX IF NOT EXISTS idx_dashboard_123_spesialis ON public.dashboard_123(nama_spesialis);
-- ========================================
-- COMMENTS: dashboard_123
-- ========================================
COMMENT ON TABLE public.dashboard_123 IS 'Tabel sinkronisasi jadwal praktik dokter dari API Eksternal (id_laporan_view: 123)';
COMMENT ON COLUMN public.dashboard_123.tanggal IS 'Tanggal praktik dokter (digunakan untuk filter dashboard)';
COMMENT ON COLUMN public.dashboard_123.last_synced_at IS 'Timestamp terakhir data di-sync dari API eksternal';
-- ========================================
-- TABEL 2: dashboard_239 (Booking Pasien)
-- ========================================
--
-- Purpose: Menyimpan data booking pasien
-- API Source: id_laporan_view = 239
-- Unique Key: booking_id
CREATE TABLE IF NOT EXISTS public.dashboard_239 (
    -- ========================================
    -- PRIMARY KEY
    -- ========================================
    id SERIAL4 PRIMARY KEY,
    -- ========================================
    -- UNIQUE KEY: booking_id (dari API)
    -- ========================================
    booking_id INTEGER NOT NULL UNIQUE,
    -- ========================================
    -- DATA TAGIHAN & PASIEN
    -- ========================================
    id_tagihan INTEGER,
    no_rm VARCHAR(50),
    nama_rm VARCHAR(255),
    nik_rm VARCHAR(50),
    telepon VARCHAR(50),
    no_hp VARCHAR(50),
    -- ========================================
    -- STATUS & REGISTRASI
    -- ========================================
    status_booking VARCHAR(50),
    status_registrasi VARCHAR(100),
    tanggal_registrasi_filter TIMESTAMP,
    status_rekam_medis VARCHAR(100),
    -- ========================================
    -- ANTRIAN & BOOKING INFO
    -- ========================================
    tanggal_antrian TIMESTAMP,
    antrian VARCHAR(50),
    asal_booking VARCHAR(50),
    -- ========================================
    -- ASURANSI & RUJUKAN
    -- ========================================
    no_asuransi VARCHAR(100),
    no_rujukan VARCHAR(100),
    no_kontrol VARCHAR(100),
    asuransi VARCHAR(100),
    -- ========================================
    -- SPESIALIS & DOKTER INFO
    -- ========================================
    code VARCHAR(50),
    -- kode_spesialis
    id_spesialis INTEGER,
    spesialis VARCHAR(100),
    id_jadwal_dokter INTEGER,
    id_dokter INTEGER,
    dokter VARCHAR(255),
    poliklinik VARCHAR(100),
    -- ========================================
    -- JADWAL PRAKTIK
    -- ========================================
    hari VARCHAR(20),
    mulai VARCHAR(10),
    -- jam mulai
    selesai VARCHAR(10),
    -- jam selesai
    -- ========================================
    -- KUOTA
    -- ========================================
    kuota INTEGER,
    kuota_jkn INTEGER,
    kuota_vip INTEGER,
    -- ========================================
    -- CATATAN & ALASAN
    -- ========================================
    catatan TEXT,
    alasan_batal TEXT,
    -- ========================================
    -- METADATA SISTEM
    -- ========================================
    versi VARCHAR(10),
    inserted_user VARCHAR(100),
    inserted_date TIMESTAMP,
    updated_user VARCHAR(100),
    update_date TIMESTAMP,
    -- ========================================
    -- TIMESTAMPS SYNC (Dikelola oleh sistem sync)
    -- ========================================
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP DEFAULT NOW()
);
-- ========================================
-- INDEXES: dashboard_239
-- ========================================
-- Index untuk filter by tanggal (sering dipakai di stats)
CREATE INDEX IF NOT EXISTS idx_dashboard_239_tanggal_antrian ON public.dashboard_239(tanggal_antrian);
-- Index untuk filter by status
CREATE INDEX IF NOT EXISTS idx_dashboard_239_status_booking ON public.dashboard_239(status_booking);
-- Index untuk filter by dokter
CREATE INDEX IF NOT EXISTS idx_dashboard_239_id_dokter ON public.dashboard_239(id_dokter);
-- Index untuk filter by spesialis
CREATE INDEX IF NOT EXISTS idx_dashboard_239_id_spesialis ON public.dashboard_239(id_spesialis);
-- Index untuk filter by asuransi
CREATE INDEX IF NOT EXISTS idx_dashboard_239_asuransi ON public.dashboard_239(asuransi);
-- ========================================
-- COMMENTS: dashboard_239
-- ========================================
COMMENT ON TABLE public.dashboard_239 IS 'Tabel sinkronisasi data booking pasien dari API Eksternal (id_laporan_view: 239)';
COMMENT ON COLUMN public.dashboard_239.booking_id IS 'ID Booking dari sistem eksternal (UNIQUE KEY untuk UPSERT)';
COMMENT ON COLUMN public.dashboard_239.tanggal_antrian IS 'Tanggal antrian pasien (digunakan untuk filter dashboard)';
COMMENT ON COLUMN public.dashboard_239.last_synced_at IS 'Timestamp terakhir data di-sync dari API eksternal';
-- ========================================
-- MIGRATION COMPLETE
-- ========================================