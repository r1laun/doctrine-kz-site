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
    var btn = card.querySelector('a.btn-primary[href*="forms.gle"]');
    if (btn) {
      btn.textContent = archL.next;
      if (waHref) btn.setAttribute("href", waHref);
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
})();
