#!/bin/bash
# Doctrine: обновить курсы из Google Таблицы одной командой.
# Скачивает свежие CSV, пересобирает JSON + HTML, коммитит и пушит (Pages деплоится сам).
# Использование: bash tools/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SCHED_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vRudPYBPjoGFmD0chghTRh5Hsz9i7zrxTZGG2GNMLZMG4uB4cLU8D0kgyU02AF3J4U8HNmunTacYUrW/pub?gid=1965707972&single=true&output=csv"
COURSES_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vRudPYBPjoGFmD0chghTRh5Hsz9i7zrxTZGG2GNMLZMG4uB4cLU8D0kgyU02AF3J4U8HNmunTacYUrW/pub?gid=1026463295&single=true&output=csv"
TEACHERS_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vSyOKzRJr7nPKQllTLK2eZTiMZpk8l9Qz8PO2PrZldQ0GUr0nHAtHkq-JX82pqrWKS-FXEQR7AqpL3I/pub?output=csv"

echo "== скачиваю CSV из Google Таблицы =="
curl -sSL "$SCHED_URL" -o _original/schedule.csv
curl -sSL "$COURSES_URL" -o _original/courses.csv
curl -sSL "$TEACHERS_URL" -o _original/teachers.csv

echo "== пересобираю данные и страницы =="
python3 tools/make_data.py
python3 tools/build.py

echo "== проверка =="
N_COURSES=$(python3 -c "import json;print(len(json.load(open('docs/data/courses.json',encoding='utf-8'))))")
N_SESS=$(python3 -c "import json;print(sum(len(c['sessions']) for c in json.load(open('docs/data/courses.json',encoding='utf-8'))))")
echo "курсов: $N_COURSES, проведений: $N_SESS"
if [ "$N_COURSES" -eq 0 ] || [ "$N_SESS" -eq 0 ]; then
  echo "ОШИБКА: пустые данные, пуш отменён"; exit 1
fi

echo "== коммит и пуш =="
git add -A
git commit -m "data: обновление курсов из Google Таблицы" || { echo "нечего коммитить"; exit 0; }
git push origin main
echo "Готово. GitHub Pages пересоберётся сам за ~1 минуту."
