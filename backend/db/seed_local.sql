-- Data contoh untuk development lokal SMPN 2 Muting (aman dijalankan ulang: hanya mengisi tabel yang masih kosong)

INSERT INTO bahan_ajar (mata_pelajaran, kelas, judul_rpp, link_drive)
SELECT v.mata_pelajaran, v.kelas, v.judul_rpp, v.link_drive
FROM (VALUES
  ('IPA Terpadu', 'VII-A', 'Modul Ajar Klasifikasi Makhluk Hidup & Ekosistem Lokal Merauke Kelas VII SMP', 'https://drive.google.com/file/d/1example-rpp-ipa-vii-smpn2muting/view'),
  ('Matematika', 'VIII-A', 'Modul Ajar Teorema Pythagoras dan Bangun Ruang Sisi Datar Kurikulum Merdeka Kelas VIII', 'https://drive.google.com/file/d/1example-rpp-matematika-viii-smpn2muting/view'),
  ('Bahasa Indonesia', 'IX-A', 'RPP Teks Laporan Percobaan dan Pidato Persuasif Kelas IX SMPN 2 Muting', 'https://drive.google.com/file/d/1example-rpp-bindo-ix-smpn2muting/view')
) AS v(mata_pelajaran, kelas, judul_rpp, link_drive)
WHERE NOT EXISTS (SELECT 1 FROM bahan_ajar);

INSERT INTO akreditasi (sub_bab, nama_dokumen, link_drive, keterangan)
SELECT v.sub_bab, v.nama_dokumen, v.link_drive, v.keterangan
FROM (VALUES
  ('Komponen 1 - Mutu Lulusan', 'Rekapitulasi Prestasi Akademik & Non-Akademik Siswa SMPN 2 Muting 3 Tahun Terakhir', 'https://drive.google.com/file/d/1example-akreditasi-mutu-lulusan-smpn2muting/view', 'File Excel & PDF bukti sertifikat OSN/O2SN/FLS2N tingkat Distrik Muting & Kabupaten Merauke'),
  ('Komponen 2 - Proses Pembelajaran', 'Dokumen Supervisi Akademik Guru SMPN 2 Muting Semester Ganjil', 'https://drive.google.com/file/d/1example-akreditasi-supervisi-smpn2muting/view', 'Sudah diverifikasi oleh Kepala SMPN 2 Muting'),
  ('Komponen 4 - Manajemen Sekolah', 'RKS dan RKAS SMPN 2 Muting Tahun Ajaran Berjalan', 'https://drive.google.com/file/d/1example-akreditasi-rkas-smpn2muting/view', 'Dokumen PDF bertanda tangan Komite Sekolah & Kepala SMPN 2 Muting')
) AS v(sub_bab, nama_dokumen, link_drive, keterangan)
WHERE NOT EXISTS (SELECT 1 FROM akreditasi);

INSERT INTO siswa (nisn, nama_lengkap, kelas, angkatan, link_kk_drive, link_akta_drive, catatan_berkas)
SELECT v.nisn, v.nama_lengkap, v.kelas, v.angkatan, v.link_kk_drive, v.link_akta_drive, v.catatan_berkas
FROM (VALUES
  ('0101234561', 'Yohanes Pratama Gebze', 'VII-A', '2026', 'https://drive.google.com/file/d/1example-kk-yohanes/view', 'https://drive.google.com/file/d/1example-akta-yohanes/view', 'KK & Akta lengkap terverifikasi Wali Kelas VII-A'),
  ('0099876542', 'Maria Fransiska Mahuze', 'VIII-A', '2025', 'https://drive.google.com/file/d/1example-kk-maria/view', '', 'Akta kelahiran sedang proses legalisir Disdukcapil'),
  ('0085432189', 'Bagus Setiawan', 'IX-A', '2024', '', '', 'Belum mengunggah tautan KK & Akta')
) AS v(nisn, nama_lengkap, kelas, angkatan, link_kk_drive, link_akta_drive, catatan_berkas)
WHERE NOT EXISTS (SELECT 1 FROM siswa);

INSERT INTO pernyataan_siswa (siswa_id, jenis_surat, link_drive_surat, link_youtube_video)
SELECT s.id, v.jenis_surat, v.link_drive_surat, v.link_youtube_video
FROM (VALUES
  ('0101234561', 'Surat Pernyataan Tata Tertib Peserta Didik Baru SMPN 2 Muting', 'https://drive.google.com/file/d/1example-surat-tatib-yohanes/view', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ('0099876542', 'Surat Pernyataan Komitmen Tim Olimpiade Sains Nasional (OSN) SMP', 'https://drive.google.com/file/d/1example-surat-osn-maria/view', 'https://www.youtube.com/watch?v=9bZkp7q19f0')
) AS v(nisn, jenis_surat, link_drive_surat, link_youtube_video)
JOIN siswa s ON s.nisn = v.nisn
WHERE NOT EXISTS (SELECT 1 FROM pernyataan_siswa);

INSERT INTO berita_prestasi (judul, kategori, ringkasan, isi_konten, gambar_url, galeri_urls, nama_siswa_terkait, tingkat_prestasi, penulis, tanggal_publikasi, is_published)
SELECT v.judul, v.kategori, v.ringkasan, v.isi_konten, v.gambar_url, v.galeri_urls::jsonb, v.nama_siswa_terkait, v.tingkat_prestasi, v.penulis, v.tanggal_publikasi::date, v.is_published
FROM (VALUES
  (
    'Tim OSN SMPN 2 Muting Raih Prestasi Gemilang pada Olimpiade Sains Nasional Tingkat Kabupaten Merauke',
    'Prestasi Siswa',
    'Perwakilan siswa SMPN 2 Muting berhasil meraih prestasi terbaik pada cabang IPA dan Matematika tingkat SMP se-Kabupaten Merauke.',
    E'Kabar membanggakan datang dari kontingen Olimpiade Sains Nasional (OSN) SMPN 2 Muting. Setelah mengikuti pembinaan intensif bersama para guru pembimbing, Yohanes Pratama Gebze (VII-A) dan Maria Fransiska Mahuze (VIII-A) berhasil meraih prestasi membanggakan tingkat Kabupaten Merauke.\n\nKepala SMPN 2 Muting menyampaikan apresiasi setinggi-tingginya kepada para peserta didik, orang tua/wali, serta dewan guru atas kerja keras dan dedikasi dalam mengharumkan nama sekolah di Distrik Muting.\n\nSelanjutnya, tim sekolah akan dipersiapkan menuju seleksi tingkat Provinsi Papua Selatan.',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80"]',
    'Yohanes Pratama Gebze (VII-A) & Maria Fransiska Mahuze (VIII-A)',
    'Tingkat Kabupaten Merauke',
    'Tim Humas SMPN 2 Muting',
    '2026-11-10',
    true
  ),
  (
    'Transformasi Digital Administrasi & Arsip Akademik Terpadu di SMPN 2 Muting',
    'Dokumentasi Kegiatan',
    'Implementasi portal sistem informasi manajemen sekolah terpadu untuk mendukung administrasi perangkat ajar, akreditasi, berkas siswa, dan pelacakan alumni.',
    E'SMPN 2 Muting melaksanakan peningkatan kapasitas pendidik serta digitalisasi tata kelola arsip akademik secara terpadu untuk seluruh rombongan belajar Kelas VII, VIII, dan IX.\n\nKegiatan ini mencakup penataan modul ajar Kurikulum Merdeka berbasis cloud, pemetaan data induk siswa, dokumentasi bukti fisik akreditasi sekolah, hingga pelacakan lulusan (alumni tracker) agar seluruh arsip tersimpan aman dan mudah diakses dewan guru.',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80"]',
    'Dewan Guru & Staf TU SMPN 2 Muting',
    'Internal Sekolah',
    'Admin Portal Sekolah',
    '2026-11-05',
    true
  ),
  (
    'Pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) & Projek Penguatan Profil Pelajar Pancasila (P5)',
    'Berita Sekolah',
    'SMPN 2 Muting sukses menyelenggarakan ANBK serta gelar karya P5 bertema kearifan lokal Distrik Muting.',
    E'Seluruh peserta didik kelas VIII SMPN 2 Muting mengikuti pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) di laboratorium komputer sekolah dengan tertib dan lancar.\n\nBersamaan dengan kegiatan akademik tersebut, siswa kelas VII dan IX juga menampilkan hasil Projek Penguatan Profil Pelajar Pancasila (P5) yang mengangkat potensi pangan dan budaya lokal di wilayah Muting, Kabupaten Merauke.',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    '[]',
    'Seluruh Siswa Kelas VII–IX SMPN 2 Muting',
    'Tingkat Sekolah',
    'Bidang Kurikulum',
    '2026-10-29',
    true
  )
) AS v(judul, kategori, ringkasan, isi_konten, gambar_url, galeri_urls, nama_siswa_terkait, tingkat_prestasi, penulis, tanggal_publikasi, is_published)
WHERE NOT EXISTS (SELECT 1 FROM berita_prestasi);

INSERT INTO guru (nip, nuptk, nama_lengkap, jenis_kelamin, jabatan, mata_pelajaran, status_kepegawaian, pendidikan_terakhir, no_hp, email, status_aktif)
SELECT v.nip, v.nuptk, v.nama_lengkap, v.jenis_kelamin, v.jabatan, v.mata_pelajaran, v.status_kepegawaian, v.pendidikan_terakhir, v.no_hp, v.email, v.status_aktif
FROM (VALUES
  ('197804122005011008', '4544756657200018', 'Drs. Paulus Ndiken, M.Pd', 'Laki-laki', 'Kepala Sekolah', 'Manajemen Pendidikan / IPS', 'PNS', 'S2', '0812-4800-3101', 'kepsek@smpn2muting.sch.id', 'Aktif'),
  ('198706192014032005', '8951765666300029', 'Rina Kusumawardhani, S.Pd', 'Perempuan', 'Waka Kurikulum', 'Matematika', 'PNS', 'S1', '0812-4800-3102', 'rina.kusuma@smpn2muting.sch.id', 'Aktif'),
  ('199208142022211009', '6146770671130044', 'Hendrikus Kaize, S.Pd', 'Laki-laki', 'Koordinator Kesiswaan & Pembina OSIS', 'IPA Terpadu', 'PPPK', 'S1', '0813-5520-3203', 'hendrikus.kaize@smpn2muting.sch.id', 'Aktif'),
  ('-', '2439772673130091', 'Ayu Lestari, S.Kom', 'Perempuan', 'Wali Kelas VII-A & Laboran TIK', 'Informatika / Prakarya', 'GTT / Honorer', 'S1', '0821-9910-4304', 'ayu.lestari@smpn2muting.sch.id', 'Aktif')
) AS v(nip, nuptk, nama_lengkap, jenis_kelamin, jabatan, mata_pelajaran, status_kepegawaian, pendidikan_terakhir, no_hp, email, status_aktif)
WHERE NOT EXISTS (SELECT 1 FROM guru);

INSERT INTO sarana_prasarana (kode_aset, nama_sarpras, kategori, jumlah, satuan, kondisi, lokasi, tahun_pengadaan, keterangan)
SELECT v.kode_aset, v.nama_sarpras, v.kategori, v.jumlah, v.satuan, v.kondisi, v.lokasi, v.tahun_pengadaan, v.keterangan
FROM (VALUES
  ('SRP-001', 'Ruang Kelas Belajar (RKB) Kelas VII, VIII & IX', 'Ruang & Bangunan', 9, 'Ruang', 'Baik', 'Gedung Utama SMPN 2 Muting', '2021', 'Masing-masing 3 rombel untuk kelas VII, VIII, dan IX'),
  ('SRP-002', 'Komputer Chromebook & PC Laboratorium ANBK', 'Peralatan Lab & TIK', 30, 'Unit', 'Baik', 'Ruang Lab Komputer SMPN 2 Muting', '2024', 'Siap pakai untuk pelaksanaan ANBK dan pembelajaran Informatika'),
  ('SRP-003', 'Kit Praktikum IPA Terpadu SMP (Fisika & Biologi)', 'Peralatan Lab & TIK', 8, 'Set', 'Baik', 'Laboratorium IPA', '2022', 'Lengkap dengan mikroskop dan alat peraga anatomi'),
  ('SRP-004', 'Meja & Kursi Belajar Siswa Standar SMP', 'Mebelair Kelas', 240, 'Set', 'Baik', 'Seluruh Ruang Kelas VII–IX', '2022', 'Kondisi kokoh dan layak pakai'),
  ('SRP-005', 'Lapangan Olahraga Multifungsi & Perpustakaan Sekolah', 'Fasilitas Olahraga & Literasi', 1, 'Paket', 'Baik', 'Area Tengah SMPN 2 Muting', '2020', 'Digunakan untuk upacara, olahraga, dan kegiatan literasi siswa')
) AS v(kode_aset, nama_sarpras, kategori, jumlah, satuan, kondisi, lokasi, tahun_pengadaan, keterangan)
WHERE NOT EXISTS (SELECT 1 FROM sarana_prasarana);

INSERT INTO alumni (nisn, nama_lengkap, angkatan_lulus, jurusan, status_lulusan, instansi_tujuan, bidang_jurusan, kota, no_hp, email, link_ijazah_drive, keterangan)
SELECT v.nisn, v.nama_lengkap, v.angkatan_lulus, v.jurusan, v.status_lulusan, v.instansi_tujuan, v.bidang_jurusan, v.kota, v.no_hp, v.email, v.link_ijazah_drive, v.keterangan
FROM (VALUES
  ('0074123901', 'Fransiskus Xaverius Basik-Basik', '2025', 'Reguler SMP', 'Lanjut Sekolah / Pondok', 'SMAN 1 Muting / SMAN 1 Ulilin', 'Kelas X Kurikulum Merdeka', 'Merauke', '0812-4401-8801', 'fransiskus.b@alumni.smpn2muting.sch.id', 'https://drive.google.com/file/d/1example-ijazah-fransiskus/view', 'Lulusan terbaik SMPN 2 Muting tahun 2025'),
  ('0073981202', 'Nadia Putri Rahmawati', '2025', 'Reguler SMP', 'Lanjut Sekolah / Pondok', 'SMAN 1 Merauke', 'Kelas X MIPA', 'Merauke', '0813-7788-3312', 'nadia.p@alumni.smpn2muting.sch.id', 'https://drive.google.com/file/d/1example-ijazah-nadia/view', 'Melanjutkan ke jenjang SMA melalui jalur prestasi akademik'),
  ('0069821303', 'Dimas Wahyu Saputra', '2024', 'Reguler SMP', 'Lanjut Sekolah / Pondok', 'SMKN 1 Tanah Miring / Merauke', 'Teknik Komputer & Jaringan', 'Merauke', '0821-8899-5513', 'dimas.w@gmail.com', 'https://drive.google.com/file/d/1example-ijazah-dimas/view', 'Ijazah & SKL sudah diambil dan terarsip di Google Drive'),
  ('0067712304', 'Rovina Gebze', '2024', 'Reguler SMP', 'Lanjut Sekolah / Pondok', 'SMAN 1 Muting', 'Kelas XI IPS', 'Merauke', '0852-1122-4414', '', '', 'Ijazah fisik tersimpan di TU, link menyusul')
) AS v(nisn, nama_lengkap, angkatan_lulus, jurusan, status_lulusan, instansi_tujuan, bidang_jurusan, kota, no_hp, email, link_ijazah_drive, keterangan)
WHERE NOT EXISTS (SELECT 1 FROM alumni);

INSERT INTO pengaturan_ppdb (judul_tombol, link_ppdb, tahun_ajaran, keterangan, is_active)
SELECT
  'Sistem PPDB Online SMPN 2 Muting',
  'https://ppdb.smpn2muting.sch.id',
  '2026/2027',
  'Layanan Penerimaan Peserta Didik Baru (PPDB) Online SMPN 2 Muting. Silakan klik tombol untuk menuju halaman pendaftaran.',
  true
WHERE NOT EXISTS (SELECT 1 FROM pengaturan_ppdb);
