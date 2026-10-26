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
    ru: {done: "Завершён", next: "Следующий поток →"},
    kk: {done: "Аяқталды", next: "Келесі ағын →"},
    en: {done: "Finished", next: "Next intake →"}
  }[archLang] || {done: "Завершён", next: "Следующий поток →"};
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
    var badges = card.querySelector(".badges");
    if (badges && !badges.querySelector(".badge-past")) {
      var b = document.createElement("span");
      b.className = "badge badge-past";
      b.textContent = archL.done;
      badges.insertBefore(b, badges.firstChild);
    }
    var btn = card.querySelector('a.btn-primary[data-course-enroll], a.btn-primary[href*="forms.gle"]');
    if (btn) {
      btn.textContent = archL.next;
      btn.removeAttribute("data-course-enroll");
      if (waHref) {
        btn.setAttribute("href", waHref);
        btn.setAttribute("target", "_blank");
      }
    }
  }
  (function runArchive() {
    var today = todayStamp();
    if (!today) return;
    // schedule page: move newly-past cards into the archive grid
    // (old-catalog cards are prerendered there by build.py)
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
    // home page "upcoming": only mark, keep in place
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
    var activeFmt = (state.fmt === "online" || state.fmt === "offline") ? state.fmt : "all";
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
      var scope = grid || document;
      scope.querySelectorAll("[data-fmt]").forEach(function (card) {
        total++;
        var okFmt = (activeFmt === "all") || (card.getAttribute("data-fmt") === activeFmt);
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
      if (!grid) { if (persist) save(); return; }
      var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-fmt]"));
      cards.sort(function (a, b) {
        var ta = tsOf(a), tb = tsOf(b);
        if (!ta && !tb) return 0;
        if (!ta) return 1;
        if (!tb) return -1;
        return (sortOrder === "old") ? (ta < tb ? -1 : 1) : (ta > tb ? -1 : 1);
      });
      cards.forEach(function (c) { grid.appendChild(c); });
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
  // highlight "Cabinet" nav item when doctor is signed in + 1-click enroll from schedule/course cards
  var cabLabels = {
    ru: {
      inApps: "В моих заявках · Кабинет →",
      paid: "Оплачено · Открыть в кабинете →",
      toastTitle: "Заявка добавлена в личный кабинет ✓",
      toastSub: "Вы можете проконсультироваться или перейти к оплате в кабинете.",
      toastBtn: "Открыть кабинет →"
    },
    kk: {
      inApps: "Өтінімдерде · Кабинет →",
      paid: "Төленді · Кабинетті ашу →",
      toastTitle: "Өтінім жеке кабинетке қосылды ✓",
      toastSub: "Кабинетте кеңес алуға немесе төлемге өтуге болады.",
      toastBtn: "Кабинетті ашу →"
    },
    en: {
      inApps: "In applications · Account →",
      paid: "Paid · Open in account →",
      toastTitle: "Application added to your account ✓",
      toastSub: "You can consult or proceed to payment in your account.",
      toastBtn: "Open account →"
    }
  }[archLang] || {};

  var FB_REST = "https://doctrine-1ebe5-default-rtdb.europe-west1.firebasedatabase.app";

  function showEnrollToast() {
    var existing = document.getElementById("doctrineEnrollToast");
    if (existing) existing.remove();
    var div = document.createElement("div");
    div.id = "doctrineEnrollToast";
    div.className = "enroll-toast";
    div.innerHTML = '<div><b>' + cabLabels.toastTitle + '</b><span>' + cabLabels.toastSub + '</span></div>'
      + '<a class="btn btn-primary btn-sm" href="cabinet.html">' + cabLabels.toastBtn + "</a>";
    document.body.appendChild(div);
    setTimeout(function () { if (div.parentNode) div.remove(); }, 6500);
  }

  window.syncDoctrineEnrollButtons = function () {
    try {
      var u = JSON.parse(localStorage.getItem("doctrine_cabinet_user") || "null");
      var map = (u && u.enrollments) || {};
      document.querySelectorAll("[data-course-enroll]").forEach(function (btn) {
        var cid = btn.getAttribute("data-course-enroll");
        var rec = cid && map[cid];
        if (rec) {
          var isPaid = (rec.status === "paid" || rec.status === "completed");
          btn.textContent = isPaid ? cabLabels.paid : cabLabels.inApps;
          btn.setAttribute("href", "cabinet.html");
          btn.classList.add("is-enrolled-link");
        }
      });
    } catch (e) { /* ignore */ }
  };

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest("[data-course-enroll]") : null;
    if (!btn) return;
    var cid = btn.getAttribute("data-course-enroll");
    if (!cid) return;
    var u = null;
    try { u = JSON.parse(localStorage.getItem("doctrine_cabinet_user") || "null"); } catch (err) { u = null; }
    // If not signed in, let link navigate to cabinet.html?enroll=ID (auto-enrolls after login/reg)
    if (!u || !u.uid) return;
    u.enrollments = u.enrollments || {};
    if (u.enrollments[cid]) return; // already enrolled -> normal navigation to cabinet.html

    e.preventDefault();
    var cTitle = btn.getAttribute("data-course-title") || cid;
    var cDates = btn.getAttribute("data-course-dates") || "";
    var cPrice = btn.getAttribute("data-course-price") || "";
    var cFmt = btn.getAttribute("data-course-fmt") || "online";
    var now = Date.now();
    var entry = {
      courseId: cid,
      title: cTitle,
      dates: cDates,
      price: cPrice,
      format: cFmt,
      status: "applied",
      createdAt: now
    };
    u.enrollments[cid] = entry;
    u.updatedAt = now;
    try {
      localStorage.setItem("doctrine_cabinet_user", JSON.stringify(u));
      var dbLocal = JSON.parse(localStorage.getItem("doctrine_cabinet_db") || "{}");
      dbLocal.users = dbLocal.users || {};
      dbLocal.users[u.uid] = u;
      localStorage.setItem("doctrine_cabinet_db", JSON.stringify(dbLocal));
    } catch (err) { /* ignore */ }

    // Sync to Firebase RTDB via REST so it works on any page without loading Firebase SDK
    try {
      fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(u.uid) + "/enrollments/" + encodeURIComponent(cid) + ".json", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(entry)
      });
      fetch(FB_REST + "/cabinetApplications/" + encodeURIComponent(u.uid + "_" + cid) + ".json", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          id: u.uid + "_" + cid,
          uid: u.uid,
          name: u.name || "",
          phone: u.phone || "",
          email: u.email || "",
          specialty: u.specialty || "",
          city: u.city || "",
          courseId: cid,
          courseTitle: cTitle,
          price: cPrice,
          status: "applied",
          createdAt: now
        })
      });
    } catch (err) { /* ignore */ }

    window.syncDoctrineEnrollButtons();
    showEnrollToast();
  });

  window.updateDoctrineCabinetNav = function () {
    try {
      var u = JSON.parse(localStorage.getItem("doctrine_cabinet_user") || "null");
      document.querySelectorAll('a[href="cabinet.html"]').forEach(function (a) {
        if (!a.hasAttribute("data-course-enroll")) {
          a.classList.toggle("has-user", !!(u && u.uid));
        }
      });
      window.syncDoctrineEnrollButtons();
    } catch (e) { /* ignore */ }
  };
  window.updateDoctrineCabinetNav();
})();
