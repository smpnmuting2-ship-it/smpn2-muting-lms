import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { getUniqueSorted, matchesSearch } from '../lib/search';

const INITIAL_FORM = {
  nip: '',
  nuptk: '',
  nama_lengkap: '',
  jenis_kelamin: 'Laki-laki',
  jabatan: 'Guru Mata Pelajaran',
  mata_pelajaran: '',
  status_kepegawaian: 'PNS',
  pendidikan_terakhir: 'S1',
  no_hp: '',
  email: '',
  status_aktif: 'Aktif'
};

const KEPEGAWAIAN_OPTIONS = ['PNS', 'PPPK', 'GTT / Honorer', 'PTT / Staf'];
const PENDIDIKAN_OPTIONS = ['S2', 'S1', 'D4', 'D3', 'SMA/Sederajat'];
const STATUS_AKTIF_OPTIONS = ['Aktif', 'Cuti', 'Pindah', 'Pensiun'];

export default function GuruPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKepegawaian, setFilterKepegawaian] = useState('all');
  const [filterStatusAktif, setFilterStatusAktif] = useState('all');
  const [filterJabatan, setFilterJabatan] = useState('all');

  // Form Admin (Tambah / Edit)
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('guru');
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

  const jabatanOptions = useMemo(
    () => getUniqueSorted(items.map((item) => item.jabatan)),
    [items]
  );

  const stats = useMemo(() => {
    return {
      total: items.length,
      pns: items.filter((g) => g.status_kepegawaian === 'PNS').length,
      pppk: items.filter((g) => g.status_kepegawaian === 'PPPK').length,
      honorer: items.filter(
        (g) => g.status_kepegawaian === 'GTT / Honorer' || g.status_kepegawaian === 'PTT / Staf'
      ).length,
      aktif: items.filter((g) => g.status_aktif === 'Aktif').length
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKepegawaian !== 'all' && item.status_kepegawaian !== filterKepegawaian) return false;
      if (filterStatusAktif !== 'all' && item.status_aktif !== filterStatusAktif) return false;
      if (filterJabatan !== 'all' && item.jabatan !== filterJabatan) return false;
      return matchesSearch(searchQuery, [
        item.nama_lengkap,
        item.nip,
        item.nuptk,
        item.jabatan,
        item.mata_pelajaran,
        item.email,
        item.no_hp
      ]);
    });
  }, [items, searchQuery, filterKepegawaian, filterStatusAktif, filterJabatan]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilterKepegawaian('all');
    setFilterStatusAktif('all');
    setFilterJabatan('all');
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
      nip: item.nip || '',
      nuptk: item.nuptk || '',
      nama_lengkap: item.nama_lengkap || '',
      jenis_kelamin: item.jenis_kelamin || 'Laki-laki',
      jabatan: item.jabatan || 'Guru Mata Pelajaran',
      mata_pelajaran: item.mata_pelajaran || '',
      status_kepegawaian: item.status_kepegawaian || 'PNS',
      pendidikan_terakhir: item.pendidikan_terakhir || 'S1',
      no_hp: item.no_hp || '',
      email: item.email || '',
      status_aktif: item.status_aktif || 'Aktif'
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
        const updated = await dataService.update('guru', editingId, form);
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
        setSuccessMsg('Data guru berhasil diperbarui.');
        resetForm();
      } else {
        const created = await dataService.create('guru', form);
        setItems((prev) => [created, ...prev]);
        setSuccessMsg('Data guru baru berhasil ditambahkan.');
        resetForm();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data guru ini dari database?')) return;
    try {
      await dataService.remove('guru', id);
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
            Database Data Guru &amp; Tenaga Kependidikan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Direktori induk pendidik dan staf SMPN 2 Muting (NIP/NUPTK, Jabatan, Mata Pelajaran, Status Kepegawaian, Kontak).
          </p>
        </div>

        {/* RINGKASAN STAT GURU */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pendidik</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">Status PNS</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.pns}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Status PPPK</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.pppk}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">GTT / Honorer</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.honorer}</div>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-purple-700 dark:text-purple-400">Guru Aktif</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.aktif}</div>
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
              {editingId ? '✎ Edit Data Guru (Khusus Admin)' : '+ Tambah Data Guru / Tendik Baru (Khusus Admin)'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andreas Koromath, S.Si"
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIP (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Isi '-' jika non-ASN"
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NUPTK (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="16 digit NUPTK"
                  value={form.nuptk}
                  onChange={(e) => setForm({ ...form, nuptk: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan / Tugas Utama
                </label>
                <input
                  type="text"
                  required
                  placeholder="Guru Mapel / Wali Kelas / Kepsek"
                  value={form.jabatan}
                  onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran / Bidang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Fikih / Matematika / IPA / TU"
                  value={form.mata_pelajaran}
                  onChange={(e) => setForm({ ...form, mata_pelajaran: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={form.jenis_kelamin}
                  onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Kepegawaian
                </label>
                <select
                  value={form.status_kepegawaian}
                  onChange={(e) => setForm({ ...form, status_kepegawaian: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {KEPEGAWAIAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pendidikan Terakhir
                </label>
                <select
                  value={form.pendidikan_terakhir}
                  onChange={(e) => setForm({ ...form, pendidikan_terakhir: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {PENDIDIKAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="nama@smpn2muting.sch.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Aktif
                </label>
                <select
                  value={form.status_aktif}
                  onChange={(e) => setForm({ ...form, status_aktif: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {STATUS_AKTIF_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan Guru' : 'Simpan Data Guru'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari nama guru, NIP, NUPTK, mata pelajaran, jabatan, atau kontak..."
          filters={[
            {
              key: 'kepegawaian',
              label: 'Status Kepegawaian',
              allLabel: 'Semua Status',
              value: filterKepegawaian,
              onChange: setFilterKepegawaian,
              options: KEPEGAWAIAN_OPTIONS
            },
            {
              key: 'jabatan',
              label: 'Jabatan',
              allLabel: 'Semua Jabatan',
              value: filterJabatan,
              onChange: setFilterJabatan,
              options: jabatanOptions
            },
            {
              key: 'aktif',
              label: 'Status Aktif',
              allLabel: 'Semua',
              value: filterStatusAktif,
              onChange: setFilterStatusAktif,
              options: STATUS_AKTIF_OPTIONS
            }
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="guru & tendik"
          onReset={resetSearch}
        />

        {/* TABEL DATA GURU */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama &amp; Identitas</th>
                  <th className="px-6 py-3.5">Jabatan &amp; Mata Pelajaran</th>
                  <th className="px-6 py-3.5">Kepegawaian</th>
                  <th className="px-6 py-3.5">Kontak</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat database guru...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada data guru yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.nama_lengkap}
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          NIP: {item.nip || '-'} {item.nuptk ? `• NUPTK: ${item.nuptk}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {item.jenis_kelamin} &bull; {item.pendidikan_terakhir || 'S1'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.jabatan}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.mata_pelajaran || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                          {item.status_kepegawaian}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{item.no_hp || '-'}</div>
                        <div className="text-slate-500 dark:text-slate-400">{item.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.status_aktif === 'Aktif'
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.status_aktif}
                        </span>
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

