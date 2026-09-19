/**
 * Admin Panel Import & Export Controller
 */
import { AdminApi } from "./admin-api.js";
import { store } from "./admin-state.js";
import { escapeHtml, downloadBlob } from "./admin-utils.js";
import { showToast } from "./admin-ui.js";

export function initIOController() {
  const confirmExportBtn = document.getElementById("confirm-export-btn");
  const exportScopeSelect = document.getElementById("export-scope-select");

  const importFileInput = document.getElementById("import-file-input");
  const importTextInput = document.getElementById("import-text-input");
  const parseImportBtn = document.getElementById("parse-import-btn");
  const confirmImportBtn = document.getElementById("confirm-import-btn");
  const importPreviewBox = document.getElementById("import-preview-box");
  const importPreviewCount = document.getElementById("import-preview-count");
  const importPreviewTbody = document.getElementById("import-preview-tbody");
  const importTargetCat = document.getElementById("import-target-cat");
  const importSkipDupCb = document.getElementById("import-skip-dup-cb");

  let parsedImportWords = [];

  // Export
  confirmExportBtn?.addEventListener("click", async () => {
    const format = document.querySelector('input[name="export-format"]:checked')?.value || "csv";
    const scope = exportScopeSelect?.value || "all";

    let wordsToExport = [];
    let filename = "deutsch-words";

    if (scope === "all") {
      wordsToExport = store.allWordsCache.length > 0 ? store.allWordsCache : await AdminApi.getAllWords();
      filename += "-all";
    } else {
      const cat = await AdminApi.getCategory(scope);
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
        const catObj = store.categories.find((c) => c.id === w.categoryId) || w.category;
        const catName = catObj?.name || "";
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
        const catObj = store.categories.find((c) => c.id === w.categoryId) || w.category;
        let front = escapeHtml(w.de);
        if (w.plural) front += `<br><small>мн.ч: ${escapeHtml(w.plural)}</small>`;
        let back = escapeHtml(w.ru);
        if (w.feminine) back += `<br><small>ж.р: ${escapeHtml(w.feminine)}</small>`;
        if (w.femininePlural) back += `<br><small>мн.ж: ${escapeHtml(w.femininePlural)}</small>`;
        const cat = catObj?.name || "Deutsch";
        content += `${front}\t${back}\t${cat}\n`;
      });
      filename += "-anki.tsv";
      mimeType = "text/tab-separated-values;charset=utf-8";
    }

    downloadBlob(content, filename, mimeType);
    showToast(`Экспортировано ${wordsToExport.length} слов!`, "success");
  });

  // File drag / select
  importFileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (importTextInput) importTextInput.value = ev.target.result;
      parseImportContent();
    };
    reader.readAsText(file);
  });

  parseImportBtn?.addEventListener("click", () => parseImportContent());

  function parseImportContent() {
    const text = (importTextInput?.value || "").trim();
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

        let delimiter = ";";
        if (l.includes("\t")) delimiter = "\t";
        else if (l.includes(";") && !l.includes("\t")) delimiter = ";";
        else if (l.includes(",") && !l.includes(";")) delimiter = ",";

        const parts = l.split(delimiter).map((p) => p.replace(/^["']|["']$/g, "").trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
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
      if (confirmImportBtn) confirmImportBtn.disabled = true;
      if (importPreviewBox) importPreviewBox.style.display = "none";
      return;
    }

    if (importPreviewCount) importPreviewCount.textContent = `${parsedImportWords.length} слов`;
    if (importPreviewTbody) {
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
    }

    if (importPreviewBox) importPreviewBox.style.display = "block";
    if (confirmImportBtn) confirmImportBtn.disabled = false;
    showToast(`Распознано ${parsedImportWords.length} слов. Готово к импорту!`, "success");
  }

  confirmImportBtn?.addEventListener("click", async () => {
    if (parsedImportWords.length === 0) return;

    const targetCatId = importTargetCat?.value;
    const skipDup = importSkipDupCb?.checked;

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
          const isDup = store.allWordsCache.some((cw) => (cw.de || "").toLowerCase().trim() === w.de.toLowerCase().trim());
          if (isDup) {
            skippedCount++;
            continue;
          }
        }

        await AdminApi.createWord({
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
      if (importTextInput) importTextInput.value = "";
      if (importFileInput) importFileInput.value = "";
      if (importPreviewBox) importPreviewBox.style.display = "none";
      parsedImportWords = [];
      confirmImportBtn.textContent = "Импортировать";
      await store.loadInitialData();
    } catch (err) {
      showToast("Ошибка импорта: " + err.message, "error");
      confirmImportBtn.disabled = false;
      confirmImportBtn.textContent = "Импортировать";
    }
  });
}
