// Course detail page: ?id=K001 renders from ../data/courses.json
(function () {
  var params = new URLSearchParams(window.location.search);
  var id = (params.get("id") || "").trim();
  var box = document.getElementById("course-detail");
  if (!box) return;
  var lang = document.documentElement.lang || "ru";
  var L = {
    ru: {
      hours: "Часы / ЗЕ",
      teacher: "Преподаватель",
      online: "Онлайн",
      offline: "Офлайн",
      notfound: "Курс не найден.",
      fail: "Не удалось загрузить программу. Попробуйте позже.",
      recordBannerTitle: "Курс доступен в записи",
      recordBannerText: "Все лекции и материалы курса доступны к просмотру. Нажмите «Купить запись» — координатор подскажет детали оплаты и откроет вам персональный доступ к видеозаписям в Личном кабинете врача.",
      buyRecord: "Купить запись",
      waRecordMsg: "Здравствуйте! Хочу приобрести курс «{title}» в записи. Подскажите, пожалуйста, стоимость и как оплатить?",
      brunchBannerTitle: "Офлайн-мероприятие завершено",
      brunchBannerText: "Это очный докторский бранч, запись не предоставляется. Напишите нам в WhatsApp, чтобы первыми узнать о дате следующей встречи.",
      brunchBtn: "О следующем бранче →",
      waBrunchMsg: "Здравствуйте! Когда планируется следующий докторский бранч?",
      stressBannerTitle: "Набор закрыт",
      stressBannerText: "Запись курса в настоящее время не продаётся. Напишите нам в WhatsApp, чтобы записаться в лист ожидания на следующий поток.",
      stressBtn: "В лист ожидания →",
      waStressMsg: "Здравствуйте! Хочу записаться в лист ожидания на следующий поток по нагрузочному тестированию.",
      doneT: "Набор завершён",
      doneT2: "Все даты этого курса прошли. Напишите нам в WhatsApp — подскажем следующий поток.",
      next: "Следующий поток"
    },
    kk: {
      hours: "Сағат / ЗЕ",
      teacher: "Оқытушы",
      online: "Онлайн",
      offline: "Офлайн",
      notfound: "Курс табылмады.",
      fail: "Бағдарлама жүктелмеді. Кейінірек көріңіз.",
      recordBannerTitle: "Курс жазбада қолжетімді",
      recordBannerText: "Курстың барлық дәрістері мен материалдары қарауға қолжетімді. «Жазбаны сатып алу» батырмасын басыңыз — координатор төлем тәсілін айтып, дәрігердің Жеке кабинетінде бейнежазбаларға қолжетімділік ашады.",
      buyRecord: "Жазбаны сатып алу",
      waRecordMsg: "Сәлеметсіз бе! «{title}» курсын жазбада сатып алғым келеді. Бағасы мен төлем тәсілін айтып жібересіз бе?",
      brunchBannerTitle: "Офлайн шара аяқталды",
      brunchBannerText: "Бұл оффлайн докторлық бранч, бейнежазба берілмейді. Келесі кездесу туралы бірінші болып білу үшін WhatsApp-қа жазыңыз.",
      brunchBtn: "Келесі бранч туралы →",
      waBrunchMsg: "Сәлеметсіз бе! Келесі дәрігерлік бранч қашан жоспарланып отыр?",
      stressBannerTitle: "Қабылдау жабылды",
      stressBannerText: "Бұл курстың жазбасы қазіргі уақытта сатылмайды. Келесі ағынның күту парағына жазылу үшін WhatsApp-қа хабарласыңыз.",
      stressBtn: "Күту парағына жазылу →",
      waStressMsg: "Сәлеметсіз бе! Жүктемелік тестілеу бойынша келесі ағынның күту парағына жазылғым келеді.",
      doneT: "Қабылдау аяқталды",
      doneT2: "Бұл курстың барлық күндері өтті. WhatsApp-қа жазыңыз — келесі ағынды айтамыз.",
      next: "Келесі ағын"
    },
    en: {
      hours: "Hours / credits",
      teacher: "Teacher",
      online: "Online",
      offline: "Offline",
      notfound: "Course not found.",
      fail: "Failed to load the program. Please try later.",
      recordBannerTitle: "Course available on demand",
      recordBannerText: "All course lectures and materials are available for viewing. Click \"Buy recording\" — our coordinator will provide payment details and grant personal access to the video recordings in your Physician Account.",
      buyRecord: "Buy recording",
      waRecordMsg: "Hello! I would like to purchase the recording of the course “{title}”. Could you please provide the price and payment details?",
      brunchBannerTitle: "Offline event ended",
      brunchBannerText: "This is an in-person physician brunch; recordings are not provided. Message us on WhatsApp to be the first to know about the next event.",
      brunchBtn: "Next brunch info →",
      waBrunchMsg: "Hello! When is the next physician brunch scheduled?",
      stressBannerTitle: "Enrollment closed",
      stressBannerText: "Recordings for this course are currently not for sale. Message us on WhatsApp to join the waiting list for the next intake.",
      stressBtn: "Join waitlist →",
      waStressMsg: "Hello! I would like to join the waiting list for the next stress testing intake.",
      doneT: "Enrollment closed",
      doneT2: "All dates of this course have passed. Message us on WhatsApp for the next intake.",
      next: "Next intake"
    }
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
  function trTeacher(line) {
    if (lang === "en") return translitLatin(line);
    return line;
  }
  function trTeacherLine(line) {
    var hit = TEACHER_LINE[line];
    if (hit) return hit[lang] || line;
    return line.replace(/[,;]+$/, "");
  }
  var KIND_TR = {
    "kk": {"Обычный": "Әдеттегі", "Модуль": "Модуль", "Модульный": "Модульдік"},
    "en": {"Обычный": "Regular", "Модуль": "Module", "Модульный": "Modular"}
  };
  function trKind(kind) {
    if (lang === "ru" || !kind) return kind || "";
    return (KIND_TR[lang] && KIND_TR[lang][kind]) || kind;
  }
  var TR_TABLE = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya","ә":"a","ғ":"gh","қ":"q","ң":"ng","ө":"o","ұ":"u","ү":"u","һ":"h","і":"i"};
  function translitLatin(s) {
    return String(s || "").split("").map(function (ch) {
      var low = ch.toLowerCase();
      if (TR_TABLE[low] !== undefined) {
        var lat = TR_TABLE[low];
        return (ch !== low) ? lat.charAt(0).toUpperCase() + lat.slice(1) : lat;
      }
      return ch;
    }).join("");
  }
  fetch("../data/courses.json").then(function (r) { return r.json(); }).then(function (courses) {
    var c = courses.find(function (x) { return x.id === id; }) || courses[0];
    if (!c) { box.innerHTML = "<p>" + esc(L.notfound) + "</p>"; return; }
    var t = (c.title && (c.title[lang] || c.title.ru)) || "";
    // merge consecutive day-sessions of the same conduct into one block,
    // so dates list together and the price shows once for the whole course
    var groups = [];
    (c.sessions || []).forEach(function (s) {
      var titleKey = (s.title && s.title.ru) || s.title || "";
      var descKey = (s.desc && s.desc.ru) || s.desc || "";
      var key = [titleKey, s.kind, s.hours, s.teacher, descKey, s.price, s.module_price].join("\x00");
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
      if (s.teacher) rows.push("<div><b>" + esc(L.teacher) + ":</b> " + esc(trTeacher(trTeacherLine(String(s.teacher).split("\n")[0].trim()))) + "</div>");
      if (desc) rows.push("<div>" + esc(desc).replace(/\n/g, "<br>") + "</div>");
      var price = s.price ? '<div class="price">' + esc(s.price) + "</div>" : "";
      return '<div class="session"><h4>' + esc(pick(s.title) || t) + " <span class='meta'>[" + esc(trKind(s.kind)) + "]</span></h4>" + rows.join("") + price + "</div>";
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
      var reallyPast = !openEnded && maxTs && maxTs < todayTs;
      if (c.archived || reallyPast) {
        var banner = document.createElement("div");
        var wa = document.querySelector('a[href*="wa.me"]');
        var baseWa = (wa ? wa.getAttribute("href") : "https://wa.me/77770357345").split("?")[0];
        var recSt = c.record_status || "available";

        if (recSt === "brunch") {
          banner.className = "past-banner";
          banner.innerHTML = "<b>" + esc(L.brunchBannerTitle) + "</b><p>" + esc(L.brunchBannerText) + "</p>";
          if (wa) {
            document.querySelectorAll('a.btn-primary[href*="forms.gle"]').forEach(function (a) {
              a.textContent = L.brunchBtn;
              a.setAttribute("href", baseWa + "?text=" + encodeURIComponent(L.waBrunchMsg));
            });
          }
        } else if (recSt === "stress_test") {
          banner.className = "past-banner";
          banner.innerHTML = "<b>" + esc(L.stressBannerTitle) + "</b><p>" + esc(L.stressBannerText) + "</p>";
          if (wa) {
            document.querySelectorAll('a.btn-primary[href*="forms.gle"]').forEach(function (a) {
              a.textContent = L.stressBtn;
              a.setAttribute("href", baseWa + "?text=" + encodeURIComponent(L.waStressMsg));
            });
          }
        } else {
          banner.className = "past-banner record-banner";
          banner.innerHTML = "<b>" + esc(L.recordBannerTitle) + "</b><p>" + esc(L.recordBannerText) + "</p>";
          if (wa) {
            var msg = L.waRecordMsg.replace("{title}", t);
            document.querySelectorAll('a.btn-primary[href*="forms.gle"]').forEach(function (a) {
              a.textContent = L.buyRecord;
              a.classList.add("btn-record");
              a.setAttribute("href", baseWa + "?text=" + encodeURIComponent(msg));
            });
          }
        }
        box.insertBefore(banner, box.firstChild.nextSibling);
      }
    } catch (e) { /* ignore */ }
  }).catch(function () {
    box.innerHTML = "<p>" + esc(L.fail) + "</p>";
  });
})();
