import React, { useEffect, useState } from 'react';
import { getPreviewInfo } from '../lib/mediaPreview';

export default function PreviewModal({ item, onClose }) {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const info = item ? getPreviewInfo(item.url) : null;

  useEffect(() => {
    setFrameLoaded(false);
    setDownloadMenuOpen(false);
  }, [item?.url]);

  useEffect(() => {
    if (!item) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (downloadMenuOpen) {
          setDownloadMenuOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [item, onClose, downloadMenuOpen]);

  if (!item || !info) return null;

  const isDarkViewer = info.renderMode === 'video' || info.kind === 'youtube';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${item.title || 'Dokumen'}`}
    >
      <div
        className="w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${info.badgeClass}`}
              >
                {info.typeLabel}
              </span>
              {item.subtitle && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {item.title || 'Pratinjau Tautan'}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tombol Unduh */}
            {info.downloads.length === 1 && (
              <a
                href={info.downloads[0].url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 dark:border-cyan-800 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                </svg>
                <span>{info.downloads[0].label}</span>
              </a>
            )}

            {info.downloads.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDownloadMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 dark:border-cyan-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                  </svg>
                  <span>Unduh</span>
                  <span className="text-[10px]">▾</span>
                </button>

                {downloadMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-30">
                    {info.downloads.map((dl) => (
                      <a
                        key={dl.url}
                        href={dl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        onClick={() => setDownloadMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 hover:text-cyan-800 dark:hover:bg-cyan-950/60 dark:hover:text-cyan-300 transition"
                      >
                        {dl.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tombol Buka Fitur Lengkap (Link Asli) */}
            <a
              href={info.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 shadow-sm transition"
            >
              <span>{info.openExternalLabel}</span>
              <span aria-hidden="true">↗</span>
            </a>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 dark:border-slate-700 transition font-bold text-base"
              title="Tutup pratinjau (Esc)"
              aria-label="Tutup pratinjau"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Area Pratinjau Utama */}
        <div
          className={`relative flex-1 overflow-hidden flex items-center justify-center ${
            isDarkViewer ? 'bg-slate-950' : 'bg-slate-100 dark:bg-slate-950'
          }`}
        >
          {!frameLoaded && info.renderMode !== 'video' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none z-10">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-cyan-600 dark:border-cyan-400"></div>
              <p className={`text-xs font-medium ${isDarkViewer ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                Memuat pratinjau {info.typeLabel}...
              </p>
            </div>
          )}

          {info.renderMode === 'video' ? (
            <video
              src={info.embedUrl}
              controls
              className="w-full h-full max-h-full bg-black"
            />
          ) : info.renderMode === 'image' ? (
            <img
              src={info.embedUrl}
              alt={item.title || 'Pratinjau Gambar'}
              onLoad={() => setFrameLoaded(true)}
              className="max-w-full max-h-full object-contain p-4"
            />
          ) : (
            <iframe
              key={info.embedUrl}
              src={info.embedUrl}
              title={item.title || 'Pratinjau Dokumen'}
              onLoad={() => setFrameLoaded(true)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>

        {/* Footer Bantuan */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <span>{info.hint}</span>
          <a
            href={info.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap"
          >
            Pratinjau tidak muncul? Buka langsung ↗
          </a>
        </div>
      </div>
    </div>
  );
}

