(function () {
  var SMART_KEY = "german-trainer-smart-word";
  var categories = [];

  function normalize(s) {
    return s.trim().toLowerCase().replace(/ß/g, "ss");
  }

  // "кот / кошка" -> ["кот", "кошка"]; plain strings -> ["слово"]
  function splitAlternatives(s) {
    return s.split("/").map(function (part) { return part.trim(); }).filter(Boolean);
  }

  function matchesAnyAlternative(userInput, correctText) {
    var alternatives = splitAlternatives(correctText);
    var normalizedInput = normalize(userInput);
    return alternatives.some(function (alt) { return normalize(alt) === normalizedInput; });
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

  var CATS_KEY = "german-trainer-word-cats";
  var DIRS_KEY = "german-trainer-word-dirs";

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
      label.appendChild(document.createTextNode(cat.name + " (" + cat.words.length + ")"));
      row.appendChild(label);
    });
  }

  function setQuizEnabled(enabled) {
    var area = document.getElementById("word-quiz-area");
    area.style.opacity = enabled ? "1" : "0.4";
    area.style.pointerEvents = enabled ? "auto" : "none";
  }

  // Без "умного подбора": просто без повтора подряд (безопасно от бесконечного цикла).
  function pickWordPlain(pool, lastWordId) {
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    var filtered = pool.filter(function (w) { return w.id !== lastWordId; });
    var candidates = filtered.length > 0 ? filtered : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function extractGermanArticle(text) {
    if (!text) return null;
    var firstAlt = text.split("/")[0].trim();
    var match = firstAlt.match(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\b/i);
    return match ? match[1] : null;
  }

  function wordId(w) { return w.id; }

  function loadSmartEnabled() {
    try {
      return localStorage.getItem(SMART_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function saveSmartEnabled(val) {
    try {
      localStorage.setItem(SMART_KEY, val ? "1" : "0");
    } catch (e) {
      // недоступно — не критично
    }
  }

  loadDirs();

  var smartCb = document.getElementById("word-smart-cb");
  if (smartCb) smartCb.checked = loadSmartEnabled();

  var quiz = QuizEngine.create({
    prefix: "word",

    pickNext: function (state) {
      var pool = getPool();
      if (pool.length === 0) return null;
      var dirs = getDirs();
      var lastWordId = state.current ? state.current.word.id : null;
      var word = (smartCb && smartCb.checked)
        ? QuizEngine.weightedPick(pool, wordId, QuizEngine.getWeights("word"), lastWordId)
        : pickWordPlain(pool, lastWordId);
      var dir = dirs[Math.floor(Math.random() * dirs.length)];
      return { word: word, dir: dir };
    },

    render: function (current, elements) {
      if (current.dir === "de2ru") {
        elements.modeEl.textContent = "Немецкий → русский";
        elements.qEl.innerHTML = QuizEngine.formatGermanGender(current.word.de);
        elements.ansEl.placeholder = "Перевод на русский";
      } else {
        elements.modeEl.textContent = "Русский → немецкий";
        elements.qEl.textContent = current.word.ru;
        elements.ansEl.placeholder = "Слово по-немецки";
      }
    },

    checkAnswer: function (userVal, current) {
      var correctText = current.dir === "de2ru" ? current.word.ru : current.word.de;
      var isCorrect = matchesAnyAlternative(userVal, correctText);
      return { isCorrect: isCorrect, correctText: correctText };
    },

    weightId: function (current) {
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
      return;
    }
    setQuizEnabled(true);
    quiz.newQuestion(true);
  }

  function loadCategories() {
    fetch("/api/categories")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        categories = data;
        renderCategoryCheckboxes();
        onSettingsChanged();
      })
      .catch(function () {
        document.getElementById("word-categories-row").innerHTML =
          '<span class="empty-note" style="padding:0;">Не удалось загрузить слова с сервера</span>';
      });
  }

  document.querySelectorAll(".word-dir-cb").forEach(function (cb) {
    cb.addEventListener("change", onSettingsChanged);
  });

  if (smartCb) {
    smartCb.addEventListener("change", function () {
      saveSmartEnabled(smartCb.checked);
      onSettingsChanged();
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
      var correctText = current.dir === "de2ru" ? current.word.ru : current.word.de;
      var ansEl = document.getElementById("word-answer");
      if (!ansEl) return;

      var firstTarget = correctText.split("/")[0].trim();

      // Если целевой ответ на немецком (перевод ru -> de) и в нём есть артикль
      if (current.dir === "ru2de") {
        var article = extractGermanArticle(firstTarget);
        if (article) {
          var valLower = ansEl.value.trim().toLowerCase();
          var artLower = article.toLowerCase();
          // Если артикль еще не введён полностью
          if (valLower !== artLower && !valLower.startsWith(artLower + " ")) {
            ansEl.value = article + " ";
            ansEl.focus();
            return;
          }
        }
      }

      // В остальных случаях (или после артикля) открываем по буквам
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

  loadCategories();
})();
