(function () {
  var VIEW_KEY = "german-trainer-time-view";
  var SETTINGS_KEY = "german-trainer-time-settings";

  var ones = [
    "null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
    "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"
  ];
  var tensWords = {
    20: "zwanzig", 30: "dreißig", 40: "vierzig", 50: "fünfzig", 60: "sechzig", 70: "siebzig", 80: "achtzig", 90: "neunzig"
  };

  function minuteToGerman(n) {
    if (n < 20) return ones[n];
    if (n % 10 === 0) return tensWords[n];
    var tens = Math.floor(n / 10) * 10;
    var unit = n % 10;
    var unitWord = unit === 1 ? "ein" : ones[unit];
    return unitWord + "und" + tensWords[tens];
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function generateClockSvg(hours, minutes, size) {
    var s = size || 130;
    var minAngle = minutes * 6;
    var hrAngle = ((hours % 12) + minutes / 60) * 30;

    var ticks = "";
    for (var i = 0; i < 60; i++) {
      var isHour = (i % 5 === 0);
      var rad = (i * 6 - 90) * Math.PI / 180;
      var r1 = 72;
      var r2 = isHour ? 64 : 68;
      var x1 = (80 + r1 * Math.cos(rad)).toFixed(1);
      var y1 = (80 + r1 * Math.sin(rad)).toFixed(1);
      var x2 = (80 + r2 * Math.cos(rad)).toFixed(1);
      var y2 = (80 + r2 * Math.sin(rad)).toFixed(1);
      var strokeWidth = isHour ? "2" : "1";
      var opacity = isHour ? "0.7" : "0.35";
      ticks += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="' + strokeWidth + '" opacity="' + opacity + '" />';
    }

    var numbers = "";
    for (var h = 1; h <= 12; h++) {
      var nRad = (h * 30 - 90) * Math.PI / 180;
      var numR = 53;
      var nx = (80 + numR * Math.cos(nRad)).toFixed(1);
      var ny = (80 + numR * Math.sin(nRad) + 4.5).toFixed(1);
      numbers += '<text x="' + nx + '" y="' + ny + '" text-anchor="middle" font-size="12" font-weight="600" fill="currentColor" opacity="0.85">' + h + '</text>';
    }

    return '<svg class="analog-clock" viewBox="0 0 160 160" width="' + s + '" height="' + s + '" aria-label="Часы ' + hours + ':' + pad2(minutes) + '">' +
      '<circle cx="80" cy="80" r="74" class="clock-face" />' +
      '<g class="clock-ticks">' + ticks + '</g>' +
      '<g class="clock-numbers">' + numbers + '</g>' +
      '<line x1="80" y1="80" x2="80" y2="44" class="clock-hour-hand" transform="rotate(' + hrAngle.toFixed(1) + ', 80, 80)" />' +
      '<line x1="80" y1="80" x2="80" y2="22" class="clock-minute-hand" transform="rotate(' + minAngle.toFixed(1) + ', 80, 80)" />' +
      '<circle cx="80" cy="80" r="4.5" class="clock-center-dot" />' +
      '</svg>';
  }

  function getTimeInfo(h24, m) {
    var h12 = (h24 % 12 === 0) ? 12 : (h24 % 12);
    var nextH12 = (h12 % 12) + 1;
    var curHWord = h12 === 1 ? "eins" : ones[h12];
    var curHWordBeforeUhr = h12 === 1 ? "ein" : ones[h12];
    var nextHWord = nextH12 === 1 ? "eins" : ones[nextH12];

    var primaryColloquial = "";
    var acceptedVariants = [];

    if (m === 0) {
      primaryColloquial = curHWordBeforeUhr + " Uhr";
      acceptedVariants.push(primaryColloquial);
      if (h12 === 1) acceptedVariants.push("eins Uhr");
    } else if (m === 5) {
      primaryColloquial = "fünf nach " + curHWord;
      acceptedVariants.push(primaryColloquial);
    } else if (m === 10) {
      primaryColloquial = "zehn nach " + curHWord;
      acceptedVariants.push(primaryColloquial);
    } else if (m === 15) {
      primaryColloquial = "Viertel nach " + curHWord;
      acceptedVariants.push(primaryColloquial);
      acceptedVariants.push("viertel nach " + curHWord);
      acceptedVariants.push("viertel " + nextHWord);
    } else if (m === 20) {
      primaryColloquial = "zwanzig nach " + curHWord;
      acceptedVariants.push(primaryColloquial);
      acceptedVariants.push("zehn vor halb " + nextHWord);
    } else if (m === 25) {
      primaryColloquial = "fünf vor halb " + nextHWord;
      acceptedVariants.push(primaryColloquial);
    } else if (m === 30) {
      primaryColloquial = "halb " + nextHWord;
      acceptedVariants.push(primaryColloquial);
    } else if (m === 35) {
      primaryColloquial = "fünf nach halb " + nextHWord;
      acceptedVariants.push(primaryColloquial);
    } else if (m === 40) {
      primaryColloquial = "zwanzig vor " + nextHWord;
      acceptedVariants.push(primaryColloquial);
      acceptedVariants.push("zehn nach halb " + nextHWord);
    } else if (m === 45) {
      primaryColloquial = "Viertel vor " + nextHWord;
      acceptedVariants.push(primaryColloquial);
      acceptedVariants.push("viertel vor " + nextHWord);
      acceptedVariants.push("dreiviertel " + nextHWord);
    } else if (m === 50) {
      primaryColloquial = "zehn vor " + nextHWord;
      acceptedVariants.push(primaryColloquial);
    } else if (m === 55) {
      primaryColloquial = "fünf vor " + nextHWord;
      acceptedVariants.push(primaryColloquial);
    } else {
      if (m < 30) {
        primaryColloquial = minuteToGerman(m) + " nach " + curHWord;
      } else {
        primaryColloquial = minuteToGerman(60 - m) + " vor " + nextHWord;
      }
      acceptedVariants.push(primaryColloquial);
    }

    var hOfficial = h24 === 1 ? "ein" : minuteToGerman(h24);
    var official = hOfficial + " Uhr" + (m > 0 ? " " + minuteToGerman(m) : "");
    acceptedVariants.push(official);

    var digital24 = pad2(h24) + ":" + pad2(m);
    var digital12 = pad2(h12) + ":" + pad2(m);

    return {
      h24: h24,
      h12: h12,
      m: m,
      digital24: digital24,
      digital12: digital12,
      primaryColloquial: primaryColloquial,
      acceptedVariants: acceptedVariants,
      official: official,
      id: digital24
    };
  }

  function normalizeGerman(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/^es\s+ist\s+/i, "")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ")
      .replace(/ß/g, "ss");
  }

  function levenshtein(a, b) {
    var matrix = [];
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (var i = 1; i <= b.length; i++) {
      for (var j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  function checkGermanAnswer(userVal, current) {
    var normUser = normalizeGerman(userVal);
    if (!normUser) return { isCorrect: false, correctText: current.time.primaryColloquial };

    // Check with vertiel -> viertel tolerance
    var userCorrected = normUser.replace(/\bvertiel\b/g, "viertel");

    for (var i = 0; i < current.time.acceptedVariants.length; i++) {
      var normTarget = normalizeGerman(current.time.acceptedVariants[i]);
      if (normUser === normTarget) {
        return { isCorrect: true, correctText: current.time.primaryColloquial };
      }
      if (userCorrected === normTarget) {
        return {
          isCorrect: true,
          correctText: current.time.primaryColloquial,
          extraFeedback: "Обратите внимание на написание: <b>Viertel</b> (не vertiel)"
        };
      }
      if (normTarget.length > 5 && levenshtein(normUser, normTarget) <= 1) {
        return {
          isCorrect: true,
          correctText: current.time.primaryColloquial,
          extraFeedback: "Принято с опечаткой: <b>" + current.time.acceptedVariants[i] + "</b>"
        };
      }
    }

    return { isCorrect: false, correctText: current.time.primaryColloquial };
  }

  function parseTimeInput(str) {
    var cleaned = str.trim().replace(/\s*[:.\s-]\s*/, ":");
    var match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    var h = parseInt(match[1], 10);
    var m = parseInt(match[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { h: h, m: m };
  }

  function checkTimeInputAnswer(userVal, current) {
    var parsed = parseTimeInput(userVal);
    var correctDisplay = current.time.digital24 + " (или " + current.time.digital12 + ")";

    if (!parsed) {
      return {
        isCorrect: false,
        correctText: correctDisplay,
        extraFeedback: "Введите время в формате ЧЧ:ММ (напр. " + current.time.digital24 + ")"
      };
    }

    var isCorrect = (parsed.m === current.time.m) &&
      (parsed.h === current.time.h24 || parsed.h === current.time.h12);

    return {
      isCorrect: isCorrect,
      correctText: correctDisplay
    };
  }

  // ---- Settings & State ----
  var defaultSettings = {
    dirs: ["time2words", "words2time"],
    minuteStep: 5, // 5 or 1
    hourFormat: "24" // '24' or '12'
  };

  var settings = Object.assign({}, defaultSettings);

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          settings = Object.assign({}, defaultSettings, parsed);
        }
      }
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function loadView() {
    try {
      var v = localStorage.getItem(VIEW_KEY);
      return (v === "presentation" || v === "quiz") ? v : "quiz";
    } catch (e) {
      return "quiz";
    }
  }

  function saveView(v) {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch (e) {}
  }

  var currentView = loadView();

  // Generate question pool based on step
  function generateTimePool(step) {
    var pool = [];
    var minStep = step || 5;
    for (var h = 0; h < 24; h++) {
      for (var m = 0; m < 60; m += minStep) {
        pool.push(getTimeInfo(h, m));
      }
    }
    return pool;
  }

  function pickRandomTime(pool, lastId) {
    if (pool.length === 0) return null;
    var candidates = pool;
    if (lastId && pool.length > 1) {
      var filtered = pool.filter(function (t) { return t.id !== lastId; });
      if (filtered.length > 0) candidates = filtered;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // ---- DOM Elements ----
  var elModeEl = document.getElementById("time-qmode");
  var elQuestionCont = document.getElementById("time-question-container");
  var elAnswer = document.getElementById("time-answer");
  var elFeedback = document.getElementById("time-feedback");
  var elPrevResult = document.getElementById("time-prev-result");
  var elCheckBtn = document.getElementById("time-check-btn");
  var elNextBtn = document.getElementById("time-next-btn");
  var elQuizInputSec = document.getElementById("time-quiz-input-section");
  var elPresSec = document.getElementById("time-presentation-section");
  var elRevealBtn = document.getElementById("time-reveal-btn");
  var elPresAnswerCard = document.getElementById("time-pres-answer-card");
  var elPresActions = document.getElementById("time-pres-actions");
  var elPresNextBtn = document.getElementById("time-pres-next-btn");
  var elViewQuizBtn = document.getElementById("time-view-quiz-btn");
  var elViewPresBtn = document.getElementById("time-view-pres-btn");

  var elScoreCorrect = document.getElementById("time-score-correct");
  var elScoreTotal = document.getElementById("time-score-total");
  var elScorePercent = document.getElementById("time-score-percent");
  var elStreak = document.getElementById("time-streak");
  var elBestStreak = document.getElementById("time-best-streak");
  var elResetBtn = document.getElementById("time-reset-btn");

  // Stats storage
  var STATS_KEY = "german-trainer-stats-time";
  var stats = { correct: 0, total: 0, streak: 0, bestStreak: 0 };

  function loadStats() {
    try {
      var raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (typeof s.correct === "number") stats.correct = s.correct;
        if (typeof s.total === "number") stats.total = s.total;
        if (typeof s.streak === "number") stats.streak = s.streak;
        if (typeof s.bestStreak === "number") stats.bestStreak = s.bestStreak;
      }
    } catch (e) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  function renderScoreUI() {
    var percent = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
    if (elScoreCorrect) elScoreCorrect.textContent = stats.correct;
    if (elScoreTotal) elScoreTotal.textContent = stats.total;
    if (elScorePercent) elScorePercent.textContent = percent + "%";
    if (elStreak) elStreak.textContent = stats.streak;
    if (elBestStreak) elBestStreak.textContent = stats.bestStreak;
  }

  function resetScore() {
    stats.correct = 0;
    stats.total = 0;
    stats.streak = 0;
    stats.bestStreak = 0;
    renderScoreUI();
    saveStats();
  }

  var currentState = {
    current: null,
    answered: false,
    revealed: false
  };

  function updateViewUI() {
    if (currentView === "quiz") {
      elViewQuizBtn.classList.add("active");
      elViewPresBtn.classList.remove("active");
      elQuizInputSec.style.display = "flex";
      elPresSec.style.display = "none";
      if (!currentState.answered && elAnswer) {
        elAnswer.focus();
      }
    } else {
      elViewQuizBtn.classList.remove("active");
      elViewPresBtn.classList.add("active");
      elQuizInputSec.style.display = "none";
      elPresSec.style.display = "flex";
      if (!currentState.revealed) {
        elRevealBtn.style.display = "inline-block";
        elPresAnswerCard.style.display = "none";
        elPresActions.style.display = "none";
      }
    }
  }

  function setView(view) {
    currentView = view;
    saveView(view);
    updateViewUI();
  }

  function nextQuestion() {
    var dirs = settings.dirs && settings.dirs.length > 0 ? settings.dirs : ["time2words", "words2time"];
    var dir = dirs[Math.floor(Math.random() * dirs.length)];

    var pool = generateTimePool(settings.minuteStep);
    var lastId = currentState.current ? currentState.current.time.id : null;
    var time = pickRandomTime(pool, lastId);
    if (!time) return;

    currentState.current = {
      time: time,
      dir: dir
    };
    currentState.answered = false;
    currentState.revealed = false;

    // Reset feedback and input
    if (elAnswer) {
      elAnswer.value = "";
      elAnswer.style.borderColor = "";
    }
    if (elFeedback) {
      elFeedback.innerHTML = "";
    }

    // Reset presentation area
    if (elRevealBtn) elRevealBtn.style.display = "inline-block";
    if (elPresAnswerCard) {
      elPresAnswerCard.style.display = "none";
      elPresAnswerCard.innerHTML = "";
    }
    if (elPresActions) elPresActions.style.display = "none";

    renderQuestion();
    updateViewUI();
  }

  function renderQuestion() {
    var cur = currentState.current;
    if (!cur) return;

    var modeText = "";
    var isPres = (currentView === "presentation");

    if (cur.dir === "time2words") {
      modeText = "Время → немецкие слова" + (isPres ? " (презентация)" : "");
      if (elAnswer) {
        elAnswer.placeholder = "Напр. Viertel vor drei";
        elAnswer.type = "text";
      }

      var digitalStr = (settings.hourFormat === "12") ? cur.time.digital12 : cur.time.digital24;

      elQuestionCont.innerHTML =
        '<div class="time-both-container">' +
        generateClockSvg(cur.time.h24, cur.time.m, 130) +
        '<div class="time-digital-display time-digital-sub">' + digitalStr + '</div>' +
        '</div>';
    } else {
      modeText = "Немецкие слова → время" + (isPres ? " (презентация)" : "");
      if (elAnswer) {
        elAnswer.placeholder = "Напр. 14:45 или 02:45";
        elAnswer.type = "text";
      }
      elQuestionCont.innerHTML = '<div class="question" style="font-size: 26px;">' + cur.time.primaryColloquial + '</div>';
    }

    if (elModeEl) elModeEl.textContent = modeText;
  }

  function evaluateQuizAnswer() {
    if (currentState.answered || !currentState.current) return;
    var cur = currentState.current;
    var userVal = elAnswer ? elAnswer.value : "";
    var result;

    if (cur.dir === "time2words") {
      result = checkGermanAnswer(userVal, cur);
    } else {
      result = checkTimeInputAnswer(userVal, cur);
    }

    currentState.answered = true;
    stats.total += 1;

    if (result.isCorrect) {
      stats.correct += 1;
      stats.streak += 1;
      if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
    } else {
      stats.streak = 0;
    }

    renderScoreUI();
    saveStats();

    showQuizFeedback(result);
  }

  function showQuizFeedback(result) {
    var cur = currentState.current;

    var html = "";
    if (result.isCorrect) {
      html += '<div style="color: var(--success); font-weight: 600; font-size: 15px; margin: 4px 0 2px;">✓ Верно!</div>';
      if (result.extraFeedback) {
        html += '<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">' + result.extraFeedback + '</div>';
      }
    } else {
      html += '<div style="color: var(--danger); font-weight: 600; font-size: 15px; margin: 4px 0 2px;">✗ Неверно</div>';
      html += '<div style="font-size: 14px; margin-bottom: 4px;">Правильно: <b style="color: var(--text-primary); font-size: 15px;">' + result.correctText + '</b></div>';
    }

    html += '<div style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">' +
      '<span>' + cur.time.digital24 + '</span>' +
      ' <span style="opacity: 0.5;">•</span> ' +
      '<span>' + cur.time.primaryColloquial + '</span>' +
      '</div>';

    elFeedback.innerHTML = html;
    if (elAnswer) {
      elAnswer.style.borderColor = result.isCorrect ? "var(--success)" : "var(--danger)";
    }

    if (elPrevResult) {
      elPrevResult.innerHTML = (result.isCorrect ? "✓ " : "✗ ") + cur.time.digital24 + " → <b>" + cur.time.primaryColloquial + "</b>";
      elPrevResult.style.color = result.isCorrect ? "var(--success)" : "var(--danger)";
    }
  }

  function revealPresentation() {
    if (currentState.revealed || !currentState.current) return;
    currentState.revealed = true;
    var cur = currentState.current;

    var cardContent = "";
    if (cur.dir === "time2words") {
      cardContent =
        '<div class="pres-main-text">' + cur.time.primaryColloquial + '</div>' +
        '<div class="pres-sub-text" style="margin-top: 4px;">' + cur.time.digital24 + ' • Официально: ' + cur.time.official + '</div>';
    } else {
      var clockHtml = generateClockSvg(cur.time.h24, cur.time.m, 110);
      cardContent =
        '<div class="time-digital-display" style="font-size: 26px; padding: 4px 14px; margin-bottom: 6px;">' + cur.time.digital24 + '</div>' +
        clockHtml;
    }

    elPresAnswerCard.innerHTML = cardContent;
    elRevealBtn.style.display = "none";
    elPresAnswerCard.style.display = "flex";
    elPresActions.style.display = "flex";

    stats.total += 1;
    stats.correct += 1;
    stats.streak += 1;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
    renderScoreUI();
    saveStats();
  }

  // ---- Settings Modal Wiring ----
  function initSettingsModal() {
    // Checkboxes: directions
    document.querySelectorAll(".time-dir-cb").forEach(function (cb) {
      cb.checked = (settings.dirs.indexOf(cb.value) !== -1);
      cb.addEventListener("change", function () {
        var dirs = [];
        document.querySelectorAll(".time-dir-cb:checked").forEach(function (c) {
          dirs.push(c.value);
        });
        if (dirs.length === 0) {
          dirs = ["time2words"];
          cb.checked = true;
        }
        settings.dirs = dirs;
        saveSettings();
        nextQuestion();
      });
    });

    // Radio: minute step
    document.querySelectorAll(".time-step-radio").forEach(function (radio) {
      radio.checked = (parseInt(radio.value, 10) === settings.minuteStep);
      radio.addEventListener("change", function () {
        settings.minuteStep = parseInt(radio.value, 10);
        saveSettings();
        nextQuestion();
      });
    });

    // Radio: hour format
    document.querySelectorAll(".time-hour-radio").forEach(function (radio) {
      radio.checked = (radio.value === settings.hourFormat);
      radio.addEventListener("change", function () {
        settings.hourFormat = radio.value;
        saveSettings();
        renderQuestion();
      });
    });
  }

  // ---- Events Setup ----
  if (elViewQuizBtn) {
    elViewQuizBtn.addEventListener("click", function () { setView("quiz"); });
  }
  if (elViewPresBtn) {
    elViewPresBtn.addEventListener("click", function () { setView("presentation"); });
  }

  if (elCheckBtn) {
    elCheckBtn.addEventListener("click", evaluateQuizAnswer);
  }
  if (elNextBtn) {
    elNextBtn.addEventListener("click", nextQuestion);
  }

  if (elAnswer) {
    elAnswer.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        if (!currentState.answered) {
          evaluateQuizAnswer();
        } else {
          nextQuestion();
        }
      }
    });
  }

  if (elRevealBtn) {
    elRevealBtn.addEventListener("click", revealPresentation);
  }
  if (elPresNextBtn) {
    elPresNextBtn.addEventListener("click", nextQuestion);
  }

  if (elResetBtn) {
    elResetBtn.addEventListener("click", resetScore);
  }

  // Keyboard support for presentation mode
  document.addEventListener("keydown", function (e) {
    var panel = document.getElementById("panel-time");
    if (!panel || !panel.classList.contains("active")) return;
    if (currentView !== "presentation") return;
    if (document.body.classList.contains("modal-open")) return;

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!currentState.revealed) {
        revealPresentation();
      } else {
        nextQuestion();
      }
    }
  });

  // Initialize
  loadSettings();
  loadStats();
  renderScoreUI();
  initSettingsModal();
  updateViewUI();
  nextQuestion();
})();
