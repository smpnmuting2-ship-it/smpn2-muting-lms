import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LinkActionButtons from '../components/LinkActionButtons';
import PreviewModal from '../components/PreviewModal';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/api';

export default function SiswaDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [siswa, setSiswa] = useState(null);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // Form Admin Edit Berkas & Profil
  const [form, setForm] = useState({
    nisn: '',
    nama_lengkap: '',
    kelas: '',
    angkatan: '',
    link_kk_drive: '',
    link_akta_drive: '',
    catatan_berkas: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [studentData, allStatements] = await Promise.all([
          dataService.getById('siswa', id),
          dataService.getAll('pernyataan_siswa').catch(() => [])
        ]);
        setSiswa(studentData);
        setStatements(allStatements.filter((ps) => ps.siswa_id === id));
        setForm({
          nisn: studentData.nisn || '',
          nama_lengkap: studentData.nama_lengkap || '',
          kelas: studentData.kelas || '',
          angkatan: studentData.angkatan || '',
          link_kk_drive: studentData.link_kk_drive || '',
          link_akta_drive: studentData.link_akta_drive || '',
          catatan_berkas: studentData.catatan_berkas || ''
        });
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const updated = await dataService.update('siswa', id, form);
      setSiswa(updated);
      setSuccessMsg('Data siswa dan tautan berkas Google Drive (KK & Akta) berhasil disimpan.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasKk = Boolean(siswa?.link_kk_drive && siswa.link_kk_drive.trim());
  const hasAkta = Boolean(siswa?.link_akta_drive && siswa.link_akta_drive.trim());

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/dashboard" className="hover:text-cyan-700 dark:hover:text-cyan-400">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/dashboard/siswa" className="hover:text-cyan-700 dark:hover:text-cyan-400">
              Data Siswa
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {siswa?.nama_lengkap || 'Detail & Berkas Siswa'}
            </span>
          </div>

          <Link
            to="/dashboard/siswa"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 transition"
          >
            &larr; Kembali ke Data Siswa
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

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Memuat detail siswa &amp; manajemen berkas...
          </div>
        ) : !siswa ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Data siswa tidak ditemukan.
          </div>
        ) : (
          <div className="space-y-6">
            {/* PROFIL SISWA RINGKAS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Kelas {siswa.kelas}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Angkatan {siswa.angkatan}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    NISN: {siswa.nisn}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {siswa.nama_lengkap}
                </h1>
                {siswa.catatan_berkas && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Catatan Berkas: <span className="font-medium">{siswa.catatan_berkas}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    hasKk
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {hasKk ? '✓ KK Tersedia' : '• KK Belum Ada'}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    hasAkta
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {hasAkta ? '✓ Akta Tersedia' : '• Akta Belum Ada'}
                </span>
              </div>
            </div>

            {/* MANAJEMEN BERKAS SISWA (KARTU KELUARGA & AKTA VIA G-DRIVE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kartu Keluarga */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                      Dokumen Keluarga
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        hasKk
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {hasKk ? 'Link G-Drive Terpasang' : 'Belum Tersedia'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Kartu Keluarga (KK)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scan / salinan Kartu Keluarga siswa yang tersimpan di Google Drive sekolah.
                  </p>
                </div>

                {hasKk ? (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      {siswa.link_kk_drive}
                    </div>
                    <LinkActionButtons
                      url={siswa.link_kk_drive}
                      title={`Kartu Keluarga — ${siswa.nama_lengkap}`}
                      subtitle={`NISN: ${siswa.nisn} • Kelas ${siswa.kelas}`}
                      previewLabel="Pratinjau KK"
                      tone="cyan"
                      showCopy
                      onPreview={setPreviewItem}
                    />
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                    Tautan Google Drive Kartu Keluarga belum ditambahkan oleh Admin.
                  </div>
                )}
              </div>

              {/* Akta Kelahiran */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                      Dokumen Identitas
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        hasAkta
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {hasAkta ? 'Link G-Drive Terpasang' : 'Belum Tersedia'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Akta Kelahiran
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scan / salinan Akta Kelahiran siswa dari tautan Google Drive untuk keperluan administrasi.
                  </p>
                </div>

                {hasAkta ? (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      {siswa.link_akta_drive}
                    </div>
                    <LinkActionButtons
                      url={siswa.link_akta_drive}
                      title={`Akta Kelahiran — ${siswa.nama_lengkap}`}
                      subtitle={`NISN: ${siswa.nisn} • Kelas ${siswa.kelas}`}
                      previewLabel="Pratinjau Akta"
                      tone="cyan"
                      showCopy
                      onPreview={setPreviewItem}
                    />
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                    Tautan Google Drive Akta Kelahiran belum ditambahkan oleh Admin.
                  </div>
                )}
              </div>
            </div>

            {/* FORM KELOLA BERKAS & PROFIL (KHUSUS ADMIN) */}
            {isAdmin && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Kelola Tautan Berkas Google Drive &amp; Profil Siswa (Khusus Admin)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Salin-tempel tautan Google Drive untuk Kartu Keluarga dan Akta Kelahiran siswa di bawah ini.
                </p>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Link Google Drive Kartu Keluarga (KK)
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/.../view"
                        value={form.link_kk_drive}
                        onChange={(e) => setForm({ ...form, link_kk_drive: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Link Google Drive Akta Kelahiran
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/.../view"
                        value={form.link_akta_drive}
                        onChange={(e) => setForm({ ...form, link_akta_drive: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        NISN
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nisn}
                        onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nama_lengkap}
                        onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Kelas
                      </label>
                      <input
                        type="text"
                        required
                        value={form.kelas}
                        onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Angkatan
                      </label>
                      <input
                        type="text"
                        required
                        value={form.angkatan}
                        onChange={(e) => setForm({ ...form, angkatan: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Kelengkapan Berkas (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: KK & Akta sudah diverifikasi wali kelas"
                      value={form.catatan_berkas}
                      onChange={(e) => setForm({ ...form, catatan_berkas: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Berkas & Profil Siswa'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ARSIP PERNYATAAN & VIDEO TERKAIT SISWA INI */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Surat Pernyataan &amp; Video Dokumentasi Terkait ({statements.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Arsip pernyataan siswa yang terhubung dengan profil {siswa.nama_lengkap}.
                  </p>
                </div>
                <Link
                  to="/dashboard/pernyataan-siswa"
                  className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline whitespace-nowrap"
                >
                  Kelola di Modul Pernyataan &rarr;
                </Link>
              </div>

              {statements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Belum ada surat pernyataan atau video yang tercatat untuk siswa ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {statements.map((st) => (
                    <div
                      key={st.id}
                      className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    >
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {st.jenis_surat}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <LinkActionButtons
                          url={st.link_drive_surat}
                          title={`${st.jenis_surat} — ${siswa.nama_lengkap}`}
                          subtitle={`NISN: ${siswa.nisn} • ${siswa.kelas}`}
                          previewLabel="Pratinjau Surat"
                          tone="cyan"
                          showCopy
                          onPreview={setPreviewItem}
                        />
                        {st.link_youtube_video && (
                          <LinkActionButtons
                            url={st.link_youtube_video}
                            title={`Video: ${siswa.nama_lengkap} — ${st.jenis_surat}`}
                            subtitle={`NISN: ${siswa.nisn} • ${siswa.kelas}`}
                            previewLabel="Putar Video"
                            tone="red"
                            onPreview={setPreviewItem}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}

