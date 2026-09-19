/**
 * Verbs Trainer Controller
 */
import { KNOWN_VERBS_DICT, conjugateRegular } from "../admin/admin-verbs-data.js";
import { formatGermanGender, safeGetItem, safeSetItem } from "./utils.js";

const VERB_TYPE_KEY = "german-trainer-verb-type-v2";
const VERB_MODE_KEY = "german-trainer-verb-mode-v2";
const VERB_SRS_KEY = "german-trainer-verb-srs-v2";
const VERB_SRS_ENABLED_KEY = "german-trainer-verb-srs-on-v2";
const VERB_STATS_KEY = "german-trainer-stats-verb-v2";

const PRONOUNS = [
  { key: "ich", de: "ich", ru: "я" },
  { key: "du", de: "du", ru: "ты", highlight: true },
  { key: "er", de: "er/sie/es", ru: "он / она / оно", highlight: true },
  { key: "wir", de: "wir", ru: "мы" },
  { key: "ihr", de: "ihr", ru: "вы" },
  { key: "sie", de: "sie/Sie", ru: "они / Вы" }
];

const LEVEL_INTERVALS = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14
};

const LEVEL_BADGES = {
  1: { name: "🌱 Уровень 1 (сегодня)", shortName: "Ур. 1", cls: "box-1" },
  2: { name: "🌿 Уровень 2 (1 день)", shortName: "Ур. 2", cls: "box-2" },
  3: { name: "🌳 Уровень 3 (3 дня)", shortName: "Ур. 3", cls: "box-3" },
  4: { name: "🌲 Уровень 4 (7 дней)", shortName: "Ур. 4", cls: "box-4" },
  5: { name: "🏆 Уровень 5 (выучено)", shortName: "Ур. 5", cls: "box-5" }
};

const DAY_MS = 24 * 60 * 60 * 1000;

export class VerbsTrainer {
  constructor() {
    this.allVerbs = [];
    this.irregularVerbs = [];
    this.regularVerbs = [];
    this.activePool = [];

    this.currentUnit = null;
    this.lastUnitKey = null;
    this.isAnswerChecked = false;
    this.lastResult = null;

    this.currentVerbType = safeGetItem(VERB_TYPE_KEY, "irregular");
    this.currentQuizMode = safeGetItem(VERB_MODE_KEY, "input");
    this.srsEnabled = safeGetItem(VERB_SRS_ENABLED_KEY, true) !== false;

    this.stats = safeGetItem(VERB_STATS_KEY, {
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0
    });

    this.init();
  }

  el(id) {
    return document.getElementById(id);
  }

  init() {
    this.renderStats();
    this.bindEvents();
    this.loadVerbs();
  }

  getSrsStore() {
    return safeGetItem(VERB_SRS_KEY, {}) || {};
  }

  saveSrsStore(data) {
    safeSetItem(VERB_SRS_KEY, data);
  }

  getFormKey(verbId, pronounKey) {
    return `${verbId || ""}_${pronounKey || ""}`;
  }

  getFormSrs(verbId, pronounKey) {
    if (!verbId || !pronounKey) {
      return { box: 1, nextReview: 0, reviews: 0, mistakes: 0, lastReviewed: 0 };
    }
    const store = this.getSrsStore();
    const key = this.getFormKey(verbId, pronounKey);
    return store[key] || { box: 1, nextReview: 0, reviews: 0, mistakes: 0, lastReviewed: 0 };
  }

  updateFormSrs(verbId, pronounKey, isCorrect) {
    if (!verbId || !pronounKey || !this.srsEnabled) return null;
    const store = this.getSrsStore();
    const key = this.getFormKey(verbId, pronounKey);
    const record = this.getFormSrs(verbId, pronounKey);

    const now = Date.now();
    const oldBox = record.box || 1;
    let newBox = oldBox;
    record.reviews = (record.reviews || 0) + 1;
    record.lastReviewed = now;

    if (isCorrect) {
      newBox = Math.min(5, oldBox + 1);
      record.box = newBox;
      const intervalDays = LEVEL_INTERVALS[newBox];
      record.nextReview = now + intervalDays * DAY_MS;
    } else {
      newBox = 1;
      record.box = 1;
      record.mistakes = (record.mistakes || 0) + 1;
      record.nextReview = now;
    }

    store[key] = record;
    this.saveSrsStore(store);

    return {
      oldBox,
      newBox,
      levelName: LEVEL_BADGES[newBox].name,
      intervalDays: LEVEL_INTERVALS[newBox]
    };
  }

  async loadVerbs() {
    try {
      const res = await fetch("/api/words");
      if (!res.ok) throw new Error("API error");
      const words = await res.json();
      this.classifyVerbs(words);
    } catch {
      this.classifyVerbs([]);
    }
    this.applyVerbTypeFilter(this.currentVerbType);
    this.renderCheatsheet();
    this.nextQuestion(true);
  }

  classifyVerbs(words) {
    this.allVerbs = [];
    this.irregularVerbs = [];
    this.regularVerbs = [];
    const seen = new Map();

    (words || []).forEach((w) => {
      if (!w || !w.de) return;
      const catName = w.category?.name ? w.category.name.toLowerCase() : "";
      const isVerbCat = catName.includes("глагол") || catName.includes("verb");
      const cleanInf = w.de.toLowerCase().trim();
      const isKnown = Boolean(KNOWN_VERBS_DICT[cleanInf]);

      if (!isVerbCat && !isKnown) return;
      if (seen.has(cleanInf)) return;

      const known = KNOWN_VERBS_DICT[cleanInf];
      let conjugations = null;
      let isIrregular = false;

      if (known) {
        conjugations = known.forms;
        isIrregular = known.isIrregular;
      } else if (w.praesensIch && w.praesensDu && w.praesensEr) {
        conjugations = {
          ich: w.praesensIch,
          du: w.praesensDu,
          er: w.praesensEr,
          wir: w.praesensWir || cleanInf,
          ihr: w.praesensIhr || conjugateRegular(cleanInf).ihr,
          sie: w.praesensSie || cleanInf
        };
        isIrregular = true;
      } else {
        conjugations = conjugateRegular(cleanInf);
        isIrregular = false;
      }

      const verbItem = {
        id: w.id || cleanInf,
        de: cleanInf,
        ru: w.ru || (known ? known.ru : ""),
        isIrregular,
        conjugations,
        vowelChange: known?.vowelChange || null,
        plural: w.plural || null
      };

      seen.set(cleanInf, verbItem);
      this.allVerbs.push(verbItem);
      if (isIrregular) this.irregularVerbs.push(verbItem);
      else this.regularVerbs.push(verbItem);
    });

    // Fallback if no verbs loaded from DB
    if (this.allVerbs.length === 0) {
      Object.keys(KNOWN_VERBS_DICT).forEach((inf) => {
        const item = KNOWN_VERBS_DICT[inf];
        const v = {
          id: inf,
          de: inf,
          ru: item.ru,
          isIrregular: item.isIrregular,
          conjugations: item.forms,
          vowelChange: item.vowelChange || null,
          plural: null
        };
        this.allVerbs.push(v);
        if (item.isIrregular) this.irregularVerbs.push(v);
        else this.regularVerbs.push(v);
      });
    }

    const setC = (id, count) => {
      const el = this.el(id);
      if (el) el.textContent = `(${count})`;
    };
    setC("verb-count-irreg", this.irregularVerbs.length);
    setC("verb-count-reg", this.regularVerbs.length);
    setC("verb-count-all", this.allVerbs.length);
  }

  applyVerbTypeFilter(type) {
    this.currentVerbType = type;
    safeSetItem(VERB_TYPE_KEY, type);

    if (type === "regular") this.activePool = this.regularVerbs;
    else if (type === "all") this.activePool = this.allVerbs;
    else this.activePool = this.irregularVerbs;

    document.querySelectorAll("input[name='verb-type-radio']").forEach((rb) => {
      rb.checked = rb.value === type;
    });
  }

  pickNextUnit() {
    if (!this.activePool || this.activePool.length === 0) return null;

    const candidateUnits = [];
    this.activePool.forEach((verb) => {
      PRONOUNS.forEach((pronoun) => {
        const formKey = pronoun.key;
        const correctAnswer = verb.conjugations ? verb.conjugations[formKey] : null;
        if (correctAnswer) {
          candidateUnits.push({
            verb,
            pronoun,
            formKey,
            correctAnswer: correctAnswer.trim().toLowerCase(),
            unitKey: `${verb.id}_${formKey}`
          });
        }
      });
    });

    if (candidateUnits.length === 0) return null;

    if (!this.srsEnabled) {
      const filtered = candidateUnits.filter((u) => u.unitKey !== this.lastUnitKey);
      const pool = filtered.length > 0 ? filtered : candidateUnits;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const now = Date.now();
    const overdueUnits = [];
    const dueTodayUnits = [];
    const unreviewedUnits = [];
    const futureUnits = [];

    candidateUnits.forEach((unit) => {
      const srs = this.getFormSrs(unit.verb.id, unit.formKey);
      unit.srs = srs;
      if (!srs.lastReviewed) unreviewedUnits.push(unit);
      else if (srs.nextReview <= now) overdueUnits.push(unit);
      else if (srs.nextReview <= now + DAY_MS) dueTodayUnits.push(unit);
      else futureUnits.push(unit);
    });

    const selectFrom = (list) => {
      if (list.length === 0) return null;
      const filtered = list.filter((u) => u.unitKey !== this.lastUnitKey);
      const candidates = filtered.length > 0 ? filtered : list;
      return candidates[Math.floor(Math.random() * candidates.length)];
    };

    return selectFrom(overdueUnits) || selectFrom(dueTodayUnits) || selectFrom(unreviewedUnits) || selectFrom(futureUnits) || candidateUnits[0];
  }

  renderQuestionUI() {
    if (!this.currentUnit) return;
    const { verb, pronoun } = this.currentUnit;

    const qEl = this.el("verb-question");
    const hintEl = this.el("verb-translation-hint");
    const pDe = this.el("verb-pronoun-de");
    const pRu = this.el("verb-pronoun-ru");
    const lead = this.el("verb-input-lead");
    const ansInput = this.el("verb-answer");
    const feedback = this.el("verb-feedback");
    const prevResult = this.el("verb-prev-result");

    if (qEl) qEl.textContent = verb.de;
    if (hintEl) hintEl.textContent = verb.ru || "";
    if (pDe) pDe.textContent = pronoun.de;
    if (pRu) pRu.textContent = `(${pronoun.ru})`;
    if (lead) lead.textContent = pronoun.de;
    if (ansInput) {
      ansInput.value = "";
      ansInput.style.borderColor = "";
    }
    if (feedback) feedback.innerHTML = "";

    if (this.lastResult && prevResult) {
      const isCor = this.lastResult.isCorrect;
      prevResult.innerHTML = isCor
        ? `Прошлый ответ верный: <b>${this.lastResult.pronounDe} ${this.lastResult.correctAnswer}</b>`
        : `Прошлый ответ неверный: было <b>${this.lastResult.pronounDe} ${this.lastResult.correctAnswer}</b>`;
      prevResult.style.color = isCor ? "var(--success)" : "var(--danger)";
    }

    const srs = this.getFormSrs(verb.id, pronoun.key);
    const badge = this.el("verb-srs-badge");
    if (badge) {
      const b = srs.box || 1;
      const info = LEVEL_BADGES[b];
      badge.className = `srs-box-badge ${info.cls}`;
      badge.textContent = info.name.replace(")", `: ${pronoun.de})`);
      badge.style.display = this.srsEnabled ? "inline-flex" : "none";
    }

    const inputRow = this.el("verb-conjugation-input-container");
    const choiceGrid = this.el("verb-choice-container");
    const umlautsBar = this.el("verb-umlauts-bar");
    const qmode = this.el("verb-qmode");

    if (this.currentQuizMode === "choice") {
      if (inputRow) inputRow.style.display = "none";
      if (umlautsBar) umlautsBar.style.display = "none";
      if (choiceGrid) {
        choiceGrid.style.display = "grid";
        this.renderChoiceButtons();
      }
      if (qmode) qmode.textContent = "Спряжение: выберите правильную форму";
    } else {
      if (inputRow) inputRow.style.display = "flex";
      if (umlautsBar) umlautsBar.style.display = "flex";
      if (choiceGrid) choiceGrid.style.display = "none";
      if (qmode) qmode.textContent = "Спряжение: введите форму";
      if (ansInput) ansInput.focus();
    }
  }

  renderChoiceButtons() {
    const grid = this.el("verb-choice-container");
    if (!grid || !this.currentUnit) return;
    grid.innerHTML = "";

    const correct = this.currentUnit.correctAnswer;
    const choices = [correct];
    const verbConjs = this.currentUnit.verb.conjugations || {};

    Object.values(verbConjs).forEach((c) => {
      const clean = (c || "").trim().toLowerCase();
      if (clean && !choices.includes(clean)) choices.push(clean);
    });

    while (choices.length < 4) {
      const randomVerb = this.allVerbs[Math.floor(Math.random() * this.allVerbs.length)];
      if (randomVerb?.conjugations) {
        const form = randomVerb.conjugations[this.currentUnit.formKey];
        if (form && !choices.includes(form.trim().toLowerCase())) {
          choices.push(form.trim().toLowerCase());
        }
      }
    }

    choices.sort(() => Math.random() - 0.5);

    choices.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `${this.currentUnit.pronoun.de} ${option}`;
      btn.addEventListener("click", () => {
        if (this.isAnswerChecked) return;
        this.evaluateAnswer(option);
      });
      grid.appendChild(btn);
    });
  }

  evaluateAnswer(userInput) {
    if (this.isAnswerChecked || !this.currentUnit) return;

    const { verb, pronoun, formKey, correctAnswer } = this.currentUnit;
    const cleanUser = (userInput || "").trim().toLowerCase();
    const isCorrect = cleanUser === correctAnswer;

    this.isAnswerChecked = true;
    this.stats.total += 1;

    if (isCorrect) {
      this.stats.correct += 1;
      this.stats.streak += 1;
      if (this.stats.streak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.streak;
      }
    } else {
      this.stats.streak = 0;
    }

    this.renderStats();
    safeSetItem(VERB_STATS_KEY, this.stats);

    const srsInfo = this.updateFormSrs(verb.id, formKey, isCorrect);

    this.lastResult = {
      isCorrect,
      pronounDe: pronoun.de,
      pronounRu: pronoun.ru,
      correctAnswer,
      userAnswer: cleanUser,
      verbDe: verb.de,
      srsInfo
    };

    const feedback = this.el("verb-feedback");
    const ansInput = this.el("verb-answer");

    let srsText = "";
    if (srsInfo) {
      srsText = isCorrect
        ? `<br><small style="color:var(--primary);">${pronoun.de}: Уровень ${srsInfo.newBox} (${srsInfo.levelName})</small>`
        : `<br><small style="color:#d9480f;">${pronoun.de}: Уровень 1 (сегодня)</small>`;
    }

    if (feedback) {
      feedback.innerHTML = isCorrect
        ? `Верно: <b>${pronoun.de} ${correctAnswer}</b>${srsText}`
        : `Неверно. Правильно: <b>${pronoun.de} ${correctAnswer}</b>${srsText}`;
      feedback.style.color = isCorrect ? "var(--success)" : "var(--danger)";
    }

    if (ansInput) {
      ansInput.style.borderColor = isCorrect ? "var(--success-border)" : "var(--danger-border)";
    }

    if (this.currentQuizMode === "choice") {
      const buttons = document.querySelectorAll("#verb-choice-container .choice-btn");
      buttons.forEach((btn) => {
        const text = btn.textContent.toLowerCase();
        if (text.includes(correctAnswer)) {
          btn.classList.add("choice-correct");
        } else if (text.includes(cleanUser) && !isCorrect) {
          btn.classList.add("choice-wrong");
        }
      });
    }
  }

  nextQuestion(skipEval = false) {
    if (!skipEval && !this.isAnswerChecked && this.currentUnit) {
      const input = this.el("verb-answer");
      this.evaluateAnswer(input ? input.value : "");
    }

    const next = this.pickNextUnit();
    if (!next) return;

    this.currentUnit = next;
    this.lastUnitKey = next.unitKey;
    this.isAnswerChecked = false;
    this.renderQuestionUI();
  }

  renderStats() {
    const total = this.stats.total || 0;
    const correct = this.stats.correct || 0;
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);

    const setT = (id, val) => {
      const el = this.el(id);
      if (el) el.textContent = val;
    };
    setT("verb-score-correct", correct);
    setT("verb-score-total", total);
    setT("verb-score-percent", `${pct}%`);
    setT("verb-streak", this.stats.streak || 0);
    setT("verb-best-streak", this.stats.bestStreak || 0);
  }

  renderCheatsheet() {
    const tbody = this.el("verb-cheatsheet-tbody");
    if (!tbody) return;

    const searchInput = this.el("verb-cheatsheet-search");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    let filter = "all";
    const activeFilterBtn = document.querySelector(".verb-cs-filter-btn.active");
    if (activeFilterBtn) filter = activeFilterBtn.dataset.filter || "all";

    let source = this.allVerbs;
    if (filter === "irregular") source = this.irregularVerbs;
    else if (filter === "regular") source = this.regularVerbs;

    const list = source.filter((v) => {
      if (!query) return true;
      const matchDe = v.de.toLowerCase().includes(query);
      const matchRu = (v.ru || "").toLowerCase().includes(query);
      const c = v.conjugations || {};
      const matchForms = Object.values(c).some((f) => (f || "").toLowerCase().includes(query));
      return matchDe || matchRu || matchForms;
    });

    let html = "";
    list.forEach((v) => {
      const c = v.conjugations || {};
      const tagClass = v.isIrregular ? "irreg" : "reg";
      const tagText = v.isIrregular ? "⚡ неправ." : "📘 обычн.";

      const buildCell = (pKey) => {
        const formVal = c[pKey] || "—";
        const formSrs = this.getFormSrs(v.id, pKey);
        const box = formSrs.box || 1;
        return `<td style="padding: 8px 10px;">${formVal} <span class="srs-micro-pill box-${box}">ур.${box}</span></td>`;
      };

      let mastered = 0;
      PRONOUNS.forEach((p) => {
        if (this.getFormSrs(v.id, p.key).box === 5) mastered++;
      });

      const srsSummary = mastered === 6
        ? '<span class="srs-box-badge box-5">🏆 Все 6</span>'
        : `<span class="srs-box-badge box-3">${mastered}/6</span>`;

      html += `<tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 8px 10px; font-weight: 700;">${v.de} <span class="verb-table-tag ${tagClass}">${tagText}</span></td>
        ${buildCell("ich")}
        ${buildCell("du")}
        ${buildCell("er")}
        ${buildCell("wir")}
        ${buildCell("ihr")}
        ${buildCell("sie")}
        <td style="padding: 8px 10px; color: var(--text-secondary); font-size: 12px;">${v.ru || "—"}</td>
        <td style="padding: 8px 10px; text-align: right;">${srsSummary}</td>
      </tr>`;
    });

    tbody.innerHTML = html || '<tr><td colspan="9" style="text-align:center; padding: 20px;">Ничего не найдено</td></tr>';
  }

  updateSrsModal() {
    const now = Date.now();
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let dueCount = 0;
    const dueList = [];

    this.allVerbs.forEach((v) => {
      PRONOUNS.forEach((p) => {
        const srs = this.getFormSrs(v.id, p.key);
        const box = srs.box || 1;
        counts[box] = (counts[box] || 0) + 1;
        if (srs.nextReview <= now) {
          dueCount++;
          dueList.push({ verb: v, pronoun: p, srs });
        }
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const setEl = (id, val) => {
      const el = this.el(id);
      if (el) el.textContent = val;
    };
    setEl("verb-srs-total-count", total);
    setEl("verb-srs-due-count", dueCount);
    setEl("verb-srs-mastered-count", counts[5]);

    for (let box = 1; box <= 5; box++) {
      const c = counts[box] || 0;
      const pct = total === 0 ? 0 : Math.round((c / total) * 100);
      setEl(`verb-srs-box-${box}-count`, `${c} (${pct}%)`);
      const bar = this.el(`verb-srs-box-${box}-bar`);
      if (bar) bar.style.width = `${pct}%`;
    }

    const listEl = this.el("verb-srs-due-list");
    if (listEl) {
      if (dueList.length === 0) {
        listEl.innerHTML = '<div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 8px;">Все формы повторены! 🎉</div>';
      } else {
        listEl.innerHTML = dueList.slice(0, 20).map((d) => (
          `<span style="display: inline-block; background: var(--bg); padding: 3px 8px; margin: 3px; border-radius: 6px; font-size: 11px; border: 1px solid var(--border);">
            ${d.pronoun.de} <b>${d.verb.de}</b>
          </span>`
        )).join("");
      }
    }
  }

  bindEvents() {
    this.el("verb-check-btn")?.addEventListener("click", () => {
      const ansInput = this.el("verb-answer");
      this.evaluateAnswer(ansInput ? ansInput.value : "");
    });

    this.el("verb-next-btn")?.addEventListener("click", () => {
      this.nextQuestion();
    });

    this.el("verb-reset-btn")?.addEventListener("click", () => {
      this.stats = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
      this.renderStats();
      safeSetItem(VERB_STATS_KEY, this.stats);
    });

    this.el("verb-answer")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (!this.isAnswerChecked) {
          this.evaluateAnswer(e.target.value);
        } else {
          this.nextQuestion();
        }
      }
    });

    this.el("verb-hint-btn")?.addEventListener("click", () => {
      if (!this.currentUnit || this.isAnswerChecked) return;
      const ansInput = this.el("verb-answer");
      if (!ansInput) return;
      const target = this.currentUnit.correctAnswer;
      const val = ansInput.value;
      if (val.length < target.length) {
        ansInput.value = target.slice(0, val.length + 1);
      } else {
        ansInput.value = target;
      }
      ansInput.focus();
    });

    document.querySelectorAll("input[name='verb-type-radio']").forEach((rb) => {
      rb.addEventListener("change", () => {
        this.applyVerbTypeFilter(rb.value);
        this.nextQuestion(true);
      });
    });

    document.querySelectorAll("input[name='verb-mode-radio']").forEach((rb) => {
      rb.addEventListener("change", () => {
        this.currentQuizMode = rb.value;
        safeSetItem(VERB_MODE_KEY, rb.value);
        this.renderQuestionUI();
      });
    });

    this.el("verb-srs-cb")?.addEventListener("change", (e) => {
      this.srsEnabled = e.target.checked;
      safeSetItem(VERB_SRS_ENABLED_KEY, this.srsEnabled);
      this.renderQuestionUI();
    });

    this.el("verb-cheatsheet-search")?.addEventListener("input", () => {
      this.renderCheatsheet();
    });

    document.querySelectorAll(".verb-cs-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".verb-cs-filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderCheatsheet();
      });
    });

    this.el("verb-reset-srs-btn")?.addEventListener("click", () => {
      if (confirm("Сбросить весь прогресс запоминания глаголов?")) {
        this.saveSrsStore({});
        this.updateSrsModal();
        this.renderCheatsheet();
        this.renderQuestionUI();
      }
    });

    document.querySelectorAll("[data-modal='verb-cheatsheet-modal']").forEach((btn) => {
      btn.addEventListener("click", () => this.renderCheatsheet());
    });

    document.querySelectorAll("[data-modal='verb-srs-modal']").forEach((btn) => {
      btn.addEventListener("click", () => this.updateSrsModal());
    });
  }
}
