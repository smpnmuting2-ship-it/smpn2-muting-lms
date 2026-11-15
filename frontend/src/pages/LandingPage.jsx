import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { dataService, DEFAULT_PPDB_SETTINGS, normalizeExternalUrl } from '../lib/api';
import { resolveDisplayImageUrl } from '../lib/mediaPreview';
import { BERITA_CATEGORIES, KATEGORI_BADGE_MAP, formatTanggalIndo } from '../lib/format';
import { matchesSearch } from '../lib/search';

export default function LandingPage() {
  const { isAdmin } = useAuth();
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [ppdb, setPpdb] = useState(DEFAULT_PPDB_SETTINGS);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [list, ppdbData] = await Promise.all([
          dataService.getPublicNews().catch(() => []),
          dataService.getPpdbSettings().catch(() => DEFAULT_PPDB_SETTINGS)
        ]);
        setNews(list);
        if (ppdbData) setPpdb(ppdbData);
      } catch (err) {
        console.error('Gagal memuat portal berita:', err);
      } finally {
        setLoadingNews(false);
      }
    };
    loadInitialData();
  }, []);

  const ppdbHref = normalizeExternalUrl(ppdb?.link_ppdb);
  const showPpdb = Boolean(ppdb?.is_active && ppdbHref);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (activeCategory !== 'Semua' && item.kategori !== activeCategory) return false;
      return matchesSearch(searchQuery, [
        item.judul,
        item.ringkasan,
        item.kategori,
        item.nama_siswa_terkait,
        item.tingkat_prestasi
      ]);
    });
  }, [news, activeCategory, searchQuery]);

  const headline = filteredNews[0] || null;
  const secondaryNews = filteredNews.slice(1, 7);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <PublicHeader />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="bg-white dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 mb-5">
                  <span className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
                  Portal Resmi Informasi, Prestasi &amp; Administrasi Sekolah (SMPN 2 Muting)
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-5">
                  Selamat Datang di Portal Digital{' '}
                  <span className="text-cyan-700 dark:text-cyan-400">SMPN 2 Muting</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-7 leading-relaxed">
                  Ikuti kabar terbaru prestasi siswa jenjang SMP (Kelas VII–IX) serta dokumentasi kegiatan
                  sekolah secara terbuka tanpa perlu login, atau masuk ke sistem manajemen untuk
                  mengelola RPP, akreditasi, berkas siswa, data guru, sarpras, dan alumni.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {showPpdb && (
                    <a
                      href={ppdbHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md hover:shadow-lg transition"
                    >
                      <span>{ppdb.judul_tombol || 'Sistem PPDB Online'}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                  <a
                    href="#portal-berita"
                    className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 shadow-md hover:shadow-lg transition"
                  >
                    Jelajahi Portal Berita &darr;
                  </a>
                  <Link
                    to="/login"
                    className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 transition"
                  >
                    Login Sistem Internal &rarr;
                  </Link>
                </div>

                {/* Banner Forward Sistem PPDB */}
                {showPpdb && (
                  <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                          PPDB {ppdb.tahun_ajaran || 'Aktif'}
                        </span>
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          {ppdb.judul_tombol || 'Sistem PPDB Online SMPN 2 Muting'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {ppdb.keterangan ||
                          'Pendaftaran Peserta Didik Baru (PPDB) SMPN 2 Muting secara daring.'}
                      </p>
                      {isAdmin && (
                        <Link
                          to="/dashboard#pengaturan-ppdb"
                          className="inline-block mt-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
                        >
                          Ubah Hyperlink PPDB di Dashboard Admin &rarr;
                        </Link>
                      )}
                    </div>
                    <a
                      href={ppdbHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition whitespace-nowrap shrink-0"
                    >
                      <span>Buka Sistem PPDB</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Info Ringkas Layanan */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                    Publik
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Portal Berita
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Prestasi siswa SMPN 2 Muting &amp; dokumentasi kegiatan bebas diakses publik.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-1">
                    Akademik
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    RPP &amp; Akreditasi
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Repositori bahan ajar guru SMPN 2 Muting &amp; dokumen bukti fisik akreditasi.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1">
                    Kesiswaan
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Detail &amp; Berkas Siswa
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Profil siswa, Kartu Keluarga, Akta Kelahiran &amp; Surat Pernyataan.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">
                    Kelembagaan
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Guru, Sarpras &amp; Alumni
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Database pendidik, sarana prasarana, ijazah &amp; alumni tracker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PORTAL BERITA PRESTASI & DOKUMENTASI (PUBLIK TANPA LOGIN) */}
        <section id="portal-berita" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Kabar Terbaru SMPN 2 Muting
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                Portal Berita Prestasi &amp; Dokumentasi
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita atau nama siswa..."
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
              <Link
                to="/berita"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 dark:border-cyan-800 transition whitespace-nowrap"
              >
                Semua Berita &rarr;
              </Link>
            </div>
          </div>

          {/* Filter Kategori Portal Berita */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
            {['Semua', ...BERITA_CATEGORIES].map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                    active
                      ? 'bg-cyan-700 text-white border-cyan-700 dark:bg-cyan-600 dark:border-cyan-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {loadingNews ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Memuat berita prestasi &amp; dokumentasi terbaru...
            </div>
          ) : !headline ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Belum ada berita atau dokumentasi pada kategori ini.
              </p>
              {(activeCategory !== 'Semua' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('Semua');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
                >
                  Tampilkan semua berita
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* HEADLINE UTAMA (Featured Story) */}
              <Link
                to={`/berita/${headline.id}`}
                className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-600 transition"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-6 relative bg-slate-200 dark:bg-slate-800 min-h-[240px] lg:min-h-[340px] overflow-hidden">
                    {resolveDisplayImageUrl(headline.gambar_url) ? (
                      <img
                        src={resolveDisplayImageUrl(headline.gambar_url)}
                        alt={headline.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-700 to-sky-800 text-white p-8 text-center">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                            SMPN 2 Muting
                          </div>
                          <div className="text-xl font-extrabold">{headline.kategori}</div>
                        </div>
                      </div>
                    )}
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                      Berita Utama
                    </span>
                  </div>

                  <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            KATEGORI_BADGE_MAP[headline.kategori] || KATEGORI_BADGE_MAP['Berita Sekolah']
                          }`}
                        >
                          {headline.kategori}
                        </span>
                        {headline.tingkat_prestasi && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {headline.tingkat_prestasi}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTanggalIndo(headline.tanggal_publikasi || headline.created_at)}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition leading-snug mb-3">
                        {headline.judul}
                      </h3>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                        {headline.ringkasan}
                      </p>

                      {headline.nama_siswa_terkait && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 mb-4">
                          <span className="font-bold text-cyan-700 dark:text-cyan-400">Siswa/Tim:</span>
                          <span>{headline.nama_siswa_terkait}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-bold text-cyan-700 dark:text-cyan-400">
                      <span>Oleh {headline.penulis || 'Tim Humas SMPN 2 Muting'}</span>
                      <span className="group-hover:translate-x-1 transition-transform">
                        Baca Selengkapnya &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* GRID BERITA LAINNYA */}
              {secondaryNews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {secondaryNews.map((item) => {
                    const imgSrc = resolveDisplayImageUrl(item.gambar_url);
                    return (
                      <Link
                        key={item.id}
                        to={`/berita/${item.id}`}
                        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-600 transition flex flex-col"
                      >
                        <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={item.judul}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-bold uppercase tracking-wider p-4 text-center">
                              {item.kategori}
                            </div>
                          )}
                          {Array.isArray(item.galeri_urls) && item.galeri_urls.length > 0 && (
                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/75 text-white">
                              +{item.galeri_urls.length} Foto
                            </span>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                  KATEGORI_BADGE_MAP[item.kategori] ||
                                  KATEGORI_BADGE_MAP['Berita Sekolah']
                                }`}
                              >
                                {item.kategori}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {formatTanggalIndo(item.tanggal_publikasi || item.created_at)}
                              </span>
                            </div>

                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition leading-snug mb-2 line-clamp-2">
                              {item.judul}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                              {item.ringkasan}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                            <span className="truncate pr-2 text-slate-500 dark:text-slate-400 font-normal">
                              {item.tingkat_prestasi || item.nama_siswa_terkait || 'SMPN 2 Muting'}
                            </span>
                            <span className="whitespace-nowrap group-hover:translate-x-1 transition-transform">
                              Baca &rarr;
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
