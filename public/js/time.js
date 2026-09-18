(function () {
  var SETTINGS_KEY = "german-trainer-time-settings";
  var STATS_KEY = "german-trainer-stats-time";

  function pad2(n) {
    return window.GermanTime ? window.GermanTime.pad2(n) : (n < 10 ? "0" + n : String(n));
  }

  function generateClockSvg(hours, minutes, size) {
    return window.GermanTime ? window.GermanTime.generateClockSvg(hours, minutes, size) : "";
  }

  function getTimeInfo(h24, m) {
    return window.GermanTime ? window.GermanTime.getTimeInfo(h24, m) : { id: h24 + ":" + m };
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
