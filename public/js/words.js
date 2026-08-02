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

  function renderCategoryCheckboxes() {
    var row = document.getElementById("word-categories-row");
    row.innerHTML = "";
    if (categories.length === 0) {
      row.innerHTML = '<span class="empty-note" style="padding:0;">Пока нет слов — добавь их в <a href="/admin.html">админ-панели</a></span>';
      return;
    }
    categories.forEach(function (cat, idx) {
      var label = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "word-cat-cb";
      cb.value = cat.id;
      if (idx === 0) cb.checked = true;
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

  // Без "умного подбора": просто без повтора подряд.
  function pickWordPlain(pool, lastWordId) {
    if (pool.length === 1) return pool[0];
    var candidate;
    do {
      candidate = pool[Math.floor(Math.random() * pool.length)];
    } while (candidate.id === lastWordId);
    return candidate;
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
        elements.qEl.textContent = current.word.de;
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
    });
  }

  loadCategories();
})();
