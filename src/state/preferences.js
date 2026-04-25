const PREFS_KEY = "charchaa.preferences.v1";
const BOOKMARK_KEY = "charchaa.bookmarks.v1";

const defaults = {
  theme: "light",
  compactMode: false,
  notifications: false
};

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getPreferences() {
  return {
    ...defaults,
    ...safeParse(localStorage.getItem(PREFS_KEY), {})
  };
}

export function savePreferences(value) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(value));
}

export function applyPreferences(prefs) {
  document.body.dataset.theme = prefs.theme;
  document.body.classList.toggle("compact", Boolean(prefs.compactMode));
}

export function getBookmarks() {
  const raw = safeParse(localStorage.getItem(BOOKMARK_KEY), []);
  return new Set(Array.isArray(raw) ? raw : []);
}

export function setBookmarks(bookmarksSet) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(Array.from(bookmarksSet)));
}

export function toggleBookmark(key) {
  const current = getBookmarks();
  if (current.has(key)) {
    current.delete(key);
  } else {
    current.add(key);
  }
  setBookmarks(current);
  return current;
}
