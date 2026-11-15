import React from 'react';

/**
 * Toolbar pencarian dan filter opsional di atas tabel data.
 * Dapat digunakan baik oleh Admin maupun User (Read-Only).
 */
export default function SearchToolbar({
  query,
  onQueryChange,
  placeholder = 'Cari data...',
  filters = [],
  totalCount = 0,
  filteredCount = 0,
  unitLabel = 'data',
  onReset
}) {
  const hasActiveFilter =
    Boolean(query.trim()) || filters.some((f) => f.value && f.value !== 'all');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4 transition-colors">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Kotak Input Pencarian */}
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 text-xs font-bold px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filter Tambahan */}
        {filters.map((filter) => (
          <select
            key={filter.key}
            aria-label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500"
          >
            <option value="all">{filter.allLabel}</option>
            {filter.options.map((opt) => {
              const optVal = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={optVal} value={optVal}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        ))}

        {/* Jumlah Hasil & Tombol Reset */}
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap pl-1">
          <span>
            Menampilkan <strong className="text-slate-800 dark:text-slate-200">{filteredCount}</strong> dari{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> {unitLabel}
          </span>
          {hasActiveFilter && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1 rounded-lg font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

