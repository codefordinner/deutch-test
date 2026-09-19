/**
 * Admin Panel Words & Categories Controller
 */
import { AdminApi } from "./admin-api.js";
import { store } from "./admin-state.js";
import { escapeHtml, formatGermanWord } from "./admin-utils.js";
import { showToast, showConfirmDialog, showCategoryModal, openModal, closeModal } from "./admin-ui.js";
import { KNOWN_VERBS_DICT, conjugateRegularVerb } from "./admin-verbs-data.js";

export function initWordsController() {
  // DOM Elements - Category & Words view
  const categoryPillsContainer = document.getElementById("category-pills-container");
  const activeCategoryTitle = document.getElementById("active-category-title");
  const activeCategorySubtitle = document.getElementById("active-category-subtitle");
  const openAddCategoryBtn = document.getElementById("open-add-category-btn");
  const renameCategoryBtn = document.getElementById("rename-category-btn");
  const deleteCategoryBtn = document.getElementById("delete-category-btn");
  const openAddWordBtn = document.getElementById("open-add-word-btn");

  const wordFilterInput = document.getElementById("word-filter-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const globalSearchCb = document.getElementById("global-search-cb");

  const wordsTbody = document.getElementById("words-tbody");
  const wordsEmptyNote = document.getElementById("words-empty-note");
  const selectAllWordsCb = document.getElementById("select-all-words");
  const thCategory = document.getElementById("th-category");

  const batchActionsBar = document.getElementById("batch-actions-bar");
  const selectedCountEl = document.getElementById("selected-count");
  const batchOpenMoveBtn = document.getElementById("batch-open-move-btn");
  const batchDeleteBtn = document.getElementById("batch-delete-btn");
  const batchCancelBtn = document.getElementById("batch-cancel-btn");

  // Word Modal Elements
  const wordModal = document.getElementById("word-modal");
  const wordModalTitle = document.getElementById("word-modal-title");
  const wordModalCategory = document.getElementById("word-modal-category");
  const wordModalDe = document.getElementById("word-modal-de");
  const wordModalRu = document.getElementById("word-modal-ru");
  const wordModalPlural = document.getElementById("word-modal-plural");
  const wordModalFeminine = document.getElementById("word-modal-feminine");
  const wordModalFemininePlural = document.getElementById("word-modal-feminine-plural");
  const wordModalPraeteritum = document.getElementById("word-modal-praeteritum");
  const wordModalPraesens = document.getElementById("word-modal-praesens");
  const wordModalHilfsverb = document.getElementById("word-modal-hilfsverb");
  const wordModalPartizip2 = document.getElementById("word-modal-partizip2");
  const wordModalVerbAutofillBtn = document.getElementById("word-modal-verb-autofill-btn");
  const wordModalDupBanner = document.getElementById("word-modal-dup-banner");
  const wordModalCancelBtn = document.getElementById("word-modal-cancel-btn");
  const wordModalSaveBtn = document.getElementById("word-modal-save-btn");

  // Move Modal Elements
  const moveModal = document.getElementById("move-modal");
  const moveModalText = document.getElementById("move-modal-text");
  const moveTargetCategory = document.getElementById("move-target-category");
  const confirmMoveBtn = document.getElementById("confirm-move-btn");
  const cancelMoveBtn = document.getElementById("cancel-move-btn");

  let movingWordIds = [];

  // Subscriptions to Store events
  store.subscribe("categories:updated", () => {
    populateCategoryPills();
    populateCategoryDropdowns();
    renderWordsView();
  });

  store.subscribe("words:updated", () => {
    populateCategoryPills();
    renderWordsView();
  });

  function populateCategoryDropdowns() {
    const selects = [
      wordModalCategory,
      moveTargetCategory,
      document.getElementById("import-target-cat"),
      document.getElementById("export-scope-select")
    ].filter(Boolean);

    selects.forEach((sel) => {
      const prevVal = sel.value;
      const isExportScope = sel.id === "export-scope-select";
      sel.innerHTML = isExportScope ? '<option value="all">Все слова (полная база)</option>' : "";

      store.categories.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });

      if (prevVal) sel.value = prevVal;
    });
  }

  function populateCategoryPills() {
    if (!categoryPillsContainer) return;
    categoryPillsContainer.innerHTML = "";

    // "All words" pill
    const allPill = document.createElement("button");
    allPill.type = "button";
    allPill.className = `cat-pill ${store.currentCategoryId === "all" ? "active" : ""}`;
    allPill.innerHTML = `<span>Все слова</span><span class="pill-count">${store.allWordsCache.length}</span>`;
    allPill.addEventListener("click", () => {
      store.currentCategoryId = "all";
      store.selectedWordIds.clear();
      updateBatchActionsBar();
      populateCategoryPills();
      renderWordsView();
    });
    categoryPillsContainer.appendChild(allPill);

    store.categories.forEach((cat) => {
      const count = store.allWordsCache.filter((w) => w.categoryId === cat.id).length;
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `cat-pill ${store.currentCategoryId === cat.id ? "active" : ""}`;
      pill.innerHTML = `<span>${escapeHtml(cat.name)}</span><span class="pill-count">${count}</span>`;
      pill.addEventListener("click", () => {
        store.currentCategoryId = cat.id;
        store.selectedWordIds.clear();
        updateBatchActionsBar();
        populateCategoryPills();
        renderWordsView();
      });
      categoryPillsContainer.appendChild(pill);
    });
  }

  function renderWordsView() {
    const isAll = store.currentCategoryId === "all";

    if (activeCategoryTitle) {
      if (isAll) {
        activeCategoryTitle.textContent = "Все слова";
      } else {
        const c = store.categories.find((cat) => cat.id === store.currentCategoryId);
        activeCategoryTitle.textContent = c ? c.name : "Категория";
      }
    }

    if (renameCategoryBtn) renameCategoryBtn.style.display = isAll ? "none" : "inline-flex";
    if (deleteCategoryBtn) deleteCategoryBtn.style.display = isAll ? "none" : "inline-flex";
    if (thCategory) thCategory.style.display = isAll ? "table-cell" : "none";

    const isGlobal = isAll || (globalSearchCb && globalSearchCb.checked);

    if (isGlobal) {
      store.currentCategoryWords = [...store.allWordsCache];
    } else {
      store.currentCategoryWords = store.allWordsCache.filter((w) => w.categoryId === store.currentCategoryId);
    }

    // Apply search filter
    const query = (wordFilterInput ? wordFilterInput.value : "").trim().toLowerCase();
    let displayWords = store.currentCategoryWords;
    if (query) {
      displayWords = store.currentCategoryWords.filter((w) => {
        const matchDe = (w.de || "").toLowerCase().includes(query);
        const matchRu = (w.ru || "").toLowerCase().includes(query);
        const matchPlural = (w.plural || "").toLowerCase().includes(query);
        const matchFem = (w.feminine || "").toLowerCase().includes(query);
        const matchFemPlural = (w.femininePlural || "").toLowerCase().includes(query);
        const matchPrat = (w.praeteritum || "").toLowerCase().includes(query);
        const matchPart2 = (w.partizip2 || "").toLowerCase().includes(query);
        const matchPraes = (w.praesens || "").toLowerCase().includes(query);
        return matchDe || matchRu || matchPlural || matchFem || matchFemPlural || matchPrat || matchPart2 || matchPraes;
      });
    }

    if (activeCategorySubtitle) {
      activeCategorySubtitle.textContent = `Всего слов: ${displayWords.length}`;
    }

    renderWordsTable(displayWords, isGlobal);
  }

  function renderWordsTable(words, showCategoryCol = false) {
    if (!wordsTbody) return;
    wordsTbody.innerHTML = "";

    if (words.length === 0) {
      if (wordsEmptyNote) {
        wordsEmptyNote.textContent = wordFilterInput?.value ? "По вашему запросу слов не найдено" : "В этой категории пока нет слов";
        wordsEmptyNote.style.display = "block";
      }
      if (selectAllWordsCb) selectAllWordsCb.checked = false;
      return;
    }

    if (wordsEmptyNote) wordsEmptyNote.style.display = "none";

    words.forEach((w) => {
      const tr = document.createElement("tr");
      const isSelected = store.selectedWordIds.has(w.id);

      const catObj = store.categories.find((c) => c.id === w.categoryId);
      const catName = catObj ? catObj.name : "Без категории";

      let extraForms = [];
      if (w.plural) extraForms.push(`<span class="form-badge plural-badge" title="Множественное число">мн: ${escapeHtml(w.plural)}</span>`);
      if (w.feminine) extraForms.push(`<span class="form-badge fem-badge" title="Женский род">ж: ${escapeHtml(w.feminine)}</span>`);
      if (w.femininePlural) extraForms.push(`<span class="form-badge fem-plural-badge" title="Женский род (мн.ч.)">мн.ж: ${escapeHtml(w.femininePlural)}</span>`);
      if (w.praeteritum || w.partizip2) {
        const prat = w.praeteritum || "";
        const p2 = w.partizip2 ? `${w.hilfsverb === "sein" ? "ist" : "hat"} ${w.partizip2}` : "";
        extraForms.push(`<span class="form-badge singular-badge" title="Формы глагола">${escapeHtml([prat, p2].filter(Boolean).join(", "))}</span>`);
      }

      const catCell = showCategoryCol
        ? `<td style="vertical-align: middle; font-size: 12px; color: var(--text-muted);"><span class="category-tag">${escapeHtml(catName)}</span></td>`
        : "";

      tr.innerHTML = `
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="word-row-cb" data-id="${w.id}" ${isSelected ? "checked" : ""}>
        </td>
        <td style="font-weight: 600; vertical-align: middle;">
          <div>${formatGermanWord(w.de)}</div>
          ${extraForms.length > 0 ? `<div class="word-extra-forms">${extraForms.join("")}</div>` : ""}
        </td>
        <td style="color: var(--text-primary); vertical-align: middle;">
          ${escapeHtml(w.ru)}
        </td>
        ${catCell}
        <td style="text-align: right; vertical-align: middle; white-space: nowrap;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="small-btn edit-word-btn" title="Редактировать" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">✏️</button>
            <button type="button" class="small-btn move-word-btn" title="Перенести в другую категорию" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">📁</button>
            <button type="button" class="small-btn danger-btn delete-word-btn" title="Удалить" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">🗑️</button>
          </div>
        </td>
      `;

      // Checkbox
      tr.querySelector(".word-row-cb").addEventListener("change", (e) => {
        if (e.target.checked) store.selectedWordIds.add(w.id);
        else store.selectedWordIds.delete(w.id);
        updateBatchActionsBar();
      });

      // Edit
      tr.querySelector(".edit-word-btn").addEventListener("click", () => {
        openEditWordModal(w);
      });

      // Move
      tr.querySelector(".move-word-btn").addEventListener("click", () => {
        openMoveModal([w.id], `Перенос слова «${w.de}»`);
      });

      // Delete
      tr.querySelector(".delete-word-btn").addEventListener("click", async () => {
        const confirmed = await showConfirmDialog(
          "Удаление слова",
          `Вы действительно хотите удалить слово «${w.de}» (${w.ru})?`
        );
        if (!confirmed) return;

        try {
          await AdminApi.deleteWord(w.id);
          showToast(`Слово «${w.de}» удалено`, "success");
          store.selectedWordIds.delete(w.id);
          await store.loadInitialData();
        } catch (err) {
          showToast("Ошибка при удалении: " + err.message, "error");
        }
      });

      wordsTbody.appendChild(tr);
    });

    if (selectAllWordsCb) {
      selectAllWordsCb.checked = words.length > 0 && words.every((w) => store.selectedWordIds.has(w.id));
    }
  }

  function updateBatchActionsBar() {
    if (!batchActionsBar || !selectedCountEl) return;
    const count = store.selectedWordIds.size;
    if (count > 0) {
      batchActionsBar.style.display = "flex";
      selectedCountEl.textContent = count;
    } else {
      batchActionsBar.style.display = "none";
    }
  }

  // Search input listeners
  if (wordFilterInput) {
    wordFilterInput.addEventListener("input", () => {
      const q = wordFilterInput.value.trim();
      if (clearSearchBtn) clearSearchBtn.style.display = q ? "block" : "none";
      renderWordsView();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (wordFilterInput) wordFilterInput.value = "";
      clearSearchBtn.style.display = "none";
      renderWordsView();
      if (wordFilterInput) wordFilterInput.focus();
    });
  }

  if (globalSearchCb) {
    globalSearchCb.addEventListener("change", () => {
      renderWordsView();
    });
  }

  // Select all checkbox
  if (selectAllWordsCb) {
    selectAllWordsCb.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const cbs = wordsTbody.querySelectorAll(".word-row-cb");
      cbs.forEach((cb) => {
        cb.checked = isChecked;
        const id = cb.dataset.id;
        if (isChecked) store.selectedWordIds.add(id);
        else store.selectedWordIds.delete(id);
      });
      updateBatchActionsBar();
    });
  }

  // Cancel batch
  if (batchCancelBtn) {
    batchCancelBtn.addEventListener("click", () => {
      store.selectedWordIds.clear();
      wordsTbody.querySelectorAll(".word-row-cb").forEach((cb) => (cb.checked = false));
      if (selectAllWordsCb) selectAllWordsCb.checked = false;
      updateBatchActionsBar();
    });
  }

  // Batch delete
  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener("click", async () => {
      const count = store.selectedWordIds.size;
      if (count === 0) return;

      const confirmed = await showConfirmDialog(
        "Удаление выбранных слов",
        `Вы действительно хотите удалить ${count} выбранных слов? Это действие необратимо!`
      );
      if (!confirmed) return;

      try {
        const ids = Array.from(store.selectedWordIds);
        await AdminApi.batchDeleteWords(ids);
        showToast(`Удалено ${count} слов`, "success");
        store.selectedWordIds.clear();
        updateBatchActionsBar();
        await store.loadInitialData();
      } catch (err) {
        showToast("Ошибка массового удаления: " + err.message, "error");
      }
    });
  }

  // Batch move
  if (batchOpenMoveBtn) {
    batchOpenMoveBtn.addEventListener("click", () => {
      const count = store.selectedWordIds.size;
      if (count === 0) return;
      openMoveModal(Array.from(store.selectedWordIds), `Перенос ${count} выбранных слов`);
    });
  }

  // Move Modal Logic
  function openMoveModal(wordIds, desc) {
    movingWordIds = wordIds;
    if (moveModalText) moveModalText.textContent = desc;

    if (moveTargetCategory) {
      if (store.currentCategoryId !== "all") {
        const nextCat = store.categories.find((c) => c.id !== store.currentCategoryId);
        if (nextCat) moveTargetCategory.value = nextCat.id;
      }
    }

    openModal(moveModal);
  }

  cancelMoveBtn?.addEventListener("click", () => {
    closeModal(moveModal);
    movingWordIds = [];
  });

  confirmMoveBtn?.addEventListener("click", async () => {
    const targetCatId = moveTargetCategory ? moveTargetCategory.value : "";
    if (!targetCatId || movingWordIds.length === 0) return;

    try {
      await AdminApi.batchMoveWords(movingWordIds, targetCatId);
      const targetCat = store.categories.find((c) => c.id === targetCatId);
      showToast(`Перенесено ${movingWordIds.length} слов в категорию «${targetCat?.name || "..."}»`, "success");
      closeModal(moveModal);
      store.selectedWordIds.clear();
      updateBatchActionsBar();
      movingWordIds = [];
      await store.loadInitialData();
    } catch (err) {
      showToast("Ошибка при переносе: " + err.message, "error");
    }
  });

  // Open Add Word Modal
  if (openAddWordBtn) {
    openAddWordBtn.addEventListener("click", () => openAddWordModal());
  }

  function openAddWordModal() {
    store.editingWord = null;
    populateCategoryDropdowns();

    if (wordModalDupBanner) wordModalDupBanner.style.display = "none";
    if (wordModalTitle) wordModalTitle.textContent = "Добавление слова";

    if (wordModalCategory) {
      wordModalCategory.value = store.currentCategoryId !== "all" ? store.currentCategoryId : (store.categories[0]?.id || "");
    }

    if (wordModalDe) wordModalDe.value = "";
    if (wordModalRu) wordModalRu.value = "";
    if (wordModalPlural) wordModalPlural.value = "";
    if (wordModalFeminine) wordModalFeminine.value = "";
    if (wordModalFemininePlural) wordModalFemininePlural.value = "";
    if (wordModalPraeteritum) wordModalPraeteritum.value = "";
    if (wordModalPraesens) wordModalPraesens.value = "";
    if (wordModalHilfsverb) wordModalHilfsverb.value = "haben";
    if (wordModalPartizip2) wordModalPartizip2.value = "";

    openModal(wordModal);
    setTimeout(() => wordModalDe?.focus(), 50);
  }

  function openEditWordModal(w) {
    store.editingWord = w;
    populateCategoryDropdowns();

    if (wordModalDupBanner) wordModalDupBanner.style.display = "none";
    if (wordModalTitle) wordModalTitle.textContent = `Редактирование слова: ${w.de}`;

    if (wordModalCategory) wordModalCategory.value = w.categoryId || (store.categories[0]?.id || "");
    if (wordModalDe) wordModalDe.value = w.de || "";
    if (wordModalRu) wordModalRu.value = w.ru || "";
    if (wordModalPlural) wordModalPlural.value = w.plural || "";
    if (wordModalFeminine) wordModalFeminine.value = w.feminine || "";
    if (wordModalFemininePlural) wordModalFemininePlural.value = w.femininePlural || "";
    if (wordModalPraeteritum) wordModalPraeteritum.value = w.praeteritum || "";
    if (wordModalPraesens) wordModalPraesens.value = w.praesens || "";
    if (wordModalHilfsverb) wordModalHilfsverb.value = w.hilfsverb || "haben";
    if (wordModalPartizip2) wordModalPartizip2.value = w.partizip2 || "";

    openModal(wordModal);
    setTimeout(() => wordModalRu?.focus(), 50);
  }

  wordModalCancelBtn?.addEventListener("click", () => {
    closeModal(wordModal);
    store.editingWord = null;
  });

  wordModalSaveBtn?.addEventListener("click", async () => {
    const categoryId = wordModalCategory ? wordModalCategory.value : "";
    const de = wordModalDe ? wordModalDe.value.trim() : "";
    const ru = wordModalRu ? wordModalRu.value.trim() : "";
    const plural = wordModalPlural ? wordModalPlural.value.trim() : "";
    const feminine = wordModalFeminine ? wordModalFeminine.value.trim() : "";
    const femininePlural = wordModalFemininePlural ? wordModalFemininePlural.value.trim() : "";
    const praeteritum = wordModalPraeteritum ? wordModalPraeteritum.value.trim() : "";
    const praesens = wordModalPraesens ? wordModalPraesens.value.trim() : "";
    const hilfsverb = wordModalHilfsverb ? wordModalHilfsverb.value : "haben";
    const partizip2 = wordModalPartizip2 ? wordModalPartizip2.value.trim() : "";

    if (!de || !ru) {
      showToast("Заполните немецкое слово и русский перевод", "error");
      if (!de && wordModalDe) wordModalDe.focus();
      else if (wordModalRu) wordModalRu.focus();
      return;
    }

    if (!categoryId) {
      showToast("Выберите категорию для слова", "error");
      return;
    }

    const payload = {
      categoryId,
      de,
      ru,
      plural: plural || null,
      feminine: feminine || null,
      femininePlural: femininePlural || null,
      praeteritum: praeteritum || null,
      praesens: praesens || null,
      hilfsverb: hilfsverb || "haben",
      partizip2: partizip2 || null
    };

    try {
      if (store.editingWord) {
        await AdminApi.updateWord(store.editingWord.id, payload);
        showToast(`Слово «${de}» успешно обновлено!`, "success");
      } else {
        await AdminApi.createWord(payload);
        showToast(`Слово «${de}» успешно добавлено!`, "success");
      }

      closeModal(wordModal);
      store.editingWord = null;
      await store.loadInitialData();
    } catch (err) {
      showToast("Ошибка сохранения: " + err.message, "error");
    }
  });

  // Article helper buttons (der, die, das)
  document.querySelectorAll(".article-helper-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!wordModalDe) return;
      const article = (btn.dataset.article || "").trim();
      let val = wordModalDe.value.trim();
      val = val.replace(/^(der|die|das)\s+/i, "");
      wordModalDe.value = `${article} ${val}`.trim();
      wordModalDe.focus();
      checkDuplicateWord();
    });
  });

  // Verb auto-fill button inside word modal
  if (wordModalVerbAutofillBtn) {
    wordModalVerbAutofillBtn.addEventListener("click", () => {
      const de = wordModalDe ? wordModalDe.value.trim().toLowerCase() : "";
      if (!de) {
        showToast("Сначала введите инфинитив глагола", "info");
        wordModalDe?.focus();
        return;
      }

      const clean = de.replace(/^(der|die|das)\s+/i, "");
      const known = KNOWN_VERBS_DICT[clean];
      const reg = conjugateRegularVerb(clean);

      if (known) {
        if (wordModalPraeteritum) wordModalPraeteritum.value = known.praeteritum || "";
        if (wordModalPraesens) wordModalPraesens.value = known.praesens || "";
        if (wordModalHilfsverb) wordModalHilfsverb.value = known.hilfsverb || "haben";
        if (wordModalPartizip2) wordModalPartizip2.value = known.partizip2 || "";
        if (wordModalRu && !wordModalRu.value.trim() && known.ru) {
          wordModalRu.value = known.ru;
        }
        showToast(`Формы для «${clean}» автозаполнены!`, "info");
      } else if (reg) {
        if (wordModalPraeteritum) wordModalPraeteritum.value = reg.praeteritum || "";
        if (wordModalPraesens) wordModalPraesens.value = reg.praesens || "";
        if (wordModalHilfsverb) wordModalHilfsverb.value = reg.hilfsverb || "haben";
        if (wordModalPartizip2) wordModalPartizip2.value = reg.partizip2 || "";
        showToast(`Стандартные формы для «${clean}» сгенерированы!`, "info");
      } else {
        showToast("Не удалось автоматически определить формы", "info");
      }
    });
  }

  // Duplicate word check
  wordModalDe?.addEventListener("input", () => checkDuplicateWord());

  function checkDuplicateWord() {
    if (!wordModalDupBanner || !wordModalDe) return;
    const val = wordModalDe.value.trim().toLowerCase();
    if (!val) {
      wordModalDupBanner.style.display = "none";
      return;
    }

    const dup = store.allWordsCache.find((w) => {
      if (store.editingWord && w.id === store.editingWord.id) return false;
      return (w.de || "").toLowerCase().trim() === val;
    });

    if (dup) {
      const cat = store.categories.find((c) => c.id === dup.categoryId);
      const catName = cat ? cat.name : "другой категории";
      wordModalDupBanner.textContent = `⚠️ Слово «${dup.de}» уже есть в категории «${catName}» (перевод: ${dup.ru}).`;
      wordModalDupBanner.style.display = "block";
    } else {
      wordModalDupBanner.style.display = "none";
    }
  }

  // Category CRUD
  if (openAddCategoryBtn) {
    openAddCategoryBtn.addEventListener("click", async () => {
      const name = await showCategoryModal("Новая категория", "Название категории:", "", "Например: Профессии");
      if (!name) return;

      try {
        const created = await AdminApi.createCategory(name);
        showToast(`Категория «${name}» успешно создана!`, "success");
        store.currentCategoryId = created.id;
        await store.loadInitialData();
      } catch (err) {
        showToast("Ошибка создания категории: " + err.message, "error");
      }
    });
  }

  if (renameCategoryBtn) {
    renameCategoryBtn.addEventListener("click", async () => {
      if (store.currentCategoryId === "all") return;
      const currentCat = store.categories.find((c) => c.id === store.currentCategoryId);
      if (!currentCat) return;

      const newName = await showCategoryModal("Переименование категории", "Новое название:", currentCat.name);
      if (!newName || newName === currentCat.name) return;

      try {
        await AdminApi.updateCategory(currentCat.id, newName);
        showToast(`Категория переименована в «${newName}»!`, "success");
        await store.loadInitialData();
      } catch (err) {
        showToast("Ошибка переименования: " + err.message, "error");
      }
    });
  }

  if (deleteCategoryBtn) {
    deleteCategoryBtn.addEventListener("click", async () => {
      if (store.currentCategoryId === "all") return;
      const currentCat = store.categories.find((c) => c.id === store.currentCategoryId);
      if (!currentCat) return;

      const count = store.allWordsCache.filter((w) => w.categoryId === currentCat.id).length;
      const confirmed = await showConfirmDialog(
        "Удаление категории",
        `Вы действительно хотите удалить категорию «${currentCat.name}»? В ней содержится ${count} слов. Все слова этой категории также будут удалены!`
      );
      if (!confirmed) return;

      try {
        await AdminApi.deleteCategory(currentCat.id);
        showToast(`Категория «${currentCat.name}» удалена`, "success");
        store.currentCategoryId = "all";
        await store.loadInitialData();
      } catch (err) {
        showToast("Ошибка удаления категории: " + err.message, "error");
      }
    });
  }
}
