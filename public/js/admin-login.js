(function () {
  var input = document.getElementById("password-input");
  var btn = document.getElementById("login-btn");
  var feedback = document.getElementById("login-feedback");

  function submit() {
    var password = input.value;
    if (!password) return;
    feedback.textContent = "";
    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    })
      .then(function (r) {
        if (r.ok) {
          window.location.href = "/admin.html";
        } else {
          return r.json().then(function (err) {
            feedback.textContent = err.error || "Неверный пароль";
            feedback.style.color = "var(--danger)";
          });
        }
      })
      .catch(function () {
        feedback.textContent = "Не удалось связаться с сервером";
        feedback.style.color = "var(--danger)";
      });
  }

  btn.addEventListener("click", submit);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
  input.focus();
})();
