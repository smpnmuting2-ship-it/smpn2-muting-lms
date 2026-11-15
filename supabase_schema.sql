-- ============================================================================
-- SKEMA DATABASE SUPABASE (PostgreSQL) - SISTEM MANAJEMEN SMPN 2 MUTING
-- ============================================================================
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel seluruh
-- isi file ini -> Run. Aman dijalankan ulang (idempotent).

-- ==========================================
-- 0. TABEL PROFILES (Manajemen Role Admin & User)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nama TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger otomatis membuat profil saat user baru dibuat di Supabase Auth.
-- KEAMANAN: role SELALU 'user' (Read-Only). Role TIDAK diambil dari
-- raw_user_meta_data karena data itu bisa diisi sendiri oleh pendaftar.
-- Untuk menjadikan admin, jalankan UPDATE di bagian paling bawah file ini.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    'user'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 1. TABEL: bahan_ajar (RPP & Perangkat Pembelajaran)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bahan_ajar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mata_pelajaran TEXT NOT NULL,
  kelas TEXT NOT NULL,
  judul_rpp TEXT NOT NULL,
  link_drive TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. TABEL: akreditasi (Dokumen Akreditasi Sekolah)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.akreditasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_bab TEXT NOT NULL,
  nama_dokumen TEXT NOT NULL,
  link_drive TEXT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. TABEL: siswa (Data Induk Siswa & Manajemen Berkas KK / Akta)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.siswa (
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

ALTER TABLE public.siswa ADD COLUMN IF NOT EXISTS link_kk_drive TEXT;
ALTER TABLE public.siswa ADD COLUMN IF NOT EXISTS link_akta_drive TEXT;
ALTER TABLE public.siswa ADD COLUMN IF NOT EXISTS catatan_berkas TEXT;

-- ==========================================
-- 4. TABEL: pernyataan_siswa (Surat Pernyataan & Video)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pernyataan_siswa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  jenis_surat TEXT NOT NULL,
  link_drive_surat TEXT NOT NULL,
  link_youtube_video TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pernyataan_siswa_siswa_id
  ON public.pernyataan_siswa(siswa_id);

-- ==========================================
-- 5. TABEL: berita_prestasi (Portal Berita Prestasi & Dokumentasi - Publik)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.berita_prestasi (
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

-- ==========================================
-- 6. TABEL: guru (Database Data Guru & Tenaga Kependidikan)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.guru (
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

-- ==========================================
-- 7. TABEL: sarana_prasarana (Inventaris Sarana & Prasarana Sekolah)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sarana_prasarana (
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

-- ==========================================
-- 8. TABEL: alumni (Data Alumni, Tracker Lulusan & Arsip Ijazah G-Drive)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.alumni (
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

-- ==========================================
-- 9. TABEL: pengaturan_ppdb (Konfigurasi Hyperlink Sistem PPDB)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pengaturan_ppdb (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul_tombol TEXT NOT NULL DEFAULT 'Sistem PPDB Online SMPN 2 Muting',
  link_ppdb TEXT NOT NULL DEFAULT '',
  tahun_ajaran TEXT DEFAULT '2026/2027',
  keterangan TEXT DEFAULT 'Pendaftaran Peserta Didik Baru (PPDB) SMPN 2 Muting secara daring.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.pengaturan_ppdb (judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active)
SELECT
  'Sistem PPDB Online SMPN 2 Muting',
  'https://ppdb.smpn2muting.sch.id',
  '2026/2027',
  'Layanan Penerimaan Peserta Didik Baru (PPDB) Online SMPN 2 Muting. Silakan klik tombol untuk menuju halaman pendaftaran.',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.pengaturan_ppdb);

-- ==========================================
-- KEAMANAN ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bahan_ajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akreditasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pernyataan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita_prestasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sarana_prasarana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_ppdb ENABLE ROW LEVEL SECURITY;

-- Fungsi helper untuk mengecek apakah user yang login adalah 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles: user hanya bisa MEMBACA profilnya sendiri.
DROP POLICY IF EXISTS "User dapat melihat profil sendiri" ON public.profiles;
CREATE POLICY "User dapat melihat profil sendiri"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- PORTAL BERITA PUBLIK: pengunjung tanpa login (anon) maupun user login dapat membaca berita terbit.
DROP POLICY IF EXISTS "Akses baca publik berita_prestasi" ON public.berita_prestasi;
CREATE POLICY "Akses baca publik berita_prestasi"
  ON public.berita_prestasi FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.is_admin());

-- PENGATURAN PPDB PUBLIK: pengunjung publik (anon) maupun user login dapat membaca link PPDB.
DROP POLICY IF EXISTS "Akses baca publik pengaturan_ppdb" ON public.pengaturan_ppdb;
CREATE POLICY "Akses baca publik pengaturan_ppdb"
  ON public.pengaturan_ppdb FOR SELECT
  TO anon, authenticated
  USING (true);

-- READ-ONLY UNTUK USER LOGIN ('admin' maupun 'user')
DROP POLICY IF EXISTS "Akses baca bahan_ajar untuk user login" ON public.bahan_ajar;
CREATE POLICY "Akses baca bahan_ajar untuk user login"
  ON public.bahan_ajar FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Akses baca akreditasi untuk user login" ON public.akreditasi;
CREATE POLICY "Akses baca akreditasi untuk user login"
  ON public.akreditasi FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Akses baca siswa untuk user login" ON public.siswa;
CREATE POLICY "Akses baca siswa untuk user login"
  ON public.siswa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Akses baca pernyataan_siswa untuk user login" ON public.pernyataan_siswa;
CREATE POLICY "Akses baca pernyataan_siswa untuk user login"
  ON public.pernyataan_siswa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Akses baca guru untuk user login" ON public.guru;
CREATE POLICY "Akses baca guru untuk user login"
  ON public.guru FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Akses baca sarana_prasarana untuk user login" ON public.sarana_prasarana;
CREATE POLICY "Akses baca sarana_prasarana untuk user login"
  ON public.sarana_prasarana FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Akses baca alumni untuk user login" ON public.alumni;
CREATE POLICY "Akses baca alumni untuk user login"
  ON public.alumni FOR SELECT TO authenticated USING (true);

-- FULL CRUD: hanya 'admin' yang bisa INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Akses penuh bahan_ajar khusus admin" ON public.bahan_ajar;
CREATE POLICY "Akses penuh bahan_ajar khusus admin"
  ON public.bahan_ajar FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh akreditasi khusus admin" ON public.akreditasi;
CREATE POLICY "Akses penuh akreditasi khusus admin"
  ON public.akreditasi FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh siswa khusus admin" ON public.siswa;
CREATE POLICY "Akses penuh siswa khusus admin"
  ON public.siswa FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh pernyataan_siswa khusus admin" ON public.pernyataan_siswa;
CREATE POLICY "Akses penuh pernyataan_siswa khusus admin"
  ON public.pernyataan_siswa FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh berita_prestasi khusus admin" ON public.berita_prestasi;
CREATE POLICY "Akses penuh berita_prestasi khusus admin"
  ON public.berita_prestasi FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh guru khusus admin" ON public.guru;
CREATE POLICY "Akses penuh guru khusus admin"
  ON public.guru FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh sarana_prasarana khusus admin" ON public.sarana_prasarana;
CREATE POLICY "Akses penuh sarana_prasarana khusus admin"
  ON public.sarana_prasarana FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh alumni khusus admin" ON public.alumni;
CREATE POLICY "Akses penuh alumni khusus admin"
  ON public.alumni FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Akses penuh pengaturan_ppdb khusus admin" ON public.pengaturan_ppdb;
CREATE POLICY "Akses penuh pengaturan_ppdb khusus admin"
  ON public.pengaturan_ppdb FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- MENJADIKAN USER SEBAGAI ADMIN (jalankan terpisah, SETELAH user dibuat)
-- ============================================================================
-- 1. Buat user di: Authentication -> Users -> Add user -> Create new user
--    (centang "Auto Confirm User").
-- 2. Ganti email di bawah, lalu jalankan:
--
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@smpn2muting.sch.id';
