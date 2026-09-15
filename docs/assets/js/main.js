// Doctrine shared JS: burger menu + schedule filters + footer year
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
  // schedule filters: data-filter buttons + cards with data-fmt / data-kind
  var fbtns = document.querySelectorAll("[data-filter]");
  if (fbtns.length) {
    fbtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        fbtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var f = btn.getAttribute("data-filter");
        document.querySelectorAll("[data-fmt]").forEach(function (card) {
          var show = (f === "all") || (card.getAttribute("data-fmt") === f);
          card.style.display = show ? "" : "none";
        });
      });
    });
  }
})();
