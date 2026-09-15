// Doctrine shared JS: burger menu + schedule filters (format + search + count) + footer year
(function () {
  var burger = document.getElementById("burgerBtn");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") nav.classList.remove("open");
    });
  }
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
  // schedule filters
  var fbtns = document.querySelectorAll("[data-filter]");
  var search = document.getElementById("courseSearch");
  var count = document.getElementById("courseCount");
  var activeFmt = "all";
  function norm(s) {
    return (s || "").toLowerCase().replace(/ё/g, "е");
  }
  function apply() {
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
  }
  if (fbtns.length) {
    fbtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        fbtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFmt = btn.getAttribute("data-filter");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    apply();
  }
})();
