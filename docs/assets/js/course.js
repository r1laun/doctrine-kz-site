// Course detail page: ?id=K001 renders from ../data/courses.json
(function () {
  var params = new URLSearchParams(window.location.search);
  var id = (params.get("id") || "").trim();
  var box = document.getElementById("course-detail");
  if (!box) return;
  var lang = document.documentElement.lang || "ru";
  var L = {
    ru: {hours: "Часы / ЗЕ", teacher: "Преподаватель", online: "Онлайн", offline: "Офлайн", notfound: "Курс не найден.", fail: "Не удалось загрузить программу. Попробуйте позже.", doneT: "Набор завершён", doneT2: "Все даты этого курса прошли. Напишите нам в WhatsApp — подскажем следующий поток.", next: "Следующий поток"},
    kk: {hours: "Сағат / ЗЕ", teacher: "Оқытушы", online: "Онлайн", offline: "Офлайн", notfound: "Курс табылмады.", fail: "Бағдарлама жүктелмеді. Кейінірек көріңіз.", doneT: "Қабылдау аяқталды", doneT2: "Бұл курстың барлық күндері өтті. WhatsApp-қа жазыңыз — келесі ағынды айтамыз.", next: "Келесі ағын"},
    en: {hours: "Hours / credits", teacher: "Teacher", online: "Online", offline: "Offline", notfound: "Course not found.", fail: "Failed to load the program. Please try later.", doneT: "Enrollment closed", doneT2: "All dates of this course have passed. Message us on WhatsApp for the next intake.", next: "Next intake"}
  }[lang] || {};
  function sessWord(n) {
    if (lang === "ru") {
      var a = Math.abs(n) % 100, d = a % 10;
      if (a >= 11 && a <= 19) return "занятий";
      if (d === 1) return "занятие";
      if (d >= 2 && d <= 4) return "занятия";
      return "занятий";
    }
    return lang === "kk" ? "сабақ" : "sessions";
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  fetch("../data/courses.json").then(function (r) { return r.json(); }).then(function (courses) {
    var c = courses.find(function (x) { return x.id === id; }) || courses[0];
    if (!c) { box.innerHTML = "<p>" + esc(L.notfound) + "</p>"; return; }
    var t = (c.title && (c.title[lang] || c.title.ru)) || "";
    var sessions = (c.sessions || []).map(function (s) {
      var rows = [];
      if (s.hours) rows.push("<div><b>" + esc(L.hours) + ":</b> " + esc(s.hours) + "</div>");
      if (s.dates) rows.push('<div class="dates">' + esc(s.dates).replace(/\n/g, "<br>") + "</div>");
      if (s.teacher) rows.push("<div><b>" + esc(L.teacher) + ":</b> " + esc(s.teacher).split("\n")[0] + "</div>");
      if (s.desc) rows.push("<div>" + esc(s.desc).replace(/\n/g, "<br>") + "</div>");
      var price = s.price ? '<div class="price">' + esc(s.price) + "</div>" : "";
      return '<div class="session"><h4>' + esc(s.title || t) + " <span class='meta'>[" + esc(s.kind || "") + "]</span></h4>" + rows.join("") + price + "</div>";
    }).join("");
    var n = (c.sessions || []).length;
    box.innerHTML = "<h1>" + esc(t) + "</h1>"
      + '<div class="course-meta"><span class="badge format ' + (c.format === "offline" ? "fmt-offline" : "fmt-online") + '">' + esc(c.format === "offline" ? L.offline : L.online) + "</span>"
      + (n > 1 ? '<span class="meta">' + n + " " + sessWord(n) + "</span>" : "") + "</div>"
      + sessions;
    // past course? all dates passed and no rolling intake -> banner + WhatsApp instead of enroll
    try {
      var maxTs = 0, openEnded = false;
      (c.sessions || []).forEach(function (s) {
        var blob = String(s.dates || "").toLowerCase().replace(/ё/g, "е");
        if (blob.indexOf("по мере") !== -1 || blob.indexOf("запис") !== -1) openEnded = true;
        var re = /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/g, m;
        while ((m = re.exec(blob)) !== null) {
          var yy = parseInt(m[3], 10);
          if (yy < 100) yy += 2000;
          maxTs = Math.max(maxTs, yy * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[1], 10));
        }
      });
      var dn = new Date();
      var todayTs = dn.getFullYear() * 10000 + (dn.getMonth() + 1) * 100 + dn.getDate();
      if (!openEnded && maxTs && maxTs < todayTs) {
        var banner = document.createElement("div");
        banner.className = "past-banner";
        banner.innerHTML = "<b>" + esc(L.doneT) + "</b>" + esc(L.doneT2);
        box.insertBefore(banner, box.firstChild.nextSibling);
        var wa = document.querySelector('a[href*="wa.me"]');
        if (wa) {
          document.querySelectorAll('a.btn-primary[href*="forms.gle"]').forEach(function (a) {
            a.textContent = L.next;
            a.setAttribute("href", wa.getAttribute("href"));
          });
        }
      }
    } catch (e) { /* ignore */ }
  }).catch(function () {
    box.innerHTML = "<p>" + esc(L.fail) + "</p>";
  });
})();
