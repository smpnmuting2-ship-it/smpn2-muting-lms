import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewModal from '../components/PreviewModal';
import LinkActionButtons from '../components/LinkActionButtons';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { getUniqueSorted, matchesSearch } from '../lib/search';

export default function AkreditasiPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubBab, setFilterSubBab] = useState('all');

  // State Form Admin
  const [subBab, setSubBab] = useState('');
  const [namaDokumen, setNamaDokumen] = useState('');
  const [linkDrive, setLinkDrive] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('akreditasi');
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

  const subBabOptions = useMemo(
    () => getUniqueSorted(items.map((item) => item.sub_bab)),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterSubBab !== 'all' && item.sub_bab !== filterSubBab) return false;
      return matchesSearch(searchQuery, [
        item.sub_bab,
        item.nama_dokumen,
        item.keterangan
      ]);
    });
  }, [items, searchQuery, filterSubBab]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterSubBab('all');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const created = await dataService.create('akreditasi', {
        sub_bab: subBab,
        nama_dokumen: namaDokumen,
        link_drive: linkDrive,
        keterangan
      });
      setItems((prev) => [created, ...prev]);
      setSubBab('');
      setNamaDokumen('');
      setLinkDrive('');
      setKeterangan('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus dokumen akreditasi ini?')) return;
    try {
      await dataService.remove('akreditasi', id);
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
            Modul 2: Dokumen Akreditasi Sekolah
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Arsip tautan berkas bukti fisik akreditasi SMPN 2 Muting berdasarkan sub-bab.
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
              + Tambah Dokumen Akreditasi (Khusus Admin)
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Bab / Komponen Akreditasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Komponen 1 - Mutu Lulusan"
                  value={subBab}
                  onChange={(e) => setSubBab(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Dokumen Bukti Fisik
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laporan Rekapitulasi Kelulusan Siswa"
                  value={namaDokumen}
                  onChange={(e) => setNamaDokumen(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Google Drive / Docs / Sheets / PDF
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sudah disahkan Kepala Sekolah"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Dokumen Akreditasi'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari nama dokumen, sub-bab akreditasi, atau keterangan..."
          filters={[
            {
              key: 'sub_bab',
              label: 'Filter Sub-Bab',
              allLabel: 'Semua Sub-Bab',
              value: filterSubBab,
              onChange: setFilterSubBab,
              options: subBabOptions
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="berkas"
          onReset={resetSearch}
        />

        {/* TABEL DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Sub-Bab</th>
                  <th className="px-6 py-3.5">Nama Dokumen</th>
                  <th className="px-6 py-3.5">Keterangan</th>
                  <th className="px-6 py-3.5">Tautan Google Drive</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat dokumen akreditasi...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada dokumen akreditasi.
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada dokumen akreditasi yang cocok dengan pencarian Anda.{' '}
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
                      <td className="px-6 py-4 font-semibold text-teal-800 dark:text-teal-400">
                        {item.sub_bab}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {item.nama_dokumen}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {item.keterangan || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <LinkActionButtons
                          url={item.link_drive}
                          title={item.nama_dokumen}
                          subtitle={item.sub_bab}
                          previewLabel="Pratinjau Berkas"
                          tone="teal"
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

