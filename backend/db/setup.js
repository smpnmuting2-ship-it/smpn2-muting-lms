/**
 * Menyiapkan database PostgreSQL lokal: npm run db:setup
 * 1. Membuat database (mis. smpn2_muting) jika belum ada
 * 2. Membuat/memperbarui tabel & kolom baru (db/schema_local.sql)
 * 3. Mengisi data contoh untuk tabel yang masih kosong (db/seed_local.sql)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL belum diisi di backend/.env');
  }

  const target = new URL(dbUrl);
  const dbName = target.pathname.replace(/^\//, '');
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(`Nama database tidak valid: "${dbName}"`);
  }

  // 1. Buat database lewat database bawaan "postgres"
  const adminUrl = new URL(dbUrl);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${dbName}`);
    console.log(`✓ Database "${dbName}" dibuat`);
  } else {
    console.log(`✓ Database "${dbName}" sudah ada`);
  }
  await admin.end();

  // 2 & 3. Buat/migrasi tabel dan isi data contoh pada tabel yang masih kosong
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, 'schema_local.sql'), 'utf8'));
  console.log('✓ Seluruh tabel siap (termasuk berita_prestasi, guru, sarana_prasarana, alumni & berkas siswa)');

  await client.query(fs.readFileSync(path.join(__dirname, 'seed_local.sql'), 'utf8'));
  console.log('✓ Data contoh pada tabel yang kosong siap');
  await client.end();
}

main().catch((err) => {
  console.error('✗ Gagal menyiapkan database:', err.message);
  process.exit(1);
});
