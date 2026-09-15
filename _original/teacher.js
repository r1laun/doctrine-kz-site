const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyOKzRJr7nPKQllTLK2eZTiMZpk8l9Qz8PO2PrZldQ0GUr0nHAtHkq-JX82pqrWKS-FXEQR7AqpL3I/pub?output=csv";

const app = document.getElementById("app");

setInterval(() => {
  const id = getId();

  if (id) {
    loadTeacher(id);
  } else {
    loadTeachers();
  }
}, 60000); // каждые 60 секунд

// =====================
// Получение ID
// =====================
function getId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// =====================
// Загрузка карточек
// =====================
async function loadTeachers() {
  const res = await fetch(CSV_URL);
  const text = await res.text();

  let data = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data;

  // фильтр мусора
  data = data.filter(t =>
    t.id &&
    t.name &&
    t.name.trim() !== "" &&
    t.photo &&
    t.photo.trim() !== ""
  );

  app.innerHTML = `<div class="teachers"></div>`;
  const container = document.querySelector(".teachers");

  data.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";

    card.onclick = () => {
      window.location.href = `teacher.html?id=${t.id}`;
    };

    card.innerHTML = `
      <div class="card-img">
        <img src="${t.photo}">
      </div>
      <div class="card-body">
        <h3>${t.name}</h3>
        <p>${t.spec || ""}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// =====================
// Загрузка преподавателя
// =====================
async function loadTeacher(id) {
  const res = await fetch(CSV_URL);
  const text = await res.text();

  let data = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data;

  const t = data.find(x => String(x.id).trim() === String(id).trim());

  if (!t) {
    app.innerHTML = "Преподаватель не найден";
    return;
  }

  app.innerHTML = `
    <button class="back-btn" onclick="goBack()">⬅ Назад</button>

    <div class="teacher-page">
      <div class="teacher-top">
        <img class="teacher-photo" src="${t.photo}">
        
        <div class="teacher-info">
          <h1>${t.name}</h1>
     <p class="spec">${t.spec}</p>

<div class="info-row">
  <span class="label">Стаж:</span>
  <span class="value">${t.exp}</span>
</div>

<div class="info-row">
  <span class="label">Место работы:</span>
  <span class="value">${t.work}</span>
</div>
        </div>
      </div>

      <h2>О преподавателе</h2>
      <p>${(t.about || "").replace(/\n/g, "<br>")}</p>

      <div class="comments">
        <h2>Отзывы</h2>

        <textarea id="comment" placeholder="Напишите отзыв..."></textarea>
        <button onclick="send()">Отправить</button>

        <div id="reviews"></div>
      </div>
    </div>
  `;

  loadReviews(); // 🔥 важно
}

// =====================
// Назад
// =====================
function goBack() {
  window.location.href = "teacher.html";
}

// =====================
// Отправка отзыва
// =====================
function send() {
  const params = new URLSearchParams(window.location.search);
  let id = params.get("id");

  if (!id) {
    alert("Ошибка: нет ID");
    return;
  }

  id = String(id).trim();

  const text = document.getElementById("comment").value.trim();

  if (!text) {
    alert("Введите отзыв");
    return;
  }

  firebase.database().ref("reviews/" + id).push({
    text: text,
    date: Date.now()
  });

  document.getElementById("comment").value = "";
}

// =====================
// Загрузка отзывов
// =====================
function loadReviews() {
  const params = new URLSearchParams(window.location.search);
  let id = params.get("id");

  if (!id) return;

  id = String(id).trim();

  const div = document.getElementById("reviews");

  firebase.database().ref("reviews/" + id).on("value", snap => {
    const data = snap.val();

    div.innerHTML = "";

    if (!data) {
      div.innerHTML = "<p>Пока нет отзывов</p>";
      return;
    }

    Object.values(data)
      .sort((a, b) => b.date - a.date)
      .forEach(r => {
        const date = new Date(r.date).toLocaleString("ru-RU");

        div.innerHTML += `
          <div class="review">
            <small>${date}</small>
            <p>${r.text}</p>
          </div>
        `;
      });
  });
}

// =====================
// СТАРТ
// =====================
window.onload = () => {
  const id = getId();

  if (id) {
    loadTeacher(id);
  } else {
    loadTeachers();
  }
};