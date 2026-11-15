# Sistem Informasi Manajemen Sekolah - SMPN 2 Muting

Aplikasi manajemen sekolah terpadu untuk jenjang **MTs (Kelas VII–IX)** dan **MA (Kelas X–XII)** berbasis **React + Node.js/Express + Supabase (PostgreSQL)** dengan arsitektur **Cloud-Link** (tanpa upload file fisik, hanya menyimpan tautan Google Drive untuk PDF/Word/Excel dan tautan YouTube untuk video).

## Fitur & Pembagian Hak Akses

1. **Rute Publik (`/`, `/berita`, `/berita/:id`)**: Halaman Utama (Landing Page) + **Portal Berita Prestasi & Dokumentasi Sekolah** SMPN 2 Muting yang dapat diakses siapa saja tanpa perlu login.
2. **Halaman Login (`/login`)**: Mendukung Supabase Auth maupun Mode Demo Localhost.
3. **Rute Terproteksi (`/dashboard` & Modul Internal)**:
   - **Role 1 (`admin`)**: Akses **Full CRUD** — dapat menambah, mengubah, mengunggah foto berita (Cloudinary/URL), dan menghapus data.
   - **Role 2 (`user`)**: Akses **Read-Only** — dapat melihat dashboard, data guru, sarpras, alumni, detail siswa beserta berkas KK/Akta/Ijazah Google Drive, serta pratinjau/unduh dokumen tanpa formulir input.

## Modul & Tabel Database
1. **`bahan_ajar`**: `id`, `mata_pelajaran`, `kelas` (mendukung VII–IX MTs & X–XII MA), `judul_rpp`, `link_drive`, `created_at`
2. **`akreditasi`**: `id`, `sub_bab`, `nama_dokumen`, `link_drive`, `keterangan`, `created_at`
3. **`siswa`**: `id`, `nisn` (unik), `nama_lengkap`, `kelas`, `angkatan`, `link_kk_drive`, `link_akta_drive`, `catatan_berkas`, `created_at`
4. **`pernyataan_siswa`**: `id`, `siswa_id` (FK ke `siswa`), `jenis_surat`, `link_drive_surat`, `link_youtube_video`, `created_at`
5. **`berita_prestasi`**: `id`, `judul`, `kategori`, `ringkasan`, `isi_konten`, `gambar_url`, `galeri_urls`, `nama_siswa_terkait`, `tingkat_prestasi`, `penulis`, `tanggal_publikasi`, `is_published`, `created_at`
6. **`guru`**: `id`, `nip`, `nuptk`, `nama_lengkap`, `jenis_kelamin`, `jabatan`, `mata_pelajaran`, `status_kepegawaian`, `pendidikan_terakhir`, `no_hp`, `email`, `status_aktif`, `created_at`
7. **`sarana_prasarana`**: `id`, `kode_aset`, `nama_sarpras`, `kategori`, `jumlah`, `satuan`, `kondisi`, `lokasi`, `tahun_pengadaan`, `keterangan`, `created_at`
8. **`alumni`**: `id`, `nisn`, `nama_lengkap`, `angkatan_lulus`, `jurusan`, `status_lulusan`, `instansi_tujuan`, `bidang_jurusan`, `kota`, `no_hp`, `email`, `link_ijazah_drive`, `keterangan`, `created_at`

---

## Arsitektur Lingkungan (Localhost vs Cloud)

| Lingkungan | Frontend | Backend / Auth | Database |
|---|---|---|---|
| **Localhost (Dev)** | React (`localhost:5174`) | Express (`localhost:5001`) | **PostgreSQL Lokal** (`smpn2_muting`) |
| **Vercel (Produksi)** | React (di Vercel via GitHub) | **Supabase Auth** | **Supabase PostgreSQL** |

Di mode localhost, `frontend/.env` membiarkan variabel Supabase kosong agar frontend otomatis berbicara ke Express + PostgreSQL lokal. Saat deploy ke Vercel lewat GitHub, cukup isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di **Vercel Environment Variables**, maka build produksi di Vercel otomatis terhubung ke Supabase.

---

## Cara Menjalankan di Localhost (PostgreSQL Lokal)

### 1. Siapkan & Jalankan Backend API (Port 5001)
Pastikan PostgreSQL lokal menyala, salin `backend/.env.example` menjadi `backend/.env`, lalu:
```bash
cd backend
npm install
npm run db:setup
npm start
```

### 2. Jalankan Frontend React (Port 5174)
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Lalu buka browser di: **http://localhost:5174**

### Akun Login Mode Localhost:
- **Role 1 (Admin - Full CRUD)**:
  - Email: `admin@smpn2muting.sch.id`
  - Password: `admin123`
- **Role 2 (User - Read-Only)**:
  - Email: `guru@smpn2muting.sch.id`
  - Password: `user123`

---

## Deploy ke Cloud (Supabase + GitHub + Vercel)

Di produksi, frontend React terhubung **langsung** ke Supabase. Keamanan Admin/User
dijaga oleh Row Level Security di database, jadi backend Express **tidak perlu di-deploy**
(backend hanya dipakai untuk mode localhost).

### 1. Supabase (Database & Login)
1. Buat project baru di https://supabase.com/dashboard (region terdekat: **Southeast Asia (Singapore)**).
2. Buka **SQL Editor** -> New query -> tempel seluruh isi [`supabase_schema.sql`](./supabase_schema.sql) -> **Run**.
3. **Authentication -> Sign In / Providers -> Email**: matikan **"Allow new users to sign up"**
   (akun hanya dibuat oleh admin, bukan daftar sendiri).
4. **Authentication -> Users -> Add user -> Create new user** (centang *Auto Confirm User*) untuk setiap guru/admin.
5. Jadikan admin lewat SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@smpn2muting.sch.id';
   ```
6. Catat **Project URL** dan **anon / publishable key** (tombol **Connect** atau Project Settings -> API).

### 2. GitHub
Simpan project ke repository GitHub (private disarankan), lalu push branch `main`.

### 3. Vercel
1. https://vercel.com/new -> Import repository GitHub tadi.
2. **Root Directory**: `frontend` (Framework Preset otomatis: Vite).
3. **Environment Variables**: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Setiap `git push` ke `main` akan otomatis deploy ulang.

> File [`frontend/vercel.json`](./frontend/vercel.json) membuat URL seperti `/dashboard` tetap bisa dibuka langsung atau di-refresh (tidak 404).

## Cara Menghubungkan Localhost ke Supabase
1. Salin `frontend/.env.example` menjadi `frontend/.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
2. Restart `npm run dev` pada folder `frontend`. Aplikasi otomatis memakai Supabase Auth & PostgreSQL.
