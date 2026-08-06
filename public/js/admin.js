(function () {
  var categories = [];
  var selectedCategoryId = null;

  var categorySelect = document.getElementById("category-select");
  var pickerSection = document.getElementById("category-picker-section");
  var noCategoriesNote = document.getElementById("no-categories-note");
  var detailSection = document.getElementById("category-detail-section");
  var filterInput = document.getElementById("word-filter-input");
  var wordsTable = document.getElementById("words-table");
  var wordsTbody = document.getElementById("words-tbody");
  var wordsEmptyNote = document.getElementById("words-empty-note");

  function api(url, options) {
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
    return categories.find(function (c) { return c.id === selectedCategoryId; });
  }

  function loadCategories() {
    api("/api/categories").then(function (data) {
      categories = data;
      if (categories.length === 0) {
        selectedCategoryId = null;
      } else if (!selectedCategoryId || !categories.some(function (c) { return c.id === selectedCategoryId; })) {
        selectedCategoryId = categories[0].id;
      }
      renderCategorySelect();
      renderCategoryDetail();
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
    categories.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name + " (" + cat.words.length + ")";
      if (cat.id === selectedCategoryId) opt.selected = true;
      categorySelect.appendChild(opt);
    });
  }

  function renderCategoryDetail() {
    var cat = currentCategory();
    if (!cat) {
      detailSection.style.display = "none";
      return;
    }
    detailSection.style.display = "block";
    renderWordsTable();
  }

  function renderWordsTable() {
    var cat = currentCategory();
    wordsTbody.innerHTML = "";
    if (!cat) return;

    if (cat.words.length === 0) {
      wordsTable.style.display = "none";
      wordsEmptyNote.style.display = "block";
      wordsEmptyNote.textContent = "В этой категории пока нет слов.";
      return;
    }

    var filterVal = filterInput.value.trim().toLowerCase();
    var visibleWords = cat.words.filter(function (w) {
      if (!filterVal) return true;
      return w.de.toLowerCase().indexOf(filterVal) !== -1 || w.ru.toLowerCase().indexOf(filterVal) !== -1;
    });

    wordsTable.style.display = "table";
    if (visibleWords.length === 0) {
      wordsEmptyNote.style.display = "block";
      wordsEmptyNote.textContent = "Ничего не найдено по запросу «" + filterInput.value.trim() + "».";
    } else {
      wordsEmptyNote.style.display = "none";
    }

    visibleWords.forEach(function (word) {
      wordsTbody.appendChild(buildWordRow(word));
    });
  }

  function formatGermanGender(text) {
    if (!text || typeof text !== "string") return text || "";
    var safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safe.replace(/\b(der|die|das)\b/gi, function (match) {
      var lower = match.toLowerCase();
      return '<span class="gender-' + lower + '">' + match + '</span>';
    });
  }

  function buildWordRow(word) {
    var tr = document.createElement("tr");

    var deTd = document.createElement("td");
    var ruTd = document.createElement("td");
    var actionsTd = document.createElement("td");

    deTd.innerHTML = formatGermanGender(word.de);
    ruTd.textContent = word.ru;

    var editBtn = document.createElement("button");
    editBtn.className = "small-btn ghost-btn";
    editBtn.textContent = "Изменить";
    editBtn.style.marginRight = "6px";
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

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn danger-btn";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", function () {
      if (!confirm('Удалить слово "' + word.de + '"?')) return;
      api("/api/words/" + word.id, { method: "DELETE" })
        .then(loadCategories)
        .catch(function (e) { alert(e.message); });
    });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(deTd);
    tr.appendChild(ruTd);
    tr.appendChild(actionsTd);
    return tr;
  }

  // ---- category picker controls ----

  categorySelect.addEventListener("change", function () {
    selectedCategoryId = categorySelect.value;
    filterInput.value = "";
    renderCategoryDetail();
  });

  document.getElementById("rename-category-btn").addEventListener("click", function () {
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

  document.getElementById("delete-category-btn").addEventListener("click", function () {
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

  filterInput.addEventListener("input", renderWordsTable);

  // ---- add word to currently selected category ----

  document.getElementById("add-word-btn").addEventListener("click", function () {
    var cat = currentCategory();
    if (!cat) return;
    var deInput = document.getElementById("new-word-de");
    var ruInput = document.getElementById("new-word-ru");
    var de = deInput.value.trim();
    var ru = ruInput.value.trim();
    if (!de || !ru) { alert("Заполни оба поля"); return; }
    api("/api/categories/" + cat.id + "/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ de: de, ru: ru })
    }).then(function () {
      deInput.value = "";
      ruInput.value = "";
      loadCategories();
    }).catch(function (e) { alert(e.message); });
  });

  // ---- new category ----

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

  loadCategories();
})();
