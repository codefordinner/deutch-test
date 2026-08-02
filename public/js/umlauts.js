document.querySelectorAll(".umlaut-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var targetId = btn.getAttribute("data-target");
    var input = document.getElementById(targetId);
    var char = btn.getAttribute("data-char");
    var start = input.selectionStart != null ? input.selectionStart : input.value.length;
    var end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
    var val = input.value;
    input.value = val.slice(0, start) + char + val.slice(end);
    var newPos = start + char.length;
    input.focus();
    input.setSelectionRange(newPos, newPos);
  });
});
