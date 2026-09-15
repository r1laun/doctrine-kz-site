// Teacher modal: cards with [data-teacher] open a dialog with full profile
(function () {
  var modal = document.getElementById("teacherModal");
  var body = document.getElementById("teacherModalBody");
  if (!modal || !body) return;
  var lang = document.documentElement.lang || "ru";
  var L = {
    ru: {exp: "Стаж", work: "Место работы", fail: "Не удалось загрузить профиль."},
    kk: {exp: "Өтіл", work: "Жұмыс орны", fail: "Профиль жүктелмеді."},
    en: {exp: "Experience", work: "Workplace", fail: "Failed to load the profile."}
  }[lang] || {};
  var cache = null;
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function data() {
    if (cache) return Promise.resolve(cache);
    return fetch("../data/teachers.json").then(function (r) { return r.json(); }).then(function (t) {
      cache = t; return t;
    });
  }
  function open(id) {
    data().then(function (teachers) {
      var t = null;
      for (var i = 0; i < teachers.length; i++) {
        if (String(teachers[i].id) === String(id)) { t = teachers[i]; break; }
      }
      if (!t) { body.innerHTML = "<p>" + esc(L.fail) + "</p>"; }
      else {
        var rows = "";
        if (t.exp) rows += '<p class="meta"><b>' + esc(L.exp) + ":</b> " + esc(t.exp) + "</p>";
        if (t.work) rows += '<p class="meta"><b>' + esc(L.work) + ":</b> " + esc(t.work) + "</p>";
        var paras = String(t.about || "").split("\n").filter(function (p) { return p.trim(); })
          .map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
        body.innerHTML = '<div class="t-modal-top"><img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '">'
          + '<div><h2>' + esc(t.name) + "</h2>"
          + (t.spec ? '<p class="meta">' + esc(t.spec) + "</p>" : "") + rows + "</div></div>"
          + '<div class="t-modal-body">' + paras + "</div>";
      }
      modal.hidden = false;
      document.body.classList.add("t-modal-open");
      var c = modal.querySelector(".t-modal-close");
      if (c) c.focus();
    }).catch(function () {
      body.innerHTML = "<p>" + esc(L.fail) + "</p>";
      modal.hidden = false;
      document.body.classList.add("t-modal-open");
    });
  }
  function close() {
    modal.hidden = true;
    document.body.classList.remove("t-modal-open");
  }
  document.querySelectorAll("[data-teacher]").forEach(function (card) {
    card.addEventListener("click", function () { open(card.getAttribute("data-teacher")); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(card.getAttribute("data-teacher")); }
    });
  });
  modal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();
