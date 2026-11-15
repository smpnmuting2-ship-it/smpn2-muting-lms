import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewModal from '../components/PreviewModal';
import LinkActionButtons from '../components/LinkActionButtons';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { getUniqueSorted, matchesSearch } from '../lib/search';

export default function PernyataanSiswaPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterMedia, setFilterMedia] = useState('all');

  // State Form Admin
  const [siswaId, setSiswaId] = useState('');
  const [jenisSurat, setJenisSurat] = useState('');
  const [linkDriveSurat, setLinkDriveSurat] = useState('');
  const [linkYoutubeVideo, setLinkYoutubeVideo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [psData, swData] = await Promise.all([
        dataService.getAll('pernyataan_siswa'),
        dataService.getAll('siswa')
      ]);
      setItems(psData);
      setSiswaList(swData);
      if (swData.length > 0 && !siswaId) {
        setSiswaId(swData[0].id);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kelasOptions = useMemo(
    () => getUniqueSorted(items.map((item) => item.siswa?.kelas)),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKelas !== 'all' && item.siswa?.kelas !== filterKelas) return false;
      if (filterMedia === 'video' && !item.link_youtube_video) return false;
      if (filterMedia === 'no_video' && item.link_youtube_video) return false;
      return matchesSearch(searchQuery, [
        item.siswa?.nama_lengkap,
        item.siswa?.nisn,
        item.siswa?.kelas,
        item.jenis_surat
      ]);
    });
  }, [items, searchQuery, filterKelas, filterMedia]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterKelas('all');
    setFilterMedia('all');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const created = await dataService.create('pernyataan_siswa', {
        siswa_id: siswaId,
        jenis_surat: jenisSurat,
        link_drive_surat: linkDriveSurat,
        link_youtube_video: linkYoutubeVideo
      });
      setItems((prev) => [created, ...prev]);
      setJenisSurat('');
      setLinkDriveSurat('');
      setLinkYoutubeVideo('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus arsip pernyataan siswa ini?')) return;
    try {
      await dataService.remove('pernyataan_siswa', id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Modul 4: Surat Pernyataan &amp; Video Siswa
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Arsip surat pernyataan siswa (Tautan Google Drive) dan rekaman dokumentasi pernyataan (Tautan YouTube).
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* FORM INPUT KHUSUS ADMIN */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              + Tambah Surat Pernyataan &amp; Video Siswa (Khusus Admin)
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Siswa (Relasi Tabel Siswa)
                </label>
                <select
                  required
                  value={siswaId}
                  onChange={(e) => setSiswaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="" disabled>
                    -- Pilih Siswa --
                  </option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nisn} - {s.nama_lengkap} ({s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Surat Pernyataan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Surat Pernyataan Tata Tertib / Beasiswa"
                  value={jenisSurat}
                  onChange={(e) => setJenisSurat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Google Drive / Docs Surat (PDF/Word)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... atau docs.google.com/..."
                  value={linkDriveSurat}
                  onChange={(e) => setLinkDriveSurat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Video (YouTube / Google Drive / MP4)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... atau link Drive"
                  value={linkYoutubeVideo}
                  onChange={(e) => setLinkYoutubeVideo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || siswaList.length === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pernyataan Siswa'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari nama siswa, NISN, kelas, atau jenis surat pernyataan..."
          filters={[
            {
              key: 'kelas',
              label: 'Filter Kelas',
              allLabel: 'Semua Kelas',
              value: filterKelas,
              onChange: setFilterKelas,
              options: kelasOptions
            },
            {
              key: 'media',
              label: 'Filter Video',
              allLabel: 'Semua Arsip',
              value: filterMedia,
              onChange: setFilterMedia,
              options: [
                { value: 'video', label: 'Ada Video' },
                { value: 'no_video', label: 'Tanpa Video' }
              ]
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="arsip"
          onReset={resetSearch}
        />

        {/* TABEL DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Siswa &amp; NISN</th>
                  <th className="px-6 py-3.5">Kelas</th>
                  <th className="px-6 py-3.5">Jenis Surat</th>
                  <th className="px-6 py-3.5">Berkas Surat (G-Drive)</th>
                  <th className="px-6 py-3.5">Video Dokumentasi (YouTube)</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat arsip pernyataan siswa...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada data surat pernyataan siswa.
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada arsip pernyataan siswa yang cocok dengan pencarian Anda.{' '}
                      <button
                        type="button"
                        onClick={resetSearch}
                        className="font-semibold text-cyan-700 dark:text-cyan-400 hover:underline ml-1"
                      >
                        Reset pencarian
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/dashboard/siswa/${item.siswa_id}`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-cyan-700 dark:hover:text-cyan-400 transition block"
                        >
                          {item.siswa?.nama_lengkap || 'Siswa'}
                        </Link>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          NISN: {item.siswa?.nisn || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {item.siswa?.kelas || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.jenis_surat}
                      </td>
                      <td className="px-6 py-4">
                        <LinkActionButtons
                          url={item.link_drive_surat}
                          title={`${item.jenis_surat} — ${item.siswa?.nama_lengkap || 'Siswa'}`}
                          subtitle={`NISN: ${item.siswa?.nisn || '-'} • ${item.siswa?.kelas || '-'}`}
                          previewLabel="Pratinjau Surat"
                          tone="cyan"
                          onPreview={setPreviewItem}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {item.link_youtube_video ? (
                          <LinkActionButtons
                            url={item.link_youtube_video}
                            title={`Video: ${item.siswa?.nama_lengkap || 'Siswa'} — ${item.jenis_surat}`}
                            subtitle={`NISN: ${item.siswa?.nisn || '-'} • ${item.siswa?.kelas || '-'}`}
                            previewLabel="Putar Video"
                            tone="red"
                            onPreview={setPreviewItem}
                          />
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Tidak ada video</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}

