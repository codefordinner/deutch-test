(function () {
  try {
    localStorage.removeItem("german-trainer-theme");
  } catch (e) {}
  document.documentElement.setAttribute("data-theme", "dark");
})();
