import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewModal from '../components/PreviewModal';
import LinkActionButtons from '../components/LinkActionButtons';
import { useAuth } from '../context/AuthContext';
import { dataService, DEFAULT_PPDB_SETTINGS, normalizeExternalUrl } from '../lib/api';
import { matchesSearch } from '../lib/search';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [datasets, setDatasets] = useState({
    bahan_ajar: [],
    akreditasi: [],
    siswa: [],
    pernyataan_siswa: [],
    guru: [],
    sarana_prasarana: [],
    alumni: [],
    berita_prestasi: []
  });
  const [ppdb, setPpdb] = useState(DEFAULT_PPDB_SETTINGS);
  const [ppdbForm, setPpdbForm] = useState(DEFAULT_PPDB_SETTINGS);
  const [editingPpdb, setEditingPpdb] = useState(false);
  const [savingPpdb, setSavingPpdb] = useState(false);
  const [ppdbMessage, setPpdbMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    if (isAdmin && location.hash === '#pengaturan-ppdb') {
      setEditingPpdb(true);
    }
  }, [isAdmin, location.hash]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [ba, ak, sw, ps, gr, sp, al, bp, ppdbData] = await Promise.all([
          dataService.getAll('bahan_ajar').catch(() => []),
          dataService.getAll('akreditasi').catch(() => []),
          dataService.getAll('siswa').catch(() => []),
          dataService.getAll('pernyataan_siswa').catch(() => []),
          dataService.getAll('guru').catch(() => []),
          dataService.getAll('sarana_prasarana').catch(() => []),
          dataService.getAll('alumni').catch(() => []),
          dataService.getAll('berita_prestasi').catch(() => []),
          dataService.getPpdbSettings().catch(() => DEFAULT_PPDB_SETTINGS)
        ]);
        setDatasets({
          bahan_ajar: ba,
          akreditasi: ak,
          siswa: sw,
          pernyataan_siswa: ps,
          guru: gr,
          sarana_prasarana: sp,
          alumni: al,
          berita_prestasi: bp
        });
        if (ppdbData) {
          setPpdb(ppdbData);
          setPpdbForm(ppdbData);
        }
      } catch (err) {
        console.error('Gagal memuat ringkasan:', err);
      }
    };
    loadSummary();
  }, []);

  const handleSavePpdb = async (e) => {
    e.preventDefault();
    setSavingPpdb(true);
    setPpdbMessage(null);
    try {
      const saved = await dataService.savePpdbSettings({
        ...ppdbForm,
        id: ppdb?.id
      });
      setPpdb(saved);
      setPpdbForm(saved);
      setEditingPpdb(false);
      setPpdbMessage({
        type: 'success',
        text: 'Hyperlink Sistem PPDB berhasil disimpan dan diperbarui!'
      });
      window.dispatchEvent(new Event('ppdb-settings-updated'));
    } catch (err) {
      setPpdbMessage({
        type: 'error',
        text: err.message || 'Gagal menyimpan pengaturan PPDB.'
      });
    } finally {
      setSavingPpdb(false);
    }
  };

  const ppdbHref = normalizeExternalUrl(ppdb?.link_ppdb);

  const hasQuery = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!hasQuery) return null;

    const bahanAjar = datasets.bahan_ajar.filter((item) =>
      matchesSearch(searchQuery, [item.mata_pelajaran, item.kelas, item.judul_rpp])
    );
    const akreditasi = datasets.akreditasi.filter((item) =>
      matchesSearch(searchQuery, [item.sub_bab, item.nama_dokumen, item.keterangan])
    );
    const siswa = datasets.siswa.filter((item) =>
      matchesSearch(searchQuery, [item.nisn, item.nama_lengkap, item.kelas, item.angkatan])
    );
    const pernyataan = datasets.pernyataan_siswa.filter((item) =>
      matchesSearch(searchQuery, [
        item.siswa?.nama_lengkap,
        item.siswa?.nisn,
        item.siswa?.kelas,
        item.jenis_surat
      ])
    );
    const guru = datasets.guru.filter((item) =>
      matchesSearch(searchQuery, [
        item.nama_lengkap,
        item.nip,
        item.jabatan,
        item.mata_pelajaran,
        item.status_kepegawaian
      ])
    );
    const sarpras = datasets.sarana_prasarana.filter((item) =>
      matchesSearch(searchQuery, [
        item.kode_aset,
        item.nama_sarpras,
        item.kategori,
        item.lokasi,
        item.kondisi
      ])
    );
    const alumni = datasets.alumni.filter((item) =>
      matchesSearch(searchQuery, [
        item.nama_lengkap,
        item.nisn,
        item.angkatan_lulus,
        item.status_lulusan,
        item.instansi_tujuan,
        item.kota
      ])
    );
    const berita = datasets.berita_prestasi.filter((item) =>
      matchesSearch(searchQuery, [
        item.judul,
        item.kategori,
        item.nama_siswa_terkait,
        item.tingkat_prestasi
      ])
    );

    return {
      bahanAjar,
      akreditasi,
      siswa,
      pernyataan,
      guru,
      sarpras,
      alumni,
      berita,
      total:
        bahanAjar.length +
        akreditasi.length +
        siswa.length +
        pernyataan.length +
        guru.length +
        sarpras.length +
        alumni.length +
        berita.length
    };
  }, [datasets, searchQuery, hasQuery]);

  const modules = [
    {
      title: 'Bahan Ajar & RPP',
      subtitle: 'Tabel: bahan_ajar',
      count: datasets.bahan_ajar.length,
      unit: 'Dokumen RPP',
      description:
        'Kelola dan akses daftar RPP serta modul pembelajaran berdasarkan mata pelajaran dan kelas (Google Drive).',
      path: '/dashboard/bahan-ajar',
      badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
    },
    {
      title: 'Dokumen Akreditasi',
      subtitle: 'Tabel: akreditasi',
      count: datasets.akreditasi.length,
      unit: 'Berkas Bukti',
      description:
        'Arsip dokumen akreditasi sekolah per sub-bab beserta keterangan dan tautan berkas Google Drive.',
      path: '/dashboard/akreditasi',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
    },
    {
      title: 'Data & Berkas Siswa',
      subtitle: 'Tabel: siswa',
      count: datasets.siswa.length,
      unit: 'Siswa Terdaftar',
      description:
        'Direktori data induk siswa (NISN, kelas, angkatan) sekaligus detail manajemen berkas KK & Akta via Google Drive.',
      path: '/dashboard/siswa',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
    },
    {
      title: 'Pernyataan & Video Siswa',
      subtitle: 'Tabel: pernyataan_siswa',
      count: datasets.pernyataan_siswa.length,
      unit: 'Arsip Siswa',
      description:
        'Daftar surat pernyataan siswa (Google Drive) yang terhubung dengan profil siswa serta dokumentasi video YouTube.',
      path: '/dashboard/pernyataan-siswa',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
    },
    {
      title: 'Database Data Guru',
      subtitle: 'Tabel: guru',
      count: datasets.guru.length,
      unit: 'Guru & Tendik',
      description:
        'Direktori induk pendidik & tenaga kependidikan meliputi NIP/NUPTK, jabatan, mapel, status kepegawaian, dan kontak.',
      path: '/dashboard/guru',
      badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
    },
    {
      title: 'Sarana & Prasarana',
      subtitle: 'Tabel: sarana_prasarana',
      count: datasets.sarana_prasarana.length,
      unit: 'Item Inventaris',
      description:
        'Daftar ruang kelas, laboratorium, mebelair, dan fasilitas sekolah beserta jumlah, lokasi, serta kondisi aset.',
      path: '/dashboard/sarana-prasarana',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
    },
    {
      title: 'Alumni, Tracker & Ijazah',
      subtitle: 'Tabel: alumni',
      count: datasets.alumni.length,
      unit: 'Alumni Terdata',
      description:
        'Pelacakan studi lanjut, pekerjaan, dan wirausaha lulusan (Alumni Tracker) serta tautan Google Drive Ijazah/SKL.',
      path: '/dashboard/alumni',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
    },
    {
      title: 'Portal Berita & Prestasi',
      subtitle: 'Publik (Halaman Depan)',
      count: datasets.berita_prestasi.length,
      unit: 'Artikel Berita',
      description:
        'Terbitkan berita prestasi siswa dan galeri dokumentasi (foto Cloudinary/URL) untuk portal berita publik tanpa login.',
      path: '/dashboard/berita-prestasi',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Status Akses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Selamat Datang, {user?.nama || user?.email}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Anda masuk sebagai{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {isAdmin
                  ? 'Admin (Akses Penuh Tambah/Edit/Hapus Data)'
                  : 'User / Guru (Akses Baca, Detail Berkas & Pratinjau)'}
              </span>
              . Pilih modul atau gunakan pencarian cepat di bawah.
            </p>
          </div>

          <div
            className={`px-4 py-3 rounded-xl text-xs font-medium border ${
              isAdmin
                ? 'bg-cyan-50 border-cyan-200 text-cyan-900 dark:bg-cyan-950/50 dark:border-cyan-800 dark:text-cyan-300'
                : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300'
            }`}
          >
            {isAdmin ? (
              <span>
                <strong>Mode Admin Aktif:</strong> Formulir tambah/edit, unggah foto berita Cloudinary &amp; tautan G-Drive tersedia.
              </span>
            ) : (
              <span>
                <strong>Mode Read-Only Aktif:</strong> Anda dapat menelusuri data guru, sarpras, alumni, detail KK/Akta siswa &amp; pratinjau berkas.
              </span>
            )}
          </div>
        </div>

        {/* BANNER FORWARD KE SISTEM PPDB & PENGATURAN HYPERLINK (ADMIN) */}
        <div
          id="pengaturan-ppdb"
          className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-cyan-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 p-5 sm:p-6 shadow-sm mb-6 transition-colors"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  Sistem PPDB • TA {ppdb.tahun_ajaran || '2026/2027'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    ppdb.is_active
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {ppdb.is_active ? 'Aktif Ditampilkan' : 'Disembunyikan di Publik'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {ppdb.judul_tombol || 'Sistem PPDB Online SMPN 2 Muting'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
                {ppdb.keterangan ||
                  'Pendaftaran Peserta Didik Baru (PPDB) SMPN 2 Muting secara daring.'}
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                Hyperlink Tujuan:{' '}
                {ppdbHref ? (
                  <a
                    href={ppdbHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:underline break-all"
                  >
                    {ppdbHref}
                  </a>
                ) : (
                  <span className="italic text-amber-600 dark:text-amber-400">
                    Belum diatur (silakan input URL PPDB di Admin)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {ppdbHref ? (
                <a
                  href={ppdbHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm hover:shadow transition"
                >
                  <span>Forward ke Sistem PPDB</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Link PPDB Belum Diisi
                </span>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setPpdbForm(ppdb);
                    setPpdbMessage(null);
                    setEditingPpdb((prev) => !prev);
                  }}
                  className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 dark:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 transition"
                >
                  {editingPpdb ? 'Tutup Pengaturan' : 'Atur / Input Link PPDB (Admin)'}
                </button>
              )}
            </div>
          </div>

          {ppdbMessage && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border ${
                ppdbMessage.type === 'success'
                  ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-red-100/80 border-red-300 text-red-900 dark:bg-red-950/70 dark:border-red-800 dark:text-red-200'
              }`}
            >
              {ppdbMessage.text}
            </div>
          )}

          {isAdmin && editingPpdb && (
            <form
              onSubmit={handleSavePpdb}
              className="mt-5 pt-5 border-t border-emerald-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4"
            >
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hyperlink / URL Sistem PPDB <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ppdbForm.link_ppdb || ''}
                  onChange={(e) => setPpdbForm({ ...ppdbForm, link_ppdb: e.target.value })}
                  placeholder="Contoh: https://ppdb.smpn2muting.sch.id atau http://localhost:3000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Masukkan alamat website PPDB yang sudah dibuat. Saat tombol PPDB diklik, pengguna langsung diarahkan ke link ini.
                </p>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul / Label Tombol PPDB
                </label>
                <input
                  type="text"
                  value={ppdbForm.judul_tombol || ''}
                  onChange={(e) => setPpdbForm({ ...ppdbForm, judul_tombol: e.target.value })}
                  placeholder="Sistem PPDB Online SMPN 2 Muting"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={ppdbForm.tahun_ajaran || ''}
                  onChange={(e) => setPpdbForm({ ...ppdbForm, tahun_ajaran: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Singkat PPDB
                </label>
                <input
                  type="text"
                  value={ppdbForm.keterangan || ''}
                  onChange={(e) => setPpdbForm({ ...ppdbForm, keterangan: e.target.value })}
                  placeholder="Layanan Penerimaan Peserta Didik Baru (PPDB) Online SMPN 2 Muting."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-4 flex items-end">
                <label className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(ppdbForm.is_active)}
                    onChange={(e) => setPpdbForm({ ...ppdbForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Tampilkan Tombol PPDB di Publik
                  </span>
                </label>
              </div>

              <div className="md:col-span-12 flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPpdb(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPpdb}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-sm transition"
                >
                  {savingPpdb ? 'Menyimpan...' : 'Simpan Hyperlink PPDB'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* PENCARIAN GLOBAL CEPAT */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm mb-8 transition-colors">
          <div className="relative">
            <svg
              className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
              />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cepat di seluruh modul: RPP, akreditasi, siswa/NISN, guru, sarpras, alumni, atau berita..."
              className="w-full pl-12 pr-20 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 focus:border-transparent"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
              >
                Reset
              </button>
            )}
          </div>

          {hasQuery && searchResults && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>
                  Ditemukan <strong className="text-slate-900 dark:text-slate-100">{searchResults.total}</strong> hasil untuk{' '}
                  <strong className="text-slate-900 dark:text-slate-100">&ldquo;{searchQuery.trim()}&rdquo;</strong>
                </span>
              </div>

              {searchResults.total === 0 && (
                <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Tidak ada data atau berkas yang cocok. Coba kata kunci lain.
                </div>
              )}

              {/* Bahan Ajar */}
              {searchResults.bahanAjar.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400">
                      Bahan Ajar &amp; RPP ({searchResults.bahanAjar.length})
                    </h3>
                    <Link to="/dashboard/bahan-ajar" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.bahanAjar.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.judul_rpp}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.mata_pelajaran} &bull; Kelas {item.kelas}
                          </div>
                        </div>
                        <LinkActionButtons
                          url={item.link_drive}
                          title={item.judul_rpp}
                          subtitle={`${item.mata_pelajaran} • Kelas ${item.kelas}`}
                          previewLabel="Pratinjau"
                          tone="cyan"
                          onPreview={setPreviewItem}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Akreditasi */}
              {searchResults.akreditasi.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                      Dokumen Akreditasi ({searchResults.akreditasi.length})
                    </h3>
                    <Link to="/dashboard/akreditasi" className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.akreditasi.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.nama_dokumen}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.sub_bab}{item.keterangan ? ` • ${item.keterangan}` : ''}
                          </div>
                        </div>
                        <LinkActionButtons
                          url={item.link_drive}
                          title={item.nama_dokumen}
                          subtitle={item.sub_bab}
                          previewLabel="Pratinjau"
                          tone="teal"
                          onPreview={setPreviewItem}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Siswa */}
              {searchResults.siswa.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Data &amp; Berkas Siswa ({searchResults.siswa.length})
                    </h3>
                    <Link to="/dashboard/siswa" className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.siswa.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.nama_lengkap}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            NISN: {item.nisn} &bull; Kelas {item.kelas} &bull; Angkatan {item.angkatan}
                          </div>
                        </div>
                        <Link
                          to={`/dashboard/siswa/${item.id}`}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
                        >
                          Buka Detail &amp; Berkas KK/Akta &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pernyataan */}
              {searchResults.pernyataan.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400">
                      Pernyataan &amp; Video Siswa ({searchResults.pernyataan.length})
                    </h3>
                    <Link to="/dashboard/pernyataan-siswa" className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.pernyataan.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {item.siswa?.nama_lengkap || 'Siswa'} &mdash; {item.jenis_surat}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            NISN: {item.siswa?.nisn || '-'} &bull; Kelas {item.siswa?.kelas || '-'}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <LinkActionButtons
                            url={item.link_drive_surat}
                            title={`${item.jenis_surat} — ${item.siswa?.nama_lengkap || 'Siswa'}`}
                            subtitle={`NISN: ${item.siswa?.nisn || '-'} • ${item.siswa?.kelas || '-'}`}
                            previewLabel="Pratinjau Surat"
                            tone="cyan"
                            onPreview={setPreviewItem}
                          />
                          {item.link_youtube_video && (
                            <LinkActionButtons
                              url={item.link_youtube_video}
                              title={`Video: ${item.siswa?.nama_lengkap || 'Siswa'} — ${item.jenis_surat}`}
                              subtitle={`NISN: ${item.siswa?.nisn || '-'} • ${item.siswa?.kelas || '-'}`}
                              previewLabel="Putar Video"
                              tone="red"
                              onPreview={setPreviewItem}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Guru */}
              {searchResults.guru.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400">
                      Data Guru &amp; Tendik ({searchResults.guru.length})
                    </h3>
                    <Link to="/dashboard/guru" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.guru.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.nama_lengkap}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.jabatan} &bull; {item.mata_pelajaran || '-'} &bull; {item.status_kepegawaian}
                          </div>
                        </div>
                        <Link to="/dashboard/guru" className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap">
                          Buka Data Guru &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sarana Prasarana */}
              {searchResults.sarpras.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400">
                      Sarana &amp; Prasarana ({searchResults.sarpras.length})
                    </h3>
                    <Link to="/dashboard/sarana-prasarana" className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.sarpras.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.nama_sarpras}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.kategori} &bull; {item.jumlah} {item.satuan} &bull; Kondisi: {item.kondisi}
                          </div>
                        </div>
                        <Link to="/dashboard/sarana-prasarana" className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline whitespace-nowrap">
                          Buka Inventaris &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alumni */}
              {searchResults.alumni.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                      Alumni &amp; Ijazah ({searchResults.alumni.length})
                    </h3>
                    <Link to="/dashboard/alumni" className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.alumni.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.nama_lengkap}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Lulusan {item.angkatan_lulus} &bull; {item.status_lulusan}
                            {item.instansi_tujuan ? ` (${item.instansi_tujuan})` : ''}
                          </div>
                        </div>
                        {item.link_ijazah_drive ? (
                          <LinkActionButtons
                            url={item.link_ijazah_drive}
                            title={`Ijazah — ${item.nama_lengkap}`}
                            subtitle={`Lulusan ${item.angkatan_lulus}`}
                            previewLabel="Pratinjau Ijazah"
                            tone="cyan"
                            onPreview={setPreviewItem}
                          />
                        ) : (
                          <Link to="/dashboard/alumni" className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap">
                            Buka Alumni Tracker &rarr;
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Berita */}
              {searchResults.berita.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
                      Portal Berita &amp; Prestasi ({searchResults.berita.length})
                    </h3>
                    <Link to="/dashboard/berita-prestasi" className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline">
                      Lihat modul &rarr;
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {searchResults.berita.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.judul}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.kategori}{item.nama_siswa_terkait ? ` • ${item.nama_siswa_terkait}` : ''}
                          </div>
                        </div>
                        <Link
                          to={`/berita/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline whitespace-nowrap"
                        >
                          Baca Berita ↗
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 8 KARTU NAVIGASI MODUL UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((mod) => (
            <Link
              key={mod.path}
              to={mod.path}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-500 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${mod.badgeColor}`}>
                    {mod.subtitle}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {mod.count}{' '}
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block text-right leading-none">
                      {mod.unit}
                    </span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition mb-2">
                  {mod.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                  {mod.description}
                </p>
              </div>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                <span>
                  {isAdmin ? 'Kelola Data (Admin)' : 'Lihat Data & Berkas'}
                </span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
