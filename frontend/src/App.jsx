import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Halaman Publik
import LandingPage from './pages/LandingPage';
import BeritaPortalPage from './pages/BeritaPortalPage';
import BeritaDetailPage from './pages/BeritaDetailPage';
import LoginPage from './pages/LoginPage';

// Halaman Privat (Terproteksi Login)
import Dashboard from './pages/Dashboard';
import BahanAjarPage from './pages/BahanAjarPage';
import AkreditasiPage from './pages/AkreditasiPage';
import SiswaPage from './pages/SiswaPage';
import SiswaDetailPage from './pages/SiswaDetailPage';
import PernyataanSiswaPage from './pages/PernyataanSiswaPage';
import BeritaAdminPage from './pages/BeritaAdminPage';
import GuruPage from './pages/GuruPage';
import SaranaPrasaranaPage from './pages/SaranaPrasaranaPage';
import AlumniPage from './pages/AlumniPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ==========================================
                RUTE PUBLIK (Bisa diakses siapa saja tanpa login)
            ========================================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/berita" element={<BeritaPortalPage />} />
            <Route path="/berita/:id" element={<BeritaDetailPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* ==========================================
                RUTE TERPROTEKSI (Wajib Login: 'admin' atau 'user')
                - Role 'admin': Full CRUD
                - Role 'user' : Read-Only (melihat tabel, detail, pratinjau & unduh berkas)
            ========================================== */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/bahan-ajar" element={<BahanAjarPage />} />
              <Route path="/dashboard/akreditasi" element={<AkreditasiPage />} />
              <Route path="/dashboard/siswa" element={<SiswaPage />} />
              <Route path="/dashboard/siswa/:id" element={<SiswaDetailPage />} />
              <Route path="/dashboard/pernyataan-siswa" element={<PernyataanSiswaPage />} />
              <Route path="/dashboard/berita-prestasi" element={<BeritaAdminPage />} />
              <Route path="/dashboard/guru" element={<GuruPage />} />
              <Route path="/dashboard/sarana-prasarana" element={<SaranaPrasaranaPage />} />
              <Route path="/dashboard/alumni" element={<AlumniPage />} />
            </Route>

            {/* Fallback jika URL tidak ditemukan */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
