import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function LoginPage() {
  const { signIn, isLocalMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal melakukan autentikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Hanya untuk development: dibuang dari build produksi
  const fillDemoAccount = (roleType) => {
    if (!import.meta.env.DEV) return;
    setErrorMsg('');
    if (roleType === 'admin') {
      setEmail('admin@smpn2muting.sch.id');
      setPassword('admin123');
    } else {
      setEmail('guru@smpn2muting.sch.id');
      setPassword('user123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-cyan-700 dark:bg-cyan-600 flex items-center justify-center text-white font-extrabold text-lg shadow">
                S2M
              </div>
          <div className="text-left">
            <span className="font-bold text-xl text-slate-900 dark:text-slate-100 block leading-none">
              SMPN 2 Muting
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Login Portal Manajemen Sekolah (SMPN 2 Muting)
            </span>
          </div>
        </Link>

        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10 transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Masuk ke Sistem
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Masukkan email dan kata sandi akun Anda untuk mengakses dashboard.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@smpn2muting.sch.id"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50 transition shadow-sm"
            >
              {submitting ? 'Memproses...' : 'Masuk (Login)'}
            </button>
          </form>

          {/* Panel Bantuan Akun Localhost jika belum dikoneksikan ke Supabase */}
          {isLocalMode && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Mode Localhost Aktif — Pilih Akun Demo Cepat:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin')}
                  className="p-2.5 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/60 text-left transition"
                >
                  <div className="text-xs font-bold text-cyan-900 dark:text-cyan-300">
                    Role 1: Admin (Full CRUD)
                  </div>
                  <div className="text-[11px] text-cyan-700 dark:text-cyan-400 truncate">
                    admin@smpn2muting.sch.id
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('user')}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-left transition"
                >
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Role 2: User (Read-Only)
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
                    guru@smpn2muting.sch.id
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline">
              &larr; Kembali ke Halaman Utama Publik
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

