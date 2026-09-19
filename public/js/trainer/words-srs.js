/**
 * Leitner Spaced Repetition System (SRS) for Words
 */
import { normalizeString, safeGetItem, safeSetItem } from "./utils.js";

export const SRS_STORAGE_KEY = "german-trainer-srs-v1";
export const SRS_ENABLED_KEY = "german-trainer-srs-enabled";
export const SMART_KEY = "german-trainer-smart-word";
export const CATS_KEY = "german-trainer-word-cats";
export const DIRS_KEY = "german-trainer-word-dirs";

export const LEVEL_INTERVALS = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14
};

export const LEVEL_NAMES = {
  1: "🌱 Уровень 1",
  2: "🌿 Уровень 2",
  3: "🌳 Уровень 3",
  4: "🌲 Уровень 4",
  5: "🏆 Уровень 5"
};

const DAY_MS = 24 * 60 * 60 * 1000;

export class WordsSRS {
  static normalize(s) {
    return normalizeString(s);
  }

  static getSRSStore() {
    return safeGetItem(SRS_STORAGE_KEY, {}) || {};
  }

  static saveSRSStore(store) {
    safeSetItem(SRS_STORAGE_KEY, store);
  }

  static getWordSRS(wordId, keyOrDir = "de2ru") {
    const store = WordsSRS.getSRSStore();
    const wordRecord = store[wordId];
    if (!wordRecord) {
      return { box: 1, nextReview: 0, lastReview: 0, totalReviews: 0, mistakes: 0 };
    }
    const cell = wordRecord[keyOrDir];
    if (!cell) {
      return { box: 1, nextReview: 0, lastReview: 0, totalReviews: 0, mistakes: 0 };
    }
    return cell;
  }

  static updateWordSRS(wordId, keyOrDir, isCorrect) {
    const store = WordsSRS.getSRSStore();
    if (!store[wordId]) store[wordId] = {};
    const current = store[wordId][keyOrDir] || {
      box: 1,
      nextReview: 0,
      lastReview: 0,
      totalReviews: 0,
      mistakes: 0
    };

    const now = Date.now();
    let newBox = current.box;

    if (isCorrect) {
      newBox = Math.min(5, current.box + 1);
    } else {
      newBox = 1;
    }

    const intervalDays = LEVEL_INTERVALS[newBox];
    const nextReview = now + intervalDays * DAY_MS;

    const updated = {
      box: newBox,
      nextReview,
      lastReview: now,
      totalReviews: (current.totalReviews || 0) + 1,
      mistakes: isCorrect ? current.mistakes || 0 : (current.mistakes || 0) + 1
    };

    store[wordId][keyOrDir] = updated;
    WordsSRS.saveSRSStore(store);

    return {
      prevBox: current.box,
      newBox,
      intervalDays,
      levelName: LEVEL_NAMES[newBox]
    };
  }

  static resetSRSProgress(categories, categoryId = null) {
    const store = WordsSRS.getSRSStore();
    if (!categoryId || categoryId === "all") {
      WordsSRS.saveSRSStore({});
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || !cat.words) return;

    for (const w of cat.words) {
      delete store[w.id];
    }
    WordsSRS.saveSRSStore(store);
  }

  static matchesAnyAlternative(userInput, correctText) {
    if (!userInput || !correctText) return false;
    const userNorm = WordsSRS.normalize(userInput);
    if (!userNorm) return false;

    const parts = correctText.split(/[/;,]/).map((p) => WordsSRS.normalize(p)).filter(Boolean);
    if (parts.includes(userNorm)) return true;

    // Check without articles (der/die/das/ein/eine)
    const stripArticle = (s) => s.replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\s+/i, "");
    const userNoArt = stripArticle(userNorm);

    for (const p of parts) {
      if (stripArticle(p) === userNoArt && userNoArt.length > 1) {
        return true;
      }
    }
    return false;
  }

  static getSelectedCategoryIds() {
    const boxes = document.querySelectorAll(".word-cat-cb:checked");
    return Array.from(boxes).map((b) => b.value);
  }

  static getDirs() {
    const boxes = document.querySelectorAll(".word-dir-cb:checked");
    const dirs = Array.from(boxes).map((b) => b.value);
    return dirs.length === 0 ? ["de2ru"] : dirs;
  }

  static getPool(categories) {
    const selectedIds = WordsSRS.getSelectedCategoryIds();
    const pool = [];
    categories.forEach((cat) => {
      if (selectedIds.includes(cat.id) && Array.isArray(cat.words)) {
        pool.push(...cat.words);
      }
    });
    return pool;
  }

  static saveCategoriesSelection() {
    safeSetItem(CATS_KEY, WordsSRS.getSelectedCategoryIds());
  }

  static loadCategoriesSelection() {
    return safeGetItem(CATS_KEY, null);
  }

  static saveDirs() {
    safeSetItem(DIRS_KEY, WordsSRS.getDirs());
  }

  static loadDirs() {
    const saved = safeGetItem(DIRS_KEY, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      document.querySelectorAll(".word-dir-cb").forEach((cb) => {
        cb.checked = saved.includes(cb.value);
      });
    }
  }

  static loadSmartEnabled() {
    return safeGetItem(SMART_KEY, false) === true;
  }

  static saveSmartEnabled(val) {
    safeSetItem(SMART_KEY, Boolean(val));
  }

  static loadSRSEnabled() {
    return safeGetItem(SRS_ENABLED_KEY, true) !== false;
  }

  static saveSRSEnabled(val) {
    safeSetItem(SRS_ENABLED_KEY, Boolean(val));
  }

  static pickWordPlain(pool, lastWordId) {
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    const filtered = pool.filter((w) => w.id !== lastWordId);
    const candidates = filtered.length > 0 ? filtered : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  static pickWordSRS(pool, dirs, lastWordId, isSmartEnabled = false) {
    if (pool.length === 0) return null;
    const now = Date.now();
    const allCards = [];

    for (const word of pool) {
      for (const dir of dirs) {
        if (dir === "ru2de") {
          allCards.push({ word, dir: "ru2de", formTarget: "singular", srsSubKey: "ru2de_sg" });
          if (word.plural && word.plural.trim()) {
            allCards.push({ word, dir: "ru2de", formTarget: "plural", srsSubKey: "ru2de_pl" });
          }
          if (word.feminine && word.feminine.trim()) {
            allCards.push({ word, dir: "ru2de", formTarget: "feminine", srsSubKey: "ru2de_fem" });
          }
          if (word.femininePlural && word.femininePlural.trim()) {
            allCards.push({ word, dir: "ru2de", formTarget: "femininePlural", srsSubKey: "ru2de_fem_pl" });
          }
        } else {
          allCards.push({ word, dir: "de2ru", formTarget: "base", srsSubKey: "de2ru" });
        }
      }
    }

    if (allCards.length === 0) return null;

    const overdue = [];
    const dueToday = [];
    const unlearned = [];
    const later = [];

    for (const card of allCards) {
      const srs = WordsSRS.getWordSRS(card.word.id, card.srsSubKey);
      card.srs = srs;
      if (!srs.lastReview) {
        unlearned.push(card);
      } else if (srs.nextReview <= now) {
        overdue.push(card);
      } else if (srs.nextReview <= now + DAY_MS) {
        dueToday.push(card);
      } else {
        later.push(card);
      }
    }

    const selectFrom = (candidates) => {
      if (candidates.length === 0) return null;
      if (candidates.length === 1) return candidates[0];
      const filtered = lastWordId ? candidates.filter((c) => c.word.id !== lastWordId) : candidates;
      const list = filtered.length > 0 ? filtered : candidates;
      return list[Math.floor(Math.random() * list.length)];
    };

    if (overdue.length > 0) return selectFrom(overdue);
    if (dueToday.length > 0) return selectFrom(dueToday);
    if (unlearned.length > 0) return selectFrom(unlearned);
    return selectFrom(later) || selectFrom(allCards);
  }
}
