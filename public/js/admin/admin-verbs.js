/**
 * Admin Panel Verbs Controller
 */
import { AdminApi } from "./admin-api.js";
import { store } from "./admin-state.js";
import { escapeHtml } from "./admin-utils.js";
import { showToast, showConfirmDialog, openModal, closeModal } from "./admin-ui.js";
import { KNOWN_VERBS_DICT, conjugateRegularVerb, getVerbForms, isVerbWord, classifyVerbType } from "./admin-verbs-data.js";

export function initVerbsController() {
  // DOM Elements
  const verbsTbody = document.getElementById("verbs-tbody");
  const verbsEmptyNote = document.getElementById("verbs-empty-note");

  const verbsCountTotal = document.getElementById("verbs-count-total");
  const verbsCountIrregular = document.getElementById("verbs-count-irregular");
  const verbsCountRegular = document.getElementById("verbs-count-regular");

  const vfilterCountAll = document.getElementById("vfilter-count-all");
  const vfilterCountIrreg = document.getElementById("vfilter-count-irreg");
  const vfilterCountReg = document.getElementById("vfilter-count-reg");

  const verbFilterTabs = document.querySelectorAll(".verb-filter-tab");
  const verbFilterInput = document.getElementById("verb-filter-input");
  const clearVerbSearchBtn = document.getElementById("clear-verb-search-btn");

  const selectAllVerbsCb = document.getElementById("select-all-verbs") || document.getElementById("select-all-verbs-cb");
  const verbsBatchActionsBar = document.getElementById("verbs-batch-actions-bar");
  const verbsSelectedCount = document.getElementById("verbs-selected-count");
  const verbsBatchDeleteBtn = document.getElementById("verbs-batch-delete-btn");
  const verbsBatchCancelBtn = document.getElementById("verbs-batch-cancel-btn");

  const openAddVerbBtn = document.getElementById("open-add-verb-btn");
  const verbModal = document.getElementById("verb-modal");
  const verbModalTitle = document.getElementById("verb-modal-title");
  const verbModalType = document.getElementById("verb-modal-type");
  const verbModalCategory = document.getElementById("verb-modal-category");
  const verbModalDe = document.getElementById("verb-modal-de");
  const verbModalRu = document.getElementById("verb-modal-ru");
  const verbModalPraesens = document.getElementById("verb-modal-praesens");
  const verbModalPraeteritum = document.getElementById("verb-modal-praeteritum");
  const verbModalHilfsverb = document.getElementById("verb-modal-hilfsverb");
  const verbModalPartizip2 = document.getElementById("verb-modal-partizip2");
  const verbModalAutofillBtn = document.getElementById("verb-modal-autofill-btn");
  const verbModalVowelNote = document.getElementById("verb-modal-vowel-note");
  const verbModalDupBanner = document.getElementById("verb-modal-dup-banner");
  const verbModalCancelBtn = document.getElementById("verb-modal-cancel-btn");
  const verbModalSaveBtn = document.getElementById("verb-modal-save-btn");

  const vpreviewIch = document.getElementById("vpreview-ich");
  const vpreviewDu = document.getElementById("vpreview-du");
  const vpreviewEr = document.getElementById("vpreview-er");
  const vpreviewWir = document.getElementById("vpreview-wir");
  const vpreviewIhr = document.getElementById("vpreview-ihr");
  const vpreviewSie = document.getElementById("vpreview-sie");

  let userManuallyToggledType = false;

  store.subscribe("verbs:refresh", () => {
    refreshVerbsData();
  });

  function refreshVerbsData() {
    store.allVerbs = (store.allWordsCache || []).filter(isVerbWord).map((w) => {
      const vtype = classifyVerbType(w);
      const computed = getVerbForms(w.de, w.praesens, w.praeteritum, w.partizip2, w.hilfsverb, vtype === "regular");
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

    store.allVerbs.sort((a, b) => (a.de || "").localeCompare(b.de || "", "de"));

    const irregularCount = store.allVerbs.filter((v) => v.vtype === "irregular").length;
    const regularCount = store.allVerbs.length - irregularCount;

    if (verbsCountTotal) verbsCountTotal.textContent = store.allVerbs.length;
    if (verbsCountIrregular) verbsCountIrregular.textContent = irregularCount;
    if (verbsCountRegular) verbsCountRegular.textContent = regularCount;

    if (vfilterCountAll) vfilterCountAll.textContent = store.allVerbs.length;
    if (vfilterCountIrreg) vfilterCountIrreg.textContent = irregularCount;
    if (vfilterCountReg) vfilterCountReg.textContent = regularCount;

    renderVerbsTable();
  }

  function renderVerbsTable() {
    if (!verbsTbody) return;
    verbsTbody.innerHTML = "";

    const search = store.currentVerbSearch.trim().toLowerCase();
    const filtered = store.allVerbs.filter((v) => {
      if (store.currentVerbFilter === "irregular" && v.vtype !== "irregular") return false;
      if (store.currentVerbFilter === "regular" && v.vtype !== "regular") return false;

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
      const isSelected = store.selectedVerbIds.has(v.id);
      const isIrreg = v.vtype === "irregular";
      const badge = isIrreg
        ? '<span class="badge-irreg">⚡ Неправильный</span>'
        : '<span class="badge-reg">📘 Обычный</span>';

      const auxTag = v.computedHilfsverb === "sein"
        ? '<span class="vform-tag" style="color: #2563eb; font-weight: 600;">ist</span>'
        : '<span class="vform-tag" style="color: #d97706; font-weight: 600;">hat</span>';

      const catObj = store.categories.find((c) => c.id === v.categoryId);
      const catName = catObj ? catObj.name : "Без категории";

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
            <button type="button" class="small-btn edit-verb-btn" title="Редактировать глагол" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">✏️</button>
            <button type="button" class="small-btn danger-btn delete-verb-btn" title="Удалить глагол" style="padding: 4px 8px; font-size: 12px; border-radius: 6px;">🗑️</button>
          </div>
        </td>
      `;

      // Checkbox
      tr.querySelector(".verb-row-cb").addEventListener("change", (e) => {
        if (e.target.checked) store.selectedVerbIds.add(v.id);
        else store.selectedVerbIds.delete(v.id);
        updateVerbsBatchActionsBar();
      });

      // Edit
      tr.querySelector(".edit-verb-btn").addEventListener("click", () => {
        openEditVerbModal(v);
      });

      // Delete
      tr.querySelector(".delete-verb-btn").addEventListener("click", async () => {
        const confirmed = await showConfirmDialog(
          "Удаление глагола",
          `Вы действительно хотите удалить глагол «${v.de}» (${v.ru})?`
        );
        if (!confirmed) return;

        try {
          await AdminApi.deleteWord(v.id);
          showToast(`Глагол «${v.de}» удалён`, "success");
          store.selectedVerbIds.delete(v.id);
          await store.loadInitialData();
        } catch (err) {
          showToast("Ошибка при удалении: " + err.message, "error");
        }
      });

      verbsTbody.appendChild(tr);
    });

    if (selectAllVerbsCb) {
      selectAllVerbsCb.checked = filtered.length > 0 && filtered.every((v) => store.selectedVerbIds.has(v.id));
    }
  }

  function updateVerbsBatchActionsBar() {
    if (!verbsBatchActionsBar || !verbsSelectedCount) return;
    const count = store.selectedVerbIds.size;
    if (count > 0) {
      verbsBatchActionsBar.style.display = "flex";
      verbsSelectedCount.textContent = count;
    } else {
      verbsBatchActionsBar.style.display = "none";
    }
  }

  // Filter tabs
  verbFilterTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      verbFilterTabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      store.currentVerbFilter = btn.dataset.verbFilter || "all";
      renderVerbsTable();
    });
  });

  // Search input
  if (verbFilterInput) {
    verbFilterInput.addEventListener("input", () => {
      store.currentVerbSearch = verbFilterInput.value;
      if (clearVerbSearchBtn) {
        clearVerbSearchBtn.style.display = store.currentVerbSearch ? "block" : "none";
      }
      renderVerbsTable();
    });
  }

  if (clearVerbSearchBtn) {
    clearVerbSearchBtn.addEventListener("click", () => {
      if (verbFilterInput) verbFilterInput.value = "";
      store.currentVerbSearch = "";
      clearVerbSearchBtn.style.display = "none";
      renderVerbsTable();
      if (verbFilterInput) verbFilterInput.focus();
    });
  }

  // Select all checkbox
  if (selectAllVerbsCb) {
    selectAllVerbsCb.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const cbs = verbsTbody.querySelectorAll(".verb-row-cb");
      cbs.forEach((cb) => {
        cb.checked = isChecked;
        const id = cb.dataset.id;
        if (isChecked) store.selectedVerbIds.add(id);
        else store.selectedVerbIds.delete(id);
      });
      updateVerbsBatchActionsBar();
    });
  }

  // Cancel batch
  if (verbsBatchCancelBtn) {
    verbsBatchCancelBtn.addEventListener("click", () => {
      store.selectedVerbIds.clear();
      verbsTbody.querySelectorAll(".verb-row-cb").forEach((cb) => (cb.checked = false));
      if (selectAllVerbsCb) selectAllVerbsCb.checked = false;
      updateVerbsBatchActionsBar();
    });
  }

  // Batch delete
  if (verbsBatchDeleteBtn) {
    verbsBatchDeleteBtn.addEventListener("click", async () => {
      const count = store.selectedVerbIds.size;
      if (count === 0) return;

      const confirmed = await showConfirmDialog(
        "Удаление выбранных глаголов",
        `Вы действительно хотите удалить ${count} выбранных глаголов? Это действие необратимо!`
      );
      if (!confirmed) return;

      try {
        const ids = Array.from(store.selectedVerbIds);
        await AdminApi.batchDeleteWords(ids);
        showToast(`Удалено ${count} глаголов`, "success");
        store.selectedVerbIds.clear();
        updateVerbsBatchActionsBar();
        await store.loadInitialData();
      } catch (err) {
        showToast("Ошибка массового удаления: " + err.message, "error");
      }
    });
  }

  // Modal helpers
  function getVerbCategoryForType(type) {
    const isIrreg = type === "irregular";
    let target = store.categories.find((c) => isIrreg ? c.name.toLowerCase().includes("неправильн") : c.name.toLowerCase().includes("обычн"));
    if (!target) {
      target = store.categories.find((c) => c.name.toLowerCase().includes("глагол"));
    }
    return target ? target.id : (store.categories[0]?.id || "");
  }

  function populateVerbCategorySelect() {
    if (!verbModalCategory) return;
    verbModalCategory.innerHTML = "";
    store.categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      verbModalCategory.appendChild(opt);
    });
  }

  // Add Verb Modal
  if (openAddVerbBtn) {
    openAddVerbBtn.addEventListener("click", () => openAddVerbModal());
  }

  function openAddVerbModal() {
    store.editingVerb = null;
    userManuallyToggledType = false;
    populateVerbCategorySelect();
    if (verbModalDupBanner) verbModalDupBanner.style.display = "none";
    if (verbModalTitle) verbModalTitle.textContent = "Добавление глагола";

    if (verbModalDe) verbModalDe.value = "";
    if (verbModalRu) verbModalRu.value = "";
    if (verbModalType) verbModalType.value = store.currentVerbFilter === "regular" ? "regular" : "irregular";
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
    openModal(verbModal);
    setTimeout(() => verbModalDe?.focus(), 50);
  }

  function openEditVerbModal(v) {
    store.editingVerb = v;
    userManuallyToggledType = true;
    populateVerbCategorySelect();
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
    openModal(verbModal);
    setTimeout(() => verbModalRu?.focus(), 50);
  }

  function updateVerbConjugationPreview(overwriteAll = false) {
    const inf = verbModalDe ? verbModalDe.value.trim() : "";
    const p3 = verbModalPraesens ? verbModalPraesens.value.trim() : "";
    const prat = verbModalPraeteritum ? verbModalPraeteritum.value.trim() : "";
    const p2 = verbModalPartizip2 ? verbModalPartizip2.value.trim() : "";
    const aux = verbModalHilfsverb ? verbModalHilfsverb.value : "haben";
    const forceRegular = verbModalType ? (verbModalType.value === "regular") : false;

    const computed = getVerbForms(inf, p3, prat, p2, aux, forceRegular);
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
        verbModalDe?.focus();
        return;
      }
      autofillVerbFields(inf);
    });
  }

  function regenerateVerbFormsInModal(isRegular) {
    const inf = verbModalDe ? verbModalDe.value.trim() : "";
    if (!inf) return;

    if (isRegular) {
      const reg = conjugateRegularVerb(inf);
      if (reg) {
        if (verbModalPraesens) verbModalPraesens.value = reg.praesens || "";
        if (verbModalPraeteritum) verbModalPraeteritum.value = reg.praeteritum || "";
        if (verbModalHilfsverb) verbModalHilfsverb.value = reg.hilfsverb || "haben";
        if (verbModalPartizip2) verbModalPartizip2.value = reg.partizip2 || "";

        if (vpreviewIch) vpreviewIch.value = reg.forms?.ich || "";
        if (vpreviewDu) vpreviewDu.value = reg.forms?.du || "";
        if (vpreviewEr) vpreviewEr.value = reg.forms?.er || "";
        if (vpreviewWir) vpreviewWir.value = reg.forms?.wir || "";
        if (vpreviewIhr) vpreviewIhr.value = reg.forms?.ihr || "";
        if (vpreviewSie) vpreviewSie.value = reg.forms?.sie || "";
      }
    } else {
      const known = KNOWN_VERBS_DICT[inf.toLowerCase()];
      if (known) {
        if (verbModalPraesens) verbModalPraesens.value = known.praesens || "";
        if (verbModalPraeteritum) verbModalPraeteritum.value = known.praeteritum || "";
        if (verbModalHilfsverb) verbModalHilfsverb.value = known.hilfsverb || "haben";
        if (verbModalPartizip2) verbModalPartizip2.value = known.partizip2 || "";

        if (known.forms) {
          if (vpreviewIch) vpreviewIch.value = known.forms.ich || "";
          if (vpreviewDu) vpreviewDu.value = known.forms.du || "";
          if (vpreviewEr) vpreviewEr.value = known.forms.er || "";
          if (vpreviewWir) vpreviewWir.value = known.forms.wir || "";
          if (vpreviewIhr) vpreviewIhr.value = known.forms.ihr || "";
          if (vpreviewSie) vpreviewSie.value = known.forms.sie || "";
        }
      } else {
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
      }
    }
    updateVerbConjugationPreview(true);
  }

  if (verbModalType) {
    verbModalType.addEventListener("change", () => {
      userManuallyToggledType = true;
      if (verbModalCategory) {
        verbModalCategory.value = getVerbCategoryForType(verbModalType.value);
      }
      regenerateVerbFormsInModal(verbModalType.value === "regular");
    });
  }

  if (verbModalCategory) {
    verbModalCategory.addEventListener("change", () => {
      userManuallyToggledType = true;
      if (verbModalType) {
        if (verbModalCategory.value === "cat_irregular_verbs") {
          verbModalType.value = "irregular";
        } else if (verbModalCategory.value === "cat_regular_verbs") {
          verbModalType.value = "regular";
        }
      }
      regenerateVerbFormsInModal(verbModalType.value === "regular");
    });
  }

  if (verbModalDe) {
    verbModalDe.addEventListener("input", () => {
      if (store.editingVerb) return;
      if (userManuallyToggledType) return;

      const val = verbModalDe.value.trim().toLowerCase();
      if (!val) return;

      const known = KNOWN_VERBS_DICT[val];
      const isIrreg = !!(known && known.isIrregular);
      const targetType = isIrreg ? "irregular" : "regular";

      if (verbModalType && verbModalType.value !== targetType) {
        verbModalType.value = targetType;
        if (verbModalCategory) {
          verbModalCategory.value = getVerbCategoryForType(targetType);
        }
      }
    });
  }

  [verbModalDe, verbModalPraesens, verbModalPraeteritum, verbModalPartizip2, verbModalHilfsverb].filter(Boolean).forEach((el) => {
    el.addEventListener("input", () => updateVerbConjugationPreview(false));
  });

  function checkVerbDuplicate() {
    if (!verbModalDupBanner || !verbModalDe) return;
    const val = verbModalDe.value.trim().toLowerCase();
    if (!val) {
      verbModalDupBanner.style.display = "none";
      return;
    }

    const dup = store.allWordsCache.find((w) => {
      if (store.editingVerb && w.id === store.editingVerb.id) return false;
      return (w.de || "").toLowerCase().trim() === val;
    });

    if (dup) {
      const catObj = store.categories.find((c) => c.id === dup.categoryId);
      const catName = catObj ? catObj.name : "другой категории";
      verbModalDupBanner.textContent = `⚠️ Глагол «${dup.de}» уже есть в категории «${catName}» (перевод: ${dup.ru}).`;
      verbModalDupBanner.style.display = "block";
    } else {
      verbModalDupBanner.style.display = "none";
    }
  }

  verbModalCancelBtn?.addEventListener("click", () => {
    closeModal(verbModal);
    store.editingVerb = null;
  });

  verbModalSaveBtn?.addEventListener("click", async () => {
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
      if (store.editingVerb) {
        await AdminApi.updateWord(store.editingVerb.id, payload);
        showToast(`Глагол «${de}» успешно сохранён!`, "success");
      } else {
        await AdminApi.createWord(payload);
        showToast(`Глагол «${de}» добавлен!`, "success");
      }

      closeModal(verbModal);
      store.editingVerb = null;
      await store.loadInitialData();
    } catch (err) {
      showToast("Ошибка сохранения: " + err.message, "error");
    }
  });

  if (verbModalPraesens && vpreviewEr) {
    verbModalPraesens.addEventListener("input", () => {
      vpreviewEr.value = verbModalPraesens.value;
    });
    vpreviewEr.addEventListener("input", () => {
      verbModalPraesens.value = vpreviewEr.value;
    });
  }

  [verbModalDe, verbModalRu, verbModalPraesens, verbModalPraeteritum, verbModalPartizip2].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (verbModalSaveBtn) verbModalSaveBtn.click();
      }
    });
  });
}
