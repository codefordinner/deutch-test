/**
 * Admin Panel UI Helpers: Toasts, Modals, Confirm Dialogs
 */
import { escapeHtml } from "./admin-utils.js";

const toastContainer = document.getElementById("toast-container");
const confirmModal = document.getElementById("confirm-modal");
const confirmModalTitle = document.getElementById("confirm-modal-title");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmModalCancelBtn = document.getElementById("confirm-modal-cancel-btn");
const confirmModalOkBtn = document.getElementById("confirm-modal-ok-btn");

const categoryModal = document.getElementById("category-modal");
const categoryModalTitle = document.getElementById("category-modal-title");
const categoryModalLabel = document.getElementById("category-modal-label");
const categoryModalInput = document.getElementById("category-modal-input");
const categoryModalCancelBtn = document.getElementById("category-modal-cancel-btn");
const categoryModalSaveBtn = document.getElementById("category-modal-save-btn");

export function showToast(message, type = "info", duration = 3500) {
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
    <button type="button" class="toast-close" title="Закрыть" aria-label="Закрыть">✕</button>
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
export function showConfirmDialog(title, message, okText = "Подтвердить", isDanger = true) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalOkBtn.textContent = okText;
    confirmModalOkBtn.className = isDanger ? "danger-btn" : "";
    openModal(confirmModal);
  });
}

confirmModalCancelBtn?.addEventListener("click", () => {
  closeModal(confirmModal);
  if (confirmResolve) confirmResolve(false);
});

confirmModalOkBtn?.addEventListener("click", () => {
  closeModal(confirmModal);
  if (confirmResolve) confirmResolve(true);
});

let promptResolve = null;
export function showCategoryModal(title, label, defaultValue = "", placeholder = "") {
  return new Promise((resolve) => {
    promptResolve = resolve;
    categoryModalTitle.textContent = title;
    categoryModalLabel.textContent = label;
    categoryModalInput.value = defaultValue;
    categoryModalInput.placeholder = placeholder;
    openModal(categoryModal);
    setTimeout(() => categoryModalInput.focus(), 50);
  });
}

categoryModalCancelBtn?.addEventListener("click", () => {
  closeModal(categoryModal);
  if (promptResolve) promptResolve(null);
});

categoryModalSaveBtn?.addEventListener("click", () => {
  const val = categoryModalInput.value.trim();
  if (!val) {
    showToast("Пожалуйста, введите название", "error");
    categoryModalInput.focus();
    return;
  }
  closeModal(categoryModal);
  if (promptResolve) promptResolve(val);
});

categoryModalInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    categoryModalSaveBtn.click();
  } else if (e.key === "Escape") {
    categoryModalCancelBtn.click();
  }
});

export function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

export function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("hidden");
  // Check if any other modal is open
  const anyOpen = document.querySelector(".modal-overlay:not(.hidden)");
  if (!anyOpen) {
    document.body.classList.remove("modal-open");
  }
}

// Global overlays setup
export function initModalListeners() {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
        if (overlay === confirmModal && confirmResolve) confirmResolve(false);
        if (overlay === categoryModal && promptResolve) promptResolve(null);
      }
    });

    const closeBtn = overlay.querySelector(".js-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(overlay);
        if (overlay === confirmModal && confirmResolve) confirmResolve(false);
        if (overlay === categoryModal && promptResolve) promptResolve(null);
      });
    }
  });

  // Global ESC key to close topmost modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openOverlays = Array.from(document.querySelectorAll(".modal-overlay:not(.hidden)"));
      if (openOverlays.length > 0) {
        const topOverlay = openOverlays[openOverlays.length - 1];
        closeModal(topOverlay);
        if (topOverlay === confirmModal && confirmResolve) confirmResolve(false);
        if (topOverlay === categoryModal && promptResolve) promptResolve(null);
      }
    }
  });
}
