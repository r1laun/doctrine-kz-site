/* =========================================================
   DOCTRINE — РАСПИСАНИЕ КУРСОВ
   ПОЛНАЯ ВЕРСИЯ
   ========================================================= */

const SCHEDULE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRudPYBPjoGFmD0chghTRh5Hsz9i7zrxTZGG2GNMLZMG4uB4cLU8D0kgyU02AF3J4U8HNmunTacYUrW/pub?gid=1965707972&single=true&output=csv";

const COURSES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRudPYBPjoGFmD0chghTRh5Hsz9i7zrxTZGG2GNMLZMG4uB4cLU8D0kgyU02AF3J4U8HNmunTacYUrW/pub?gid=1026463295&single=true&output=csv";

const REGISTER_URL =
  "https://forms.gle/gjisz5prX4YxRNns6";

const COURSE_IMAGE_PATH =
  "img/schedule/";

const REFRESH_INTERVAL =
  180000;

const MODAL_STORAGE_KEY =
  "doctrine_open_course";


let catalog =
  new Map();

let lastDataSignature =
  "";

let refreshInProgress =
  false;


function clean(value) {
  return String(
    value ?? ""
  ).trim();
}


function norm(value) {
  return clean(value)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}


function esc(value) {
  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function html(value) {
  return esc(value)
    .replace(/\r?\n/g, "<br>");
}


function col(header, names) {
  const normalized =
    header.map(norm);

  for (const name of names) {
    const index =
      normalized.indexOf(
        norm(name)
      );

    if (index > -1) {
      return index;
    }
  }

  return -1;
}


function today() {
  const d =
    new Date();

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d;
}


function dateOf(value) {
  const match =
    clean(value).match(
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/
    );

  if (!match) {
    return null;
  }

  const d =
    new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    );

  d.setHours(
    0,
    0,
    0,
    0
  );

  return isNaN(d)
    ? null
    : d;
}


function dateLines(value) {
  const text =
    clean(value);

  if (!text) {
    return [];
  }

  const result = [];

  const regex =
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:\s*(?:[-–—]\s*)?(\d{1,2}:\d{2}))?/g;

  let match;

  while (
    (match = regex.exec(text)) !== null
  ) {

    const d =
      new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1])
      );

    d.setHours(
      0,
      0,
      0,
      0
    );

    if (isNaN(d)) {
      continue;
    }

    result.push({
      date: d,
      time:
        match[4] || "",
      line:
        match[0].trim()
    });
  }

  return result;
}


function monthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}


async function csv(url) {
  const response =
    await fetch(
      `${url}&t=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {
    throw Error(
      `CSV HTTP ${response.status}`
    );
  }

  const parsed =
    Papa.parse(
      await response.text(),
      {
        skipEmptyLines: true
      }
    );

  return parsed.data;
}


/* =========================================================
   ВКЛАДКА "КУРСЫ"

   Используем её ТОЛЬКО для дополнительных данных,
   например для обложки курса.

   Название и описание курса отсюда НЕ берём.
   ========================================================= */

function readCatalog(data) {

  catalog.clear();

  if (!data?.length) {
    return;
  }

  const header =
    data[0];

  const id =
    col(
      header,
      [
        "ID курса",
        "ID"
      ]
    );

  const name =
    col(
      header,
      [
        "Название курса",
        "Название"
      ]
    );

  const image =
    col(
      header,
      [
        "Обложка",
        "Картинка",
        "Фото",
        "Изображение",
        "image",
        "img"
      ]
    );

  const description =
    header.findIndex(
      x =>
        norm(x).includes("описан")
    );

  if (id < 0) {
    return;
  }

  data
    .slice(1)
    .forEach(row => {

      const key =
        clean(row[id]);

      if (!key) {
        return;
      }

      catalog.set(
        key,
        {
          /*
             Оставляем эти данные в каталоге для совместимости,
             но название и описание НЕ используются функциями
             nameOf() и descOf().
          */

          name:
            name >= 0
              ? clean(row[name])
              : "",

          image:
            image >= 0
              ? clean(row[image])
              : "",

          description:
            description >= 0
              ? clean(row[description])
              : ""
        }
      );
    });
}


/* =========================================================
   ВКЛАДКА "РАСПИСАНИЕ"

   ВСЕ ОСНОВНЫЕ ДАННЫЕ КУРСА БЕРЁМ ОТСЮДА.
   ========================================================= */

function readSchedule(data) {

  if (!data?.length) {
    return [];
  }

  const header =
    data[0];

  const index = {

    id:
      col(
        header,
        [
          "ID проведения",
          "ID"
        ]
      ),

    course:
      col(
        header,
        [
          "ID курса"
        ]
      ),

    type:
      col(
        header,
        [
          "Тип"
        ]
      ),

    name:
      col(
        header,
        [
          "Название курса",
          "Название"
        ]
      ),

    description:
      header.findIndex(
        x =>
          norm(x).includes("описан")
      ),

    teacher:
      col(
        header,
        [
          "Преподаватель"
        ]
      ),

    hours:
      col(
        header,
        [
          "Часы/ЗЕ",
          "Часы/ЗЕ*"
        ]
      ),

    date:
      col(
        header,
        [
          "Дата и время",
          "Дата и время проведения"
        ]
      ),

    price:
      col(
        header,
        [
          "Цена курса",
          "Стоимость"
        ]
      ),

    modulePrice:
      col(
        header,
        [
          "Цена модуля"
        ]
      ),

    month:
      col(
        header,
        [
          "Месяц"
        ]
      )
  };


  return data
    .slice(1)
    .map(row => ({

      id:
        index.id >= 0
          ? clean(row[index.id])
          : "",

      course:
        index.course >= 0
          ? clean(row[index.course])
          : "",

      type:
        index.type >= 0
          ? clean(row[index.type])
          : "",

      name:
        index.name >= 0
          ? clean(row[index.name])
          : "",

      desc:
        index.description >= 0
          ? clean(row[index.description])
          : "",

      teacher:
        index.teacher >= 0
          ? clean(row[index.teacher])
          : "",

      hours:
        index.hours >= 0
          ? clean(row[index.hours])
          : "",

      date:
        index.date >= 0
          ? clean(row[index.date])
          : "",

      price:
        index.price >= 0
          ? clean(row[index.price])
          : "",

      modulePrice:
        index.modulePrice >= 0
          ? clean(row[index.modulePrice])
          : "",

      month:
        index.month >= 0
          ? clean(row[index.month])
          : ""

    }))
    .filter(
      row =>
        row.course ||
        row.id ||
        row.name
    );
}


/* =========================================================
   ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ

   Нужны, например, для картинки.
   ========================================================= */

function courseData(group) {

  return (
    catalog.get(
      group.course
    ) || {}
  );
}


/* =========================================================
   НАЗВАНИЕ КУРСА

   ВАЖНО:

   НАЗВАНИЕ БЕРЁТСЯ ТОЛЬКО ИЗ "РАСПИСАНИЕ".

   Вкладка "Курсы" больше НЕ может подставить старое
   название курса.

   Поэтому если в "Расписание" написано:

   Модульный курс по "Холтер и СМАД"
   Как читать холтер и СМАД что бы не ошибаться?

   именно это и будет показано на сайте.
   ========================================================= */

function nameOf(group) {

  return (
    group.rows.find(
      row =>
        clean(row.name)
    )?.name ||

    group.course ||

    "Курс"
  );
}


/* =========================================================
   ОПИСАНИЕ КУРСА

   Также берём ТОЛЬКО из "РАСПИСАНИЕ".

   Старое описание из вкладки "Курсы" больше
   не может попасть сюда.
   ========================================================= */

function descOf(group) {

  return (
    group.rows.find(
      row =>
        clean(row.desc)
    )?.desc ||

    ""
  );
}


/* =========================================================
   КАРТИНКИ

   Обложка по-прежнему может храниться во вкладке
   "Курсы".
   ========================================================= */

function imageCandidates(group) {

  let value =
    clean(
      courseData(group).image
    );

  if (!value) {
    return [];
  }

  if (
    /^https?:\/\//i.test(value)
  ) {

    return [
      value
    ];
  }

  value =
    value.replace(
      /^\/+/,
      ""
    );

  if (
    /^(?:\.\/)?(?:image|img)\//i
      .test(value)
  ) {

    return [
      encodeURI(value)
    ];
  }

  const file =
    value
      .split("/")
      .map(
        part =>
          encodeURIComponent(part)
      )
      .join("/");

  const candidates = [];

  function add(path) {

    if (
      path &&
      !candidates.includes(path)
    ) {

      candidates.push(path);
    }
  }

  add(
    COURSE_IMAGE_PATH +
    file
  );

  add(
    "img/schedule/" +
    file
  );

  add(
    "image/shadow/" +
    file
  );

  return candidates;
}


function imageOf(group) {

  return (
    imageCandidates(group)[0] ||
    ""
  );
}


/* =========================================================
   ПРЕПОДАВАТЕЛИ
   ========================================================= */

function teachers(group) {

  const result = [];

  group.rows.forEach(
    row => {

      const text =
        clean(row.teacher);

      if (!text) {
        return;
      }

      const lines =
        text
          .split(/\r?\n/)
          .map(
            line =>
              clean(line)
                .replace(/[;,]+$/, "")
                .trim()
          )
          .filter(Boolean);

      const names =
        lines.filter(
          line => {

            const normalized =
              line
                .replace(/[;,]+$/, "")
                .trim();

            return /(?:ович|евич|овна|евна|ич|кызы|ұлы)$/iu
              .test(normalized);
          }
        );

      if (names.length) {

        names.forEach(
          name => {

            if (
              !result.includes(name)
            ) {

              result.push(name);

            }

          }
        );

      } else {

        if (
          !result.includes(text)
        ) {

          result.push(text);

        }

      }

    }
  );

  return result;

}


/* =========================================================
   ЧАСЫ
   ========================================================= */

function hours(group) {

  return [
    ...new Set(
      group.rows
        .map(
          row =>
            clean(row.hours)
        )
        .filter(Boolean)
    )
  ].join(" / ");
}


/* =========================================================
   ЦЕНА

   Цена берётся из "РАСПИСАНИЕ".
   ========================================================= */

function price(group) {

  return (
    group.rows.find(
      row =>
        clean(row.price)
    )?.price ||

    ""
  );
}


function modulePrice(group) {

  return (
    group.rows.find(
      row =>
        clean(row.modulePrice)
    )?.modulePrice ||

    ""
  );
}


/* =========================================================
   ТИП КУРСА
   ========================================================= */

function moduleCourse(group) {

  return group.rows.some(
    row =>
      norm(row.type) ===
      "модульный"
  );
}


function moduleRow(row) {

  return (
    norm(row.type) ===
    "модуль"
  );
}


/* =========================================================
   ПО МЕРЕ ФОРМИРОВАНИЯ ГРУПП
   ========================================================= */

function formation(group) {

  // Если у курса уже есть хотя бы одна
  // нормальная дата — режим
  // "По мере формирования групп"
  // НЕ включаем.

  const hasDates =
    dates(group).length > 0;

  if (hasDates) {
    return false;
  }

  return group.rows.some(
    row => {

      const value =
        norm(row.date);

      return (
        value.includes(
          "по мере формирования"
        ) ||
        value.includes(
          "формирования групп"
        )
      );
    }
  );
}


/* =========================================================
   ДАТЫ КУРСА
   ========================================================= */

function dates(group) {

  const result = [];

  group.rows.forEach(
    row => {

      dateLines(
        row.date
      ).forEach(
        item => {

          result.push({
            ...item,
            row
          });
        }
      );
    }
  );

  return result.sort(
    (a, b) =>
      a.date - b.date
  );
}


/* =========================================================
   МЕСЯЦ КУРСА
   ========================================================= */

function monthKeyFromValue(value) {

  const text =
    norm(value);

  if (!text) {
    return "";
  }

  const months = {
    январь: 1,
    января: 1,
    февраль: 2,
    февраля: 2,
    март: 3,
    марта: 3,
    апрель: 4,
    апреля: 4,
    май: 5,
    мая: 5,
    июнь: 6,
    июня: 6,
    июль: 7,
    июля: 7,
    август: 8,
    августа: 8,
    сентябрь: 9,
    сентября: 9,
    октябрь: 10,
    октября: 10,
    ноябрь: 11,
    ноября: 11,
    декабрь: 12,
    декабря: 12
  };

  for (const name in months) {
    if (text.includes(name)) {
      const yearMatch =
        text.match(/(?:19|20)\d{2}/);

      const year =
        yearMatch
          ? Number(yearMatch[0])
          : today().getFullYear();

      return `${year}-${String(
        months[name]
      ).padStart(2, "0")}`;
    }
  }

  /*
     Поддерживаем также числовой месяц из Google Sheets:
     6, 06, "6 месяц", "06.2026", "2026-06" и т.п.
  */
  const yearMatch =
    text.match(/(?:19|20)\d{2}/);

  const year =
    yearMatch
      ? Number(yearMatch[0])
      : today().getFullYear();

  const numericMonth =
    text.match(
      /(?:^|[^\d])([1-9]|1[0-2])(?:\s*месяц)?(?:[^\d]|$)/
    );

  if (numericMonth) {
    return `${year}-${String(
      Number(numericMonth[1])
    ).padStart(2, "0")}`;
  }

  const ym =
    text.match(
      /(?:19|20)\d{2}\s*[-/.]\s*(0?[1-9]|1[0-2])/
    );

  if (ym) {
    return `${Number(ym[0].slice(0, 4))}-${String(
      Number(ym[1])
    ).padStart(2, "0")}`;
  }

  const my =
    text.match(
      /(?:0?[1-9]|1[0-2])\s*[-/.]\s*(?:19|20)\d{2}/
    );

  if (my) {
    const parts =
      my[0].split(/[-/.]/);

    return `${Number(parts[1])}-${String(
      Number(parts[0])
    ).padStart(2, "0")}`;
  }

  return "";
}


function monthOf(group) {

  const firstDate =
    dates(group)[0]?.date;

  if (firstDate) {
    return monthKey(firstDate);
  }

  const row =
    group.rows.find(
      item => clean(item.month)
    );

  return monthKeyFromValue(
    row?.month || ""
  ) || monthKey(today());
}


/* =========================================================
   ГРУППИРОВКА
   ========================================================= */

function groups(rows) {

  const result = [];
  const used = new Set();

  /*
     МОДУЛЬНЫЙ КУРС

     Одна строка "Модульный" = одно проведение курса.
     Все следующие строки "Модуль" относятся к нему.

     ВАЖНО:
     одинаковый ID курса (например K002) может повторяться
     в разных месяцах и даже в разных проведениях.
  */
  rows.forEach((row, index) => {

    if (used.has(index)) {
      return;
    }

    if (norm(row.type) !== "модульный") {
      return;
    }

    let courseId = clean(row.course);

    const courseRows = [
      { ...row }
    ];

    used.add(index);

    for (let i = index + 1; i < rows.length; i++) {

      const next = rows[i];

      if (norm(next.type) === "модульный") {
        break;
      }

      if (norm(next.type) !== "модуль") {
        break;
      }

      if (
        courseId &&
        clean(next.course) &&
        clean(next.course) !== courseId
      ) {
        break;
      }

      if (!courseId && clean(next.course)) {
        courseId = clean(next.course);
      }

      courseRows.push({ ...next });
      used.add(i);
    }

    /*
       Месяц модульной карточки определяется ТОЛЬКО
       главной строкой "Модульный".

       Если даты в главной строке нет, используем
       колонку "Месяц". Если она пустая из-за объединения
       ячеек, разрешаем найти явно указанный месяц среди
       строк этого же проведения.

       Даты самих модулей месяц карточки НЕ определяют.
    */
    let month = "";

    const mainDates = dateLines(row.date);

    if (mainDates.length) {
      month = monthKey(mainDates[0].date);
    } else {

      /*
         Для модульного курса месяц карточки берём из
         главной строки "Модульный" — колонка K "Месяц".
         Если K пустая из-за объединённой ячейки, ищем
         явно указанный месяц только среди строк этого же
         проведения. Даты модулей НИКОГДА не используются
         для выбора месяца карточки.
      */

      month =
        monthKeyFromValue(
          row.month
        );

      if (!month) {

        const monthRow =
          courseRows.find(
            item =>
              clean(item.month)
          );

        month =
          monthKeyFromValue(
            monthRow?.month || ""
          );
      }
    }

    if (!month) {

      /*
         Если в колонке "Месяц" действительно нет значения,
         не отправляем прошедший модульный курс в текущий месяц.
         В крайнем случае оставляем пустой месяц — ниже он будет
         обработан как отдельная группа без искусственного
         переноса в текущий месяц.
      */

      month = "";
    }

    result.push({

      course:
        courseId ||
        row.id ||
        row.name,

      rows:
        courseRows,

      monthKey:
        month,

      sourceOrder:
        index,

      occurrenceKey:
        `${courseId || row.id || row.name}__${index}`

    });

  });


  /*
     ОБЫЧНЫЕ КУРСЫ

     Каждая строка расписания — отдельное проведение.
     Поэтому одинаковый ID курса не объединяет разные
     проведения между собой.
  */

  rows.forEach((row, index) => {

    if (used.has(index)) {
      return;
    }

    const id =
      clean(row.course) ||
      clean(row.id) ||
      clean(row.name);

    if (!id) {
      return;
    }

    const rowDates =
      dateLines(row.date);

    if (rowDates.length) {

      const byMonth =
        new Map();

      rowDates.forEach(
        item => {

          const month =
            monthKey(
              item.date
            );

          if (!byMonth.has(month)) {
            byMonth.set(
              month,
              []
            );
          }

          byMonth
            .get(month)
            .push(
              item.line
            );
        }
      );

      byMonth.forEach(
        (lines, month) => {

          result.push({

            course:
              id,

            rows: [
              {
                ...row,
                date:
                  lines.join("\n"),
                monthKey:
                  month
              }
            ],

            monthKey:
              month,

            sourceOrder:
              index,

            occurrenceKey:
              `${id}__${index}__${month}`

          });

        }
      );

      return;
    }

    /*
       Даты нет.
       Месяц берём из колонки "Месяц".
       Это работает и для "По мере формирования групп",
       и для обычного курса без даты.
    */

    const month =
      monthOf({
        course:
          id,
        rows: [
          row
        ]
      });

    result.push({

      course:
        id,

      rows: [
        {
          ...row,
          monthKey:
            month
        }
      ],

      monthKey:
        month,

      sourceOrder:
        index,

      occurrenceKey:
        `${id}__${index}__${month}`

    });

  });

  return result;
}


/* =========================================================
   СОРТИРОВКА МЕСЯЦЕВ
   ========================================================= */

function monthDistance(key) {

  const [
    year,
    month
  ] =
    key
      .split("-")
      .map(Number);

  const now =
    today();

  return (
    (year -
      now.getFullYear()) *
      12
    +
    (
      month -
      1 -
      now.getMonth()
    )
  );
}


function sortMonths(keys) {

  return keys.sort(
    (a, b) => {

      const da =
        monthDistance(a);

      const db =
        monthDistance(b);

      function rank(value) {

        if (
          value === 0
        ) {
          return 0;
        }

        if (
          value > 0
        ) {
          return 1;
        }

        return 2;
      }

      const ra =
        rank(da);

      const rb =
        rank(db);

      if (
        ra !== rb
      ) {
        return ra - rb;
      }

      /*
         Будущие месяцы:
         ближайший будущий → дальше.
      */

      if (
        ra === 1
      ) {
        return da - db;
      }

      /*
         Прошедшие месяцы:
         ближайший прошедший → дальше вниз.
      */

      if (
        ra === 2
      ) {
        return db - da;
      }

      return 0;
    }
  );
}


/* =========================================================
   СОРТИРОВКА КУРСОВ ВНУТРИ МЕСЯЦА
   ========================================================= */

function sortInside(list) {

  return list.sort(
    (a, b) => {

      const datesA =
        dates(a);

      const datesB =
        dates(b);

      const dateA =
        datesA[0]?.date?.getTime() ??
        Infinity;

      const dateB =
        datesB[0]?.date?.getTime() ??
        Infinity;

      /*
         Все карточки с датами идут раньше карточек
         без дат.

         Между карточками с датами:
         ранняя дата выше.
      */

      if (
        dateA !== dateB
      ) {

        return dateA - dateB;
      }

      /*
         Если обе карточки без даты или даты совпадают,
         сохраняем порядок строк Google Таблицы.
      */

      return (
        (a.sourceOrder ?? 0) -
        (b.sourceOrder ?? 0)
      );
    }
  );
}


/* =========================================================
   БЕЙДЖИ
   ========================================================= */

function badges(group) {

  let result = "";

  if (
    moduleCourse(group)
  ) {

    result += `
      <span class="
        schedule-badge
        schedule-badge-module
      ">
        Модульный курс
      </span>
    `;
  }

  if (
    formation(group)
  ) {

    result += `
      <span class="
        schedule-badge
        schedule-badge-formation
      ">
        По мере формирования групп
      </span>
    `;
  }

  if (
    hours(group) &&
    !moduleCourse(group) &&
    !formation(group)
  ) {

    result += `
      <span class="
        schedule-badge
        schedule-badge-hours
      ">
        ${esc(hours(group))}
      </span>
    `;
  }

  return result
    ? `
      <div class="
        schedule-badges
      ">
        ${result}
      </div>
    `
    : "";
}


/* =========================================================
   ДАТЫ НА КАРТОЧКЕ
   ========================================================= */

function cardDates(group) {

  const list =
    dates(group);

  if (!list.length) {

    return formation(group)
      ? `
        <div class="
          schedule-card-formation
        ">
          По мере формирования групп
        </div>
      `
      : "";
  }

  return `
    <div class="
      schedule-card-dates
    ">

      ${list
        .map(
          item => `
            <span class="
              schedule-card-date
            ">

              <span class="
                schedule-calendar-icon
              ">
                📅
              </span>

              ${String(
                item.date.getDate()
              ).padStart(2, "0")}.${String(
                item.date.getMonth() + 1
              ).padStart(2, "0")}

              ${
                item.time
                  ? `
                    <small>
                      ${esc(item.time)}
                    </small>
                  `
                  : ""
              }

            </span>
          `
        )
        .join("")}

    </div>
  `;
}


/* =========================================================
   БЛОК КАРТИНКИ
   ========================================================= */

function imageBlock(
  group,
  modal = false
) {

  const candidates =
    imageCandidates(group);

  const src =
    candidates[0] || "";

  const title =
    nameOf(group);

  return `
    <div
      class="${
        modal
          ? "schedule-modal-image"
          : "schedule-card-image"
      }"

      data-image-candidates="${
        esc(
          JSON.stringify(
            candidates
          )
        )
      }"
    >

      ${
        src
          ? `
            <img
              src="${esc(src)}"
              alt="${esc(title)}"
            >
          `
          : ""
      }

      <div class="
        schedule-image-placeholder
      ">
        Doctrine
      </div>

      ${
        modal
          ? ""
          : badges(group)
      }

    </div>
  `;
}


/* =========================================================
   ПРЕПОДАВАТЕЛЬ В MODAL
   ========================================================= */

function modalTeachers(group) {

  const list =
    teachers(group);

  if (!list.length) {
    return "";
  }

  return `
    <div class="
      schedule-modal-teacher
    ">

      <div class="
        schedule-modal-teacher-sub
      ">
        Преподаватель курса
      </div>

      <div class="
        schedule-modal-teacher-list
      ">

        ${list
          .map(
            teacher => `
              <div class="
                schedule-modal-teacher-item
              ">

                <span class="
                  schedule-modal-teacher-icon
                ">
                  👨‍⚕️
                </span>

                <span class="
                  schedule-modal-teacher-name
                ">
                  ${html(
                    teacher
                  )}
                </span>

              </div>
            `
          )
          .join("")}

      </div>

    </div>
  `;
}


/* =========================================================
   ДАТЫ В MODAL
   ========================================================= */

function modalDates(group) {

  const list =
    dates(group);

  if (!list.length) {

    return formation(group)
      ? `
        <div class="
          schedule-modal-formation
        ">
          <span class="
            modal-calendar-icon
          ">
            📅
          </span>

          По мере формирования групп
        </div>
      `
      : "";
  }

  return list
    .map(
      item => `
        <div class="
          schedule-modal-date
        ">

          <span>

            <span class="
              modal-calendar-icon
            ">
              📅
            </span>

            ${String(
              item.date.getDate()
            ).padStart(2, "0")}.${String(
              item.date.getMonth() + 1
            ).padStart(2, "0")}.${item.date.getFullYear()}

          </span>

          ${
            item.time
              ? `
                <span>

                  <span class="
                    schedule-time-icon
                  ">
                    ◷
                  </span>

                  ${esc(item.time)}

                </span>
              `
              : ""
          }

        </div>
      `
    )
    .join("");
}


/* =========================================================
   ЦЕНЫ
   ========================================================= */

function modalPrices(group) {

  const p =
    price(group);

  const mp =
    modulePrice(group);

  if (
    !p &&
    !mp
  ) {
    return "";
  }

  return `
    <div class="
      schedule-modal-prices
    ">

      ${
        p
          ? `
            <div class="
              schedule-modal-price-box
            ">

              <span>
                Весь курс
              </span>

              <strong>
                ${esc(p)}
              </strong>

            </div>
          `
          : ""
      }

      ${
        mp
          ? `
            <div class="
              schedule-modal-price-box
            ">

              <span>
                Один модуль
              </span>

              <strong>
                ${esc(mp)}
              </strong>

            </div>
          `
          : ""
      }

    </div>
  `;
}


/* =========================================================
   МОДУЛИ
   ========================================================= */

function modules(group) {

  const list =
    group.rows.filter(
      moduleRow
    );

  if (!list.length) {
    return "";
  }

  return `
    <section class="
      schedule-modal-modules
    ">

      <h4>
        Модули курса
      </h4>

      <div class="
        schedule-modules-list
      ">

        ${
          list
            .map(
              (row, index) => {

                const moduleDate =
                  dateLines(
                    row.date
                  )[0];

                return `
                  <div class="
                    schedule-module-row
                  ">

                    <div class="
                      schedule-module-number
                    ">
                      ${index + 1}
                    </div>

                    <div class="
                      schedule-module-text
                    ">

                      <strong>
                        ${html(
                          row.name ||
                          `Модуль ${index + 1}`
                        )}
                      </strong>

                      ${
                        row.desc
                          ? `
                            <span>
                              ${html(
                                row.desc
                              )}
                            </span>
                          `
                          : ""
                      }

                      ${
                        moduleDate
                          ? `
                            <div class="
                              schedule-module-date
                            ">

                              <span>
                                📅
                                ${String(
                                  moduleDate.date.getDate()
                                ).padStart(2, "0")}.${String(
                                  moduleDate.date.getMonth() + 1
                                ).padStart(2, "0")}.${moduleDate.date.getFullYear()}
                              </span>

                              ${
                                moduleDate.time
                                  ? `
                                    <span>
                                      ◷
                                      ${esc(
                                        moduleDate.time
                                      )}
                                    </span>
                                  `
                                  : ""
                              }

                            </div>
                          `
                          : ""
                      }

                    </div>

                  </div>
                `;
              }
            )
            .join("")
        }

      </div>

    </section>
  `;
}


/* =========================================================
   МОДАЛЬНОЕ ОКНО
   ========================================================= */

function createModal(
  group,
  key
) {

  const p =
    price(group);

  const h =
    hours(group);

  const description =
    descOf(group);

  const isModule =
    moduleCourse(group);

  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "schedule-modal";

  modal.dataset.courseKey =
    key;

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  modal.innerHTML = `

    <div
      class="
        schedule-modal-overlay
      "
      data-close-course
    ></div>

    <div
      class="
        schedule-modal-window
      "
      role="dialog"
      aria-modal="true"
    >

      <button
        class="
          schedule-modal-close
        "
        type="button"
        data-close-course
        aria-label="Закрыть"
      >
        ×
      </button>

      <div
        class="
          schedule-modal-layout
        "
      >

        <div
          class="
            schedule-modal-hero
          "
        >

          ${imageBlock(
            group,
            true
          )}

          <div
            class="
              schedule-modal-top-info
            "
          >

            <h2
              class="
                schedule-modal-title
              "
            >
              ${html(
                nameOf(group)
              )}
            </h2>

            ${modalTeachers(group)}

            ${
              h
                ? `
                  <div
                    class="
                      schedule-modal-hours
                    "
                  >
                    ◷
                    ${esc(h)}
                  </div>
                `
                : ""
            }

            <section
              class="
                schedule-modal-section
              "
            >

              <h4>
                Даты и время
              </h4>

              <div
                class="
                  schedule-modal-dates
                "
              >
                ${modalDates(group)}
              </div>

            </section>

            ${
              isModule
                ? modalPrices(group)
                : p
                  ? `
                    <div
                      class="
                        schedule-modal-prices
                      "
                    >

                      <div
                        class="
                          schedule-modal-price-box
                        "
                      >

                        <span>
                          Стоимость
                        </span>

                        <strong>
                          ${esc(p)}
                        </strong>

                      </div>

                    </div>
                  `
                  : ""
            }

          </div>

        </div>

        <div
          class="
            schedule-modal-full-content
          "
        >

          ${
            description
              ? `
                <section
                  class="
                    schedule-modal-about
                  "
                >

                  <h4>
                    О курсе
                  </h4>

                  <div
                    class="
                      schedule-modal-description
                    "
                  >
                    ${html(description)}
                  </div>

                </section>
              `
              : ""
          }

          ${
            isModule
              ? modules(group)
              : ""
          }

          <a
            href="${REGISTER_URL}"
            class="
              schedule-modal-register
            "
            target="_blank"
            rel="noopener noreferrer"
          >
            Записаться
          </a>

        </div>

      </div>

    </div>

  `;

  return modal;
}


/* =========================================================
   СОСТОЯНИЕ КУРСА
   ========================================================= */

function getCourseState(group) {

  const list =
    dates(group);

  const now =
    today();

  if (!list.length) {
    return "future";
  }

  if (
    list[list.length - 1]
      .date < now
  ) {
    return "past";
  }

  if (
    list[0].date <= now
  ) {
    return "current";
  }

  return "future";
}


/* =========================================================
   КАРТОЧКА КУРСА
   ========================================================= */

function createCard(group) {

  const key =
    group.occurrenceKey ||
    `${group.course || group.id || group.name}__${
      group.monthKey ||
      monthOf(group)
    }`;

  const p =
    price(group);

  const h =
    hours(group);

  const teacherList =
    teachers(group);

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "schedule-course-card";

  card.dataset.state =
    getCourseState(group);

  card.dataset.openCourse =
    key;

  card.innerHTML = `

    ${imageBlock(group)}

    <div class="
      schedule-card-body
    ">

      <h3 class="
        schedule-card-title
      ">
        ${html(
          nameOf(group)
        )}
      </h3>

      ${
        teacherList.length
          ? `
            <div class="
              schedule-card-teacher
            ">

              ${teacherList
                .map(
                  teacher => `
                    <div class="
                      schedule-card-teacher-item
                    ">

                      <span class="
                        schedule-card-teacher-icon
                      ">
                        👨‍⚕️
                      </span>

                      <span>
                        ${html(
                          teacher
                        )}
                      </span>

                    </div>
                  `
                )
                .join("")}

            </div>
          `
          : ""
      }

      ${cardDates(group)}

      ${
        h &&
        !moduleCourse(group)
          ? `
            <div class="
              schedule-card-hours
            ">
              ◷
              ${esc(h)}
            </div>
          `
          : ""
      }

      <div class="
        schedule-card-price
        ${
          p
            ? ""
            : "schedule-card-price-empty"
        }
      ">

        ${
          p
            ? esc(p)
            : "&nbsp;"
        }

      </div>

      <div class="
        schedule-card-actions
      ">

        <a
          href="${REGISTER_URL}"
          class="
            schedule-register-btn
          "
          target="_blank"
          rel="noopener noreferrer"
        >
          Записаться
        </a>

      </div>

    </div>

  `;

  return {
    card,

    modal:
      createModal(
        group,
        key
      )
  };
}


/* =========================================================
   РАЗДЕЛИТЕЛЬ МЕСЯЦЕВ
   ========================================================= */

function createMonthDivider() {

  const divider =
    document.createElement(
      "div"
    );

  divider.className =
    "schedule-month-divider";

  divider.innerHTML = `
    <span></span>
    <i>✦</i>
    <span></span>
  `;

  return divider;
}


/* =========================================================
   СОХРАНЕНИЕ MODAL
   ========================================================= */

function saveModalState() {

  const modal =
    document.querySelector(
      ".schedule-modal.is-open"
    );

  if (!modal) {
    return;
  }

  const layout =
    modal.querySelector(
      ".schedule-modal-window"
    );

  const state = {

    key:
      modal.dataset.courseKey,

    scrollTop:
      layout?.scrollTop || 0
  };

  try {

    sessionStorage.setItem(
      MODAL_STORAGE_KEY,
      JSON.stringify(state)
    );

  } catch (error) {

    console.warn(
      "Doctrine: sessionStorage недоступен",
      error
    );
  }
}


/* =========================================================
   ОЧИСТКА СОХРАНЕННОГО MODAL
   ========================================================= */

function clearModalState() {

  try {

    sessionStorage.removeItem(
      MODAL_STORAGE_KEY
    );

  } catch (error) {

    console.warn(
      "Doctrine: не удалось очистить состояние",
      error
    );
  }
}


/* =========================================================
   ПОЛУЧЕНИЕ СОХРАНЕННОГО MODAL
   ========================================================= */

function getSavedModalState() {

  try {

    const value =
      sessionStorage.getItem(
        MODAL_STORAGE_KEY
      );

    if (!value) {
      return null;
    }

    return JSON.parse(
      value
    );

  } catch {

    return null;
  }
}


/* =========================================================
   ВОССТАНОВЛЕНИЕ MODAL
   ========================================================= */

function restoreModal(
  key,
  scrollTop = 0
) {

  if (!key) {
    return;
  }

  const modal =
    [
      ...document.querySelectorAll(
        ".schedule-modal"
      )
    ].find(
      item =>
        item.dataset.courseKey ===
        key
    );

  if (!modal) {
    return;
  }

  modal.classList.add(
    "is-open"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "schedule-modal-open"
  );

  const windowElement =
    modal.querySelector(
      ".schedule-modal-window"
    );

  if (windowElement) {

    requestAnimationFrame(
      () => {

        windowElement.scrollTop =
          scrollTop;

      }
    );
  }

  saveModalState();
}


/* =========================================================
   ОТРИСОВКА
   ========================================================= */

function render(list) {

  const container =
    document.getElementById(
      "courses"
    );

  if (!container) {
    return;
  }

  const openedModal =
    document.querySelector(
      ".schedule-modal.is-open"
    );

  let openedKey =
    openedModal?.dataset.courseKey ||
    null;

  let openedScroll =
    openedModal
      ?.querySelector(
        ".schedule-modal-window"
      )
      ?.scrollTop ||
    0;

  if (!openedKey) {

    const saved =
      getSavedModalState();

    if (saved?.key) {

      openedKey =
        saved.key;

      openedScroll =
        Number(
          saved.scrollTop
        ) || 0;
    }
  }

  container.innerHTML =
    "";

  document
    .querySelectorAll(
      ".schedule-modal"
    )
    .forEach(
      modal =>
        modal.remove()
    );

  const months =
    new Map();

  list.forEach(
    group => {

      const month =
        group.monthKey ||
        monthOf(group);

      if (
        !months.has(month)
      ) {

        months.set(
          month,
          []
        );
      }

      months
        .get(month)
        .push(group);
    }
  );

  const monthKeys =
    sortMonths([
      ...months.keys()
    ]);

  if (!monthKeys.length) {

    container.innerHTML = `
      <div class="
        schedule-empty
      ">
        Расписание пока не сформировано.
      </div>
    `;

    return;
  }

  monthKeys.forEach(
    (month, monthIndex) => {

      if (
        monthIndex > 0
      ) {

        container.appendChild(
          createMonthDivider()
        );
      }

      const grid =
        document.createElement(
          "div"
        );

      grid.className =
        "schedule-courses-grid";

      sortInside(
        months.get(month)
      ).forEach(
        group => {

          const item =
            createCard(group);

          grid.appendChild(
            item.card
          );

          document.body.appendChild(
            item.modal
          );
        }
      );

      container.appendChild(
        grid
      );
    }
  );

  if (openedKey) {

    restoreModal(
      openedKey,
      openedScroll
    );
  }
}


/* =========================================================
   ОТКРЫТИЕ MODAL
   ========================================================= */

function openModal(key) {

  const modal =
    [
      ...document.querySelectorAll(
        ".schedule-modal"
      )
    ].find(
      item =>
        item.dataset.courseKey ===
        key
    );

  if (!modal) {
    return;
  }

  modal.classList.add(
    "is-open"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "schedule-modal-open"
  );

  saveModalState();
}


/* =========================================================
   ЗАКРЫТИЕ MODAL
   ========================================================= */

function closeModals() {

  document
    .querySelectorAll(
      ".schedule-modal.is-open"
    )
    .forEach(
      modal => {

        modal.classList.remove(
          "is-open"
        );

        modal.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    );

  document.body.classList.remove(
    "schedule-modal-open"
  );

  clearModalState();
}


/* =========================================================
   КЛИКИ
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      event.target.closest(
        "[data-close-course]"
      )
    ) {

      closeModals();

      return;
    }

    if (
      event.target.closest("a")
    ) {
      return;
    }

    const card =
      event.target.closest(
        "[data-open-course]"
      );

    if (!card) {
      return;
    }

    event.preventDefault();

    openModal(
      card.dataset.openCourse
    );
  }
);


/* =========================================================
   ESC
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeModals();
    }
  }
);


/* =========================================================
   СОХРАНЕНИЕ ПРОКРУТКИ
   ========================================================= */

document.addEventListener(
  "scroll",
  event => {

    const windowElement =
      event.target.closest?.(
        ".schedule-modal-window"
      );

    if (
      windowElement &&
      windowElement.closest(
        ".schedule-modal.is-open"
      )
    ) {

      saveModalState();
    }

  },
  true
);


/* =========================================================
   ОБРАБОТКА КАРТИНОК
   ========================================================= */

function installImageFallbacks() {

  document
    .querySelectorAll(
      "[data-image-candidates]"
    )
    .forEach(
      box => {

        const image =
          box.querySelector(
            "img"
          );

        if (!image) {
          return;
        }

        let candidates = [];

        try {

          candidates =
            JSON.parse(
              box.dataset
                .imageCandidates ||
              "[]"
            );

        } catch {

          candidates = [];
        }

        let index =
          candidates.indexOf(
            image.getAttribute(
              "src"
            )
          );

        if (index < 0) {
          index = 0;
        }

        image.addEventListener(
          "load",
          () => {

            box.classList.add(
              "schedule-image-loaded"
            );
          }
        );

        image.addEventListener(
          "error",
          () => {

            index++;

            if (
              index <
              candidates.length
            ) {

              image.src =
                candidates[index];

            } else {

              image.style.display =
                "none";

              box.classList.add(
                "schedule-image-error"
              );
            }
          }
        );
      }
    );
}


/* =========================================================
   ЗАГРУЗКА
   ========================================================= */

async function loadSchedule() {

  if (
    refreshInProgress
  ) {

    return;
  }

  refreshInProgress =
    true;

  try {

    const [
      scheduleData,
      catalogData
    ] =
      await Promise.all([

        csv(
          SCHEDULE_CSV_URL
        ),

        csv(
          COURSES_CSV_URL
        )

      ]);

    /*
       Каталог загружаем только для дополнительных
       данных, например обложки.
    */

    readCatalog(
      catalogData
    );

    /*
       Все основные данные курса читаем
       непосредственно из "Расписание".
    */

    const schedule =
      readSchedule(
        scheduleData
      );

    const list =
      groups(
        schedule
      );

    const signature =
      JSON.stringify({

        catalog: [
          ...catalog
        ],

        schedule:
          list

      });

    if (
      signature ===
      lastDataSignature
    ) {

      return;
    }

    lastDataSignature =
      signature;

    render(
      list
    );

    installImageFallbacks();

  } catch (error) {

    console.error(
      "Doctrine:",
      error
    );

    if (
      !document.querySelector(
        ".schedule-modal.is-open"
      )
    ) {

      const container =
        document.getElementById(
          "courses"
        );

      if (container) {

        container.innerHTML = `
          <div class="
            schedule-error
          ">
            Не удалось загрузить расписание.
          </div>
        `;
      }
    }

  } finally {

    refreshInProgress =
      false;
  }
}


/* =========================================================
   ЗАПУСК
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSchedule();

  }
);


/* =========================================================
   АВТООБНОВЛЕНИЕ
   ========================================================= */

setInterval(
  () => {

    loadSchedule();

  },
  REFRESH_INTERVAL
);


/* =========================================================
   ОБНОВЛЕНИЕ ПРИ ВОЗВРАЩЕНИИ
   НА ВКЛАДКУ
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      loadSchedule();

    }

  }
);