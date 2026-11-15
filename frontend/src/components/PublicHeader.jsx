import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService, DEFAULT_PPDB_SETTINGS, normalizeExternalUrl } from '../lib/api';
import ThemeSwitcher from './ThemeSwitcher';

export default function PublicHeader() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [ppdb, setPpdb] = useState(DEFAULT_PPDB_SETTINGS);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const settings = await dataService.getPpdbSettings();
      if (mounted && settings) setPpdb(settings);
    };
    load();
    const handleUpdate = () => load();
    window.addEventListener('ppdb-settings-updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('ppdb-settings-updated', handleUpdate);
    };
  }, []);

  const isBerita = location.pathname.startsWith('/berita');
  const ppdbHref = normalizeExternalUrl(ppdb?.link_ppdb);
  const showPpdb = Boolean(ppdb?.is_active && ppdbHref);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-700 dark:bg-cyan-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
                S2M
              </div>
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 block leading-none truncate">
                SMPN 2 Muting
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                Distrik Muting, Merauke &bull; Portal Publik &amp; Manajemen Sekolah
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-2 pl-4 border-l border-slate-200 dark:border-slate-800">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                location.pathname === '/'
                  ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Beranda
            </Link>
            <Link
              to="/berita"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isBerita
                  ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Portal Berita &amp; Prestasi
            </Link>
            {showPpdb && (
              <a
                href={ppdbHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:border-emerald-800 transition inline-flex items-center gap-1.5"
              >
                <span>Sistem PPDB</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {showPpdb && (
            <a
              href={ppdbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800 transition whitespace-nowrap"
            >
              PPDB ↗
            </a>
          )}
          <Link
            to="/berita"
            className="md:hidden inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition whitespace-nowrap"
          >
            Berita
          </Link>
          <ThemeSwitcher />
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 transition shadow-sm whitespace-nowrap"
            >
              Buka Dashboard ({isAdmin ? 'Admin' : 'User'}) &rarr;
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 dark:border-cyan-800 transition whitespace-nowrap"
            >
              Login Sistem
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

