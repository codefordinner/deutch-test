(function () {
  var SMART_KEY = "german-trainer-smart-word";
  var SRS_KEY = "german-trainer-srs-enabled";
  var SRS_DATA_KEY = "german-trainer-srs-v1";
  var CATS_KEY = "german-trainer-word-cats";
  var DIRS_KEY = "german-trainer-word-dirs";

  var categories = [];

  // Leitner SRS Levels & Intervals in Days
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

  // ===== SRS / LEITNER SYSTEM ENGINE (DIRECTIONAL) =====

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

  // Retrieve SRS stats specifically for (wordId + direction/subKey)
  // Sub-keys: "de2ru", "ru2de_sg" (singular), "ru2de_pl" (plural), or legacy "ru2de"
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

  function resetSRSProgress(categoryId) {
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
          });
        }
      });
    } else {
      store = {};
    }
    saveSRSStore(store);
    renderCategoryProgress();
    onSettingsChanged();
  }

  // ===== CATEGORY & SETTINGS PERSISTENCE =====

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

  function getPool() {
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

  function renderCategoryCheckboxes() {
    var row = document.getElementById("word-categories-row");
    row.innerHTML = "";
    if (categories.length === 0) {
      row.innerHTML = '<span class="empty-note" style="padding:0;">Пока нет слов — добавь их в <a href="/admin.html">админ-панели</a></span>';
      return;
    }
    var savedCats = loadCategoriesSelection();
    categories.forEach(function (cat) {
      var label = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "word-cat-cb";
      cb.value = cat.id;
      cb.checked = savedCats === null ? true : savedCats.indexOf(cat.id) !== -1;
      cb.addEventListener("change", onSettingsChanged);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + cat.name + " (" + cat.words.length + ")"));
      row.appendChild(label);
    });
  }

  function setQuizEnabled(enabled) {
    var area = document.getElementById("word-quiz-area");
    area.style.opacity = enabled ? "1" : "0.4";
    area.style.pointerEvents = enabled ? "auto" : "none";
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

    // Create list of all active Leitner flashcards (directional & form-specific)
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
        // Singular card (одинина / единственное число)
        cards.push({
          word: w,
          dir: "ru2de",
          formTarget: "singular",
          srsSubKey: "ru2de_sg",
          srs: getWordSRS(w.id, "ru2de_sg")
        });
        // Plural card (множественное число, если оно есть)
        if (w.plural && w.plural.trim()) {
          cards.push({
            word: w,
            dir: "ru2de",
            formTarget: "plural",
            srsSubKey: "ru2de_pl",
            srs: getWordSRS(w.id, "ru2de_pl")
          });
        }
      }
    });

    if (cards.length === 0) return null;

    // Find cards due for review today
    var dueCards = cards.filter(function (c) {
      return c.srs.nextReview <= now;
    });

    var mistakeWeights = isSmartEnabled ? QuizEngine.getWeights("word") : {};

    function calculateCardWeight(c) {
      var box = Math.min(5, Math.max(1, c.srs.box || 1));
      var srsWeight = getSRSBaseWeight(box);
      var wid = c.formTarget === "plural" ? c.word.id + "_pl" : c.word.id;
      var mistakes = mistakeWeights[wid] || mistakeWeights[c.word.id] || 0;
      var mistakeMultiplier = 1 + (mistakes * 2);
      return srsWeight * mistakeMultiplier;
    }

    if (dueCards.length > 0) {
      var candidatesDue = dueCards;
      if (lastWordId && dueCards.length > 1) {
        var filteredDue = dueCards.filter(function (c) { return c.word.id !== lastWordId; });
        if (filteredDue.length > 0) candidatesDue = filteredDue;
      }

      var totalWDue = 0;
      var weightedDue = candidatesDue.map(function (c) {
        var w = calculateCardWeight(c);
        totalWDue += w;
        return { card: c, w: w };
      });

      var rDue = Math.random() * totalWDue;
      for (var i = 0; i < weightedDue.length; i++) {
        rDue -= weightedDue[i].w;
        if (rDue <= 0) return weightedDue[i].card;
      }
      return weightedDue[weightedDue.length - 1].card;
    }

    // All scheduled reviews done for today!
    // 50% probability: Completely random uniform pick across all pool cards
    // 50% probability: Weighted pick by weakness (SRS level weight * mistake multiplier)
    var candidatesPool = cards;
    if (lastWordId && cards.length > 1) {
      var filteredPool = cards.filter(function (c) { return c.word.id !== lastWordId; });
      if (filteredPool.length > 0) candidatesPool = filteredPool;
    }

    var isUniformRandom = Math.random() < 0.50;

    if (isUniformRandom) {
      var randomIndex = Math.floor(Math.random() * candidatesPool.length);
      return candidatesPool[randomIndex];
    } else {
      var totalWAll = 0;
      var weightedAll = candidatesPool.map(function (c) {
        var w = calculateCardWeight(c);
        totalWAll += w;
        return { card: c, w: w };
      });

      var rAll = Math.random() * totalWAll;
      for (var j = 0; j < weightedAll.length; j++) {
        rAll -= weightedAll[j].w;
        if (rAll <= 0) return weightedAll[j].card;
      }
      return weightedAll[weightedAll.length - 1].card;
    }
  }

  function extractGermanArticle(text) {
    if (!text) return null;
    var firstAlt = text.split("/")[0].trim();
    var match = firstAlt.match(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\b/i);
    return match ? match[1] : null;
  }

  function wordId(w) { return w.id; }

  loadDirs();

  var smartCb = document.getElementById("word-smart-cb");
  if (smartCb) smartCb.checked = loadSmartEnabled();

  var srsCb = document.getElementById("word-srs-cb");
  if (srsCb) srsCb.checked = loadSRSEnabled();

  var quiz = QuizEngine.create({
    prefix: "word",

    pickNext: function (state) {
      var pool = getPool();
      if (pool.length === 0) return null;
      var dirs = getDirs();
      var lastWordId = state.current ? state.current.word.id : null;
      var wordObj, dir, formTarget, srsSubKey;

      var isSRS = srsCb && srsCb.checked;
      var isSmart = smartCb && smartCb.checked;

      if (isSRS) {
        var srsCard = pickWordSRS(pool, dirs, lastWordId, isSmart);
        if (!srsCard) return null;
        wordObj = srsCard.word;
        dir = srsCard.dir;
        formTarget = srsCard.formTarget;
        srsSubKey = srsCard.srsSubKey;
      } else if (isSmart) {
        wordObj = QuizEngine.weightedPick(pool, wordId, QuizEngine.getWeights("word"), lastWordId);
        dir = dirs[Math.floor(Math.random() * dirs.length)];
        if (dir === "ru2de") {
          formTarget = (wordObj.plural && wordObj.plural.trim() && Math.random() < 0.5) ? "plural" : "singular";
        } else {
          formTarget = "base";
        }
        srsSubKey = dir === "ru2de" ? (formTarget === "plural" ? "ru2de_pl" : "ru2de_sg") : "de2ru";
      } else {
        wordObj = pickWordPlain(pool, lastWordId);
        dir = dirs[Math.floor(Math.random() * dirs.length)];
        if (dir === "ru2de") {
          formTarget = (wordObj.plural && wordObj.plural.trim() && Math.random() < 0.5) ? "plural" : "singular";
        } else {
          formTarget = "base";
        }
        srsSubKey = dir === "ru2de" ? (formTarget === "plural" ? "ru2de_pl" : "ru2de_sg") : "de2ru";
      }

      return { word: wordObj, dir: dir, formTarget: formTarget, srsSubKey: srsSubKey, isSRS: isSRS };
    },

    render: function (current, elements) {
      var srsBadge = "";
      if (current.isSRS) {
        var srs = getWordSRS(current.word.id, current.srsSubKey || current.dir);
        var isDue = srs.nextReview <= Date.now();
        var lvlName = LEVEL_NAMES[srs.box || 1];
        srsBadge = ' <span style="font-size: 12px; font-weight: normal; opacity: 0.9;">' +
                   (isDue ? '[' + lvlName + ']' : '[✔ Повторный просмотр]') + '</span>';
      }

      if (current.dir === "de2ru") {
        elements.modeEl.innerHTML = "Немецкий → русский" + srsBadge;
        var qHtml = QuizEngine.formatGermanGender(current.word.de);
        if (current.word.plural || current.word.feminine) {
          qHtml += '<div class="question-forms">';
          if (current.word.plural) {
            qHtml += '<span class="form-badge plural-badge" title="Множественное число">мн. ч.: ' + QuizEngine.formatGermanGender(current.word.plural) + '</span>';
          }
          if (current.word.feminine) {
            qHtml += '<span class="form-badge fem-badge" title="Женский род">ж. р.: ' + QuizEngine.formatGermanGender(current.word.feminine) + '</span>';
          }
          qHtml += '</div>';
        }
        elements.qEl.innerHTML = qHtml;
        elements.ansEl.placeholder = "Перевод на русский";
      } else {
        var instructionHtml = "";
        var placeholder = "По-немецки";

        if (current.formTarget === "plural") {
          instructionHtml = '<div class="form-instruction plural-instruction">' +
            '👉 Введите форму <b>множественного числа</b>' +
            '</div>';
          placeholder = "Множественное число";
        } else if (current.word.plural && current.word.plural.trim()) {
          instructionHtml = '<div class="form-instruction singular-instruction">' +
            '👉 Введите форму <b>единственного числа</b>' +
            '</div>';
          placeholder = "Единственное число";
        }

        elements.modeEl.innerHTML = "Русский → немецкий" + srsBadge;
        elements.qEl.innerHTML = '<div style="font-size: 26px; font-weight: 600;">' + current.word.ru + '</div>' + instructionHtml;
        elements.ansEl.placeholder = placeholder;
      }
    },

    checkAnswer: function (userVal, current) {
      var isCorrect = false;
      var correctText = "";
      var extraFeedback = "";

      if (current.dir === "de2ru") {
        correctText = current.word.ru;
        isCorrect = matchesAnyAlternative(userVal, correctText);
      } else {
        if (current.formTarget === "plural") {
          correctText = current.word.plural;
          isCorrect = matchesAnyAlternative(userVal, current.word.plural);
          if (!isCorrect && matchesAnyAlternative(userVal, current.word.de)) {
            extraFeedback = "💡 Вы ввели единственное число (<b>" + current.word.de + "</b>), а требовалось множественное: <b>" + current.word.plural + "</b>";
          }
        } else {
          correctText = current.word.de;
          isCorrect = matchesAnyAlternative(userVal, current.word.de);
          if (!isCorrect && current.word.plural && matchesAnyAlternative(userVal, current.word.plural)) {
            extraFeedback = "💡 Вы ввели множественное число (<b>" + current.word.plural + "</b>), а требовалось единственное: <b>" + current.word.de + "</b>";
          }
        }
      }

      var extraNote = "";
      if (current.dir === "ru2de") {
        if (current.formTarget === "plural") {
          extraNote = " (ед. ч.: " + current.word.de + ")";
        } else if (current.word.plural || current.word.feminine) {
          var forms = [];
          if (current.word.plural) forms.push("мн: " + current.word.plural);
          if (current.word.feminine) forms.push("ж: " + current.word.feminine);
          extraNote = " (" + forms.join(", ") + ")";
        }
      } else if (current.word.plural || current.word.feminine) {
        var formsAll = [];
        if (current.word.plural) formsAll.push("мн: " + current.word.plural);
        if (current.word.feminine) formsAll.push("ж: " + current.word.feminine);
        extraNote = " (" + formsAll.join(", ") + ")";
      }

      var srsInfo = null;
      if (srsCb && srsCb.checked) {
        srsInfo = updateWordSRS(current.word.id, current.srsSubKey || current.dir, isCorrect);
        renderCategoryProgress();
      }

      return {
        isCorrect: isCorrect,
        correctText: correctText + extraNote,
        extraFeedback: extraFeedback,
        srsInfo: srsInfo
      };
    },

    weightId: function (current) {
      if (current.dir === "ru2de" && current.formTarget === "plural") {
        return current.word.id + "_pl";
      }
      return current.word.id;
    },

    onEmpty: function () {
      setQuizEnabled(false);
    }
  });

  function onSettingsChanged() {
    saveCategoriesSelection();
    saveDirs();
    var pool = getPool();
    if (pool.length === 0) {
      setQuizEnabled(false);
      document.getElementById("word-question").textContent = "—";
      document.getElementById("word-qmode").textContent = "Выбери хотя бы одну категорию со словами";
      renderCategoryProgress();
      return;
    }
    setQuizEnabled(true);
    quiz.newQuestion(true);
    renderCategoryProgress();
  }

  // ===== CATEGORY PROGRESS DASHBOARD RENDERER (DIRECTIONAL) =====

  function renderCategoryProgress() {
    var container = document.getElementById("category-progress-container");
    var statusBadge = document.getElementById("srs-status-badge");
    if (!container) return;

    if (categories.length === 0) {
      container.innerHTML = '<p class="empty-note" style="padding:0;">Категорий пока нет</p>';
      if (statusBadge) statusBadge.textContent = "—";
      return;
    }

    var store = getSRSStore();
    var now = Date.now();
    var totalCardsAll = 0;
    var totalDueAll = 0;

    var html = "";

    categories.forEach(function (cat) {
      var catWords = cat.words || [];
      var totalCards = 0;
      var levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      var dueCount = 0;

      catWords.forEach(function (w) {
        var subKeys = ["de2ru", "ru2de_sg"];
        if (w.plural && w.plural.trim()) {
          subKeys.push("ru2de_pl");
        }
        totalCards += subKeys.length;

        subKeys.forEach(function (sub) {
          var srs = getWordSRS(w.id, sub);
          var lvl = Math.min(5, Math.max(1, srs.box || 1));
          levels[lvl] = (levels[lvl] || 0) + 1;

          if (srs.nextReview <= now) {
            dueCount++;
          }
        });
      });

      totalCardsAll += totalCards;
      totalDueAll += dueCount;
      var mastered = levels[5];
      var percent = totalCards === 0 ? 0 : Math.round((mastered / totalCards) * 100);

      html += '<div style="background: var(--surface); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">';
      html += '  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">';
      html += '    <div>';
      html += '      <span style="font-weight: 600; font-size: 14px;">' + cat.name + '</span>';
      html += '      <span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">(' + catWords.length + ' слов / ' + totalCards + ' карточек)</span>';
      html += '    </div>';
      html += '    <div style="display: flex; align-items: center; gap: 8px;">';
      html += '      <span style="font-size: 12px; color: var(--primary); font-weight: 600;">Освоено: ' + percent + '% (' + mastered + '/' + totalCards + ')</span>';
      html += '      <button type="button" class="small-btn ghost-btn js-reset-cat-srs" data-cat-id="' + cat.id + '" style="padding: 2px 8px; font-size: 11px;">Сбросить</button>';
      html += '    </div>';
      html += '  </div>';

      // Visual Progress bar
      html += '  <div style="height: 10px; background: var(--bg); border-radius: 5px; overflow: hidden; margin-bottom: 10px; display: flex;">';
      var colors = ["#e03131", "#ff922b", "#fcc419", "#51cf66", "#20c997"];
      for (var lvl = 1; lvl <= 5; lvl++) {
        var widthPct = totalCards === 0 ? 0 : (levels[lvl] / totalCards) * 100;
        if (widthPct > 0) {
          html += '<div style="width: ' + widthPct + '%; background: ' + colors[lvl - 1] + ';" title="' + LEVEL_NAMES[lvl] + ': ' + levels[lvl] + ' карточек"></div>';
        }
      }
      html += '  </div>';

      // Level Badges
      html += '  <div style="display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px;">';
      html += '    <span style="background: rgba(224, 49, 49, 0.15); color: #e03131; padding: 2px 6px; border-radius: 4px;">🌱 Новое: ' + levels[1] + '</span>';
      html += '    <span style="background: rgba(255, 146, 43, 0.15); color: #d9480f; padding: 2px 6px; border-radius: 4px;">🌿 Знакомое: ' + levels[2] + '</span>';
      html += '    <span style="background: rgba(252, 196, 25, 0.15); color: #f59f00; padding: 2px 6px; border-radius: 4px;">🌳 Закреплено: ' + levels[3] + '</span>';
      html += '    <span style="background: rgba(81, 207, 102, 0.15); color: #2b8a3e; padding: 2px 6px; border-radius: 4px;">🌲 Уверенно: ' + levels[4] + '</span>';
      html += '    <span style="background: rgba(32, 201, 151, 0.15); color: #099268; padding: 2px 6px; border-radius: 4px; font-weight: 600;">🏆 Выучено: ' + levels[5] + '</span>';
      if (dueCount > 0) {
        html += '    <span style="background: var(--primary); color: #fff; padding: 2px 6px; border-radius: 4px; margin-left: auto; font-weight: 600;">К повторению: ' + dueCount + '</span>';
      } else {
        html += '    <span style="background: var(--border); color: var(--text-dim); padding: 2px 6px; border-radius: 4px; margin-left: auto;">Всё повторено 🎉</span>';
      }
      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;

    if (statusBadge) {
      if (totalDueAll > 0) {
        statusBadge.textContent = "🔔 На сегодня к повторению: " + totalDueAll + " карточек";
        statusBadge.style.background = "rgba(255, 146, 43, 0.2)";
        statusBadge.style.color = "#d9480f";
      } else {
        statusBadge.textContent = "✨ Все карточки повторены!";
        statusBadge.style.background = "rgba(32, 201, 151, 0.2)";
        statusBadge.style.color = "#099268";
      }
    }

    // Attach category reset buttons
    container.querySelectorAll(".js-reset-cat-srs").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var catId = btn.getAttribute("data-cat-id");
        if (confirm("Сбросить прогресс запоминания для этой категории? Все карточки вернутся на Уровень 1 (Новое).")) {
          resetSRSProgress(catId);
        }
      });
    });
  }

  function loadCategories() {
    var getCategories = window.ApiClient ? window.ApiClient.get("/api/categories") : fetch("/api/categories").then(function (r) { return r.json(); });
    getCategories
      .then(function (data) {
        categories = data;
        renderCategoryCheckboxes();
        populateDictCategories();
        renderDictionaryTable();
        onSettingsChanged();
      })
      .catch(function () {
        document.getElementById("word-categories-row").innerHTML =
          '<span class="empty-note" style="padding:0;">Не удалось загрузить слова с сервера</span>';
      });
  }

  // ===== DICTIONARY BROWSER & FILTERING ENGINE =====

  var dictSearchInput = document.getElementById("dict-search-input");
  var dictCatSelect = document.getElementById("dict-cat-select");
  var dictLevelSelect = document.getElementById("dict-level-select");
  var dictTbody = document.getElementById("dict-tbody");
  var dictCountBadge = document.getElementById("dict-count-badge");

  function populateDictCategories() {
    if (!dictCatSelect) return;
    dictCatSelect.innerHTML = '<option value="__ALL__">Все категории</option>';
    categories.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name + " (" + cat.words.length + ")";
      dictCatSelect.appendChild(opt);
    });
  }

  function renderDictionaryTable() {
    if (!dictTbody) return;

    var searchQuery = dictSearchInput ? dictSearchInput.value.trim().toLowerCase() : "";
    var selectedCatId = dictCatSelect ? dictCatSelect.value : "__ALL__";
    var selectedLevel = dictLevelSelect ? dictLevelSelect.value : "__ALL__";

    var filteredList = [];

    categories.forEach(function (cat) {
      if (selectedCatId !== "__ALL__" && cat.id !== selectedCatId) return;

      cat.words.forEach(function (w) {
        // Check search query match
        var deMatch = w.de.toLowerCase().indexOf(searchQuery) !== -1;
        var ruMatch = w.ru.toLowerCase().indexOf(searchQuery) !== -1;
        var plMatch = w.plural && w.plural.toLowerCase().indexOf(searchQuery) !== -1;
        var femMatch = w.feminine && w.feminine.toLowerCase().indexOf(searchQuery) !== -1;
        if (searchQuery && !deMatch && !ruMatch && !plMatch && !femMatch) return;

        // Get SRS levels for all directions
        var srsDe2Ru = getWordSRS(w.id, "de2ru");
        var srsRu2DeSg = getWordSRS(w.id, "ru2de_sg");
        var srsRu2DePl = (w.plural && w.plural.trim()) ? getWordSRS(w.id, "ru2de_pl") : null;

        var lvlDe2Ru = Math.min(5, Math.max(1, srsDe2Ru.box || 1));
        var lvlRu2DeSg = Math.min(5, Math.max(1, srsRu2DeSg.box || 1));
        var lvlRu2DePl = srsRu2DePl ? Math.min(5, Math.max(1, srsRu2DePl.box || 1)) : null;

        // Filter by SRS level if selected
        if (selectedLevel !== "__ALL__") {
          var targetLvl = parseInt(selectedLevel, 10);
          var matchesLvl = (lvlDe2Ru === targetLvl || lvlRu2DeSg === targetLvl || (lvlRu2DePl !== null && lvlRu2DePl === targetLvl));
          if (!matchesLvl) return;
        }

        filteredList.push({
          word: w,
          categoryName: cat.name,
          lvlDe2Ru: lvlDe2Ru,
          lvlRu2DeSg: lvlRu2DeSg,
          lvlRu2DePl: lvlRu2DePl
        });
      });
    });

    if (dictCountBadge) {
      dictCountBadge.textContent = filteredList.length + " слов";
    }

    if (filteredList.length === 0) {
      dictTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-dim);">Слова не найдены по запросу</td></tr>';
      return;
    }

    var levelBadges = {
      1: '<span style="color:#e03131;">🌱 L1</span>',
      2: '<span style="color:#d9480f;">🌿 L2</span>',
      3: '<span style="color:#f59f00;">🌳 L3</span>',
      4: '<span style="color:#2b8a3e;">🌲 L4</span>',
      5: '<span style="color:#099268; font-weight:600;">🏆 L5</span>'
    };

    var html = "";
    filteredList.forEach(function (item) {
      var formattedDe = '<div style="font-weight: 500;">' + QuizEngine.formatGermanGender(item.word.de) + '</div>';
      if (item.word.plural || item.word.feminine) {
        formattedDe += '<div class="word-extra-forms">';
        if (item.word.plural) {
          formattedDe += '<span class="form-badge plural-badge" title="Множественное число">мн: ' + QuizEngine.formatGermanGender(item.word.plural) + '</span>';
        }
        if (item.word.feminine) {
          formattedDe += '<span class="form-badge fem-badge" title="Женский род">ж: ' + QuizEngine.formatGermanGender(item.word.feminine) + '</span>';
        }
        formattedDe += '</div>';
      }

      var srsHtml = '<span title="Немецкий → Русский">' + levelBadges[item.lvlDe2Ru] + ' (DE)</span> / ' +
                    '<span title="Русский → Немецкий (ед. ч.)">' + levelBadges[item.lvlRu2DeSg] + ' (RU ед.)</span>';
      if (item.lvlRu2DePl !== null) {
        srsHtml += ' / <span title="Русский → Немецкий (мн. ч.)">' + levelBadges[item.lvlRu2DePl] + ' (RU мн.)</span>';
      }

      html += '<tr style="border-bottom: 1px solid var(--border);">';
      html += '  <td style="padding: 10px 12px;">' + formattedDe + '</td>';
      html += '  <td style="padding: 10px 12px; color: var(--text-primary);">' + item.word.ru + '</td>';
      html += '  <td style="padding: 10px 12px; font-size: 12px; color: var(--text-secondary);">' + item.categoryName + '</td>';
      html += '  <td style="padding: 10px 12px; text-align: right; font-size: 12px; white-space: nowrap;">' + srsHtml + '</td>';
      html += '</tr>';
    });

    dictTbody.innerHTML = html;
  }

  if (dictSearchInput) dictSearchInput.addEventListener("input", renderDictionaryTable);
  if (dictCatSelect) dictCatSelect.addEventListener("change", renderDictionaryTable);
  if (dictLevelSelect) dictLevelSelect.addEventListener("change", renderDictionaryTable);

  document.querySelectorAll(".word-dir-cb").forEach(function (cb) {
    cb.addEventListener("change", onSettingsChanged);
  });

  if (smartCb) {
    smartCb.addEventListener("change", function () {
      saveSmartEnabled(smartCb.checked);
      onSettingsChanged();
    });
  }

  if (srsCb) {
    srsCb.addEventListener("change", function () {
      saveSRSEnabled(srsCb.checked);
      onSettingsChanged();
    });
  }

  var srsResetBtn = document.getElementById("word-srs-reset-btn");
  if (srsResetBtn) {
    srsResetBtn.addEventListener("click", function () {
      if (!confirm("Сбросить весь прогресс запоминания (все категории)? Все карточки вернутся на Уровень 1 (Новое).")) return;
      resetSRSProgress(null);
    });
  }

  var wordWeightsResetBtn = document.getElementById("word-weights-reset-btn");
  if (wordWeightsResetBtn) {
    wordWeightsResetBtn.addEventListener("click", function () {
      if (!confirm("Сбросить статистику ошибок для слов? Умный подбор начнёт заново.")) return;
      QuizEngine.resetWeights("word");
      onSettingsChanged();
    });
  }

  var wordHintBtn = document.getElementById("word-hint-btn");
  if (wordHintBtn) {
    wordHintBtn.addEventListener("click", function () {
      if (!quiz.state.current) return;
      var current = quiz.state.current;
      var correctText = "";
      if (current.dir === "de2ru") {
        correctText = current.word.ru;
      } else if (current.formTarget === "plural") {
        correctText = current.word.plural || current.word.de;
      } else {
        correctText = current.word.de;
      }
      var ansEl = document.getElementById("word-answer");
      if (!ansEl) return;

      var firstTarget = correctText.split("/")[0].trim();

      if (current.dir === "ru2de") {
        var article = extractGermanArticle(firstTarget);
        if (article) {
          var valLower = ansEl.value.trim().toLowerCase();
          var artLower = article.toLowerCase();
          if (valLower !== artLower && !valLower.startsWith(artLower + " ")) {
            ansEl.value = article + " ";
            ansEl.focus();
            return;
          }
        }
      }

      var val = ansEl.value;
      var matchLen = 0;
      for (var i = 0; i < val.length && i < firstTarget.length; i++) {
        if (val[i].toLowerCase() === firstTarget[i].toLowerCase()) {
          matchLen++;
        } else {
          break;
        }
      }

      if (matchLen < firstTarget.length) {
        ansEl.value = firstTarget.slice(0, matchLen + 1);
      } else {
        ansEl.value = firstTarget;
      }
      ansEl.focus();
    });
  }

  // ===== SRS INFO MODAL EVENT HANDLERS =====
  var srsInfoBtn = document.getElementById("srs-info-btn");
  var srsInfoModal = document.getElementById("srs-info-modal");
  var closeSrsInfoBtn = document.getElementById("close-srs-info-btn");

  if (srsInfoBtn && srsInfoModal) {
    srsInfoBtn.addEventListener("click", function () {
      srsInfoModal.classList.remove("hidden");
    });
  }

  if (closeSrsInfoBtn && srsInfoModal) {
    closeSrsInfoBtn.addEventListener("click", function () {
      srsInfoModal.classList.add("hidden");
    });
  }

  if (srsInfoModal) {
    srsInfoModal.addEventListener("click", function (e) {
      if (e.target === srsInfoModal) {
        srsInfoModal.classList.add("hidden");
      }
    });
  }

  loadCategories();
})();
