/**
 * Words Trainer Controller
 */
import { QuizEngine } from "./quiz-engine.js";
import { WordsSRS } from "./words-srs.js";
import { formatGermanGender } from "./utils.js";

export class WordsTrainer {
  constructor() {
    this.categories = [];
    this.quiz = null;
    this.init();
  }

  init() {
    WordsSRS.loadDirs();

    const smartCb = document.getElementById("word-smart-cb");
    if (smartCb) smartCb.checked = WordsSRS.loadSmartEnabled();

    const srsCb = document.getElementById("word-srs-cb");
    if (srsCb) srsCb.checked = WordsSRS.loadSRSEnabled();

    this.quiz = new QuizEngine({
      prefix: "word",
      pickNext: (state) => this.pickNext(state),
      render: (next, elements) => this.renderQuestion(next, elements),
      checkAnswer: (userVal, current) => this.checkAnswer(userVal, current),
      weightId: (current) => this.getWeightId(current),
      onEmpty: () => this.setQuizEnabled(false)
    });

    this.bindEvents();
    this.loadCategories();
  }

  extractGermanArticle(text) {
    if (!text) return null;
    const firstAlt = text.split("/")[0].trim();
    const match = firstAlt.match(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\b/i);
    return match ? match[1] : null;
  }

  setQuizEnabled(enabled) {
    const area = document.getElementById("word-quiz-area");
    if (area) {
      area.style.opacity = enabled ? "1" : "0.4";
      area.style.pointerEvents = enabled ? "auto" : "none";
    }
  }

  pickNext(state) {
    const pool = WordsSRS.getPool(this.categories);
    if (pool.length === 0) return null;

    const dirs = WordsSRS.getDirs();
    const lastWordId = state.current ? state.current.word.id : null;
    const smartCb = document.getElementById("word-smart-cb");
    const srsCb = document.getElementById("word-srs-cb");
    const isSRS = srsCb && srsCb.checked;
    const isSmart = smartCb && smartCb.checked;

    let wordObj;
    let dir;
    let formTarget;
    let srsSubKey;

    if (isSRS) {
      const srsCard = WordsSRS.pickWordSRS(pool, dirs, lastWordId, isSmart);
      if (!srsCard) return null;
      wordObj = srsCard.word;
      dir = srsCard.dir;
      formTarget = srsCard.formTarget;
      srsSubKey = srsCard.srsSubKey;
    } else if (isSmart) {
      wordObj = QuizEngine.weightedPick(pool, (w) => w.id, QuizEngine.getWeights("word"), lastWordId);
      dir = dirs[Math.floor(Math.random() * dirs.length)];
      if (dir === "ru2de") {
        const availForms = ["singular"];
        if (wordObj.plural && wordObj.plural.trim()) availForms.push("plural");
        if (wordObj.feminine && wordObj.feminine.trim()) availForms.push("feminine");
        if (wordObj.femininePlural && wordObj.femininePlural.trim()) availForms.push("femininePlural");
        formTarget = availForms[Math.floor(Math.random() * availForms.length)];
        if (formTarget === "plural") srsSubKey = "ru2de_pl";
        else if (formTarget === "feminine") srsSubKey = "ru2de_fem";
        else if (formTarget === "femininePlural") srsSubKey = "ru2de_fem_pl";
        else srsSubKey = "ru2de_sg";
      } else {
        formTarget = "base";
        srsSubKey = "de2ru";
      }
    } else {
      wordObj = WordsSRS.pickWordPlain(pool, lastWordId);
      dir = dirs[Math.floor(Math.random() * dirs.length)];
      if (dir === "ru2de") {
        const availForms = ["singular"];
        if (wordObj.plural && wordObj.plural.trim()) availForms.push("plural");
        if (wordObj.feminine && wordObj.feminine.trim()) availForms.push("feminine");
        if (wordObj.femininePlural && wordObj.femininePlural.trim()) availForms.push("femininePlural");
        formTarget = availForms[Math.floor(Math.random() * availForms.length)];
        if (formTarget === "plural") srsSubKey = "ru2de_pl";
        else if (formTarget === "feminine") srsSubKey = "ru2de_fem";
        else if (formTarget === "femininePlural") srsSubKey = "ru2de_fem_pl";
        else srsSubKey = "ru2de_sg";
      } else {
        formTarget = "base";
        srsSubKey = "de2ru";
      }
    }

    return {
      word: wordObj,
      dir,
      formTarget,
      srsSubKey
    };
  }

  renderQuestion(current, elements) {
    const srsCb = document.getElementById("word-srs-cb");
    const isSRS = srsCb && srsCb.checked;

    let srsBadge = "";
    if (isSRS) {
      const srs = WordsSRS.getWordSRS(current.word.id, current.srsSubKey || current.dir);
      const lvl = Math.min(5, Math.max(1, srs.box || 1));
      srsBadge = ` <span class="srs-box-badge box-${lvl}">${WordsSRS.LEVEL_NAMES ? WordsSRS.LEVEL_NAMES[lvl] : "Ур. " + lvl}</span>`;
    }

    if (current.dir === "de2ru") {
      if (elements.modeEl) elements.modeEl.innerHTML = `Немецкий → русский${srsBadge}`;
      if (elements.qEl) elements.qEl.innerHTML = formatGermanGender(current.word.de);
    } else {
      let promptTitle = "Русский → немецкий";
      if (current.formTarget === "plural") promptTitle += " (множественное число)";
      else if (current.formTarget === "feminine") promptTitle += " (женский род)";
      else if (current.formTarget === "femininePlural") promptTitle += " (женский род, мн. число)";
      else if (current.word.plural || current.word.feminine) promptTitle += " (единственное число)";

      if (elements.modeEl) elements.modeEl.innerHTML = `${promptTitle}${srsBadge}`;
      if (elements.qEl) elements.qEl.textContent = current.word.ru;
    }
  }

  checkAnswer(userVal, current) {
    let isCorrect = false;
    let correctText = "";
    let extraFeedback = "";

    if (current.dir === "de2ru") {
      correctText = current.word.ru;
      isCorrect = WordsSRS.matchesAnyAlternative(userVal, correctText);
    } else {
      if (current.formTarget === "plural") {
        correctText = current.word.plural;
        isCorrect = WordsSRS.matchesAnyAlternative(userVal, current.word.plural);
        if (!isCorrect && WordsSRS.matchesAnyAlternative(userVal, current.word.de)) {
          extraFeedback = `💡 Вы ввели единственное число (<b>${current.word.de}</b>), а требовалось множественное: <b>${current.word.plural}</b>`;
        }
      } else if (current.formTarget === "feminine") {
        correctText = current.word.feminine;
        isCorrect = WordsSRS.matchesAnyAlternative(userVal, current.word.feminine);
        if (!isCorrect && WordsSRS.matchesAnyAlternative(userVal, current.word.de)) {
          extraFeedback = `💡 Вы ввели мужской/общий род (<b>${current.word.de}</b>), а требовался женский род: <b>${current.word.feminine}</b>`;
        }
      } else if (current.formTarget === "femininePlural") {
        correctText = current.word.femininePlural;
        isCorrect = WordsSRS.matchesAnyAlternative(userVal, current.word.femininePlural);
      } else {
        correctText = current.word.de;
        isCorrect = WordsSRS.matchesAnyAlternative(userVal, current.word.de);
        if (!isCorrect && current.word.plural && WordsSRS.matchesAnyAlternative(userVal, current.word.plural)) {
          extraFeedback = `💡 Вы ввели множественное число (<b>${current.word.plural}</b>), а требовалось единственное: <b>${current.word.de}</b>`;
        }
      }
    }

    const formsList = [];
    if (current.formTarget !== "singular" && current.word.de) formsList.push(`ед: ${current.word.de}`);
    if (current.formTarget !== "plural" && current.word.plural) formsList.push(`мн: ${current.word.plural}`);
    if (current.formTarget !== "feminine" && current.word.feminine) formsList.push(`ж: ${current.word.feminine}`);
    if (current.formTarget !== "femininePlural" && current.word.femininePlural) formsList.push(`мн.ж: ${current.word.femininePlural}`);

    const extraNote = formsList.length > 0 ? ` (${formsList.join(", ")})` : "";
    let srsInfo = null;

    const srsCb = document.getElementById("word-srs-cb");
    if (srsCb && srsCb.checked) {
      srsInfo = WordsSRS.updateWordSRS(current.word.id, current.srsSubKey || current.dir, isCorrect);
      this.renderCategoryProgress();
    }

    return {
      isCorrect,
      correctText: correctText + extraNote,
      extraFeedback,
      srsInfo
    };
  }

  getWeightId(current) {
    if (current.dir === "ru2de") {
      return current.formTarget === "singular" ? current.word.id : `${current.word.id}_${current.formTarget}`;
    }
    return current.word.id;
  }

  onSettingsChanged() {
    WordsSRS.saveCategoriesSelection();
    WordsSRS.saveDirs();

    const pool = WordsSRS.getPool(this.categories);
    if (pool.length === 0) {
      this.setQuizEnabled(false);
      const qEl = document.getElementById("word-question");
      const modeEl = document.getElementById("word-qmode");
      if (qEl) qEl.textContent = "—";
      if (modeEl) modeEl.textContent = "Выбери хотя бы одну категорию со словами";
      this.renderCategoryProgress();
      return;
    }

    this.setQuizEnabled(true);
    this.quiz.newQuestion(true);
    this.renderCategoryProgress();
  }

  renderCategoryCheckboxes() {
    const row = document.getElementById("word-categories-row");
    if (!row) return;
    row.innerHTML = "";

    if (this.categories.length === 0) {
      row.innerHTML = '<span class="empty-note" style="padding:0;">Пока нет слов — добавь их в <a href="/admin.html">админ-панели</a></span>';
      return;
    }

    const savedCats = WordsSRS.loadCategoriesSelection();
    this.categories.forEach((cat) => {
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "word-cat-cb";
      cb.value = cat.id;
      cb.checked = savedCats === null ? true : savedCats.includes(cat.id);
      cb.addEventListener("change", () => this.onSettingsChanged());
      label.appendChild(cb);
      label.appendChild(document.createTextNode(` ${cat.name} (${cat.words.length})`));
      row.appendChild(label);
    });
  }

  renderCategoryProgress() {
    const container = document.getElementById("category-progress-container");
    const statusBadge = document.getElementById("srs-status-badge");
    if (!container) return;

    if (this.categories.length === 0) {
      container.innerHTML = '<p class="empty-note" style="padding:0;">Категорий пока нет</p>';
      if (statusBadge) statusBadge.textContent = "—";
      return;
    }

    const now = Date.now();
    let totalCardsAll = 0;
    let totalDueAll = 0;
    let html = "";

    this.categories.forEach((cat) => {
      const catWords = cat.words || [];
      let totalCards = 0;
      const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let dueCount = 0;

      catWords.forEach((w) => {
        const subKeys = ["de2ru", "ru2de_sg"];
        if (w.plural && w.plural.trim()) subKeys.push("ru2de_pl");
        if (w.feminine && w.feminine.trim()) subKeys.push("ru2de_fem");
        if (w.femininePlural && w.femininePlural.trim()) subKeys.push("ru2de_fem_pl");
        totalCards += subKeys.length;

        subKeys.forEach((sub) => {
          const srs = WordsSRS.getWordSRS(w.id, sub);
          const lvl = Math.min(5, Math.max(1, srs.box || 1));
          levels[lvl] = (levels[lvl] || 0) + 1;
          if (srs.nextReview <= now) dueCount++;
        });
      });

      totalCardsAll += totalCards;
      totalDueAll += dueCount;
      const mastered = levels[5];
      const percent = totalCards === 0 ? 0 : Math.round((mastered / totalCards) * 100);

      html += `<div style="background: var(--surface); padding: 14px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div>
            <span style="font-weight: 600; font-size: 14px;">${cat.name}</span>
            <span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">(${catWords.length} слов / ${totalCards} карточек)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--primary); font-weight: 600;">Освоено: ${percent}% (${mastered}/${totalCards})</span>
            <button type="button" class="small-btn ghost-btn js-reset-cat-srs" data-cat-id="${cat.id}" style="padding: 2px 8px; font-size: 11px;">Сбросить</button>
          </div>
        </div>
        <div style="height: 10px; background: var(--bg); border-radius: 5px; overflow: hidden; margin-bottom: 10px; display: flex;">`;

      const colors = ["#e03131", "#ff922b", "#fcc419", "#51cf66", "#20c997"];
      for (let lvl = 1; lvl <= 5; lvl++) {
        const widthPct = totalCards === 0 ? 0 : (levels[lvl] / totalCards) * 100;
        if (widthPct > 0) {
          html += `<div style="width: ${widthPct}%; background: ${colors[lvl - 1]};" title="Уровень ${lvl}: ${levels[lvl]} карточек"></div>`;
        }
      }

      html += `</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px;">
          <span style="background: rgba(224, 49, 49, 0.15); color: #e03131; padding: 2px 6px; border-radius: 4px;">🌱 Новое: ${levels[1]}</span>
          <span style="background: rgba(255, 146, 43, 0.15); color: #d9480f; padding: 2px 6px; border-radius: 4px;">🌿 Знакомое: ${levels[2]}</span>
          <span style="background: rgba(252, 196, 25, 0.15); color: #f59f00; padding: 2px 6px; border-radius: 4px;">🌳 Закреплено: ${levels[3]}</span>
          <span style="background: rgba(81, 207, 102, 0.15); color: #2b8a3e; padding: 2px 6px; border-radius: 4px;">🌲 Уверенно: ${levels[4]}</span>
          <span style="background: rgba(32, 201, 151, 0.15); color: #099268; padding: 2px 6px; border-radius: 4px; font-weight: 600;">🏆 Выучено: ${levels[5]}</span>
          ${dueCount > 0 ? `<span style="background: var(--primary); color: #fff; padding: 2px 6px; border-radius: 4px; margin-left: auto; font-weight: 600;">К повторению: ${dueCount}</span>` : '<span style="background: var(--border); color: var(--text-dim); padding: 2px 6px; border-radius: 4px; margin-left: auto;">Всё повторено 🎉</span>'}
        </div>
      </div>`;
    });

    container.innerHTML = html;

    if (statusBadge) {
      if (totalDueAll > 0) {
        statusBadge.textContent = `🔔 На сегодня к повторению: ${totalDueAll} карточек`;
        statusBadge.style.background = "rgba(255, 146, 43, 0.2)";
        statusBadge.style.color = "#d9480f";
      } else {
        statusBadge.textContent = "✨ Все карточки повторены!";
        statusBadge.style.background = "rgba(32, 201, 151, 0.2)";
        statusBadge.style.color = "#099268";
      }
    }

    container.querySelectorAll(".js-reset-cat-srs").forEach((btn) => {
      btn.addEventListener("click", () => {
        const catId = btn.getAttribute("data-cat-id");
        if (confirm("Сбросить прогресс запоминания для этой категории? Все карточки вернутся на Уровень 1 (Новое).")) {
          WordsSRS.resetSRSProgress(this.categories, catId);
          this.renderCategoryProgress();
          this.onSettingsChanged();
        }
      });
    });
  }

  async loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      this.categories = await res.json();
      this.renderCategoryCheckboxes();
      this.populateDictCategories();
      this.renderDictionaryTable();
      this.onSettingsChanged();
    } catch {
      const row = document.getElementById("word-categories-row");
      if (row) {
        row.innerHTML = '<span class="empty-note" style="padding:0;">Не удалось загрузить слова с сервера</span>';
      }
    }
  }

  populateDictCategories() {
    const dictCatSelect = document.getElementById("dict-cat-select");
    if (!dictCatSelect) return;
    dictCatSelect.innerHTML = '<option value="__ALL__">Все категории</option>';
    this.categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = `${cat.name} (${cat.words.length})`;
      dictCatSelect.appendChild(opt);
    });
  }

  renderDictionaryTable() {
    const dictTbody = document.getElementById("dict-tbody");
    if (!dictTbody) return;

    const searchInput = document.getElementById("dict-search-input");
    const catSelect = document.getElementById("dict-cat-select");
    const levelSelect = document.getElementById("dict-level-select");
    const dictCountBadge = document.getElementById("dict-count-badge");

    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedCatId = catSelect ? catSelect.value : "__ALL__";
    const selectedLevel = levelSelect ? levelSelect.value : "__ALL__";

    const filteredList = [];

    this.categories.forEach((cat) => {
      if (selectedCatId !== "__ALL__" && cat.id !== selectedCatId) return;

      cat.words.forEach((w) => {
        const deMatch = w.de.toLowerCase().includes(searchQuery);
        const ruMatch = w.ru.toLowerCase().includes(searchQuery);
        const plMatch = w.plural && w.plural.toLowerCase().includes(searchQuery);
        const femMatch = w.feminine && w.feminine.toLowerCase().includes(searchQuery);
        const femPlMatch = w.femininePlural && w.femininePlural.toLowerCase().includes(searchQuery);
        if (searchQuery && !deMatch && !ruMatch && !plMatch && !femMatch && !femPlMatch) return;

        const srsDe2Ru = WordsSRS.getWordSRS(w.id, "de2ru");
        const srsRu2DeSg = WordsSRS.getWordSRS(w.id, "ru2de_sg");
        const srsRu2DePl = w.plural && w.plural.trim() ? WordsSRS.getWordSRS(w.id, "ru2de_pl") : null;
        const srsRu2DeFem = w.feminine && w.feminine.trim() ? WordsSRS.getWordSRS(w.id, "ru2de_fem") : null;
        const srsRu2DeFemPl = w.femininePlural && w.femininePlural.trim() ? WordsSRS.getWordSRS(w.id, "ru2de_fem_pl") : null;

        const lvlDe2Ru = Math.min(5, Math.max(1, srsDe2Ru.box || 1));
        const lvlRu2DeSg = Math.min(5, Math.max(1, srsRu2DeSg.box || 1));
        const lvlRu2DePl = srsRu2DePl ? Math.min(5, Math.max(1, srsRu2DePl.box || 1)) : null;
        const lvlRu2DeFem = srsRu2DeFem ? Math.min(5, Math.max(1, srsRu2DeFem.box || 1)) : null;
        const lvlRu2DeFemPl = srsRu2DeFemPl ? Math.min(5, Math.max(1, srsRu2DeFemPl.box || 1)) : null;

        if (selectedLevel !== "__ALL__") {
          const targetLvl = parseInt(selectedLevel, 10);
          const matches =
            lvlDe2Ru === targetLvl ||
            lvlRu2DeSg === targetLvl ||
            (lvlRu2DePl !== null && lvlRu2DePl === targetLvl) ||
            (lvlRu2DeFem !== null && lvlRu2DeFem === targetLvl) ||
            (lvlRu2DeFemPl !== null && lvlRu2DeFemPl === targetLvl);
          if (!matches) return;
        }

        filteredList.push({
          word: w,
          categoryName: cat.name,
          lvlDe2Ru,
          lvlRu2DeSg,
          lvlRu2DePl,
          lvlRu2DeFem,
          lvlRu2DeFemPl
        });
      });
    });

    if (dictCountBadge) {
      dictCountBadge.textContent = `${filteredList.length} слов`;
    }

    if (filteredList.length === 0) {
      dictTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-dim);">Слова не найдены по запросу</td></tr>';
      return;
    }

    const levelBadges = {
      1: '<span style="color:#e03131;">🌱 L1</span>',
      2: '<span style="color:#d9480f;">🌿 L2</span>',
      3: '<span style="color:#f59f00;">🌳 L3</span>',
      4: '<span style="color:#2b8a3e;">🌲 L4</span>',
      5: '<span style="color:#099268; font-weight:600;">🏆 L5</span>'
    };

    let html = "";
    filteredList.forEach((item) => {
      let formattedDe = `<div style="font-weight: 500;">${formatGermanGender(item.word.de)}</div>`;
      if (item.word.plural || item.word.feminine || item.word.femininePlural) {
        formattedDe += '<div class="word-extra-forms">';
        if (item.word.plural) formattedDe += `<span class="form-badge plural-badge" title="Множественное число">мн: ${formatGermanGender(item.word.plural)}</span> `;
        if (item.word.feminine) formattedDe += `<span class="form-badge fem-badge" title="Женский род">ж: ${formatGermanGender(item.word.feminine)}</span> `;
        if (item.word.femininePlural) formattedDe += `<span class="form-badge fem-plural-badge" title="Множественное число (ж.р.)">мн.ж: ${formatGermanGender(item.word.femininePlural)}</span>`;
        formattedDe += "</div>";
      }

      const srsParts = [
        `<span title="Немецкий → Русский">${levelBadges[item.lvlDe2Ru]} (DE)</span>`,
        `<span title="Русский → Немецкий (ед. ч.)">${levelBadges[item.lvlRu2DeSg]} (RU ед.)</span>`
      ];
      if (item.lvlRu2DePl !== null) {
        srsParts.push(`<span title="Русский → Немецкий (мн. ч.)">${levelBadges[item.lvlRu2DePl]} (RU мн.)</span>`);
      }

      html += `<tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px 12px;">${formattedDe}</td>
        <td style="padding: 10px 12px; color: var(--text-primary);">${item.word.ru}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: var(--text-secondary);">${item.categoryName}</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 12px; white-space: nowrap;">${srsParts.join(" / ")}</td>
      </tr>`;
    });

    dictTbody.innerHTML = html;
  }

  bindEvents() {
    const searchInput = document.getElementById("dict-search-input");
    const catSelect = document.getElementById("dict-cat-select");
    const levelSelect = document.getElementById("dict-level-select");

    searchInput?.addEventListener("input", () => this.renderDictionaryTable());
    catSelect?.addEventListener("change", () => this.renderDictionaryTable());
    levelSelect?.addEventListener("change", () => this.renderDictionaryTable());

    document.querySelectorAll(".word-dir-cb").forEach((cb) => {
      cb.addEventListener("change", () => this.onSettingsChanged());
    });

    const smartCb = document.getElementById("word-smart-cb");
    smartCb?.addEventListener("change", () => {
      WordsSRS.saveSmartEnabled(smartCb.checked);
      this.onSettingsChanged();
    });

    const srsCb = document.getElementById("word-srs-cb");
    srsCb?.addEventListener("change", () => {
      WordsSRS.saveSRSEnabled(srsCb.checked);
      this.onSettingsChanged();
    });

    const srsResetBtn = document.getElementById("word-srs-reset-btn");
    srsResetBtn?.addEventListener("click", () => {
      if (!confirm("Сбросить весь прогресс запоминания (все категории)? Все карточки вернутся на Уровень 1 (Новое).")) return;
      WordsSRS.resetSRSProgress(this.categories, null);
      this.renderCategoryProgress();
      this.onSettingsChanged();
    });

    const wordWeightsResetBtn = document.getElementById("word-weights-reset-btn");
    wordWeightsResetBtn?.addEventListener("click", () => {
      if (!confirm("Сбросить статистику ошибок для слов? Умный подбор начнёт заново.")) return;
      QuizEngine.resetWeights("word");
      this.onSettingsChanged();
    });

    const wordHintBtn = document.getElementById("word-hint-btn");
    wordHintBtn?.addEventListener("click", () => {
      if (!this.quiz.state.current) return;
      const current = this.quiz.state.current;
      let correctText = "";
      if (current.dir === "de2ru") {
        correctText = current.word.ru;
      } else if (current.formTarget === "plural") {
        correctText = current.word.plural || current.word.de;
      } else if (current.formTarget === "feminine") {
        correctText = current.word.feminine || current.word.de;
      } else if (current.formTarget === "femininePlural") {
        correctText = current.word.femininePlural || current.word.de;
      } else {
        correctText = current.word.de;
      }

      const ansEl = document.getElementById("word-answer");
      if (!ansEl) return;

      const firstTarget = correctText.split("/")[0].trim();
      if (current.dir === "ru2de") {
        const article = this.extractGermanArticle(firstTarget);
        if (article) {
          const valLower = ansEl.value.trim().toLowerCase();
          const artLower = article.toLowerCase();
          if (valLower !== artLower && !valLower.startsWith(`${artLower} `)) {
            ansEl.value = `${article} `;
            ansEl.focus();
            return;
          }
        }
      }

      const val = ansEl.value;
      let matchLen = 0;
      for (let i = 0; i < val.length && i < firstTarget.length; i++) {
        if (val[i].toLowerCase() === firstTarget[i].toLowerCase()) {
          matchLen++;
        } else {
          break;
        }
      }

      if (matchLen < firstTarget.length) {
        ansEl.value = firstTarget.slice(0, matchLen + 1);
      } else {
        ansEl.value = firstTarget;
      }
      ansEl.focus();
    });
  }
}
