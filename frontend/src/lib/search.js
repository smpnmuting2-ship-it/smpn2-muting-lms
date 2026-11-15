/**
 * Pencarian multi-kata (tidak peka huruf besar/kecil).
 * Contoh: "matematika x" cocok jika semua kata ditemukan di salah satu kolom.
 */
export function matchesSearch(query, fields) {
  const trimmed = (query || '').trim().toLowerCase();
  if (!trimmed) return true;

  const haystack = fields
    .filter((f) => f !== null && f !== undefined)
    .map((f) => String(f).toLowerCase())
    .join(' ');

  const terms = trimmed.split(/\s+/);
  return terms.every((term) => haystack.includes(term));
}

export function getUniqueSorted(values) {
  return [...new Set(values.map((v) => (v || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'id')
  );
}

