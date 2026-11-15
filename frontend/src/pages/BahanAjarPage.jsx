import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewModal from '../components/PreviewModal';
import LinkActionButtons from '../components/LinkActionButtons';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { getUniqueSorted, matchesSearch } from '../lib/search';

export default function BahanAjarPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');

  // State Form Admin
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [kelas, setKelas] = useState('VII-A');
  const [judulRpp, setJudulRpp] = useState('');
  const [linkDrive, setLinkDrive] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('bahan_ajar');
      setItems(data);
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
    () => getUniqueSorted(items.map((item) => item.kelas)),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKelas !== 'all' && item.kelas !== filterKelas) return false;
      return matchesSearch(searchQuery, [
        item.mata_pelajaran,
        item.kelas,
        item.judul_rpp
      ]);
    });
  }, [items, searchQuery, filterKelas]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterKelas('all');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const created = await dataService.create('bahan_ajar', {
        mata_pelajaran: mataPelajaran,
        kelas,
        judul_rpp: judulRpp,
        link_drive: linkDrive
      });
      setItems((prev) => [created, ...prev]);
      setMataPelajaran('');
      setKelas('VII-A');
      setJudulRpp('');
      setLinkDrive('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data bahan ajar ini?')) return;
    try {
      await dataService.remove('bahan_ajar', id);
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
            Modul 1: Bahan Ajar &amp; RPP
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Daftar perangkat pembelajaran dan RPP guru SMPN 2 Muting (Tautan Google Drive).
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
              + Tambah Bahan Ajar / RPP Baru (Khusus Admin)
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika / IPA Terpadu / Bahasa Indonesia"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas
                </label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <optgroup label="Kelas VII (SMP)">
                    <option value="VII-A">Kelas VII-A</option>
                    <option value="VII-B">Kelas VII-B</option>
                    <option value="VII (Semua Rombel)">Kelas VII (Semua Rombel)</option>
                  </optgroup>
                  <optgroup label="Kelas VIII (SMP)">
                    <option value="VIII-A">Kelas VIII-A</option>
                    <option value="VIII-B">Kelas VIII-B</option>
                    <option value="VIII (Semua Rombel)">Kelas VIII (Semua Rombel)</option>
                  </optgroup>
                  <optgroup label="Kelas IX (SMP)">
                    <option value="IX-A">Kelas IX-A</option>
                    <option value="IX-B">Kelas IX-B</option>
                    <option value="IX (Semua Rombel)">Kelas IX (Semua Rombel)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul RPP / Modul
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RPP Trigonometri Dasar"
                  value={judulRpp}
                  onChange={(e) => setJudulRpp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Google Drive / Docs / PDF
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... atau docs.google.com/..."
                  value={linkDrive}
                  onChange={(e) => setLinkDrive(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Bahan Ajar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari mata pelajaran, judul RPP/modul, atau kelas..."
          filters={[
            {
              key: 'kelas',
              label: 'Filter Kelas',
              allLabel: 'Semua Kelas',
              value: filterKelas,
              onChange: setFilterKelas,
              options: kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="dokumen"
          onReset={resetSearch}
        />

        {/* TABEL DATA (Dapat dilihat oleh Admin & User Read-Only) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Mata Pelajaran</th>
                  <th className="px-6 py-3.5">Kelas</th>
                  <th className="px-6 py-3.5">Judul RPP / Modul</th>
                  <th className="px-6 py-3.5">Tautan Google Drive</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat data bahan ajar...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada data bahan ajar.
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada bahan ajar yang cocok dengan pencarian Anda.{' '}
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
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.mata_pelajaran}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                          Kelas {item.kelas}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.judul_rpp}</td>
                      <td className="px-6 py-4">
                        <LinkActionButtons
                          url={item.link_drive}
                          title={item.judul_rpp}
                          subtitle={`${item.mata_pelajaran} • Kelas ${item.kelas}`}
                          previewLabel="Pratinjau Dokumen"
                          tone="cyan"
                          onPreview={setPreviewItem}
                        />
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

