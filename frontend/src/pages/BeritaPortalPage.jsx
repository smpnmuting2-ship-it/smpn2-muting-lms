import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { dataService } from '../lib/api';
import { resolveDisplayImageUrl } from '../lib/mediaPreview';
import { BERITA_CATEGORIES, KATEGORI_BADGE_MAP, formatTanggalIndo } from '../lib/format';
import { matchesSearch } from '../lib/search';

export default function BeritaPortalPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await dataService.getPublicNews();
        setItems(data);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== 'Semua' && item.kategori !== activeCategory) return false;
      return matchesSearch(searchQuery, [
        item.judul,
        item.ringkasan,
        item.isi_konten,
        item.kategori,
        item.nama_siswa_terkait,
        item.tingkat_prestasi,
        item.penulis
      ]);
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <PublicHeader />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link to="/" className="hover:text-cyan-700 dark:hover:text-cyan-400">
              Beranda
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Portal Berita &amp; Prestasi Siswa
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Portal Berita, Prestasi Siswa &amp; Dokumentasi
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Liputan capaian siswa jenjang SMPN 2 Muting, agenda akademik, serta galeri dokumentasi kegiatan SMPN 2 Muting.
          </p>
        </div>

        {/* Pencarian & Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul berita, nama siswa berprestasi, tingkat lomba, atau kata kunci isi..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
            {(searchQuery || activeCategory !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Semua');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {filteredItems.length} artikel
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Memuat daftar berita dan prestasi...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum ada artikel yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-700 to-slate-900 text-white text-xs font-bold uppercase tracking-wider p-4 text-center">
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
                            KATEGORI_BADGE_MAP[item.kategori] || KATEGORI_BADGE_MAP['Berita Sekolah']
                          }`}
                        >
                          {item.kategori}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatTanggalIndo(item.tanggal_publikasi || item.created_at)}
                        </span>
                      </div>

                      <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition leading-snug mb-2">
                        {item.judul}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {item.ringkasan}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                      <span className="truncate pr-2 text-slate-500 dark:text-slate-400 font-normal">
                        {item.nama_siswa_terkait || item.tingkat_prestasi || item.penulis || 'SMPN 2 Muting'}
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
      </main>

      <Footer />
    </div>
  );
}

