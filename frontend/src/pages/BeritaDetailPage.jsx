import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import PreviewModal from '../components/PreviewModal';
import { dataService } from '../lib/api';
import { resolveDisplayImageUrl } from '../lib/mediaPreview';
import { KATEGORI_BADGE_MAP, formatTanggalIndo } from '../lib/format';

export default function BeritaDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadDetail = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [detail, allNews] = await Promise.all([
          dataService.getById('berita_prestasi', id),
          dataService.getPublicNews().catch(() => [])
        ]);
        setArticle(detail);
        setRelated(allNews.filter((n) => n.id !== id).slice(0, 4));
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  const coverUrl = article ? resolveDisplayImageUrl(article.gambar_url) : '';
  const gallery = Array.isArray(article?.galeri_urls) ? article.galeri_urls : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <PublicHeader />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-cyan-700 dark:hover:text-cyan-400">
            Beranda
          </Link>
          <span>/</span>
          <Link to="/berita" className="hover:text-cyan-700 dark:hover:text-cyan-400">
            Portal Berita
          </Link>
          <span>/</span>
          <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
            {article?.judul || 'Detail Berita'}
          </span>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Memuat detail berita...
          </div>
        ) : errorMsg || !article ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Berita Tidak Ditemukan
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {errorMsg || 'Artikel mungkin sudah dihapus atau masih berstatus draft.'}
            </p>
            <Link
              to="/berita"
              className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 transition"
            >
              &larr; Kembali ke Portal Berita
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ARTIKEL UTAMA */}
            <article className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {coverUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewItem({
                      url: coverUrl,
                      title: article.judul,
                      subtitle: article.kategori
                    })
                  }
                  className="w-full block bg-slate-200 dark:bg-slate-800 max-h-[460px] overflow-hidden group cursor-zoom-in"
                  title="Klik untuk memperbesar foto"
                >
                  <img
                    src={coverUrl}
                    alt={article.judul}
                    className="w-full h-full max-h-[460px] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </button>
              )}

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      KATEGORI_BADGE_MAP[article.kategori] || KATEGORI_BADGE_MAP['Berita Sekolah']
                    }`}
                  >
                    {article.kategori}
                  </span>
                  {article.tingkat_prestasi && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                      {article.tingkat_prestasi}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Diterbitkan {formatTanggalIndo(article.tanggal_publikasi || article.created_at)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-4">
                  {article.judul}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
                  <span>
                    Penulis: <strong className="text-slate-800 dark:text-slate-200">{article.penulis || 'Tim Humas & Kesiswaan'}</strong>
                  </span>
                  {article.nama_siswa_terkait && (
                    <span>
                      Siswa / Tim Terkait:{' '}
                      <strong className="text-cyan-700 dark:text-cyan-400">
                        {article.nama_siswa_terkait}
                      </strong>
                    </span>
                  )}
                </div>

                <p className="text-base font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/70 border-l-4 border-cyan-600 p-4 rounded-r-xl mb-6 leading-relaxed">
                  {article.ringkasan}
                </p>

                <div className="space-y-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {String(article.isi_konten || '')
                    .split(/\n{2,}|\n/)
                    .filter((p) => p.trim().length > 0)
                    .map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                </div>

                {/* GALERI DOKUMENTASI FOTO */}
                {gallery.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                      Galeri Dokumentasi ({gallery.length} Foto)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {gallery.map((rawUrl, i) => {
                        const resolved = resolveDisplayImageUrl(rawUrl);
                        if (!resolved) return null;
                        return (
                          <button
                            key={`${resolved}-${i}`}
                            type="button"
                            onClick={() =>
                              setPreviewItem({
                                url: resolved,
                                title: `${article.judul} — Foto ${i + 1}`,
                                subtitle: 'Galeri Dokumentasi'
                              })
                            }
                            className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 cursor-zoom-in"
                          >
                            <img
                              src={resolved}
                              alt={`Dokumentasi ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* SIDEBAR BERITA TERKAIT */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Berita &amp; Prestasi Lainnya
                </h2>
                {related.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Belum ada berita lain yang diterbitkan.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {related.map((item) => {
                      const thumb = resolveDisplayImageUrl(item.gambar_url);
                      return (
                        <Link
                          key={item.id}
                          to={`/berita/${item.id}`}
                          className="group flex gap-3 items-start pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                        >
                          <div className="w-20 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={item.judul}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center p-1">
                                {item.kategori}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 block">
                              {item.kategori}
                            </span>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 line-clamp-2 leading-snug">
                              {item.judul}
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {formatTanggalIndo(item.tanggal_publikasi || item.created_at)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to="/berita"
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 transition"
                  >
                    Lihat Semua Portal Berita &rarr;
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}

