-- Table: dashboard_123 (Menyimpan data hasil sinkronisasi dari API Eksternal)

CREATE TABLE IF NOT EXISTS public.dashboard_123 (
    id SERIAL PRIMARY KEY,
    
    -- Kunci Unik Gabungan (Composite Key)
    id_dokter INTEGER NOT NULL,
    tanggal DATE NOT NULL,          -- mapping dari tanggal_char
    jam_mulai VARCHAR(10) NOT NULL, -- mapping dari time_start
    
    -- Data Dokter & Layanan
    nama_dokter VARCHAR(255),
    kode_spesialis VARCHAR(50),
    nama_spesialis VARCHAR(100),
    hari VARCHAR(20),               -- mapping dari day_name
    jam_selesai VARCHAR(10),        -- mapping dari time_finish
    status_praktik VARCHAR(50),     -- 'Praktik', 'Cuti', dll
    
    -- Metadata Sinkronisasi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint Unik untuk mencegah duplikasi data jadwal yang sama
    CONSTRAINT unique_schedule UNIQUE (id_dokter, tanggal, jam_mulai)
);

-- Index untuk mempercepat query dashboard (karena kita filter by tanggal dan group by spesialis)
CREATE INDEX IF NOT EXISTS idx_fito_sync_tanggal ON public.dashboard_123(tanggal);
CREATE INDEX IF NOT EXISTS idx_fito_sync_spesialis ON public.dashboard_123(nama_spesialis);
