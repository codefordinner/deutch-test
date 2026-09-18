(function () {
  var SETTINGS_KEY = "german-trainer-time-settings";
  var STATS_KEY = "german-trainer-stats-time";

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
    var isKurz = false;
    var validMinutes = [m];

    if (m === 0) {
      primaryColloquial = curHWordBeforeUhr + " Uhr";
    } else if (m >= 1 && m <= 4) {
      isKurz = true;
      validMinutes = [1, 2, 3, 4];
      primaryColloquial = "kurz nach " + curHWord;
    } else if (m === 5) {
      primaryColloquial = "fünf nach " + curHWord;
    } else if (m >= 6 && m <= 9) {
      primaryColloquial = minuteToGerman(m) + " nach " + curHWord;
    } else if (m === 10) {
      primaryColloquial = "zehn nach " + curHWord;
    } else if (m >= 11 && m <= 14) {
      primaryColloquial = "kurz vor Viertel nach " + curHWord;
    } else if (m === 15) {
      primaryColloquial = "Viertel nach " + curHWord;
    } else if (m >= 16 && m <= 19) {
      primaryColloquial = "kurz nach Viertel nach " + curHWord;
    } else if (m === 20) {
      primaryColloquial = "zwanzig nach " + curHWord;
    } else if (m >= 21 && m <= 24) {
      primaryColloquial = minuteToGerman(30 - m) + " vor halb " + nextHWord;
    } else if (m === 25) {
      primaryColloquial = "fünf vor halb " + nextHWord;
    } else if (m >= 26 && m <= 29) {
      isKurz = true;
      validMinutes = [26, 27, 28, 29];
      primaryColloquial = "kurz vor halb " + nextHWord;
    } else if (m === 30) {
      primaryColloquial = "halb " + nextHWord;
    } else if (m >= 31 && m <= 34) {
      isKurz = true;
      validMinutes = [31, 32, 33, 34];
      primaryColloquial = "kurz nach halb " + nextHWord;
    } else if (m === 35) {
      primaryColloquial = "fünf nach halb " + nextHWord;
    } else if (m >= 36 && m <= 39) {
      primaryColloquial = minuteToGerman(m - 30) + " nach halb " + nextHWord;
    } else if (m === 40) {
      primaryColloquial = "zwanzig vor " + nextHWord;
    } else if (m >= 41 && m <= 44) {
      primaryColloquial = "kurz vor Viertel vor " + nextHWord;
    } else if (m === 45) {
      primaryColloquial = "Viertel vor " + nextHWord;
    } else if (m >= 46 && m <= 49) {
      primaryColloquial = "kurz nach Viertel vor " + nextHWord;
    } else if (m === 50) {
      primaryColloquial = "zehn vor " + nextHWord;
    } else if (m >= 51 && m <= 54) {
      primaryColloquial = minuteToGerman(60 - m) + " vor " + nextHWord;
    } else if (m === 55) {
      primaryColloquial = "fünf vor " + nextHWord;
    } else if (m >= 56 && m <= 59) {
      isKurz = true;
      validMinutes = [56, 57, 58, 59];
      primaryColloquial = "kurz vor " + nextHWord;
    }

    var hOfficial = h24 === 1 ? "ein" : minuteToGerman(h24);
    var official = hOfficial + " Uhr" + (m > 0 ? " " + minuteToGerman(m) : "");

    var digital24 = pad2(h24) + ":" + pad2(m);
    var digital12 = pad2(h12) + ":" + pad2(m);

    return {
      h24: h24,
      h12: h12,
      m: m,
      digital24: digital24,
      digital12: digital12,
      primaryColloquial: primaryColloquial,
      official: official,
      isKurz: isKurz,
      validMinutes: validMinutes,
      id: digital24
    };
  }

  // ---- Settings & State ----
  var defaultSettings = {
    dirs: ["time2words", "words2time"],
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

  // Generate question pool for the recommended mode (kurz vor/nach + 5-minute intervals)
  function generateTimePool() {
    var pool = [];
    var recommendedMinutes = [0, 2, 5, 10, 15, 20, 25, 28, 30, 32, 35, 40, 45, 50, 55, 58];
    for (var h = 0; h < 24; h++) {
      for (var i = 0; i < recommendedMinutes.length; i++) {
        pool.push(getTimeInfo(h, recommendedMinutes[i]));
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
  var elFeedback = document.getElementById("time-feedback");
  var elPrevResult = document.getElementById("time-prev-result");
  var elRevealBtn = document.getElementById("time-reveal-btn");
  var elPresAnswerCard = document.getElementById("time-pres-answer-card");
  var elPresActions = document.getElementById("time-pres-actions");
  var elPresNextBtn = document.getElementById("time-pres-next-btn");

  var elScoreTotal = document.getElementById("time-score-total");
  var elStreak = document.getElementById("time-streak");
  var elBestStreak = document.getElementById("time-best-streak");
  var elResetBtn = document.getElementById("time-reset-btn");

  // Stats storage
  var stats = { total: 0, streak: 0, bestStreak: 0 };

  function loadStats() {
    try {
      var raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
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
    if (elScoreTotal) elScoreTotal.textContent = stats.total;
    if (elStreak) elStreak.textContent = stats.streak;
    if (elBestStreak) elBestStreak.textContent = stats.bestStreak;
  }

  function resetScore() {
    stats.total = 0;
    stats.streak = 0;
    stats.bestStreak = 0;
    renderScoreUI();
    saveStats();
  }

  var currentState = {
    current: null,
    revealed: false
  };

  function nextQuestion() {
    var dirs = settings.dirs && settings.dirs.length > 0 ? settings.dirs : ["time2words", "words2time"];
    var dir = dirs[Math.floor(Math.random() * dirs.length)];

    var pool = generateTimePool();
    var lastId = currentState.current ? currentState.current.time.id : null;
    var time = pickRandomTime(pool, lastId);
    if (!time) return;

    currentState.current = {
      time: time,
      dir: dir
    };
    currentState.revealed = false;

    if (elFeedback) elFeedback.innerHTML = "";

    // Reset presentation area
    if (elRevealBtn) elRevealBtn.style.display = "inline-block";
    if (elPresAnswerCard) {
      elPresAnswerCard.style.display = "none";
      elPresAnswerCard.innerHTML = "";
    }
    if (elPresActions) elPresActions.style.display = "none";

    renderQuestion();
  }

  function renderQuestion() {
    var cur = currentState.current;
    if (!cur) return;

    if (cur.dir === "time2words") {
      if (elModeEl) elModeEl.textContent = "Время → немецкие слова";
      var digitalStr = (settings.hourFormat === "12") ? cur.time.digital12 : cur.time.digital24;

      elQuestionCont.innerHTML =
        '<div class="time-both-container">' +
        generateClockSvg(cur.time.h24, cur.time.m, 130) +
        '<div class="time-digital-display time-digital-sub">' + digitalStr + '</div>' +
        '</div>';
    } else {
      if (elModeEl) elModeEl.textContent = "Немецкие слова → время";
      elQuestionCont.innerHTML = '<div class="question" style="font-size: 28px; line-height: 1.35;">' + cur.time.primaryColloquial + '</div>';
    }
  }

  function revealPresentation() {
    if (currentState.revealed || !currentState.current) return;
    currentState.revealed = true;
    var cur = currentState.current;

    var cardContent = "";
    if (cur.dir === "time2words") {
      cardContent =
        '<div class="pres-main-text" style="color: var(--accent);">' + cur.time.primaryColloquial + '</div>' +
        '<div class="pres-sub-text" style="margin-top: 4px; font-weight: 500;">' + cur.time.digital24 + ' • Официально: <span style="color: var(--text-primary);">' + cur.time.official + '</span></div>';
    } else {
      var clockHtml = generateClockSvg(cur.time.h24, cur.time.m, 110);
      var infoDetail = cur.time.digital24 + ' • Официально: ' + cur.time.official;
      if (cur.time.isKurz && cur.time.validMinutes && cur.time.validMinutes.length > 1) {
        var minM = cur.time.validMinutes[0];
        var maxM = cur.time.validMinutes[cur.time.validMinutes.length - 1];
        var targetH = pad2(cur.time.h24);
        infoDetail = 'Диапазон: ' + targetH + ':' + pad2(minM) + '–' + targetH + ':' + pad2(maxM) + ' • ' + infoDetail;
      }

      cardContent =
        '<div class="time-digital-display" style="font-size: 26px; padding: 4px 14px; margin-bottom: 6px;">' + cur.time.digital24 + '</div>' +
        clockHtml +
        '<div class="pres-sub-text" style="margin-top: 6px; font-size: 13px;">' + infoDetail + '</div>';
    }

    elPresAnswerCard.innerHTML = cardContent;
    elRevealBtn.style.display = "none";
    elPresAnswerCard.style.display = "flex";
    elPresActions.style.display = "flex";

    stats.total += 1;
    stats.streak += 1;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
    renderScoreUI();
    saveStats();

    if (elPrevResult) {
      elPrevResult.innerHTML = cur.time.digital24 + " ↔ <b>" + cur.time.primaryColloquial + "</b>";
      elPrevResult.style.color = "var(--text-secondary)";
    }
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
  if (elRevealBtn) {
    elRevealBtn.addEventListener("click", revealPresentation);
  }
  if (elPresNextBtn) {
    elPresNextBtn.addEventListener("click", nextQuestion);
  }
  if (elResetBtn) {
    elResetBtn.addEventListener("click", resetScore);
  }

  // Keyboard support: Space / Enter to reveal and proceed
  document.addEventListener("keydown", function (e) {
    var panel = document.getElementById("panel-time");
    if (!panel || !panel.classList.contains("active")) return;
    if (document.body.classList.contains("modal-open")) return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

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
  nextQuestion();
})();
