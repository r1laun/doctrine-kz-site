"""Build docs/data/*.json from original Google Sheets CSVs + Google Form course list.
Run: python3 tools/make_data.py
"""
import csv, json, re, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from i18n_data import DESC_TR, TITLES, FRAGS, TEACH, SESSION_TITLE_TR

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
    return re.sub(r"\s+", " ", str(v or "").replace("—", "-").replace("–", "-")).strip()

def clean_ml(v):
    lines = [re.sub(r"[ \t]+", " ", str(ln)).strip()
             for str_ln in str(v or "").replace("—", "-").replace("–", "-").split("\n") for ln in [str_ln]]
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

# Draft KK/EN titles for the flagship courses.
TITLE_I18N = {
    "К001": {"kk": "ЭхоКГ «Қақпақшалар бақылауда»",
             "en": "EchoCG 'Valves under control'"},
    "К002": {"kk": "Холтер мен СМАД-ты қателеспей оқу",
             "en": "How to read Holter and ABPM without mistakes"},
    "К003": {"kk": "«ЭКГ» қазақ және орыс тілдерінде",
             "en": "'ECG' in Kazakh and Russian"},
    "К004": {"kk": "QT аралығы және дәрілер. Күнделікті білім",
             "en": "QT interval and drugs. Everyday knowledge"},
    "К005": {"kk": "Клиницист дәрігерге арналған ЭхоКГ нөлден",
             "en": "EchoCG from scratch for clinicians"},
    "К006": {"kk": "ЭКС бар пациенттерде холтерлік мониторинг ерекшеліктері",
             "en": "Holter monitoring in patients with pacemakers"},
    "К007": {"kk": "Бранч: «Сыбырды есту өнері»",
             "en": "Brunch: The Art of Hearing a Whisper"},
    "К008": {"kk": "Кардиоонкология",
             "en": "Cardio-oncology"},
    "К009": {"kk": "Кардиологиядағы жүктемелік тестілеу",
             "en": "Stress testing in cardiology: from indications to decisions"},
    "К010": {"kk": "Кардиологиядағы психотроптық дәрілер",
             "en": "Psychotropic drugs in cardiology"},
    "К011": {"kk": "Спирография клиникалық практикада: қателеспей түсіндіру",
             "en": "Spirometry in clinical practice: interpretation without errors"},
    "К012": {"kk": "Функционалдық диагностика 24/7: Холтер мен СМАД-тың клиникалық қыр-сыры",
             "en": "Functional diagnostics 24/7: clinical nuances of Holter and ABPM"},
    "К013": {"kk": "Белсенді ми мектебі",
             "en": "Active Brain School"},
    "К014": {"kk": "Күрделі туа біткен жүрек ақаулары қарапайым тілмен",
             "en": "Complex CHD in simple terms"},
    "К016": {"kk": "Жүктілік кезіндегі гипертензиялық бұзылыстар",
             "en": "Hypertensive disorders in pregnancy"},
    "К018": {"kk": "Әйелдің жүрек-қан тамырлары денсаулығы",
             "en": "Women's cardiovascular health"},
}

CANONICAL_COURSES = {
    "К001": {
        "title": {
            "ru": "ЭхоКГ «Клапаны под контролем»",
            "kk": "ЭхоКГ «Қақпақшалар бақылауда»",
            "en": "EchoCG 'Valves under control'"
        },
        "slug": "ehokg-klapany-pod-kontrolem",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["клапаны под контролем", "эхокардиография. продвинутый уровень"]
    },
    "К002": {
        "title": {
            "ru": "Как читать холтер и СМАД, чтобы не ошибаться?",
            "kk": "Холтер мен СМАД-ты қателеспей оқу",
            "en": "How to read Holter and ABPM without mistakes"
        },
        "slug": "kak-chitat-holter-i-smad-chto-by-ne-oshibatsya",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["как читать холтер и смад", "холтер и смад"]
    },
    "К003": {
        "title": {
            "ru": "«ЭКГ» на казахском и русском языках",
            "kk": "«ЭКГ» қазақ және орыс тілдерінде",
            "en": "'ECG' in Kazakh and Russian"
        },
        "slug": "ekg-na-kazahskom-russkom-yazykah",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["экг на казахском/русском", "авторская методика обучения экг", "экг"]
    },
    "К004": {
        "title": {
            "ru": "Интервал QT и лекарственные препараты. Знания на каждый день",
            "kk": "QT аралығы және дәрілер. Күнделікті білім",
            "en": "QT interval and drugs. Everyday knowledge"
        },
        "slug": "interval-qt-i-lekarstvennye-preparaty",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["интервал qt"]
    },
    "К005": {
        "title": {
            "ru": "ЭхоКГ с нуля для врача-клинициста",
            "kk": "Клиницист дәрігерге арналған ЭхоКГ нөлден",
            "en": "EchoCG from scratch for clinicians"
        },
        "slug": "ehokg-s-nulya-dlya-vracha-klinitsista",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["эхокг с нуля"]
    },
    "К006": {
        "title": {
            "ru": "Особенности Холтеровского мониторирования у пациентов с ЭКС",
            "kk": "ЭКС бар пациенттерде холтерлік мониторинг ерекшеліктері",
            "en": "Holter monitoring in patients with pacemakers"
        },
        "slug": "osobennosti-holterovskogo-monitorirovaniya-u-patsientov-s-eks",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["пациентов с экс"]
    },
    "К007": {
        "title": {
            "ru": "Бранч: «Искусство слышать шепот»",
            "kk": "Бранч: «Сыбырды есту өнері»",
            "en": "Brunch: The Art of Hearing a Whisper"
        },
        "slug": "branch-iskusstvo-slyshat-shepot",
        "format": "offline",
        "can_record": False,
        "record_status": "brunch",
        "keywords": ["бранч"]
    },
    "К008": {
        "title": {
            "ru": "Кардиоонкология",
            "kk": "Кардиоонкология",
            "en": "Cardio-oncology"
        },
        "slug": "kardioonkologiya",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["кардиоонкология"]
    },
    "К009": {
        "title": {
            "ru": "Нагрузочное тестирование в кардиологии: от показаний к клиническим решениям",
            "kk": "Кардиологиядағы жүктемелік тестілеу",
            "en": "Stress testing in cardiology: from indications to decisions"
        },
        "slug": "nagruzochnoe-testirovanie-v-kardiologii",
        "format": "online",
        "can_record": False,
        "record_status": "stress_test",
        "keywords": ["нагрузочное тестирование"]
    },
    "К010": {
        "title": {
            "ru": "Психотропные препараты в кардиологии: где заканчивается помощь и начинается риск?",
            "kk": "Кардиологиядағы психотроптық дәрілер",
            "en": "Psychotropic drugs in cardiology"
        },
        "slug": "psihotropnye-preparaty-v-kardiologii",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["психотропные препараты"]
    },
    "К011": {
        "title": {
            "ru": "Спирография в клинической практике: интерпретация без ошибок",
            "kk": "Спирография клиникалық практикада: қателеспей түсіндіру",
            "en": "Spirometry in clinical practice: interpretation without errors"
        },
        "slug": "spirografiya-v-klinicheskoi-praktike",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["спирография"]
    },
    "К012": {
        "title": {
            "ru": "Функциональная диагностика 24/7: клинические нюансы Холтера и СМАДа",
            "kk": "Функционалдық диагностика 24/7: Холтер мен СМАД-тың клиникалық қыр-сыры",
            "en": "Functional diagnostics 24/7: clinical nuances of Holter and ABPM"
        },
        "slug": "funktsionalnaya-diagnostika-24-7",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["функциональная диагностика 24/7"]
    },
    "К013": {
        "title": {
            "ru": "Школа активного мозга (Для врачей и вдумчивых пациентов)",
            "kk": "Белсенді ми мектебі",
            "en": "Active Brain School"
        },
        "slug": "shkola-aktivnogo-mozga",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["школа активного мозга"]
    },
    "К014": {
        "title": {
            "ru": "Сложные ВПС простым языком: что должен знать каждый врач",
            "kk": "Күрделі туа біткен жүрек ақаулары қарапайым тілмен",
            "en": "Complex CHD in simple terms"
        },
        "slug": "slozhnye-vps-prostym-yazykom",
        "format": "offline",
        "can_record": True,
        "record_status": "available",
        "keywords": ["сложные впс"]
    },
    "К016": {
        "title": {
            "ru": "Гипертензивные расстройства и др. во время беременности",
            "kk": "Жүктілік кезіндегі гипертензиялық бұзылыстар",
            "en": "Hypertensive disorders in pregnancy"
        },
        "slug": "gipertenzivnye-rasstroistva-i-dr-vo-vremya-beremennosti",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["гипертензивные расстройства"]
    },
    "К018": {
        "title": {
            "ru": "Сердечно-сосудистое здоровье женщины",
            "kk": "Әйелдің жүрек-қан тамырлары денсаулығы",
            "en": "Women's cardiovascular health"
        },
        "slug": "serdechno-sosudistoe-zdorove-zhenschiny",
        "format": "online",
        "can_record": True,
        "record_status": "available",
        "keywords": ["сердечно-сосудистое здоровье женщины", "здоровье женщины"]
    },
}

K002_FULL_PROGRAM = """Разберём основные показатели, суточные профили АД, нарушения ритма и проводимости, артефакты и типичные ошибки. Отдельно рассмотрим сложные клинические ситуации и особенности исследований у разных групп пациентов.

Главный акцент - практическая интерпретация и разбор реальных кейсов, чтобы результаты СМАД и Холтера помогали врачу принимать клинические решения.

Программа курса «Как читать холтер и СМАД, чтобы не ошибаться?»:

Модуль ABPM (СМАД). Базис
* Назначение СМАД: показания по современным рекомендациям, подготовка пациента (режим дня, дневник, ограничения)
* Технические моменты: выбор манжеты, частота измерений, типичные артефакты
* «Эффект белого халата» и маскированная гипертензия
* Что измеряет СМАД: среднесуточное, дневное и ночное АД, вариабельность, индекс времени (нагрузка давлением)
* Алгоритм интерпретации: проверка качества записи (достаточное число измерений, наличие ночных данных), средние значения за сутки, день и ночь
* Суточный профиль АД (dipper, non-dipper, night-peaker), значение ночного давления, вариабельности и утреннего подъёма
* Типичные ошибки отчётов и как писать заключение, которое помогает врачу

Модуль ABPM PRO (СМАД). Продвинутый уровень интерпретации
* Non-dipper, over-dipper, night-peaker: клиническое значение
* Ночная гипертензия как независимый фактор риска, связь с инсультом, гипертрофией ЛЖ, ХБП
* Ортостатическая гипотензия при артериальной гипертонии, особенности по СМАД
* Особые группы: пожилые (жёсткие сосуды, вариабельность), пациенты с ожирением, беременные, пациенты с ХБП и аритмиями (ограничения метода)
* Где СМАД может «ошибаться»

Модуль HM ECG. Холтеровское мониторирование. Базис
* Назначение Холтера: когда он действительно нужен, а когда бесполезен
* Программное и аппаратное обеспечение, методика проведения, подготовка пациента
* Технические аспекты и ошибки установки (электроды, программирование), роль дневника пациента
* Этапы анализа и формирования заключения, оценка артефактов
* Нормы и «псевдопатология»: что не требует лечения
* Оценка ЧСС, циркадного индекса, вариабельности сердечного ритма
* Нарушения ритма и клинически значимые находки: экстрасистолия, паузы, ишемические изменения
* Частые ошибки интерпретации и гипердиагностика

Модуль HM ECG PRO. Продвинутый уровень интерпретации
* Нарушения ритма: синусовая аритмия, брадикардия, миграция водителя ритма
* Фибрилляция и трепетание предсердий
* Суправентрикулярные и желудочковые аритмии: экстрасистолия, эктопические ритмы
* Нарушения проводимости: синоатриальная и атриовентрикулярная блокады, блокады ножек пучка Гиса
* ХМЭКГ в диагностике ишемии миокарда: безболевая ишемия, вариантная стенокардия
* ХМЭКГ при синдроме слабости синусового узла и ВПВ

Модуль MIX PRO
* Разбор реальных кейсов по ХМЭКГ и СМАДу"""

TEACHER_NORM = {
    "инна евгеньевна": "Лещинская-Попова Инна Евгеньевна\nОснователь центра Doctrine, врач-кардиолог с 20-летним стажем",
    "дилафруз муратжановна": "Халикназарова Дилафруз Муратжановна\nВрач-кардиолог высшей категории, врач ультразвуковой диагностики",
    "мария васильевна": "Фурман Мария Васильевна\nВрач-кардиолог, кандидат медицинских наук, специалист по кардиоонкологии",
    "алмаз темирбаевич": "Темирбаев Алмаз Темирбаевич\nПрактикующий кардиолог, автор методики обучения ЭКГ",
    "гузель рахматовна": "Алиева Гузель Рахматовна\nВрач-кардиолог высшей категории, специалист по функциональной диагностике и ЭКС",
    "саида юсуфовна, инна евгеньевна, карлыгаш болатовна": "Азим Саида Юсуфовна, Лещинская-Попова Инна Евгеньевна, Хахазова Карлыгаш Болатовна\nВрачи-кардиологи, специалисты по Холтеру и СМАД",
}

def norm_teacher(t):
    clean_t = clean(t)
    low = clean_t.lower().strip().rstrip(",;")
    return TEACHER_NORM.get(low, clean_t)

def find_canonical_cid(title, existing_cid=None):
    if existing_cid and existing_cid in CANONICAL_COURSES:
        return existing_cid
    t_norm = norm_title(title)
    for cid, info in CANONICAL_COURSES.items():
        for kw in info["keywords"]:
            if kw in t_norm:
                return cid
    return existing_cid

# ---- NEW schedule format: single sheet with columns
# month | course name | prof name | description | time | date | price (Тенге) | credits | format
# Dates are day numbers inside the given month(s); empty month cells inherit
# the previous row (merged cells). Each day becomes one session; rows with the
# same course name are grouped into one course. Year = current year.
NEW_MONTHS = {"январь": 1, "января": 1, "февраль": 2, "февраля": 2,
              "март": 3, "марта": 3, "апрель": 4, "апреля": 4, "май": 5,
              "мая": 5, "июнь": 6, "июня": 6, "июль": 7, "июля": 7,
              "август": 8, "августа": 8, "сентябрь": 9, "сентября": 9,
              "октябрь": 10, "октября": 10, "ноябрь": 11, "ноября": 11,
              "декабрь": 12, "декабря": 12}
NEW_MONTH_ABBR = {"янв": 1, "фев": 2, "мар": 3, "апр": 4, "май": 5, "мая": 5,
                  "июн": 6, "июл": 7, "авг": 8, "сен": 9, "сент": 9,
                  "окт": 10, "ноя": 11, "нояб": 11, "дек": 12}

def new_month_num(name):
    t = norm_title(name).replace(".", "")
    for k, v in NEW_MONTHS.items():
        if k in t:
            return v
    for k, v in NEW_MONTH_ABBR.items():
        if k in t:
            return v
    return None

def new_day_list(v):
    # "09, 11, 12" or "29 (сен)\n01 (окт)" or "26, 29 (окт)\n2, 5, 9, 12, 16, 19 (нояб)"
    out = []
    for ln in str(v or "").replace("—", "-").split("\n"):
        ln = ln.strip()
        if not ln:
            continue
        line_mon_match = re.search(r"\(([^)]+)\)", ln)
        line_mon = new_month_num(line_mon_match.group(1)) if line_mon_match else None
        for part in ln.split(","):
            part = part.strip()
            if not part:
                continue
            m = re.match(r"(\d{1,2})\s*(?:\(([^)]+)\))?", part)
            if not m:
                continue
            part_mon = new_month_num(m.group(2)) if m.group(2) else None
            mon = part_mon or line_mon
            out.append((int(m.group(1)), mon))
    return out

def new_time_map(v):
    # "19:00 (09, 11)\n11:00 (12)" -> ({9: '19:00', 11: '19:00', 12: '11:00'}, '')
    # bare "17:00" -> ({}, '17:00'); "n/a"/empty -> ({}, '')
    # dots ("19.00") are normalized to colons
    mapping, default = {}, ""
    for ln in str(v or "").split("\n"):
        ln = ln.strip()
        if not ln or ln.lower() == "n/a":
            continue
        m = re.match(r"(\d{1,2})[:.](\d{2})\s*(?:\(([^)]+)\))?", ln)
        if not m:
            continue
        tm = f"{m.group(1)}:{m.group(2)}"
        if m.group(3):
            for d in re.findall(r"\d{1,2}", m.group(3)):
                mapping[int(d)] = tm
        else:
            default = tm
    return mapping, default

def new_price(v):
    t = clean(v)
    if not t or t.lower() in ("n/a", "-", "—"):
        return ""
    m = re.match(r"^(\d{1,3})\.(\d{3})$", t)
    if m:
        return f"{m.group(1)} {m.group(2)}KZT"
    if re.match(r"^[\d\s]+$", t):
        return t + "KZT"
    return t

def new_format(v):
    t = norm_title(v)
    if any(w in t for w in ["офлайн", "оффлайн", "очно", "аудитор"]):
        return "offline"
    return "online"

def build_new_courses_by_cid(path):
    import datetime
    year = datetime.date.today().year
    with open(path, encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))
    last_month = ""
    flows = []
    for r in rows:
        title = clean(r.get("course name"))
        if not title:
            continue
        mon = clean(r.get("month")) or last_month
        if clean(r.get("month")):
            last_month = clean(r.get("month"))
        flows.append((title, r, mon))
    
    by_cid = {}
    sid_n = 0
    for title, r, mon in flows:
        cid = find_canonical_cid(title)
        if not cid:
            continue
        sessions = []
        fmt = new_format(r.get("format"))
        default_mon = new_month_num(mon.split("-")[0])
        tmap, tdefault = new_time_map(r.get("time"))
        teacher = norm_teacher(r.get("prof name"))
        price = new_price(r.get("price (Тенге)"))
        hours = clean(r.get("credits"))
        desc_text = clean_ml(r.get("description"))
        if cid == "К002" and "Модуль ABPM" not in desc_text:
            desc_text = clean_ml(K002_FULL_PROGRAM)
        desc = tr_desc(desc_text)
        ctitle = CANONICAL_COURSES.get(cid, {}).get("title") or {"ru": title, "kk": title, "en": title}

        for day, mon_ov in new_day_list(r.get("date")):
            mnum = mon_ov or default_mon
            if not mnum or not (1 <= day <= 31):
                continue
            try:
                datetime.date(year, mnum, day)
            except ValueError:
                continue
            sid_n += 1
            tm = tmap.get(day, tdefault)
            ds = f"{day}.{mnum:02d}.{year}" + (f" - {tm}" if tm else "")
            sessions.append({
                "sid": f"Н{sid_n:03d}",
                "kind": "Обычный",
                "title": dict(ctitle),
                "desc": desc,
                "teacher": teacher,
                "hours": hours,
                "dates": ds,
                "price": price,
                "module_price": "",
                "month": mon,
            })
        if not sessions:
            continue
        if cid not in by_cid:
            by_cid[cid] = []
        by_cid[cid].append({
            "month": mon,
            "sessions": sessions,
            "fmt": fmt,
            "hours": hours,
            "price": price,
            "teacher": teacher,
            "desc": desc,
        })
    return by_cid

NEW_SCHED = os.path.join(ORIG, "schedule_new.csv")

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

def en_terms(s):
    """Replace Cyrillic cardiology terms left in EN texts (with declensions)."""
    s = re.sub(r"ХМ-?ЭКГ", "Holter ECG", s)
    s = re.sub(r"[Хх]олтер[а-яё]*", "Holter", s)
    s = re.sub(r"СМАД[А-Я]*|Смад[а-я]*|смад[а-я]*", "ABPM", s)
    s = s.replace("ЭКГ", "ECG").replace("экг", "ECG")
    return s

_TR_TABLE = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "ә": "a", "ғ": "gh", "қ": "q", "ң": "ng", "ө": "o", "ұ": "u", "ү": "u",
    "һ": "h", "і": "i"}

def translit_en(s):
    """Cyrillic (RU/KZ) name -> Latin for the EN version."""
    out = []
    for ch in str(s or ""):
        low = ch.lower()
        if low in _TR_TABLE:
            lat = _TR_TABLE[low]
            if ch.isupper():
                lat = lat[:1].upper() + lat[1:]
            out.append(lat)
        else:
            out.append(ch)
    return "".join(out)

def tr_name(nm):
    nm = nm or ""
    return {"ru": nm, "kk": nm, "en": translit_en(nm)}

def tr_sess_title(s_title, course_title):
    rt = s_title or ""
    if rt == course_title["ru"]:
        return dict(course_title)
    hit = SESSION_TITLE_TR.get(rt.strip())
    if hit:
        return {"ru": rt, "kk": hit["kk"], "en": hit["en"]}
    return {"ru": rt, "kk": rt, "en": rt}

def tr_desc(d):
    """RU description -> {ru, kk, en} dict (fallback: RU for all)."""
    d = d or ""
    hit = DESC_TR.get(d.strip())
    if hit:
        return {"ru": d, "kk": hit["kk"], "en": en_terms(hit["en"])}
    return {"ru": d, "kk": d, "en": d}

def tr_teacher_field(tid, field, base):
    hit = TEACH.get(f"T{tid}", {}).get(field)
    if hit:
        return {"ru": base, "kk": hit["kk"], "en": en_terms(hit["en"])}
    return {"ru": base, "kk": base, "en": base}

# Old-catalog titles missing from TITLE_I18N (keys in pool are latin K007..)
for _k, _v in TITLES.items():
    TITLE_I18N.setdefault("К" + _k[1:], {"kk": _v["kk"], "en": _v["en"]})

for t in teachers_csv:
    if not clean(t.get("name")) or not clean(t.get("photo")):
        continue
    photo = photo_renames.get(clean(t["photo"]), os.path.basename(clean(t["photo"])))
    teach_map[clean(t["name"]).replace("  ", " ")] = t["id"]
    tid = clean(t["id"])
    tname = clean(t["name"])
    teachers.append({
        "id": tid,
        "name": tr_name(tname),
        "spec": tr_teacher_field(tid, "spec", na(t["spec"])),
        "work": tr_teacher_field(tid, "work", na(t["work"])),
        "exp": tr_teacher_field(tid, "exp", na(t["exp"])),
        "photo": "../assets/img/" + photo,
        "about": tr_teacher_field(tid, "about", clean_ml(t["about"])),
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
import datetime
today_iso = datetime.date.today().isoformat()

new_by_cid = build_new_courses_by_cid(NEW_SCHED) if os.path.exists(NEW_SCHED) else {}
if new_by_cid:
    print(f"new schedule parsed: {len(new_by_cid)} canonical courses from {os.path.basename(NEW_SCHED)}")

for cid, cinfo in CANONICAL_COURSES.items():
    ctitle = cinfo["title"]
    fmt = cinfo["format"]
    can_record = cinfo["can_record"]
    record_status = cinfo["record_status"]
    slug = cinfo["slug"]

    sessions = []
    if cid in new_by_cid:
        intakes = new_by_cid[cid]
        def intake_latest(it):
            l = ""
            for s in it["sessions"]:
                for dt in parse_dates(s["dates"]):
                    iso = latest_iso([dt])
                    if iso > l:
                        l = iso
            return l
        intakes.sort(key=lambda it: (intake_latest(it) >= today_iso, intake_latest(it)), reverse=True)
        for it in intakes:
            sessions.extend(it["sessions"])
    else:
        items = [r for r in sched if r["_cid"] == cid or find_canonical_cid(r.get("Название курса")) == cid]
        items = [r for r in items if clean(r.get("ID Курса")) != "К015"]
        if items:
            for r in items:
                desc_text = clean_ml(r.get("Описание"))
                if cid == "К002" and "Модуль ABPM" not in desc_text:
                    desc_text = clean_ml(K002_FULL_PROGRAM)
                teacher_text = norm_teacher(clean_ml(r.get("Преподаватель")))
                sessions.append({
                    "sid": clean(r.get("ID Проведения")),
                    "kind": clean(r.get("Тип")),
                    "title": tr_sess_title(clean(r.get("Название курса")), ctitle),
                    "desc": tr_desc(desc_text),
                    "teacher": teacher_text,
                    "hours": clean(r.get("Часы/ЗЕ")),
                    "dates": clean_ml(r.get("Дата и время")),
                    "price": clean(r.get("Цена курса")),
                    "module_price": clean(r.get("Цена модуля")),
                    "month": clean(r.get("Месяц")),
                })

    if not sessions:
        continue

    latest = ""
    open_ended = False
    for s in sessions:
        blob = norm_title(s["dates"])
        if "по мере" in blob or "запис" in blob:
            open_ended = True
        for dt in parse_dates(s["dates"]):
            iso = latest_iso([dt])
            if iso > latest:
                latest = iso

    is_archived = True
    if latest and latest >= today_iso:
        is_archived = False

    courses.append({
        "id": cid,
        "slug": slug,
        "title": ctitle,
        "format": fmt,
        "cover": "zaglushka",
        "latest": latest,
        "open": open_ended,
        "archived": is_archived,
        "can_record": can_record,
        "record_status": record_status,
        "sessions": sessions,
    })

active_courses = [c for c in courses if not c["archived"]]
archived_courses = [c for c in courses if c["archived"]]
active_courses.sort(key=lambda c: c["latest"] or "")
archived_courses.sort(key=lambda c: c["latest"] or "", reverse=True)
courses = active_courses + archived_courses

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
    base = "https://doctrine-kz-default-rtdb.europe-west1.firebasedatabase.app"
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
