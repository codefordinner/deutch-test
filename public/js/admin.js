(function () {
  var categories = [];
  var selectedCategoryId = null; // Can be a category ID or "__ALL__"
  var selectedWordIds = new Set();
  var wordsToMove = [];

  var categorySelect = document.getElementById("category-select");
  var pickerSection = document.getElementById("category-picker-section");
  var noCategoriesNote = document.getElementById("no-categories-note");
  var detailSection = document.getElementById("category-detail-section");
  var addWordForm = document.getElementById("add-word-form");
  var globalModeNote = document.getElementById("global-mode-note");
  var filterInput = document.getElementById("word-filter-input");
  var globalSearchCb = document.getElementById("global-search-cb");
  var renameCatBtn = document.getElementById("rename-category-btn");
  var deleteCatBtn = document.getElementById("delete-category-btn");

  var batchActionsBar = document.getElementById("batch-actions-bar");
  var selectedCountEl = document.getElementById("selected-count");
  var batchOpenMoveBtn = document.getElementById("batch-open-move-btn");
  var batchDeleteBtn = document.getElementById("batch-delete-btn");
  var batchCancelBtn = document.getElementById("batch-cancel-btn");

  var selectAllCb = document.getElementById("select-all-words");
  var thCategory = document.getElementById("th-category");
  var wordsTable = document.getElementById("words-table");
  var wordsTbody = document.getElementById("words-tbody");
  var wordsEmptyNote = document.getElementById("words-empty-note");

  var moveModal = document.getElementById("move-modal");
  var moveModalText = document.getElementById("move-modal-text");
  var moveTargetCategory = document.getElementById("move-target-category");
  var cancelMoveBtn = document.getElementById("cancel-move-btn");
  var confirmMoveBtn = document.getElementById("confirm-move-btn");

  function api(url, options) {
    if (window.ApiClient) {
      options = options || {};
      var method = (options.method || "GET").toUpperCase();
      var body = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : undefined;
      if (method === "POST") return window.ApiClient.post(url, body);
      if (method === "PUT") return window.ApiClient.put(url, body);
      if (method === "DELETE") return window.ApiClient.delete(url);
      return window.ApiClient.get(url);
    }
    return fetch(url, options).then(function (r) {
      if (r.status === 401) {
        window.location.href = "/admin-login.html";
        throw new Error("Сессия истекла");
      }
      if (!r.ok) {
        return r.json().then(function (err) { throw new Error(err.error || "Ошибка запроса"); });
      }
      if (r.status === 204) return null;
      return r.json();
    });
  }

  function currentCategory() {
    if (selectedCategoryId === "__ALL__") return null;
    return categories.find(function (c) { return c.id === selectedCategoryId; });
  }

  function isGlobalMode() {
    return selectedCategoryId === "__ALL__" || (globalSearchCb && globalSearchCb.checked);
  }

  function loadCategories() {
    api("/api/categories").then(function (data) {
      categories = data;
      // Filter out invalid selectedWordIds
      var allValidWordIds = new Set();
      categories.forEach(function (c) {
        c.words.forEach(function (w) { allValidWordIds.add(w.id); });
      });
      selectedWordIds.forEach(function (id) {
        if (!allValidWordIds.has(id)) selectedWordIds.delete(id);
      });

      if (categories.length === 0) {
        selectedCategoryId = null;
      } else if (!selectedCategoryId) {
        selectedCategoryId = categories[0].id;
      }

      renderCategorySelect();
      renderCategoryDetail();
      updateBatchBar();
    }).catch(function (e) {
      pickerSection.style.display = "none";
      detailSection.style.display = "none";
      noCategoriesNote.style.display = "block";
      noCategoriesNote.textContent = "Не удалось загрузить: " + e.message;
    });
  }

  function renderCategorySelect() {
    if (categories.length === 0) {
      pickerSection.style.display = "none";
      detailSection.style.display = "none";
      noCategoriesNote.style.display = "block";
      noCategoriesNote.textContent = "Категорий пока нет. Добавь первую выше.";
      return;
    }
    noCategoriesNote.style.display = "none";
    pickerSection.style.display = "block";
    categorySelect.innerHTML = "";

    var totalWords = 0;
    categories.forEach(function (c) { totalWords += c.words.length; });

    // Global option
    var globalOpt = document.createElement("option");
    globalOpt.value = "__ALL__";
    globalOpt.textContent = "🔍 Все словари (" + totalWords + ")";
    if (selectedCategoryId === "__ALL__") globalOpt.selected = true;
    categorySelect.appendChild(globalOpt);

    // Individual category options
    categories.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name + " (" + cat.words.length + ")";
      if (cat.id === selectedCategoryId) opt.selected = true;
      categorySelect.appendChild(opt);
    });

    if (globalSearchCb) {
      globalSearchCb.checked = (selectedCategoryId === "__ALL__");
    }
  }

  function renderCategoryDetail() {
    if (categories.length === 0) {
      detailSection.style.display = "none";
      return;
    }
    detailSection.style.display = "block";

    var globalMode = isGlobalMode();

    if (globalMode) {
      renameCatBtn.style.display = "none";
      deleteCatBtn.style.display = "none";
      addWordForm.style.display = "none";
      globalModeNote.style.display = "block";
      thCategory.style.display = "";
    } else {
      renameCatBtn.style.display = "inline-block";
      deleteCatBtn.style.display = "inline-block";
      addWordForm.style.display = "flex";
      globalModeNote.style.display = "none";
      thCategory.style.display = "none";
    }

    renderWordsTable();
  }

  function getVisibleWords() {
    var globalMode = isGlobalMode();
    var filterVal = filterInput.value.trim().toLowerCase();
    var wordsList = [];

    if (globalMode) {
      categories.forEach(function (cat) {
        cat.words.forEach(function (w) {
          wordsList.push({
            id: w.id,
            de: w.de,
            ru: w.ru,
            categoryId: cat.id,
            categoryName: cat.name
          });
        });
      });
    } else {
      var cat = currentCategory();
      if (cat) {
        cat.words.forEach(function (w) {
          wordsList.push({
            id: w.id,
            de: w.de,
            ru: w.ru,
            categoryId: cat.id,
            categoryName: cat.name
          });
        });
      }
    }

    if (!filterVal) return wordsList;

    return wordsList.filter(function (w) {
      return w.de.toLowerCase().indexOf(filterVal) !== -1 ||
             w.ru.toLowerCase().indexOf(filterVal) !== -1 ||
             (w.categoryName && w.categoryName.toLowerCase().indexOf(filterVal) !== -1);
    });
  }

  function renderWordsTable() {
    wordsTbody.innerHTML = "";
    var visibleWords = getVisibleWords();
    var globalMode = isGlobalMode();

    if (visibleWords.length === 0) {
      wordsTable.style.display = "none";
      wordsEmptyNote.style.display = "block";
      if (filterInput.value.trim()) {
        wordsEmptyNote.textContent = "Ничего не найдено по запросу «" + filterInput.value.trim() + "».";
      } else {
        wordsEmptyNote.textContent = globalMode ? "В словарях пока нет слов." : "В этой категории пока нет слов.";
      }
      selectAllCb.checked = false;
      return;
    }

    wordsTable.style.display = "table";
    wordsEmptyNote.style.display = "none";

    visibleWords.forEach(function (word) {
      wordsTbody.appendChild(buildWordRow(word, globalMode));
    });

    // Update select-all header checkbox
    var allChecked = visibleWords.every(function (w) { return selectedWordIds.has(w.id); });
    selectAllCb.checked = visibleWords.length > 0 && allChecked;
  }

  function formatGermanGender(text) {
    if (!text || typeof text !== "string") return text || "";
    var safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safe.replace(/\b(der|die|das)\b/gi, function (match) {
      var lower = match.toLowerCase();
      return '<span class="gender-' + lower + '">' + match + '</span>';
    });
  }

  function buildWordRow(word, globalMode) {
    var tr = document.createElement("tr");

    // Checkbox column
    var cbTd = document.createElement("td");
    cbTd.style.textAlign = "center";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "word-checkbox";
    cb.checked = selectedWordIds.has(word.id);
    cb.addEventListener("change", function () {
      if (cb.checked) {
        selectedWordIds.add(word.id);
      } else {
        selectedWordIds.delete(word.id);
      }
      updateBatchBar();
      var visible = getVisibleWords();
      selectAllCb.checked = visible.length > 0 && visible.every(function (w) { return selectedWordIds.has(w.id); });
    });
    cbTd.appendChild(cb);

    var deTd = document.createElement("td");
    var ruTd = document.createElement("td");

    deTd.innerHTML = formatGermanGender(word.de);
    ruTd.textContent = word.ru;

    tr.appendChild(cbTd);
    tr.appendChild(deTd);
    tr.appendChild(ruTd);

    if (globalMode) {
      var catTd = document.createElement("td");
      catTd.innerHTML = '<span class="category-tag">' + (word.categoryName || "") + '</span>';
      tr.appendChild(catTd);
    }

    var actionsTd = document.createElement("td");
    actionsTd.style.textAlign = "right";

    var editBtn = document.createElement("button");
    editBtn.className = "small-btn ghost-btn";
    editBtn.textContent = "Изменить";
    editBtn.style.marginRight = "4px";
    editBtn.addEventListener("click", function () {
      var newDe = prompt("Немецкий вариант:", word.de);
      if (newDe === null) return;
      var newRu = prompt("Перевод:", word.ru);
      if (newRu === null) return;
      newDe = newDe.trim();
      newRu = newRu.trim();
      if (!newDe || !newRu) return;
      api("/api/words/" + word.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ de: newDe, ru: newRu })
      }).then(loadCategories).catch(function (e) { alert(e.message); });
    });

    var moveBtn = document.createElement("button");
    moveBtn.className = "small-btn ghost-btn";
    moveBtn.textContent = "Перенести";
    moveBtn.style.marginRight = "4px";
    moveBtn.addEventListener("click", function () {
      openMoveModal([word.id], 'Перенос слова: «' + word.de + ' — ' + word.ru + '»');
    });

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn danger-btn";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", function () {
      if (!confirm('Удалить слово "' + word.de + '"?')) return;
      api("/api/words/" + word.id, { method: "DELETE" })
        .then(function () {
          selectedWordIds.delete(word.id);
          loadCategories();
        })
        .catch(function (e) { alert(e.message); });
    });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(moveBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(actionsTd);
    return tr;
  }

  function updateBatchBar() {
    var count = selectedWordIds.size;
    selectedCountEl.textContent = count;
    if (count > 0) {
      batchActionsBar.style.display = "flex";
    } else {
      batchActionsBar.style.display = "none";
    }
  }

  function openMoveModal(wordIds, text) {
    if (!wordIds || wordIds.length === 0) return;
    wordsToMove = wordIds;
    moveModalText.textContent = text;

    moveTargetCategory.innerHTML = "";
    categories.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name + " (" + cat.words.length + " слов)";
      moveTargetCategory.appendChild(opt);
    });

    moveModal.classList.remove("hidden");
  }

  function closeMoveModal() {
    moveModal.classList.add("hidden");
    wordsToMove = [];
  }

  // ---- Event Handlers ----

  categorySelect.addEventListener("change", function () {
    selectedCategoryId = categorySelect.value;
    filterInput.value = "";
    if (globalSearchCb) globalSearchCb.checked = (selectedCategoryId === "__ALL__");
    renderCategoryDetail();
  });

  if (globalSearchCb) {
    globalSearchCb.addEventListener("change", function () {
      if (globalSearchCb.checked) {
        selectedCategoryId = "__ALL__";
      } else {
        selectedCategoryId = categories.length > 0 ? categories[0].id : null;
      }
      categorySelect.value = selectedCategoryId;
      renderCategoryDetail();
    });
  }

  filterInput.addEventListener("input", function () {
    renderWordsTable();
  });

  selectAllCb.addEventListener("change", function () {
    var visibleWords = getVisibleWords();
    if (selectAllCb.checked) {
      visibleWords.forEach(function (w) { selectedWordIds.add(w.id); });
    } else {
      visibleWords.forEach(function (w) { selectedWordIds.delete(w.id); });
    }
    renderWordsTable();
    updateBatchBar();
  });

  // Batch actions
  batchOpenMoveBtn.addEventListener("click", function () {
    var ids = Array.from(selectedWordIds);
    if (ids.length === 0) return;
    openMoveModal(ids, 'Выбрано слов для переноса: ' + ids.length + ' шт.');
  });

  batchDeleteBtn.addEventListener("click", function () {
    var ids = Array.from(selectedWordIds);
    if (ids.length === 0) return;
    if (!confirm('Вы действительно хотите удалить выбранные слова (' + ids.length + ' шт.)?')) return;

    Promise.all(ids.map(function (id) {
      return api("/api/words/" + id, { method: "DELETE" });
    })).then(function () {
      selectedWordIds.clear();
      loadCategories();
    }).catch(function (e) { alert("Ошибка при удалении: " + e.message); });
  });

  batchCancelBtn.addEventListener("click", function () {
    selectedWordIds.clear();
    renderWordsTable();
    updateBatchBar();
  });

  // Move Modal handlers
  cancelMoveBtn.addEventListener("click", closeMoveModal);

  confirmMoveBtn.addEventListener("click", function () {
    var targetCatId = moveTargetCategory.value;
    if (!targetCatId) { alert("Выберите целевую категорию"); return; }
    if (wordsToMove.length === 0) return;

    api("/api/words/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordIds: wordsToMove, targetCategoryId: targetCatId })
    }).then(function () {
      closeMoveModal();
      selectedWordIds.clear();
      loadCategories();
    }).catch(function (e) { alert("Ошибка переноса: " + e.message); });
  });

  // Rename & Delete category
  renameCatBtn.addEventListener("click", function () {
    var cat = currentCategory();
    if (!cat) return;
    var newName = prompt("Новое название категории:", cat.name);
    if (newName === null) return;
    newName = newName.trim();
    if (!newName) return;
    api("/api/categories/" + cat.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    }).then(loadCategories).catch(function (e) { alert(e.message); });
  });

  deleteCatBtn.addEventListener("click", function () {
    var cat = currentCategory();
    if (!cat) return;
    if (!confirm('Удалить категорию "' + cat.name + '" вместе со всеми словами?')) return;
    api("/api/categories/" + cat.id, { method: "DELETE" })
      .then(function () {
        selectedCategoryId = null;
        loadCategories();
      })
      .catch(function (e) { alert(e.message); });
  });

  // Live duplicate checking
  var deInput = document.getElementById("new-word-de");
  var ruInput = document.getElementById("new-word-ru");
  var dupBanner = document.getElementById("duplicate-warning-banner");
  var dupTimer = null;

  function checkLiveDuplicates() {
    if (!deInput || !ruInput || !dupBanner) return;
    var de = deInput.value.trim();
    var ru = ruInput.value.trim();
    if (!de && !ru) {
      dupBanner.style.display = "none";
      return;
    }

    var normDe = de.toLowerCase();
    var normRu = ru.toLowerCase();
    var found = [];

    categories.forEach(function (cat) {
      cat.words.forEach(function (w) {
        var wDe = (w.de || "").trim().toLowerCase();
        var wRu = (w.ru || "").trim().toLowerCase();
        if ((normDe && wDe === normDe) || (normRu && wRu === normRu)) {
          found.push({ de: w.de, ru: w.ru, categoryName: cat.name });
        }
      });
    });

    if (found.length > 0) {
      var match = found[0];
      dupBanner.style.display = "block";
      dupBanner.innerHTML = "⚠️ <b>Найден дубликат:</b> «" + match.de + " — " + match.ru + "» уже есть в разделе <i>«" + match.categoryName + "»</i>!";
    } else {
      dupBanner.style.display = "none";
    }
  }

  function scheduleDupCheck() {
    clearTimeout(dupTimer);
    dupTimer = setTimeout(checkLiveDuplicates, 300);
  }

  if (deInput) deInput.addEventListener("input", scheduleDupCheck);
  if (ruInput) ruInput.addEventListener("input", scheduleDupCheck);

  function createWordRequest(catId, de, ru, force) {
    var url = "/api/categories/" + catId + "/words" + (force ? "?force=true" : "");
    return api(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ de: de, ru: ru, force: force })
    }).then(function () {
      deInput.value = "";
      ruInput.value = "";
      if (dupBanner) dupBanner.style.display = "none";
      loadCategories();
    }).catch(function (e) {
      if (e.message && e.message.indexOf("уже существует") !== -1) {
        if (confirm(e.message + "\n\nВсё равно добавить это слово как дубликат?")) {
          createWordRequest(catId, de, ru, true);
        }
      } else {
        alert(e.message);
      }
    });
  }

  // Add word
  document.getElementById("add-word-btn").addEventListener("click", function () {
    var cat = currentCategory();
    if (!cat) { alert("Выберите конкретную категорию для добавления слова."); return; }
    var de = deInput.value.trim();
    var ru = ruInput.value.trim();
    if (!de || !ru) { alert("Заполни оба поля"); return; }
    createWordRequest(cat.id, de, ru, false);
  });

  // New category
  document.getElementById("add-category-btn").addEventListener("click", function () {
    var input = document.getElementById("new-category-name");
    var name = input.value.trim();
    if (!name) { alert("Введи название категории"); return; }
    api("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name })
    }).then(function (newCat) {
      input.value = "";
      selectedCategoryId = newCat.id;
      loadCategories();
    }).catch(function (e) { alert(e.message); });
  });

  var logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      fetch("/api/admin/logout", { method: "POST" }).then(function () {
        window.location.href = "/admin-login.html";
      });
    });
  }

  // ===== EXPORT SYSTEM =====
  var openExportBtn = document.getElementById("open-export-btn");
  var exportModal = document.getElementById("export-modal");
  var exportScopeSelect = document.getElementById("export-scope-select");
  var cancelExportBtn = document.getElementById("cancel-export-btn");
  var confirmExportBtn = document.getElementById("confirm-export-btn");

  if (openExportBtn && exportModal) {
    openExportBtn.addEventListener("click", function () {
      if (!exportScopeSelect) return;
      exportScopeSelect.innerHTML = '<option value="__ALL__">Все категории (Весь словарь)</option>';
      categories.forEach(function (cat) {
        var opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name + " (" + cat.words.length + " слов)";
        if (cat.id === selectedCategoryId) opt.selected = true;
        exportScopeSelect.appendChild(opt);
      });
      exportModal.classList.remove("hidden");
    });
  }

  if (cancelExportBtn && exportModal) {
    cancelExportBtn.addEventListener("click", function () {
      exportModal.classList.add("hidden");
    });
  }

  if (confirmExportBtn) {
    confirmExportBtn.addEventListener("click", function () {
      var formatRadio = document.querySelector('input[name="export-format"]:checked');
      var format = formatRadio ? formatRadio.value : "csv";
      var scopeId = exportScopeSelect.value;

      var exportWords = [];
      categories.forEach(function (cat) {
        if (scopeId !== "__ALL__" && cat.id !== scopeId) return;
        cat.words.forEach(function (w) {
          exportWords.push({
            de: w.de,
            ru: w.ru,
            category: cat.name
          });
        });
      });

      if (exportWords.length === 0) {
        alert("Нет слов для экспорта");
        return;
      }

      var content = "";
      var mimeType = "text/plain;charset=utf-8";
      var fileExt = "txt";

      if (format === "json") {
        content = JSON.stringify(exportWords, null, 2);
        mimeType = "application/json;charset=utf-8";
        fileExt = "json";
      } else if (format === "anki") {
        // Anki TSV format: German [tab] Russian [tab] Category
        content = exportWords.map(function (w) {
          return w.de + "\t" + w.ru + "\t" + w.category;
        }).join("\n");
        mimeType = "text/plain;charset=utf-8";
        fileExt = "txt";
      } else {
        // CSV with semicolon (Excel compatible with BOM)
        var lines = ["\uFEFFНемецкий;Перевод;Категория"];
        exportWords.forEach(function (w) {
          var cleanDe = '"' + w.de.replace(/"/g, '""') + '"';
          var cleanRu = '"' + w.ru.replace(/"/g, '""') + '"';
          var cleanCat = '"' + w.category.replace(/"/g, '""') + '"';
          lines.push(cleanDe + ";" + cleanRu + ";" + cleanCat);
        });
        content = lines.join("\n");
        mimeType = "text/csv;charset=utf-8";
        fileExt = "csv";
      }

      var blob = new Blob([content], { type: mimeType });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "german_words_export_" + new Date().toISOString().slice(0, 10) + "." + fileExt;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      exportModal.classList.add("hidden");
    });
  }

  // ===== IMPORT SYSTEM =====
  var openImportBtn = document.getElementById("open-import-btn");
  var importModal = document.getElementById("import-modal");
  var importFileInput = document.getElementById("import-file-input");
  var importTextInput = document.getElementById("import-text-input");
  var importTargetCat = document.getElementById("import-target-cat");
  var importSkipDupCb = document.getElementById("import-skip-dup-cb");
  var importPreviewBox = document.getElementById("import-preview-box");
  var importPreviewCount = document.getElementById("import-preview-count");
  var importPreviewTbody = document.getElementById("import-preview-tbody");
  var parseImportBtn = document.getElementById("parse-import-btn");
  var cancelImportBtn = document.getElementById("cancel-import-btn");
  var confirmImportBtn = document.getElementById("confirm-import-btn");

  var parsedImportItems = [];

  if (openImportBtn && importModal) {
    openImportBtn.addEventListener("click", function () {
      if (!importTargetCat) return;
      importTargetCat.innerHTML = '<option value="">Из файла (создавать из колонок)</option>';
      categories.forEach(function (cat) {
        var opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        if (cat.id === selectedCategoryId && selectedCategoryId !== "__ALL__") opt.selected = true;
        importTargetCat.appendChild(opt);
      });

      importFileInput.value = "";
      importTextInput.value = "";
      importPreviewBox.style.display = "none";
      confirmImportBtn.disabled = true;
      parsedImportItems = [];
      importModal.classList.remove("hidden");
    });
  }

  if (cancelImportBtn && importModal) {
    cancelImportBtn.addEventListener("click", function () {
      importModal.classList.add("hidden");
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (evt) {
        importTextInput.value = evt.target.result;
        parseImportData();
      };
      reader.readAsText(file);
    });
  }

  function parseImportData() {
    var text = importTextInput.value.trim();
    parsedImportItems = [];

    if (!text) {
      importPreviewBox.style.display = "none";
      confirmImportBtn.disabled = true;
      return;
    }

    // Try parsing as JSON first
    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        var json = JSON.parse(text);
        var arr = Array.isArray(json) ? json : (json.words || json.items || []);
        arr.forEach(function (item) {
          var de = item.de || item.german || item.word || "";
          var ru = item.ru || item.russian || item.translation || "";
          var cat = item.category || item.categoryName || "";
          if (de && ru) {
            parsedImportItems.push({ de: String(de).trim(), ru: String(ru).trim(), categoryName: String(cat).trim() });
          }
        });
      } catch (err) {}
    }

    // If not JSON, parse line by line (CSV / TSV / Anki)
    if (parsedImportItems.length === 0) {
      var lines = text.split(/\r?\n/);
      lines.forEach(function (line) {
        line = line.trim();
        if (!line || line.startsWith("#") || line.toLowerCase().startsWith("немецкий;")) return; // skip headers/comments

        var parts = [];
        if (line.indexOf("\t") !== -1) {
          parts = line.split("\t");
        } else if (line.indexOf(";") !== -1) {
          parts = line.split(";");
        } else if (line.indexOf(",") !== -1) {
          parts = line.split(",");
        }

        if (parts.length >= 2) {
          var de = parts[0].replace(/^["']|["']$/g, "").trim();
          var ru = parts[1].replace(/^["']|["']$/g, "").trim();
          var cat = parts[2] ? parts[2].replace(/^["']|["']$/g, "").trim() : "";
          if (de && ru) {
            parsedImportItems.push({ de: de, ru: ru, categoryName: cat });
          }
        }
      });
    }

    // Update preview
    if (parsedImportItems.length > 0) {
      importPreviewBox.style.display = "block";
      importPreviewCount.textContent = parsedImportItems.length + " слов";
      confirmImportBtn.disabled = false;

      var previewRows = parsedImportItems.slice(0, 25);
      var html = "";
      previewRows.forEach(function (item) {
        html += '<tr style="border-bottom: 1px solid var(--border);">';
        html += '  <td style="padding: 4px 8px; font-weight: 500;">' + item.de + '</td>';
        html += '  <td style="padding: 4px 8px;">' + item.ru + '</td>';
        html += '  <td style="padding: 4px 8px; color: var(--text-secondary);">' + (item.categoryName || "(из настроек)") + '</td>';
        html += '</tr>';
      });
      if (parsedImportItems.length > 25) {
        html += '<tr><td colspan="3" style="padding: 6px 8px; text-align: center; color: var(--text-secondary);">… и ещё ' + (parsedImportItems.length - 25) + ' слов</td></tr>';
      }
      importPreviewTbody.innerHTML = html;
    } else {
      importPreviewBox.style.display = "block";
      importPreviewCount.textContent = "0 слов";
      importPreviewTbody.innerHTML = '<tr><td colspan="3" style="padding: 12px; text-align: center; color: var(--danger);">Не удалось распознать слова. Проверьте формат.</td></tr>';
      confirmImportBtn.disabled = true;
    }
  }

  if (parseImportBtn) parseImportBtn.addEventListener("click", parseImportData);
  if (importTextInput) importTextInput.addEventListener("input", function () { confirmImportBtn.disabled = true; });

  if (confirmImportBtn) {
    confirmImportBtn.addEventListener("click", function () {
      if (parsedImportItems.length === 0) return;

      var defaultCatId = importTargetCat.value || null;
      var skipDuplicates = importSkipDupCb ? importSkipDupCb.checked : true;

      confirmImportBtn.disabled = true;
      confirmImportBtn.textContent = "Загрузка…";

      api("/api/words/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: parsedImportItems,
          defaultCategoryId: defaultCatId,
          skipDuplicates: skipDuplicates
        })
      }).then(function (res) {
        alert("Импорт завершён!\n\n" +
              "• Успешно импортировано: " + res.importedCount + " слов\n" +
              "• Пропущено дубликатов: " + res.skippedCount + "\n" +
              "• Создано новых категорий: " + res.categoriesCreated);
        importModal.classList.add("hidden");
        loadCategories();
      }).catch(function (e) {
        alert("Ошибка импорта: " + e.message);
      }).finally(function () {
        confirmImportBtn.disabled = false;
        confirmImportBtn.textContent = "Импортировать";
      });
    });
  }

  loadCategories();
})();
