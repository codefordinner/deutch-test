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

      if (targetId === "tab-io") {
        populateCategoryDropdowns();
      }
    });
  });

  // ==================== DATA LOADING ====================

  async function loadInitialData() {
    try {
      categories = await ApiClient.get("/api/categories");
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
