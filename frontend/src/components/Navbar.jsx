import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService, DEFAULT_PPDB_SETTINGS, normalizeExternalUrl } from '../lib/api';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  const ppdbHref = normalizeExternalUrl(ppdb?.link_ppdb);
  const showPpdb = Boolean(ppdb?.is_active && ppdbHref);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', exact: true },
    { path: '/dashboard/bahan-ajar', label: 'Bahan Ajar' },
    { path: '/dashboard/akreditasi', label: 'Akreditasi' },
    { path: '/dashboard/siswa', label: 'Data & Berkas Siswa' },
    { path: '/dashboard/pernyataan-siswa', label: 'Pernyataan & Video' },
    { path: '/dashboard/guru', label: 'Data Guru' },
    { path: '/dashboard/sarana-prasarana', label: 'Sarana Prasarana' },
    { path: '/dashboard/alumni', label: 'Alumni & Ijazah' },
    { path: '/dashboard/berita-prestasi', label: 'Portal Berita' }
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Identitas Sekolah */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-700 dark:bg-cyan-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
                S2M
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base text-slate-900 dark:text-slate-100 block leading-tight truncate">
                  SMPN 2 Muting
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  Sistem Informasi Manajemen Sekolah (SMP)
                </span>
              </div>
            </Link>
          </div>

          {/* Info Pengguna, Role Badge & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user?.nama || user?.email}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                  isAdmin
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                    : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {isAdmin ? 'Role 1: Admin (Full CRUD)' : 'Role 2: User (Read-Only)'}
              </span>
            </div>

            <ThemeSwitcher />

            <Link
              to="/"
              className="inline-flex text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 px-2.5 sm:px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap"
            >
              <span className="hidden sm:inline">Beranda Publik</span>
              <span className="sm:hidden">Beranda</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 dark:text-red-300 dark:bg-red-950/50 dark:hover:bg-red-900/60 dark:border-red-900 transition whitespace-nowrap"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Sub-navigasi Modul */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800">
          {navLinks.map((item) => {
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-cyan-700 dark:bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {showPpdb && (
            <a
              href={ppdbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:border-emerald-800 transition inline-flex items-center gap-1"
            >
              <span>Sistem PPDB</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
