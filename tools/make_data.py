"""Build docs/data/*.json from original Google Sheets CSVs + Google Form course list.
Run: python3 tools/make_data.py
"""
import csv, json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(ROOT, "_original")
OUT = os.path.join(ROOT, "docs", "data")
os.makedirs(OUT, exist_ok=True)

FORM_URL = "https://forms.gle/w3KRJmSDwuwjDRKx6"
WHATSAPP = "https://wa.me/77770357345"
INSTAGRAM = "https://www.instagram.com/doctrine_centre"

def rows(f):
    with open(os.path.join(ORIG, f), encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))

def clean(v):
    return re.sub(r"\s+", " ", str(v or "").replace("—", "-")).strip()

def clean_ml(v):
    lines = [re.sub(r"[ \t]+", " ", str(ln)).strip()
             for str_ln in str(v or "").replace("—", "-").split("\n") for ln in [str_ln]]
    return "\n".join(ln for ln in lines if ln)

def norm_title(v):
    return clean(v).lower().replace("ё", "е")

DATE_RE = re.compile(r"(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})")

def parse_dates(v):
    """All dd.mm.yyyy dates found in a schedule cell -> sorted [(y,m,d)]."""
    out = []
    for d, m, y in DATE_RE.findall(str(v or "")):
        y = int(y)
        if y < 100:
            y += 2000
        try:
            out.append((y, int(m), int(d)))
        except ValueError:
            pass
    return sorted(out)

def latest_iso(dates):
    if not dates:
        return ""
    y, m, d = dates[-1]
    try:
        import datetime
        datetime.date(y, m, d)
    except ValueError:
        return ""
    return f"{y:04d}-{m:02d}-{d:02d}"

_RU = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
        "ж": "zh", "з": "z", "и": "i", "й": "i", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
        "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya"}

def slugify(s):
    s = clean(s).lower()
    s = "".join(_RU.get(ch, ch) for ch in s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "course"

# Draft KK/EN titles for the flagship courses (human draft by assistant,
# to be reviewed by a native speaker). Others fall back to RU.
TITLE_I18N = {
    "К001": {"kk": "Эхокардиография. Жоғары деңгей. Қақпақшалар бақылауда",
             "en": "Echocardiography. Advanced level. Valves under control"},
    "К002": {"kk": "Холтер және СМАД: қателеспей оқу (модульдік курс)",
             "en": "Holter & ABPM: how to read without mistakes (modular course)"},
    "К003": {"kk": "Қазақ тілінде ЭКГ-ның авторлық оқыту әдістемесі",
             "en": "Author's ECG training method in Kazakh"},
    "К004": {"kk": "QT аралығы және дәрілер. Күнделікті білім",
             "en": "QT interval and drugs. Everyday knowledge"},
    "К005": {"kk": "Клиницист дәрігерге арналған ЭхоКГ нөлден",
             "en": "EchoCG from scratch for clinicians"},
    "К006": {"kk": "ЭКС бар пациенттерде холтерлік мониторинг ерекшеліктері",
             "en": "Holter monitoring in patients with pacemakers"},
    "К008": {"kk": "Кардиоонкология",
             "en": "Cardio-oncology"},
    "К009": {"kk": "Кардиологиядағы жүктемелік тестілеу",
             "en": "Stress testing in cardiology: from indications to decisions"},
}

sched = rows("schedule.csv")
courses_csv = rows("courses.csv")
teachers_csv = rows("teachers.csv")

teach_map = {}
teachers = []
photo_renames = {
    "img/Зурдунова.jpeg": "teacher-zhurdunova.jpg",
    "img/Лещинская-Попова.jpeg": "teacher-leshinskaya.jpg",
    "img/Халикназарова Дилафруз Муратжановна.jpeg": "teacher-khaliknazarova.jpg",
    "img/Хахазова Карлыгаш Болатовна.jpeg": "teacher-khakhazova.jpg",
    "img/Азим Саида Юсуфовна.jpeg": "teacher-azimova.jpg",
}
NA = {"не указано", "н/д", "n/a", "-", "—"}
def na(v):
    v = clean(v)
    return "" if v.lower() in NA else v

for t in teachers_csv:
    if not clean(t.get("name")) or not clean(t.get("photo")):
        continue
    photo = photo_renames.get(clean(t["photo"]), os.path.basename(clean(t["photo"])))
    teach_map[clean(t["name"]).replace("  ", " ")] = t["id"]
    teachers.append({
        "id": clean(t["id"]),
        "name": clean(t["name"]),
        "spec": na(t["spec"]),
        "work": na(t["work"]),
        "exp": na(t["exp"]),
        "photo": "../assets/img/" + photo,
        "about": clean_ml(t["about"]),
    })

cat_title = {clean(r["ID Курса"]): clean(r["Название курса"]) for r in courses_csv}
# norm catalog title -> course id (to fix rows whose ID column is wrong/empty,
# e.g. "ЭхоКГ с нуля" conducts tagged К004, С049 with empty ID)
cat_by_title = {}
for cid, t in cat_title.items():
    if t:
        cat_by_title.setdefault(norm_title(t), cid)

def resolve_cid(row):
    rt = norm_title(row.get("Название курса"))
    if rt:
        if rt in cat_by_title:
            return cat_by_title[rt]
        for ct, cid in cat_by_title.items():
            if len(rt) > 20 and (rt in ct or ct in rt):
                return cid
    return clean(row.get("ID Курса"))

for r in sched:
    r["_cid"] = resolve_cid(r)

courses = []
for c in courses_csv:
    cid = clean(c["ID Курса"])
    title_ru = clean(c["Название курса"])
    if not cid or not title_ru:
        continue
    items = [r for r in sched if r["_cid"] == cid]
    # detect online/offline by text hints
    blob = " ".join(clean(r["Дата и время"]) + " " + clean(r["Описание"]) for r in items).lower()
    fmt = "online"
    if any(w in blob for w in ["алматы", "офлайн", "очно", "аудитор", "клиник"]):
        fmt = "offline"
    if "вебинар" in blob or "online" in blob or "запись" in blob:
        fmt = "online"
    tr = TITLE_I18N.get(cid, {})
    latest = ""
    open_ended = False
    for r in items:
        blob = norm_title(r.get("Дата и время"))
        if "по мере" in blob or "запис" in blob:
            open_ended = True
        for dt in parse_dates(r.get("Дата и время")):
            iso = latest_iso([dt])
            if iso > latest:
                latest = iso
    courses.append({
        "id": cid,
        "slug": slugify(title_ru) or cid.lower(),
        "title": {"ru": title_ru,
                  "kk": tr.get("kk", title_ru),
                  "en": tr.get("en", title_ru)},
        "format": fmt,
        "cover": "zaglushka",
        "latest": latest,
        "open": open_ended,
        "sessions": [{
            "sid": clean(r["ID Проведения"]),
            "kind": clean(r["Тип"]),
            "title": clean(r["Название курса"]),
            "desc": clean_ml(r["Описание"]),
            "teacher": clean_ml(r["Преподаватель"]),
            "hours": clean(r["Часы/ЗЕ"]),
            "dates": clean_ml(r["Дата и время"]),
            "price": clean(r["Цена курса"]),
            "module_price": clean(r["Цена модуля"]),
            "month": clean(r["Месяц"]),
        } for r in items],
    })

# Newest-first: courses with the latest conduct date on top;
# "" sorts smallest, so with reverse=True undated stay at the end.
courses.sort(key=lambda c: c["latest"] or "", reverse=True)

site = {
    "name": "Doctrine",
    "tagline": {
        "ru": "глубокие знания от сердца к сердцу",
        "kk": "жүректен жүрекке терең білім",
        "en": "deep knowledge from heart to heart",
    },
    "form_url": FORM_URL,
    "whatsapp": WHATSAPP,
    "instagram": INSTAGRAM,
    "phone": "+7 777 035 73 45",
    "email": "doctrine.kz@gmail.com",
    "address": {"ru": "г. Алматы",
                "kk": "Алматы қ.",
                "en": "Almaty"},
    "bin": "210140019512",
    "founder": {
        "name": {"ru": "Лещинская-Попова Инна Евгеньевна",
                 "kk": "Лещинская-Попова Инна Евгеньевна",
                 "en": "Inna Leshinskaya-Popova"},
        "role": {"ru": "Основатель и идейный лидер центра, врач-кардиолог, 20 лет в обучении врачей",
                 "kk": "Орталықтың негізін қалаушы, кардиолог дәрігер, дәрігерлерді оқытудағы 20 жылдық тәжірибе",
                 "en": "Founder of the centre, cardiologist, 20 years in physician training"},
    },
}

with open(os.path.join(OUT, "courses.json"), "w", encoding="utf-8") as f:
    json.dump(courses, f, ensure_ascii=False, indent=1)
with open(os.path.join(OUT, "teachers.json"), "w", encoding="utf-8") as f:
    json.dump(teachers, f, ensure_ascii=False, indent=1)
with open(os.path.join(OUT, "site.json"), "w", encoding="utf-8") as f:
    json.dump(site, f, ensure_ascii=False, indent=1)

# Reviews: best-effort fetch from the original site's public Firebase (curl,
# because this env's python SSL is broken). Keeps previous file if offline.
# Never invent reviews.
try:
    import subprocess
    base = "https://doctrine-1ebe5-default-rtdb.europe-west1.firebasedatabase.app"
    out = os.path.join(OUT, "reviews.json")
    main = json.loads(subprocess.check_output(
        ["curl", "-skL", base + "/mainReviews.json"], timeout=20).decode("utf-8") or "null") or {}
    items = []
    for v in main.values():
        items.append({"name": clean(v.get("name")), "course": clean(v.get("course")),
                      "text": clean(v.get("text")), "date": v.get("date") or 0})
    items = [x for x in items if x["text"]]
    items.sort(key=lambda x: x["date"], reverse=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)
    print(f"reviews={len(items)}")
except Exception as e:
    print("reviews fetch skipped:", e)
print(f"courses={len(courses)} teachers={len(teachers)}")
print("sessions total:", sum(len(c["sessions"]) for c in courses))
