// Открытие/закрытие модалок с настройками (по кнопке "⚙ Параметры" в каждой
// вкладке) + общий переключатель "показывать кнопки умляутов", который
// одинаково действует на обеих вкладках и запоминается в этом браузере.
(function () {
  var UMLAUT_KEY = "german-trainer-show-umlauts";

  function openModal(modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    var firstFocusable = modal.querySelector("input, button, select");
    if (firstFocusable) firstFocusable.focus();
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll(".settings-trigger").forEach(function (btn) {
    var modal = document.getElementById(btn.getAttribute("data-modal"));
    if (!modal) return;
    btn.addEventListener("click", function () { openModal(modal); });
  });

  document.querySelectorAll(".modal-overlay").forEach(function (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal(modal);
    });
    modal.querySelectorAll(".js-modal-close").forEach(function (btn) {
      btn.addEventListener("click", function () { closeModal(modal); });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal-overlay:not(.hidden)").forEach(function (modal) {
      closeModal(modal);
    });
  });

  // ---- показывать/скрывать кнопки умляутов на обеих вкладках ----

  function loadShowUmlauts() {
    try {
      var raw = localStorage.getItem(UMLAUT_KEY);
      return raw === null ? true : raw === "1";
    } catch (e) {
      return true;
    }
  }

  function applyShowUmlauts(show) {
    document.querySelectorAll(".umlauts").forEach(function (el) {
      el.style.display = show ? "flex" : "none";
    });
    document.querySelectorAll(".umlaut-toggle-cb").forEach(function (cb) {
      cb.checked = show;
    });
  }

  function saveShowUmlauts(show) {
    try {
      localStorage.setItem(UMLAUT_KEY, show ? "1" : "0");
    } catch (e) {
      // недоступно — не критично
    }
  }

  var initialShow = loadShowUmlauts();
  applyShowUmlauts(initialShow);

  document.querySelectorAll(".umlaut-toggle-cb").forEach(function (cb) {
    cb.addEventListener("change", function () {
      applyShowUmlauts(cb.checked);
      saveShowUmlauts(cb.checked);
    });
  });
})();
