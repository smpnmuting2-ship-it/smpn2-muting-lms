import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-700 dark:border-cyan-400 mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Memverifikasi sesi akses...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, arahkan ke halaman /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika role dibatasi untuk rute tertentu
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

