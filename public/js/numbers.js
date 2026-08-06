(function () {
  var SMART_KEY = "german-trainer-smart-num";

  var ones = ["null","eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn",
    "elf","zwölf","dreizehn","vierzehn","fünfzehn","sechzehn","siebzehn","achtzehn","neunzehn"];
  var tensWords = {20:"zwanzig",30:"dreißig",40:"vierzig",50:"fünfzig",60:"sechzig",70:"siebzig",80:"achtzig",90:"neunzig"};

  function under100(n) {
    if (n < 20) return ones[n];
    if (n % 10 === 0) return tensWords[n];
    var tens = Math.floor(n / 10) * 10;
    var unit = n % 10;
    var unitWord = unit === 1 ? "ein" : ones[unit];
    return unitWord + "und" + tensWords[tens];
  }

  function under1000(n) {
    if (n < 100) return under100(n);
    var h = Math.floor(n / 100);
    var rest = n % 100;
    var hWord = (h === 1 ? "" : ones[h]) + "hundert";
    if (rest === 0) return hWord;
    return hWord + under100(rest);
  }

  function numberToGerman(n) {
    if (n === 0) return "null";
    if (n < 1000) return under1000(n);
    if (n < 10000) {
      var th = Math.floor(n / 1000);
      var rest = n % 1000;
      var thWord = (th === 1 ? "ein" : ones[th]) + "tausend";
      if (rest === 0) return thWord;
      return thWord + under1000(rest);
    }
    if (n === 10000) return "zehntausend";
    return String(n);
  }

  function normalize(s) {
    return s.trim().toLowerCase().replace(/ß/g, "ss");
  }

  function getRanges() {
    var boxes = document.querySelectorAll(".num-range-cb:checked");
    var ranges = [];
    boxes.forEach(function (b) { ranges.push(b.value); });
    return ranges;
  }

  function getDirs() {
    var boxes = document.querySelectorAll(".num-dir-cb:checked");
    var dirs = [];
    boxes.forEach(function (b) { dirs.push(b.value); });
    if (dirs.length === 0) dirs = ["n2w"];
    return dirs;
  }

  // Полный список чисел в выбранных диапазонах
  function numbersInRanges(ranges) {
    var nums = [];
    ranges.forEach(function (r) {
      var b = r.split("-").map(Number);
      for (var n = b[0]; n <= b[1]; n++) nums.push(n);
    });
    return nums;
  }

  function pickNumber(ranges, lastNumber) {
    var pool = numbersInRanges(ranges);
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    var filtered = pool.filter(function (n) { return n !== lastNumber; });
    var candidates = filtered.length > 0 ? filtered : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function numId(n) {
    return String(n);
  }

  // "Умный подбор": взвешенный выбор через QuizEngine
  function pickNumberSmart(ranges, weights, lastNumber) {
    var pool = numbersInRanges(ranges);
    if (pool.length === 0) return null;
    var excludeId = lastNumber != null ? numId(lastNumber) : null;
    return QuizEngine.weightedPick(pool, numId, weights, excludeId);
  }

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

  var RANGES_KEY = "german-trainer-num-ranges";
  var DIRS_KEY = "german-trainer-num-dirs";

  function saveRanges() {
    try {
      localStorage.setItem(RANGES_KEY, JSON.stringify(getRanges()));
    } catch (e) {}
  }

  function loadRanges() {
    try {
      var raw = localStorage.getItem(RANGES_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved)) {
        document.querySelectorAll(".num-range-cb").forEach(function (cb) {
          cb.checked = saved.indexOf(cb.value) !== -1;
        });
      }
    } catch (e) {}
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
        document.querySelectorAll(".num-dir-cb").forEach(function (cb) {
          cb.checked = saved.indexOf(cb.value) !== -1;
        });
      }
    } catch (e) {}
  }

  function setQuizEnabled(enabled) {
    var area = document.querySelector("#panel-numbers .quiz");
    if (area) {
      area.style.opacity = enabled ? "1" : "0.4";
      area.style.pointerEvents = enabled ? "auto" : "none";
    }
  }

  function onSettingsChanged() {
    saveRanges();
    saveDirs();
    var ranges = getRanges();
    if (ranges.length === 0) {
      setQuizEnabled(false);
      document.getElementById("num-question").textContent = "—";
      document.getElementById("num-qmode").textContent = "Выбери хотя бы один диапазон чисел";
      return;
    }
    setQuizEnabled(true);
    quiz.newQuestion(true);
  }

  loadRanges();
  loadDirs();

  var smartCb = document.getElementById("num-smart-cb");
  if (smartCb) smartCb.checked = loadSmartEnabled();

  var quiz = QuizEngine.create({
    prefix: "num",

    pickNext: function (state) {
      var ranges = getRanges();
      if (ranges.length === 0) return null;
      var dirs = getDirs();
      var lastNumber = state.current ? state.current.number : null;
      var number = (smartCb && smartCb.checked)
        ? pickNumberSmart(ranges, QuizEngine.getWeights("num"), lastNumber)
        : pickNumber(ranges, lastNumber);
      if (number == null) return null;
      var dir = dirs[Math.floor(Math.random() * dirs.length)];
      return { number: number, dir: dir };
    },

    render: function (current, elements) {
      if (current.dir === "n2w") {
        elements.modeEl.textContent = "Число → слово";
        elements.qEl.textContent = String(current.number);
        elements.ansEl.placeholder = "Напишите словом по-немецки";
      } else {
        elements.modeEl.textContent = "Слово → число";
        elements.qEl.textContent = numberToGerman(current.number);
        elements.ansEl.placeholder = "Введите цифрами";
      }
    },

    checkAnswer: function (userVal, current) {
      var correctText, isCorrect;
      if (current.dir === "n2w") {
        correctText = numberToGerman(current.number);
        isCorrect = normalize(userVal) === normalize(correctText);
      } else {
        correctText = String(current.number);
        isCorrect = userVal.trim() === correctText;
      }
      return { isCorrect: isCorrect, correctText: correctText };
    },

    weightId: function (current) {
      return String(current.number);
    }
  });

  document.querySelectorAll(".num-range-cb").forEach(function (cb) {
    cb.addEventListener("change", onSettingsChanged);
  });
  document.querySelectorAll(".num-dir-cb").forEach(function (cb) {
    cb.addEventListener("change", onSettingsChanged);
  });

  if (smartCb) {
    smartCb.addEventListener("change", function () {
      saveSmartEnabled(smartCb.checked);
      onSettingsChanged();
    });
  }

  var numWeightsResetBtn = document.getElementById("num-weights-reset-btn");
  if (numWeightsResetBtn) {
    numWeightsResetBtn.addEventListener("click", function () {
      if (!confirm("Сбросить статистику ошибок для чисел? Умный подбор начнёт заново.")) return;
      QuizEngine.resetWeights("num");
      onSettingsChanged();
    });
  }

  quiz.newQuestion(true);
})();
