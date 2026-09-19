/**
 * Numbers Trainer Controller
 */
import { numberToGerman } from "./numbers-generator.js";
import { QuizEngine } from "./quiz-engine.js";
import { normalizeString, safeGetItem, safeSetItem } from "./utils.js";

const SMART_KEY = "german-trainer-smart-num";
const RANGES_KEY = "german-trainer-num-ranges";
const DIRS_KEY = "german-trainer-num-dirs";

export class NumbersTrainer {
  constructor() {
    this.quiz = null;
    this.init();
  }

  init() {
    this.loadRanges();
    this.loadDirs();

    const smartCb = document.getElementById("num-smart-cb");
    if (smartCb) {
      smartCb.checked = safeGetItem(SMART_KEY, false) === true;
    }

    this.quiz = new QuizEngine({
      prefix: "num",
      pickNext: (state) => this.pickNext(state),
      render: (current, elements) => this.render(current, elements),
      checkAnswer: (userVal, current) => this.checkAnswer(userVal, current),
      weightId: (current) => String(current.number),
      onEmpty: () => this.setQuizEnabled(false)
    });

    this.bindEvents();
    this.quiz.newQuestion(true);
  }

  getRanges() {
    const boxes = document.querySelectorAll(".num-range-cb:checked");
    return Array.from(boxes).map((b) => b.value);
  }

  getDirs() {
    const boxes = document.querySelectorAll(".num-dir-cb:checked");
    const dirs = Array.from(boxes).map((b) => b.value);
    return dirs.length === 0 ? ["n2w"] : dirs;
  }

  numbersInRanges(ranges) {
    const nums = [];
    ranges.forEach((r) => {
      const [start, end] = r.split("-").map(Number);
      for (let n = start; n <= end; n++) nums.push(n);
    });
    return nums;
  }

  pickNumber(ranges, lastNumber) {
    const pool = this.numbersInRanges(ranges);
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    const filtered = pool.filter((n) => n !== lastNumber);
    const candidates = filtered.length > 0 ? filtered : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  pickNumberSmart(ranges, weights, lastNumber) {
    const pool = this.numbersInRanges(ranges);
    if (pool.length === 0) return null;
    const excludeId = lastNumber != null ? String(lastNumber) : null;
    return QuizEngine.weightedPick(pool, (n) => String(n), weights, excludeId);
  }

  loadRanges() {
    const saved = safeGetItem(RANGES_KEY, null);
    if (Array.isArray(saved)) {
      document.querySelectorAll(".num-range-cb").forEach((cb) => {
        cb.checked = saved.includes(cb.value);
      });
    }
  }

  saveRanges() {
    safeSetItem(RANGES_KEY, this.getRanges());
  }

  loadDirs() {
    const saved = safeGetItem(DIRS_KEY, null);
    if (Array.isArray(saved)) {
      document.querySelectorAll(".num-dir-cb").forEach((cb) => {
        cb.checked = saved.includes(cb.value);
      });
    }
  }

  saveDirs() {
    safeSetItem(DIRS_KEY, this.getDirs());
  }

  setQuizEnabled(enabled) {
    const area = document.querySelector("#panel-numbers .quiz");
    if (area) {
      area.style.opacity = enabled ? "1" : "0.4";
      area.style.pointerEvents = enabled ? "auto" : "none";
    }
  }

  onSettingsChanged() {
    this.saveRanges();
    this.saveDirs();
    const ranges = this.getRanges();
    if (ranges.length === 0) {
      this.setQuizEnabled(false);
      const qEl = document.getElementById("num-question");
      const modeEl = document.getElementById("num-qmode");
      if (qEl) qEl.textContent = "—";
      if (modeEl) modeEl.textContent = "Выбери хотя бы один диапазон чисел";
      return;
    }
    this.setQuizEnabled(true);
    this.quiz.newQuestion(true);
  }

  pickNext(state) {
    const ranges = this.getRanges();
    if (ranges.length === 0) return null;

    const dirs = this.getDirs();
    const lastNumber = state.current ? state.current.number : null;
    const smartCb = document.getElementById("num-smart-cb");
    const isSmart = smartCb && smartCb.checked;

    const number = isSmart
      ? this.pickNumberSmart(ranges, QuizEngine.getWeights("num"), lastNumber)
      : this.pickNumber(ranges, lastNumber);

    if (number == null) return null;
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    return { number, dir };
  }

  render(current, elements) {
    if (current.dir === "n2w") {
      if (elements.modeEl) elements.modeEl.textContent = "Число → слово";
      if (elements.qEl) elements.qEl.textContent = String(current.number);
      if (elements.ansEl) elements.ansEl.placeholder = "";
    } else {
      if (elements.modeEl) elements.modeEl.textContent = "Слово → число";
      if (elements.qEl) elements.qEl.textContent = numberToGerman(current.number);
      if (elements.ansEl) elements.ansEl.placeholder = "";
    }
  }

  checkAnswer(userVal, current) {
    let correctText = "";
    let isCorrect = false;

    if (current.dir === "n2w") {
      correctText = numberToGerman(current.number);
      isCorrect = normalizeString(userVal) === normalizeString(correctText);
    } else {
      correctText = String(current.number);
      isCorrect = (userVal || "").trim() === correctText;
    }

    return { isCorrect, correctText };
  }

  bindEvents() {
    document.querySelectorAll(".num-range-cb").forEach((cb) => {
      cb.addEventListener("change", () => this.onSettingsChanged());
    });

    document.querySelectorAll(".num-dir-cb").forEach((cb) => {
      cb.addEventListener("change", () => this.onSettingsChanged());
    });

    const smartCb = document.getElementById("num-smart-cb");
    smartCb?.addEventListener("change", () => {
      safeSetItem(SMART_KEY, smartCb.checked);
      this.onSettingsChanged();
    });

    const resetWeightsBtn = document.getElementById("num-weights-reset-btn");
    resetWeightsBtn?.addEventListener("click", () => {
      if (!confirm("Сбросить статистику ошибок для чисел? Умный подбор начнёт заново.")) return;
      QuizEngine.resetWeights("num");
      this.onSettingsChanged();
    });
  }
}
