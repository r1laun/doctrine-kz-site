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
  // schedule filters
  var fbtns = document.querySelectorAll("[data-filter]");
  var search = document.getElementById("courseSearch");
  var count = document.getElementById("courseCount");
  var LS_KEY = "doctrine_sched_filter";
  function readState() {
    var st = {fmt: "all", q: ""};
    try {
      var p = new URLSearchParams(window.location.search);
      if (p.get("fmt")) st.fmt = p.get("fmt");
      if (p.get("q")) st.q = p.get("q");
      else {
        var ls = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        if (!p.get("fmt") && ls.fmt) st.fmt = ls.fmt;
        if (ls.q) st.q = ls.q;
      }
    } catch (e) { /* ignore */ }
    return st;
  }
  function norm(s) {
    return (s || "").toLowerCase().replace(/ё/g, "е");
  }
  if (fbtns.length) {
    var state = readState();
    var activeFmt = (state.fmt === "online" || state.fmt === "offline") ? state.fmt : "all";
    if (search && state.q) search.value = state.q;
    fbtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-filter") === activeFmt);
    });
    function save() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({fmt: activeFmt, q: search ? search.value : ""}));
        var url = new URL(window.location.href);
        if (activeFmt === "all") url.searchParams.delete("fmt");
        else url.searchParams.set("fmt", activeFmt);
        if (search && search.value) url.searchParams.set("q", search.value);
        else url.searchParams.delete("q");
        history.replaceState(null, "", url.toString());
      } catch (e) { /* ignore */ }
    }
    function apply(persist) {
      var q = norm(search && search.value);
      var shown = 0, total = 0;
      document.querySelectorAll("[data-fmt]").forEach(function (card) {
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
    fbtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        fbtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFmt = btn.getAttribute("data-filter");
        apply(true);
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
  }
})();
