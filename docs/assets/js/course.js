// Course detail page: ?id=K001 renders from ../data/courses.json
(function () {
  var params = new URLSearchParams(window.location.search);
  var id = (params.get("id") || "").trim();
  var box = document.getElementById("course-detail");
  if (!box) return;
  var lang = document.documentElement.lang || "ru";
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  fetch("../data/courses.json").then(function (r) { return r.json(); }).then(function (courses) {
    var c = courses.find(function (x) { return x.id === id; }) || courses[0];
    if (!c) { box.innerHTML = "<p>Курс не найден.</p>"; return; }
    var t = (c.title && (c.title[lang] || c.title.ru)) || "";
    var sessions = (c.sessions || []).map(function (s) {
      var rows = [];
      if (s.hours) rows.push("<div><b>Часы / ЗЕ:</b> " + esc(s.hours) + "</div>");
      if (s.dates) rows.push('<div class="dates">' + esc(s.dates).replace(/\n/g, "<br>") + "</div>");
      if (s.teacher) rows.push("<div><b>Преподаватель:</b> " + esc(s.teacher).split("\n")[0] + "</div>");
      if (s.desc) rows.push("<div>" + esc(s.desc).replace(/\n/g, "<br>") + "</div>");
      var price = s.price ? '<div class="price">' + esc(s.price) + "</div>" : "";
      return '<div class="session"><h4>' + esc(s.title || t) + " <span class='meta'>[" + esc(s.kind || "") + "]</span></h4>" + rows.join("") + price + "</div>";
    }).join("");
    box.innerHTML = "<h1>" + esc(t) + "</h1>"
      + '<div class="course-meta"><span class="badge format">' + esc(c.format) + '</span><span class="meta">' + c.sessions.length + " sessions</span></div>"
      + sessions;
  }).catch(function () {
    box.innerHTML = "<p>Не удалось загрузить программу. Попробуйте позже.</p>";
  });
})();
