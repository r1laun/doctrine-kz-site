// Doctrine shared JS: burger menu + schedule filters (format + search + count,
// persisted in URL + localStorage) + footer year + lang-link query carry-over
(function () {
  var burger = document.getElementById("burgerBtn");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && e.target !== burger && !burger.contains(e.target)) {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
  // keep ?id=... when switching language on the course page
  if (window.location.search) {
    document.querySelectorAll("a[data-langlink]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href && href.indexOf("course.html") !== -1 && href.indexOf("?") === -1) {
        a.setAttribute("href", href + window.location.search);
      }
    });
  }
  // auto-archive: courses whose latest date passed move to Archive
  // (courses with data-open="1" — rolling intake / recordings — never close)
  var archLang = document.documentElement.lang || "ru";
  var archL = {
    ru: {
      done: "Завершён",
      record: "Доступен в записи",
      buyRecord: "Купить запись",
      waRecordMsg: "Здравствуйте! Хочу приобрести курс «{title}» в записи. Подскажите, пожалуйста, стоимость и как оплатить?",
      brunchBadge: "Офлайн-мероприятие завершено",
      brunchBtn: "О следующем бранче →",
      waBrunchMsg: "Здравствуйте! Когда планируется следующий докторский бранч?",
      stressBadge: "Набор закрыт",
      stressBtn: "В лист ожидания →",
      waStressMsg: "Здравствуйте! Хочу записаться в лист ожидания на следующий поток по нагрузочному тестированию."
    },
    kk: {
      done: "Аяқталды",
      record: "Жазбада қолжетімді",
      buyRecord: "Жазбаны сатып алу",
      waRecordMsg: "Сәлеметсіз бе! «{title}» курсын жазбада сатып алғым келеді. Бағасы мен төлем тәсілін айтып жібересіз бе?",
      brunchBadge: "Офлайн шара аяқталды",
      brunchBtn: "Келесі бранч туралы →",
      waBrunchMsg: "Сәлеметсіз бе! Келесі дәрігерлік бранч қашан жоспарланып отыр?",
      stressBadge: "Қабылдау жабылды",
      stressBtn: "Күту парағына жазылу →",
      waStressMsg: "Сәлеметсіз бе! Жүктемелік тестілеу бойынша келесі ағынның күту парағына жазылғым келеді."
    },
    en: {
      done: "Finished",
      record: "Available on demand",
      buyRecord: "Buy recording",
      waRecordMsg: "Hello! I would like to purchase the recording of the course “{title}”. Could you please provide the price and payment details?",
      brunchBadge: "Offline event ended",
      brunchBtn: "Next brunch info →",
      waBrunchMsg: "Hello! When is the next physician brunch scheduled?",
      stressBadge: "Enrollment closed",
      stressBtn: "Join waitlist →",
      waStressMsg: "Hello! I would like to join the waiting list for the next stress testing intake."
    }
  }[archLang] || {};
  var waLink = document.querySelector('a[href*="wa.me"]');
  var waHref = waLink ? waLink.getAttribute("href") : null;
  function todayStamp() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function isPastCard(card) {
    if (card.hasAttribute("data-open")) return false;
    var ts = parseInt(card.getAttribute("data-ts") || "0", 10);
    return !!ts && ts < todayStamp();
  }
  function markPastCard(card) {
    if (card.classList.contains("is-past")) return;
    card.classList.add("is-past");
    var recSt = card.getAttribute("data-record-status") || "available";
    var badges = card.querySelector(".badges");
    var btn = card.querySelector('a.btn-primary[href*="forms.gle"]');
    var cTitle = card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "";
    var baseWa = (waHref || "https://wa.me/77770357345").split("?")[0];

    if (recSt === "brunch") {
      if (badges && !badges.querySelector(".badge-past")) {
        var b = document.createElement("span");
        b.className = "badge badge-past";
        b.textContent = archL.brunchBadge || "Офлайн-мероприятие завершено";
        badges.insertBefore(b, badges.firstChild);
      }
      if (btn) {
        btn.textContent = archL.brunchBtn || "О следующем бранче →";
        btn.className = "btn btn-ghost";
        btn.setAttribute("href", baseWa + "?text=" + encodeURIComponent(archL.waBrunchMsg || ""));
      }
    } else if (recSt === "stress_test") {
      if (badges && !badges.querySelector(".badge-past")) {
        var b = document.createElement("span");
        b.className = "badge badge-past";
        b.textContent = archL.stressBadge || "Набор закрыт";
        badges.insertBefore(b, badges.firstChild);
      }
      if (btn) {
        btn.textContent = archL.stressBtn || "В лист ожидания →";
        btn.className = "btn btn-ghost";
        btn.setAttribute("href", baseWa + "?text=" + encodeURIComponent(archL.waStressMsg || ""));
      }
    } else {
      card.setAttribute("data-record", "1");
      if (badges && !badges.querySelector(".badge-record")) {
        var b = document.createElement("span");
        b.className = "badge badge-record";
        b.textContent = archL.record || "Доступен в записи";
        badges.insertBefore(b, badges.firstChild);
      }
      if (btn) {
        btn.textContent = archL.buyRecord || "Купить запись";
        btn.classList.add("btn-record");
        var msg = (archL.waRecordMsg || "").replace("{title}", cTitle);
        btn.setAttribute("href", baseWa + "?text=" + encodeURIComponent(msg));
      }
    }
  }
  (function runArchive() {
    var today = todayStamp();
    if (!today) return;
    var archGrid = document.getElementById("archiveGrid");
    var archCount = document.getElementById("archiveCount");
    var schedGrid = document.getElementById("courseGrid");
    if (schedGrid && archGrid) {
      Array.prototype.slice.call(schedGrid.querySelectorAll("[data-fmt]")).forEach(function (card) {
        if (isPastCard(card)) {
          markPastCard(card);
          card.style.display = "";
          archGrid.appendChild(card);
        }
      });
      if (archCount) archCount.textContent = archGrid.querySelectorAll("[data-fmt]").length;
    }
    var popGrid = document.getElementById("popGrid");
    if (popGrid) {
      popGrid.querySelectorAll("[data-fmt]").forEach(function (card) {
        if (isPastCard(card)) markPastCard(card);
      });
    }
  })();
  // conference: the banner is not a course card, so it lives outside the grids
  // (always on top, never filtered/sorted) and hides itself once the date passed
  (function conference() {
    var blocks = document.querySelectorAll("[data-conf-until]");
    if (!blocks.length) return;
    var today = todayStamp();
    var lg = document.documentElement.lang || "ru";
    var waL = {ru: "Написать в WhatsApp", kk: "WhatsApp-қа жазу",
               en: "Message on WhatsApp"}[lg] || "Написать в WhatsApp";
    blocks.forEach(function (el) {
      var until = parseInt(el.getAttribute("data-conf-until") || "", 10);
      if (!until || until >= today) return;
      // on the conference page the banner stays, registration switches to WhatsApp
      if (el.classList.contains("conf-keep")) {
        el.classList.add("is-over");
        var note = el.parentNode ? el.parentNode.querySelector(".conf-past-note") : null;
        if (note) note.style.display = "block";
        el.querySelectorAll(".conf-reg").forEach(function (b) {
          if (waHref) b.setAttribute("href", waHref);
          b.textContent = waL;
          b.classList.remove("btn-primary");
          b.classList.add("btn-ghost");
        });
        return;
      }
      el.style.display = "none";
    });
  })();
  // schedule filters
  var fbtns = document.querySelectorAll("[data-filter]");
  var sbtns = document.querySelectorAll("[data-sort]");
  var grid = document.getElementById("courseGrid");
  var search = document.getElementById("courseSearch");
  var count = document.getElementById("courseCount");
  var LS_KEY = "doctrine_sched_filter";
  function readState() {
    var st = {fmt: "all", q: "", sort: "new"};
    try {
      var p = new URLSearchParams(window.location.search);
      if (p.get("fmt")) st.fmt = p.get("fmt");
      if (p.get("q")) st.q = p.get("q");
      if (p.get("sort")) st.sort = p.get("sort");
      var ls = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (!p.get("fmt") && ls.fmt) st.fmt = ls.fmt;
      if (!p.get("q") && ls.q) st.q = ls.q;
      if (!p.get("sort") && ls.sort) st.sort = ls.sort;
    } catch (e) { /* ignore */ }
    return st;
  }
  function norm(s) {
    return (s || "").toLowerCase().replace(/ё/g, "е");
  }
  if (fbtns.length) {
    var state = readState();
    var activeFmt = (state.fmt === "online" || state.fmt === "offline" || state.fmt === "record") ? state.fmt : "all";
    var sortOrder = (state.sort === "old") ? "old" : "new";
    if (search && state.q) search.value = state.q;
    fbtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-filter") === activeFmt);
    });
    sbtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-sort") === sortOrder);
    });
    function save() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({fmt: activeFmt, q: search ? search.value : "", sort: sortOrder}));
        var url = new URL(window.location.href);
        if (activeFmt === "all") url.searchParams.delete("fmt");
        else url.searchParams.set("fmt", activeFmt);
        if (search && search.value) url.searchParams.set("q", search.value);
        else url.searchParams.delete("q");
        if (sortOrder === "new") url.searchParams.delete("sort");
        else url.searchParams.set("sort", sortOrder);
        history.replaceState(null, "", url.toString());
      } catch (e) { /* ignore */ }
    }
    function apply(persist) {
      var q = norm(search && search.value);
      var shown = 0, total = 0;
      var scope = document.getElementById("scheduleRoot") || document.querySelector("main") || document;
      scope.querySelectorAll("[data-fmt]").forEach(function (card) {
        total++;
        var okFmt = true;
        if (activeFmt === "online" || activeFmt === "offline") {
          okFmt = (card.getAttribute("data-fmt") === activeFmt);
        } else if (activeFmt === "record") {
          okFmt = card.hasAttribute("data-record") || (card.getAttribute("data-record-status") === "available" && card.classList.contains("is-past"));
        }
        var okQ = !q || norm(card.textContent).indexOf(q) !== -1;
        var show = okFmt && okQ;
        card.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (count) count.textContent = shown + " / " + total;
      if (persist) save();
    }
    function tsOf(card) {
      return card.getAttribute("data-ts") || "";
    }
    function applySort(persist) {
      [grid, document.getElementById("archiveGrid")].forEach(function (targetGrid) {
        if (!targetGrid) return;
        var cards = Array.prototype.slice.call(targetGrid.querySelectorAll("[data-fmt]"));
        cards.sort(function (a, b) {
          var ta = tsOf(a), tb = tsOf(b);
          if (!ta && !tb) return 0;
          if (!ta) return 1;
          if (!tb) return -1;
          return (sortOrder === "old") ? (ta < tb ? -1 : 1) : (ta > tb ? -1 : 1);
        });
        cards.forEach(function (c) { targetGrid.appendChild(c); });
      });
      if (persist) save();
    }
    fbtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        fbtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFmt = btn.getAttribute("data-filter");
        apply(true);
      });
    });
    sbtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        sbtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        sortOrder = btn.getAttribute("data-sort");
        applySort(true);
      });
    });
    if (search) {
      var t = null;
      search.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { apply(true); }, 200);
        apply(false);
      });
    }
    apply(false);
    applySort(false);
  }
  // highlight "Cabinet" nav item when doctor is signed in
  window.updateDoctrineCabinetNav = function () {
    try {
      var u = JSON.parse(localStorage.getItem("doctrine_cabinet_user") || "null");
      document.querySelectorAll('a[href="cabinet.html"]').forEach(function (a) {
        a.classList.toggle("has-user", !!(u && u.uid));
      });
    } catch (e) { /* ignore */ }
  };
  window.updateDoctrineCabinetNav();
})();
