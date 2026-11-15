export const THEME_STORAGE_KEY = 'smpn2muting_theme';

export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function getStoredTheme(storage) {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return 'light';
    return normalizeTheme(store.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

export function applyThemeToDocument(theme, rootElement) {
  const next = normalizeTheme(theme);
  const root = rootElement ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!root) return next;

  root.classList.toggle('dark', next === 'dark');
  if (root.dataset) {
    root.dataset.theme = next;
  }
  return next;
}

