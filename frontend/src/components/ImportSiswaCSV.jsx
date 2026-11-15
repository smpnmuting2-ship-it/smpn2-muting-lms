import React, { useRef, useState } from 'react';
import { parseSiswaCSV, downloadSiswaTemplate } from '../lib/csv';
import { dataService } from '../lib/api';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB (cukup untuk ribuan siswa)

const STATUS_STYLE = {
  valid: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
  exists: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
};

const STATUS_LABEL = {
  valid: 'Siap diimpor',
  exists: 'Sudah ada',
  error: 'Error'
};

/**
 * Panel impor Data Siswa dari CSV (khusus Admin).
 * Alur: pilih file / tempel teks -> pratinjau & validasi -> impor baris yang valid.
 */
export default function ImportSiswaCSV({ existingNisns, onImported }) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('file'); // 'file' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const validRows = rows.filter((r) => r.status === 'valid');
  const errorCount = rows.filter((r) => r.status === 'error').length;
  const existsCount = rows.filter((r) => r.status === 'exists').length;

  const reset = () => {
    setRows([]);
    setParseError('');
    setFileName('');
    setPasteText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processText = (text) => {
    setParseError('');
    setResultMsg('');
    try {
      setRows(parseSiswaCSV(text, existingNisns));
    } catch (err) {
      setRows([]);
      setParseError(err.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setParseError('Ukuran file melebihi 1 MB. Bagi data menjadi beberapa file CSV.');
      setRows([]);
      return;
    }

    setFileName(file.name);
    // File hanya dibaca sebagai teks di browser, tidak diunggah ke server
    const text = await file.text();
    processText(text);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setParseError('');
    try {
      const { inserted, skipped } = await dataService.createMany(
        'siswa',
        validRows.map((r) => r.record)
      );
      setResultMsg(
        `Berhasil mengimpor ${inserted} siswa.` +
          (skipped > 0 ? ` ${skipped} baris dilewati karena NISN sudah terdaftar.` : '')
      );
      reset();
      onImported();
    } catch (err) {
      setParseError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Impor Data Siswa dari CSV (Khusus Admin)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kolom wajib: <code className="font-mono">nisn, nama_lengkap, kelas, angkatan</code>.
            Pemisah koma, titik koma, atau tab didukung.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadSiswaTemplate}
          className="self-start px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:border-amber-800 transition whitespace-nowrap"
        >
          Unduh Template CSV
        </button>
      </div>

      {/* Pilihan sumber data */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {[
          { key: 'file', label: 'Pilih File CSV' },
          { key: 'paste', label: 'Tempel dari Excel' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setMode(tab.key);
              reset();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              mode === tab.key
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <label className="flex flex-col items-center justify-center gap-1 px-4 py-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 cursor-pointer transition text-center">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {fileName || 'Klik untuk memilih file .csv'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            File hanya dibaca di browser untuk diambil datanya, tidak disimpan di server.
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div>
          <textarea
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'nisn\tnama_lengkap\tkelas\tangkatan\n0091234567\tNama Siswa\tVII-A\t2026'}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-mono"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => processText(pasteText)}
              disabled={!pasteText.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 transition"
            >
              Periksa Data
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
        Tips: Excel sering menghapus angka 0 di depan NISN. Sistem akan melengkapinya otomatis
        menjadi 10 digit, dan barisnya diberi keterangan di pratinjau.
      </p>

      {parseError && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
          {parseError}
        </div>
      )}

      {resultMsg && (
        <div className="mt-4 p-3 rounded-lg bg-cyan-50 border border-cyan-200 dark:bg-cyan-950/60 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-300 font-medium">
          {resultMsg}
        </div>
      )}

      {/* Pratinjau hasil validasi */}
      {rows.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Pratinjau {rows.length} baris:</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 font-semibold">
              {validRows.length} siap diimpor
            </span>
            {existsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold">
                {existsCount} sudah ada
              </span>
            )}
            {errorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold">
                {errorCount} error
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left font-semibold text-slate-600 dark:text-slate-300 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Baris</th>
                  <th className="px-3 py-2">NISN</th>
                  <th className="px-3 py-2">Nama Lengkap</th>
                  <th className="px-3 py-2">Kelas</th>
                  <th className="px-3 py-2">Angkatan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {rows.map((r) => (
                  <tr key={r.line}>
                    <td className="px-3 py-2 text-slate-400 dark:text-slate-500">{r.line}</td>
                    <td className="px-3 py-2 font-mono">{r.record.nisn || '-'}</td>
                    <td className="px-3 py-2">{r.record.nama_lengkap || '-'}</td>
                    <td className="px-3 py-2">{r.record.kelas || '-'}</td>
                    <td className="px-3 py-2">{r.record.angkatan || '-'}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border font-semibold ${STATUS_STYLE[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.message && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.message}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mt-4">
            {errorCount > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 sm:mr-auto">
                Baris error tidak akan diimpor. Perbaiki di file lalu pilih ulang jika perlu.
              </span>
            )}
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {importing ? 'Mengimpor...' : `Impor ${validRows.length} Siswa`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

