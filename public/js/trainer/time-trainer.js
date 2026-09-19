/**
 * Time Trainer Controller
 */
import { generateClockSvg, getTimeInfo, pad2 } from "./time-generator.js";
import { safeGetItem, safeSetItem } from "./utils.js";

const TIME_SETTINGS_KEY = "german-trainer-time-settings-v2";
const TIME_STATS_KEY = "german-trainer-time-stats-v2";

export class TimeTrainer {
  constructor() {
    this.settings = safeGetItem(TIME_SETTINGS_KEY, {
      granularity: "15",
      hourFormat: "24",
      colloquialOnly: true,
      dirs: ["time2words", "words2time"]
    });

    this.stats = safeGetItem(TIME_STATS_KEY, {
      total: 0,
      streak: 0,
      bestStreak: 0
    });

    this.currentState = {
      current: null,
      revealed: false
    };

    this.init();
  }

  el(id) {
    return document.getElementById(id);
  }

  init() {
    this.applySettingsToUI();
    this.renderScoreUI();
    this.bindEvents();
    this.nextQuestion();
  }

  renderScoreUI() {
    const elTotal = this.el("time-score-total");
    const elStreak = this.el("time-streak");
    const elBest = this.el("time-best-streak");

    if (elTotal) elTotal.textContent = this.stats.total;
    if (elStreak) elStreak.textContent = this.stats.streak;
    if (elBest) elBest.textContent = this.stats.bestStreak;
  }

  resetScore() {
    this.stats.total = 0;
    this.stats.streak = 0;
    this.stats.bestStreak = 0;
    this.renderScoreUI();
    safeSetItem(TIME_STATS_KEY, this.stats);
  }

  generateTimePool() {
    const pool = [];
    const step = parseInt(this.settings.granularity, 10) || 15;
    const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

    hours.forEach((h) => {
      if (step === 1) {
        for (let m = 0; m < 60; m++) {
          pool.push(getTimeInfo(h, m));
        }
      } else {
        for (let m = 0; m < 60; m += step) {
          pool.push(getTimeInfo(h, m));
        }
      }
    });

    return pool;
  }

  pickRandomTime(pool, lastId) {
    if (!pool || pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    const filtered = pool.filter((t) => t.id !== lastId);
    const candidates = filtered.length > 0 ? filtered : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  nextQuestion() {
    const dirs = this.settings.dirs?.length > 0 ? this.settings.dirs : ["time2words", "words2time"];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];

    const pool = this.generateTimePool();
    const lastId = this.currentState.current ? this.currentState.current.time.id : null;
    const time = this.pickRandomTime(pool, lastId);
    if (!time) return;

    this.currentState.current = { time, dir };
    this.currentState.revealed = false;

    const elFeedback = this.el("time-feedback");
    const elRevealBtn = this.el("time-reveal-btn");
    const elPresAnswerCard = this.el("time-pres-answer-card");
    const elPresActions = this.el("time-pres-actions");

    if (elFeedback) elFeedback.innerHTML = "";
    if (elRevealBtn) elRevealBtn.style.display = "inline-block";
    if (elPresAnswerCard) {
      elPresAnswerCard.style.display = "none";
      elPresAnswerCard.innerHTML = "";
    }
    if (elPresActions) elPresActions.style.display = "none";

    this.renderQuestion();
  }

  renderQuestion() {
    const cur = this.currentState.current;
    if (!cur) return;

    const elModeEl = this.el("time-qmode");
    const elQuestionCont = this.el("time-question-container");

    if (cur.dir === "time2words") {
      if (elModeEl) elModeEl.textContent = "Время → немецкие слова";
      const digitalStr = this.settings.hourFormat === "12" ? cur.time.digital12 : cur.time.digital24;

      if (elQuestionCont) {
        elQuestionCont.innerHTML = `<div class="time-both-container">
          ${generateClockSvg(cur.time.h24, cur.time.m, 130)}
          <div class="time-digital-display time-digital-sub">${digitalStr}</div>
        </div>`;
      }
    } else {
      if (elModeEl) elModeEl.textContent = "Немецкие слова → время";
      if (elQuestionCont) {
        elQuestionCont.innerHTML = `<div class="question" style="font-size: 28px; line-height: 1.35;">${cur.time.primaryColloquial}</div>`;
      }
    }
  }

  revealPresentation() {
    if (this.currentState.revealed || !this.currentState.current) return;
    this.currentState.revealed = true;
    const cur = this.currentState.current;

    let cardContent = "";
    if (cur.dir === "time2words") {
      cardContent = `<div class="pres-main-text" style="color: var(--accent);">${cur.time.primaryColloquial}</div>
        <div class="pres-sub-text" style="margin-top: 4px; font-weight: 500;">${cur.time.digital24} • Официально: <span style="color: var(--text-primary);">${cur.time.official}</span></div>`;
    } else {
      const clockHtml = generateClockSvg(cur.time.h24, cur.time.m, 110);
      let infoDetail = `${cur.time.digital24} • Официально: ${cur.time.official}`;
      if (cur.time.isKurz && cur.time.validMinutes?.length > 1) {
        const minM = cur.time.validMinutes[0];
        const maxM = cur.time.validMinutes[cur.time.validMinutes.length - 1];
        const targetH = pad2(cur.time.h24);
        infoDetail = `Диапазон: ${targetH}:${pad2(minM)}–${targetH}:${pad2(maxM)} • ${infoDetail}`;
      }

      cardContent = `<div class="time-digital-display" style="font-size: 26px; padding: 4px 14px; margin-bottom: 6px;">${cur.time.digital24}</div>
        ${clockHtml}
        <div class="pres-sub-text" style="margin-top: 6px; font-size: 13px;">${infoDetail}</div>`;
    }

    const elPresAnswerCard = this.el("time-pres-answer-card");
    const elRevealBtn = this.el("time-reveal-btn");
    const elPresActions = this.el("time-pres-actions");

    if (elPresAnswerCard) {
      elPresAnswerCard.innerHTML = cardContent;
      elPresAnswerCard.style.display = "flex";
    }
    if (elRevealBtn) elRevealBtn.style.display = "none";
    if (elPresActions) elPresActions.style.display = "flex";

    this.stats.total += 1;
    this.stats.streak += 1;
    if (this.stats.streak > this.stats.bestStreak) {
      this.stats.bestStreak = this.stats.streak;
    }
    this.renderScoreUI();
    safeSetItem(TIME_STATS_KEY, this.stats);
  }

  applySettingsToUI() {
    const granSelect = this.el("time-granularity-select");
    if (granSelect) granSelect.value = this.settings.granularity;

    const hrFormat = this.el("time-hour-format-select");
    if (hrFormat) hrFormat.value = this.settings.hourFormat;

    document.querySelectorAll(".time-dir-cb").forEach((cb) => {
      cb.checked = this.settings.dirs.includes(cb.value);
    });
  }

  saveSettingsFromUI() {
    const granSelect = this.el("time-granularity-select");
    const hrFormat = this.el("time-hour-format-select");

    const checkedDirs = Array.from(document.querySelectorAll(".time-dir-cb:checked")).map((cb) => cb.value);

    this.settings.granularity = granSelect ? granSelect.value : "15";
    this.settings.hourFormat = hrFormat ? hrFormat.value : "24";
    this.settings.dirs = checkedDirs.length > 0 ? checkedDirs : ["time2words", "words2time"];

    safeSetItem(TIME_SETTINGS_KEY, this.settings);
    this.nextQuestion();
  }

  bindEvents() {
    this.el("time-reveal-btn")?.addEventListener("click", () => this.revealPresentation());
    this.el("time-pres-next-btn")?.addEventListener("click", () => this.nextQuestion());

    this.el("time-reset-btn")?.addEventListener("click", () => {
      if (confirm("Сбросить статистику времени?")) {
        this.resetScore();
      }
    });

    this.el("time-granularity-select")?.addEventListener("change", () => this.saveSettingsFromUI());
    this.el("time-hour-format-select")?.addEventListener("change", () => this.saveSettingsFromUI());

    document.querySelectorAll(".time-dir-cb").forEach((cb) => {
      cb.addEventListener("change", () => this.saveSettingsFromUI());
    });
  }
}
