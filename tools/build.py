"""Static site generator: RU + KK + EN pages with SEO prerender from data JSON.
Run: python3 tools/build.py
Output: docs/{ru,kk,en}/*.html + sitemap/robots/root index.
"""
import json, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
DATA = os.path.join(DOCS, "data")

with open(os.path.join(DATA, "courses.json"), encoding="utf-8") as f:
    COURSES = json.load(f)
with open(os.path.join(DATA, "teachers.json"), encoding="utf-8") as f:
    TEACHERS = json.load(f)
with open(os.path.join(DATA, "site.json"), encoding="utf-8") as f:
    SITE = json.load(f)

FORM = SITE["form_url"]
WA = SITE["whatsapp"]
IG = SITE["instagram"]

T = {
    "ru": {
        "nav": [("schedule.html", "Расписание"), ("online.html", "Онлайн"),
                ("offline.html", "Офлайн"), ("teachers.html", "Преподаватели")],
        "meta_desc": "Doctrine — обучение врачей в Алматы и онлайн: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Курсы и вебинары для медиков Казахстана.",
        "hero_eye": "Образовательный центр для врачей · Алматы",
        "hero_h1": "Глубокие знания от сердца к сердцу",
        "hero_p": "Меня зовут Инна Евгеньевна — я основатель Doctrine и врач-кардиолог с 20-летним опытом обучения врачей. Наши преподаватели — практикующие клиницисты. Учим тому, что работает у постели пациента.",
        "cta_sched": "Смотреть расписание", "cta_reg": "Записаться на обучение",
        "trust": [("20+", "лет обучения врачей"), ("15", "курсов и модулей"),
                  ("5", "клиницистов-преподавателей"), ("16+", "часов и ЗЕ по топ-курсам")],
        "pop": "Ближайшие курсы", "pop_sub": "Цены, даты и часы — из актуального расписания центра.",
        "all_sched": "Всё расписание →", "formats": "Форматы обучения",
        "formats_sub": "Онлайн из любой точки мира или офлайн в Алматы.",
        "online_h": "Онлайн", "online_t": "Вебинары в прямом эфире и курсы в записи. Сертификат и зачётные единицы (ЗЕ) — как на очных программах.",
        "offline_h": "Офлайн", "offline_t": "Семинары и мастер-классы в Алматы: живая практика, разбор кейсов, общение с экспертами.",
        "detail": "Подробнее →", "enroll": "Записаться",
        "teachers_h": "Преподаватели", "teachers_sub": "Клиницисты с большим практическим опытом.",
        "reviews_h": "Отзывы", "faq_h": "Частые вопросы",
        "faq": [("Выдаёте ли сертификат?", "Да. После завершения программы вы получаете сертификат центра; по ряду вебинаров начисляются зачётные единицы (ЗЕ). Детали указаны в карточке каждого курса."),
                ("Как записаться?", "Нажмите «Записаться» — откроется анкета участника (Google Form). Заполните её, мы свяжемся с вами в WhatsApp и подтвердим место."),
                ("Как проходит онлайн?", "Вебинары идут в прямом эфире + доступны в записи. Ссылка и материалы приходят на email и в WhatsApp."),
                ("Где проходят офлайн-занятия?", "В Алматы. Точный адрес каждой группы уточняйте у координатора в WhatsApp."),
                ("Можно ли оплатить частями?", "Напишите нам в WhatsApp — подберём удобный вариант.")],
        "contacts_h": "Контакты", "addr_label": "Адрес",
        "sched_h": "Расписание", "sched_sub": "Все курсы и модули центра. Нажмите «Записаться» — откроется анкета.",
        "filter_all": "Все", "filter_online": "Онлайн", "filter_offline": "Офлайн",
        "course_h": "Программа курса", "back": "← Назад к расписанию",
        "offer_h": "Публичная оферта", "offer_t": "Договор публичной оферты на оказание образовательных услуг опубликован на сайте центра. Полный текст уточняйте у координатора — страница в процессе переноса с оригинального сайта.",
        "footer_about": "Образовательный центр для врачей. Онлайн и офлайн в Алматы.",
        "rights": "Все права защищены.", "teachers_page_sub": "Нажмите на карточку, чтобы узнать больше.",
    },
    "kk": {
        "nav": [("schedule.html", "Кесте"), ("online.html", "Онлайн"),
                ("offline.html", "Офлайн"), ("teachers.html", "Оқытушылар")],
        "meta_desc": "Doctrine — Алматыда және онлайн дәрігерлерді оқыту: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Қазақстан медиктеріне арналған курстар.",
        "hero_eye": "Дәрігерлерге арналған білім орталығы · Алматы",
        "hero_h1": "Жүректен жүрекке терең білім",
        "hero_p": "Менің атым Инна Евгеньевна — Doctrine негізін қалаушы, кардиолог, дәрігерлерді оқытудағы 20 жылдық тәжірибем бар. Оқытушыларымыз — тәжірибелі клиницистер.",
        "cta_sched": "Кестені көру", "cta_reg": "Оқуға жазылу",
        "trust": [("20+", "жыл дәрігерлерді оқыту"), ("15", "курс пен модуль"),
                  ("5", "клиницист-оқытушы"), ("16+", "сағат және ЗЕ")],
        "pop": "Жақын курстар", "pop_sub": "Бағалар, күндер мен сағаттар — орталықтың өзекті кестесінен.",
        "all_sched": "Барлық кесте →", "formats": "Оқыту форматтары",
        "formats_sub": "Әлемнің кез келген нүктесінен онлайн немесе Алматыда офлайн.",
        "online_h": "Онлайн", "online_t": "Тікелей эфирдегі вебинарлар және жазбадағы курстар. Сертификат және сынақ бірліктері (ЗЕ) беріледі.",
        "offline_h": "Офлайн", "offline_t": "Алматыдағы семинарлар мен мастер-класстар: тәжірибе, кейс талдау, сарапшылармен кездесу.",
        "detail": "Толығырақ →", "enroll": "Жазылу",
        "teachers_h": "Оқытушылар", "teachers_sub": "Үлкен тәжірибесі бар клиницистер.",
        "reviews_h": "Пікірлер", "faq_h": "Жиі қойылатын сұрақтар",
        "faq": [("Сертификат беріле ме?", "Иә. Бағдарлама соңында орталық сертификаты беріледі; кейбір вебинарларға сынақ бірліктері (ЗЕ) есептеледі."),
                ("Қалай жазыламын?", "«Жазылу» батырмасын басыңыз — қатысушы сауалнамасы (Google Form) ашылады. Толтырыңыз, WhatsApp арқылы хабарласамыз."),
                ("Онлайн қалай өтеді?", "Вебинарлар тікелей эфирде + жазбада қолжетімді. Сілтеме email мен WhatsApp-қа келеді."),
                ("Офлайн сабақтар қайда?", "Алматыда. Нақты мекенжайды WhatsApp арқылы координатордан сұраңыз."),
                ("Бөліп төлеуге бола ма?", "WhatsApp-қа жазыңыз — ыңғайлы нұсқа табамыз.")],
        "contacts_h": "Байланыс", "addr_label": "Мекенжай",
        "sched_h": "Кесте", "sched_sub": "Орталықтың барлық курстары мен модульдері.",
        "filter_all": "Барлығы", "filter_online": "Онлайн", "filter_offline": "Офлайн",
        "course_h": "Курс бағдарламасы", "back": "← Кестеге оралу",
        "offer_h": "Жария оферта", "offer_t": "Білім беру қызметтері туралы жария оферта мәтіні координатордан сұралады — бет түпнұсқа сайттан көшірілуде.",
        "footer_about": "Дәрігерлерге арналған білім орталығы. Алматыда онлайн және офлайн.",
        "rights": "Барлық құқықтар қорғалған.", "teachers_page_sub": "Толығырақ білу үшін карточканы басыңыз.",
    },
    "en": {
        "nav": [("schedule.html", "Schedule"), ("online.html", "Online"),
                ("offline.html", "Offline"), ("teachers.html", "Faculty")],
        "meta_desc": "Doctrine — physician training in Almaty and online: cardiology, ECG, Holter, ABPM, Echo. Courses and webinars for doctors in Kazakhstan.",
        "hero_eye": "Education centre for physicians · Almaty",
        "hero_h1": "Deep knowledge from heart to heart",
        "hero_p": "I'm Inna Leshinskaya-Popova — founder of Doctrine and a cardiologist with 20 years of physician training experience. Our teachers are practising clinicians.",
        "cta_sched": "View schedule", "cta_reg": "Enroll now",
        "trust": [("20+", "years training doctors"), ("15", "courses and modules"),
                  ("5", "clinician teachers"), ("16+", "hours & credits on top courses")],
        "pop": "Upcoming courses", "pop_sub": "Prices, dates and hours from the centre's live schedule.",
        "all_sched": "Full schedule →", "formats": "Learning formats",
        "formats_sub": "Online from anywhere or offline in Almaty.",
        "online_h": "Online", "online_t": "Live webinars and recorded courses. Certificate and credit units included, same as offline programs.",
        "offline_h": "Offline", "offline_t": "Seminars and masterclasses in Almaty: hands-on practice, case discussions, meeting the experts.",
        "detail": "Details →", "enroll": "Enroll",
        "teachers_h": "Faculty", "teachers_sub": "Clinicians with extensive hands-on experience.",
        "reviews_h": "Reviews", "faq_h": "FAQ",
        "faq": [("Do you issue a certificate?", "Yes. You receive a centre certificate; selected webinars grant credit units. See each course card for details."),
                ("How do I enroll?", "Click “Enroll” — a participant form (Google Form) opens. Fill it in and we will contact you on WhatsApp."),
                ("How does online work?", "Live webinars + recordings. Links and materials arrive by email and WhatsApp."),
                ("Where are offline classes?", "In Almaty. Ask the coordinator on WhatsApp for the exact venue."),
                ("Can I pay in installments?", "Message us on WhatsApp — we will find a suitable option.")],
        "contacts_h": "Contacts", "addr_label": "Address",
        "sched_h": "Schedule", "sched_sub": "All courses and modules of the centre. Click enroll to open the form.",
        "filter_all": "All", "filter_online": "Online", "filter_offline": "Offline",
        "course_h": "Course program", "back": "← Back to schedule",
        "offer_h": "Public offer", "offer_t": "The public offer for educational services is available from the coordinator — this page is being migrated from the original site.",
        "footer_about": "Education centre for physicians. Online and offline in Almaty.",
        "rights": "All rights reserved.", "teachers_page_sub": "Click a card to learn more.",
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
<title>{esc(title)} — Doctrine</title>
<meta name="description" content="{esc(desc)}">
<link rel="icon" href="../assets/img/logo.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/main.css">
</head>
<body>
"""

def header(lang, active):
    t = T[lang]
    links = "".join(
        f'<a href="{href}" class="{"active" if href == active else ""}">{esc(label)}</a>'
        for href, label in t["nav"])
    langs = "".join(
        f'<a href="../{l}/index.html" class="{"active" if l == lang else ""}">{lbl}</a>'
        for l, lbl in [("ru", "RU"), ("kk", "KZ"), ("en", "EN")])
    return f"""<header class="site-header"><div class="header-inner">
<a class="logo" href="index.html"><img src="../assets/img/logo.jpg" alt="Doctrine logo"><span><b>Doctrine</b><small>{esc(SITE["tagline"][lang])}</small></span></a>
<nav class="nav" id="nav">{links}</nav>
<div class="lang">{langs}</div>
<button class="burger" id="burgerBtn" aria-label="Menu" aria-expanded="false">☰</button>
</div></header>
<main>
"""

def footer(lang):
    t = T[lang]
    nav = "".join(f'<div><a href="{h}">{esc(l)}</a></div>' for h, l in t["nav"])
    return f"""</main>
<footer><div class="container">
<div><h3>Doctrine</h3><p>{esc(t["footer_about"])}</p><small>ТОО «Образовательный центр DOCTRINE» · БИН {SITE["bin"]} · © <span data-year>2026</span> {esc(t["rights"])}</small></div>
<div><h4>Menu</h4>{nav}<div><a href="offer.html">{esc(t["offer_h"])}</a></div></div>
<div><h4>{esc(t["contacts_h"])}</h4><div><a href="{WA}">WhatsApp: {esc(SITE["phone"])}</a></div><div><a href="{IG}">Instagram</a></div><div><small>{esc(SITE["address"][lang])}</small></div></div>
</div></footer>
<script src="../assets/js/main.js"></script>
</body>
</html>
"""

def course_cards(lang, limit=None, fmt=None):
    out = []
    items = COURSES if limit is None else COURSES[:limit]
    for c in items:
        if fmt and c["format"] != fmt:
            continue
        title = c["title"].get(lang) or c["title"]["ru"]
        first = c["sessions"][0] if c["sessions"] else {}
        price = first.get("price", "")
        hours = first.get("hours", "")
        dlines = (first.get("dates", "") or "").split("\n")
        dates = dlines[0] + (f" (+{len(dlines) - 1})" if len(dlines) > 1 else "")
        n = len(c["sessions"])
        out.append(f"""<div class="card" data-fmt="{c["format"]}">
<div class="card-body">
<div class="badges"><span class="badge format">{c["format"]}</span>{f'<span class="badge hours">{esc(hours)}</span>' if hours else ""}{f'<span class="badge">{n} sess.</span>' if n > 1 else ""}</div>
<h3>{esc(title)}</h3>
<div class="meta">{esc(dates)}</div>
{f'<div class="price">{esc(price)}</div>' if price else ""}
<a class="btn btn-ghost" href="course.html?id={c["id"]}">{esc(T[lang]["detail"])}</a>
<a class="btn btn-primary" href="{FORM}?usp=pp_url&entry_course={c["id"]}" target="_blank" rel="noopener">{esc(T[lang]["enroll"])}</a>
</div></div>""")
    return "\n".join(out)

def contacts_section(lang):
    t = T[lang]
    return f"""<section class="section alt"><div class="container">
<h2>{esc(t["contacts_h"])}</h2>
<div class="contacts-grid"><ul class="contact-list">
<li>💬 <a href="{WA}" target="_blank" rel="noopener">WhatsApp: {esc(SITE["phone"])}</a></li>
<li>📸 <a href="{IG}" target="_blank" rel="noopener">Instagram: doctrine_centre</a></li>
<li>📍 {esc(t["addr_label"])}: {esc(SITE["address"][lang])}</li>
<li>✉️ {esc(SITE["email"])}</li>
</ul><div><a class="btn btn-primary" href="{FORM}" target="_blank" rel="noopener">{esc(t["cta_reg"])}</a></div></div>
</div></section>"""

def faq_section(lang):
    t = T[lang]
    items = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>"
                    for q, a in t["faq"])
    return f'<section class="section"><div class="container faq"><h2>{esc(t["faq_h"])}</h2>{items}</div></section>'

def page_index(lang):
    t = T[lang]
    teach4 = "".join(
        f'<div class="card teacher-card"><img src="{x["photo"]}" alt="{esc(x["name"])}" loading="lazy"><div class="card-body"><h3>{esc(x["name"])}</h3><p>{esc(x["spec"])}</p></div></div>'
        for x in TEACHERS[:4])
    return (head(lang, t["hero_h1"], t["meta_desc"]) + header(lang, "index.html") + f"""
<section class="hero"><div class="container hero-grid">
<div class="hero-photo"><img src="../assets/img/founder.jpg" alt="Founder"></div>
<div><span class="hero-eyebrow">{esc(t["hero_eye"])}</span>
<h1>{esc(t["hero_h1"])}</h1>
<p class="lead">{esc(t["hero_p"])}</p>
<div class="cta-row"><a class="btn btn-primary" href="schedule.html">{esc(t["cta_sched"])}</a>
<a class="btn btn-ghost" href="{FORM}" target="_blank" rel="noopener">{esc(t["cta_reg"])}</a></div>
</div></div></section>
<section class="trust"><div class="container trust-grid">
{"".join(f'<div class="trust-item"><b>{b}</b><span>{s}</span></div>' for b, s in t["trust"])}
</div></section>
<section class="section"><div class="container">
<h2>{esc(t["pop"])}</h2><p class="sub">{esc(t["pop_sub"])}</p>
<div class="grid-3">{course_cards(lang, limit=6)}</div>
<p><a class="btn btn-ghost" href="schedule.html">{esc(t["all_sched"])}</a></p>
</div></section>
<section class="section mint"><div class="container">
<h2>{esc(t["formats"])}</h2><p class="sub">{esc(t["formats_sub"])}</p>
<div class="grid-3" style="grid-template-columns:1fr 1fr">
<div class="card format-card"><h3>🌐 {esc(t["online_h"])}</h3><p>{esc(t["online_t"])}</p><a class="btn btn-ghost" href="online.html">{esc(t["detail"])}</a></div>
<div class="card format-card"><h3>🏥 {esc(t["offline_h"])}</h3><p>{esc(t["offline_t"])}</p><a class="btn btn-ghost" href="offline.html">{esc(t["detail"])}</a></div>
</div></div></section>
<section class="section alt"><div class="container">
<h2>{esc(t["teachers_h"])}</h2><p class="sub">{esc(t["teachers_sub"])}</p>
<div class="grid-4">{teach4}</div>
</div></section>
""" + faq_section(lang) + contacts_section(lang) + footer(lang))

def page_schedule(lang):
    t = T[lang]
    return (head(lang, t["sched_h"], t["meta_desc"]) + header(lang, "schedule.html") + f"""
<section class="section"><div class="container">
<h1>{esc(t["sched_h"])}</h1><p class="sub">{esc(t["sched_sub"])}</p>
<div class="filters">
<button data-filter="all" class="active">{esc(t["filter_all"])}</button>
<button data-filter="online">{esc(t["filter_online"])}</button>
<button data-filter="offline">{esc(t["filter_offline"])}</button>
</div>
<div class="grid-3">{course_cards(lang)}</div>
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
    return (head(lang, t["course_h"], t["meta_desc"]) + header(lang, "schedule.html") + f"""
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
    cards = "".join(
        f'<div class="card teacher-card"><img src="{x["photo"]}" alt="{esc(x["name"])}" loading="lazy"><div class="card-body"><h3>{esc(x["name"])}</h3><p>{esc(x["spec"])}</p><p class="meta">{esc(x["work"])} {esc(x["exp"])}</p></div></div>'
        for x in TEACHERS)
    about = "".join(
        f'<div class="session"><h4>{esc(x["name"])}</h4><p class="meta">{esc(x["spec"])}</p><p>{esc(x["about"][:600])}</p></div>'
        for x in TEACHERS if x["about"])
    return (head(lang, t["teachers_h"], t["meta_desc"]) + header(lang, "teachers.html") + f"""
<section class="section"><div class="container">
<h1>{esc(t["teachers_h"])}</h1><p class="sub">{esc(t["teachers_page_sub"])}</p>
<div class="grid-4">{cards}</div>
<h2 style="margin-top:36px">О преподавателях</h2>{about}
</div></section>
""" + contacts_section(lang) + footer(lang))

def page_format(lang, kind):
    t = T[lang]
    is_on = kind == "online"
    h = t["online_h"] if is_on else t["offline_h"]
    txt = t["online_t"] if is_on else t["offline_t"]
    bullets = t["faq"][:3]
    return (head(lang, h, t["meta_desc"]) + header(lang, "online.html" if is_on else "offline.html") + f"""
<section class="hero"><div class="container" style="padding:40px 0">
<span class="hero-eyebrow">{esc(t["formats"])}</span><h1>{esc(h)}</h1><p class="lead">{esc(txt)}</p>
<div class="cta-row"><a class="btn btn-primary" href="{FORM}" target="_blank" rel="noopener">{esc(t["enroll"])}</a>
<a class="btn btn-ghost" href="schedule.html">{esc(t["all_sched"])}</a></div>
</div></section>
<section class="section"><div class="container">
<h2>{esc(t["pop"])}</h2><div class="grid-3">{course_cards(lang, fmt=kind) or course_cards(lang, limit=3)}</div>
</div></section>
""" + contacts_section(lang) + footer(lang))

def page_offer(lang):
    t = T[lang]
    return (head(lang, t["offer_h"], t["meta_desc"]) + header(lang, "") + f"""
<section class="section"><div class="container"><h1>{esc(t["offer_h"])}</h1><p>{esc(t["offer_t"])}</p>
<p>WhatsApp: <a href="{WA}">{esc(SITE["phone"])}</a></p></div></section>
""" + footer(lang))

def page_404(lang):
    return (head(lang, "404", "Page not found") + header(lang, "") +
            '<section class="section"><div class="container"><h1>404</h1><p><a href="index.html">← Home</a></p></div></section>' + footer(lang))

BUILDERS = {"index.html": page_index, "schedule.html": page_schedule,
            "course.html": page_course, "teachers.html": page_teachers,
            "offer.html": page_offer, "404.html": page_404}

for lang in LANGS:
    d = os.path.join(DOCS, lang)
    os.makedirs(d, exist_ok=True)
    for name, fn in BUILDERS.items():
        with open(os.path.join(d, name), "w", encoding="utf-8") as f:
            f.write(fn(lang))
    with open(os.path.join(d, "online.html"), "w", encoding="utf-8") as f:
        f.write(page_format(lang, "online"))
    with open(os.path.join(d, "offline.html"), "w", encoding="utf-8") as f:
        f.write(page_format(lang, "offline"))

# root redirect + sitemap + robots
with open(os.path.join(DOCS, "index.html"), "w", encoding="utf-8") as f:
    f.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=ru/"></head><body><a href="ru/">ru</a></body></html>')
with open(os.path.join(DOCS, ".nojekyll"), "w") as f:
    f.write("")
BASE = "https://r1laun.github.io/doctrine-kz-site"
urls = [f"{BASE}/{l}/{p}" for l in LANGS for p in
        ["index.html", "schedule.html", "course.html", "teachers.html", "online.html", "offline.html", "offer.html"]]
with open(os.path.join(DOCS, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"<url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>")
with open(os.path.join(DOCS, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
print("built:", sum(1 for l in LANGS for _ in os.listdir(os.path.join(DOCS, l))), "pages")
