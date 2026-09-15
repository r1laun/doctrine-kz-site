// Teacher modal: cards with [data-teacher] open a dialog with full profile
(function () {
  var modal = document.getElementById("teacherModal");
  var body = document.getElementById("teacherModalBody");
  if (!modal || !body) return;
  var lang = document.documentElement.lang || "ru";
  var L = {
    ru: {exp: "Стаж", work: "Место работы", about: "О преподавателе", fail: "Не удалось загрузить профиль."},
    kk: {exp: "Өтіл", work: "Жұмыс орны", about: "Оқытушы туралы", fail: "Профиль жүктелмеді."},
    en: {exp: "Experience", work: "Workplace", about: "About", fail: "Failed to load the profile."}
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
        var info = "";
        if (t.exp) info += '<div class="t-info-item"><small>' + esc(L.exp) + "</small><span>" + esc(t.exp) + "</span></div>";
        if (t.work) info += '<div class="t-info-item"><small>' + esc(L.work) + "</small><span>" + esc(t.work) + "</span></div>";
        var paras = String(t.about || "").split("\n").filter(function (p) { return p.trim(); })
          .map(function (p, i) {
            var txt = esc(p);
            // numbered "1. Кто я" style headings become bold lead-ins
            var m = txt.match(/^(\d+\.\s+.+)$/);
            if (m && txt.length < 80) return '<p><b>' + txt + "</b></p>";
            return "<p>" + txt + "</p>";
          }).join("");
        body.innerHTML = '<div class="t-modal-hero"><div class="t-modal-hero-inner">'
          + '<img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '">'
          + '<div class="t-modal-hero-text"><h2>' + esc(t.name) + "</h2>"
          + (t.spec ? '<span class="t-spec-pill">' + esc(t.spec) + "</span>" : "")
          + "</div></div></div>"
          + '<div class="t-modal-body">'
          + (info ? '<div class="t-info">' + info + "</div>" : "")
          + (paras ? '<h3 class="t-about-title">' + esc(L.about) + '</h3><div class="t-about-text">' + paras + "</div>" : "")
          + "</div>";
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
