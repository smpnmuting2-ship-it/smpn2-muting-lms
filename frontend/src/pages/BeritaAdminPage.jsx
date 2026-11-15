import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchToolbar from '../components/SearchToolbar';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '../lib/cloudinary';
import { resolveDisplayImageUrl } from '../lib/mediaPreview';
import { BERITA_CATEGORIES, KATEGORI_BADGE_MAP, formatTanggalIndo } from '../lib/format';
import { matchesSearch } from '../lib/search';

const INITIAL_FORM = {
  judul: '',
  kategori: 'Prestasi Siswa',
  ringkasan: '',
  isi_konten: '',
  gambar_url: '',
  galeri_urls: [],
  nama_siswa_terkait: '',
  tingkat_prestasi: '',
  penulis: 'Tim Humas & Kesiswaan',
  tanggal_publikasi: new Date().toISOString().slice(0, 10),
  is_published: true
};

export default function BeritaAdminPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form Tambah / Edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAll('berita_prestasi');
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
      if (filterStatus === 'published' && item.is_published === false) return false;
      if (filterStatus === 'draft' && item.is_published !== false) return false;
      return matchesSearch(searchQuery, [
        item.judul,
        item.ringkasan,
        item.kategori,
        item.nama_siswa_terkait,
        item.tingkat_prestasi,
        item.penulis
      ]);
    });
  }, [items, searchQuery, filterKategori, filterStatus]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...INITIAL_FORM,
      tanggal_publikasi: new Date().toISOString().slice(0, 10)
    });
    setGalleryUrlInput('');
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setUploadingCover(true);
    try {
      const uploaded = await uploadImageToCloudinary(file, { folder: 'smpn2-muting/berita' });
      setForm((prev) => ({ ...prev, gambar_url: uploaded.url }));
      setSuccessMsg('Foto utama berhasil diunggah ke Cloudinary.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleUploadGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setErrorMsg('');
    setUploadingGallery(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadImageToCloudinary(file, { folder: 'smpn2-muting/galeri' });
        uploadedUrls.push(res.url);
      }
      setForm((prev) => ({
        ...prev,
        galeri_urls: [...prev.galeri_urls, ...uploadedUrls]
      }));
      setSuccessMsg(`${uploadedUrls.length} foto dokumentasi berhasil diunggah ke Cloudinary.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleAddGalleryUrl = () => {
    const trimmed = galleryUrlInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      galeri_urls: [...prev.galeri_urls, trimmed]
    }));
    setGalleryUrlInput('');
  };

  const handleRemoveGalleryItem = (index) => {
    setForm((prev) => ({
      ...prev,
      galeri_urls: prev.galeri_urls.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setErrorMsg('');
    setSuccessMsg('');
    setForm({
      judul: item.judul || '',
      kategori: item.kategori || 'Prestasi Siswa',
      ringkasan: item.ringkasan || '',
      isi_konten: item.isi_konten || '',
      gambar_url: item.gambar_url || '',
      galeri_urls: Array.isArray(item.galeri_urls) ? item.galeri_urls : [],
      nama_siswa_terkait: item.nama_siswa_terkait || '',
      tingkat_prestasi: item.tingkat_prestasi || '',
      penulis: item.penulis || 'Tim Humas & Kesiswaan',
      tanggal_publikasi: item.tanggal_publikasi || new Date().toISOString().slice(0, 10),
      is_published: item.is_published !== false
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
        const updated = await dataService.update('berita_prestasi', editingId, form);
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
        setSuccessMsg('Artikel berita & dokumentasi berhasil diperbarui.');
        resetForm();
      } else {
        const created = await dataService.create('berita_prestasi', form);
        setItems((prev) => [created, ...prev]);
        setSuccessMsg('Artikel baru berhasil diterbitkan ke Portal Berita.');
        resetForm();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      const updated = await dataService.update('berita_prestasi', item.id, {
        is_published: item.is_published === false
      });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus berita/prestasi ini?')) return;
    try {
      await dataService.remove('berita_prestasi', id);
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Portal Berita Prestasi &amp; Dokumentasi
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Kelola berita sekolah, prestasi siswa, dan galeri foto yang tampil di halaman depan publik (tanpa login).
            </p>
          </div>
          <Link
            to="/berita"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 dark:border-cyan-800 transition whitespace-nowrap"
          >
            Buka Portal Publik &rarr;
          </Link>
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

        {/* FORM INPUT / EDIT KHUSUS ADMIN */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingId
                  ? '✎ Edit Berita / Dokumentasi (Khusus Admin)'
                  : '+ Buat Berita Prestasi & Dokumentasi Baru (Khusus Admin)'}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isCloudinaryConfigured
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {isCloudinaryConfigured
                  ? 'Cloudinary Siap (Unggah Langsung Aktif)'
                  : 'Mode URL Foto (Isi VITE_CLOUDINARY_* untuk unggah langsung)'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Berita / Prestasi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siswa SMPN 2 Muting Raih Prestasi OSN / KSM Tingkat Kabupaten"
                    value={form.judul}
                    onChange={(e) => setForm({ ...form, judul: e.target.value })}
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
                    {BERITA_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Siswa / Tim Terkait (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ahmad Fauzan (VIII-A MTs)"
                    value={form.nama_siswa_terkait}
                    onChange={(e) => setForm({ ...form, nama_siswa_terkait: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat / Label (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tingkat Kabupaten / Nasional"
                    value={form.tingkat_prestasi}
                    onChange={(e) => setForm({ ...form, tingkat_prestasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Penulis / Redaksi
                  </label>
                  <input
                    type="text"
                    placeholder="Tim Humas & Kesiswaan"
                    value={form.penulis}
                    onChange={(e) => setForm({ ...form, penulis: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="date"
                    value={form.tanggal_publikasi}
                    onChange={(e) => setForm({ ...form, tanggal_publikasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ringkasan Singkat (Tampil di Kartu Berita)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ringkasan 1-2 kalimat mengenai berita atau capaian siswa..."
                  value={form.ringkasan}
                  onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Berita Lengkap
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tulis isi artikel lengkap. Gunakan baris baru untuk memisahkan paragraf..."
                  value={form.isi_konten}
                  onChange={(e) => setForm({ ...form, isi_konten: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              {/* FOTO SAMPUL (CLOUDINARY + MANUAL URL FALLBACK) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Foto Utama Berita (Cloudinary / URL Gambar)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unggah foto langsung ke Cloudinary atau tempel tautan foto (Cloudinary / Google Drive / HTTPS).
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer transition whitespace-nowrap">
                    <span>{uploadingCover ? 'Mengunggah...' : 'Unggah ke Cloudinary'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCover}
                      onChange={handleUploadCover}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/.../image/upload/... atau URL gambar"
                    value={form.gambar_url}
                    onChange={(e) => setForm({ ...form, gambar_url: e.target.value })}
                    className="flex-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  />
                  {resolveDisplayImageUrl(form.gambar_url) && (
                    <img
                      src={resolveDisplayImageUrl(form.gambar_url)}
                      alt="Preview Foto Utama"
                      className="w-28 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                    />
                  )}
                </div>

                {/* GALERI DOKUMENTASI TAMBAHAN */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Galeri Foto Dokumentasi Tambahan ({form.galeri_urls.length} foto)
                    </span>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 dark:text-teal-300 dark:bg-teal-950/60 dark:border-teal-800 cursor-pointer transition">
                      <span>{uploadingGallery ? 'Mengunggah Galeri...' : '+ Tambah Foto Galeri (Cloudinary)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingGallery}
                        onChange={handleUploadGallery}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Atau tempel URL foto galeri lalu klik Tambah"
                      value={galleryUrlInput}
                      onChange={(e) => setGalleryUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 transition"
                    >
                      Tambah URL
                    </button>
                  </div>

                  {form.galeri_urls.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {form.galeri_urls.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="relative w-24 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 group"
                        >
                          <img
                            src={resolveDisplayImageUrl(url)}
                            alt={`Galeri ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryItem(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center opacity-90 hover:opacity-100"
                            title="Hapus foto ini"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-600"
                  />
                  <span>Publikasikan langsung di Portal Berita Publik (Halaman Depan)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
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
                    disabled={submitting || uploadingCover || uploadingGallery}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50 transition"
                  >
                    {submitting
                      ? 'Menyimpan...'
                      : editingId
                        ? 'Simpan Perubahan Berita'
                        : 'Terbitkan Berita'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* PENCARIAN & FILTER */}
        <SearchToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Cari judul berita, prestasi, nama siswa, atau penulis..."
          filters={[
            {
              key: 'kategori',
              label: 'Kategori',
              allLabel: 'Semua Kategori',
              value: filterKategori,
              onChange: setFilterKategori,
              options: BERITA_CATEGORIES
            },
            ...(isAdmin
              ? [
                  {
                    key: 'status',
                    label: 'Status Tayang',
                    allLabel: 'Semua Status',
                    value: filterStatus,
                    onChange: setFilterStatus,
                    options: [
                      { value: 'published', label: 'Tayang (Publik)' },
                      { value: 'draft', label: 'Draft (Tersembunyi)' }
                    ]
                  }
                ]
              : [])
          ]}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          unitLabel="artikel"
          onReset={() => {
            setSearchQuery('');
            setFilterKategori('all');
            setFilterStatus('all');
          }}
        />

        {/* DAFTAR ARTIKEL */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Berita &amp; Foto</th>
                  <th className="px-6 py-3.5">Kategori &amp; Siswa</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Memuat daftar berita...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada berita yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const thumb = resolveDisplayImageUrl(item.gambar_url);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-20 h-14 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={item.judul}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                  No Foto
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 max-w-md">
                              <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                                {item.judul}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.ringkasan}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              KATEGORI_BADGE_MAP[item.kategori] || KATEGORI_BADGE_MAP['Berita Sekolah']
                            }`}
                          >
                            {item.kategori}
                          </span>
                          {(item.nama_siswa_terkait || item.tingkat_prestasi) && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {[item.nama_siswa_terkait, item.tingkat_prestasi]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatTanggalIndo(item.tanggal_publikasi || item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.is_published !== false
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.is_published !== false ? 'Tayang' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2.5">
                            <Link
                              to={`/berita/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-400"
                            >
                              Lihat ↗
                            </Link>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(item)}
                                  className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
                                >
                                  {item.is_published !== false ? 'Jadikan Draft' : 'Terbitkan'}
                                </button>
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
                              </>
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

