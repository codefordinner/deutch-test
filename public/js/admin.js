/**
 * Modern Admin Panel Controller for German Trainer
 * Version 1.1.0
 */
(function () {
  // State
  let categories = [];
  let currentCategoryId = "all"; // 'all' or category id
  let currentCategoryWords = [];
  let allWordsCache = [];
  let selectedWordIds = new Set();
  let editingWord = null; // null if adding, word object if editing

  // Verbs State
  let allVerbs = [];
  let currentVerbFilter = "all"; // 'all' | 'irregular' | 'regular'
  let currentVerbSearch = "";
  let selectedVerbIds = new Set();
  let editingVerb = null; // null if adding, verb object if editing

  // Analytics State
  let analyticsStats = null;
  let analyticsLogs = [];
  let currentLogsPage = 1;
  let totalLogsPages = 1;
  let analyticsPollInterval = null;

  // DOM Elements
  const navTabs = document.querySelectorAll(".admin-nav-btn");
  const tabContents = document.querySelectorAll(".admin-tab-content");
  const categoryPillsContainer = document.getElementById("category-pills-container");
  const activeCategoryTitle = document.getElementById("active-category-title");
  const activeCategorySubtitle = document.getElementById("active-category-subtitle");
  const renameCategoryBtn = document.getElementById("rename-category-btn");
  const deleteCategoryBtn = document.getElementById("delete-category-btn");
  const openAddCategoryBtn = document.getElementById("open-add-category-btn");
  const openAddWordBtn = document.getElementById("open-add-word-btn");

  const wordFilterInput = document.getElementById("word-filter-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const globalSearchCb = document.getElementById("global-search-cb");
  const selectAllWordsCb = document.getElementById("select-all-words");
  const wordsTbody = document.getElementById("words-tbody");
  const wordsEmptyNote = document.getElementById("words-empty-note");
  const thCategory = document.getElementById("th-category");

  // Batch actions
  const batchActionsBar = document.getElementById("batch-actions-bar");
  const selectedCountSpan = document.getElementById("selected-count");
  const batchOpenMoveBtn = document.getElementById("batch-open-move-btn");
  const batchDeleteBtn = document.getElementById("batch-delete-btn");
  const batchCancelBtn = document.getElementById("batch-cancel-btn");

  // Modals
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
  const wordModalDupBanner = document.getElementById("word-modal-dup-banner");
  const wordModalCancelBtn = document.getElementById("word-modal-cancel-btn");
  const wordModalSaveBtn = document.getElementById("word-modal-save-btn");

  const categoryModal = document.getElementById("category-modal");
  const categoryModalTitle = document.getElementById("category-modal-title");
  const categoryModalLabel = document.getElementById("category-modal-label");
  const categoryModalInput = document.getElementById("category-modal-input");
  const categoryModalCancelBtn = document.getElementById("category-modal-cancel-btn");
  const categoryModalSaveBtn = document.getElementById("category-modal-save-btn");

  // Verbs DOM Elements
  const verbsCountTotal = document.getElementById("verbs-count-total");
  const verbsCountIrregular = document.getElementById("verbs-count-irregular");
  const verbsCountRegular = document.getElementById("verbs-count-regular");
  const openAddVerbBtn = document.getElementById("open-add-verb-btn");
  const verbFilterTabs = document.querySelectorAll(".verb-filter-tab");
  const vfilterCountAll = document.getElementById("vfilter-count-all");
  const vfilterCountIrreg = document.getElementById("vfilter-count-irreg");
  const vfilterCountReg = document.getElementById("vfilter-count-reg");
  const verbFilterInput = document.getElementById("verb-filter-input");
  const clearVerbSearchBtn = document.getElementById("clear-verb-search-btn");
  const selectAllVerbsCb = document.getElementById("select-all-verbs");
  const verbsTbody = document.getElementById("verbs-tbody");
  const verbsEmptyNote = document.getElementById("verbs-empty-note");
  const verbsBatchActionsBar = document.getElementById("verbs-batch-actions-bar");
  const verbsSelectedCount = document.getElementById("verbs-selected-count");
  const verbsBatchDeleteBtn = document.getElementById("verbs-batch-delete-btn");
  const verbsBatchCancelBtn = document.getElementById("verbs-batch-cancel-btn");

  // Verb Modal Elements
  const verbModal = document.getElementById("verb-modal");
  const verbModalTitle = document.getElementById("verb-modal-title");
  const verbModalDe = document.getElementById("verb-modal-de");
  const verbModalRu = document.getElementById("verb-modal-ru");
  const verbModalType = document.getElementById("verb-modal-type");
  const verbModalCategory = document.getElementById("verb-modal-category");
  const verbModalAutofillBtn = document.getElementById("verb-modal-autofill-btn");
  const verbModalPraesens = document.getElementById("verb-modal-praesens");
  const verbModalPraeteritum = document.getElementById("verb-modal-praeteritum");
  const verbModalHilfsverb = document.getElementById("verb-modal-hilfsverb");
  const verbModalPartizip2 = document.getElementById("verb-modal-partizip2");
  const verbModalVowelNote = document.getElementById("verb-modal-vowel-note");
  const vpreviewIch = document.getElementById("vpreview-ich");
  const vpreviewDu = document.getElementById("vpreview-du");
  const vpreviewEr = document.getElementById("vpreview-er");
  const vpreviewWir = document.getElementById("vpreview-wir");
  const vpreviewIhr = document.getElementById("vpreview-ihr");
  const vpreviewSie = document.getElementById("vpreview-sie");
  const verbModalDupBanner = document.getElementById("verb-modal-dup-banner");
  const verbModalCancelBtn = document.getElementById("verb-modal-cancel-btn");
  const verbModalSaveBtn = document.getElementById("verb-modal-save-btn");

  const moveModal = document.getElementById("move-modal");
  const moveModalText = document.getElementById("move-modal-text");
  const moveTargetCategory = document.getElementById("move-target-category");
  const cancelMoveBtn = document.getElementById("cancel-move-btn");
  const confirmMoveBtn = document.getElementById("confirm-move-btn");

  const confirmModal = document.getElementById("confirm-modal");
  const confirmModalTitle = document.getElementById("confirm-modal-title");
  const confirmModalMessage = document.getElementById("confirm-modal-message");
  const confirmModalCancelBtn = document.getElementById("confirm-modal-cancel-btn");
  const confirmModalOkBtn = document.getElementById("confirm-modal-ok-btn");

  const toastContainer = document.getElementById("toast-container");

  // ==================== TOAST & DIALOG HELPERS ====================

  function showToast(message, type = "info", duration = 3500) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "⚠️";

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${icon}</span>
        <span>${escapeHtml(message)}</span>
      </div>
      <button type="button" class="toast-close" title="Закрыть">✕</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  let confirmResolve = null;
  function showConfirmDialog(title, message, okText = "Подтвердить", isDanger = true) {
    return new Promise((resolve) => {
      confirmResolve = resolve;
      confirmModalTitle.textContent = title;
      confirmModalMessage.textContent = message;
      confirmModalOkBtn.textContent = okText;
      confirmModalOkBtn.className = isDanger ? "danger-btn" : "";
      confirmModal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    });
  }

  confirmModalCancelBtn.addEventListener("click", () => {
    confirmModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (confirmResolve) confirmResolve(false);
  });

  confirmModalOkBtn.addEventListener("click", () => {
    confirmModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (confirmResolve) confirmResolve(true);
  });

  let promptResolve = null;
  function showCategoryModal(title, label, defaultValue = "", placeholder = "") {
    return new Promise((resolve) => {
      promptResolve = resolve;
      categoryModalTitle.textContent = title;
      categoryModalLabel.textContent = label;
      categoryModalInput.value = defaultValue;
      categoryModalInput.placeholder = placeholder;
      categoryModal.classList.remove("hidden");
      document.body.classList.add("modal-open");
      setTimeout(() => categoryModalInput.focus(), 50);
    });
  }

  categoryModalCancelBtn.addEventListener("click", () => {
    categoryModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (promptResolve) promptResolve(null);
  });

  categoryModalSaveBtn.addEventListener("click", () => {
    const val = categoryModalInput.value.trim();
    if (!val) {
      showToast("Пожалуйста, введите название", "error");
      categoryModalInput.focus();
      return;
    }
    categoryModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (promptResolve) promptResolve(val);
  });

  categoryModalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      categoryModalSaveBtn.click();
    } else if (e.key === "Escape") {
      categoryModalCancelBtn.click();
    }
  });

  // Modal overlay click to close
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
        document.body.classList.remove("modal-open");
      }
    });
    const closeBtn = overlay.querySelector(".js-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        overlay.classList.add("hidden");
        document.body.classList.remove("modal-open");
      });
    }
  });

  // ==================== NAVIGATION TABS ====================

  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;
      navTabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      const activeContent = document.getElementById(targetId);
      if (activeContent) activeContent.classList.add("active");

      if (targetId === "tab-analytics") {
        loadAnalyticsData();
        startAnalyticsAutoPoll();
      } else {
        stopAnalyticsAutoPoll();
      }

      if (targetId === "tab-verbs") {
        refreshVerbsData();
      }

      if (targetId === "tab-io") {
        populateCategoryDropdowns();
      }
    });
  });

  // ==================== DATA LOADING ====================

  async function loadInitialData() {
    try {
      categories = await ApiClient.get("/api/categories");
      const allWords = await ApiClient.get("/api/words");
      allWordsCache = allWords || [];
      refreshVerbsData();
      await loadWordsForCurrentCategory();
      renderCategoryPills();
      populateCategoryDropdowns();
    } catch (err) {
      showToast("Ошибка загрузки данных: " + err.message, "error");
    }
  }

  async function loadWordsForCurrentCategory() {
    try {
      if (currentCategoryId === "all") {
        currentCategoryWords = await ApiClient.get("/api/words");
        allWordsCache = currentCategoryWords.slice();
      } else {
        const cat = await ApiClient.get(`/api/categories/${currentCategoryId}`);
        currentCategoryWords = cat.words || [];
        // Refresh allWordsCache in background for duplicate checking
        ApiClient.get("/api/words").then(w => { allWordsCache = w || []; }).catch(() => {});
      }
      selectedWordIds.clear();
      updateBatchActionsBar();
      renderWordsTable();
      updateCategoryHeader();
    } catch (err) {
      showToast("Ошибка загрузки слов: " + err.message, "error");
    }
  }

  function renderCategoryPills() {
    if (!categoryPillsContainer) return;
    categoryPillsContainer.innerHTML = "";

    const totalWords = categories.reduce((sum, c) => sum + (c._count?.words || c.words?.length || 0), 0);

    // "All categories" pill
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = `cat-pill-btn ${currentCategoryId === "all" ? "active" : ""}`;
    allBtn.innerHTML = `<span>Все категории</span><span class="cat-pill-count">${totalWords}</span>`;
    allBtn.addEventListener("click", () => {
      currentCategoryId = "all";
      renderCategoryPills();
      loadWordsForCurrentCategory();
    });
    categoryPillsContainer.appendChild(allBtn);

    // Individual category pills
    categories.forEach((cat) => {
      const count = cat._count?.words !== undefined ? cat._count.words : (cat.words?.length || 0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `cat-pill-btn ${currentCategoryId === cat.id ? "active" : ""}`;
      btn.innerHTML = `<span>${escapeHtml(cat.name)}</span><span class="cat-pill-count">${count}</span>`;
      btn.addEventListener("click", () => {
        currentCategoryId = cat.id;
        renderCategoryPills();
        loadWordsForCurrentCategory();
      });
      categoryPillsContainer.appendChild(btn);
    });
  }

  function updateCategoryHeader() {
    if (currentCategoryId === "all") {
      activeCategoryTitle.textContent = "Все категории";
      activeCategorySubtitle.textContent = `Всего слов: ${currentCategoryWords.length}`;
      renameCategoryBtn.style.display = "none";
      deleteCategoryBtn.style.display = "none";
      if (thCategory) thCategory.style.display = "";
    } else {
      const cat = categories.find((c) => c.id === currentCategoryId);
      if (cat) {
        activeCategoryTitle.textContent = cat.name;
        activeCategorySubtitle.textContent = `Слов в категории: ${currentCategoryWords.length}`;
        renameCategoryBtn.style.display = "";
        deleteCategoryBtn.style.display = "";
      }
      if (thCategory && !globalSearchCb.checked) thCategory.style.display = "none";
    }
  }

  function populateCategoryDropdowns() {
    const dropdowns = [
      wordModalCategory,
      verbModalCategory,
      moveTargetCategory,
      document.getElementById("export-scope-select"),
      document.getElementById("import-target-cat")
    ];

    dropdowns.forEach((dd) => {
      if (!dd) return;
      const prevVal = dd.value;
      dd.innerHTML = "";

      if (dd.id === "export-scope-select") {
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "Весь словарь (все категории)";
        dd.appendChild(optAll);
      }

      categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        dd.appendChild(opt);
      });

      if (prevVal && dd.querySelector(`option[value="${prevVal}"]`)) {
        dd.value = prevVal;
      } else if (currentCategoryId !== "all" && dd.querySelector(`option[value="${currentCategoryId}"]`)) {
        dd.value = currentCategoryId;
      }
    });
  }

  // ==================== WORD TABLE RENDERING ====================

  function formatGermanWord(deText) {
    if (!deText) return "";
    const lower = deText.toLowerCase().trim();
    if (lower.startsWith("der ")) {
      return `<span class="gender-der">der</span> ${escapeHtml(deText.slice(4))}`;
    } else if (lower.startsWith("die ")) {
      return `<span class="gender-die">die</span> ${escapeHtml(deText.slice(4))}`;
    } else if (lower.startsWith("das ")) {
      return `<span class="gender-das">das</span> ${escapeHtml(deText.slice(4))}`;
    }
    return escapeHtml(deText);
  }

  function renderWordsTable() {
    if (!wordsTbody) return;
    wordsTbody.innerHTML = "";

    const query = (wordFilterInput.value || "").trim().toLowerCase();
    const isGlobal = globalSearchCb.checked || currentCategoryId === "all";

    if (thCategory) {
      thCategory.style.display = isGlobal ? "" : "none";
    }

    let sourceList = currentCategoryWords;
    if (globalSearchCb.checked && currentCategoryId !== "all") {
      sourceList = allWordsCache;
    }

    const filtered = sourceList.filter((word) => {
      if (!query) return true;
      const de = (word.de || "").toLowerCase();
      const ru = (word.ru || "").toLowerCase();
      const plural = (word.plural || "").toLowerCase();
      const feminine = (word.feminine || "").toLowerCase();
      const femininePlural = (word.femininePlural || "").toLowerCase();
      const catName = (word.category?.name || "").toLowerCase();
      return de.includes(query) || ru.includes(query) || plural.includes(query) || feminine.includes(query) || femininePlural.includes(query) || catName.includes(query);
    });

    if (filtered.length === 0) {
      wordsTbody.innerHTML = "";
      wordsEmptyNote.style.display = "block";
      wordsEmptyNote.textContent = query
        ? "По вашему запросу ничего не найдено"
        : "В этой категории пока нет слов. Нажмите «Добавить слово», чтобы начать!";
      selectAllWordsCb.checked = false;
      return;
    }

    wordsEmptyNote.style.display = "none";

    const allFilteredSelected = filtered.length > 0 && filtered.every((w) => selectedWordIds.has(w.id));
    selectAllWordsCb.checked = allFilteredSelected;

    filtered.forEach((word) => {
      const tr = document.createElement("tr");
      const isChecked = selectedWordIds.has(word.id);

      let extraBadgesHtml = "";
      if (word.plural) {
        extraBadgesHtml += `<span class="form-badge plural-badge" title="Множественное число (общ./м.р.)">мн.ч: ${escapeHtml(word.plural)}</span>`;
      }
      if (word.feminine) {
        extraBadgesHtml += `<span class="form-badge fem-badge" title="Женский род (ед.ч.)">ж.р: ${escapeHtml(word.feminine)}</span>`;
      }
      if (word.femininePlural) {
        extraBadgesHtml += `<span class="form-badge fem-plural-badge" title="Множественное число женского рода">мн.ж: ${escapeHtml(word.femininePlural)}</span>`;
      }
      if (word.praeteritum || word.partizip2) {
        const aux = (word.hilfsverb === "sein" || word.hilfsverb === "ist") ? "ist " : "hat ";
        const fullP2 = word.partizip2 ? aux + word.partizip2 : "";
        const parts = [word.praeteritum, fullP2].filter(Boolean).join(", ");
        extraBadgesHtml += `<span class="form-badge" style="background: rgba(139, 92, 246, 0.12); color: #7c3aed;" title="Формы глагола">⚡ ${escapeHtml(parts)}</span>`;
      }
      if (word.praesens) {
        extraBadgesHtml += `<span class="form-badge" style="background: rgba(14, 165, 233, 0.12); color: #0284c7;" title="3-е лицо ед.ч. Präsens">er ${escapeHtml(word.praesens)}</span>`;
      }

      let categoryCellHtml = "";
      if (isGlobal) {
        const catName = word.category?.name || categories.find((c) => c.id === word.categoryId)?.name || "—";
        categoryCellHtml = `<td><span class="category-tag">${escapeHtml(catName)}</span></td>`;
      }

      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="word-row-cb" data-id="${word.id}" ${isChecked ? "checked" : ""}>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 14px;">${formatGermanWord(word.de)}</div>
          ${extraBadgesHtml ? `<div class="word-extra-forms">${extraBadgesHtml}</div>` : ""}
        </td>
        <td>
          <div style="font-size: 14px; color: var(--text-primary);">${escapeHtml(word.ru)}</div>
        </td>
        ${categoryCellHtml}
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="small-btn ghost-btn edit-word-btn" data-id="${word.id}" title="Редактировать">✏️ Изменить</button>
          <button type="button" class="small-btn ghost-btn move-word-btn" data-id="${word.id}" title="Перенести в другую категорию">📁</button>
          <button type="button" class="small-btn ghost-btn danger-hover delete-word-btn" data-id="${word.id}" title="Удалить слово" style="color: var(--danger);">🗑️</button>
        </td>
      `;

      // Checkbox event
      const cb = tr.querySelector(".word-row-cb");
      cb.addEventListener("change", (e) => {
        if (e.target.checked) {
          selectedWordIds.add(word.id);
        } else {
          selectedWordIds.delete(word.id);
        }
        updateBatchActionsBar();
      });

      // Edit button
      tr.querySelector(".edit-word-btn").addEventListener("click", () => openWordModal(word));

      // Move single button
      tr.querySelector(".move-word-btn").addEventListener("click", () => openMoveModal([word.id]));

      // Delete button
      tr.querySelector(".delete-word-btn").addEventListener("click", async () => {
        const confirmed = await showConfirmDialog(
          "Удаление слова",
          `Вы действительно хотите удалить слово «${word.de}» (${word.ru})?`
        );
        if (!confirmed) return;

        try {
          await ApiClient.delete(`/api/words/${word.id}`);
          showToast(`Слово «${word.de}» удалено`, "success");
          selectedWordIds.delete(word.id);
          await loadInitialData();
        } catch (err) {
          showToast("Ошибка при удалении: " + err.message, "error");
        }
      });

      wordsTbody.appendChild(tr);
    });
  }

  // Select all checkbox
  selectAllWordsCb.addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    const cbs = wordsTbody.querySelectorAll(".word-row-cb");
    cbs.forEach((cb) => {
      cb.checked = isChecked;
      const id = cb.dataset.id;
      if (isChecked) selectedWordIds.add(id);
      else selectedWordIds.delete(id);
    });
    updateBatchActionsBar();
  });

  function updateBatchActionsBar() {
    const count = selectedWordIds.size;
    if (count > 0) {
      batchActionsBar.style.display = "flex";
      selectedCountSpan.textContent = count;
    } else {
      batchActionsBar.style.display = "none";
    }
  }

  batchCancelBtn.addEventListener("click", () => {
    selectedWordIds.clear();
    wordsTbody.querySelectorAll(".word-row-cb").forEach((cb) => (cb.checked = false));
    selectAllWordsCb.checked = false;
    updateBatchActionsBar();
  });

  // Batch delete
  batchDeleteBtn.addEventListener("click", async () => {
    const count = selectedWordIds.size;
    if (count === 0) return;

    const confirmed = await showConfirmDialog(
      "Удаление выбранных слов",
      `Вы действительно хотите удалить выбранные слова (${count} шт.)? Это действие нельзя отменить.`
    );
    if (!confirmed) return;

    try {
      const ids = Array.from(selectedWordIds);
      await Promise.all(ids.map((id) => ApiClient.delete(`/api/words/${id}`)));
      showToast(`Удалено ${count} слов`, "success");
      selectedWordIds.clear();
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка при массовом удалении: " + err.message, "error");
    }
  });

  // Batch move
  batchOpenMoveBtn.addEventListener("click", () => {
    if (selectedWordIds.size === 0) return;
    openMoveModal(Array.from(selectedWordIds));
  });

  function openMoveModal(wordIds) {
    populateCategoryDropdowns();
    moveModalText.textContent = `Перенос ${wordIds.length} ${wordIds.length === 1 ? "слова" : "слов"} в другой раздел.`;
    moveModal.dataset.wordIds = JSON.stringify(wordIds);
    moveModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  cancelMoveBtn.addEventListener("click", () => {
    moveModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  });

  confirmMoveBtn.addEventListener("click", async () => {
    const targetCatId = moveTargetCategory.value;
    if (!targetCatId) {
      showToast("Выберите категорию назначения", "error");
      return;
    }

    const wordIds = JSON.parse(moveModal.dataset.wordIds || "[]");
    if (wordIds.length === 0) return;

    try {
      await Promise.all(
        wordIds.map((id) =>
          ApiClient.put(`/api/words/${id}`, {
            categoryId: targetCatId
          })
        )
      );
      showToast(`Перенесено ${wordIds.length} слов`, "success");
      moveModal.classList.add("hidden");
      document.body.classList.remove("modal-open");
      selectedWordIds.clear();
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка переноса: " + err.message, "error");
    }
  });

  // Search filter listeners
  wordFilterInput.addEventListener("input", () => {
    clearSearchBtn.style.display = wordFilterInput.value ? "block" : "none";
    renderWordsTable();
  });

  clearSearchBtn.addEventListener("click", () => {
    wordFilterInput.value = "";
    clearSearchBtn.style.display = "none";
    renderWordsTable();
    wordFilterInput.focus();
  });

  globalSearchCb.addEventListener("change", () => {
    renderWordsTable();
  });

  // ==================== WORD ADD & EDIT MODAL ====================

  function openWordModal(word = null) {
    editingWord = word;
    populateCategoryDropdowns();
    wordModalDupBanner.style.display = "none";

    if (word) {
      wordModalTitle.textContent = "Редактирование слова";
      wordModalCategory.value = word.categoryId || currentCategoryId;
      wordModalDe.value = word.de || "";
      wordModalRu.value = word.ru || "";
      wordModalPlural.value = word.plural || "";
      wordModalFeminine.value = word.feminine || "";
      if (wordModalFemininePlural) wordModalFemininePlural.value = word.femininePlural || "";
      if (wordModalPraeteritum) wordModalPraeteritum.value = word.praeteritum || "";
      if (wordModalPraesens) wordModalPraesens.value = word.praesens || "";
      if (wordModalHilfsverb) wordModalHilfsverb.value = (word.hilfsverb === "sein" || word.hilfsverb === "ist") ? "sein" : "haben";
      if (wordModalPartizip2) wordModalPartizip2.value = word.partizip2 || "";
    } else {
      wordModalTitle.textContent = "Добавление нового слова";
      if (currentCategoryId !== "all") {
        wordModalCategory.value = currentCategoryId;
      }
      wordModalDe.value = "";
      wordModalRu.value = "";
      wordModalPlural.value = "";
      wordModalFeminine.value = "";
      if (wordModalFemininePlural) wordModalFemininePlural.value = "";
      if (wordModalPraeteritum) wordModalPraeteritum.value = "";
      if (wordModalPraesens) wordModalPraesens.value = "";
      if (wordModalHilfsverb) wordModalHilfsverb.value = "haben";
      if (wordModalPartizip2) wordModalPartizip2.value = "";
    }

    wordModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    setTimeout(() => wordModalDe.focus(), 50);
  }

  openAddWordBtn.addEventListener("click", () => openWordModal(null));

  wordModalCancelBtn.addEventListener("click", () => {
    wordModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  });

  // Article helper buttons (der / die / das)
  document.querySelectorAll(".article-helper-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const art = btn.dataset.article;
      let val = wordModalDe.value.trim();
      // Strip existing articles
      val = val.replace(/^(der|die|das)\s+/i, "");
      wordModalDe.value = art + val;
      wordModalDe.focus();
      checkDuplicate();
    });
  });

  function checkDuplicate() {
    const val = wordModalDe.value.trim().toLowerCase();
    if (!val) {
      wordModalDupBanner.style.display = "none";
      return;
    }

    const dup = allWordsCache.find((w) => {
      if (editingWord && w.id === editingWord.id) return false;
      return (w.de || "").toLowerCase().trim() === val;
    });

    if (dup) {
      const catName = dup.category?.name || "другой категории";
      wordModalDupBanner.textContent = `⚠️ Слово «${dup.de}» уже есть в категории «${catName}» (перевод: ${dup.ru}).`;
      wordModalDupBanner.style.display = "block";
    } else {
      wordModalDupBanner.style.display = "none";
    }
  }

  wordModalDe.addEventListener("input", checkDuplicate);

  const wordModalVerbAutofillBtn = document.getElementById("word-modal-verb-autofill-btn");
  if (wordModalVerbAutofillBtn) {
    wordModalVerbAutofillBtn.addEventListener("click", () => {
      const inf = wordModalDe ? wordModalDe.value.trim().toLowerCase().replace(/^(der|die|das)\s+/i, "") : "";
      if (!inf) {
        showToast("Сначала введите немецкое слово / инфинитив", "info");
        if (wordModalDe) wordModalDe.focus();
        return;
      }
      const known = KNOWN_VERBS_DICT[inf];
      const reg = conjugateRegularVerb(inf);
      if (known) {
        if (wordModalPraesens) wordModalPraesens.value = known.praesens || "";
        if (wordModalPraeteritum) wordModalPraeteritum.value = known.praeteritum || "";
        if (wordModalHilfsverb) wordModalHilfsverb.value = known.hilfsverb || "haben";
        if (wordModalPartizip2) wordModalPartizip2.value = known.partizip2 || "";
        if (wordModalRu && !wordModalRu.value.trim() && known.ru) wordModalRu.value = known.ru;
        showToast(`Формы для «${inf}» автозаполнены!`, "info");
      } else if (reg) {
        if (wordModalPraesens) wordModalPraesens.value = reg.praesens || "";
        if (wordModalPraeteritum) wordModalPraeteritum.value = reg.praeteritum || "";
        if (wordModalHilfsverb) wordModalHilfsverb.value = reg.hilfsverb || "haben";
        if (wordModalPartizip2) wordModalPartizip2.value = reg.partizip2 || "";
        showToast(`Формы для «${inf}» сгенерированы!`, "info");
      } else {
        showToast("Не удалось определить формы для этого слова", "info");
      }
    });
  }

  wordModalSaveBtn.addEventListener("click", async () => {
    const categoryId = wordModalCategory.value;
    const de = wordModalDe.value.trim();
    const ru = wordModalRu.value.trim();
    const plural = wordModalPlural.value.trim() || null;
    const feminine = wordModalFeminine.value.trim() || null;
    const femininePlural = wordModalFemininePlural ? (wordModalFemininePlural.value.trim() || null) : null;
    const praeteritum = wordModalPraeteritum ? (wordModalPraeteritum.value.trim() || null) : null;
    const praesens = wordModalPraesens ? (wordModalPraesens.value.trim() || null) : null;
    const hilfsverb = wordModalHilfsverb ? (wordModalHilfsverb.value || "haben") : null;
    const partizip2 = wordModalPartizip2 ? (wordModalPartizip2.value.trim() || null) : null;

    if (!categoryId) {
      showToast("Выберите категорию для слова", "error");
      return;
    }
    if (!de || !ru) {
      showToast("Заполните немецкое слово и перевод", "error");
      if (!de) wordModalDe.focus();
      else wordModalRu.focus();
      return;
    }

    try {
      const payload = {
        categoryId,
        de,
        ru,
        plural,
        feminine,
        femininePlural,
        praeteritum,
        praesens,
        hilfsverb,
        partizip2
      };

      if (editingWord) {
        await ApiClient.put(`/api/words/${editingWord.id}`, payload);
        showToast(`Слово «${de}» успешно обновлено!`, "success");
      } else {
        await (ApiClient.createWord ? ApiClient.createWord(payload) : ApiClient.post("/api/words", payload));
        showToast(`Слово «${de}» добавлено!`, "success");
      }

      wordModal.classList.add("hidden");
      document.body.classList.remove("modal-open");
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка сохранения: " + err.message, "error");
    }
  });

  // Enter to save inside word modal
  [
    wordModalDe,
    wordModalRu,
    wordModalPlural,
    wordModalFeminine,
    wordModalFemininePlural,
    wordModalPraeteritum,
    wordModalPraesens,
    wordModalPartizip2
  ].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        wordModalSaveBtn.click();
      }
    });
  });

  // ==================== CATEGORY ACTIONS ====================

  openAddCategoryBtn.addEventListener("click", async () => {
    const name = await showCategoryModal("Новая категория", "Введите название нового раздела:", "", "Например: Мебель и дом");
    if (!name) return;

    try {
      const created = await ApiClient.post("/api/categories", { name });
      showToast(`Категория «${name}» создана!`, "success");
      currentCategoryId = created.id;
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка создания категории: " + err.message, "error");
    }
  });

  renameCategoryBtn.addEventListener("click", async () => {
    if (currentCategoryId === "all") return;
    const cat = categories.find((c) => c.id === currentCategoryId);
    if (!cat) return;

    const newName = await showCategoryModal("Переименование категории", "Новое название категории:", cat.name);
    if (!newName || newName === cat.name) return;

    try {
      await ApiClient.put(`/api/categories/${cat.id}`, { name: newName });
      showToast(`Категория переименована в «${newName}»!`, "success");
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка переименования: " + err.message, "error");
    }
  });

  deleteCategoryBtn.addEventListener("click", async () => {
    if (currentCategoryId === "all") return;
    const cat = categories.find((c) => c.id === currentCategoryId);
    if (!cat) return;

    const confirmed = await showConfirmDialog(
      "Удаление категории",
      `Вы действительно хотите удалить категорию «${cat.name}» со всеми словами в ней? Это действие необратимо!`
    );
    if (!confirmed) return;

    try {
      await ApiClient.delete(`/api/categories/${cat.id}`);
      showToast(`Категория «${cat.name}» удалена`, "success");
      currentCategoryId = "all";
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка удаления: " + err.message, "error");
    }
  });

  // ==================== VERBS CONTROLLER ====================

  const KNOWN_VERBS_DICT = {
    sein: { ru: "быть, являться", isIrregular: true, praesens: "ist", praeteritum: "war", partizip2: "gewesen", hilfsverb: "sein", forms: { ich: "bin", du: "bist", er: "ist", wir: "sind", ihr: "seid", sie: "sind" }, vowelChange: "неправильное спряжение (bin, bist, ist)" },
    haben: { ru: "иметь", isIrregular: true, praesens: "hat", praeteritum: "hatte", partizip2: "gehabt", hilfsverb: "haben", forms: { ich: "habe", du: "hast", er: "hat", wir: "haben", ihr: "habt", sie: "haben" }, vowelChange: "b выпадает: du hast, er hat" },
    werden: { ru: "становиться", isIrregular: true, praesens: "wird", praeteritum: "wurde", partizip2: "geworden", hilfsverb: "sein", forms: { ich: "werde", du: "wirst", er: "wird", wir: "werden", ihr: "werdet", sie: "werden" }, vowelChange: "e ➔ i (du wirst, er wird)" },
    gehen: { ru: "идти, ходить", isIrregular: true, praesens: "geht", praeteritum: "ging", partizip2: "gegangen", hilfsverb: "sein", forms: { ich: "gehe", du: "gehst", er: "geht", wir: "gehen", ihr: "geht", sie: "gehen" } },
    kommen: { ru: "приходить, приезжать", isIrregular: true, praesens: "kommt", praeteritum: "kam", partizip2: "gekommen", hilfsverb: "sein", forms: { ich: "komme", du: "kommst", er: "kommt", wir: "kommen", ihr: "kommt", sie: "kommen" } },
    sehen: { ru: "видеть, смотреть", isIrregular: true, praesens: "sieht", praeteritum: "sah", partizip2: "gesehen", hilfsverb: "haben", forms: { ich: "sehe", du: "siehst", er: "sieht", wir: "sehen", ihr: "seht", sie: "sehen" }, vowelChange: "e ➔ ie (du siehst, er sieht)" },
    geben: { ru: "давать", isIrregular: true, praesens: "gibt", praeteritum: "gab", partizip2: "gegeben", hilfsverb: "haben", forms: { ich: "gebe", du: "gibst", er: "gibt", wir: "geben", ihr: "gebt", sie: "geben" }, vowelChange: "e ➔ i (du gibst, er gibt)" },
    nehmen: { ru: "брать, взять", isIrregular: true, praesens: "nimmt", praeteritum: "nahm", partizip2: "genommen", hilfsverb: "haben", forms: { ich: "nehme", du: "nimmst", er: "nimmt", wir: "nehmen", ihr: "nehmt", sie: "nehmen" }, vowelChange: "e ➔ i, mm (du nimmst, er nimmt)" },
    sprechen: { ru: "говорить, разговаривать", isIrregular: true, praesens: "spricht", praeteritum: "sprach", partizip2: "gesprochen", hilfsverb: "haben", forms: { ich: "spreche", du: "sprichst", er: "spricht", wir: "sprechen", ihr: "sprecht", sie: "sprechen" }, vowelChange: "e ➔ i (du sprichst, er spricht)" },
    fahren: { ru: "ехать, водить", isIrregular: true, praesens: "fährt", praeteritum: "fuhr", partizip2: "gefahren", hilfsverb: "sein", forms: { ich: "fahre", du: "fährst", er: "fährt", wir: "fahren", ihr: "fahrt", sie: "fahren" }, vowelChange: "a ➔ ä (du fährst, er fährt)" },
    lesen: { ru: "читать", isIrregular: true, praesens: "liest", praeteritum: "las", partizip2: "gelesen", hilfsverb: "haben", forms: { ich: "lese", du: "liest", er: "liest", wir: "lesen", ihr: "lest", sie: "lesen" }, vowelChange: "e ➔ ie (du liest, er liest)" },
    schreiben: { ru: "писать", isIrregular: true, praesens: "schreibt", praeteritum: "schrieb", partizip2: "geschrieben", hilfsverb: "haben", forms: { ich: "schreibe", du: "schreibst", er: "schreibt", wir: "schreiben", ihr: "schreibt", sie: "schreiben" } },
    finden: { ru: "находить, считать", isIrregular: true, praesens: "findet", praeteritum: "fand", partizip2: "gefunden", hilfsverb: "haben", forms: { ich: "finde", du: "findest", er: "findet", wir: "finden", ihr: "findet", sie: "finden" } },
    wissen: { ru: "знать (факты)", isIrregular: true, praesens: "weiß", praeteritum: "wusste", partizip2: "gewusst", hilfsverb: "haben", forms: { ich: "weiß", du: "weißt", er: "weiß", wir: "wissen", ihr: "wisst", sie: "wissen" }, vowelChange: "i ➔ ei (ich weiß, du weißt, er weiß)" },
    bringen: { ru: "приносить", isIrregular: true, praesens: "bringt", praeteritum: "brachte", partizip2: "gebracht", hilfsverb: "haben", forms: { ich: "bringe", du: "bringst", er: "bringt", wir: "bringen", ihr: "bringt", sie: "bringen" } },
    denken: { ru: "думать", isIrregular: true, praesens: "denkt", praeteritum: "dachte", partizip2: "gedacht", hilfsverb: "haben", forms: { ich: "denke", du: "denkst", er: "denkt", wir: "denken", ihr: "denkt", sie: "denken" } },
    bleiben: { ru: "оставаться", isIrregular: true, praesens: "bleibt", praeteritum: "blieb", partizip2: "geblieben", hilfsverb: "sein", forms: { ich: "bleibe", du: "bleibst", er: "bleibt", wir: "bleiben", ihr: "bleibt", sie: "bleiben" } },
    trinken: { ru: "пить", isIrregular: true, praesens: "trinkt", praeteritum: "trank", partizip2: "getrunken", hilfsverb: "haben", forms: { ich: "trinke", du: "trinkst", er: "trinkt", wir: "trinken", ihr: "trinkt", sie: "trinken" } },
    essen: { ru: "есть, кушать", isIrregular: true, praesens: "isst", praeteritum: "aß", partizip2: "gegessen", hilfsverb: "haben", forms: { ich: "esse", du: "isst", er: "isst", wir: "essen", ihr: "esst", sie: "essen" }, vowelChange: "e ➔ i, ss (du isst, er isst)" },
    schlafen: { ru: "спать", isIrregular: true, praesens: "schläft", praeteritum: "schlief", partizip2: "geschlafen", hilfsverb: "haben", forms: { ich: "schlafe", du: "schläfst", er: "schläft", wir: "schlafen", ihr: "schlaft", sie: "schlafen" }, vowelChange: "a ➔ ä (du schläfst, er schläft)" },
    laufen: { ru: "бегать, идти пешком", isIrregular: true, praesens: "läuft", praeteritum: "lief", partizip2: "gelaufen", hilfsverb: "sein", forms: { ich: "laufe", du: "läufst", er: "läuft", wir: "laufen", ihr: "lauft", sie: "laufen" }, vowelChange: "au ➔ äu (du läufst, er läuft)" },
    helfen: { ru: "помогать", isIrregular: true, praesens: "hilft", praeteritum: "half", partizip2: "geholfen", hilfsverb: "haben", forms: { ich: "helfe", du: "hilfst", er: "hilft", wir: "helfen", ihr: "helft", sie: "helfen" }, vowelChange: "e ➔ i (du hilfst, er hilft)" },
    treffen: { ru: "встречать, видеться", isIrregular: true, praesens: "trifft", praeteritum: "traf", partizip2: "getroffen", hilfsverb: "haben", forms: { ich: "treffe", du: "triffst", er: "trifft", wir: "treffen", ihr: "trefft", sie: "treffen" }, vowelChange: "e ➔ i (du triffst, er trifft)" },
    beginnen: { ru: "начинать", isIrregular: true, praesens: "beginnt", praeteritum: "begann", partizip2: "begonnen", hilfsverb: "haben", forms: { ich: "beginne", du: "beginnst", er: "beginnt", wir: "beginnen", ihr: "beginnt", sie: "beginnen" } },
    verstehen: { ru: "понимать", isIrregular: true, praesens: "versteht", praeteritum: "verstand", partizip2: "verstanden", hilfsverb: "haben", forms: { ich: "verstehe", du: "verstehst", er: "versteht", wir: "verstehen", ihr: "versteht", sie: "verstehen" } },
    tragen: { ru: "носить, нести", isIrregular: true, praesens: "trägt", praeteritum: "trug", partizip2: "getragen", hilfsverb: "haben", forms: { ich: "trage", du: "trägst", er: "trägt", wir: "tragen", ihr: "tragt", sie: "tragen" }, vowelChange: "a ➔ ä (du trägst, er trägt)" },
    stehen: { ru: "стоять", isIrregular: true, praesens: "steht", praeteritum: "stand", partizip2: "gestanden", hilfsverb: "haben", forms: { ich: "stehe", du: "stehst", er: "steht", wir: "stehen", ihr: "steht", sie: "stehen" } },
    liegen: { ru: "лежать", isIrregular: true, praesens: "liegt", praeteritum: "lag", partizip2: "gelegen", hilfsverb: "haben", forms: { ich: "liege", du: "liegst", er: "liegt", wir: "liegen", ihr: "liegt", sie: "liegen" } },
    sitzen: { ru: "сидеть", isIrregular: true, praesens: "sitzt", praeteritum: "saß", partizip2: "gesessen", hilfsverb: "haben", forms: { ich: "sitze", du: "sitzt", er: "sitzt", wir: "sitzen", ihr: "sitzt", sie: "sitzen" }, vowelChange: "основа на -z (du sitzt, er sitzt)" },
    fliegen: { ru: "летать, лететь", isIrregular: true, praesens: "fliegt", praeteritum: "flog", partizip2: "geflogen", hilfsverb: "sein", forms: { ich: "fliege", du: "fliegst", er: "fliegt", wir: "fliegen", ihr: "fliegt", sie: "fliegen" } },
    schwimmen: { ru: "плавать", isIrregular: true, praesens: "schwimmt", praeteritum: "schwamm", partizip2: "geschwommen", hilfsverb: "sein", forms: { ich: "schwimme", du: "schwimmst", er: "schwimmt", wir: "schwimmen", ihr: "schwimmt", sie: "schwimmen" } },
    verlieren: { ru: "терять, проигрывать", isIrregular: true, praesens: "verliert", praeteritum: "verlor", partizip2: "verloren", hilfsverb: "haben", forms: { ich: "verliere", du: "verlierst", er: "verliert", wir: "verlieren", ihr: "verliert", sie: "verlieren" } },
    gewinnen: { ru: "выигрывать, побеждать", isIrregular: true, praesens: "gewinnt", praeteritum: "gewann", partizip2: "gewonnen", hilfsverb: "haben", forms: { ich: "gewinne", du: "gewinnst", er: "gewinnt", wir: "gewinnen", ihr: "gewinnt", sie: "gewinnen" } },
    schließen: { ru: "закрывать, завершать", isIrregular: true, praesens: "schließt", praeteritum: "schloss", partizip2: "geschlossen", hilfsverb: "haben", forms: { ich: "schließe", du: "schließt", er: "schließt", wir: "schließen", ihr: "schließt", sie: "schließen" } },
    ziehen: { ru: "тянуть, переезжать", isIrregular: true, praesens: "zieht", praeteritum: "zog", partizip2: "gezogen", hilfsverb: "haben", forms: { ich: "ziehe", du: "ziehst", er: "zieht", wir: "ziehen", ihr: "zieht", sie: "ziehen" } },
    rufen: { ru: "звать, кричать", isIrregular: true, praesens: "ruft", praeteritum: "rief", partizip2: "gerufen", hilfsverb: "haben", forms: { ich: "rufe", du: "rufst", er: "ruft", wir: "rufen", ihr: "ruft", sie: "rufen" } },
    kennen: { ru: "знать (человека, город)", isIrregular: true, praesens: "kennt", praeteritum: "kannte", partizip2: "gekannt", hilfsverb: "haben", forms: { ich: "kenne", du: "kennst", er: "kennt", wir: "kennen", ihr: "kennt", sie: "kennen" } },
    waschen: { ru: "мыть, стирать", isIrregular: true, praesens: "wäscht", praeteritum: "wusch", partizip2: "gewaschen", hilfsverb: "haben", forms: { ich: "wasche", du: "wäschst", er: "wäscht", wir: "waschen", ihr: "wascht", sie: "waschen" }, vowelChange: "a ➔ ä (du wäschst, er wäscht)" },
    vergessen: { ru: "забывать", isIrregular: true, praesens: "vergisst", praeteritum: "vergaß", partizip2: "vergessen", hilfsverb: "haben", forms: { ich: "vergesse", du: "vergisst", er: "vergisst", wir: "vergessen", ihr: "vergesst", sie: "vergessen" }, vowelChange: "e ➔ i (du vergisst, er vergisst)" },
    einladen: { ru: "приглашать", isIrregular: true, praesens: "lädt ein", praeteritum: "lud ein", partizip2: "eingeladen", hilfsverb: "haben", forms: { ich: "lade ein", du: "lädst ein", er: "lädt ein", wir: "laden ein", ihr: "ladet ein", sie: "laden ein" }, vowelChange: "a ➔ ä (du lädst ein, er lädt ein)" },
    anfangen: { ru: "начинать", isIrregular: true, praesens: "fängt an", praeteritum: "fing an", partizip2: "angefangen", hilfsverb: "haben", forms: { ich: "fange an", du: "fängst an", er: "fängt an", wir: "fangen an", ihr: "fangt an", sie: "fangen an" }, vowelChange: "a ➔ ä (du fängst an, er fängt an)" },
    aufstehen: { ru: "вставать, подниматься", isIrregular: true, praesens: "steht auf", praeteritum: "stand auf", partizip2: "aufgestanden", hilfsverb: "sein", forms: { ich: "stehe auf", du: "stehst auf", er: "steht auf", wir: "stehen auf", ihr: "steht auf", sie: "stehen auf" } },
    fernsehen: { ru: "смотреть телевизор", isIrregular: true, praesens: "sieht fern", praeteritum: "sah fern", partizip2: "ferngesehen", hilfsverb: "haben", forms: { ich: "sehe fern", du: "siehst fern", er: "sieht fern", wir: "sehen fern", ihr: "seht fern", sie: "sehen fern" }, vowelChange: "e ➔ ie (du siehst fern, er sieht fern)" },
    mitkommen: { ru: "идти вместе, составить компанию", isIrregular: true, praesens: "kommt mit", praeteritum: "kam mit", partizip2: "mitgekommen", hilfsverb: "sein", forms: { ich: "komme mit", du: "kommst mit", er: "kommt mit", wir: "kommen mit", ihr: "kommt mit", sie: "kommen mit" } },
    sterben: { ru: "умирать", isIrregular: true, praesens: "stirbt", praeteritum: "starb", partizip2: "gestorben", hilfsverb: "sein", forms: { ich: "sterbe", du: "stirbst", er: "stirbt", wir: "sterben", ihr: "sterbt", sie: "sterben" }, vowelChange: "e ➔ i (du stirbst, er stirbt)" },
    bieten: { ru: "предлагать", isIrregular: true, praesens: "bietet", praeteritum: "bot", partizip2: "geboten", hilfsverb: "haben", forms: { ich: "biete", du: "bietest", er: "bietet", wir: "bieten", ihr: "bietet", sie: "bieten" } },
    bitten: { ru: "просить", isIrregular: true, praesens: "bittet", praeteritum: "bat", partizip2: "gebeten", hilfsverb: "haben", forms: { ich: "bitte", du: "bittest", er: "bittet", wir: "bitten", ihr: "bittet", sie: "bitten" } },
    fallen: { ru: "падать", isIrregular: true, praesens: "fällt", praeteritum: "fiel", partizip2: "gefallen", hilfsverb: "sein", forms: { ich: "falle", du: "fällst", er: "fällt", wir: "fallen", ihr: "fallt", sie: "fallen" }, vowelChange: "a ➔ ä (du fällst, er fällt)" },
    halten: { ru: "держать, останавливаться", isIrregular: true, praesens: "hält", praeteritum: "hielt", partizip2: "gehalten", hilfsverb: "haben", forms: { ich: "halte", du: "hältst", er: "hält", wir: "halten", ihr: "haltet", sie: "halten" }, vowelChange: "a ➔ ä (du hältst, er hält)" },
    lassen: { ru: "оставлять, позволять", isIrregular: true, praesens: "lässt", praeteritum: "ließ", partizip2: "gelassen", hilfsverb: "haben", forms: { ich: "lasse", du: "lässt", er: "lässt", wir: "lassen", ihr: "lasst", sie: "lassen" }, vowelChange: "a ➔ ä (du lässt, er lässt)" },
    nennen: { ru: "называть", isIrregular: true, praesens: "nennt", praeteritum: "nannte", partizip2: "genannt", hilfsverb: "haben", forms: { ich: "nenne", du: "nennst", er: "nennt", wir: "nennen", ihr: "nennt", sie: "nennen" } },
    rennen: { ru: "бежать, мчаться", isIrregular: true, praesens: "rennt", praeteritum: "rannte", partizip2: "gerannt", hilfsverb: "sein", forms: { ich: "renne", du: "rennst", er: "rennt", wir: "rennen", ihr: "rennt", sie: "rennen" } },
    scheinen: { ru: "светить, казаться", isIrregular: true, praesens: "scheint", praeteritum: "schien", partizip2: "geschienen", hilfsverb: "haben", forms: { ich: "scheine", du: "scheinst", er: "scheint", wir: "scheinen", ihr: "scheint", sie: "scheinen" } },
    schlagen: { ru: "бить, ударять", isIrregular: true, praesens: "schlägt", praeteritum: "schlug", partizip2: "geschlagen", hilfsverb: "haben", forms: { ich: "schlage", du: "schlägst", er: "schlägt", wir: "schlagen", ihr: "schlagt", sie: "schlagen" }, vowelChange: "a ➔ ä (du schlägst, er schlägt)" },
    schneiden: { ru: "резать", isIrregular: true, praesens: "schneidet", praeteritum: "schnitt", partizip2: "geschnitten", hilfsverb: "haben", forms: { ich: "schneide", du: "schneidest", er: "schneidet", wir: "schneiden", ihr: "schneidet", sie: "schneiden" } },
    sinken: { ru: "опускаться, тонуть", isIrregular: true, praesens: "sinkt", praeteritum: "sank", partizip2: "gesunken", hilfsverb: "sein", forms: { ich: "sinke", du: "sinkst", er: "sinkt", wir: "sinken", ihr: "sinkt", sie: "sinken" } },
    steigen: { ru: "подниматься", isIrregular: true, praesens: "steigt", praeteritum: "stieg", partizip2: "gestiegen", hilfsverb: "sein", forms: { ich: "steige", du: "steigst", er: "steigt", wir: "steigen", ihr: "steigt", sie: "steigen" } },
    tun: { ru: "делать", isIrregular: true, praesens: "tut", praeteritum: "tat", partizip2: "getan", hilfsverb: "haben", forms: { ich: "tue", du: "tust", er: "tut", wir: "tun", ihr: "tut", sie: "tun" } },
    verbringen: { ru: "проводить (время)", isIrregular: true, praesens: "verbringt", praeteritum: "verbrachte", partizip2: "verbracht", hilfsverb: "haben", forms: { ich: "verbringe", du: "verbringst", er: "verbringt", wir: "verbringen", ihr: "verbringt", sie: "verbringen" } },
    verlassen: { ru: "покидать, оставлять", isIrregular: true, praesens: "verlässt", praeteritum: "verließ", partizip2: "verlassen", hilfsverb: "haben", forms: { ich: "verlasse", du: "verlässt", er: "verlässt", wir: "verlassen", ihr: "verlasst", sie: "verlassen" }, vowelChange: "a ➔ ä (du verlässt, er verlässt)" },
    wachsen: { ru: "расти", isIrregular: true, praesens: "wächst", praeteritum: "wuchs", partizip2: "gewachsen", hilfsverb: "sein", forms: { ich: "wachse", du: "wächst", er: "wächst", wir: "wachsen", ihr: "wachst", sie: "wachsen" }, vowelChange: "a ➔ ä (du wächst, er wächst)" },
    werfen: { ru: "бросать, кидать", isIrregular: true, praesens: "wirft", praeteritum: "warf", partizip2: "geworfen", hilfsverb: "haben", forms: { ich: "werfe", du: "wirfst", er: "wirft", wir: "werfen", ihr: "werft", sie: "werfen" }, vowelChange: "e ➔ i (du wirfst, er wirft)" },
    // Common regular verbs
    machen: { ru: "делать", isIrregular: false, praesens: "macht", praeteritum: "machte", partizip2: "gemacht", hilfsverb: "haben" },
    lernen: { ru: "учить, изучать", isIrregular: false, praesens: "lernt", praeteritum: "lernte", partizip2: "gelernt", hilfsverb: "haben" },
    arbeiten: { ru: "работать", isIrregular: false, praesens: "arbeitet", praeteritum: "arbeitete", partizip2: "gearbeitet", hilfsverb: "haben" },
    wohnen: { ru: "жить, проживать", isIrregular: false, praesens: "wohnt", praeteritum: "wohnte", partizip2: "gewohnt", hilfsverb: "haben" },
    kaufen: { ru: "покупать", isIrregular: false, praesens: "kauft", praeteritum: "kaufte", partizip2: "gekauft", hilfsverb: "haben" },
    kochen: { ru: "готовить (еду), варить", isIrregular: false, praesens: "kocht", praeteritum: "kochte", partizip2: "gekocht", hilfsverb: "haben" },
    spielen: { ru: "играть", isIrregular: false, praesens: "spielt", praeteritum: "spielte", partizip2: "gespielt", hilfsverb: "haben" },
    fragen: { ru: "спрашивать", isIrregular: false, praesens: "fragt", praeteritum: "fragte", partizip2: "gefragt", hilfsverb: "haben" },
    antworten: { ru: "отвечать", isIrregular: false, praesens: "antwortet", praeteritum: "antwortete", partizip2: "geantwortet", hilfsverb: "haben" },
    hören: { ru: "слушать, слышать", isIrregular: false, praesens: "hört", praeteritum: "hörte", partizip2: "gehört", hilfsverb: "haben" },
    brauchen: { ru: "нуждаться, требоваться", isIrregular: false, praesens: "braucht", praeteritum: "brauchte", partizip2: "gebraucht", hilfsverb: "haben" },
    leben: { ru: "жить, существовать", isIrregular: false, praesens: "lebt", praeteritum: "lebte", partizip2: "gelebt", hilfsverb: "haben" },
    lieben: { ru: "любить", isIrregular: false, praesens: "liebt", praeteritum: "liebte", partizip2: "geliebt", hilfsverb: "haben" },
    suchen: { ru: "искать", isIrregular: false, praesens: "sucht", praeteritum: "suchte", partizip2: "gesucht", hilfsverb: "haben" },
    reisen: { ru: "путешествовать", isIrregular: false, praesens: "reist", praeteritum: "reiste", partizip2: "gereist", hilfsverb: "sein" },
    tanzen: { ru: "танцевать", isIrregular: false, praesens: "tanzt", praeteritum: "tanzte", partizip2: "getanzt", hilfsverb: "haben" }
  };

  function conjugateRegularVerb(inf) {
    if (!inf) return null;
    const lower = inf.trim().toLowerCase();
    let stem = lower;
    if (lower.endsWith("en")) stem = lower.slice(0, -2);
    else if (lower.endsWith("n")) stem = lower.slice(0, -1);

    const needsE = /[td]$/.test(stem) || /[^aeiou][mn]$/.test(stem);
    const sEnding = /[sßzx]$|tz$/.test(stem);

    const forms = {
      ich: stem + "e",
      du: stem + (sEnding ? "t" : (needsE ? "est" : "st")),
      er: stem + (needsE ? "et" : "t"),
      wir: lower,
      ihr: stem + (needsE ? "et" : "t"),
      sie: lower
    };

    const praeteritum = stem + (needsE ? "ete" : "te");
    
    // Partizip II rules:
    let partizip2;
    if (lower.endsWith("ieren")) {
      partizip2 = stem + "t";
    } else if (/^(be|ver|zer|er|ent|emp|miss|ge)/.test(lower)) {
      partizip2 = stem + (needsE ? "et" : "t");
    } else {
      partizip2 = "ge" + stem + (needsE ? "et" : "t");
    }

    // Auxiliary verb guess:
    const isMotion = ["reisen", "wandern", "folgen", "klettern", "segeln", "joggen"].includes(lower);
    const hilfsverb = isMotion ? "sein" : "haben";

    return {
      forms,
      praesens: forms.er,
      praeteritum,
      partizip2,
      hilfsverb,
      isIrregular: false
    };
  }

  function getVerbForms(infinitive, userPraesens, userPraeteritum, userPartizip2, userHilfsverb) {
    const key = (infinitive || "").trim().toLowerCase();
    const known = KNOWN_VERBS_DICT[key];
    const regular = conjugateRegularVerb(infinitive);

    let forms;
    if (known && known.forms) {
      forms = { ...known.forms };
    } else if (regular) {
      forms = { ...regular.forms };
    } else {
      forms = { ich: "-", du: "-", er: "-", wir: "-", ihr: "-", sie: "-" };
    }

    if (userPraesens && userPraesens.trim()) {
      let p = userPraesens.trim();
      p = p.replace(/^(er|sie|es)\s+/i, "");
      forms.er = p;
      // If user typed 3rd person like "spricht" or "fährt", adjust 2nd person (du) too
      if (known && known.forms) {
        forms.du = known.forms.du;
      }
    }

    const praeteritum = (userPraeteritum && userPraeteritum.trim()) || (known?.praeteritum) || (regular?.praeteritum) || "";
    const partizip2 = (userPartizip2 && userPartizip2.trim()) || (known?.partizip2) || (regular?.partizip2) || "";
    const hilfsverb = userHilfsverb || (known?.hilfsverb) || (regular?.hilfsverb) || "haben";
    const vowelChange = known?.vowelChange || "";

    return { forms, praeteritum, partizip2, hilfsverb, vowelChange };
  }

  function isVerbWord(w) {
    if (!w) return false;
    const catName = (w.category?.name || "").toLowerCase();
    const catId = w.categoryId || "";

    if (catId === "cat_irregular_verbs" || catId === "cat_regular_verbs") return true;
    if (catName.includes("глагол") || catName.includes("verb")) return true;
    if (w.praeteritum || w.partizip2 || w.praesens || w.hilfsverb) return true;

    return false;
  }

  function classifyVerbType(w) {
    const catName = (w.category?.name || "").toLowerCase();
    const catId = w.categoryId || "";
    const de = (w.de || "").trim().toLowerCase();

    if (catId === "cat_irregular_verbs" || catName.includes("неправильн")) return "irregular";
    if (catId === "cat_regular_verbs" || catName.includes("обычн")) return "regular";

    const known = KNOWN_VERBS_DICT[de];
    if (known) return known.isIrregular ? "irregular" : "regular";

    if (w.praeteritum) {
      const reg = conjugateRegularVerb(w.de);
      if (reg && w.praeteritum !== reg.praeteritum) return "irregular";
    }

    return "regular";
  }

  function refreshVerbsData() {
    allVerbs = (allWordsCache || []).filter(isVerbWord).map((w) => {
      const vtype = classifyVerbType(w);
      const computed = getVerbForms(w.de, w.praesens, w.praeteritum, w.partizip2, w.hilfsverb);
      return {
        ...w,
        vtype,
        computedPraesens: w.praesens || computed.forms.er,
        computedPraeteritum: w.praeteritum || computed.praeteritum,
        computedPartizip2: w.partizip2 || computed.partizip2,
        computedHilfsverb: w.hilfsverb || computed.hilfsverb,
        forms: computed.forms,
        vowelChange: computed.vowelChange
      };
    });

    // Sort alphabetically by German infinitive
    allVerbs.sort((a, b) => (a.de || "").localeCompare(b.de || "", "de"));

    const irregularCount = allVerbs.filter((v) => v.vtype === "irregular").length;
    const regularCount = allVerbs.length - irregularCount;

    if (verbsCountTotal) verbsCountTotal.textContent = allVerbs.length;
    if (verbsCountIrregular) verbsCountIrregular.textContent = irregularCount;
    if (verbsCountRegular) verbsCountRegular.textContent = regularCount;

    if (vfilterCountAll) vfilterCountAll.textContent = allVerbs.length;
    if (vfilterCountIrreg) vfilterCountIrreg.textContent = irregularCount;
    if (vfilterCountReg) vfilterCountReg.textContent = regularCount;

    renderVerbsTable();
  }

  function renderVerbsTable() {
    if (!verbsTbody) return;
    verbsTbody.innerHTML = "";

    const search = currentVerbSearch.trim().toLowerCase();
    const filtered = allVerbs.filter((v) => {
      if (currentVerbFilter === "irregular" && v.vtype !== "irregular") return false;
      if (currentVerbFilter === "regular" && v.vtype !== "regular") return false;

      if (!search) return true;
      const matchDe = (v.de || "").toLowerCase().includes(search);
      const matchRu = (v.ru || "").toLowerCase().includes(search);
      const matchPrat = (v.computedPraeteritum || "").toLowerCase().includes(search);
      const matchP2 = (v.computedPartizip2 || "").toLowerCase().includes(search);
      const matchPraes = (v.computedPraesens || "").toLowerCase().includes(search);
      return matchDe || matchRu || matchPrat || matchP2 || matchPraes;
    });

    if (filtered.length === 0) {
      if (verbsEmptyNote) {
        verbsEmptyNote.textContent = search ? "По вашему запросу глаголов не найдено" : "В этом списке пока нет глаголов";
        verbsEmptyNote.style.display = "block";
      }
      if (selectAllVerbsCb) selectAllVerbsCb.checked = false;
      return;
    }

    if (verbsEmptyNote) verbsEmptyNote.style.display = "none";

    filtered.forEach((v) => {
      const tr = document.createElement("tr");
      const isSelected = selectedVerbIds.has(v.id);
      const isIrreg = v.vtype === "irregular";
      const badge = isIrreg
        ? '<span class="badge-irreg">⚡ Неправильный</span>'
        : '<span class="badge-reg">📘 Обычный</span>';
      
      const auxTag = v.computedHilfsverb === "sein"
        ? '<span class="vform-tag" style="color: #2563eb; font-weight: 600;">ist</span>'
        : '<span class="vform-tag" style="color: #d97706; font-weight: 600;">hat</span>';

      const catName = v.category?.name || "Без категории";

      tr.innerHTML = `
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="verb-row-cb" data-id="${v.id}" ${isSelected ? "checked" : ""}>
        </td>
        <td style="font-weight: 700; vertical-align: middle;">
          <span style="font-size: 14px;">${escapeHtml(v.de)}</span>
        </td>
        <td style="color: var(--text-primary); vertical-align: middle;">
          ${escapeHtml(v.ru || "")}
        </td>
        <td style="vertical-align: middle;">
          ${badge}
        </td>
        <td style="vertical-align: middle; color: var(--text-secondary); font-family: monospace, inherit;">
          ${escapeHtml(v.computedPraesens || "-")}
        </td>
        <td style="vertical-align: middle; color: var(--text-secondary); font-family: monospace, inherit;">
          ${escapeHtml(v.computedPraeteritum || "-")}
        </td>
        <td style="vertical-align: middle; font-family: monospace, inherit;">
          ${auxTag} ${escapeHtml(v.computedPartizip2 || "-")}
        </td>
        <td style="vertical-align: middle; font-size: 12px; color: var(--text-muted);">
          ${escapeHtml(catName)}
        </td>
        <td style="text-align: right; vertical-align: middle; white-space: nowrap;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="small-btn edit-verb-btn" title="Редактировать глагол" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">
              ✏️
            </button>
            <button type="button" class="small-btn danger-btn delete-verb-btn" title="Удалить глагол" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">
              🗑️
            </button>
          </div>
        </td>
      `;

      // Checkbox listener
      const cb = tr.querySelector(".verb-row-cb");
      cb.addEventListener("change", (e) => {
        if (e.target.checked) selectedVerbIds.add(v.id);
        else selectedVerbIds.delete(v.id);
        updateVerbsBatchActionsBar();
      });

      // Edit listener
      tr.querySelector(".edit-verb-btn").addEventListener("click", () => {
        openEditVerbModal(v);
      });

      // Delete listener
      tr.querySelector(".delete-verb-btn").addEventListener("click", async () => {
        const confirmed = await showConfirmDialog(
          "Удаление глагола",
          `Вы действительно хотите удалить глагол «${v.de}» (${v.ru})?`
        );
        if (!confirmed) return;

        try {
          await ApiClient.delete(`/api/words/${v.id}`);
          showToast(`Глагол «${v.de}» удалён`, "success");
          selectedVerbIds.delete(v.id);
          await loadInitialData();
        } catch (err) {
          showToast("Ошибка при удалении: " + err.message, "error");
        }
      });

      verbsTbody.appendChild(tr);
    });

    if (selectAllVerbsCb) {
      selectAllVerbsCb.checked = filtered.length > 0 && filtered.every((v) => selectedVerbIds.has(v.id));
    }
  }

  function updateVerbsBatchActionsBar() {
    if (!verbsBatchActionsBar || !verbsSelectedCount) return;
    const count = selectedVerbIds.size;
    if (count > 0) {
      verbsBatchActionsBar.style.display = "flex";
      verbsSelectedCount.textContent = count;
    } else {
      verbsBatchActionsBar.style.display = "none";
    }
  }

  // Filter pills
  verbFilterTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      verbFilterTabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentVerbFilter = btn.dataset.verbFilter || "all";
      renderVerbsTable();
    });
  });

  // Search input for verbs
  if (verbFilterInput) {
    verbFilterInput.addEventListener("input", () => {
      currentVerbSearch = verbFilterInput.value;
      if (clearVerbSearchBtn) {
        clearVerbSearchBtn.style.display = currentVerbSearch ? "block" : "none";
      }
      renderVerbsTable();
    });
  }

  if (clearVerbSearchBtn) {
    clearVerbSearchBtn.addEventListener("click", () => {
      if (verbFilterInput) verbFilterInput.value = "";
      currentVerbSearch = "";
      clearVerbSearchBtn.style.display = "none";
      renderVerbsTable();
      if (verbFilterInput) verbFilterInput.focus();
    });
  }

  // Select all checkbox for verbs
  if (selectAllVerbsCb) {
    selectAllVerbsCb.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const cbs = verbsTbody.querySelectorAll(".verb-row-cb");
      cbs.forEach((cb) => {
        cb.checked = isChecked;
        const id = cb.dataset.id;
        if (isChecked) selectedVerbIds.add(id);
        else selectedVerbIds.delete(id);
      });
      updateVerbsBatchActionsBar();
    });
  }

  // Cancel batch selection
  if (verbsBatchCancelBtn) {
    verbsBatchCancelBtn.addEventListener("click", () => {
      selectedVerbIds.clear();
      verbsTbody.querySelectorAll(".verb-row-cb").forEach((cb) => (cb.checked = false));
      if (selectAllVerbsCb) selectAllVerbsCb.checked = false;
      updateVerbsBatchActionsBar();
    });
  }

  // Batch delete verbs
  if (verbsBatchDeleteBtn) {
    verbsBatchDeleteBtn.addEventListener("click", async () => {
      const count = selectedVerbIds.size;
      if (count === 0) return;

      const confirmed = await showConfirmDialog(
        "Удаление выбранных глаголов",
        `Вы действительно хотите удалить ${count} выбранных глаголов? Это действие необратимо!`
      );
      if (!confirmed) return;

      try {
        const ids = Array.from(selectedVerbIds);
        await Promise.all(ids.map((id) => ApiClient.delete(`/api/words/${id}`)));
        showToast(`Удалено ${count} глаголов`, "success");
        selectedVerbIds.clear();
        updateVerbsBatchActionsBar();
        await loadInitialData();
      } catch (err) {
        showToast("Ошибка массового удаления: " + err.message, "error");
      }
    });
  }

  // Open Add Verb Modal
  if (openAddVerbBtn) {
    openAddVerbBtn.addEventListener("click", () => {
      openAddVerbModal();
    });
  }

  function getVerbCategoryForType(type) {
    const isIrreg = type === "irregular";
    let target = categories.find((c) => isIrreg ? c.name.toLowerCase().includes("неправильн") : c.name.toLowerCase().includes("обычн"));
    if (!target) {
      target = categories.find((c) => c.name.toLowerCase().includes("глагол"));
    }
    return target ? target.id : (categories[0]?.id || "");
  }

  function openAddVerbModal() {
    editingVerb = null;
    populateCategoryDropdowns();
    if (verbModalDupBanner) verbModalDupBanner.style.display = "none";
    if (verbModalTitle) verbModalTitle.textContent = "Добавление глагола";

    if (verbModalDe) verbModalDe.value = "";
    if (verbModalRu) verbModalRu.value = "";
    if (verbModalType) verbModalType.value = currentVerbFilter === "regular" ? "regular" : "irregular";
    if (verbModalCategory) verbModalCategory.value = getVerbCategoryForType(verbModalType.value);
    if (verbModalPraesens) verbModalPraesens.value = "";
    if (verbModalPraeteritum) verbModalPraeteritum.value = "";
    if (verbModalHilfsverb) verbModalHilfsverb.value = "haben";
    if (verbModalPartizip2) verbModalPartizip2.value = "";

    if (vpreviewIch) vpreviewIch.value = "";
    if (vpreviewDu) vpreviewDu.value = "";
    if (vpreviewEr) vpreviewEr.value = "";
    if (vpreviewWir) vpreviewWir.value = "";
    if (vpreviewIhr) vpreviewIhr.value = "";
    if (vpreviewSie) vpreviewSie.value = "";

    updateVerbConjugationPreview(true);

    if (verbModal) {
      verbModal.classList.remove("hidden");
      document.body.classList.add("modal-open");
      setTimeout(() => verbModalDe && verbModalDe.focus(), 50);
    }
  }

  function openEditVerbModal(v) {
    editingVerb = v;
    populateCategoryDropdowns();
    if (verbModalDupBanner) verbModalDupBanner.style.display = "none";
    if (verbModalTitle) verbModalTitle.textContent = `Редактирование глагола: ${v.de}`;

    if (verbModalDe) verbModalDe.value = v.de || "";
    if (verbModalRu) verbModalRu.value = v.ru || "";
    if (verbModalType) verbModalType.value = v.vtype || "irregular";
    if (verbModalCategory) verbModalCategory.value = v.categoryId || getVerbCategoryForType(verbModalType.value);
    if (verbModalPraesens) verbModalPraesens.value = v.praesens || v.computedPraesens || "";
    if (verbModalPraeteritum) verbModalPraeteritum.value = v.praeteritum || v.computedPraeteritum || "";
    if (verbModalHilfsverb) verbModalHilfsverb.value = (v.hilfsverb === "sein" || v.computedHilfsverb === "sein") ? "sein" : "haben";
    if (verbModalPartizip2) verbModalPartizip2.value = v.partizip2 || v.computedPartizip2 || "";

    if (vpreviewIch) vpreviewIch.value = v.praesensIch || "";
    if (vpreviewDu) vpreviewDu.value = v.praesensDu || "";
    if (vpreviewEr) vpreviewEr.value = v.praesensEr || v.praesens || "";
    if (vpreviewWir) vpreviewWir.value = v.praesensWir || "";
    if (vpreviewIhr) vpreviewIhr.value = v.praesensIhr || "";
    if (vpreviewSie) vpreviewSie.value = v.praesensSie || "";

    updateVerbConjugationPreview(false);

    if (verbModal) {
      verbModal.classList.remove("hidden");
      document.body.classList.add("modal-open");
      setTimeout(() => verbModalRu && verbModalRu.focus(), 50);
    }
  }

  function updateVerbConjugationPreview(overwriteAll = false) {
    const inf = verbModalDe ? verbModalDe.value.trim() : "";
    const p3 = verbModalPraesens ? verbModalPraesens.value.trim() : "";
    const prat = verbModalPraeteritum ? verbModalPraeteritum.value.trim() : "";
    const p2 = verbModalPartizip2 ? verbModalPartizip2.value.trim() : "";
    const aux = verbModalHilfsverb ? verbModalHilfsverb.value : "haben";

    const computed = getVerbForms(inf, p3, prat, p2, aux);
    const f = computed.forms;

    if (vpreviewIch) {
      if (overwriteAll || !vpreviewIch.value.trim()) vpreviewIch.value = f.ich || "";
    }
    if (vpreviewDu) {
      if (overwriteAll || !vpreviewDu.value.trim()) vpreviewDu.value = f.du || "";
    }
    if (vpreviewEr) {
      if (overwriteAll || !vpreviewEr.value.trim()) vpreviewEr.value = f.er || "";
    }
    if (vpreviewWir) {
      if (overwriteAll || !vpreviewWir.value.trim()) vpreviewWir.value = f.wir || "";
    }
    if (vpreviewIhr) {
      if (overwriteAll || !vpreviewIhr.value.trim()) vpreviewIhr.value = f.ihr || "";
    }
    if (vpreviewSie) {
      if (overwriteAll || !vpreviewSie.value.trim()) vpreviewSie.value = f.sie || "";
    }

    if (verbModalVowelNote) {
      verbModalVowelNote.textContent = computed.vowelChange ? `(${computed.vowelChange})` : "";
    }

    checkVerbDuplicate();
  }

  function autofillVerbFields(infinitive) {
    if (!infinitive) return;
    const clean = infinitive.trim().toLowerCase();
    const known = KNOWN_VERBS_DICT[clean];
    const reg = conjugateRegularVerb(clean);

    if (known) {
      if (verbModalType) verbModalType.value = known.isIrregular ? "irregular" : "regular";
      if (verbModalCategory) verbModalCategory.value = getVerbCategoryForType(verbModalType.value);
      if (verbModalPraesens) verbModalPraesens.value = known.praesens || "";
      if (verbModalPraeteritum) verbModalPraeteritum.value = known.praeteritum || "";
      if (verbModalHilfsverb) verbModalHilfsverb.value = known.hilfsverb || "haben";
      if (verbModalPartizip2) verbModalPartizip2.value = known.partizip2 || "";
      if (verbModalRu && !verbModalRu.value.trim() && known.ru) {
        verbModalRu.value = known.ru;
      }
      showToast(`Формы для «${clean}» автозаполнены!`, "info");
    } else if (reg) {
      if (verbModalType) verbModalType.value = "regular";
      if (verbModalCategory) verbModalCategory.value = getVerbCategoryForType("regular");
      if (verbModalPraesens) verbModalPraesens.value = reg.praesens || "";
      if (verbModalPraeteritum) verbModalPraeteritum.value = reg.praeteritum || "";
      if (verbModalHilfsverb) verbModalHilfsverb.value = reg.hilfsverb || "haben";
      if (verbModalPartizip2) verbModalPartizip2.value = reg.partizip2 || "";
      showToast(`Стандартные формы для «${clean}» сгенерированы!`, "info");
    }

    updateVerbConjugationPreview();
  }

  if (verbModalAutofillBtn) {
    verbModalAutofillBtn.addEventListener("click", () => {
      const inf = verbModalDe ? verbModalDe.value.trim() : "";
      if (!inf) {
        showToast("Сначала введите инфинитив глагола", "info");
        if (verbModalDe) verbModalDe.focus();
        return;
      }
      autofillVerbFields(inf);
    });
  }

  if (verbModalType) {
    verbModalType.addEventListener("change", () => {
      if (verbModalCategory) {
        verbModalCategory.value = getVerbCategoryForType(verbModalType.value);
      }
    });
  }

  [verbModalDe, verbModalPraesens, verbModalPraeteritum, verbModalPartizip2, verbModalHilfsverb].filter(Boolean).forEach((el) => {
    el.addEventListener("input", updateVerbConjugationPreview);
  });

  function checkVerbDuplicate() {
    if (!verbModalDupBanner || !verbModalDe) return;
    const val = verbModalDe.value.trim().toLowerCase();
    if (!val) {
      verbModalDupBanner.style.display = "none";
      return;
    }

    const dup = allWordsCache.find((w) => {
      if (editingVerb && w.id === editingVerb.id) return false;
      return (w.de || "").toLowerCase().trim() === val;
    });

    if (dup) {
      const catName = dup.category?.name || "другой категории";
      verbModalDupBanner.textContent = `⚠️ Глагол «${dup.de}» уже есть в категории «${catName}» (перевод: ${dup.ru}).`;
      verbModalDupBanner.style.display = "block";
    } else {
      verbModalDupBanner.style.display = "none";
    }
  }

  if (verbModalCancelBtn) {
    verbModalCancelBtn.addEventListener("click", () => {
      if (verbModal) verbModal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    });
  }

  if (verbModalSaveBtn) {
    verbModalSaveBtn.addEventListener("click", async () => {
      const categoryId = verbModalCategory ? verbModalCategory.value : "";
      const de = verbModalDe ? verbModalDe.value.trim() : "";
      const ru = verbModalRu ? verbModalRu.value.trim() : "";
      const praesens = verbModalPraesens ? verbModalPraesens.value.trim() : "";
      const praeteritum = verbModalPraeteritum ? verbModalPraeteritum.value.trim() : "";
      const hilfsverb = verbModalHilfsverb ? verbModalHilfsverb.value : "haben";
      const partizip2 = verbModalPartizip2 ? verbModalPartizip2.value.trim() : "";

      const praesensIch = vpreviewIch ? vpreviewIch.value.trim() : "";
      const praesensDu = vpreviewDu ? vpreviewDu.value.trim() : "";
      const praesensEr = vpreviewEr ? vpreviewEr.value.trim() : "";
      const praesensWir = vpreviewWir ? vpreviewWir.value.trim() : "";
      const praesensIhr = vpreviewIhr ? vpreviewIhr.value.trim() : "";
      const praesensSie = vpreviewSie ? vpreviewSie.value.trim() : "";

      if (!de || !ru) {
        showToast("Заполните инфинитив и перевод", "error");
        if (!de && verbModalDe) verbModalDe.focus();
        else if (verbModalRu) verbModalRu.focus();
        return;
      }

      if (!categoryId) {
        showToast("Выберите раздел для глагола", "error");
        return;
      }

      // Build clean plural forms string: e.g. "ging, sein gegangen (er geht)"
      const parts = [];
      if (praeteritum) parts.push(praeteritum);
      if (partizip2) parts.push(`${hilfsverb} ${partizip2}`);
      if (praesensEr || praesens) parts.push(`(er ${praesensEr || praesens})`);
      const plural = parts.join(", ");

      const payload = {
        categoryId,
        de,
        ru,
        praeteritum: praeteritum || null,
        partizip2: partizip2 || null,
        hilfsverb: hilfsverb || "haben",
        praesens: praesensEr || praesens || null,
        praesensIch: praesensIch || null,
        praesensDu: praesensDu || null,
        praesensEr: praesensEr || null,
        praesensWir: praesensWir || null,
        praesensIhr: praesensIhr || null,
        praesensSie: praesensSie || null,
        plural: plural || null,
        feminine: null,
        femininePlural: null
      };

      try {
        if (editingVerb) {
          await ApiClient.put(`/api/words/${editingVerb.id}`, payload);
          showToast(`Глагол «${de}» успешно сохранён!`, "success");
        } else {
          await ApiClient.post("/api/words", payload);
          showToast(`Глагол «${de}» добавлен!`, "success");
        }

        if (verbModal) verbModal.classList.add("hidden");
        document.body.classList.remove("modal-open");
        await loadInitialData();
      } catch (err) {
        showToast("Ошибка сохранения: " + err.message, "error");
      }
    });
  }

  // Synchronize verbModalPraesens with vpreviewEr
  if (verbModalPraesens && vpreviewEr) {
    verbModalPraesens.addEventListener("input", () => {
      vpreviewEr.value = verbModalPraesens.value;
    });
    vpreviewEr.addEventListener("input", () => {
      verbModalPraesens.value = vpreviewEr.value;
    });
  }

  // Enter to save inside verb modal
  [verbModalDe, verbModalRu, verbModalPraesens, verbModalPraeteritum, verbModalPartizip2].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (verbModalSaveBtn) verbModalSaveBtn.click();
      }
    });
  });

  // ==================== ANALYTICS CONTROLLER ====================

  async function loadAnalyticsData() {
    try {
      const [stats, logsData] = await Promise.all([
        ApiClient.get("/api/analytics/stats"),
        ApiClient.get(`/api/analytics/logs?page=${currentLogsPage}&limit=50&search=${encodeURIComponent(document.getElementById("log-search-input")?.value || "")}`)
      ]);

      analyticsStats = stats;
      analyticsLogs = logsData.logs || [];
      currentLogsPage = logsData.page || 1;
      totalLogsPages = logsData.totalPages || 1;

      renderAnalyticsOverview(stats);
      renderAnalyticsLogs(logsData);
    } catch (err) {
      showToast("Не удалось загрузить аналитику: " + err.message, "error");
    }
  }

  function renderAnalyticsOverview(stats) {
    if (!stats) return;

    // Top Cards
    document.getElementById("stat-unique-today").textContent = stats.todayUniqueVisitors || 0;
    document.getElementById("stat-unique-total").textContent = stats.uniqueVisitors || 0;

    document.getElementById("stat-views-today").textContent = stats.todayVisits || 0;
    document.getElementById("stat-views-total").textContent = stats.totalVisits || 0;

    document.getElementById("stat-active-now").textContent = stats.activeNow || 0;

    document.getElementById("stat-total-words").textContent = stats.totalWords || 0;
    document.getElementById("stat-total-categories").textContent = stats.totalCategories || 0;

    // 7-day Daily Chart
    renderDailyChart(stats.dailyVisits || []);

    // Devices & Browsers
    renderBreakdowns(stats);
  }

  function renderDailyChart(dailyVisits) {
    const chartContainer = document.getElementById("daily-visits-chart");
    if (!chartContainer) return;
    chartContainer.innerHTML = "";

    if (!dailyVisits || dailyVisits.length === 0) {
      chartContainer.innerHTML = `<div style="margin: auto; font-size: 12px; color: var(--text-muted);">Нет данных за 7 дней</div>`;
      return;
    }

    const maxVal = Math.max(...dailyVisits.map((d) => d.visits), 1);

    dailyVisits.forEach((item) => {
      const heightPercent = Math.max(Math.round((item.visits / maxVal) * 100), 6);
      const dayLabel = formatShortDate(item.date);

      const group = document.createElement("div");
      group.className = "chart-bar-group";
      group.innerHTML = `
        <div class="chart-bar" style="height: ${heightPercent}%;">
          <div class="chart-bar-tooltip">
            ${item.visits} виз. (${item.unique} уник.)
          </div>
        </div>
        <div class="chart-bar-label">${dayLabel}</div>
      `;
      chartContainer.appendChild(group);
    });
  }

  function renderBreakdowns(stats) {
    // Devices
    const deviceList = document.getElementById("device-breakdown-list");
    if (deviceList) {
      deviceList.innerHTML = "";
      const devStats = stats.deviceStats || {};
      const total = Object.values(devStats).reduce((a, b) => a + b, 0) || 1;

      const deviceTypes = [
        { key: "Desktop", label: "💻 Компьютеры (Desktop)", icon: "💻" },
        { key: "Mobile", label: "📱 Смартфоны (Mobile)", icon: "📱" },
        { key: "Tablet", label: "📟 Планшеты (Tablet)", icon: "📟" }
      ];

      deviceTypes.forEach((d) => {
        const count = devStats[d.key] || 0;
        const pct = Math.round((count / total) * 100);

        const row = document.createElement("div");
        row.className = "breakdown-row";
        row.innerHTML = `
          <div class="breakdown-info">
            <span>${d.label}</span>
            <span><b>${count}</b> (${pct}%)</span>
          </div>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        deviceList.appendChild(row);
      });
    }

    // Browsers & OS
    const browserList = document.getElementById("browser-breakdown-list");
    if (browserList) {
      browserList.innerHTML = "";
      const bStats = stats.browserStats || {};
      const total = Object.values(bStats).reduce((a, b) => a + b, 0) || 1;

      Object.entries(bStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .forEach(([browser, count]) => {
          const pct = Math.round((count / total) * 100);
          const row = document.createElement("div");
          row.className = "breakdown-row";
          row.innerHTML = `
            <div class="breakdown-info">
              <span>🌐 ${escapeHtml(browser)}</span>
              <span><b>${count}</b> (${pct}%)</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar-fill" style="width: ${pct}%; background: #0e7490;"></div>
            </div>
          `;
          browserList.appendChild(row);
        });
    }
  }

  function renderAnalyticsLogs(logsData) {
    const logsTbody = document.getElementById("logs-tbody");
    const totalBadge = document.getElementById("logs-total-badge");
    const pageIndicator = document.getElementById("logs-page-indicator");
    const prevBtn = document.getElementById("logs-prev-page-btn");
    const nextBtn = document.getElementById("logs-next-page-btn");

    if (!logsTbody) return;
    logsTbody.innerHTML = "";

    totalBadge.textContent = `${logsData.total || 0} записей`;
    pageIndicator.textContent = `Страница ${logsData.page || 1} из ${logsData.totalPages || 1}`;

    prevBtn.disabled = logsData.page <= 1;
    nextBtn.disabled = logsData.page >= logsData.totalPages;

    const logs = logsData.logs || [];
    if (logs.length === 0) {
      logsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Журнал пуст</td></tr>`;
      return;
    }

    logs.forEach((log) => {
      const tr = document.createElement("tr");
      const relativeTime = getRelativeTimeString(new Date(log.createdAt));
      const exactTime = formatExactTime(new Date(log.createdAt));

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="ip-badge">${escapeHtml(log.ip)}</span>
            <button type="button" class="copy-ip-btn" data-ip="${escapeHtml(log.ip)}" title="Скопировать IP" style="background: none; border: none; cursor: pointer; font-size: 11px; padding: 2px;">📋</button>
          </div>
        </td>
        <td>
          <div style="font-size: 12px; font-weight: 600;">${relativeTime}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${exactTime}</div>
        </td>
        <td>
          <span class="device-badge">${escapeHtml(log.device || "Desktop")}</span>
          <span style="font-size: 12px; margin-left: 4px; color: var(--text-secondary);">${escapeHtml(log.os || "—")}</span>
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 500;">${escapeHtml(log.browser || "—")}</span>
        </td>
        <td>
          <span style="font-family: monospace; font-size: 12px; font-weight: 600; color: var(--accent);">${escapeHtml(log.page)}</span>
          ${log.action && log.action !== "page_view" ? `<span class="category-tag" style="margin-left: 4px; font-size: 10px;">${escapeHtml(log.action)}</span>` : ""}
        </td>
        <td>
          <div class="log-ua-toggle" data-id="${log.id}">Показать UA</div>
          <div class="log-ua-text" id="ua-${log.id}" style="display: none;">${escapeHtml(log.userAgent || "—")}</div>
        </td>
      `;

      // Copy IP
      tr.querySelector(".copy-ip-btn")?.addEventListener("click", () => {
        navigator.clipboard.writeText(log.ip).then(() => {
          showToast(`IP ${log.ip} скопирован!`, "info", 1500);
        });
      });

      // Toggle UA
      tr.querySelector(".log-ua-toggle")?.addEventListener("click", (e) => {
        const uaBox = document.getElementById(`ua-${log.id}`);
        if (uaBox) {
          const isHidden = uaBox.style.display === "none";
          uaBox.style.display = isHidden ? "block" : "none";
          e.target.textContent = isHidden ? "Скрыть UA" : "Показать UA";
        }
      });

      logsTbody.appendChild(tr);
    });
  }

  // Analytics Logs Search & Pagination
  const logSearchInput = document.getElementById("log-search-input");
  let searchDebounce = null;
  if (logSearchInput) {
    logSearchInput.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentLogsPage = 1;
        loadAnalyticsData();
      }, 300);
    });
  }

  document.getElementById("refresh-logs-btn")?.addEventListener("click", () => {
    loadAnalyticsData();
    showToast("Данные аналитики обновлены", "info", 1500);
  });

  document.getElementById("logs-prev-page-btn")?.addEventListener("click", () => {
    if (currentLogsPage > 1) {
      currentLogsPage--;
      loadAnalyticsData();
    }
  });

  document.getElementById("logs-next-page-btn")?.addEventListener("click", () => {
    if (currentLogsPage < totalLogsPages) {
      currentLogsPage++;
      loadAnalyticsData();
    }
  });

  document.getElementById("clear-logs-btn")?.addEventListener("click", async () => {
    const confirmed = await showConfirmDialog(
      "Очистка журнала посещений",
      "Вы действительно хотите удалить все записи в журнале посещений? Статистика посещений будет сброшена."
    );
    if (!confirmed) return;

    try {
      await ApiClient.delete("/api/analytics/logs");
      showToast("Журнал посещений очищен", "success");
      currentLogsPage = 1;
      await loadAnalyticsData();
    } catch (err) {
      showToast("Ошибка при очистке журнала: " + err.message, "error");
    }
  });

  function startAnalyticsAutoPoll() {
    stopAnalyticsAutoPoll();
    analyticsPollInterval = setInterval(() => {
      loadAnalyticsData();
    }, 15000);
  }

  function stopAnalyticsAutoPoll() {
    if (analyticsPollInterval) {
      clearInterval(analyticsPollInterval);
      analyticsPollInterval = null;
    }
  }

  // ==================== IMPORT & EXPORT CONTROLLER ====================

  const confirmExportBtn = document.getElementById("confirm-export-btn");
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener("click", async () => {
      const format = document.querySelector('input[name="export-format"]:checked')?.value || "csv";
      const scope = document.getElementById("export-scope-select")?.value || "all";

      let wordsToExport = [];
      let filename = "deutsch-words";

      if (scope === "all") {
        wordsToExport = allWordsCache.length > 0 ? allWordsCache : await ApiClient.get("/api/words");
        filename += "-all";
      } else {
        const cat = await ApiClient.get(`/api/categories/${scope}`);
        wordsToExport = (cat.words || []).map((w) => ({ ...w, category: cat }));
        filename += `-${cat.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}`;
      }

      if (wordsToExport.length === 0) {
        showToast("Нет слов для экспорта в выбранной категории", "error");
        return;
      }

      let content = "";
      let mimeType = "text/plain;charset=utf-8";

      if (format === "csv") {
        content = "Немецкий;Перевод;Множественное число;Женский род;Множественное число (ж.р.);Категория\n";
        wordsToExport.forEach((w) => {
          const catName = w.category?.name || "";
          content += `"${(w.de || "").replace(/"/g, '""')}";"${(w.ru || "").replace(/"/g, '""')}";"${(w.plural || "").replace(/"/g, '""')}";"${(w.feminine || "").replace(/"/g, '""')}";"${(w.femininePlural || "").replace(/"/g, '""')}";"${catName.replace(/"/g, '""')}"\n`;
        });
        filename += ".csv";
        mimeType = "text/csv;charset=utf-8";
      } else if (format === "json") {
        content = JSON.stringify(wordsToExport, null, 2);
        filename += ".json";
        mimeType = "application/json;charset=utf-8";
      } else if (format === "anki") {
        wordsToExport.forEach((w) => {
          let front = escapeHtml(w.de);
          if (w.plural) front += `<br><small>мн.ч: ${escapeHtml(w.plural)}</small>`;
          let back = escapeHtml(w.ru);
          if (w.feminine) back += `<br><small>ж.р: ${escapeHtml(w.feminine)}</small>`;
          if (w.femininePlural) back += `<br><small>мн.ж: ${escapeHtml(w.femininePlural)}</small>`;
          const cat = w.category?.name || "Deutsch";
          content += `${front}\t${back}\t${cat}\n`;
        });
        filename += "-anki.tsv";
        mimeType = "text/tab-separated-values;charset=utf-8";
      }

      downloadBlob(content, filename, mimeType);
      showToast(`Экспортировано ${wordsToExport.length} слов!`, "success");
    });
  }

  // Import Parsing
  let parsedImportWords = [];
  const importFileInput = document.getElementById("import-file-input");
  const importTextInput = document.getElementById("import-text-input");
  const parseImportBtn = document.getElementById("parse-import-btn");
  const confirmImportBtn = document.getElementById("confirm-import-btn");
  const importPreviewBox = document.getElementById("import-preview-box");
  const importPreviewCount = document.getElementById("import-preview-count");
  const importPreviewTbody = document.getElementById("import-preview-tbody");

  importFileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importTextInput.value = ev.target.result;
      parseImportContent();
    };
    reader.readAsText(file);
  });

  parseImportBtn?.addEventListener("click", () => parseImportContent());

  function parseImportContent() {
    const text = (importTextInput.value || "").trim();
    if (!text) {
      showToast("Вставьте текст или выберите файл для импорта", "error");
      return;
    }

    parsedImportWords = [];

    // Check if JSON
    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        list.forEach((item) => {
          if (item.de && item.ru) {
            parsedImportWords.push({
              de: item.de.trim(),
              ru: item.ru.trim(),
              plural: item.plural?.trim() || null,
              feminine: item.feminine?.trim() || null,
              femininePlural: (item.femininePlural || item.feminine_plural)?.trim() || null,
              categoryName: item.category?.name || item.categoryName || null
            });
          }
        });
      } catch (err) {
        showToast("Ошибка парсинга JSON: " + err.message, "error");
        return;
      }
    } else {
      // CSV / TSV / Semicolon lines
      const lines = text.split(/\r?\n/);
      lines.forEach((line) => {
        const l = line.trim();
        if (!l || l.startsWith("#") || l.startsWith("Немецкий;")) return;

        // Split by delimiter (tab, semicolon, or comma)
        let delimiter = ";";
        if (l.includes("\t")) delimiter = "\t";
        else if (l.includes(";") && !l.includes("\t")) delimiter = ";";
        else if (l.includes(",") && !l.includes(";")) delimiter = ",";

        const parts = l.split(delimiter).map((p) => p.replace(/^["']|["']$/g, "").trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          // Check if 5th is femininePlural or category
          let plural = parts[2] || null;
          let feminine = parts[3] || null;
          let femininePlural = null;
          let categoryName = null;
          if (parts.length >= 6) {
            femininePlural = parts[4] || null;
            categoryName = parts[5] || null;
          } else if (parts.length === 5) {
            categoryName = parts[4] || null;
          }

          parsedImportWords.push({
            de: parts[0],
            ru: parts[1],
            plural,
            feminine,
            femininePlural,
            categoryName
          });
        }
      });
    }

    if (parsedImportWords.length === 0) {
      showToast("Не удалось извлечь слова. Проверьте формат строк.", "error");
      confirmImportBtn.disabled = true;
      importPreviewBox.style.display = "none";
      return;
    }

    importPreviewCount.textContent = `${parsedImportWords.length} слов`;
    importPreviewTbody.innerHTML = "";
    parsedImportWords.slice(0, 5).forEach((w) => {
      const tr = document.createElement("tr");
      let details = [];
      if (w.plural) details.push(`мн: ${escapeHtml(w.plural)}`);
      if (w.feminine) details.push(`ж: ${escapeHtml(w.feminine)}`);
      if (w.femininePlural) details.push(`мн.ж: ${escapeHtml(w.femininePlural)}`);

      tr.innerHTML = `
        <td style="padding: 4px 6px; font-weight: 600;">${escapeHtml(w.de)}</td>
        <td style="padding: 4px 6px;">${escapeHtml(w.ru)}</td>
        <td style="padding: 4px 6px; color: var(--text-muted); font-size: 11px;">${details.join(", ")}</td>
      `;
      importPreviewTbody.appendChild(tr);
    });

    importPreviewBox.style.display = "block";
    confirmImportBtn.disabled = false;
    showToast(`Распознано ${parsedImportWords.length} слов. Готово к импорту!`, "success");
  }

  confirmImportBtn?.addEventListener("click", async () => {
    if (parsedImportWords.length === 0) return;

    const targetCatId = document.getElementById("import-target-cat")?.value;
    const skipDup = document.getElementById("import-skip-dup-cb")?.checked;

    if (!targetCatId) {
      showToast("Выберите категорию назначения", "error");
      return;
    }

    confirmImportBtn.disabled = true;
    confirmImportBtn.textContent = "Импорт…";

    let addedCount = 0;
    let skippedCount = 0;

    try {
      for (const w of parsedImportWords) {
        if (skipDup) {
          const isDup = allWordsCache.some((cw) => (cw.de || "").toLowerCase().trim() === w.de.toLowerCase().trim());
          if (isDup) {
            skippedCount++;
            continue;
          }
        }

        await ApiClient.post("/api/words", {
          categoryId: targetCatId,
          de: w.de,
          ru: w.ru,
          plural: w.plural,
          feminine: w.feminine,
          femininePlural: w.femininePlural
        });
        addedCount++;
      }

      showToast(`Импорт завершён! Добавлено: ${addedCount}, пропущено дубликатов: ${skippedCount}`, "success", 4500);
      importTextInput.value = "";
      importFileInput.value = "";
      importPreviewBox.style.display = "none";
      parsedImportWords = [];
      confirmImportBtn.textContent = "Импортировать";
      await loadInitialData();
    } catch (err) {
      showToast("Ошибка импорта: " + err.message, "error");
      confirmImportBtn.disabled = false;
      confirmImportBtn.textContent = "Импортировать";
    }
  });

  // ==================== LOGOUT & REFRESH ====================

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    try {
      await ApiClient.post("/api/admin/logout");
      window.location.href = "/admin-login.html";
    } catch (err) {
      window.location.href = "/admin-login.html";
    }
  });

  document.getElementById("admin-refresh-all-btn")?.addEventListener("click", async () => {
    await loadInitialData();
    if (document.getElementById("tab-analytics").classList.contains("active")) {
      await loadAnalyticsData();
    }
    showToast("Данные успешно обновлены!", "info", 1500);
  });

  // ==================== UTILITY FUNCTIONS ====================

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}`;
    }
    return dateStr;
  }

  function formatExactTime(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function getRelativeTimeString(date) {
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 10) return "только что";
    if (diffSec < 60) return `${diffSec} сек назад`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} мин назад`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн назад`;
  }

  // Initialize on load
  loadInitialData();
})();
