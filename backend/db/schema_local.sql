-- ============================================================================
-- SKEMA POSTGRESQL LOKAL (Development) - SMPN 2 MUTING
-- ============================================================================
-- Struktur tabel SAMA dengan Supabase (supabase_schema.sql), tanpa bagian
-- Supabase Auth & RLS. Di localhost, pembatasan Admin/User dijaga oleh backend Express.
-- Dijalankan otomatis oleh: npm run db:setup

CREATE TABLE IF NOT EXISTS bahan_ajar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mata_pelajaran TEXT NOT NULL,
  kelas TEXT NOT NULL,
  judul_rpp TEXT NOT NULL,
  link_drive TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS akreditasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_bab TEXT NOT NULL,
  nama_dokumen TEXT NOT NULL,
  link_drive TEXT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siswa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nisn TEXT UNIQUE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  kelas TEXT NOT NULL,
  angkatan TEXT NOT NULL,
  link_kk_drive TEXT,
  link_akta_drive TEXT,
  catatan_berkas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE siswa ADD COLUMN IF NOT EXISTS link_kk_drive TEXT;
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS link_akta_drive TEXT;
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS catatan_berkas TEXT;

CREATE TABLE IF NOT EXISTS pernyataan_siswa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  jenis_surat TEXT NOT NULL,
  link_drive_surat TEXT NOT NULL,
  link_youtube_video TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pernyataan_siswa_siswa_id ON pernyataan_siswa(siswa_id);

CREATE TABLE IF NOT EXISTS berita_prestasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Prestasi Siswa',
  ringkasan TEXT NOT NULL,
  isi_konten TEXT NOT NULL,
  gambar_url TEXT,
  galeri_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  nama_siswa_terkait TEXT,
  tingkat_prestasi TEXT,
  penulis TEXT DEFAULT 'Tim Humas & Kesiswaan',
  tanggal_publikasi DATE DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guru (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nip TEXT,
  nuptk TEXT,
  nama_lengkap TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL DEFAULT 'Laki-laki',
  jabatan TEXT NOT NULL,
  mata_pelajaran TEXT,
  status_kepegawaian TEXT NOT NULL DEFAULT 'PNS',
  pendidikan_terakhir TEXT DEFAULT 'S1',
  no_hp TEXT,
  email TEXT,
  status_aktif TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sarana_prasarana (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode_aset TEXT,
  nama_sarpras TEXT NOT NULL,
  kategori TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 1,
  satuan TEXT NOT NULL DEFAULT 'Unit',
  kondisi TEXT NOT NULL DEFAULT 'Baik',
  lokasi TEXT,
  tahun_pengadaan TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nisn TEXT,
  nama_lengkap TEXT NOT NULL,
  angkatan_lulus TEXT NOT NULL,
  jurusan TEXT,
  status_lulusan TEXT NOT NULL DEFAULT 'Belum Terdata',
  instansi_tujuan TEXT,
  bidang_jurusan TEXT,
  kota TEXT,
  no_hp TEXT,
  email TEXT,
  link_ijazah_drive TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pengaturan_ppdb (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul_tombol TEXT NOT NULL DEFAULT 'Sistem PPDB Online SMPN 2 Muting',
  link_ppdb TEXT NOT NULL DEFAULT '',
  tahun_ajaran TEXT DEFAULT '2026/2027',
  keterangan TEXT DEFAULT 'Pendaftaran Peserta Didik Baru (PPDB) SMPN 2 Muting secara daring.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
