import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext({});

const LOCAL_STORAGE_KEY = 'smpn2muting_auth_user';

// Mode lokal (tanpa Supabase) HANYA aktif saat development (npm run dev).
// Di build produksi (Vercel) nilai import.meta.env.DEV = false, sehingga
// akun demo di bawah tidak bisa dipakai dan dibuang dari bundle.
export const isLocalMode = import.meta.env.DEV && !isSupabaseConfigured;

// Akun bawaan untuk testing di Localhost sebelum konek Supabase Auth.
// `import.meta.env.DEV` ditulis langsung agar Vite membuang objek ini dari build produksi.
const LOCAL_ACCOUNTS = import.meta.env.DEV
  ? {
      'admin@smpn2muting.sch.id': {
        id: 'local-admin-01',
        email: 'admin@smpn2muting.sch.id',
        nama: 'Administrator SMPN 2 Muting',
        role: 'admin',
        password: 'admin123'
      },
      'guru@smpn2muting.sch.id': {
        id: 'local-user-01',
        email: 'guru@smpn2muting.sch.id',
        nama: 'Guru / Staf Pengajar (Read-Only)',
        role: 'user',
        password: 'user123'
      }
    }
  : {};

// Mengambil role & nama dari tabel profiles. Jika gagal, default 'user' (Read-Only).
async function loadSupabaseProfile(authUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, nama')
    .eq('id', authUser.id)
    .single();

  return {
    id: authUser.id,
    email: authUser.email,
    nama: (!error && data?.nama) || authUser.email,
    role: (!error && data?.role) || 'user'
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'user'
  const [loading, setLoading] = useState(true);

  const applyUser = (userData) => {
    setUser(userData);
    setRole(userData ? userData.role : null);
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      let active = true;

      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await loadSupabaseProfile(session.user);
          if (active) applyUser(profile);
        }
        if (active) setLoading(false);
      });

      // Catatan: jangan `await` pemanggilan Supabase langsung di dalam callback ini
      // (bisa membuat klien Supabase macet). Pemuatan profil ditunda dengan setTimeout.
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!session?.user) {
            applyUser(null);
            return;
          }
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            setTimeout(async () => {
              const profile = await loadSupabaseProfile(session.user);
              if (active) applyUser(profile);
            }, 0);
          }
        }
      );

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    if (isLocalMode) {
      // Mode Localhost: Cek sesi tersimpan di localStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          applyUser(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah.'
            : error.message
        );
      }
      // Muat profil SEBELUM kembali, supaya halaman dashboard langsung
      // melihat user yang sudah login (tidak terlempar balik ke /login).
      const profile = await loadSupabaseProfile(data.user);
      applyUser(profile);
      return profile;
    }

    if (!isLocalMode) {
      throw new Error(
        'Sistem belum terhubung ke database. Hubungi administrator (konfigurasi Supabase belum diisi).'
      );
    }

    // Mode Localhost Auth
    const account = LOCAL_ACCOUNTS[cleanEmail];
    if (!account || account.password !== password) {
      throw new Error(
        'Email atau password salah. Gunakan akun demo Admin atau Guru (User) yang tertera di bawah.'
      );
    }

    const sessionUser = {
      id: account.id,
      email: account.email,
      nama: account.nama,
      role: account.role
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionUser));
    applyUser(sessionUser);
    return sessionUser;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    applyUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin: role === 'admin',
        loading,
        isSupabaseConfigured,
        isLocalMode,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
