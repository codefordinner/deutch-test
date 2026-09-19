/**
 * German Trainer - Main Application Entry Point (ES Module)
 */
import { WordsTrainer } from "./words-trainer.js";
import { VerbsTrainer } from "./verbs-trainer.js";
import { NumbersTrainer } from "./numbers-trainer.js";
import { TimeTrainer } from "./time-trainer.js";
import { safeGetItem, safeSetItem } from "./utils.js";

const TAB_KEY = "german-trainer-tab";
const UMLAUT_KEY = "german-trainer-show-umlauts";

// ==================== TABS MANAGEMENT ====================
function initTabs() {
  function activateTab(tabName) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const panel = document.getElementById(`panel-${tabName}`);
    if (!btn || !panel) return;

    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.remove("active");
    });
    panel.classList.add("active");
    safeSetItem(TAB_KEY, tabName);
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      activateTab(tab);
    });
  });

  const savedTab = safeGetItem(TAB_KEY, null);
  if (savedTab) activateTab(savedTab);
}

// ==================== MODALS & UMLAUTS ====================
function initModals() {
  function openModal(modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    const firstFocusable = modal.querySelector("input, button, select");
    firstFocusable?.focus();
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll(".settings-trigger").forEach((btn) => {
    const modalId = btn.getAttribute("data-modal");
    const modal = document.getElementById(modalId);
    if (!modal) return;
    btn.addEventListener("click", () => openModal(modal));
  });

  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
    modal.querySelectorAll(".js-modal-close").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(modal));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay:not(.hidden)").forEach((modal) => {
        closeModal(modal);
      });
    }
  });

  function applyShowUmlauts(show) {
    document.querySelectorAll(".umlauts").forEach((el) => {
      el.style.display = show ? "flex" : "none";
    });
    document.querySelectorAll(".umlaut-toggle-cb").forEach((cb) => {
      cb.checked = show;
    });
  }

  const showUmlauts = safeGetItem(UMLAUT_KEY, true);
  applyShowUmlauts(showUmlauts);

  document.querySelectorAll(".umlaut-toggle-cb").forEach((cb) => {
    cb.addEventListener("change", () => {
      safeSetItem(UMLAUT_KEY, cb.checked);
      applyShowUmlauts(cb.checked);
    });
  });
}

// ==================== UMLAUT BUTTONS ====================
function initUmlautButtons() {
  document.querySelectorAll(".umlaut-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const char = btn.getAttribute("data-char") || "";
      const start = input.selectionStart != null ? input.selectionStart : input.value.length;
      const end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
      const val = input.value;

      input.value = val.slice(0, start) + char + val.slice(end);
      const newPos = start + char.length;
      input.focus();
      input.setSelectionRange(newPos, newPos);
    });
  });
}

// ==================== APPLICATION BOOTSTRAP ====================
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initModals();
  initUmlautButtons();

  const wordsTrainer = new WordsTrainer();
  const verbsTrainer = new VerbsTrainer();
  const numbersTrainer = new NumbersTrainer();
  const timeTrainer = new TimeTrainer();

  // Expose on window for accessibility and developer ergonomics
  window.trainerApp = {
    words: wordsTrainer,
    verbs: verbsTrainer,
    numbers: numbersTrainer,
    time: timeTrainer
  };
});
