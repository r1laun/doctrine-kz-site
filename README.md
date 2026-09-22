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

1. Добавьте строку во вкладку «Расписание» Google Таблицы:
   - **ID Проведения** — уникальный, например `С052`;
   - **ID Курса** — `К016` для нового курса (и такая же строка с названием
     во вкладке «Курсы») либо ID существующего, если это ещё одно проведение;
   - **Тип** — `Обычный`, `Модульный` (шапка модульного курса) или `Модуль`;
   - **Дата и время** — в формате `дд.мм.гггг - чч:мм`, каждое занятие с новой строки.
     Для набора без дат напишите `По мере формирования группы`,
     для записи — `Курс в записи` (такие курсы никогда не уходят в архив);
   - **Цена курса**, **Часы/ЗЕ**, **Преподаватель**, **Описание** — как обычно.
2. Запустите `bash tools/update.sh` — сайт обновится и опубликуется сам.
3. Прошедшие курсы **автоматически** уходят в «Архив» с бейджем «Завершён»,
   кнопка «Записаться» меняется на «Следующий поток» (WhatsApp).
   Ничего закрывать вручную не нужно.

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
