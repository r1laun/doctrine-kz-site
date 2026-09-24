"""Static site generator: RU + KK + EN pages with SEO prerender from data JSON.
Run: python3 tools/build.py
Output: docs/{ru,kk,en}/*.html + sitemap/robots/root index.
"""
import json, os, html, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from i18n_data import FRAGS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
DATA = os.path.join(DOCS, "data")

with open(os.path.join(DATA, "courses.json"), encoding="utf-8") as f:
    COURSES = json.load(f)
with open(os.path.join(DATA, "teachers.json"), encoding="utf-8") as f:
    TEACHERS = json.load(f)
with open(os.path.join(DATA, "site.json"), encoding="utf-8") as f:
    SITE = json.load(f)
try:
    with open(os.path.join(DATA, "reviews.json"), encoding="utf-8") as f:
        REVIEWS = json.load(f)
except FileNotFoundError:
    REVIEWS = []

FORM = SITE["form_url"]
WA = SITE["whatsapp"]
IG = SITE["instagram"]

T = {
    "ru": {
        "nav": [("index.html", "Главная"), ("schedule.html", "Расписание"), ("teachers.html", "Преподаватели")],
        "meta_desc": "Doctrine - обучение врачей в Алматы и онлайн: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Курсы и вебинары для медиков Казахстана.",
        "hero_eye": "Образовательный центр для врачей · Алматы",
        "hero_h1": "Глубокие знания от сердца к сердцу",
        "hero_h1_a": "Глубокие знания",
        "hero_h1_b": "от сердца к сердцу",
        "hero_p": "Меня зовут Инна Евгеньевна - я основатель Doctrine и врач-кардиолог с 20-летним опытом обучения врачей. Наши преподаватели - практикующие клиницисты. Учим тому, что работает у постели пациента.",
        "cta_sched": "Смотреть расписание", "cta_reg": "Записаться на обучение",
        "trust": [("200+", "выданных сертификатов"), ("10+", "курсов"),
                  ("300+", "врачей в комьюнити")],
        "hero_badge": "лет опыта",
        "pop": "Ближайшие курсы", "pop_sub": "Цены, даты и часы - из актуального расписания центра.",
        "all_sched": "Всё расписание →", "all_teachers": "Все преподаватели →", "formats": "Форматы обучения",
        "formats_sub": "Онлайн из любой точки мира или офлайн в Алматы.",
        "online_h": "Онлайн", "online_t": "Вебинары в прямом эфире и курсы в записи. Сертификат и зачётные единицы (ЗЕ) - как на очных программах.",
        "offline_h": "Офлайн", "offline_t": "Семинары и мастер-классы в Алматы: живая практика, разбор кейсов, общение с экспертами.",
        "detail": "Подробнее →", "enroll": "Записаться",
        "teachers_h": "Преподаватели", "teachers_sub": "Клиницисты с большим практическим опытом.",
        "reviews_h": "Отзывы", "reviews_sub": "Настоящие отзывы наших слушателей.",
        "rev_name_ph": "Ваше имя", "rev_course_ph": "Какой курс прошли",
        "rev_text_ph": "Ваш отзыв…", "rev_send": "Отправить отзыв",
        "rev_note": "Отзыв сразу появится на сайте.",
        "rev_empty": "Пока отзывов нет - станьте первым!", "faq_h": "Частые вопросы",
        "faq": [("Выдаёте ли сертификат?", "Да. После завершения программы вы получаете сертификат центра; по ряду вебинаров начисляются зачётные единицы (ЗЕ). Детали указаны в карточке каждого курса."),
                ("Как записаться?", "Нажмите «Записаться» - откроется анкета участника (Google Form). Заполните её, мы свяжемся с вами в WhatsApp и подтвердим место."),
                ("Как проходит онлайн?", "Вебинары идут в прямом эфире + доступны в записи. Ссылка и материалы приходят на email и в WhatsApp."),
                ("Где проходят офлайн-занятия?", "В Алматы. Точный адрес каждой группы уточняйте у координатора в WhatsApp."),
                ("Можно ли оплатить частями?", "Напишите нам в WhatsApp - подберём удобный вариант.")],
        "contacts_h": "Контакты", "addr_label": "Адрес",
        "sched_h": "Расписание", "sched_sub": "Все курсы и модули центра. Нажмите «Записаться» - откроется анкета.",
        "filter_all": "Все", "filter_online": "Онлайн", "filter_offline": "Офлайн",
        "sort_new": "Сначала новые", "sort_old": "Сначала старые",
        "course_h": "Программа курса", "back": "← Назад к расписанию",
        "offer_h": "Публичная оферта", "offer_t": "Договор публичной оферты на оказание образовательных услуг опубликован на сайте центра. Полный текст уточняйте у координатора - страница в процессе переноса с оригинального сайта.",
        "footer_about": "Образовательный центр для врачей. Онлайн и офлайн в Алматы.",
        "rights": "Все права защищены.", "teachers_page_sub": "Нажмите «Подробнее», чтобы узнать о каждом.",
        "menu_h": "Меню", "fmt_online": "Онлайн", "fmt_offline": "Офлайн",
        "search_ph": "Найти курс или преподавателя…", "shown": "Показано",
        "archive_h": "Архив", "archive_sub": "Прошедшие курсы — набор в эти группы завершён.",
        "past_badge": "Завершён", "next_stream": "Следующий поток →",
        "founder_alt": "Основатель центра Doctrine",
    },
    "kk": {
        "nav": [("index.html", "Басты бет"), ("schedule.html", "Кесте"), ("teachers.html", "Оқытушылар")],
        "meta_desc": "Doctrine - Алматыда және онлайн дәрігерлерді оқыту: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Қазақстан медиктеріне арналған курстар.",
        "hero_eye": "Дәрігерлерге арналған білім орталығы · Алматы",
        "hero_h1": "Жүректен жүрекке терең білім",
        "hero_h1_a": "Жүректен жүрекке",
        "hero_h1_b": "терең білім",
        "hero_p": "Менің атым Инна Евгеньевна - Doctrine негізін қалаушы, кардиолог, дәрігерлерді оқытудағы 20 жылдық тәжірибем бар. Оқытушыларымыз - тәжірибелі клиницистер.",
        "cta_sched": "Кестені көру", "cta_reg": "Оқуға жазылу",
        "trust": [("200+", "берілген сертификат"), ("10+", "курс"),
                  ("300+", "комьюнитидегі дәрігер")],
        "hero_badge": "жыл тәжірибе",
        "pop": "Жақын курстар", "pop_sub": "Бағалар, күндер мен сағаттар - орталықтың өзекті кестесінен.",
        "all_sched": "Барлық кесте →", "all_teachers": "Барлық оқытушылар →", "formats": "Оқыту форматтары",
        "formats_sub": "Әлемнің кез келген нүктесінен онлайн немесе Алматыда офлайн.",
        "online_h": "Онлайн", "online_t": "Тікелей эфирдегі вебинарлар және жазбадағы курстар. Сертификат және сынақ бірліктері (ЗЕ) беріледі.",
        "offline_h": "Офлайн", "offline_t": "Алматыдағы семинарлар мен мастер-класстар: тәжірибе, кейс талдау, сарапшылармен кездесу.",
        "detail": "Толығырақ →", "enroll": "Жазылу",
        "teachers_h": "Оқытушылар", "teachers_sub": "Үлкен тәжірибесі бар клиницистер.",
        "reviews_h": "Пікірлер", "reviews_sub": "Тыңдаушыларымыздың нақты пікірлері.",
        "rev_name_ph": "Атыңыз", "rev_course_ph": "Қай курстан өттіңіз",
        "rev_text_ph": "Пікіріңіз…", "rev_send": "Пікір жіберу",
        "rev_note": "Пікір сайтта бірден шығады.",
        "rev_empty": "Пікірлер әлі жоқ - бірінші болыңыз!", "faq_h": "Жиі қойылатын сұрақтар",
        "faq": [("Сертификат беріле ме?", "Иә. Бағдарлама соңында орталық сертификаты беріледі; кейбір вебинарларға сынақ бірліктері (ЗЕ) есептеледі."),
                ("Қалай жазыламын?", "«Жазылу» батырмасын басыңыз - қатысушы сауалнамасы (Google Form) ашылады. Толтырыңыз, WhatsApp арқылы хабарласамыз."),
                ("Онлайн қалай өтеді?", "Вебинарлар тікелей эфирде + жазбада қолжетімді. Сілтеме email мен WhatsApp-қа келеді."),
                ("Офлайн сабақтар қайда?", "Алматыда. Нақты мекенжайды WhatsApp арқылы координатордан сұраңыз."),
                ("Бөліп төлеуге бола ма?", "WhatsApp-қа жазыңыз - ыңғайлы нұсқа табамыз.")],
        "contacts_h": "Байланыс", "addr_label": "Мекенжай",
        "sched_h": "Кесте", "sched_sub": "Орталықтың барлық курстары мен модульдері.",
        "filter_all": "Барлығы", "filter_online": "Онлайн", "filter_offline": "Офлайн",
        "sort_new": "Алдымен жаңалар", "sort_old": "Алдымен ескілер",
        "course_h": "Курс бағдарламасы", "back": "← Кестеге оралу",
        "offer_h": "Жария оферта", "offer_t": "Білім беру қызметтері туралы жария оферта мәтіні координатордан сұралады - бет түпнұсқа сайттан көшірілуде.",
        "footer_about": "Дәрігерлерге арналған білім орталығы. Алматыда онлайн және офлайн.",
        "rights": "Барлық құқықтар қорғалған.", "teachers_page_sub": "Әрқайсысы туралы білу үшін «Толығырақ» басыңыз.",
        "menu_h": "Мәзір", "fmt_online": "Онлайн", "fmt_offline": "Офлайн",
        "search_ph": "Курс немесе оқытушыны іздеу…", "shown": "Көрсетілді",
        "archive_h": "Мұрағат", "archive_sub": "Өткен курстар — бұл топтарға қабылдау аяқталды.",
        "past_badge": "Аяқталды", "next_stream": "Келесі ағын →",
        "founder_alt": "Doctrine орталығының негізін қалаушы",
    },
    "en": {
        "nav": [("index.html", "Home"), ("schedule.html", "Schedule"), ("teachers.html", "Faculty")],
        "meta_desc": "Doctrine - physician training in Almaty and online: cardiology, ECG, Holter, ABPM, Echo. Courses and webinars for doctors in Kazakhstan.",
        "hero_eye": "Education centre for physicians · Almaty",
        "hero_h1": "Deep knowledge from heart to heart",
        "hero_h1_a": "Deep knowledge",
        "hero_h1_b": "from heart to heart",
        "hero_p": "I'm Inna Leshinskaya-Popova - founder of Doctrine and a cardiologist with 20 years of physician training experience. Our teachers are practising clinicians.",
        "cta_sched": "View schedule", "cta_reg": "Enroll now",
        "trust": [("200+", "certificates issued"), ("10+", "courses"),
                  ("300+", "doctors in our community")],
        "hero_badge": "years of experience",
        "pop": "Upcoming courses", "pop_sub": "Prices, dates and hours from the centre's live schedule.",
        "all_sched": "Full schedule →", "all_teachers": "All faculty →", "formats": "Learning formats",
        "formats_sub": "Online from anywhere or offline in Almaty.",
        "online_h": "Online", "online_t": "Live webinars and recorded courses. Certificate and credit units included, same as offline programs.",
        "offline_h": "Offline", "offline_t": "Seminars and masterclasses in Almaty: hands-on practice, case discussions, meeting the experts.",
        "detail": "Details →", "enroll": "Enroll",
        "teachers_h": "Faculty", "teachers_sub": "Clinicians with extensive hands-on experience.",
        "reviews_h": "Reviews", "reviews_sub": "Real feedback from our learners.",
        "rev_name_ph": "Your name", "rev_course_ph": "Which course you took",
        "rev_text_ph": "Your review…", "rev_send": "Send review",
        "rev_note": "Your review appears on the site instantly.",
        "rev_empty": "No reviews yet - be the first!", "faq_h": "FAQ",
        "faq": [("Do you issue a certificate?", "Yes. You receive a centre certificate; selected webinars grant credit units. See each course card for details."),
                ("How do I enroll?", "Click “Enroll” - a participant form (Google Form) opens. Fill it in and we will contact you on WhatsApp."),
                ("How does online work?", "Live webinars + recordings. Links and materials arrive by email and WhatsApp."),
                ("Where are offline classes?", "In Almaty. Ask the coordinator on WhatsApp for the exact venue."),
                ("Can I pay in installments?", "Message us on WhatsApp - we will find a suitable option.")],
        "contacts_h": "Contacts", "addr_label": "Address",
        "sched_h": "Schedule", "sched_sub": "All courses and modules of the centre. Click enroll to open the form.",
        "filter_all": "All", "filter_online": "Online", "filter_offline": "Offline",
        "sort_new": "Newest first", "sort_old": "Oldest first",
        "course_h": "Course program", "back": "← Back to schedule",
        "offer_h": "Public offer", "offer_t": "The public offer for educational services is available from the coordinator - this page is being migrated from the original site.",
        "footer_about": "Education centre for physicians. Online and offline in Almaty.",
        "rights": "All rights reserved.", "teachers_page_sub": "Click “Details” to learn about each teacher.",
        "menu_h": "Menu", "fmt_online": "Online", "fmt_offline": "Offline",
        "search_ph": "Search courses or teachers…", "shown": "Showing",
        "archive_h": "Archive", "archive_sub": "Past courses — enrollment for these groups is closed.",
        "past_badge": "Finished", "next_stream": "Next intake →",
        "founder_alt": "Founder of the Doctrine centre",
    },
}

LANGS = ["ru", "kk", "en"]
OTHER = {"ru": [("kk", "KZ"), ("en", "EN")], "kk": [("ru", "RU"), ("en", "EN")],
         "en": [("ru", "RU"), ("kk", "KZ")]}

def esc(s):
    return html.escape(str(s or ""), quote=True)

def head(lang, title, desc):
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-07751DJT62"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-07751DJT62');
</script>
<title>{esc(title)} - Doctrine</title>
<meta name="description" content="{esc(desc)}">
<link rel="icon" href="../assets/img/logo.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/main.css">
</head>
<body>
"""

def header(lang, active, page="index.html"):
    t = T[lang]
    links = "".join(
        f'<a href="{href}" class="{"active" if href == active else ""}">{esc(label)}</a>'
        for href, label in t["nav"])
    langs = "".join(
        f'<a href="../{l}/{page}" data-langlink class="{"active" if l == lang else ""}">{lbl}</a>'
        for l, lbl in [("ru", "RU"), ("kk", "KZ"), ("en", "EN")])
    return f"""<header class="site-header"><div class="header-inner">
<a class="logo" href="index.html"><img src="../assets/img/logo.jpg" alt="Doctrine logo"><span><b>Doctrine</b><small>{esc(SITE["tagline"][lang])}</small></span></a>
<nav class="nav" id="nav">{links}</nav>
<div class="lang">{langs}</div>
<a class="btn btn-header" href="{FORM}" target="_blank" rel="noopener">{esc(t["cta_reg"])}</a>
<button class="burger" id="burgerBtn" aria-label="Menu" aria-expanded="false">☰</button>
</div></header>
<main>
"""

def footer(lang):
    t = T[lang]
    nav = "".join(f'<div><a href="{h}">{esc(l)}</a></div>' for h, l in t["nav"])
    return f"""</main>
<footer><div class="container">
<div><h3>Doctrine</h3><p>{esc(t["footer_about"])}</p><small>ТОО «Образовательный центр DOCTRINE» · БИН {SITE["bin"]}</small><br><small>© <span data-year>2026</span> {esc(t["rights"])}</small></div>
<div><h4>{esc(t["menu_h"])}</h4>{nav}<div><a href="../files/public-offer.pdf" target="_blank" rel="noopener">{esc(t["offer_h"])} (PDF)</a></div></div>
<div><h4>{esc(t["contacts_h"])}</h4><div><a href="{WA}">WhatsApp: {esc(SITE["phone"])}</a></div><div><a href="{IG}">Instagram</a></div><div><small>{esc(SITE["address"][lang])}</small></div></div>
</div></footer>
<script src="../assets/js/main.js"></script>
</body>
</html>
"""

def plural_ru(n, one, few, many):
    n = abs(n) % 100
    d = n % 10
    if 11 <= n <= 19:
        return many
    if d == 1:
        return one
    if 2 <= d <= 4:
        return few
    return many

def sess_word(lang, n):
    if lang == "ru":
        return plural_ru(n, "занятие", "занятия", "занятий")
    if lang == "kk":
        return "сабақ"
    return "sessions"

def tname(x, lang):
    n = x.get("name", "")
    if isinstance(n, dict):
        return n.get(lang) or n.get("ru") or ""
    return n

def tr_hours(text, lang):
    if lang == "ru" or not text:
        return text or ""
    t = str(text)
    if lang == "kk":
        t = re.sub(r"часов|часа|ч\.", "сағ.", t)
    else:
        t = re.sub(r"часов|часа|ч\.", "h", t)
        t = t.replace("ЗЕ", "credits")
        t = re.sub(r"(\d),(\d)", r"\1.\2", t)
    return t

def tr_dates(text, lang):
    if lang == "ru" or not text:
        return text or ""
    out = []
    for ln in str(text).split("\n"):
        n = ln.lower().replace("ё", "е")
        if "по мере" in n:
            out.append("Топ құрылуына қарай" if lang == "kk" else "As the group forms")
        elif "курс в записи" in n:
            out.append("Жазбадағы курс" if lang == "kk" else "Recorded course")
        else:
            out.append(ln)
    return "\n".join(out)

DATE_RE = re.compile(r"(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})")

def sess_dates(s):
    out = []
    for d, m, y in DATE_RE.findall(s.get("dates") or ""):
        y = int(y)
        if y < 100:
            y += 2000
        try:
            out.append((y, int(m), int(d)))
        except ValueError:
            pass
    return sorted(out)

def is_open_text(v):
    t = str(v or "").lower().replace("ё", "е")
    return ("по мере" in t) or ("запис" in t)

def pick_display(c):
    """Session shown on the card: the FIRST session (earliest conduct).
    Price/hours fall back to other sessions if empty there."""
    sessions = c.get("sessions") or [{}]
    return sessions[0]

def first_nonempty(sessions, key):
    for s in sessions:
        v = (s.get(key) or "").strip()
        if v:
            return v
    return ""

_TR_LAT = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "ә": "a", "ғ": "gh", "қ": "q", "ң": "ng", "ө": "o", "ұ": "u", "ү": "u",
    "һ": "h", "і": "i"}

def translit_lat(s):
    out = []
    for ch in str(s or ""):
        low = ch.lower()
        if low in _TR_LAT:
            lat = _TR_LAT[low]
            out.append(lat[:1].upper() + lat[1:] if ch.isupper() else lat)
        else:
            out.append(ch)
    return "".join(out)

_FRAGS_NORM = {k.rstrip(",;"): v for k, v in FRAGS.items()}

def staff_text(c, lang):
    """All lecturers of the course for the hidden search index:
    RU names + lang variants + Latin transliteration for EN."""
    names = []
    for s in c.get("sessions") or []:
        line = (s.get("teacher") or "").strip().split("\n")[0].strip().rstrip(",;")
        if line and line not in names:
            names.append(line)
    extra = []
    for line in names:
        hit = _FRAGS_NORM.get(line)
        if hit and hit.get(lang) and hit[lang].rstrip(",;") not in names + extra:
            extra.append(hit[lang].rstrip(",;"))
    if lang == "en":
        for line in list(names) + list(extra):
            tr = translit_lat(line)
            if tr != line and tr not in names + extra:
                extra.append(tr)
    return ", ".join(names + extra)

def active_top(lang, n):
    """Top-n active (non-archived) courses for the home page."""
    pool = [c for c in COURSES if not c.get("archived")][:n]
    return course_cards(lang, pool=pool)

def course_cards(lang, limit=None, fmt=None, skip_archived=False, only_archived=False, pool=None):
    out = []
    items = pool if pool is not None else COURSES
    if limit is not None:
        items = items[:limit]
    for c in items:
        if fmt and c["format"] != fmt:
            continue
        if skip_archived and c.get("archived"):
            continue
        if only_archived and not c.get("archived"):
            continue
        title = c["title"].get(lang) or c["title"]["ru"]
        sessions = c.get("sessions") or [{}]
        disp = pick_display(c)
        price = (disp.get("price") or "").strip() or first_nonempty(sessions, "price")
        hours = tr_hours((disp.get("hours") or "").strip() or first_nonempty(sessions, "hours"), lang)
        dlines = tr_dates(disp.get("dates", "") or "", lang).split("\n")
        dates = dlines[0] + (f" (+{len(dlines) - 1})" if len(dlines) > 1 else "")
        n = len(c["sessions"])
        fmt_label = T[lang]["fmt_online"] if c["format"] == "online" else T[lang]["fmt_offline"]
        fmt_cls = "fmt-online" if c["format"] == "online" else "fmt-offline"
        ts = (c.get("latest") or "").replace("-", "")
        open_attr = ' data-open="1"' if c.get("open") else ""
        is_arch = bool(c.get("archived"))
        past_badge = f'<span class="badge badge-past">{esc(T[lang]["past_badge"])}</span>' if is_arch else ""
        enroll_btn = (f'<a class="btn btn-primary" href="{WA}" target="_blank" rel="noopener">{esc(T[lang]["next_stream"])}</a>' if is_arch
                      else f'<a class="btn btn-primary" href="{FORM}?usp=pp_url&entry_course={c["id"]}" target="_blank" rel="noopener">{esc(T[lang]["enroll"])}</a>')
        out.append(f"""<div class="card{' is-past' if is_arch else ''}" data-fmt="{c["format"]}" data-ts="{ts}"{open_attr}>
<div class="card-body">
<div class="badges">{past_badge}<span class="badge format {fmt_cls}">{esc(fmt_label)}</span>{f'<span class="badge hours">{esc(hours)}</span>' if hours else ""}{f'<span class="badge">{n} {sess_word(lang, n)}</span>' if n > 1 else ""}</div>
<h3>{esc(title)}</h3>
<div class="meta">{esc(dates)}</div>
<div class="price">{esc(price) if price else "&nbsp;"}</div>
<span class="staff-index" hidden>{esc(staff_text(c, lang))}</span>
<a class="btn btn-ghost" href="course.html?id={c["id"]}">{esc(T[lang]["detail"])}</a>
{enroll_btn}
</div></div>""")
    return "\n".join(out)

def reviews_section(lang):
    t = T[lang]
    baked = json.dumps(REVIEWS[:12], ensure_ascii=False).replace("</", "<\\/")
    cards = ""
    for r in REVIEWS[:12]:
        initial = esc((r.get("name") or "?").strip()[:1].upper())
        who = f'<div class="review-person"><span class="review-ava">{initial}</span><span><b>{esc(r.get("name") or "-")}</b>'
        if r.get("course"):
            who += f'<small>{esc(r["course"])}</small>'
        who += "</span></div>"
        cards += (f'<div class="card review-card"><div class="card-body">'
                  f'<p class="review-text">“{esc(r["text"])}”</p>{who}</div></div>')
    if not cards:
        cards = f'<p class="sub">{esc(t["rev_empty"])}</p>'
    return f"""<section class="section reviews-sec"><div class="container">
<div class="reviews-head"><div><h2>{esc(t["reviews_h"])}</h2><p class="sub">{esc(t["reviews_sub"])}</p></div></div>
<div class="grid-3">{cards}</div>
<form class="review-form" id="reviewForm">
<div class="review-form-head"><h3>{esc(t["rev_send"])}</h3><p class="meta">{esc(t["rev_note"])}</p></div>
<div class="review-form-grid">
<input name="name" maxlength="80" placeholder="{esc(t["rev_name_ph"])} *" required>
<input name="course" maxlength="120" placeholder="{esc(t["rev_course_ph"])}">
</div>
<textarea name="text" maxlength="1000" placeholder="{esc(t["rev_text_ph"])} *" required></textarea>
<button class="btn btn-primary" type="submit">{esc(t["rev_send"])}</button>
</form>
</div></section>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
<script>
window.DOCTRINE_FB = {{
  apiKey: "AIzaSyAh3B_OLanMc70tt-RP6h4_ki1F7X9BeZk",
  authDomain: "doctrine-kz.firebaseapp.com",
  databaseURL: "https://doctrine-kz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "doctrine-kz"
}};
window.DOCTRINE_REVIEWS = {baked};
</script>
<script src="../assets/js/reviews.js"></script>"""

def contacts_section(lang):
    t = T[lang]
    return f"""<section class="section"><div class="container">
<h2>{esc(t["contacts_h"])}</h2>
<div class="contact-cards">
<div class="contact-card"><small>WhatsApp</small><a href="{WA}" target="_blank" rel="noopener">{esc(SITE["phone"])}</a></div>
<div class="contact-card"><small>Instagram</small><a href="{IG}" target="_blank" rel="noopener">doctrine_centre</a></div>
<div class="contact-card"><small>{esc(t["addr_label"])}</small><span>{esc(SITE["address"][lang])}</span></div>
<div class="contact-card"><small>Email</small><span>{esc(SITE["email"])}</span></div>
</div>
</div></section>"""

def faq_section(lang):
    t = T[lang]
    items = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>"
                    for q, a in t["faq"])
    return f'<section class="section"><div class="container faq"><h2>{esc(t["faq_h"])}</h2>{items}</div></section>'

def page_index(lang):
    t = T[lang]
    top_teachers = [x for tid in ("2", "5", "3")
                    for x in TEACHERS if x["id"] == tid]
    teach3 = "".join(
        f'<div class="card teacher-card"><img src="{x["photo"]}" alt="{esc(tname(x, lang))}" loading="lazy"><div class="card-body"><h3>{esc(tname(x, lang))}</h3><a class="btn btn-ghost" href="teachers.html">{esc(t["detail"])}</a></div></div>'
        for x in top_teachers)
    return (head(lang, t["hero_h1"], t["meta_desc"]) + header(lang, "index.html", "index.html") + f"""
<section class="hero"><div class="container hero-grid">
<div class="hero-photo"><img src="../assets/img/founder.jpg" alt="{esc(t["founder_alt"])}"><div class="hero-badge"><b>20+</b><span>{esc(t["hero_badge"])}</span></div></div>
<div><span class="hero-eyebrow">{esc(t["hero_eye"])}</span>
<h1>{esc(t["hero_h1_a"])}<br>{esc(t["hero_h1_b"])}</h1>
<p class="lead">{esc(t["hero_p"])}</p>
<div class="cta-row"><a class="btn btn-primary" href="schedule.html">{esc(t["cta_sched"])}</a>
<a class="btn btn-ghost" href="{FORM}" target="_blank" rel="noopener">{esc(t["cta_reg"])}</a></div>
</div></div></section>
<section class="trust"><div class="container trust-grid">
{"".join(f'<div class="trust-item"><b>{b}</b><span>{s}</span></div>' for b, s in t["trust"])}
</div></section>
<section class="section"><div class="container">
<h2>{esc(t["pop"])}</h2><p class="sub">{esc(t["pop_sub"])}</p>
<div class="grid-3" id="popGrid">{active_top(lang, 3)}</div>
<p><a class="btn btn-ghost" href="schedule.html">{esc(t["all_sched"])}</a></p>
</div></section>
<section class="section alt"><div class="container">
<h2>{esc(t["teachers_h"])}</h2><p class="sub">{esc(t["teachers_sub"])}</p>
<div class="grid-3">{teach3}</div>
<p><a class="btn btn-ghost" href="teachers.html">{esc(t["all_teachers"])}</a></p>
</div></section>
""" + reviews_section(lang) + faq_section(lang) + contacts_section(lang) + footer(lang))

def page_schedule(lang):
    t = T[lang]
    return (head(lang, t["sched_h"], t["meta_desc"]) + header(lang, "schedule.html", "schedule.html") + f"""
<section class="section"><div class="container">
<h1>{esc(t["sched_h"])}</h1><p class="sub">{esc(t["sched_sub"])}</p>
<div class="filters" role="group" aria-label="Filter">
<button data-filter="all" class="active">{esc(t["filter_all"])}</button>
<button data-filter="online">{esc(t["filter_online"])}</button>
<button data-filter="offline">{esc(t["filter_offline"])}</button>
<button data-sort="new" class="active">{esc(t["sort_new"])}</button>
<button data-sort="old">{esc(t["sort_old"])}</button>
<input id="courseSearch" type="search" placeholder="{esc(t["search_ph"])}" aria-label="{esc(t["search_ph"])}">
<span class="meta" id="courseCount"></span>
</div>
<div class="grid-3" id="courseGrid">{course_cards(lang, skip_archived=True)}</div>
<details class="archive" id="archiveBlock">
<summary>{esc(t["archive_h"])} (<span id="archiveCount">{len([c for c in COURSES if c.get("archived")])}</span>) — {esc(t["archive_sub"])}</summary>
<div class="grid-3" id="archiveGrid">{course_cards(lang, only_archived=True)}</div>
</details>
</div></section>
""" + contacts_section(lang) + footer(lang))

def page_course(lang):
    t = T[lang]
    ld = {
        "@context": "https://schema.org", "@type": "ItemList",
        "itemListElement": [
            {"@type": "Course", "name": c["title"].get(lang) or c["title"]["ru"],
             "provider": {"@type": "EducationalOrganization", "name": "Doctrine"}} 
            for c in COURSES[:10]],
    }
    return (head(lang, t["course_h"], t["meta_desc"]) + header(lang, "schedule.html", "course.html") + f"""
<section class="course-hero"><div class="container">
<a href="schedule.html">{esc(t["back"])}</a>
<div id="course-detail"><p>…</p></div>
<p><a class="btn btn-primary" href="{FORM}" target="_blank" rel="noopener">{esc(t["enroll"])}</a>
<a class="btn btn-ghost" href="{WA}" target="_blank" rel="noopener">WhatsApp</a></p>
</div></section>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script src="../assets/js/course.js"></script>
""" + footer(lang))

def page_teachers(lang):
    t = T[lang]
    close_l = {"ru": "Закрыть", "kk": "Жабу", "en": "Close"}[lang]
    cards = ""
    for x in TEACHERS:
        nm = tname(x, lang)
        cards += (f'<div class="card teacher-card teacher-open" data-teacher="{x["id"]}" role="button" tabindex="0" aria-haspopup="dialog">'
                  f'<img src="{x["photo"]}" alt="{esc(nm)}" loading="lazy">'
                  f'<div class="card-body"><h3>{esc(nm)}</h3>'
                  f'<span class="btn btn-ghost">{esc(t["detail"])}</span></div></div>')
    return (head(lang, t["teachers_h"], t["meta_desc"]) + header(lang, "teachers.html", "teachers.html") + f"""
<section class="section"><div class="container">
<h1>{esc(t["teachers_h"])}</h1><p class="sub">{esc(t["teachers_page_sub"])}</p>
<div class="teachers-grid">{cards}</div>
</div></section>
<div class="t-modal" id="teacherModal" role="dialog" aria-modal="true" hidden>
<div class="t-modal-overlay" data-close></div>
<div class="t-modal-window">
<button class="t-modal-close" data-close aria-label="{esc(close_l)}">×</button>
<div id="teacherModalBody"></div>
</div></div>
<script src="../assets/js/teachers.js"></script>
""" + contacts_section(lang) + footer(lang))

def page_404(lang):
    return (head(lang, "404", "Page not found") + header(lang, "", "404.html") +
            '<section class="section"><div class="container"><h1>404</h1><p><a href="index.html">← Home</a></p></div></section>' + footer(lang))

BUILDERS = {"index.html": page_index, "schedule.html": page_schedule,
            "course.html": page_course, "teachers.html": page_teachers,
            "404.html": page_404}

for lang in LANGS:
    d = os.path.join(DOCS, lang)
    os.makedirs(d, exist_ok=True)
    for name, fn in BUILDERS.items():
        with open(os.path.join(d, name), "w", encoding="utf-8") as f:
            f.write(fn(lang))

# root redirect + sitemap + robots
with open(os.path.join(DOCS, "index.html"), "w", encoding="utf-8") as f:
    f.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=ru/"></head><body><a href="ru/">ru</a></body></html>')
with open(os.path.join(DOCS, ".nojekyll"), "w") as f:
    f.write("")
BASE = "https://doctrine.kz"
urls = [f"{BASE}/{l}/{p}" for l in LANGS for p in
        ["index.html", "schedule.html", "course.html", "teachers.html"]]
with open(os.path.join(DOCS, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"<url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>")
with open(os.path.join(DOCS, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
print("built:", sum(1 for l in LANGS for _ in os.listdir(os.path.join(DOCS, l))), "pages")
