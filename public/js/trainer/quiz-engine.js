/**
 * Core Quiz Engine Module for German Trainer
 */
import { formatGermanGender, safeGetItem, safeSetItem, safeRemoveItem } from "./utils.js";

const STORAGE_PREFIX = "german-trainer-stats-";
const WEIGHTS_PREFIX = "german-trainer-weights-";
const BOOST_PER_MISTAKE = 3;
const MAX_EXTRA_RATIO = 1;

export class QuizEngine {
  static getWeights(prefix) {
    return safeGetItem(WEIGHTS_PREFIX + prefix, {}) || {};
  }

  static saveWeights(prefix, weights) {
    safeSetItem(WEIGHTS_PREFIX + prefix, weights);
  }

  static updateWeight(prefix, id, isCorrect) {
    if (!id) return;
    const weights = QuizEngine.getWeights(prefix);
    let current = weights[id] || 0;
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
    QuizEngine.saveWeights(prefix, weights);
  }

  static resetWeights(prefix) {
    safeRemoveItem(WEIGHTS_PREFIX + prefix);
  }

  static weightedPick(items, idFn, weights, excludeId = null) {
    if (!items || items.length === 0) return null;
    if (items.length === 1) return items[0];

    let candidates = items;
    if (excludeId != null) {
      const filtered = items.filter((it) => idFn(it) !== excludeId);
      if (filtered.length > 0) candidates = filtered;
    }

    const baseline = candidates.length;
    const rawExtras = candidates.map((it) => (weights[idFn(it)] || 0) * BOOST_PER_MISTAKE);
    const totalExtra = rawExtras.reduce((s, e) => s + e, 0);
    const maxExtra = baseline * MAX_EXTRA_RATIO;
    const scale = totalExtra > maxExtra && totalExtra > 0 ? maxExtra / totalExtra : 1;

    let total = 0;
    const weighted = rawExtras.map((extra, idx) => {
      const w = 1 + extra * scale;
      total += w;
      return { item: candidates[idx], w };
    });

    let r = Math.random() * total;
    for (let i = 0; i < weighted.length; i++) {
      r -= weighted[i].w;
      if (r <= 0) return weighted[i].item;
    }
    return weighted[weighted.length - 1].item;
  }

  constructor(options) {
    this.options = options;
    this.prefix = options.prefix;
    this.storageKey = STORAGE_PREFIX + this.prefix;

    this.ids = {
      prevResult: `${this.prefix}-prev-result`,
      qmode: `${this.prefix}-qmode`,
      question: `${this.prefix}-question`,
      answer: `${this.prefix}-answer`,
      feedback: `${this.prefix}-feedback`,
      checkBtn: `${this.prefix}-check-btn`,
      nextBtn: `${this.prefix}-next-btn`,
      resetBtn: `${this.prefix}-reset-btn`,
      scoreCorrect: `${this.prefix}-score-correct`,
      scoreTotal: `${this.prefix}-score-total`,
      scorePercent: `${this.prefix}-score-percent`,
      streak: `${this.prefix}-streak`,
      bestStreak: `${this.prefix}-best-streak`
    };

    this.state = {
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      answered: false,
      lastResult: null,
      current: null
    };

    this.init();
  }

  el(id) {
    return document.getElementById(id);
  }

  init() {
    this.loadSavedStats();
    this.renderScoreUI();
    this.bindEvents();
  }

  loadSavedStats() {
    const saved = safeGetItem(this.storageKey);
    if (saved && typeof saved === "object") {
      if (typeof saved.correct === "number") this.state.correct = saved.correct;
      if (typeof saved.total === "number") this.state.total = saved.total;
      if (typeof saved.streak === "number") this.state.streak = saved.streak;
      if (typeof saved.bestStreak === "number") this.state.bestStreak = saved.bestStreak;
    }
  }

  saveStats() {
    safeSetItem(this.storageKey, {
      correct: this.state.correct,
      total: this.state.total,
      streak: this.state.streak,
      bestStreak: this.state.bestStreak
    });
  }

  renderScoreUI() {
    const percent = this.state.total === 0 ? 0 : Math.round((this.state.correct / this.state.total) * 100);
    const setT = (id, val) => {
      const elem = this.el(id);
      if (elem) elem.textContent = val;
    };

    setT(this.ids.scoreCorrect, this.state.correct);
    setT(this.ids.scoreTotal, this.state.total);
    setT(this.ids.scorePercent, `${percent}%`);
    setT(this.ids.streak, this.state.streak);
    setT(this.ids.bestStreak, this.state.bestStreak);
  }

  evaluateCurrent() {
    if (this.state.answered || !this.state.current) return;
    const ansEl = this.el(this.ids.answer);
    const userVal = ansEl ? ansEl.value : "";
    const result = this.options.checkAnswer(userVal, this.state.current);

    this.state.answered = true;
    this.state.total += 1;
    if (result.isCorrect) {
      this.state.correct += 1;
      this.state.streak += 1;
      if (this.state.streak > this.state.bestStreak) {
        this.state.bestStreak = this.state.streak;
      }
    } else {
      this.state.streak = 0;
    }

    this.state.lastResult = {
      correct: result.isCorrect,
      answerText: result.correctText,
      extraFeedback: result.extraFeedback || "",
      srsInfo: result.srsInfo
    };

    this.renderScoreUI();
    this.saveStats();

    if (this.options.weightId) {
      const wid = this.options.weightId(this.state.current);
      if (wid) QuizEngine.updateWeight(this.prefix, wid, result.isCorrect);
    }
  }

  showFeedbackForCurrent() {
    const fbEl = this.el(this.ids.feedback);
    const ansEl = this.el(this.ids.answer);
    if (!this.state.lastResult || !fbEl) return;

    const formatted = formatGermanGender(this.state.lastResult.answerText);
    let srsNote = "";

    if (this.state.lastResult.srsInfo) {
      const srs = this.state.lastResult.srsInfo;
      let dirLabel = "Русский → немецкий";
      if (this.state.current && this.state.current.dir === "de2ru") {
        dirLabel = "Немецкий → русский";
      } else if (this.state.current && this.state.current.formTarget === "plural") {
        dirLabel = "Русский → немецкий (мн. ч.)";
      } else if (this.state.current && this.state.current.word && this.state.current.word.plural) {
        dirLabel = "Русский → немецкий (ед. ч.)";
      }

      if (this.state.lastResult.correct) {
        if (srs.newBox === 5) {
          srsNote = `<br><small style="color: #099268; font-weight: 600;">🏆 ${dirLabel} Выучено! (${srs.levelName} — повтор через ${srs.intervalDays} дн.)</small>`;
        } else {
          srsNote = `<br><small style="color: var(--primary);">${dirLabel} Перемещено на Уровень ${srs.newBox} (${srs.levelName} — повтор через ${srs.intervalDays} дн.)</small>`;
        }
      } else {
        srsNote = `<br><small style="color: #d9480f;">🌱 ${dirLabel} Вернулось на Уровень 1 (Новое — повтор сегодня)</small>`;
      }
    }

    const extraFbHtml = this.state.lastResult.extraFeedback
      ? `<div style="font-size: 13px; color: #d9480f; margin-top: 4px;">${this.state.lastResult.extraFeedback}</div>`
      : "";

    if (this.state.lastResult.correct) {
      fbEl.innerHTML = `Верно: ${formatted}${srsNote}`;
      fbEl.style.color = "var(--success)";
      if (ansEl) ansEl.style.borderColor = "var(--success-border)";
    } else {
      fbEl.innerHTML = `Неверно. Правильно: ${formatted}${extraFbHtml}${srsNote}`;
      fbEl.style.color = "var(--danger)";
      if (ansEl) ansEl.style.borderColor = "var(--danger-border)";
    }
  }

  renderPrevResult() {
    const prevEl = this.el(this.ids.prevResult);
    if (!prevEl) return;
    if (!this.state.lastResult) {
      prevEl.innerHTML = "";
      return;
    }

    const formatted = formatGermanGender(this.state.lastResult.answerText);
    if (this.state.lastResult.correct) {
      prevEl.innerHTML = `Прошлый ответ верный: ${formatted}`;
      prevEl.style.color = "var(--success)";
    } else {
      prevEl.innerHTML = `Прошлый ответ неверный. Было: ${formatted}`;
      prevEl.style.color = "var(--danger)";
    }
  }

  newQuestion(skipEvaluation = false) {
    if (!skipEvaluation && !this.state.answered && this.state.current) {
      this.evaluateCurrent();
    }
    if (!skipEvaluation) {
      this.renderPrevResult();
    }

    const next = this.options.pickNext(this.state);
    if (!next) {
      this.state.current = null;
      if (this.options.onEmpty) this.options.onEmpty();
      return;
    }

    this.state.current = next;
    this.state.answered = false;

    const ansEl = this.el(this.ids.answer);
    const fbEl = this.el(this.ids.feedback);
    if (ansEl) {
      ansEl.value = "";
      ansEl.style.borderColor = "";
    }
    if (fbEl) {
      fbEl.innerHTML = "";
    }

    this.options.render(next, {
      qEl: this.el(this.ids.question),
      modeEl: this.el(this.ids.qmode),
      ansEl: ansEl
    });

    if (ansEl) ansEl.focus();
  }

  resetScore() {
    this.state.correct = 0;
    this.state.total = 0;
    this.state.streak = 0;
    this.state.bestStreak = 0;
    this.renderScoreUI();
    this.saveStats();
  }

  bindEvents() {
    const checkBtn = this.el(this.ids.checkBtn);
    const nextBtn = this.el(this.ids.nextBtn);
    const resetBtn = this.el(this.ids.resetBtn);
    const ansEl = this.el(this.ids.answer);

    checkBtn?.addEventListener("click", () => {
      this.evaluateCurrent();
      this.showFeedbackForCurrent();
    });

    nextBtn?.addEventListener("click", () => {
      this.newQuestion();
    });

    resetBtn?.addEventListener("click", () => {
      this.resetScore();
    });

    ansEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (!this.state.answered) {
          this.evaluateCurrent();
          this.showFeedbackForCurrent();
        } else {
          this.newQuestion();
        }
      }
    });
  }
}
