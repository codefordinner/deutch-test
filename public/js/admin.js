(function () {
  var container = document.getElementById("categories-container");

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

  function loadCategories() {
    api("/api/categories").then(renderCategories).catch(function (e) {
      container.innerHTML = "";
      var p = document.createElement("p");
      p.className = "empty-note";
      p.textContent = "Не удалось загрузить: " + e.message;
      container.appendChild(p);
    });
  }

  function renderCategories(categories) {
    container.innerHTML = "";
    if (categories.length === 0) {
      var p = document.createElement("p");
      p.className = "empty-note";
      p.textContent = "Категорий пока нет. Добавь первую выше.";
      container.appendChild(p);
      return;
    }
    categories.forEach(function (cat) {
      container.appendChild(buildCategoryBlock(cat));
    });
  }

  function buildCategoryBlock(cat) {
    var block = document.createElement("div");
    block.className = "admin-section category-block";

    // header row: name + rename + delete
    var titleRow = document.createElement("div");
    titleRow.className = "category-title-row";

    var h3 = document.createElement("h3");
    h3.textContent = cat.name + " (" + cat.words.length + ")";
    titleRow.appendChild(h3);

    var btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "6px";

    var renameBtn = document.createElement("button");
    renameBtn.className = "small-btn ghost-btn";
    renameBtn.textContent = "Переименовать";
    renameBtn.addEventListener("click", function () {
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

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn danger-btn";
    deleteBtn.textContent = "Удалить категорию";
    deleteBtn.addEventListener("click", function () {
      if (!confirm('Удалить категорию "' + cat.name + '" вместе со всеми словами?')) return;
      api("/api/categories/" + cat.id, { method: "DELETE" })
        .then(loadCategories)
        .catch(function (e) { alert(e.message); });
    });

    btnGroup.appendChild(renameBtn);
    btnGroup.appendChild(deleteBtn);
    titleRow.appendChild(btnGroup);
    block.appendChild(titleRow);

    // add word form
    var addForm = document.createElement("div");
    addForm.className = "inline-form";

    var deInput = document.createElement("input");
    deInput.type = "text";
    deInput.placeholder = "по-немецки";

    var ruInput = document.createElement("input");
    ruInput.type = "text";
    ruInput.placeholder = "перевод";

    var addWordBtn = document.createElement("button");
    addWordBtn.textContent = "Добавить слово";
    addWordBtn.addEventListener("click", function () {
      var de = deInput.value.trim();
      var ru = ruInput.value.trim();
      if (!de || !ru) { alert("Заполни оба поля"); return; }
      api("/api/categories/" + cat.id + "/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ de: de, ru: ru })
      }).then(loadCategories).catch(function (e) { alert(e.message); });
    });

    addForm.appendChild(deInput);
    addForm.appendChild(ruInput);
    addForm.appendChild(addWordBtn);
    block.appendChild(addForm);

    // words table
    if (cat.words.length > 0) {
      var table = document.createElement("table");
      var thead = document.createElement("thead");
      thead.innerHTML = "<tr><th>Немецкий</th><th>Перевод</th><th></th></tr>";
      table.appendChild(thead);

      var tbody = document.createElement("tbody");
      cat.words.forEach(function (word) {
        tbody.appendChild(buildWordRow(word));
      });
      table.appendChild(tbody);
      block.appendChild(table);
    } else {
      var emptyP = document.createElement("p");
      emptyP.className = "empty-note";
      emptyP.textContent = "В этой категории пока нет слов.";
      block.appendChild(emptyP);
    }

    return block;
  }

  function buildWordRow(word) {
    var tr = document.createElement("tr");

    var deTd = document.createElement("td");
    var ruTd = document.createElement("td");
    var actionsTd = document.createElement("td");

    deTd.textContent = word.de;
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

  document.getElementById("add-category-btn").addEventListener("click", function () {
    var input = document.getElementById("new-category-name");
    var name = input.value.trim();
    if (!name) { alert("Введи название категории"); return; }
    api("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name })
    }).then(function () {
      input.value = "";
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
