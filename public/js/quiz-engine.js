// Общий "движок" для обоих режимов тренажёра (числа и слова).
// Каждый режим передаёт сюда только то, что у него уникально:
// - pickNext(state): выбрать следующий вопрос, вернуть произвольный объект
//   (или null/undefined, если вопросов нет — например, не выбрано ни одной категории)
// - render(current, elements): вывести вопрос на экран
// - checkAnswer(userValue, current): вернуть { isCorrect, correctText }
// - onEmpty(): необязательно, вызывается когда pickNext ничего не вернул
// - weightId(current): необязательно, вернуть строковый id вопроса для
//   режима "умный подбор" — по этому id копится счётчик ошибок
(function (global) {
  var STORAGE_PREFIX = "german-trainer-stats-";
  var WEIGHTS_PREFIX = "german-trainer-weights-";

  // ---- умный подбор: хранение "сколько раз подряд/всего ошибались" по id ----
  // Данные живут в localStorage браузера (как и счёт/тема) — это не куки,
  // но работает точно так же: сохраняется на этом устройстве между визитами.

  function getWeights(prefix) {
    try {
      var raw = localStorage.getItem(WEIGHTS_PREFIX + prefix);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveWeights(prefix, weights) {
    try {
      localStorage.setItem(WEIGHTS_PREFIX + prefix, JSON.stringify(weights));
    } catch (e) {
      // недоступно — не критично
    }
  }

  function updateWeight(prefix, id, isCorrect) {
    if (!id) return;
    var weights = getWeights(prefix);
    var current = weights[id] || 0;
    if (isCorrect) {
      current = Math.max(0, current - 1);
    } else {
      current = current + 2;
    }
    if (current === 0) {
      delete weights[id];
    } else {
      weights[id] = current;
    }
    saveWeights(prefix, weights);
  }

  // Полностью стирает накопленную статистику ошибок для режима (num/word) —
  // используется кнопкой "Сбросить статистику ошибок" в параметрах.
  function resetWeights(prefix) {
    try {
      localStorage.removeItem(WEIGHTS_PREFIX + prefix);
    } catch (e) {
      // недоступно — не критично
    }
  }

  // На сколько единиц веса добавляет одна "ошибка" (см. updateWeight выше).
  var BOOST_PER_MISTAKE = 3;
  // Суммарный "лишний" вес от всех вопросов с ошибками не может превышать
  // вес обычной (безошибочной) выборки — то есть вероятность вытащить
  // какой-нибудь "слабый" вопрос ограничена примерно 50%, сколько бы в нём
  // ни было ошибок и как бы мала ни была сама выборка. Без этого одно и то
  // же слово в маленькой категории могло бы выпадать почти в каждом вопросе,
  // и чем чаще оно выпадает — тем выше шанс снова ошибиться и раздуть вес
  // ещё сильнее.
  var MAX_EXTRA_RATIO = 1;

  // Взвешенный случайный выбор из массива items.
  // idFn(item) -> строковый id, weights[id] -> "сколько ошибок" (0 если нет записи).
  // excludeId — id последнего вопроса (строка!), чтобы не повторять его подряд (если возможно).
  function weightedPick(items, idFn, weights, excludeId) {
    if (items.length === 0) return null;
    if (items.length === 1) return items[0];
    var candidates = items;
    if (excludeId != null) {
      var filtered = items.filter(function (it) { return idFn(it) !== excludeId; });
      if (filtered.length > 0) candidates = filtered;
    }

    var baseline = candidates.length; // у каждого вопроса базовый вес 1
    var rawExtras = candidates.map(function (it) {
      return (weights[idFn(it)] || 0) * BOOST_PER_MISTAKE;
    });
    var totalExtra = rawExtras.reduce(function (s, e) { return s + e; }, 0);
    var maxExtra = baseline * MAX_EXTRA_RATIO;
    // Если суммарный "бонус" от ошибок больше разрешённого — пропорционально
    // уменьшаем его для всех сразу (соотношение между самими слабыми
    // вопросами при этом сохраняется).
    var scale = totalExtra > maxExtra && totalExtra > 0 ? maxExtra / totalExtra : 1;

    var total = 0;
    var weighted = rawExtras.map(function (extra, idx) {
      var w = 1 + extra * scale;
      total += w;
      return { item: candidates[idx], w: w };
    });

    var r = Math.random() * total;
    for (var i = 0; i < weighted.length; i++) {
      r -= weighted[i].w;
      if (r <= 0) return weighted[i].item;
    }
    return weighted[weighted.length - 1].item;
  }

  function createQuiz(options) {
    var prefix = options.prefix;
    var storageKey = STORAGE_PREFIX + prefix;
    var ids = {
      prevResult: prefix + "-prev-result",
      qmode: prefix + "-qmode",
      question: prefix + "-question",
      answer: prefix + "-answer",
      feedback: prefix + "-feedback",
      checkBtn: prefix + "-check-btn",
      nextBtn: prefix + "-next-btn",
      resetBtn: prefix + "-reset-btn",
      scoreCorrect: prefix + "-score-correct",
      scoreTotal: prefix + "-score-total",
      scorePercent: prefix + "-score-percent",
      streak: prefix + "-streak",
      bestStreak: prefix + "-best-streak"
    };

    var state = {
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      answered: false,
      lastResult: null,
      current: null // текущий вопрос, формат задаёт сам режим (числа/слова)
    };

    function el(id) {
      return document.getElementById(id);
    }

    // ---- сохранение счёта/серии между перезагрузками страницы ----

    function loadSavedStats() {
      try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        var saved = JSON.parse(raw);
        if (typeof saved.correct === "number") state.correct = saved.correct;
        if (typeof saved.total === "number") state.total = saved.total;
        if (typeof saved.streak === "number") state.streak = saved.streak;
        if (typeof saved.bestStreak === "number") state.bestStreak = saved.bestStreak;
      } catch (e) {
        // localStorage недоступен (приватный режим и т.п.) или данные повреждены — просто игнорируем
      }
    }

    function saveStats() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          correct: state.correct,
          total: state.total,
          streak: state.streak,
          bestStreak: state.bestStreak
        }));
      } catch (e) {
        // недоступно — не критично, просто не переживёт перезагрузку
      }
    }

    function renderScoreUI() {
      var percent = state.total === 0 ? 0 : Math.round((state.correct / state.total) * 100);
      el(ids.scoreCorrect).textContent = state.correct;
      el(ids.scoreTotal).textContent = state.total;
      el(ids.scorePercent).textContent = percent + "%";
      el(ids.streak).textContent = state.streak;
      el(ids.bestStreak).textContent = state.bestStreak;
    }

    function evaluateCurrent() {
      if (state.answered || !state.current) return;
      var userVal = el(ids.answer).value;
      var result = options.checkAnswer(userVal, state.current);
      state.answered = true;
      state.total += 1;
      if (result.isCorrect) {
        state.correct += 1;
        state.streak += 1;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      } else {
        state.streak = 0;
      }
      state.lastResult = { correct: result.isCorrect, answerText: result.correctText };
      renderScoreUI();
      saveStats();
      if (options.weightId) {
        var wid = options.weightId(state.current);
        if (wid) updateWeight(prefix, wid, result.isCorrect);
      }
    }

    function showFeedbackForCurrent() {
      var fbEl = el(ids.feedback);
      var ansEl = el(ids.answer);
      if (!state.lastResult) return;
      if (state.lastResult.correct) {
        fbEl.textContent = "Верно: " + state.lastResult.answerText;
        fbEl.style.color = "var(--success)";
        ansEl.style.borderColor = "var(--success-border)";
      } else {
        fbEl.textContent = "Неверно. Правильно: " + state.lastResult.answerText;
        fbEl.style.color = "var(--danger)";
        ansEl.style.borderColor = "var(--danger-border)";
      }
    }

    function renderPrevResult() {
      var prevEl = el(ids.prevResult);
      if (!state.lastResult) {
        prevEl.textContent = "";
        return;
      }
      if (state.lastResult.correct) {
        prevEl.textContent = "Прошлый ответ верный: " + state.lastResult.answerText;
        prevEl.style.color = "var(--success)";
      } else {
        prevEl.textContent = "Прошлый ответ неверный. Было: " + state.lastResult.answerText;
        prevEl.style.color = "var(--danger)";
      }
    }

    // skipEvaluation=true используется при самом первом вопросе и при смене
    // настроек (категории/диапазоны) — чтобы не засчитывать "неответ" как ошибку.
    function newQuestion(skipEvaluation) {
      if (!skipEvaluation && !state.answered && state.current) evaluateCurrent();
      if (!skipEvaluation) renderPrevResult();

      var next = options.pickNext(state);
      if (!next) {
        state.current = null;
        if (options.onEmpty) options.onEmpty();
        return;
      }
      state.current = next;
      state.answered = false;

      var ansEl = el(ids.answer);
      var fbEl = el(ids.feedback);
      ansEl.value = "";
      fbEl.textContent = "";
      ansEl.style.borderColor = "";

      options.render(next, {
        qEl: el(ids.question),
        modeEl: el(ids.qmode),
        ansEl: ansEl
      });
      ansEl.focus();
    }

    function resetScore() {
      state.correct = 0;
      state.total = 0;
      state.streak = 0;
      state.bestStreak = 0;
      renderScoreUI();
      saveStats();
    }

    loadSavedStats();
    renderScoreUI();

    el(ids.checkBtn).addEventListener("click", function () {
      evaluateCurrent();
      showFeedbackForCurrent();
    });
    // Обязательно оборачиваем в function(){}: если передать newQuestion
    // напрямую в addEventListener, браузер подставит объект события первым
    // аргументом, и он будет воспринят как skipEvaluation === true.
    el(ids.nextBtn).addEventListener("click", function () { newQuestion(); });
    el(ids.resetBtn).addEventListener("click", resetScore);
    el(ids.answer).addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        if (!state.answered) {
          evaluateCurrent();
          showFeedbackForCurrent();
        } else {
          newQuestion();
        }
      }
    });

    return {
      state: state,
      newQuestion: newQuestion,
      resetScore: resetScore
    };
  }

  global.QuizEngine = {
    create: createQuiz,
    getWeights: getWeights,
    weightedPick: weightedPick,
    resetWeights: resetWeights
  };
})(window);
