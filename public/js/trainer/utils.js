/**
 * Trainer Shared Utilities
 */

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatGermanGender(text) {
  if (!text || typeof text !== "string") return text || "";
  const safe = escapeHtml(text);
  return safe.replace(/\b(der|die|das)\b/gi, (match) => {
    const lower = match.toLowerCase();
    return `<span class="gender-${lower}">${match}</span>`;
  });
}

export function normalizeString(s) {
  if (!s || typeof s !== "string") return "";
  return s
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function safeGetItem(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val);
  } catch {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }
}

export function safeSetItem(key, value) {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, str);
  } catch {
    // ignore storage quota errors
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function insertCharIntoInput(input, char) {
  if (!input) return;
  const start = input.selectionStart != null ? input.selectionStart : input.value.length;
  const end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
  const val = input.value;
  input.value = val.slice(0, start) + char + val.slice(end);
  const newPos = start + char.length;
  input.focus();
  input.setSelectionRange(newPos, newPos);
}

export function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
