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
    if (ranges.length === 0) ranges = ["0-12"];
    return ranges;
  }

  function getDirs() {
    var boxes = document.querySelectorAll(".num-dir-cb:checked");
    var dirs = [];
    boxes.forEach(function (b) { dirs.push(b.value); });
    if (dirs.length === 0) dirs = ["n2w"];
    return dirs;
  }

  function randomNumberFromRanges(ranges) {
    var pick = ranges[Math.floor(Math.random() * ranges.length)];
    var bounds = pick.split("-").map(Number);
    var min = bounds[0], max = bounds[1];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickNumber(ranges, lastNumber) {
    // total distinct numbers available across selected ranges
    var totalCount = 0;
    ranges.forEach(function (r) {
      var b = r.split("-").map(Number);
      totalCount += (b[1] - b[0] + 1);
    });
    if (totalCount <= 1) return randomNumberFromRanges(ranges);
    var candidate;
    do {
      candidate = randomNumberFromRanges(ranges);
    } while (candidate === lastNumber);
    return candidate;
  }

  function countInRanges(ranges) {
    var total = 0;
    ranges.forEach(function (r) {
      var b = r.split("-").map(Number);
      total += (b[1] - b[0] + 1);
    });
    return total;
  }

  function numberInRanges(n, ranges) {
    return ranges.some(function (r) {
      var b = r.split("-").map(Number);
      return n >= b[0] && n <= b[1];
    });
  }

  // "Умный подбор": числа, в которых чаще ошибались, выпадают заметно чаще,
  // но остальные тоже продолжают встречаться — без полного перебора диапазона.
  function pickNumberSmart(ranges, weights, lastNumber) {
    var weakKeys = Object.keys(weights).filter(function (k) {
      return weights[k] > 0 && numberInRanges(Number(k), ranges);
    });
    if (weakKeys.length === 0) return pickNumber(ranges, lastNumber);

    var totalCount = countInRanges(ranges);
    var weakTotalWeight = weakKeys.reduce(function (s, k) { return s + 1 + weights[k] * 3; }, 0);
    var r = Math.random() * (weakTotalWeight + totalCount);

    if (r >= weakTotalWeight) return pickNumber(ranges, lastNumber);

    var candidates = weakKeys;
    if (weakKeys.length > 1 && lastNumber != null) {
      var filtered = weakKeys.filter(function (k) { return Number(k) !== lastNumber; });
      if (filtered.length > 0) candidates = filtered;
    }
    var total = 0;
    var weighted = candidates.map(function (k) {
      var w = 1 + weights[k] * 3;
      total += w;
      return { k: k, w: w };
    });
    var rr = Math.random() * total;
    for (var i = 0; i < weighted.length; i++) {
      rr -= weighted[i].w;
      if (rr <= 0) return Number(weighted[i].k);
    }
    return Number(weighted[weighted.length - 1].k);
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

  var smartCb = document.getElementById("num-smart-cb");
  if (smartCb) smartCb.checked = loadSmartEnabled();

  var quiz = QuizEngine.create({
    prefix: "num",

    pickNext: function (state) {
      var ranges = getRanges();
      var dirs = getDirs();
      var lastNumber = state.current ? state.current.number : null;
      var number = (smartCb && smartCb.checked)
        ? pickNumberSmart(ranges, QuizEngine.getWeights("num"), lastNumber)
        : pickNumber(ranges, lastNumber);
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

  if (smartCb) {
    smartCb.addEventListener("change", function () {
      saveSmartEnabled(smartCb.checked);
    });
  }

  quiz.newQuestion(true);
})();
