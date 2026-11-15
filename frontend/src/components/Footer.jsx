import React from 'react';
import logoUgm from '../assets/logo-ugm.png';
import logoKemenTrans from '../assets/logo-kementerian-transmigrasi.png';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Pojok Kiri Bawah: Kolaborasi Strategis + Hak Cipta dalam satu bar ringkas */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.16em] text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
            Kolaborasi Strategis
          </span>
          <div className="inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-300/90 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-500/40 shadow-sm transition-colors">
            <img
              src={logoUgm}
              alt="Universitas Gadjah Mada"
              className="h-6 sm:h-7 w-auto object-contain"
              loading="lazy"
            />
            <span aria-hidden="true" className="w-px h-5 bg-slate-200 dark:bg-slate-400/70 shrink-0" />
            <img
              src={logoKemenTrans}
              alt="Kementerian Transmigrasi Republik Indonesia"
              className="h-6 sm:h-7 w-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>

        {/* Kanan: Hak Cipta */}
        <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} SMPN 2 Muting. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Portal Manajemen Sekolah (SMPN 2 Muting) &bull; Kabupaten Merauke
          </p>
        </div>
      </div>
    </footer>
  );
}
