/**
 * Utilitas untuk mengubah tautan eksternal (YouTube, Google Drive, Docs,
 * Sheets, Slides, PDF, Video, Gambar) menjadi URL preview in-app dan URL unduhan.
 */

export function sanitizeHttpUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return '';
  }
  return '';
}

/**
 * Mengubah URL foto agar siap dirender di tag <img>.
 * Mendukung URL Cloudinary, HTTPS gambar langsung, dan link file Google Drive.
 */
export function resolveDisplayImageUrl(rawUrl) {
  const safe = sanitizeHttpUrl(rawUrl);
  if (!safe) return '';

  const drivePathMatch = safe.match(
    /^https?:\/\/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/
  );
  if (drivePathMatch) {
    return `https://drive.google.com/thumbnail?id=${drivePathMatch[1]}&sz=w1200`;
  }

  if (/^https?:\/\/drive\.google\.com\/(?:open|uc)\b/.test(safe)) {
    try {
      const id = new URL(safe).searchParams.get('id');
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    } catch {
      return safe;
    }
  }

  return safe;
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return u.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') {
        return u.searchParams.get('v');
      }
      const match = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function getPreviewInfo(rawUrl) {
  const originalUrl = sanitizeHttpUrl(rawUrl);
  if (!originalUrl) {
    return null;
  }

  // 1. YouTube
  const ytId = extractYouTubeId(originalUrl);
  if (ytId) {
    return {
      kind: 'youtube',
      typeLabel: 'Video YouTube',
      badgeClass:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
      renderMode: 'iframe',
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0`,
      originalUrl,
      openExternalLabel: 'Buka di YouTube',
      downloads: [],
      hint: 'Video diputar langsung di dalam aplikasi. Klik "Buka di YouTube" untuk komentar, kualitas HD, atau fitur lengkap.'
    };
  }

  // 2. Google Docs
  const docsMatch = originalUrl.match(
    /^https?:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/
  );
  if (docsMatch) {
    const id = docsMatch[1];
    return {
      kind: 'gdocs',
      typeLabel: 'Google Docs',
      badgeClass:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      renderMode: 'iframe',
      embedUrl: `https://docs.google.com/document/d/${id}/preview`,
      originalUrl,
      openExternalLabel: 'Buka di Google Docs',
      downloads: [
        { label: 'Unduh PDF', url: `https://docs.google.com/document/d/${id}/export?format=pdf` },
        { label: 'Unduh Word (.docx)', url: `https://docs.google.com/document/d/${id}/export?format=docx` }
      ],
      hint: 'Pratinjau dokumen ditampilkan dalam mode baca. Klik "Buka di Google Docs" jika ingin mengedit atau berkomentar.'
    };
  }

  // 3. Google Sheets (Spreadsheet)
  const sheetsMatch = originalUrl.match(
    /^https?:\/\/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/
  );
  if (sheetsMatch) {
    const id = sheetsMatch[1];
    return {
      kind: 'gsheets',
      typeLabel: 'Google Sheets',
      badgeClass:
        'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
      renderMode: 'iframe',
      embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      originalUrl,
      openExternalLabel: 'Buka di Google Sheets',
      downloads: [
        { label: 'Unduh Excel (.xlsx)', url: `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx` },
        { label: 'Unduh PDF', url: `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf` },
        { label: 'Unduh CSV', url: `https://docs.google.com/spreadsheets/d/${id}/export?format=csv` }
      ],
      hint: 'Pratinjau spreadsheet ditampilkan langsung di aplikasi. Gunakan tombol Unduh untuk menyimpan sebagai Excel atau PDF.'
    };
  }

  // 4. Google Slides (Presentasi)
  const slidesMatch = originalUrl.match(
    /^https?:\/\/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/
  );
  if (slidesMatch) {
    const id = slidesMatch[1];
    return {
      kind: 'gslides',
      typeLabel: 'Google Slides',
      badgeClass:
        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      renderMode: 'iframe',
      embedUrl: `https://docs.google.com/presentation/d/${id}/preview`,
      originalUrl,
      openExternalLabel: 'Buka di Google Slides',
      downloads: [
        { label: 'Unduh PDF', url: `https://docs.google.com/presentation/d/${id}/export/pdf` },
        { label: 'Unduh PowerPoint (.pptx)', url: `https://docs.google.com/presentation/d/${id}/export/pptx` }
      ],
      hint: 'Pratinjau presentasi tersedia di sini. Klik "Buka di Google Slides" untuk mode presenter atau edit.'
    };
  }

  // 5. Folder Google Drive
  const folderMatch = originalUrl.match(
    /^https?:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/
  );
  if (folderMatch) {
    const id = folderMatch[1];
    return {
      kind: 'gdrive_folder',
      typeLabel: 'Folder Google Drive',
      badgeClass:
        'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      renderMode: 'iframe',
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${id}#list`,
      originalUrl,
      openExternalLabel: 'Buka Folder di Drive',
      downloads: [],
      hint: 'Daftar isi folder Google Drive. Klik salah satu file atau buka langsung di Google Drive untuk mengunduh seluruh folder.'
    };
  }

  // 6. File Google Drive (/file/d/ID, /open?id=ID, /uc?id=ID)
  let driveFileId = null;
  const drivePathMatch = originalUrl.match(
    /^https?:\/\/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/
  );
  if (drivePathMatch) {
    driveFileId = drivePathMatch[1];
  } else if (/^https?:\/\/drive\.google\.com\/(?:open|uc)\b/.test(originalUrl)) {
    try {
      driveFileId = new URL(originalUrl).searchParams.get('id');
    } catch {
      driveFileId = null;
    }
  }

  if (driveFileId) {
    return {
      kind: 'gdrive_file',
      typeLabel: 'Google Drive',
      badgeClass:
        'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      renderMode: 'iframe',
      embedUrl: `https://drive.google.com/file/d/${driveFileId}/preview`,
      originalUrl,
      openExternalLabel: 'Buka di Google Drive',
      downloads: [
        { label: 'Unduh File', url: `https://drive.google.com/uc?export=download&id=${driveFileId}` }
      ],
      hint: 'Pratinjau mendukung PDF, Word, Excel, gambar, maupun video Drive. Pastikan akses link Drive diatur ke "Siapa saja yang memiliki link".'
    };
  }

  // 7. File langsung berdasarkan ekstensi URL (PDF, Video, Gambar, Office)
  let pathname = '';
  try {
    pathname = new URL(originalUrl).pathname.toLowerCase();
  } catch {
    pathname = '';
  }

  if (pathname.endsWith('.pdf')) {
    return {
      kind: 'pdf',
      typeLabel: 'Dokumen PDF',
      badgeClass:
        'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      renderMode: 'iframe',
      embedUrl: originalUrl,
      originalUrl,
      openExternalLabel: 'Buka Tautan Asli',
      downloads: [{ label: 'Unduh PDF', url: originalUrl }],
      hint: 'Dokumen PDF ditampilkan langsung di aplikasi.'
    };
  }

  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(pathname)) {
    return {
      kind: 'video',
      typeLabel: 'Video',
      badgeClass:
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      renderMode: 'video',
      embedUrl: originalUrl,
      originalUrl,
      openExternalLabel: 'Buka Tautan Asli',
      downloads: [{ label: 'Unduh Video', url: originalUrl }],
      hint: 'Pemutar video langsung di dalam aplikasi.'
    };
  }

  if (/\.(png|jpe?g|gif|webp|svg)$/.test(pathname)) {
    return {
      kind: 'image',
      typeLabel: 'Gambar',
      badgeClass:
        'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
      renderMode: 'image',
      embedUrl: originalUrl,
      originalUrl,
      openExternalLabel: 'Buka Gambar Asli',
      downloads: [{ label: 'Unduh Gambar', url: originalUrl }],
      hint: 'Pratinjau gambar di dalam aplikasi.'
    };
  }

  if (/\.(docx?|xlsx?|pptx?)$/.test(pathname)) {
    return {
      kind: 'office',
      typeLabel: 'Dokumen Office',
      badgeClass:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      renderMode: 'iframe',
      embedUrl: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(originalUrl)}`,
      originalUrl,
      openExternalLabel: 'Buka Tautan Asli',
      downloads: [{ label: 'Unduh Dokumen', url: originalUrl }],
      hint: 'Pratinjau dokumen Word/Excel/PowerPoint via Google Viewer.'
    };
  }

  // 8. Tautan eksternal lainnya
  return {
    kind: 'external',
    typeLabel: 'Tautan Web',
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    renderMode: 'iframe',
    embedUrl: originalUrl,
    originalUrl,
    openExternalLabel: 'Buka Tautan Asli',
    downloads: [],
    hint: 'Jika situs sumber menolak ditampilkan di dalam frame, klik "Buka Tautan Asli" untuk membukanya di tab baru.'
  };
}

