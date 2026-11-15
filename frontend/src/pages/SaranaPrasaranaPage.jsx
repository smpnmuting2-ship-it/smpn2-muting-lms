import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { matchesSearch } from '../lib/search';

const KATEGORI_SARPRAS = [
  'Ruang & Bangunan',
  'Peralatan Lab & TIK',
  'Mebelair Kelas',
  'Sarana Olahraga & Seni',
  'Buku & Perpustakaan',
  'Utilitas & Lainnya'
];

const KONDISI_OPTIONS = ['Baik', 'Rusak Ringan', 'Rusak Berat'];

const KONDISI_STYLE = {
  Baik: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  'Rusak Ringan': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  'Rusak Berat': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
};

const INITIAL_FORM = {
  kode_aset: '',
  nama_sarpras: '',
  kategori: 'Ruang & Bangunan',
  jumlah: 1,
  satuan: 'Unit',
  kondisi: 'Baik',
  lokasi: '',
  tahun_pengadaan: '',
  keterangan: ''
};

export default function SaranaPrasaranaPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterKondisi, setFilterKondisi] = useState('all');

  // Form Admin
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('sarana_prasarana');
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

  const stats = useMemo(() => {
    const totalUnit = items.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0);
    return {
      totalJenis: items.length,
      totalUnit,
      baik: items.filter((it) => it.kondisi === 'Baik').length,
      rusakRingan: items.filter((it) => it.kondisi === 'Rusak Ringan').length,
      rusakBerat: items.filter((it) => it.kondisi === 'Rusak Berat').length
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
      if (filterKondisi !== 'all' && item.kondisi !== filterKondisi) return false;
      return matchesSearch(searchQuery, [
        item.kode_aset,
        item.nama_sarpras,
        item.kategori,
        item.lokasi,
        item.tahun_pengadaan,
        item.keterangan
      ]);
    });
  }, [items, searchQuery, filterKategori, filterKondisi]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterKategori('all');
    setFilterKondisi('all');
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
      kode_aset: item.kode_aset || '',
      nama_sarpras: item.nama_sarpras || '',
      kategori: item.kategori || 'Ruang & Bangunan',
      jumlah: item.jumlah ?? 1,
      satuan: item.satuan || 'Unit',
      kondisi: item.kondisi || 'Baik',
      lokasi: item.lokasi || '',
      tahun_pengadaan: item.tahun_pengadaan || '',
      keterangan: item.keterangan || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    const payload = {
      ...form,
      jumlah: Math.max(0, Number.parseInt(form.jumlah, 10) || 0)
    };
    try {
      if (editingId) {
        const updated = await dataService.update('sarana_prasarana', editingId, payload);
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
        setSuccessMsg('Data sarana & prasarana berhasil diperbarui.');
        resetForm();
      } else {
        const created = await dataService.create('sarana_prasarana', payload);
        setItems((prev) => [created, ...prev]);
        setSuccessMsg('Inventaris sarana & prasarana baru berhasil ditambahkan.');
        resetForm();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus item sarana/prasarana ini?')) return;
    try {
      await dataService.remove('sarana_prasarana', id);
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
            Inventaris Sarana &amp; Prasarana Sekolah
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Daftar ruang kelas, laboratorium, perlengkapan belajar, dan fasilitas penunjang SMPN 2 Muting beserta kondisi terkininya.
          </p>
        </div>

        {/* RINGKASAN KONDISI SARPRAS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Jenis Aset</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.totalJenis}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">Total Kuantitas</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.totalUnit}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Kondisi Baik</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.baik}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">Rusak Ringan</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.rusakRingan}</div>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">Rusak Berat</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.rusakBerat}</div>
          </div>
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
                ? '✎ Edit Item Sarana & Prasarana (Khusus Admin)'
                : '+ Tambah Sarana & Prasarana Baru (Khusus Admin)'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Aset (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SRP-006"
                  value={form.kode_aset}
                  onChange={(e) => setForm({ ...form, kode_aset: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Sarana / Prasarana
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Proyektor LCD Epson / Ruang Perpustakaan"
                  value={form.nama_sarpras}
                  onChange={(e) => setForm({ ...form, nama_sarpras: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {KATEGORI_SARPRAS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Unit / Ruang / Set / Paket"
                  value={form.satuan}
                  onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kondisi
                </label>
                <select
                  value={form.kondisi}
                  onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {KONDISI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Pengadaan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2024"
                  value={form.tahun_pengadaan}
                  onChange={(e) => setForm({ ...form, tahun_pengadaan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lokasi Penempatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gedung MTs / Gedung MA / Lab Komputer"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bantuan DAK 2024 / Perlu perawatan rutin"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div className="md:col-span-4 flex items-center justify-end gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 transition"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan Sarpras'
                      : 'Simpan Inventaris'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari kode aset, nama sarana/prasarana, lokasi, atau keterangan..."
          filters={[
            {
              key: 'kategori',
              label: 'Kategori',
              allLabel: 'Semua Kategori',
              value: filterKategori,
              onChange: setFilterKategori,
              options: KATEGORI_SARPRAS
            },
            {
              key: 'kondisi',
              label: 'Kondisi',
              allLabel: 'Semua Kondisi',
              value: filterKondisi,
              onChange: setFilterKondisi,
              options: KONDISI_OPTIONS
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="item"
          onReset={resetSearch}
        />

        {/* TABEL DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Kode &amp; Nama Sarpras</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Jumlah</th>
                  <th className="px-6 py-3.5">Kondisi</th>
                  <th className="px-6 py-3.5">Lokasi &amp; Keterangan</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat daftar sarana &amp; prasarana...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada data sarana &amp; prasarana yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.nama_sarpras}
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {item.kode_aset || 'Tanpa Kode'}
                          {item.tahun_pengadaan ? ` • Tahun ${item.tahun_pengadaan}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.jumlah} <span className="font-normal text-slate-500 dark:text-slate-400">{item.satuan}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            KONDISI_STYLE[item.kondisi] || KONDISI_STYLE.Baik
                          }`}
                        >
                          {item.kondisi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.lokasi || '-'}
                        </div>
                        {item.keterangan && (
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5">{item.keterangan}</div>
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
    </div>
  );
}

