require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;

const DB_MODE = process.env.DB_MODE || (process.env.DATABASE_URL ? 'postgres' : 'local');
const usePostgres = DB_MODE === 'postgres';

let pool = null;
if (usePostgres) {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DB_MODE=postgres tetapi DATABASE_URL belum diisi di backend/.env');
    process.exit(1);
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

app.use(cors());
// Batas 2 MB agar impor CSV ribuan siswa muat dalam satu permintaan
app.use(express.json({ limit: '2mb' }));

// ==========================================
// FALLBACK PENYIMPANAN JSON LOKAL (jika DB_MODE=local)
// ==========================================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

const initialSeedData = {
  bahan_ajar: [
    {
      id: 'ba-1',
      mata_pelajaran: 'Fikih',
      kelas: 'VII-A',
      judul_rpp: 'Modul Ajar Thaharah dan Tata Cara Shalat Fardhu Kelas VII MTs',
      link_drive: 'https://drive.google.com/file/d/1example-rpp-fikih-vii-mts/view',
      created_at: '2026-11-01T08:00:00.000Z'
    },
    {
      id: 'ba-2',
      mata_pelajaran: 'Matematika',
      kelas: 'VIII-A',
      judul_rpp: 'Modul Ajar Eksponen dan Logaritma Kurikulum Merdeka Kelas X MA',
      link_drive: 'https://drive.google.com/file/d/1example-rpp-matematika-x-ma/view',
      created_at: '2026-11-03T09:30:00.000Z'
    },
    {
      id: 'ba-3',
      mata_pelajaran: 'Bahasa Arab',
      kelas: 'IX-A',
      judul_rpp: 'RPP Qiraah dan Qawaid Bahasa Arab Kelas XI MA',
      link_drive: 'https://drive.google.com/file/d/1example-rpp-barab-xi-ma/view',
      created_at: '2026-11-05T10:15:00.000Z'
    }
  ],
  akreditasi: [
    {
      id: 'ak-1',
      sub_bab: 'Komponen 1 - Mutu Lulusan',
      nama_dokumen: 'Rekapitulasi Prestasi Akademik & Non-Akademik Siswa SMPN 2 Muting 3 Tahun Terakhir',
      link_drive: 'https://drive.google.com/file/d/1example-akreditasi-mutu-lulusan/view',
      keterangan: 'File Excel & PDF bukti sertifikat KSM/OSN tingkat Kabupaten Merauke & Provinsi',
      created_at: '2026-11-02T08:00:00.000Z'
    },
    {
      id: 'ak-2',
      sub_bab: 'Komponen 2 - Proses Pembelajaran',
      nama_dokumen: 'Dokumen Supervisi Akademik Guru SMPN 2 Muting Semester Ganjil',
      link_drive: 'https://drive.google.com/file/d/1example-akreditasi-supervisi/view',
      keterangan: 'Sudah diverifikasi oleh Kepala Sekolah SMPN 2 Muting',
      created_at: '2026-11-04T11:20:00.000Z'
    },
    {
      id: 'ak-3',
      sub_bab: 'Komponen 4 - Manajemen Sekolah',
      nama_dokumen: 'RKM dan RKAM SMPN 2 Muting Tahun Ajaran Berjalan',
      link_drive: 'https://drive.google.com/file/d/1example-akreditasi-rkam/view',
      keterangan: 'Dokumen PDF bertanda tangan Komite & Kepala Sekolah',
      created_at: '2026-11-06T13:00:00.000Z'
    }
  ],
  siswa: [
    {
      id: 'sw-1',
      nisn: '0091234561',
      nama_lengkap: 'Ahmad Fauzan',
      kelas: 'VIII-A',
      angkatan: '2025',
      link_kk_drive: 'https://drive.google.com/file/d/1example-kk-fauzan/view',
      link_akta_drive: 'https://drive.google.com/file/d/1example-akta-fauzan/view',
      catatan_berkas: 'KK & Akta lengkap terverifikasi Wali Kelas MTs',
      created_at: '2026-11-01T07:30:00.000Z'
    },
    {
      id: 'sw-2',
      nisn: '0089876542',
      nama_lengkap: 'Siti Nurhaliza',
      kelas: 'IX-A',
      angkatan: '2025',
      link_kk_drive: 'https://drive.google.com/file/d/1example-kk-nurhaliza/view',
      link_akta_drive: '',
      catatan_berkas: 'Akta kelahiran sedang proses legalisir',
      created_at: '2026-11-01T07:35:00.000Z'
    },
    {
      id: 'sw-3',
      nisn: '0075432189',
      nama_lengkap: 'Muhammad Rizky Pratama',
      kelas: 'IX-B',
      angkatan: '2024',
      link_kk_drive: '',
      link_akta_drive: '',
      catatan_berkas: 'Belum mengunggah tautan KK & Akta',
      created_at: '2026-11-01T07:40:00.000Z'
    }
  ],
  pernyataan_siswa: [
    {
      id: 'ps-1',
      siswa_id: 'sw-1',
      jenis_surat: 'Surat Pernyataan Tata Tertib Santri & Siswa Baru (MTs)',
      link_drive_surat: 'https://drive.google.com/file/d/1example-surat-tatib-fauzan/view',
      link_youtube_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      created_at: '2026-11-06T09:00:00.000Z'
    },
    {
      id: 'ps-2',
      siswa_id: 'sw-2',
      jenis_surat: 'Surat Pernyataan Komitmen Beasiswa Prestasi Sekolah (MA)',
      link_drive_surat: 'https://drive.google.com/file/d/1example-surat-beasiswa-nurhaliza/view',
      link_youtube_video: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      created_at: '2026-11-07T14:20:00.000Z'
    }
  ],
  berita_prestasi: [
    {
      id: 'bp-1',
      judul: 'Kontingen KSM SMPN 2 Muting Raih Juara 1 Kompetisi Sains Sekolah Kabupaten Merauke',
      kategori: 'Prestasi Siswa',
      ringkasan:
        'Siswa SMPN 2 Muting SMPN 2 Muting berhasil meraih juara pertama cabang Matematika Terintegrasi dan Biologi Terintegrasi pada ajang KSM 2026.',
      isi_konten:
        'Kabar membanggakan datang dari kontingen Kompetisi Sains Sekolah (KSM) SMPN 2 Muting. Setelah melalui pembinaan intensif bersama asatidz dan guru pembimbing, Ahmad Fauzan (VIII-A MTs) dan Siti Nurhaliza (XI-IPA MA) berhasil menempati peringkat pertama tingkat Kabupaten Merauke.\n\nKepala Sekolah menyampaikan apresiasi setinggi-tingginya kepada para peserta didik, wali murid, serta dewan guru atas dedikasi dan istiqamah dalam belajar.\n\nSelanjutnya, perwakilan sekolah akan dipersiapkan menuju seleksi tingkat Provinsi Papua Selatan.',
      gambar_url:
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
      galeri_urls: [
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'
      ],
      nama_siswa_terkait: 'Ahmad Fauzan (VIII-A MTs) & Siti Nurhaliza (XI-IPA MA)',
      tingkat_prestasi: 'Tingkat Kabupaten Merauke',
      penulis: 'Tim Humas SMPN 2 Muting',
      tanggal_publikasi: '2026-11-08',
      is_published: true,
      created_at: '2026-11-08T10:00:00.000Z'
    },
    {
      id: 'bp-2',
      judul: 'Dokumentasi Digitalisasi Tata Kelola Arsip Sekolah Terpadu untuk jenjang SMP (Kelas VII–IX)',
      kategori: 'Dokumentasi Kegiatan',
      ringkasan:
        'Implementasi portal sistem informasi manajemen sekolah terpadu untuk mendukung administrasi perangkat ajar, akreditasi, data siswa, dan alumni tracker.',
      isi_konten:
        'SMPN 2 Muting melaksanakan penguatan kapasitas pendidik serta digitalisasi tata kelola arsip akademik secara terpadu antara jenjang Sekolah Tsanawiyah (MTs) dan Sekolah Aliyah (MA).\n\nKegiatan ini mencakup penataan modul ajar RPP berbasis cloud, pemetaan data induk siswa, dokumentasi bukti fisik akreditasi sekolah, hingga pelacakan lulusan (alumni tracker) agar seluruh arsip tersimpan aman dan mudah diakses dewan guru.',
      gambar_url:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
      galeri_urls: [
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80'
      ],
      nama_siswa_terkait: 'Dewan Guru & Staf TU SMPN 2 Muting',
      tingkat_prestasi: 'Internal Sekolah',
      penulis: 'Admin Portal Sekolah',
      tanggal_publikasi: '2026-11-05',
      is_published: true,
      created_at: '2026-11-05T09:00:00.000Z'
    }
  ],
  guru: [
    {
      id: 'gr-1',
      nip: '197705142005011005',
      nuptk: '4744756657200012',
      nama_lengkap: 'H. Abdul Rahman, M.Pd.I',
      jenis_kelamin: 'Laki-laki',
      jabatan: 'Kepala Sekolah',
      mata_pelajaran: 'Manajemen Pendidikan Islam / Fikih',
      status_kepegawaian: 'PNS',
      pendidikan_terakhir: 'S2',
      no_hp: '0812-4800-2101',
      email: 'kamad@smpn2muting.sch.id',
      status_aktif: 'Aktif',
      created_at: '2026-11-01T08:00:00.000Z'
    },
    {
      id: 'gr-2',
      nip: '198609152014032004',
      nuptk: '8247764665300023',
      nama_lengkap: 'Ustadzah Siti Khadijah, S.Pd',
      jenis_kelamin: 'Perempuan',
      jabatan: 'Waka Kurikulum (SMPN 2 Muting)',
      mata_pelajaran: 'Matematika',
      status_kepegawaian: 'PNS',
      pendidikan_terakhir: 'S1',
      no_hp: '0812-4800-2102',
      email: 'siti.khadijah@smpn2muting.sch.id',
      status_aktif: 'Aktif',
      created_at: '2026-11-01T08:05:00.000Z'
    }
  ],
  sarana_prasarana: [
    {
      id: 'sp-1',
      kode_aset: 'SRP-001',
      nama_sarpras: 'Ruang Kelas Belajar (RKB) Jenjang SMPN 2 Muting',
      kategori: 'Ruang & Bangunan',
      jumlah: 12,
      satuan: 'Ruang',
      kondisi: 'Baik',
      lokasi: 'Gedung MTs & Gedung MA SMPN 2 Muting',
      tahun_pengadaan: '2021',
      keterangan: '6 ruang jenjang MTs (VII-IX) dan 6 ruang jenjang MA (X-XII)',
      created_at: '2026-11-01T08:00:00.000Z'
    },
    {
      id: 'sp-2',
      kode_aset: 'SRP-002',
      nama_sarpras: 'Komputer Laboratorium TIK & Asesmen (ANBK)',
      kategori: 'Peralatan Lab & TIK',
      jumlah: 24,
      satuan: 'Unit',
      kondisi: 'Baik',
      lokasi: 'Ruang Lab Komputer Sekolah',
      tahun_pengadaan: '2024',
      keterangan: 'Siap pakai untuk AKMI, ANBK SMP, dan ujian berbasis komputer',
      created_at: '2026-11-01T08:10:00.000Z'
    }
  ],
  alumni: [
    {
      id: 'al-1',
      nisn: '0054123901',
      nama_lengkap: 'Ahmad Zaki Mubarok',
      angkatan_lulus: '2025',
      jurusan: 'Reguler SMP',
      status_lulusan: 'Kuliah',
      instansi_tujuan: 'UIN Sunan Kalijaga / Universitas Musamus',
      bidang_jurusan: 'S1 Pendidikan Matematika',
      kota: 'Yogyakarta / Merauke',
      no_hp: '0812-4401-7788',
      email: 'zaki.m@alumni.smpn2muting.sch.id',
      link_ijazah_drive: 'https://drive.google.com/file/d/1example-ijazah-zaki/view',
      keterangan: 'Lulusan MA penerima beasiswa prestasi',
      created_at: '2026-11-01T08:00:00.000Z'
    }
  ],
  pengaturan_ppdb: [
    {
      id: 'ppdb-1',
      judul_tombol: 'Sistem PPDB Online SMPN 2 Muting',
      link_ppdb: 'https://ppdb.smpn2muting.sch.id',
      tahun_ajaran: '2026/2027',
      keterangan:
        'Layanan Penerimaan Peserta Didik Baru (PPDB) Online SMPN 2 Muting. Silakan klik tombol untuk menuju halaman pendaftaran.',
      is_active: true,
      updated_at: '2026-11-01T08:00:00.000Z',
      created_at: '2026-11-01T08:00:00.000Z'
    }
  ]
};

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  let changed = false;
  for (const key of Object.keys(initialSeedData)) {
    if (!Array.isArray(parsed[key])) {
      parsed[key] = initialSeedData[key];
      changed = true;
    }
  }
  if (changed) {
    writeDb(parsed);
  }
  return parsed;
}

function writeDb(data) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeGaleriUrls(val) {
  if (Array.isArray(val)) {
    return val.map((u) => String(u || '').trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((u) => String(u || '').trim()).filter(Boolean);
      }
    } catch {
      return trimmed
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// Middleware proteksi khusus Admin untuk aksi tulis (POST / PUT / DELETE)
function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({
      error: 'Akses ditolak. Hanya Admin yang dapat menambah, mengubah, atau menghapus data.'
    });
  }
  next();
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query('SELECT current_database() AS db');
      return res.json({
        status: 'ok',
        school: 'SMPN 2 Muting',
        mode: 'postgres',
        database: rows[0].db,
        timestamp: new Date().toISOString()
      });
    }
    res.json({
      status: 'ok',
      school: 'SMPN 2 Muting',
      mode: 'local',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ==========================================
// 1. ENDPOINT: bahan_ajar
// ==========================================
app.get('/api/bahan_ajar', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        'SELECT id, mata_pelajaran, kelas, judul_rpp, link_drive, created_at FROM bahan_ajar ORDER BY created_at DESC'
      );
      return res.json(rows);
    }
    const db = readDb();
    const sorted = [...db.bahan_ajar].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bahan_ajar', requireAdmin, async (req, res) => {
  const { mata_pelajaran, kelas, judul_rpp, link_drive } = req.body;
  if (!mata_pelajaran || !kelas || !judul_rpp || !link_drive) {
    return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
  }
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO bahan_ajar (mata_pelajaran, kelas, judul_rpp, link_drive)
         VALUES ($1, $2, $3, $4)
         RETURNING id, mata_pelajaran, kelas, judul_rpp, link_drive, created_at`,
        [mata_pelajaran.trim(), kelas.trim(), judul_rpp.trim(), link_drive.trim()]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const newItem = {
      id: crypto.randomUUID(),
      mata_pelajaran,
      kelas,
      judul_rpp,
      link_drive,
      created_at: new Date().toISOString()
    };
    db.bahan_ajar.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bahan_ajar/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM bahan_ajar WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Data bahan ajar berhasil dihapus.' });
    }
    const db = readDb();
    db.bahan_ajar = db.bahan_ajar.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Data bahan ajar berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ENDPOINT: akreditasi
// ==========================================
app.get('/api/akreditasi', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        'SELECT id, sub_bab, nama_dokumen, link_drive, keterangan, created_at FROM akreditasi ORDER BY created_at DESC'
      );
      return res.json(rows);
    }
    const db = readDb();
    const sorted = [...db.akreditasi].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/akreditasi', requireAdmin, async (req, res) => {
  const { sub_bab, nama_dokumen, link_drive, keterangan } = req.body;
  if (!sub_bab || !nama_dokumen || !link_drive) {
    return res.status(400).json({ error: 'Sub Bab, Nama Dokumen, dan Link Drive wajib diisi.' });
  }
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO akreditasi (sub_bab, nama_dokumen, link_drive, keterangan)
         VALUES ($1, $2, $3, $4)
         RETURNING id, sub_bab, nama_dokumen, link_drive, keterangan, created_at`,
        [sub_bab.trim(), nama_dokumen.trim(), link_drive.trim(), (keterangan || '').trim()]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const newItem = {
      id: crypto.randomUUID(),
      sub_bab,
      nama_dokumen,
      link_drive,
      keterangan: keterangan || '',
      created_at: new Date().toISOString()
    };
    db.akreditasi.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/akreditasi/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM akreditasi WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Dokumen akreditasi berhasil dihapus.' });
    }
    const db = readDb();
    db.akreditasi = db.akreditasi.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Dokumen akreditasi berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ENDPOINT: siswa (termasuk berkas KK & Akta G-Drive)
// ==========================================
const SISWA_COLUMNS =
  'id, nisn, nama_lengkap, kelas, angkatan, link_kk_drive, link_akta_drive, catatan_berkas, created_at';

app.get('/api/siswa', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(`SELECT ${SISWA_COLUMNS} FROM siswa ORDER BY created_at DESC`);
      return res.json(rows);
    }
    const db = readDb();
    const sorted = [...db.siswa].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/siswa/:id', async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID siswa tidak valid.' });
      }
      const { rows } = await pool.query(`SELECT ${SISWA_COLUMNS} FROM siswa WHERE id = $1`, [
        req.params.id
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
      }
      return res.json(rows[0]);
    }
    const db = readDb();
    const found = db.siswa.find((s) => s.id === req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
    }
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/siswa', requireAdmin, async (req, res) => {
  const {
    nisn,
    nama_lengkap,
    kelas,
    angkatan,
    link_kk_drive,
    link_akta_drive,
    catatan_berkas
  } = req.body;
  if (!nisn || !nama_lengkap || !kelas || !angkatan) {
    return res.status(400).json({ error: 'NISN, Nama Lengkap, Kelas, dan Angkatan wajib diisi.' });
  }
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO siswa (nisn, nama_lengkap, kelas, angkatan, link_kk_drive, link_akta_drive, catatan_berkas)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${SISWA_COLUMNS}`,
        [
          nisn.trim(),
          nama_lengkap.trim(),
          kelas.trim(),
          String(angkatan).trim(),
          (link_kk_drive || '').trim(),
          (link_akta_drive || '').trim(),
          (catatan_berkas || '').trim()
        ]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const exists = db.siswa.some((s) => s.nisn.trim() === nisn.trim());
    if (exists) {
      return res.status(400).json({ error: `NISN ${nisn} sudah terdaftar di sistem.` });
    }
    const newItem = {
      id: crypto.randomUUID(),
      nisn: nisn.trim(),
      nama_lengkap: nama_lengkap.trim(),
      kelas: kelas.trim(),
      angkatan: String(angkatan).trim(),
      link_kk_drive: (link_kk_drive || '').trim(),
      link_akta_drive: (link_akta_drive || '').trim(),
      catatan_berkas: (catatan_berkas || '').trim(),
      created_at: new Date().toISOString()
    };
    db.siswa.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: `NISN ${nisn} sudah terdaftar di sistem.` });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/siswa/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres && !UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'ID siswa tidak valid.' });
    }

    if (usePostgres) {
      const current = await pool.query(`SELECT ${SISWA_COLUMNS} FROM siswa WHERE id = $1`, [
        req.params.id
      ]);
      if (current.rowCount === 0) {
        return res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
      }
      const prev = current.rows[0];
      const nextNisn = req.body.nisn !== undefined ? String(req.body.nisn).trim() : prev.nisn;
      const nextNama =
        req.body.nama_lengkap !== undefined ? String(req.body.nama_lengkap).trim() : prev.nama_lengkap;
      const nextKelas = req.body.kelas !== undefined ? String(req.body.kelas).trim() : prev.kelas;
      const nextAngkatan =
        req.body.angkatan !== undefined ? String(req.body.angkatan).trim() : prev.angkatan;
      const nextKk =
        req.body.link_kk_drive !== undefined
          ? String(req.body.link_kk_drive || '').trim()
          : prev.link_kk_drive || '';
      const nextAkta =
        req.body.link_akta_drive !== undefined
          ? String(req.body.link_akta_drive || '').trim()
          : prev.link_akta_drive || '';
      const nextCatatan =
        req.body.catatan_berkas !== undefined
          ? String(req.body.catatan_berkas || '').trim()
          : prev.catatan_berkas || '';

      if (!nextNisn || !nextNama || !nextKelas || !nextAngkatan) {
        return res.status(400).json({ error: 'NISN, Nama Lengkap, Kelas, dan Angkatan wajib diisi.' });
      }

      const { rows } = await pool.query(
        `UPDATE siswa
         SET nisn = $1, nama_lengkap = $2, kelas = $3, angkatan = $4,
             link_kk_drive = $5, link_akta_drive = $6, catatan_berkas = $7
         WHERE id = $8
         RETURNING ${SISWA_COLUMNS}`,
        [nextNisn, nextNama, nextKelas, nextAngkatan, nextKk, nextAkta, nextCatatan, req.params.id]
      );
      return res.json(rows[0]);
    }

    const db = readDb();
    const idx = db.siswa.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
    }
    const prev = db.siswa[idx];
    const updated = {
      ...prev,
      nisn: req.body.nisn !== undefined ? String(req.body.nisn).trim() : prev.nisn,
      nama_lengkap:
        req.body.nama_lengkap !== undefined ? String(req.body.nama_lengkap).trim() : prev.nama_lengkap,
      kelas: req.body.kelas !== undefined ? String(req.body.kelas).trim() : prev.kelas,
      angkatan: req.body.angkatan !== undefined ? String(req.body.angkatan).trim() : prev.angkatan,
      link_kk_drive:
        req.body.link_kk_drive !== undefined
          ? String(req.body.link_kk_drive || '').trim()
          : prev.link_kk_drive || '',
      link_akta_drive:
        req.body.link_akta_drive !== undefined
          ? String(req.body.link_akta_drive || '').trim()
          : prev.link_akta_drive || '',
      catatan_berkas:
        req.body.catatan_berkas !== undefined
          ? String(req.body.catatan_berkas || '').trim()
          : prev.catatan_berkas || ''
    };
    db.siswa[idx] = updated;
    writeDb(db);
    res.json(updated);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'NISN sudah digunakan siswa lain.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Impor banyak siswa sekaligus (dari CSV). NISN yang sudah terdaftar dilewati.
app.post('/api/siswa/bulk', requireAdmin, async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Tidak ada data siswa untuk diimpor.' });
  }

  const invalid = [];
  const normalized = [];
  rows.forEach((row, i) => {
    const nisn = String(row.nisn || '').trim();
    const nama_lengkap = String(row.nama_lengkap || '').trim();
    const kelas = String(row.kelas || '').trim();
    const angkatan = String(row.angkatan || '').trim();
    if (!nisn || !nama_lengkap || !kelas || !angkatan) {
      invalid.push(i + 1);
    } else {
      normalized.push({
        nisn,
        nama_lengkap,
        kelas,
        angkatan,
        link_kk_drive: String(row.link_kk_drive || '').trim(),
        link_akta_drive: String(row.link_akta_drive || '').trim()
      });
    }
  });

  if (invalid.length > 0) {
    return res.status(400).json({
      error: `Data tidak lengkap pada baris ke: ${invalid.slice(0, 10).join(', ')}. Tidak ada data yang disimpan.`
    });
  }

  try {
    if (usePostgres) {
      const nisns = normalized.map((r) => r.nisn);
      const namas = normalized.map((r) => r.nama_lengkap);
      const kelass = normalized.map((r) => r.kelas);
      const angkatans = normalized.map((r) => r.angkatan);
      const kks = normalized.map((r) => r.link_kk_drive);
      const aktas = normalized.map((r) => r.link_akta_drive);

      const result = await pool.query(
        `INSERT INTO siswa (nisn, nama_lengkap, kelas, angkatan, link_kk_drive, link_akta_drive)
         SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])
         ON CONFLICT (nisn) DO NOTHING
         RETURNING id`,
        [nisns, namas, kelass, angkatans, kks, aktas]
      );
      const inserted = result.rowCount;
      const skipped = normalized.length - inserted;
      return res.status(201).json({ inserted, skipped });
    }

    const db = readDb();
    const existing = new Set(db.siswa.map((s) => s.nisn.trim()));
    const now = new Date().toISOString();
    let inserted = 0;
    let skipped = 0;

    normalized.forEach((row) => {
      if (existing.has(row.nisn)) {
        skipped++;
        return;
      }
      existing.add(row.nisn);
      db.siswa.push({
        id: crypto.randomUUID(),
        ...row,
        catatan_berkas: '',
        created_at: now
      });
      inserted++;
    });

    writeDb(db);
    res.status(201).json({ inserted, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/siswa/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM siswa WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Data siswa berhasil dihapus.' });
    }
    const db = readDb();
    db.siswa = db.siswa.filter((item) => item.id !== req.params.id);
    db.pernyataan_siswa = db.pernyataan_siswa.filter(
      (ps) => ps.siswa_id !== req.params.id
    );
    writeDb(db);
    res.json({ message: 'Data siswa berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ENDPOINT: pernyataan_siswa (dengan relasi siswa)
// ==========================================
app.get('/api/pernyataan_siswa', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `SELECT
           ps.id,
           ps.siswa_id,
           ps.jenis_surat,
           ps.link_drive_surat,
           ps.link_youtube_video,
           ps.created_at,
           json_build_object(
             'id', s.id,
             'nisn', s.nisn,
             'nama_lengkap', s.nama_lengkap,
             'kelas', s.kelas,
             'angkatan', s.angkatan,
             'created_at', s.created_at
           ) AS siswa
         FROM pernyataan_siswa ps
         JOIN siswa s ON s.id = ps.siswa_id
         ORDER BY ps.created_at DESC`
      );
      return res.json(rows);
    }
    const db = readDb();
    const enriched = db.pernyataan_siswa
      .map((ps) => {
        const siswaObj = db.siswa.find((s) => s.id === ps.siswa_id) || null;
        return {
          ...ps,
          siswa: siswaObj
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pernyataan_siswa', requireAdmin, async (req, res) => {
  const { siswa_id, jenis_surat, link_drive_surat, link_youtube_video } = req.body;
  if (!siswa_id || !jenis_surat || !link_drive_surat) {
    return res.status(400).json({
      error: 'Siswa, Jenis Surat, dan Link Google Drive Surat wajib diisi.'
    });
  }
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(siswa_id)) {
        return res.status(400).json({ error: 'ID siswa tidak valid.' });
      }
      const siswaResult = await pool.query(
        'SELECT id, nisn, nama_lengkap, kelas, angkatan, created_at FROM siswa WHERE id = $1',
        [siswa_id]
      );
      if (siswaResult.rowCount === 0) {
        return res.status(400).json({ error: 'Data siswa tidak ditemukan.' });
      }
      const { rows } = await pool.query(
        `INSERT INTO pernyataan_siswa (siswa_id, jenis_surat, link_drive_surat, link_youtube_video)
         VALUES ($1, $2, $3, $4)
         RETURNING id, siswa_id, jenis_surat, link_drive_surat, link_youtube_video, created_at`,
        [siswa_id, jenis_surat.trim(), link_drive_surat.trim(), (link_youtube_video || '').trim()]
      );
      return res.status(201).json({ ...rows[0], siswa: siswaResult.rows[0] });
    }
    const db = readDb();
    const siswaObj = db.siswa.find((s) => s.id === siswa_id);
    if (!siswaObj) {
      return res.status(400).json({ error: 'Data siswa tidak ditemukan.' });
    }
    const newItem = {
      id: crypto.randomUUID(),
      siswa_id,
      jenis_surat,
      link_drive_surat,
      link_youtube_video: link_youtube_video || '',
      created_at: new Date().toISOString()
    };
    db.pernyataan_siswa.push(newItem);
    writeDb(db);
    res.status(201).json({ ...newItem, siswa: siswaObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pernyataan_siswa/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM pernyataan_siswa WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Arsip pernyataan siswa berhasil dihapus.' });
    }
    const db = readDb();
    db.pernyataan_siswa = db.pernyataan_siswa.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Arsip pernyataan siswa berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ENDPOINT: berita_prestasi (Portal Berita & Dokumentasi - Publik)
// ==========================================
const BERITA_COLUMNS =
  'id, judul, kategori, ringkasan, isi_konten, gambar_url, galeri_urls, nama_siswa_terkait, tingkat_prestasi, penulis, tanggal_publikasi, is_published, created_at';

app.get('/api/berita_prestasi', async (req, res) => {
  const isAdminReq = req.headers['x-user-role'] === 'admin';
  const onlyPublished = req.query.published === 'true' || !isAdminReq;
  try {
    if (usePostgres) {
      const query = onlyPublished
        ? `SELECT ${BERITA_COLUMNS} FROM berita_prestasi WHERE is_published = true ORDER BY tanggal_publikasi DESC, created_at DESC`
        : `SELECT ${BERITA_COLUMNS} FROM berita_prestasi ORDER BY tanggal_publikasi DESC, created_at DESC`;
      const { rows } = await pool.query(query);
      return res.json(rows);
    }
    const db = readDb();
    const list = onlyPublished
      ? db.berita_prestasi.filter((b) => b.is_published !== false)
      : db.berita_prestasi;
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.tanggal_publikasi || b.created_at) -
        new Date(a.tanggal_publikasi || a.created_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/berita_prestasi/:id', async (req, res) => {
  const isAdminReq = req.headers['x-user-role'] === 'admin';
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID berita tidak valid.' });
      }
      const { rows } = await pool.query(
        `SELECT ${BERITA_COLUMNS} FROM berita_prestasi WHERE id = $1`,
        [req.params.id]
      );
      if (rows.length === 0 || (!rows[0].is_published && !isAdminReq)) {
        return res.status(404).json({ error: 'Berita atau dokumentasi tidak ditemukan.' });
      }
      return res.json(rows[0]);
    }
    const db = readDb();
    const found = db.berita_prestasi.find((b) => b.id === req.params.id);
    if (!found || (found.is_published === false && !isAdminReq)) {
      return res.status(404).json({ error: 'Berita atau dokumentasi tidak ditemukan.' });
    }
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/berita_prestasi', requireAdmin, async (req, res) => {
  const {
    judul,
    kategori,
    ringkasan,
    isi_konten,
    gambar_url,
    galeri_urls,
    nama_siswa_terkait,
    tingkat_prestasi,
    penulis,
    tanggal_publikasi,
    is_published
  } = req.body;

  if (!judul || !ringkasan || !isi_konten) {
    return res.status(400).json({ error: 'Judul, Ringkasan, dan Isi Berita wajib diisi.' });
  }

  const normalizedGaleri = normalizeGaleriUrls(galeri_urls);
  const pubDate = tanggal_publikasi || new Date().toISOString().slice(0, 10);
  const pubFlag = is_published === undefined ? true : Boolean(is_published);

  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO berita_prestasi
          (judul, kategori, ringkasan, isi_konten, gambar_url, galeri_urls, nama_siswa_terkait, tingkat_prestasi, penulis, tanggal_publikasi, is_published)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
         RETURNING ${BERITA_COLUMNS}`,
        [
          judul.trim(),
          (kategori || 'Prestasi Siswa').trim(),
          ringkasan.trim(),
          isi_konten.trim(),
          (gambar_url || '').trim(),
          JSON.stringify(normalizedGaleri),
          (nama_siswa_terkait || '').trim(),
          (tingkat_prestasi || '').trim(),
          (penulis || 'Tim Humas & Kesiswaan').trim(),
          pubDate,
          pubFlag
        ]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const newItem = {
      id: crypto.randomUUID(),
      judul: judul.trim(),
      kategori: (kategori || 'Prestasi Siswa').trim(),
      ringkasan: ringkasan.trim(),
      isi_konten: isi_konten.trim(),
      gambar_url: (gambar_url || '').trim(),
      galeri_urls: normalizedGaleri,
      nama_siswa_terkait: (nama_siswa_terkait || '').trim(),
      tingkat_prestasi: (tingkat_prestasi || '').trim(),
      penulis: (penulis || 'Tim Humas & Kesiswaan').trim(),
      tanggal_publikasi: pubDate,
      is_published: pubFlag,
      created_at: new Date().toISOString()
    };
    db.berita_prestasi.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/berita_prestasi/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres && !UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'ID berita tidak valid.' });
    }
    const normalizedGaleri =
      req.body.galeri_urls !== undefined ? normalizeGaleriUrls(req.body.galeri_urls) : null;

    if (usePostgres) {
      const current = await pool.query(
        `SELECT ${BERITA_COLUMNS} FROM berita_prestasi WHERE id = $1`,
        [req.params.id]
      );
      if (current.rowCount === 0) {
        return res.status(404).json({ error: 'Berita tidak ditemukan.' });
      }
      const prev = current.rows[0];
      const nextJudul = req.body.judul !== undefined ? String(req.body.judul).trim() : prev.judul;
      const nextRingkasan =
        req.body.ringkasan !== undefined ? String(req.body.ringkasan).trim() : prev.ringkasan;
      const nextIsi =
        req.body.isi_konten !== undefined ? String(req.body.isi_konten).trim() : prev.isi_konten;
      if (!nextJudul || !nextRingkasan || !nextIsi) {
        return res.status(400).json({ error: 'Judul, Ringkasan, dan Isi Berita wajib diisi.' });
      }
      const { rows } = await pool.query(
        `UPDATE berita_prestasi
         SET judul = $1, kategori = $2, ringkasan = $3, isi_konten = $4, gambar_url = $5,
             galeri_urls = $6::jsonb, nama_siswa_terkait = $7, tingkat_prestasi = $8,
             penulis = $9, tanggal_publikasi = $10, is_published = $11
         WHERE id = $12
         RETURNING ${BERITA_COLUMNS}`,
        [
          nextJudul,
          req.body.kategori !== undefined ? String(req.body.kategori).trim() : prev.kategori,
          nextRingkasan,
          nextIsi,
          req.body.gambar_url !== undefined
            ? String(req.body.gambar_url || '').trim()
            : prev.gambar_url || '',
          JSON.stringify(normalizedGaleri !== null ? normalizedGaleri : prev.galeri_urls || []),
          req.body.nama_siswa_terkait !== undefined
            ? String(req.body.nama_siswa_terkait || '').trim()
            : prev.nama_siswa_terkait || '',
          req.body.tingkat_prestasi !== undefined
            ? String(req.body.tingkat_prestasi || '').trim()
            : prev.tingkat_prestasi || '',
          req.body.penulis !== undefined
            ? String(req.body.penulis || '').trim()
            : prev.penulis || 'Tim Humas & Kesiswaan',
          req.body.tanggal_publikasi !== undefined
            ? req.body.tanggal_publikasi
            : prev.tanggal_publikasi,
          req.body.is_published !== undefined ? Boolean(req.body.is_published) : prev.is_published,
          req.params.id
        ]
      );
      return res.json(rows[0]);
    }

    const db = readDb();
    const idx = db.berita_prestasi.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Berita tidak ditemukan.' });
    }
    const prev = db.berita_prestasi[idx];
    const updated = {
      ...prev,
      ...req.body,
      galeri_urls: normalizedGaleri !== null ? normalizedGaleri : prev.galeri_urls || []
    };
    db.berita_prestasi[idx] = updated;
    writeDb(db);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/berita_prestasi/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM berita_prestasi WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Berita berhasil dihapus.' });
    }
    const db = readDb();
    db.berita_prestasi = db.berita_prestasi.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Berita berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ENDPOINT: guru (Database Data Guru & Tendik)
// ==========================================
const GURU_COLUMNS =
  'id, nip, nuptk, nama_lengkap, jenis_kelamin, jabatan, mata_pelajaran, status_kepegawaian, pendidikan_terakhir, no_hp, email, status_aktif, created_at';

app.get('/api/guru', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(`SELECT ${GURU_COLUMNS} FROM guru ORDER BY created_at DESC`);
      return res.json(rows);
    }
    const db = readDb();
    const sorted = [...db.guru].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/guru', requireAdmin, async (req, res) => {
  const {
    nip,
    nuptk,
    nama_lengkap,
    jenis_kelamin,
    jabatan,
    mata_pelajaran,
    status_kepegawaian,
    pendidikan_terakhir,
    no_hp,
    email,
    status_aktif
  } = req.body;

  if (!nama_lengkap || !jabatan) {
    return res.status(400).json({ error: 'Nama Lengkap dan Jabatan wajib diisi.' });
  }

  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO guru
          (nip, nuptk, nama_lengkap, jenis_kelamin, jabatan, mata_pelajaran, status_kepegawaian, pendidikan_terakhir, no_hp, email, status_aktif)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING ${GURU_COLUMNS}`,
        [
          (nip || '-').trim(),
          (nuptk || '').trim(),
          nama_lengkap.trim(),
          (jenis_kelamin || 'Laki-laki').trim(),
          jabatan.trim(),
          (mata_pelajaran || '-').trim(),
          (status_kepegawaian || 'PNS').trim(),
          (pendidikan_terakhir || 'S1').trim(),
          (no_hp || '').trim(),
          (email || '').trim(),
          (status_aktif || 'Aktif').trim()
        ]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const newItem = {
      id: crypto.randomUUID(),
      nip: (nip || '-').trim(),
      nuptk: (nuptk || '').trim(),
      nama_lengkap: nama_lengkap.trim(),
      jenis_kelamin: (jenis_kelamin || 'Laki-laki').trim(),
      jabatan: jabatan.trim(),
      mata_pelajaran: (mata_pelajaran || '-').trim(),
      status_kepegawaian: (status_kepegawaian || 'PNS').trim(),
      pendidikan_terakhir: (pendidikan_terakhir || 'S1').trim(),
      no_hp: (no_hp || '').trim(),
      email: (email || '').trim(),
      status_aktif: (status_aktif || 'Aktif').trim(),
      created_at: new Date().toISOString()
    };
    db.guru.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/guru/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres && !UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'ID tidak valid.' });
    }
    if (usePostgres) {
      const current = await pool.query(`SELECT ${GURU_COLUMNS} FROM guru WHERE id = $1`, [
        req.params.id
      ]);
      if (current.rowCount === 0) {
        return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      }
      const prev = current.rows[0];
      const nextNama =
        req.body.nama_lengkap !== undefined ? String(req.body.nama_lengkap).trim() : prev.nama_lengkap;
      const nextJabatan =
        req.body.jabatan !== undefined ? String(req.body.jabatan).trim() : prev.jabatan;
      if (!nextNama || !nextJabatan) {
        return res.status(400).json({ error: 'Nama Lengkap dan Jabatan wajib diisi.' });
      }
      const { rows } = await pool.query(
        `UPDATE guru
         SET nip = $1, nuptk = $2, nama_lengkap = $3, jenis_kelamin = $4, jabatan = $5,
             mata_pelajaran = $6, status_kepegawaian = $7, pendidikan_terakhir = $8,
             no_hp = $9, email = $10, status_aktif = $11
         WHERE id = $12
         RETURNING ${GURU_COLUMNS}`,
        [
          req.body.nip !== undefined ? String(req.body.nip || '-').trim() : prev.nip,
          req.body.nuptk !== undefined ? String(req.body.nuptk || '').trim() : prev.nuptk,
          nextNama,
          req.body.jenis_kelamin !== undefined ? String(req.body.jenis_kelamin).trim() : prev.jenis_kelamin,
          nextJabatan,
          req.body.mata_pelajaran !== undefined
            ? String(req.body.mata_pelajaran || '-').trim()
            : prev.mata_pelajaran,
          req.body.status_kepegawaian !== undefined
            ? String(req.body.status_kepegawaian).trim()
            : prev.status_kepegawaian,
          req.body.pendidikan_terakhir !== undefined
            ? String(req.body.pendidikan_terakhir).trim()
            : prev.pendidikan_terakhir,
          req.body.no_hp !== undefined ? String(req.body.no_hp || '').trim() : prev.no_hp,
          req.body.email !== undefined ? String(req.body.email || '').trim() : prev.email,
          req.body.status_aktif !== undefined
            ? String(req.body.status_aktif).trim()
            : prev.status_aktif,
          req.params.id
        ]
      );
      return res.json(rows[0]);
    }
    const db = readDb();
    const idx = db.guru.findIndex((g) => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
    db.guru[idx] = { ...db.guru[idx], ...req.body };
    writeDb(db);
    res.json(db.guru[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/guru/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM guru WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Data guru berhasil dihapus.' });
    }
    const db = readDb();
    db.guru = db.guru.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Data guru berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. ENDPOINT: sarana_prasarana (Inventaris Sarana & Prasarana)
// ==========================================
const SARPRAS_COLUMNS =
  'id, kode_aset, nama_sarpras, kategori, jumlah, satuan, kondisi, lokasi, tahun_pengadaan, keterangan, created_at';

app.get('/api/sarana_prasarana', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `SELECT ${SARPRAS_COLUMNS} FROM sarana_prasarana ORDER BY created_at DESC`
      );
      return res.json(rows);
    }
    const db = readDb();
    const sorted = [...db.sarana_prasarana].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sarana_prasarana', requireAdmin, async (req, res) => {
  const {
    kode_aset,
    nama_sarpras,
    kategori,
    jumlah,
    satuan,
    kondisi,
    lokasi,
    tahun_pengadaan,
    keterangan
  } = req.body;

  if (!nama_sarpras || !kategori) {
    return res.status(400).json({ error: 'Nama Sarana/Prasarana dan Kategori wajib diisi.' });
  }

  const parsedJumlah = Math.max(0, Number.parseInt(jumlah, 10) || 1);

  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO sarana_prasarana
          (kode_aset, nama_sarpras, kategori, jumlah, satuan, kondisi, lokasi, tahun_pengadaan, keterangan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${SARPRAS_COLUMNS}`,
        [
          (kode_aset || '').trim(),
          nama_sarpras.trim(),
          kategori.trim(),
          parsedJumlah,
          (satuan || 'Unit').trim(),
          (kondisi || 'Baik').trim(),
          (lokasi || '').trim(),
          (tahun_pengadaan || '').trim(),
          (keterangan || '').trim()
        ]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const newItem = {
      id: crypto.randomUUID(),
      kode_aset: (kode_aset || '').trim(),
      nama_sarpras: nama_sarpras.trim(),
      kategori: kategori.trim(),
      jumlah: parsedJumlah,
      satuan: (satuan || 'Unit').trim(),
      kondisi: (kondisi || 'Baik').trim(),
      lokasi: (lokasi || '').trim(),
      tahun_pengadaan: (tahun_pengadaan || '').trim(),
      keterangan: (keterangan || '').trim(),
      created_at: new Date().toISOString()
    };
    db.sarana_prasarana.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sarana_prasarana/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres && !UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'ID tidak valid.' });
    }
    if (usePostgres) {
      const current = await pool.query(
        `SELECT ${SARPRAS_COLUMNS} FROM sarana_prasarana WHERE id = $1`,
        [req.params.id]
      );
      if (current.rowCount === 0) {
        return res.status(404).json({ error: 'Data sarana/prasarana tidak ditemukan.' });
      }
      const prev = current.rows[0];
      const nextNama =
        req.body.nama_sarpras !== undefined ? String(req.body.nama_sarpras).trim() : prev.nama_sarpras;
      const nextKategori =
        req.body.kategori !== undefined ? String(req.body.kategori).trim() : prev.kategori;
      if (!nextNama || !nextKategori) {
        return res.status(400).json({ error: 'Nama Sarana/Prasarana dan Kategori wajib diisi.' });
      }
      const nextJumlah =
        req.body.jumlah !== undefined ? Math.max(0, Number.parseInt(req.body.jumlah, 10) || 0) : prev.jumlah;
      const { rows } = await pool.query(
        `UPDATE sarana_prasarana
         SET kode_aset = $1, nama_sarpras = $2, kategori = $3, jumlah = $4, satuan = $5,
             kondisi = $6, lokasi = $7, tahun_pengadaan = $8, keterangan = $9
         WHERE id = $10
         RETURNING ${SARPRAS_COLUMNS}`,
        [
          req.body.kode_aset !== undefined ? String(req.body.kode_aset || '').trim() : prev.kode_aset,
          nextNama,
          nextKategori,
          nextJumlah,
          req.body.satuan !== undefined ? String(req.body.satuan || 'Unit').trim() : prev.satuan,
          req.body.kondisi !== undefined ? String(req.body.kondisi || 'Baik').trim() : prev.kondisi,
          req.body.lokasi !== undefined ? String(req.body.lokasi || '').trim() : prev.lokasi,
          req.body.tahun_pengadaan !== undefined
            ? String(req.body.tahun_pengadaan || '').trim()
            : prev.tahun_pengadaan,
          req.body.keterangan !== undefined
            ? String(req.body.keterangan || '').trim()
            : prev.keterangan,
          req.params.id
        ]
      );
      return res.json(rows[0]);
    }
    const db = readDb();
    const idx = db.sarana_prasarana.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Data sarana/prasarana tidak ditemukan.' });
    db.sarana_prasarana[idx] = {
      ...db.sarana_prasarana[idx],
      ...req.body,
      jumlah:
        req.body.jumlah !== undefined
          ? Math.max(0, Number.parseInt(req.body.jumlah, 10) || 0)
          : db.sarana_prasarana[idx].jumlah
    };
    writeDb(db);
    res.json(db.sarana_prasarana[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sarana_prasarana/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM sarana_prasarana WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Data sarana & prasarana berhasil dihapus.' });
    }
    const db = readDb();
    db.sarana_prasarana = db.sarana_prasarana.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Data sarana & prasarana berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. ENDPOINT: alumni (Alumni Tracker & Arsip Ijazah G-Drive)
// ==========================================
const ALUMNI_COLUMNS =
  'id, nisn, nama_lengkap, angkatan_lulus, jurusan, status_lulusan, instansi_tujuan, bidang_jurusan, kota, no_hp, email, link_ijazah_drive, keterangan, created_at';

app.get('/api/alumni', async (req, res) => {
  try {
    if (usePostgres) {
      const { rows } = await pool.query(`SELECT ${ALUMNI_COLUMNS} FROM alumni ORDER BY created_at DESC`);
      return res.json(rows);
    }
    const db = readDb();
    const sorted = [...db.alumni].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alumni', requireAdmin, async (req, res) => {
  const {
    nisn,
    nama_lengkap,
    angkatan_lulus,
    jurusan,
    status_lulusan,
    instansi_tujuan,
    bidang_jurusan,
    kota,
    no_hp,
    email,
    link_ijazah_drive,
    keterangan
  } = req.body;

  if (!nama_lengkap || !angkatan_lulus) {
    return res.status(400).json({ error: 'Nama Lengkap dan Tahun Angkatan Lulus wajib diisi.' });
  }

  try {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO alumni
          (nisn, nama_lengkap, angkatan_lulus, jurusan, status_lulusan, instansi_tujuan, bidang_jurusan, kota, no_hp, email, link_ijazah_drive, keterangan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING ${ALUMNI_COLUMNS}`,
        [
          (nisn || '').trim(),
          nama_lengkap.trim(),
          String(angkatan_lulus).trim(),
          (jurusan || 'IPA').trim(),
          (status_lulusan || 'Belum Terdata').trim(),
          (instansi_tujuan || '').trim(),
          (bidang_jurusan || '').trim(),
          (kota || '').trim(),
          (no_hp || '').trim(),
          (email || '').trim(),
          (link_ijazah_drive || '').trim(),
          (keterangan || '').trim()
        ]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const newItem = {
      id: crypto.randomUUID(),
      nisn: (nisn || '').trim(),
      nama_lengkap: nama_lengkap.trim(),
      angkatan_lulus: String(angkatan_lulus).trim(),
      jurusan: (jurusan || 'IPA').trim(),
      status_lulusan: (status_lulusan || 'Belum Terdata').trim(),
      instansi_tujuan: (instansi_tujuan || '').trim(),
      bidang_jurusan: (bidang_jurusan || '').trim(),
      kota: (kota || '').trim(),
      no_hp: (no_hp || '').trim(),
      email: (email || '').trim(),
      link_ijazah_drive: (link_ijazah_drive || '').trim(),
      keterangan: (keterangan || '').trim(),
      created_at: new Date().toISOString()
    };
    db.alumni.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alumni/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres && !UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'ID tidak valid.' });
    }
    if (usePostgres) {
      const current = await pool.query(`SELECT ${ALUMNI_COLUMNS} FROM alumni WHERE id = $1`, [
        req.params.id
      ]);
      if (current.rowCount === 0) {
        return res.status(404).json({ error: 'Data alumni tidak ditemukan.' });
      }
      const prev = current.rows[0];
      const nextNama =
        req.body.nama_lengkap !== undefined ? String(req.body.nama_lengkap).trim() : prev.nama_lengkap;
      const nextAngkatan =
        req.body.angkatan_lulus !== undefined
          ? String(req.body.angkatan_lulus).trim()
          : prev.angkatan_lulus;
      if (!nextNama || !nextAngkatan) {
        return res.status(400).json({ error: 'Nama Lengkap dan Angkatan Lulus wajib diisi.' });
      }
      const { rows } = await pool.query(
        `UPDATE alumni
         SET nisn = $1, nama_lengkap = $2, angkatan_lulus = $3, jurusan = $4,
             status_lulusan = $5, instansi_tujuan = $6, bidang_jurusan = $7,
             kota = $8, no_hp = $9, email = $10, link_ijazah_drive = $11, keterangan = $12
         WHERE id = $13
         RETURNING ${ALUMNI_COLUMNS}`,
        [
          req.body.nisn !== undefined ? String(req.body.nisn || '').trim() : prev.nisn,
          nextNama,
          nextAngkatan,
          req.body.jurusan !== undefined ? String(req.body.jurusan || '').trim() : prev.jurusan,
          req.body.status_lulusan !== undefined
            ? String(req.body.status_lulusan || 'Belum Terdata').trim()
            : prev.status_lulusan,
          req.body.instansi_tujuan !== undefined
            ? String(req.body.instansi_tujuan || '').trim()
            : prev.instansi_tujuan,
          req.body.bidang_jurusan !== undefined
            ? String(req.body.bidang_jurusan || '').trim()
            : prev.bidang_jurusan,
          req.body.kota !== undefined ? String(req.body.kota || '').trim() : prev.kota,
          req.body.no_hp !== undefined ? String(req.body.no_hp || '').trim() : prev.no_hp,
          req.body.email !== undefined ? String(req.body.email || '').trim() : prev.email,
          req.body.link_ijazah_drive !== undefined
            ? String(req.body.link_ijazah_drive || '').trim()
            : prev.link_ijazah_drive,
          req.body.keterangan !== undefined
            ? String(req.body.keterangan || '').trim()
            : prev.keterangan,
          req.params.id
        ]
      );
      return res.json(rows[0]);
    }
    const db = readDb();
    const idx = db.alumni.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Data alumni tidak ditemukan.' });
    db.alumni[idx] = { ...db.alumni[idx], ...req.body };
    writeDb(db);
    res.json(db.alumni[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/alumni/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      await pool.query('DELETE FROM alumni WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Data alumni berhasil dihapus.' });
    }
    const db = readDb();
    db.alumni = db.alumni.filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: 'Data alumni berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. ENDPOINT: pengaturan_ppdb (Hyperlink Sistem PPDB)
// ==========================================
async function ensurePpdbTable() {
  if (!usePostgres) return;
  await pool.query(`
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
  `);
}

app.get('/api/pengaturan_ppdb', async (req, res) => {
  try {
    if (usePostgres) {
      await ensurePpdbTable();
      const { rows } = await pool.query(
        `SELECT id, judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active, updated_at, created_at
         FROM pengaturan_ppdb
         ORDER BY updated_at DESC, created_at DESC`
      );
      return res.json(rows);
    }
    const db = readDb();
    res.json(db.pengaturan_ppdb || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pengaturan_ppdb', requireAdmin, async (req, res) => {
  const judul_tombol = String(req.body.judul_tombol || 'Sistem PPDB Online SMPN 2 Muting').trim();
  const link_ppdb = String(req.body.link_ppdb || '').trim();
  const tahun_ajaran = String(req.body.tahun_ajaran || '2026/2027').trim();
  const keterangan = String(
    req.body.keterangan || 'Layanan Penerimaan Peserta Didik Baru (PPDB) Online SMPN 2 Muting.'
  ).trim();
  const is_active = req.body.is_active !== undefined ? Boolean(req.body.is_active) : true;

  if (!link_ppdb) {
    return res.status(400).json({ error: 'Link / URL Sistem PPDB wajib diisi.' });
  }

  try {
    if (usePostgres) {
      await ensurePpdbTable();
      const { rows } = await pool.query(
        `INSERT INTO pengaturan_ppdb (judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active, updated_at, created_at`,
        [judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active]
      );
      return res.status(201).json(rows[0]);
    }
    const db = readDb();
    const now = new Date().toISOString();
    const newItem = {
      id: crypto.randomUUID(),
      judul_tombol,
      link_ppdb,
      tahun_ajaran,
      keterangan,
      is_active,
      updated_at: now,
      created_at: now
    };
    db.pengaturan_ppdb = [newItem];
    writeDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pengaturan_ppdb/:id', requireAdmin, async (req, res) => {
  try {
    if (usePostgres) {
      await ensurePpdbTable();
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'ID tidak valid.' });
      }
      const existing = await pool.query('SELECT * FROM pengaturan_ppdb WHERE id = $1', [
        req.params.id
      ]);
      if (existing.rowCount === 0) {
        return res.status(404).json({ error: 'Pengaturan PPDB tidak ditemukan.' });
      }
      const prev = existing.rows[0];
      const judul_tombol =
        req.body.judul_tombol !== undefined
          ? String(req.body.judul_tombol).trim() || 'Sistem PPDB Online SMPN 2 Muting'
          : prev.judul_tombol;
      const link_ppdb =
        req.body.link_ppdb !== undefined ? String(req.body.link_ppdb).trim() : prev.link_ppdb;
      const tahun_ajaran =
        req.body.tahun_ajaran !== undefined
          ? String(req.body.tahun_ajaran).trim()
          : prev.tahun_ajaran;
      const keterangan =
        req.body.keterangan !== undefined ? String(req.body.keterangan).trim() : prev.keterangan;
      const is_active =
        req.body.is_active !== undefined ? Boolean(req.body.is_active) : prev.is_active;

      if (!link_ppdb) {
        return res.status(400).json({ error: 'Link / URL Sistem PPDB wajib diisi.' });
      }

      const { rows } = await pool.query(
        `UPDATE pengaturan_ppdb
         SET judul_tombol = $1,
             link_ppdb = $2,
             tahun_ajaran = $3,
             keterangan = $4,
             is_active = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING id, judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active, updated_at, created_at`,
        [judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active, req.params.id]
      );
      return res.json(rows[0]);
    }

    const db = readDb();
    const list = db.pengaturan_ppdb || [];
    const idx = list.findIndex((item) => item.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pengaturan PPDB tidak ditemukan.' });
    }
    const updated = {
      ...list[idx],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    if (!String(updated.link_ppdb || '').trim()) {
      return res.status(400).json({ error: 'Link / URL Sistem PPDB wajib diisi.' });
    }
    db.pengaturan_ppdb[idx] = updated;
    writeDb(db);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  if (!usePostgres) {
    ensureDbFile();
  }
  console.log(`========================================================`);
  console.log(`Server Backend SMPN 2 Muting berjalan di http://localhost:${PORT}`);
  console.log(`Mode Database: ${DB_MODE} (${usePostgres ? 'PostgreSQL Lokal' : 'JSON Lokal'})`);
  console.log(`========================================================`);
});
