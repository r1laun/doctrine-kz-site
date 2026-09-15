// Review form: no backend — compose a WhatsApp message to the centre.
// The review is published on the site after moderation.
(function () {
  var form = document.getElementById("reviewForm");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (form.name.value || "").trim();
    var course = (form.course.value || "").trim();
    var text = (form.text.value || "").trim();
    if (!name || !text) return;
    var msg = "Отзыв с сайта Doctrine\nИмя: " + name
      + (course ? "\nКурс: " + course : "")
      + "\nТекст: " + text;
    var wa = window.DOCTRINE_WA || "https://wa.me/77770357345";
    window.open(wa + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    form.reset();
  });
})();
