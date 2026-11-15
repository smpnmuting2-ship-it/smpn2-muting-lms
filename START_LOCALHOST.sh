#!/bin/bash
echo "=========================================================="
echo " Menjalankan Sistem Manajemen SMPN 2 Muting (Local)"
echo "=========================================================="

cd "$(dirname "$0")"

echo "[1/3] Memastikan database PostgreSQL lokal siap..."
(cd backend && npm run db:setup) || exit 1

echo "[2/3] Menyalakan Backend Express di http://localhost:5001 ..."
(cd backend && npm start) &
BACKEND_PID=$!

echo "[3/3] Menyalakan Frontend React (Vite) di http://localhost:5174 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

