#!/bin/bash
# Doctrine: обновить курсы из Google Таблицы одной командой.
# Скачивает свежий CSV, пересобирает JSON + HTML, коммитит и пушит (Pages деплоится сам).
# Использование: bash tools/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

NEW_SCHED_URL="https://docs.google.com/spreadsheets/d/1OSTcmJxk-X7Spxsn5z1B5dSvM0XSEfWewP9UzP_4_V8/export?format=csv"

echo "== скачиваю актуальное расписание из Google Таблицы =="
curl -sSL "$NEW_SCHED_URL" -o _original/schedule_new.csv

echo "== пересобираю данные и страницы =="
python3 tools/make_data.py
python3 tools/build.py

echo "== проверка =="
N_COURSES=$(python3 -c "import json;print(len(json.load(open('docs/data/courses.json',encoding='utf-8'))))")
N_SESS=$(python3 -c "import json;print(sum(len(c['sessions']) for c in json.load(open('docs/data/courses.json',encoding='utf-8'))))")
echo "курсов: $N_COURSES, занятий: $N_SESS"
if [ "$N_COURSES" -eq 0 ] || [ "$N_SESS" -eq 0 ]; then
  echo "ОШИБКА: пустые данные, пуш отменён"; exit 1
fi

echo "== коммит и пуш =="
git add -A
git commit -m "data: обновление курсов из Google Таблицы" || { echo "нечего коммитить"; exit 0; }
git push origin main
echo "Готово. GitHub Pages пересоберётся сам за ~1 минуту."
