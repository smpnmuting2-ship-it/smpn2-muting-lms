/**
 * Utilitas CSV untuk impor Data Siswa.
 * File CSV dibaca langsung di browser (tidak diunggah / tidak disimpan sebagai file),
 * lalu baris-barisnya dikirim sebagai data biasa ke database.
 */

// Deteksi pemisah kolom dari baris header: koma, titik koma (Excel Indonesia), atau tab (copy-paste Excel)
function detectDelimiter(headerLine) {
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = 0;
  for (const d of candidates) {
    const count = headerLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

// Parser CSV yang mendukung tanda kutip ("..."), kutip ganda di dalam kutip (""), dan baris baru di dalam kutip
export function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, ''); // hapus BOM dari Excel
  const firstLine = clean.split(/\r?\n/)[0] || '';
  const delimiter = detectDelimiter(firstLine);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Buang baris kosong
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// Nama kolom yang diterima untuk setiap field (tidak peka huruf besar/kecil & spasi)
const HEADER_ALIASES = {
  nisn: ['nisn'],
  nama_lengkap: ['nama_lengkap', 'nama', 'nama_siswa'],
  kelas: ['kelas', 'rombel', 'rombongan_belajar'],
  angkatan: ['angkatan', 'tahun_angkatan', 'tahun_masuk']
};

const normalizeHeader = (h) =>
  h.trim().toLowerCase().replace(/[\s\-]+/g, '_');

/**
 * Mengubah teks CSV menjadi daftar baris siswa beserta status validasinya.
 * @param {string} text - isi CSV
 * @param {string[]} existingNisns - NISN yang sudah ada di database
 */
export function parseSiswaCSV(text, existingNisns = []) {
  const table = parseCSV(text);
  if (table.length < 2) {
    throw new Error('File CSV kosong atau hanya berisi header. Minimal 1 baris data siswa.');
  }

  const headers = table[0].map(normalizeHeader);
  const colIndex = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    colIndex[field] = headers.findIndex((h) => aliases.includes(h));
  }

  const missingCols = Object.keys(colIndex).filter((f) => colIndex[f] === -1);
  if (missingCols.length > 0) {
    throw new Error(
      `Kolom berikut tidak ditemukan di header CSV: ${missingCols.join(', ')}. ` +
        'Header yang dibutuhkan: nisn, nama_lengkap, kelas, angkatan.'
    );
  }

  const existing = new Set(existingNisns.map((n) => String(n).trim()));
  const seenInFile = new Set();

  return table.slice(1).map((cells, i) => {
    const get = (field) => (cells[colIndex[field]] || '').trim();
    let nisn = get('nisn').replace(/\s+/g, '');
    const record = {
      nisn,
      nama_lengkap: get('nama_lengkap'),
      kelas: get('kelas'),
      angkatan: get('angkatan')
    };

    const result = {
      line: i + 2, // nomor baris di file (baris 1 = header)
      record,
      status: 'valid', // 'valid' | 'error' | 'exists'
      message: ''
    };

    if (!record.nisn || !record.nama_lengkap || !record.kelas || !record.angkatan) {
      result.status = 'error';
      result.message = 'Ada kolom yang kosong';
      return result;
    }

    if (!/^\d+$/.test(nisn)) {
      result.status = 'error';
      result.message = 'NISN harus berupa angka';
      return result;
    }

    if (nisn.length > 10) {
      result.status = 'error';
      result.message = 'NISN lebih dari 10 digit';
      return result;
    }

    // NISN selalu 10 digit. Excel sering menghapus angka 0 di depan, jadi dilengkapi kembali.
    if (nisn.length < 10) {
      nisn = nisn.padStart(10, '0');
      record.nisn = nisn;
      result.message = 'Angka 0 di depan NISN dilengkapi otomatis';
    }

    if (seenInFile.has(nisn)) {
      result.status = 'error';
      result.message = 'NISN ganda di dalam file ini';
      return result;
    }
    seenInFile.add(nisn);

    if (existing.has(nisn)) {
      result.status = 'exists';
      result.message = 'NISN sudah terdaftar, akan dilewati';
      return result;
    }

    return result;
  });
}

// Membuat dan mengunduh file template CSV
export function downloadSiswaTemplate() {
  const content =
    'nisn,nama_lengkap,kelas,angkatan\n' +
    '0091234567,Contoh Siswa MTs,VII-A,2026\n' +
    '0079876543,Contoh Siswa MA,VIII-B,2025\n';
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_data_siswa.csv';
  a.click();
  URL.revokeObjectURL(url);
}

