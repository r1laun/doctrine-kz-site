# Doctrine — новый сайт образовательного центра

Статический трёхъязычный сайт (RU / KZ / EN). Курсы — статика в `docs/data/*.json`,
заявки — внешняя Google Form. Хостинг — GitHub Pages из папки `docs/`.

## Структура

```
docs/                  # то, что деплоится на Pages
  ru/ kk/ en/          # index, schedule, course, teachers, online, offline, offer, 404
  assets/css/main.css  # фирменные цвета: #7fb3b5 / #faf9f1 / mint / teal
  assets/js/           # main.js (меню, фильтры), course.js (страница курса)
  assets/img/          # web-имена латиницей
  data/                # courses.json, teachers.json, site.json
  sitemap.xml robots.txt index.html .nojekyll
tools/
  make_data.py         # CSV из Google Sheets → docs/data/*.json
  build.py             # data + шаблоны → все HTML
_original/             # слепок старого doctrine.kz (источник контента, не деплоится)
```

## Пересборка

```bash
bash tools/update.sh   # всё одной командой: скачать таблицу → JSON → HTML → push
```

Вручную по шагам:

```bash
python3 tools/make_data.py   # обновить JSON из _original/*.csv
python3 tools/build.py       # перегенерировать HTML
python3 -m http.server --directory docs  # локальный просмотр
```

## Как добавить новый курс

1. Добавьте строку в Google Таблицу (колонки):
   **month** — месяц словами (`Сентябрь`, `Октябрь`, диапазон `Сентябрь - Октябрь`);
   пустые ячейки наследуют месяц строки выше. **course name**, **prof name**,
   **description** (можно многострочно), **time** (`17:00` на все дни или
   `19:00 (09, 11)` с новой строки `11:00 (12)`), **date** — дни месяца
   (`09, 11, 12` или `29 (сен)` + `01 (окт)` с новой строки),
   **price (Тенге)** (`45.000`), **credits** (`10 ч. (5 ЗЕ)`), **format**
   (`онлайн`/`офлайн`). Строки с одинаковым названием группируются в один курс.
2. Запустите `bash tools/update.sh` — сайт обновится и опубликуется сам.
3. Прошедшие курсы **автоматически** уходят в «Архив» с бейджем «Завершён»,
   кнопка «Записаться» меняется на «Следующий поток» (WhatsApp).
   Ничего закрывать вручную не нужно.

Старый формат (`schedule.csv`/`courses.csv`) остался в `_original/` и git-истории
как архив; актуальным источником теперь является `schedule_new.csv`.

Источники данных (Google Sheets оригинала):
- расписание и каталог — таблица `2PACX-1vRudPY...`
- преподаватели — таблица `2PACX-1vSyOKz...`

## Заявки

Все кнопки «Записаться» ведут на Google Form:
`https://forms.gle/w3KRJmSDwuwjDRKx6` (+ `?entry_course=ID` для предзаполнения курса).

## Деплой

GitHub Pages → Deploy from branch → `main` / `docs`. Кастомный домен `doctrine.kz`
подключается через `docs/CNAME` + A-записи у регистратора (после проверки на
`*.github.io`).
