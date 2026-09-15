// 🔥 отправка отзыва
function sendMainReview() {
  const name = document.getElementById("name").value.trim();
  const course = document.getElementById("course").value.trim();
  const text = document.getElementById("text").value.trim();

  if (!name || !course || !text) {
    alert("Заполните все поля");
    return;
  }

  firebase.database().ref("mainReviews").push({
    name,
    course,
    text,
    date: Date.now()
  });

  document.getElementById("name").value = "";
  document.getElementById("course").value = "";
  document.getElementById("text").value = "";
}

// 🔥 загрузка отзывов
function loadMainReviews() {
  const div = document.getElementById("mainReviews");

  firebase.database().ref("mainReviews").on("value", snap => {
    const data = snap.val();

    div.innerHTML = "";

    if (!data) return;

Object.values(data)
  .sort((a, b) => b.date - a.date)
  .forEach(r => {
    const date = new Date(r.date).toLocaleDateString("ru-RU");

   div.innerHTML += `
  <div class="review">

    <div class="review-date">${date}</div>

    <div class="review-line">
      <span class="label">Имя:</span>
      <span class="value">${r.name}</span>
    </div>

    <div class="review-line">
      <span class="label">Курс:</span>
      <span class="value">${r.course}</span>
    </div>

    <div class="review-line">
      <span class="label">Отзыв:</span>
      <span class="value">${r.text}</span>
    </div>

  </div>
`;
  });
  });
}

// запуск
loadMainReviews();