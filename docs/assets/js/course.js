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
  function pick(v) {
    if (v && typeof v === "object") return v[lang] || v.ru || "";
    return v || "";
  }
  function trHours(text) {
    if (lang === "ru" || !text) return text || "";
    var t = String(text);
    if (lang === "kk") return t.replace(/часов|часа|ч\./g, "сағ.");
    t = t.replace(/часов|часа|ч\./g, "h").replace(/ЗЕ/g, "credits");
    return t.replace(/(\d),(\d)/g, "$1.$2");
  }
  function trDates(text) {
    if (lang === "ru" || !text) return text || "";
    return String(text).split("\n").map(function (ln) {
      var n = ln.toLowerCase().replace(/ё/g, "е");
      if (n.indexOf("по мере") !== -1) return lang === "kk" ? "Топ құрылуына қарай" : "As the group forms";
      if (n.indexOf("курс в записи") !== -1) return lang === "kk" ? "Жазбадағы курс" : "Recorded course";
      return ln;
    }).join("\n");
  }
  var TEACHER_LINE = {
    "Азим Саида Юсуфовна,": {"kk": "Азим Саида Юсуфовна", "en": "Азим Саида Юсуфовна"},
    "Хахазова Карлыгаш Болатовна,": {"kk": "Хахазова Карлыгаш Болатовна", "en": "Хахазова Карлыгаш Болатовна"},
    "Алиева Гузель РахматовнаВрач кардиолог высшей категории, функциональной диагностики, специалист по Холтеровскому мониторированию, включая пациентов с имлантируемыми устройствами": {"kk": "Алиева Гузель Рахматовна, жоғары санатты кардиолог, функционалдық диагностика дәрігері, имплантацияланған құрылғылары бар пациенттерді қоса алғанда, холтерлік мониторинг маманы", "en": "Алиева Гузель Рахматовна, cardiologist of the highest category, functional diagnostics physician, specialist in Holter monitoring, including patients with implantable devices"},
    "Лещинская-Попова Инна Евгеньевна, врач-кардиолог, магистр медицинских наук, основатель центра Doctrine, педагог с почти 20 летним стажем, обладатель Курмет Грамотасы МЗРК (2016 г), врач-блогер16": {"kk": "Лещинская-Попова Инна Евгеньевна, кардиолог дәрігер, медицина ғылымдарының магистрі, Doctrine орталығының негізін қалаушы, 20 жылға жуық өтілі бар педагог, ҚР ДСМ Құрмет грамотасының иегері (2016 ж), дәрігер-блогер16", "en": "Лещинская-Попова Инна Евгеньевна, cardiologist, Master of Medical Sciences, founder of the Doctrine Center, educator with almost 20 years of experience, holder of the Certificate of Honor of the Ministry of Health of the Republic of Kazakhstan (2016), physician-blogger16"},
    "Лещинская Елена Евгеньевна - нейрологопед, дефектолог, специалист по сенсорной интеграции. Педагог высшей категории. Кандидат в магистры психологии": {"kk": "Лещинская Елена Евгеньевна - нейрологопед, дефектолог, сенсорлық интеграция маманы. Жоғары санатты педагог. Психология магистріне кандидат", "en": "Лещинская Елена Евгеньевна - neuro speech-language therapist, defectologist, sensory integration specialist. Teacher of the highest category. Candidate for a Master's degree in Psychology"}
  };
  function trTeacherLine(line) {
    var hit = TEACHER_LINE[line];
    if (hit) return hit[lang] || line;
    return line.replace(/[,;]+$/, "");
  }
  fetch("../data/courses.json").then(function (r) { return r.json(); }).then(function (courses) {
    var c = courses.find(function (x) { return x.id === id; }) || courses[0];
    if (!c) { box.innerHTML = "<p>" + esc(L.notfound) + "</p>"; return; }
    var t = (c.title && (c.title[lang] || c.title.ru)) || "";
    // merge consecutive day-sessions of the same conduct into one block,
    // so dates list together and the price shows once for the whole course
    var groups = [];
    (c.sessions || []).forEach(function (s) {
      var key = [s.title, s.kind, s.hours, s.teacher, s.desc, s.price, s.module_price].join("\x00");
      var g = (groups.length && groups[groups.length - 1].key === key) ? groups[groups.length - 1] : null;
      if (!g) { g = {key: key, s: s, dates: []}; groups.push(g); }
      if (s.dates) g.dates.push(s.dates);
    });
    var sessions = groups.map(function (g) {
      var s = g.s;
      var desc = pick(s.desc);
      var rows = [];
      if (s.hours) rows.push("<div><b>" + esc(L.hours) + ":</b> " + esc(trHours(s.hours)) + "</div>");
      if (g.dates.length) rows.push('<div class="dates">' + g.dates.map(function (d) { return esc(trDates(d)); }).join("<br>") + "</div>");
      if (s.teacher) rows.push("<div><b>" + esc(L.teacher) + ":</b> " + esc(trTeacherLine(String(s.teacher).split("\n")[0].trim())) + "</div>");
      if (desc) rows.push("<div>" + esc(desc).replace(/\n/g, "<br>") + "</div>");
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
      if (c.archived || (!openEnded && maxTs && maxTs < todayTs)) {
        var banner = document.createElement("div");
        banner.className = "past-banner";
        var reallyPast = !openEnded && maxTs && maxTs < todayTs;
        banner.innerHTML = "<b>" + esc(L.doneT) + "</b>" + (reallyPast ? esc(L.doneT2) : "");
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
