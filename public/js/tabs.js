(function () {
  var TAB_KEY = "german-trainer-tab";

  function activateTab(tabName) {
    var btn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
    var panel = document.getElementById("panel-" + tabName);
    if (!btn || !panel) return;

    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    document.querySelectorAll(".panel").forEach(function (p) {
      p.classList.remove("active");
    });
    panel.classList.add("active");
    try {
      localStorage.setItem(TAB_KEY, tabName);
    } catch (e) {}
  }

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      activateTab(tab);
    });
  });

  try {
    var savedTab = localStorage.getItem(TAB_KEY);
    if (savedTab) activateTab(savedTab);
  } catch (e) {}
})();
