// Live reviews: read + write the centre's Firebase (same DB as the original
// site). A submitted review appears on the site instantly. Baked-in
// window.DOCTRINE_REVIEWS is the instant first paint + offline fallback.
(function () {
  var form = document.getElementById("reviewForm");
  var grid = form ? form.parentElement.querySelector(".grid-3") : null;
  if (!form || !grid) return;
  var lang = document.documentElement.lang || "ru";
  var L = {
    ru: {sent: "Спасибо! Ваш отзыв опубликован.", fail: "Не удалось отправить. Проверьте интернет и попробуйте ещё раз."},
    kk: {sent: "Рахмет! Пікіріңіз жарияланды.", fail: "Жіберілмеді. Интернетті тексеріп, қайта көріңіз."},
    en: {sent: "Thank you! Your review is published.", fail: "Failed to send. Check your connection and try again."}
  }[lang] || {};

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function card(r) {
    var initial = esc((r.name || "?").trim().charAt(0).toUpperCase());
    var who = '<div class="review-person"><span class="review-ava">' + initial + "</span><span><b>"
      + esc(r.name || "-") + "</b>";
    if (r.course) who += "<small>" + esc(r.course) + "</small>";
    who += "</span></div>";
    return '<div class="card review-card"><div class="card-body">'
      + '<div class="review-stars">★★★★★</div>'
      + '<p class="review-text">“' + esc(r.text) + "”</p>" + who + "</div></div>";
  }
  function key(r) { return (r.date || 0) + "|" + (r.text || ""); }
  function render(items) {
    var seen = {}, list = [];
    items.forEach(function (r) {
      if (!r.text || !r.text.trim()) return;
      var k = key(r);
      if (!seen[k]) { seen[k] = 1; list.push(r); }
    });
    list.sort(function (a, b) { return (b.date || 0) - (a.date || 0); });
    grid.innerHTML = list.slice(0, 12).map(card).join("");
  }

  var db = null;
  try {
    if (window.firebase && window.DOCTRINE_FB) {
      if (!window.firebase.apps.length) window.firebase.initializeApp(window.DOCTRINE_FB);
      db = window.firebase.database();
    }
  } catch (e) { db = null; }

  var baked = window.DOCTRINE_REVIEWS || [];
  render(baked);

  if (db) {
    db.ref("mainReviews").on("value", function (snap) {
      var val = snap.val() || {};
      var live = Object.keys(val).map(function (k) { return val[k]; });
      render(live.concat(baked));
    });
  }

  var msg = document.createElement("p");
  msg.className = "meta";
  msg.style.display = "none";
  form.appendChild(msg);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (form.name.value || "").trim().slice(0, 80);
    var course = (form.course.value || "").trim().slice(0, 120);
    var text = (form.text.value || "").trim().slice(0, 1000);
    if (!name || !text) return;
    var item = {name: name, course: course, text: text, date: Date.now()};
    msg.style.display = "none";
    if (!db) { msg.textContent = L.fail; msg.style.display = ""; return; }
    db.ref("mainReviews").push(item, function (err) {
      if (err) { msg.textContent = L.fail; msg.style.display = ""; return; }
      form.reset();
      msg.textContent = L.sent;
      msg.style.display = "";
      setTimeout(function () { msg.style.display = "none"; }, 5000);
    });
  });
})();
