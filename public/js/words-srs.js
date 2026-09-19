(function (global) {
  var SRS_DATA_KEY = "german-trainer-srs-v1";
  var CATS_KEY = "german-trainer-word-cats";
  var DIRS_KEY = "german-trainer-word-dirs";
  var SMART_KEY = "german-trainer-smart-word";
  var SRS_KEY = "german-trainer-srs-enabled";

  var LEVEL_INTERVALS = {
    1: 0,        // 🌱 Level 1: New / Today
    2: 1,        // 🌿 Level 2: Familiar (1 day)
    3: 3,        // 🌳 Level 3: Retained (3 days)
    4: 7,        // 🌲 Level 4: Confident (7 days)
    5: 14        // 🏆 Level 5: Mastered (14 days)
  };

  var LEVEL_NAMES = {
    1: "🌱 Новое / На повторении",
    2: "🌿 Знакомое",
    3: "🌳 Закреплено",
    4: "🌲 Уверенно",
    5: "🏆 Выучено!"
  };

  var DAY_MS = 24 * 60 * 60 * 1000;

  function normalize(s) {
    return s.trim().toLowerCase().replace(/ß/g, "ss");
  }

  function splitAlternatives(s) {
    return s.split("/").map(function (part) { return part.trim(); }).filter(Boolean);
  }

  function matchesAnyAlternative(userInput, correctText) {
    var alternatives = splitAlternatives(correctText);
    var normalizedInput = normalize(userInput);
    return alternatives.some(function (alt) { return normalize(alt) === normalizedInput; });
  }

  function getSRSStore() {
    try {
      var raw = localStorage.getItem(SRS_DATA_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveSRSStore(store) {
    try {
      localStorage.setItem(SRS_DATA_KEY, JSON.stringify(store));
    } catch (e) {}
  }

  function getWordSRS(wordId, keyOrDir) {
    var store = getSRSStore();
    var srsKey = keyOrDir && keyOrDir.indexOf(wordId) === 0 ? keyOrDir : (wordId + "_" + (keyOrDir || "de2ru"));
    var data = store[srsKey];
    if (!data && (keyOrDir === "ru2de_sg" || srsKey === wordId + "_ru2de_sg")) {
      data = store[wordId + "_ru2de"];
    }
    if (!data) {
      data = store[wordId];
    }
    return data || {
      box: 1,
      nextReview: 0,
      lastReviewed: 0,
      correctStreak: 0,
      totalAttempts: 0
    };
  }

  function updateWordSRS(wordId, keyOrDir, isCorrect) {
    var store = getSRSStore();
    var srsKey = keyOrDir && keyOrDir.indexOf(wordId) === 0 ? keyOrDir : (wordId + "_" + (keyOrDir || "de2ru"));
    var current = store[srsKey];
    if (!current && (keyOrDir === "ru2de_sg" || srsKey === wordId + "_ru2de_sg")) {
      current = store[wordId + "_ru2de"];
    }
    if (!current) {
      current = store[wordId];
    }
    current = current || {
      box: 1,
      nextReview: 0,
      lastReviewed: 0,
      correctStreak: 0,
      totalAttempts: 0
    };

    var now = Date.now();
    var oldBox = current.box || 1;
    var newBox = oldBox;

    if (isCorrect) {
      newBox = Math.min(5, oldBox + 1);
      current.correctStreak = (current.correctStreak || 0) + 1;
    } else {
      newBox = 1;
      current.correctStreak = 0;
    }

    current.box = newBox;
    current.lastReviewed = now;
    current.totalAttempts = (current.totalAttempts || 0) + 1;
    current.nextReview = now + (LEVEL_INTERVALS[newBox] * DAY_MS);

    store[srsKey] = current;
    saveSRSStore(store);

    return {
      oldBox: oldBox,
      newBox: newBox,
      levelName: LEVEL_NAMES[newBox],
      intervalDays: LEVEL_INTERVALS[newBox]
    };
  }

  function resetSRSProgress(categories, categoryId, onRender, onChanged) {
    var store = getSRSStore();
    if (categoryId) {
      categories.forEach(function (cat) {
        if (cat.id === categoryId) {
          cat.words.forEach(function (w) {
            delete store[w.id];
            delete store[w.id + "_de2ru"];
            delete store[w.id + "_ru2de"];
            delete store[w.id + "_ru2de_sg"];
            delete store[w.id + "_ru2de_pl"];
            delete store[w.id + "_ru2de_fem"];
            delete store[w.id + "_ru2de_fem_pl"];
          });
        }
      });
    } else {
      store = {};
    }
    saveSRSStore(store);
    if (typeof onRender === "function") onRender();
    if (typeof onChanged === "function") onChanged();
  }

  function getSelectedCategoryIds() {
    var boxes = document.querySelectorAll(".word-cat-cb:checked");
    var ids = [];
    boxes.forEach(function (b) { ids.push(b.value); });
    return ids;
  }

  function getDirs() {
    var boxes = document.querySelectorAll(".word-dir-cb:checked");
    var dirs = [];
    boxes.forEach(function (b) { dirs.push(b.value); });
    if (dirs.length === 0) dirs = ["de2ru"];
    return dirs;
  }

  function getPool(categories) {
    var ids = getSelectedCategoryIds();
    var pool = [];
    categories.forEach(function (cat) {
      if (ids.indexOf(cat.id) !== -1) {
        cat.words.forEach(function (w) { pool.push(w); });
      }
    });
    return pool;
  }

  function saveCategoriesSelection() {
    try {
      localStorage.setItem(CATS_KEY, JSON.stringify(getSelectedCategoryIds()));
    } catch (e) {}
  }

  function loadCategoriesSelection() {
    try {
      var raw = localStorage.getItem(CATS_KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      return Array.isArray(saved) ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function saveDirs() {
    try {
      localStorage.setItem(DIRS_KEY, JSON.stringify(getDirs()));
    } catch (e) {}
  }

  function loadDirs() {
    try {
      var raw = localStorage.getItem(DIRS_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved)) {
        document.querySelectorAll(".word-dir-cb").forEach(function (cb) {
          cb.checked = saved.indexOf(cb.value) !== -1;
        });
      }
    } catch (e) {}
  }

  function loadSmartEnabled() {
    try { return localStorage.getItem(SMART_KEY) === "1"; } catch (e) { return false; }
  }

  function saveSmartEnabled(val) {
    try { localStorage.setItem(SMART_KEY, val ? "1" : "0"); } catch (e) {}
  }

  function loadSRSEnabled() {
    try { return localStorage.getItem(SRS_KEY) !== "0"; } catch (e) { return true; }
  }

  function saveSRSEnabled(val) {
    try { localStorage.setItem(SRS_KEY, val ? "1" : "0"); } catch (e) {}
  }

  function pickWordPlain(pool, lastWordId) {
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    var filtered = pool.filter(function (w) { return w.id !== lastWordId; });
    var candidates = filtered.length > 0 ? filtered : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function getSRSBaseWeight(box) {
    switch (box) {
      case 1: return 16;
      case 2: return 8;
      case 3: return 4;
      case 4: return 2;
      case 5: return 1;
      default: return 16;
    }
  }

  function pickWordSRS(pool, dirs, lastWordId, isSmartEnabled) {
    if (pool.length === 0 || dirs.length === 0) return null;
    var now = Date.now();

    var cards = [];
    pool.forEach(function (w) {
      if (dirs.indexOf("de2ru") !== -1) {
        cards.push({
          word: w,
          dir: "de2ru",
          formTarget: "base",
          srsSubKey: "de2ru",
          srs: getWordSRS(w.id, "de2ru")
        });
      }
      if (dirs.indexOf("ru2de") !== -1) {
        cards.push({
          word: w,
          dir: "ru2de",
          formTarget: "base",
          srsSubKey: "ru2de_sg",
          srs: getWordSRS(w.id, "ru2de_sg")
        });

        if (w.plural && w.plural.trim()) {
          cards.push({
            word: w,
            dir: "ru2de",
            formTarget: "plural",
            srsSubKey: "ru2de_pl",
            srs: getWordSRS(w.id, "ru2de_pl")
          });
        }
        if (w.feminine && w.feminine.trim()) {
          cards.push({
            word: w,
            dir: "ru2de",
            formTarget: "feminine",
            srsSubKey: "ru2de_fem",
            srs: getWordSRS(w.id, "ru2de_fem")
          });
        }
        if (w.femininePlural && w.femininePlural.trim()) {
          cards.push({
            word: w,
            dir: "ru2de",
            formTarget: "femininePlural",
            srsSubKey: "ru2de_fem_pl",
            srs: getWordSRS(w.id, "ru2de_fem_pl")
          });
        }
      }
    });

    if (cards.length === 0) return null;

    var overdueCards = [];
    var pendingCards = [];

    cards.forEach(function (card) {
      if (!isSmartEnabled || card.srs.nextReview <= now) {
        overdueCards.push(card);
      } else {
        pendingCards.push(card);
      }
    });

    var targetList = overdueCards.length > 0 ? overdueCards : pendingCards;

    if (targetList.length > 1) {
      targetList = targetList.filter(function (c) { return c.word.id !== lastWordId; });
      if (targetList.length === 0) {
        targetList = overdueCards.length > 0 ? overdueCards : pendingCards;
      }
    }

    var totalWeight = 0;
    var weighted = targetList.map(function (card) {
      var w = getSRSBaseWeight(card.srs.box);
      totalWeight += w;
      return { card: card, cumulative: totalWeight };
    });

    var r = Math.random() * totalWeight;
    for (var i = 0; i < weighted.length; i++) {
      if (r <= weighted[i].cumulative) {
        return weighted[i].card;
      }
    }
    return targetList[0];
  }

  global.WordsSRS = {
    normalize: normalize,
    matchesAnyAlternative: matchesAnyAlternative,
    getWordSRS: getWordSRS,
    updateWordSRS: updateWordSRS,
    resetSRSProgress: resetSRSProgress,
    getSelectedCategoryIds: getSelectedCategoryIds,
    getDirs: getDirs,
    getPool: getPool,
    saveCategoriesSelection: saveCategoriesSelection,
    loadCategoriesSelection: loadCategoriesSelection,
    saveDirs: saveDirs,
    loadDirs: loadDirs,
    loadSmartEnabled: loadSmartEnabled,
    saveSmartEnabled: saveSmartEnabled,
    loadSRSEnabled: loadSRSEnabled,
    saveSRSEnabled: saveSRSEnabled,
    pickWordPlain: pickWordPlain,
    pickWordSRS: pickWordSRS,
    LEVEL_INTERVALS: LEVEL_INTERVALS,
    LEVEL_NAMES: LEVEL_NAMES
  };
})(window);
