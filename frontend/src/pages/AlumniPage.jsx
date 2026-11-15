import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchToolbar from '../components/SearchToolbar';
import LinkActionButtons from '../components/LinkActionButtons';
import PreviewModal from '../components/PreviewModal';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { getUniqueSorted, matchesSearch } from '../lib/search';

const STATUS_LULUSAN_OPTIONS = [
  'Kuliah',
  'Lanjut Sekolah / Pondok',
  'Bekerja',
  'Wirausaha',
  'TNI / Polri / Kedinasan',
  'Mencari Kerja',
  'Belum Terdata'
];

const STATUS_BADGE_MAP = {
  Kuliah: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  'Lanjut Sekolah / Pondok': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  Bekerja: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  Wirausaha: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  'TNI / Polri / Kedinasan':
    'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  'Mencari Kerja': 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  'Belum Terdata': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
};

const INITIAL_FORM = {
  nisn: '',
  nama_lengkap: '',
  angkatan_lulus: '2025',
  jurusan: 'Reguler SMP',
  status_lulusan: 'Kuliah',
  instansi_tujuan: '',
  bidang_jurusan: '',
  kota: '',
  no_hp: '',
  email: '',
  link_ijazah_drive: '',
  keterangan: ''
};

export default function AlumniPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIjazah, setFilterIjazah] = useState('all');

  // Form Admin (Tambah / Edit)
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('alumni');
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

  const angkatanOptions = useMemo(
    () => getUniqueSorted(items.map((item) => item.angkatan_lulus)).reverse(),
    [items]
  );

  const trackerStats = useMemo(() => {
    const total = items.length;
    const kuliah = items.filter(
      (a) => a.status_lulusan === 'Kuliah' || a.status_lulusan === 'Lanjut Sekolah / Pondok'
    ).length;
    const bekerja = items.filter((a) => a.status_lulusan === 'Bekerja').length;
    const wirausaha = items.filter((a) => a.status_lulusan === 'Wirausaha').length;
    const kedinasan = items.filter((a) => a.status_lulusan === 'TNI / Polri / Kedinasan').length;
    const ijazahTersedia = items.filter(
      (a) => a.link_ijazah_drive && a.link_ijazah_drive.trim()
    ).length;
    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      total,
      kuliah,
      bekerja,
      wirausaha,
      kedinasan,
      lainnya: total - (kuliah + bekerja + wirausaha + kedinasan),
      ijazahTersedia,
      pct
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterAngkatan !== 'all' && String(item.angkatan_lulus) !== filterAngkatan) return false;
      if (filterStatus !== 'all' && item.status_lulusan !== filterStatus) return false;
      const hasIjazah = Boolean(item.link_ijazah_drive && item.link_ijazah_drive.trim());
      if (filterIjazah === 'ada' && !hasIjazah) return false;
      if (filterIjazah === 'belum' && hasIjazah) return false;

      return matchesSearch(searchQuery, [
        item.nisn,
        item.nama_lengkap,
        item.angkatan_lulus,
        item.jurusan,
        item.status_lulusan,
        item.instansi_tujuan,
        item.bidang_jurusan,
        item.kota,
        item.keterangan
      ]);
    });
  }, [items, searchQuery, filterAngkatan, filterStatus, filterIjazah]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterAngkatan('all');
    setFilterStatus('all');
    setFilterIjazah('all');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setErrorMsg('');
    setSuccessMsg('');
    setForm({
      nisn: item.nisn || '',
      nama_lengkap: item.nama_lengkap || '',
      angkatan_lulus: item.angkatan_lulus || '2025',
      jurusan: item.jurusan || 'Reguler SMP',
      status_lulusan: item.status_lulusan || 'Belum Terdata',
      instansi_tujuan: item.instansi_tujuan || '',
      bidang_jurusan: item.bidang_jurusan || '',
      kota: item.kota || '',
      no_hp: item.no_hp || '',
      email: item.email || '',
      link_ijazah_drive: item.link_ijazah_drive || '',
      keterangan: item.keterangan || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await dataService.update('alumni', editingId, form);
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
        setSuccessMsg('Data alumni, status tracker & tautan ijazah berhasil diperbarui.');
        resetForm();
      } else {
        const created = await dataService.create('alumni', form);
        setItems((prev) => [created, ...prev]);
        setSuccessMsg('Data alumni baru berhasil ditambahkan.');
        resetForm();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data alumni ini?')) return;
    try {
      await dataService.remove('alumni', id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
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
            Data Alumni, Alumni Tracker &amp; Arsip Ijazah
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pelacakan jejak studi lanjut &amp; karier lulusan (Alumni Tracker) serta pengelolaan arsip tautan Google Drive Ijazah/SKL SMPN 2 Muting.
          </p>
        </div>

        {/* ALUMNI TRACKER DASHBOARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ringkasan Alumni Tracker &amp; Kelengkapan Ijazah
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sebaran status lulusan terdata dari seluruh angkatan kelulusan.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800">
              {trackerStats.ijazahTersedia} / {trackerStats.total} Ijazah Terarsip (G-Drive)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Alumni</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {trackerStats.total}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900">
              <div className="text-xs font-semibold text-teal-700 dark:text-teal-300">Kuliah / Lanjut Studi</div>
              <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 mt-0.5">
                {trackerStats.kuliah}{' '}
                <span className="text-xs font-semibold opacity-75">
                  ({trackerStats.pct(trackerStats.kuliah)}%)
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/70 dark:border-cyan-900">
              <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">Bekerja</div>
              <div className="text-2xl font-extrabold text-cyan-900 dark:text-cyan-100 mt-0.5">
                {trackerStats.bekerja}{' '}
                <span className="text-xs font-semibold opacity-75">
                  ({trackerStats.pct(trackerStats.bekerja)}%)
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Wirausaha</div>
              <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-0.5">
                {trackerStats.wirausaha}{' '}
                <span className="text-xs font-semibold opacity-75">
                  ({trackerStats.pct(trackerStats.wirausaha)}%)
                </span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900">
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Kedinasan / Lainnya
              </div>
              <div className="text-2xl font-extrabold text-purple-900 dark:text-purple-100 mt-0.5">
                {trackerStats.kedinasan + trackerStats.lainnya}
              </div>
            </div>
          </div>

          {/* Visual Bar Proporsi Tracker */}
          {trackerStats.total > 0 && (
            <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex">
              {trackerStats.kuliah > 0 && (
                <div
                  style={{ width: `${(trackerStats.kuliah / trackerStats.total) * 100}%` }}
                  className="bg-teal-600 h-full"
                  title={`Kuliah / Lanjut Studi: ${trackerStats.kuliah}`}
                />
              )}
              {trackerStats.bekerja > 0 && (
                <div
                  style={{ width: `${(trackerStats.bekerja / trackerStats.total) * 100}%` }}
                  className="bg-cyan-600 h-full"
                  title={`Bekerja: ${trackerStats.bekerja}`}
                />
              )}
              {trackerStats.wirausaha > 0 && (
                <div
                  style={{ width: `${(trackerStats.wirausaha / trackerStats.total) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title={`Wirausaha: ${trackerStats.wirausaha}`}
                />
              )}
              {trackerStats.kedinasan > 0 && (
                <div
                  style={{ width: `${(trackerStats.kedinasan / trackerStats.total) * 100}%` }}
                  className="bg-purple-600 h-full"
                  title={`TNI/Polri/Kedinasan: ${trackerStats.kedinasan}`}
                />
              )}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 dark:bg-cyan-950/60 dark:border-cyan-800 text-sm text-cyan-800 dark:text-cyan-300">
            {successMsg}
          </div>
        )}

        {/* FORM INPUT KHUSUS ADMIN */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editingId
                ? '✎ Edit Data Alumni, Tracker & Ijazah (Khusus Admin)'
                : '+ Tambah Data Alumni & Tautan Ijazah (Khusus Admin)'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NISN (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0054123901"
                  value={form.nisn}
                  onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Alumni
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Antonius Gebze"
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Lulus
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2025"
                  value={form.angkatan_lulus}
                  onChange={(e) => setForm({ ...form, angkatan_lulus: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenjang / Jurusan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: MTs / Reguler SMP / Reguler SMP / Reguler SMP"
                  value={form.jurusan}
                  onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Alumni Tracker
                </label>
                <select
                  value={form.status_lulusan}
                  onChange={(e) => setForm({ ...form, status_lulusan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {STATUS_LULUSAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kampus / Perusahaan / Usaha
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Universitas Musamus / PT ..."
                  value={form.instansi_tujuan}
                  onChange={(e) => setForm({ ...form, instansi_tujuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Program Studi / Posisi / Bidang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: S1 Teknik Sipil / Staf Lapangan"
                  value={form.bidang_jurusan}
                  onChange={(e) => setForm({ ...form, bidang_jurusan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kota Domisili
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Merauke / Jayapura / Yogyakarta"
                  value={form.kota}
                  onChange={(e) => setForm({ ...form, kota: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. HP / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={form.no_hp}
                  onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Google Drive Scan Ijazah / SKL (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={form.link_ijazah_drive}
                  onChange={(e) => setForm({ ...form, link_ijazah_drive: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <input
                  type="text"
                  placeholder="Keterangan tambahan (beasiswa, prestasi alumni, status pengambilan ijazah fisik, dll)"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Data Alumni'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari nama alumni, NISN, kampus/perusahaan, program studi, atau kota..."
          filters={[
            {
              key: 'angkatan',
              label: 'Tahun Lulus',
              allLabel: 'Semua Angkatan',
              value: filterAngkatan,
              onChange: setFilterAngkatan,
              options: angkatanOptions.map((a) => ({ value: a, label: `Lulusan ${a}` }))
            },
            {
              key: 'status',
              label: 'Alumni Tracker',
              allLabel: 'Semua Status',
              value: filterStatus,
              onChange: setFilterStatus,
              options: STATUS_LULUSAN_OPTIONS
            },
            {
              key: 'ijazah',
              label: 'Arsip Ijazah',
              allLabel: 'Semua Ijazah',
              value: filterIjazah,
              onChange: setFilterIjazah,
              options: [
                { value: 'ada', label: 'Ijazah Tersedia' },
                { value: 'belum', label: 'Belum Ada Link Ijazah' }
              ]
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="alumni"
          onReset={resetSearch}
        />

        {/* TABEL ALUMNI */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Alumni &amp; Angkatan</th>
                  <th className="px-6 py-3.5">Alumni Tracker (Jejak Lulusan)</th>
                  <th className="px-6 py-3.5">Arsip Ijazah (Google Drive)</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat data alumni &amp; arsip ijazah...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada data alumni yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.nama_lengkap}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Lulusan <strong className="text-slate-700 dark:text-slate-200">{item.angkatan_lulus}</strong>
                          {item.jurusan ? ` • ${item.jurusan}` : ''}
                          {item.nisn ? ` • NISN ${item.nisn}` : ''}
                        </div>
                        {(item.no_hp || item.email) && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {[item.no_hp, item.email].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              STATUS_BADGE_MAP[item.status_lulusan] || STATUS_BADGE_MAP['Belum Terdata']
                            }`}
                          >
                            {item.status_lulusan}
                          </span>
                          {item.kota && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.kota}
                            </span>
                          )}
                        </div>
                        {item.instansi_tujuan && (
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {item.instansi_tujuan}
                          </div>
                        )}
                        {item.bidang_jurusan && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.bidang_jurusan}
                          </div>
                        )}
                        {item.keterangan && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.keterangan}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {item.link_ijazah_drive ? (
                          <LinkActionButtons
                            url={item.link_ijazah_drive}
                            title={`Ijazah — ${item.nama_lengkap}`}
                            subtitle={`Lulusan ${item.angkatan_lulus}${item.nisn ? ` • NISN ${item.nisn}` : ''}`}
                            previewLabel="Pratinjau Ijazah"
                            tone="cyan"
                            showCopy
                            onPreview={setPreviewItem}
                          />
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Link ijazah belum diunggah
                          </span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-400"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              Hapus
                            </button>
                          </div>
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

