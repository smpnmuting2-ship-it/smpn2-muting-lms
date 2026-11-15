import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImportSiswaCSV from '../components/ImportSiswaCSV';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { getUniqueSorted, matchesSearch } from '../lib/search';

export default function SiswaPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterBerkas, setFilterBerkas] = useState('all');

  // State Form Admin
  const [nisn, setNisn] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [kelas, setKelas] = useState('');
  const [angkatan, setAngkatan] = useState('2026');
  const [linkKkDrive, setLinkKkDrive] = useState('');
  const [linkAktaDrive, setLinkAktaDrive] = useState('');
  const [catatanBerkas, setCatatanBerkas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('siswa');
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

  const angkatanOptions = useMemo(
    () => getUniqueSorted(items.map((item) => item.angkatan)).reverse(),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKelas !== 'all' && item.kelas !== filterKelas) return false;
      if (filterAngkatan !== 'all' && String(item.angkatan) !== filterAngkatan) return false;
      const hasKk = Boolean(item.link_kk_drive && item.link_kk_drive.trim());
      const hasAkta = Boolean(item.link_akta_drive && item.link_akta_drive.trim());
      if (filterBerkas === 'lengkap' && !(hasKk && hasAkta)) return false;
      if (filterBerkas === 'belum' && hasKk && hasAkta) return false;

      return matchesSearch(searchQuery, [
        item.nisn,
        item.nama_lengkap,
        item.kelas,
        item.angkatan,
        item.catatan_berkas
      ]);
    });
  }, [items, searchQuery, filterKelas, filterAngkatan, filterBerkas]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterKelas('all');
    setFilterAngkatan('all');
    setFilterBerkas('all');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const created = await dataService.create('siswa', {
        nisn,
        nama_lengkap: namaLengkap,
        kelas,
        angkatan,
        link_kk_drive: linkKkDrive,
        link_akta_drive: linkAktaDrive,
        catatan_berkas: catatanBerkas
      });
      setItems((prev) => [created, ...prev]);
      setNisn('');
      setNamaLengkap('');
      setKelas('');
      setAngkatan('2026');
      setLinkKkDrive('');
      setLinkAktaDrive('');
      setCatatanBerkas('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data siswa ini? Arsip pernyataan siswa terkait juga akan terhapus.')) return;
    try {
      await dataService.remove('siswa', id);
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
            Modul 3: Data Induk &amp; Manajemen Berkas Siswa
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Direktori siswa SMPN 2 Muting beserta akses detail berkas Kartu Keluarga (KK) dan Akta Kelahiran (Google Drive).
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
              + Tambah Data Siswa Baru (Khusus Admin)
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NISN (Unik)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0081234567"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzan"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas / Rombel
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: VII-A / X-A (MA)"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Angkatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2026"
                  value={angkatan}
                  onChange={(e) => setAngkatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Google Drive Kartu Keluarga (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={linkKkDrive}
                  onChange={(e) => setLinkKkDrive(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Google Drive Akta Kelahiran (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={linkAktaDrive}
                  onChange={(e) => setLinkAktaDrive(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <input
                  type="text"
                  placeholder="Catatan berkas (opsional, mis: Berkas fisik lengkap di Tata Usaha)"
                  value={catatanBerkas}
                  onChange={(e) => setCatatanBerkas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* IMPOR CSV KHUSUS ADMIN */}
        {isAdmin && (
          <ImportSiswaCSV
            existingNisns={items.map((s) => s.nisn)}
            onImported={fetchData}
          />
        )}

        {/* PENCARIAN & FILTER SISWA */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari nama siswa, NISN, kelas, atau catatan berkas..."
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
              key: 'angkatan',
              label: 'Filter Angkatan',
              allLabel: 'Semua Angkatan',
              value: filterAngkatan,
              onChange: setFilterAngkatan,
              options: angkatanOptions.map((a) => ({ value: a, label: `Angkatan ${a}` }))
            },
            {
              key: 'berkas',
              label: 'Status KK & Akta',
              allLabel: 'Semua Berkas',
              value: filterBerkas,
              onChange: setFilterBerkas,
              options: [
                { value: 'lengkap', label: 'KK & Akta Lengkap' },
                { value: 'belum', label: 'Belum Lengkap' }
              ]
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="siswa"
          onReset={resetSearch}
        />

        {/* TABEL DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">NISN</th>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">Kelas &amp; Angkatan</th>
                  <th className="px-6 py-3.5">Berkas (KK &amp; Akta)</th>
                  <th className="px-6 py-3.5 text-right">Detail &amp; Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat data siswa...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada data siswa.
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada siswa yang cocok dengan pencarian Anda.{' '}
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
                  filteredItems.map((item) => {
                    const hasKk = Boolean(item.link_kk_drive && item.link_kk_drive.trim());
                    const hasAkta = Boolean(item.link_akta_drive && item.link_akta_drive.trim());
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.nisn}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/dashboard/siswa/${item.id}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-cyan-700 dark:hover:text-cyan-400 transition"
                          >
                            {item.nama_lengkap}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              {item.kelas}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.angkatan}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                hasKk
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {hasKk ? 'KK ✓' : 'KK -'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                hasAkta
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {hasAkta ? 'Akta ✓' : 'Akta -'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-3">
                            <Link
                              to={`/dashboard/siswa/${item.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 dark:border-cyan-800 transition"
                            >
                              Detail &amp; Berkas &rarr;
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
