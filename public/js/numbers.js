(function () {
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

  var quiz = QuizEngine.create({
    prefix: "num",

    pickNext: function (state) {
      var ranges = getRanges();
      var dirs = getDirs();
      var lastNumber = state.current ? state.current.number : null;
      var number = pickNumber(ranges, lastNumber);
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
    }
  });

  quiz.newQuestion(true);
})();
