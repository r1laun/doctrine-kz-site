"""Static site generator: RU + KK + EN pages with SEO prerender from data JSON.
Run: python3 tools/build.py
Output: docs/{ru,kk,en}/*.html + sitemap/robots/root index.
"""
import json, os, html, re, sys, hashlib
from urllib.parse import quote
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
# Conference: hand-written content (RU/KK/EN), survives the Google Sheets sync
# because only schedule_new.csv is overwritten by make_data.py/update.sh.
try:
    with open(os.path.join(ROOT, "_original", "conference.json"), encoding="utf-8") as f:
        CONF = json.load(f)
except FileNotFoundError:
    CONF = None

FORM = SITE["form_url"]
WA = SITE["whatsapp"]
IG = SITE["instagram"]

T = {
    "ru": {
        "nav": [("index.html", "Главная"), ("schedule.html", "Расписание"), ("teachers.html", "Преподаватели"), ("cabinet.html", "Кабинет")],
        "meta_desc": "Doctrine - обучение врачей в Алматы и онлайн: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Курсы и вебинары для медиков Казахстана.",
        "hero_eye": "Образовательный центр для врачей · Алматы",
        "hero_h1": "Глубокие знания от сердца к сердцу",
        "hero_h1_a": "Глубокие знания",
        "hero_h1_b": "от сердца к сердцу",
        "hero_p": "Меня зовут Инна Евгеньевна - я основатель Doctrine и врач-кардиолог с 20-летним опытом обучения врачей. Наши преподаватели - практикующие клиницисты. Учим тому, что работает у постели пациента.",
        "cta_sched": "Смотреть расписание", "cta_reg": "Записаться на обучение",
        "trust": [("500+", "врачей прошли обучение"), ("10+", "курсов"),
                  ("1000+", "врачей в комьюнити")],
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
        "footer_about": "Образовательный центр для врачей Doctrine (Доктрина). Онлайн и офлайн в Алматы.",
        "rights": "Все права защищены.", "teachers_page_sub": "Нажмите «Подробнее», чтобы узнать о каждом.",
        "menu_h": "Меню", "fmt_online": "Онлайн", "fmt_offline": "Офлайн",
        "search_ph": "Найти курс или преподавателя…", "shown": "Показано",
        "archive_h": "Прошедшие курсы", "archive_sub": "набор в эти группы завершён.",
        "past_badge": "Завершён", "next_stream": "Следующий поток →",
        "founder_alt": "Основатель центра Doctrine",
        "conf_badge": "Конференция", "conf_when": "Когда", "conf_venue": "Место",
        "conf_reg": "Регистрация", "conf_more": "Подробнее о конференции →", "conf_more_short": "Подробнее →",
        "conf_wa": "Написать в WhatsApp", "conf_enroll_wa": "Записаться в WhatsApp", "conf_past": "Мероприятие завершено",
        "conf_topics_h": "Основные темы", "conf_focus_h": "Отдельное внимание",
        "conf_agenda_h": "Что ждёт участников", "conf_audience_h": "Для кого",
        "conf_speakers_h": "Научные руководители", "conf_org_h": "Организаторы",
        "conf_img_alt": "Баннер конференции Doctrine",
        "seo_index_t": "Doctrine — центр обучения врачей в Алматы | Доктрина",
        "seo_index_d": "Doctrine (Доктрина) — образовательный центр для врачей: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Курсы и вебинары онлайн и офлайн в Алматы.",
        "seo_sched_t": "Расписание курсов — Doctrine (Доктрина) | Алматы и онлайн",
        "seo_sched_d": "Расписание Doctrine (Доктрина): курсы для врачей — ЭКГ, Холтер, СМАД, ЭхоКГ, кардиология. Даты, цены, онлайн и офлайн в Алматы.",
        "seo_teach_t": "Преподаватели — Doctrine (Доктрина) | Врачи-клиницисты",
        "seo_teach_d": "Преподаватели Doctrine (Доктрина) — практикующие врачи-клиницисты: кардиологи, диагносты. Узнайте о каждом наставнике центра.",
        "seo_course_t": "Программа курса — Doctrine (Доктрина)",
        "seo_course_d": "Программа курса Doctrine (Доктрина): темы занятий, даты, часы, цена и преподаватель. Запись онлайн и офлайн в Алматы.",
        "seo_cab_t": "Личный кабинет врача — Doctrine (Доктрина)",
        "seo_cab_d": "Личный кабинет врача образовательного центра Doctrine: вход и регистрация по номеру телефона или почте, профиль, мои курсы и запись в 1 клик.",
        "seo_404_t": "404 — Doctrine (Доктрина)",
    },
    "kk": {
        "nav": [("index.html", "Басты бет"), ("schedule.html", "Кесте"), ("teachers.html", "Оқытушылар"), ("cabinet.html", "Жеке кабинет")],
        "meta_desc": "Doctrine - Алматыда және онлайн дәрігерлерді оқыту: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Қазақстан медиктеріне арналған курстар.",
        "hero_eye": "Дәрігерлерге арналған білім орталығы · Алматы",
        "hero_h1": "Жүректен жүрекке терең білім",
        "hero_h1_a": "Жүректен жүрекке",
        "hero_h1_b": "терең білім",
        "hero_p": "Менің атым Инна Евгеньевна - Doctrine негізін қалаушы, кардиолог, дәрігерлерді оқытудағы 20 жылдық тәжірибем бар. Оқытушыларымыз - тәжірибелі клиницистер.",
        "cta_sched": "Кестені көру", "cta_reg": "Оқуға жазылу",
        "trust": [("500+", "оқудан өткен дәрігер"), ("10+", "курс"),
                  ("1000+", "комьюнитидегі дәрігер")],
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
        "footer_about": "Doctrine (Доктрина) — дәрігерлерге арналған білім орталығы. Алматыда онлайн және офлайн.",
        "rights": "Барлық құқықтар қорғалған.", "teachers_page_sub": "Әрқайсысы туралы білу үшін «Толығырақ» басыңыз.",
        "menu_h": "Мәзір", "fmt_online": "Онлайн", "fmt_offline": "Офлайн",
        "search_ph": "Курс немесе оқытушыны іздеу…", "shown": "Көрсетілді",
        "archive_h": "Өткен курстар", "archive_sub": "бұл топтарға қабылдау аяқталды.",
        "past_badge": "Аяқталды", "next_stream": "Келесі ағын →",
        "founder_alt": "Doctrine орталығының негізін қалаушы",
        "conf_badge": "Конференция", "conf_when": "Қашан", "conf_venue": "Орын",
        "conf_reg": "Тіркелу", "conf_more": "Конференция туралы толығырақ →", "conf_more_short": "Толығырақ →",
        "conf_wa": "WhatsApp-қа жазу", "conf_enroll_wa": "WhatsApp арқылы жазылу", "conf_past": "Іс-шара аяқталды",
        "conf_topics_h": "Негізгі тақырыптар", "conf_focus_h": "Ерекше назар",
        "conf_agenda_h": "Қатысушыларды не күтіп тұр", "conf_audience_h": "Кімдерге арналған",
        "conf_speakers_h": "Ғылыми жетекшілер", "conf_org_h": "Ұйымдастырушылар",
        "conf_img_alt": "Doctrine конференциясының баннері",
        "seo_index_t": "Doctrine — дәрігерлерді оқыту орталығы, Алматы | Доктрина",
        "seo_index_d": "Doctrine (Доктрина) — дәрігерлерге арналған білім орталығы: кардиология, ЭКГ, Холтер, СМАД, ЭхоКГ. Алматыда онлайн және офлайн курстар.",
        "seo_sched_t": "Курстар кестесі — Doctrine (Доктрина)",
        "seo_sched_d": "Doctrine (Доктрина) кестесі: дәрігерлерге арналған курстар — ЭКГ, Холтер, СМАД, ЭхоКГ, кардиология. Күндер, бағалар, Алматыда онлайн және офлайн.",
        "seo_teach_t": "Оқытушылар — Doctrine (Доктрина)",
        "seo_teach_d": "Doctrine (Доктрина) оқытушылары — тәжірибелі клиницист-дәрігерлер: кардиологтар, диагносттар.",
        "seo_course_t": "Курс бағдарламасы — Doctrine (Доктрина)",
        "seo_course_d": "Doctrine (Доктрина) курс бағдарламасы: сабақ тақырыптары, күндер, сағаттар, бағасы мен оқытушы.",
        "seo_cab_t": "Дәрігердің жеке кабинеті — Doctrine (Доктрина)",
        "seo_cab_d": "Doctrine білім орталығының жеке кабинеті: телефон нөмірі немесе email арқылы кіру және тіркелу, менің курстарым, 1 басумен жазылу.",
        "seo_404_t": "404 — Doctrine (Доктрина)",
    },
    "en": {
        "nav": [("index.html", "Home"), ("schedule.html", "Schedule"), ("teachers.html", "Faculty"), ("cabinet.html", "Account")],
        "meta_desc": "Doctrine - physician training in Almaty and online: cardiology, ECG, Holter, ABPM, Echo. Courses and webinars for doctors in Kazakhstan.",
        "hero_eye": "Education centre for physicians · Almaty",
        "hero_h1": "Deep knowledge from heart to heart",
        "hero_h1_a": "Deep knowledge",
        "hero_h1_b": "from heart to heart",
        "hero_p": "I'm Inna Leshinskaya-Popova - founder of Doctrine and a cardiologist with 20 years of physician training experience. Our teachers are practising clinicians.",
        "cta_sched": "View schedule", "cta_reg": "Enroll now",
        "trust": [("500+", "doctors trained"), ("10+", "courses"),
                  ("1000+", "doctors in our community")],
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
        "footer_about": "Doctrine Centre — education centre for physicians. Online and offline in Almaty.",
        "rights": "All rights reserved.", "teachers_page_sub": "Click “Details” to learn about each teacher.",
        "menu_h": "Menu", "fmt_online": "Online", "fmt_offline": "Offline",
        "search_ph": "Search courses or teachers…", "shown": "Showing",
        "archive_h": "Past courses", "archive_sub": "enrollment for these groups is closed.",
        "past_badge": "Finished", "next_stream": "Next intake →",
        "founder_alt": "Founder of the Doctrine centre",
        "conf_badge": "Conference", "conf_when": "When", "conf_venue": "Venue",
        "conf_reg": "Registration", "conf_more": "More about the conference →", "conf_more_short": "Details →",
        "conf_wa": "Message on WhatsApp", "conf_enroll_wa": "Register on WhatsApp", "conf_past": "This event has ended",
        "conf_topics_h": "Key topics", "conf_focus_h": "Special focus",
        "conf_agenda_h": "What to expect", "conf_audience_h": "Who it's for",
        "conf_speakers_h": "Scientific supervisors", "conf_org_h": "Organizers",
        "conf_img_alt": "Doctrine conference banner",
        "seo_index_t": "Doctrine Centre — physician training in Almaty",
        "seo_index_d": "Doctrine Centre — education centre for physicians: cardiology, ECG, Holter, ABPM, Echo. Online and offline courses in Almaty, Kazakhstan.",
        "seo_sched_t": "Course schedule — Doctrine Centre",
        "seo_sched_d": "Doctrine Centre schedule: courses for doctors — ECG, Holter, ABPM, Echo, cardiology. Dates, prices, online and offline in Almaty.",
        "seo_teach_t": "Faculty — Doctrine Centre",
        "seo_teach_d": "Doctrine Centre faculty — practising clinicians: cardiologists, diagnosticians. Meet our teachers.",
        "seo_course_t": "Course program — Doctrine Centre",
        "seo_course_d": "Doctrine Centre course program: topics, dates, hours, price and teacher. Enroll online or offline in Almaty.",
        "seo_cab_t": "Physician Account — Doctrine Centre",
        "seo_cab_d": "Doctrine Centre physician personal account: sign in or register by phone number or email, manage profile, view enrolled courses and enroll in 1 click.",
        "seo_404_t": "404 — Doctrine Centre",
    },
}

LANGS = ["ru", "kk", "en"]
OTHER = {"ru": [("kk", "KZ"), ("en", "EN")], "kk": [("ru", "RU"), ("en", "EN")],
         "en": [("ru", "RU"), ("kk", "KZ")]}

def esc(s):
    return html.escape(str(s or ""), quote=True)

_ASSET_V = {}

def av(rel):
    """Cache-busting query for a static asset: short sha1 of its content.
    Safari keeps a CSS/JS/image forever without it, so a deploy looks like it
    did nothing on phones."""
    if rel not in _ASSET_V:
        path = os.path.join(DOCS, "assets", rel)
        try:
            with open(path, "rb") as f:
                _ASSET_V[rel] = hashlib.sha1(f.read()).hexdigest()[:8]
        except FileNotFoundError:
            _ASSET_V[rel] = ""
    return f"{rel}?v={_ASSET_V[rel]}" if _ASSET_V[rel] else rel

OG_LOCALE = {"ru": "ru_RU", "kk": "kk_KZ", "en": "en_US"}

ORG_LD = {
    "@context": "https://schema.org", "@type": "EducationalOrganization",
    "name": "Doctrine", "alternateName": ["Доктрина", "Doctrine Centre"],
    "url": "https://doctrine.kz/", "logo": "https://doctrine.kz/assets/img/logo.jpg",
    "address": {"@type": "PostalAddress", "addressLocality": "Алматы",
                "addressRegion": "Алматы", "addressCountry": "KZ"},
    "sameAs": ["https://www.instagram.com/doctrine_centre"],
}

def head(lang, title, desc, page="index.html", og_img="logo.jpg"):
    canon = f"https://doctrine.kz/{lang}/{page}"
    hreflangs = "\n".join(
        f'<link rel="alternate" hreflang="{l}" href="https://doctrine.kz/{l}/{page}">'
        for l in LANGS)
    hreflangs += f'\n<link rel="alternate" hreflang="x-default" href="https://doctrine.kz/ru/{page}">'
    alternates = "\n".join(
        f'<meta property="og:locale:alternate" content="{OG_LOCALE[l]}">'
        for l in LANGS if l != lang)
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="google-site-verification" content="qJzxeKkHh609EgW7CYFq2U6r2_7NLROGmrEPiGJlGwE">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-07751DJT62"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-07751DJT62');
</script>
<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){{m[i]=m[i]||function(){{(m[i].a=m[i].a||[]).push(arguments)}};m[i].l=1*new Date();for (var j = 0; j < document.scripts.length; j++) {{if (document.scripts[j].src === r) {{ return; }}}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)}})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=113473930', 'ym');
    ym(113473930, 'init', {{ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true}});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/113473930" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">
{hreflangs}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Doctrine">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="https://doctrine.kz/assets/img/{esc(og_img)}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
{alternates}
<script type="application/ld+json">{json.dumps(ORG_LD, ensure_ascii=False)}</script>
<link rel="icon" href="../assets/img/logo.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/{av('css/main.css')}">
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
<script src="../assets/{av('js/main.js')}"></script>
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
                      else f'<a class="btn btn-primary" href="cabinet.html?enroll={c["id"]}" data-course-enroll="{c["id"]}" data-course-title="{esc(c["title"]["ru"])}" data-course-dates="{esc(dates)}" data-course-price="{esc(price)}" data-course-fmt="{c["format"]}">{esc(T[lang]["enroll"])}</a>')
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
<script src="../assets/{av('js/reviews.js')}"></script>"""

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
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage",
              "mainEntity": [{"@type": "Question", "name": q,
                              "acceptedAnswer": {"@type": "Answer", "text": a}}
                             for q, a in t["faq"]]}
    return (f'<section class="section"><div class="container faq"><h2>{esc(t["faq_h"])}</h2>{items}</div></section>'
            f'<script type="application/ld+json">{json.dumps(faq_ld, ensure_ascii=False)}</script>')

def page_index(lang):
    t = T[lang]
    top_teachers = [x for tid in ("2", "5", "3")
                    for x in TEACHERS if x["id"] == tid]
    teach3 = "".join(
        f'<div class="card teacher-card"><img src="{x["photo"]}" alt="{esc(tname(x, lang))}" loading="lazy"><div class="card-body"><h3>{esc(tname(x, lang))}</h3><a class="btn btn-ghost" href="teachers.html">{esc(t["detail"])}</a></div></div>'
        for x in top_teachers)
    return (head(lang, t["seo_index_t"], t["seo_index_d"], "index.html") + header(lang, "index.html", "index.html") + f"""
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
<section class="section conf-sec"><div class="container">{conf_block(lang, "full")}</div></section>
<section class="section"><div class="container">
<h2>{esc(t["pop"])}</h2><p class="sub">{esc(t["pop_sub"])}</p>
<div class="grid-3" id="popGrid">{active_top(lang, 3)}</div>
<p><a class="btn btn-ghost" href="schedule.html">{esc(t["all_sched"])}</a></p>
</div></section>
<section class="section alt"><div class="container">
<h2>{esc(t["teachers_h"])}</h2><p class="sub">{esc(t["teachers_sub"])}</p>
<div class="grid-3 home-teachers">{teach3}</div>
<p><a class="btn btn-ghost" href="teachers.html">{esc(t["all_teachers"])}</a></p>
</div></section>
""" + reviews_section(lang) + faq_section(lang) + contacts_section(lang) + footer(lang))

def cval(field, lang):
    """Localized field of the conference content (CONF)."""
    v = (CONF or {}).get(field) or ""
    if isinstance(v, dict):
        return v.get(lang) or v.get("ru") or ""
    return str(v)

def conf_media(lang, small=False, eager=False):
    alt = esc(T[lang]["conf_img_alt"])
    if small:
        jpg, webp, sizes = ("../assets/" + av('img/conf-banner-sm.jpg'),
                            "../assets/" + av('img/conf-banner-sm.webp'), "1000w")
        w, h = 1000, 474
    else:
        jpg, webp, sizes = ("../assets/" + av('img/conf-banner.jpg'),
                            "../assets/" + av('img/conf-banner.webp'), "1600w")
        w, h = 1600, 758
    big_webp = "../assets/" + av('img/conf-banner.webp')
    srcset = (f"{webp} {sizes}" if not small
              else f"{webp} {sizes}, {big_webp} 1600w")
    load = ' fetchpriority="high" decoding="sync"' if eager else ' loading="lazy" decoding="async"'
    return (f'<picture><source srcset="{webp}" type="image/webp">'
            f'<img src="{jpg}" srcset="{srcset}" sizes="(max-width:960px) 92vw, 1180px" '
            f'width="{w}" height="{h}" alt="{alt}"{load}></picture>')

def conf_wa_link(lang):
    """WhatsApp с уже подставленным сообщением о регистрации."""
    return f'{WA.split("?")[0]}?text={quote(cval("enroll_msg", lang))}'

def conf_people(lang):
    """Small avatar strip of the scientific supervisors."""
    out = "".join(
        f'<img src="{esc(s.get("photo") or "")}" '
        f'alt="{esc((s.get("name") or {}).get(lang) or (s.get("name") or {}).get("ru", ""))}" loading="lazy">'
        for s in (CONF or {}).get("speakers", []) if s.get("photo"))
    return f'<div class="conf-people">{out}</div>' if out else ""

def conf_block(lang, variant="full", keep=False):
    """Conference banner: 'full' = media on top (home, conference page),
    'grid' = compact side-by-side card that spans the whole 3-column row.
    keep=True: do not hide after the date (own page), just close registration."""
    if not CONF:
        return ""
    t = T[lang]
    title = cval("short_title" if variant == "grid" else "title", lang)
    until = CONF["date"].replace("-", "")
    keep_cls = " conf-keep" if keep else ""
    badges = (f'<div class="badges"><span class="badge conf-badge">{esc(t["conf_badge"])}</span>'
              f'<span class="badge format fmt-hybrid">{esc(cval("format", lang))}</span></div>')
    meta = " · ".join([cval("date_short", lang), cval("registration", lang),
                       cval("venue", lang)])
    # одна и та же строка-подпись: на телефоне она заменяет подробные факты
    line = f'<div class="conf-line">{conf_people(lang)}<span>{esc(meta)}</span></div>'
    if variant == "grid":
        # compact: one meta line + two buttons, so the card stays ~250px tall
        body = f"""
{badges}
<h2 class="conf-title"><a href="conference.html">{esc(title)}</a></h2>
{line}
<div class="conf-cta">
<a class="btn btn-primary conf-reg" href="{conf_wa_link(lang)}" target="_blank" rel="noopener">{esc(t["conf_enroll_wa"])}</a>
<a class="btn btn-ghost conf-more" href="conference.html">{esc(t["conf_more_short"])}</a>
</div>"""
    else:
        facts = "".join(
            f'<div class="conf-fact"><small>{esc(lbl)}</small><span>{esc(val)}</span></div>'
            for lbl, val in [(t["conf_when"], cval("date_label", lang)),
                             (t["conf_reg"], cval("registration", lang)),
                             (t["conf_venue"], cval("venue", lang))])
        body = f"""
{badges}
<h2 class="conf-title"><a href="conference.html">{esc(title)}</a></h2>
<h2 class="conf-title conf-title-sm"><a href="conference.html">{esc(cval("short_title", lang))}</a></h2>
<div class="conf-facts">{facts}</div>
<div class="conf-people-full">{conf_people(lang)}</div>
{line}
<div class="conf-cta">
<a class="btn btn-primary conf-reg" href="{conf_wa_link(lang)}" target="_blank" rel="noopener">{esc(t["conf_enroll_wa"])}</a>
<a class="btn btn-ghost conf-more" href="conference.html">{esc(t["conf_more"])}</a>
</div>"""
    return f"""
<div class="conf conf-{variant}{keep_cls}" data-conf-until="{until}">
<a class="conf-media" href="conference.html" tabindex="-1" aria-hidden="true">{conf_media(lang, small=(variant == "grid"))}</a>
<div class="conf-body">{body}
</div></div>"""

def conf_ld(lang):
    ld = {
        "@context": "https://schema.org", "@type": "MedicalEvent",
        "name": cval("title", "ru"),
        "description": ((CONF.get("seo") or {}).get("ru") or {}).get("d", ""),
        "startDate": CONF["date"] + "T08:00:00+05:00",
        "endDate": CONF["date"] + "T18:00:00+05:00",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/HybridEventAttendanceMode",
        "image": "https://doctrine.kz/assets/img/conf-banner-og.jpg",
        "inLanguage": ["ru", "kk", "en"],
        "url": f"https://doctrine.kz/{lang}/conference.html",
        "location": {
            "@type": "Place",
            "name": "Holiday Inn Almaty",
            "address": {"@type": "PostalAddress",
                        "streetAddress": "ул. Тимирязева 2Д",
                        "addressLocality": "Алматы",
                        "addressCountry": "KZ"},
        },
        "organizer": {"@type": "Organization",
                      "name": "ТОО «Образовательный центр Doctrine»"},
        "performer": [{"@type": "Person", "name": cval_s}
                      for cval_s in [(s.get("name") or {}).get("ru") for s in CONF.get("speakers", [])]],
    }
    return f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'

def page_conference(lang):
    if not CONF:
        return ""
    t = T[lang]
    seo = (CONF.get("seo") or {}).get(lang) or {}
    title = seo.get("t") or cval("title", lang)
    desc = seo.get("d") or cval("lead", lang)
    topics = "".join(f'<li>{esc(x.get(lang) or x.get("ru"))}</li>' for x in CONF.get("topics", []))
    speakers = "".join(
        f'<div class="card conf-speaker"><img src="{esc(s.get("photo") or "")}" '
        f'alt="{esc((s.get("name") or {}).get(lang) or "")}" loading="lazy">'
        f'<div class="card-body"><h3>{esc((s.get("name") or {}).get(lang) or "")}</h3>'
        f'<p class="meta">{esc((s.get("role") or {}).get(lang) or "")}</p></div></div>'
        for s in CONF.get("speakers", []) if s.get("photo"))
    return (head(lang, title, desc, "conference.html", og_img="conf-banner-og.jpg")
            + header(lang, "schedule.html", "conference.html")
            + f"""
<section class="conf-hero"><div class="container">{conf_block(lang, "full", keep=True)}
<p class="conf-past-note">{esc(t["conf_past"])}</p></div></section>
<section class="section"><div class="container conf-content">
<p class="conf-lead">{esc(cval("lead", lang))}</p>
<h2>{esc(t["conf_topics_h"])}</h2>
<ul class="conf-topics">{topics}</ul>
<div class="conf-focus"><b>{esc(t["conf_focus_h"])}</b><p>{esc(cval("focus", lang))}</p></div>
<h2>{esc(t["conf_agenda_h"])}</h2>
<p>{esc(cval("agenda", lang))}</p>
<h2>{esc(t["conf_audience_h"])}</h2>
<p>{esc(cval("audience", lang))}</p>
<h2>{esc(t["conf_speakers_h"])}</h2>
<div class="grid-3 conf-speakers">{speakers}</div>
<h2>{esc(t["conf_org_h"])}</h2>
<p>{esc(cval("organizers", lang))}</p>
<p class="conf-note">{esc(cval("note", lang))}</p>
<div class="conf-page-cta">
<a class="btn btn-primary conf-reg" href="{conf_wa_link(lang)}" target="_blank" rel="noopener">{esc(t["conf_enroll_wa"])}</a>
<a class="btn btn-ghost conf-more" href="schedule.html">{esc(t["sched_h"])}</a>
</div>
</div></section>
{conf_ld(lang)}
""" + contacts_section(lang) + footer(lang))

def page_schedule(lang):
    t = T[lang]
    return (head(lang, t["seo_sched_t"], t["seo_sched_d"], "schedule.html") + header(lang, "schedule.html", "schedule.html") + f"""
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
<div class="conf-wrap" id="confTop">{conf_block(lang, "grid")}</div>
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
    return (head(lang, t["seo_course_t"], t["seo_course_d"], "course.html") + header(lang, "schedule.html", "course.html") + f"""
<section class="course-hero"><div class="container">
<a href="schedule.html">{esc(t["back"])}</a>
<div id="course-detail"><p>…</p></div>
<p><a class="btn btn-primary" id="courseEnrollBtn" href="cabinet.html">{esc(t["enroll"])}</a>
<a class="btn btn-ghost" href="{WA}" target="_blank" rel="noopener">WhatsApp</a></p>
</div></section>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script src="../assets/{av('js/course.js')}"></script>
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
    return (head(lang, t["seo_teach_t"], t["seo_teach_d"], "teachers.html") + header(lang, "teachers.html", "teachers.html") + f"""
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
<script src="../assets/{av('js/teachers.js')}"></script>
""" + contacts_section(lang) + footer(lang))

def page_404(lang):
    t = T[lang]
    return (head(lang, t["seo_404_t"], t["meta_desc"], "404.html") + header(lang, "", "404.html") +
            '<section class="section"><div class="container"><h1>404</h1><p><a href="index.html">← Home</a></p></div></section>' + footer(lang))

CAB_L = {
    "ru": {
        "h1": "Личный кабинет врача",
        "sub": "Вход и регистрация по номеру телефона или электронной почте.",
        "tab_login": "Вход",
        "tab_reg": "Регистрация",
        "id_lbl": "Номер телефона или Email",
        "id_ph": "+7 777 000 00 00 или doctor@mail.kz",
        "sec_lbl": "Второй контакт (по желанию)",
        "sec_ph": "Email (если выше телефон) или телефон",
        "pass_lbl": "Пароль",
        "pass_ph": "Минимум 6 символов",
        "name_lbl": "ФИО врача",
        "name_ph": "Иванова Айгуль Сериковна",
        "spec_lbl": "Специальность",
        "spec_ph": "Кардиолог, терапевт, ВОП, врач ФД/УЗД…",
        "city_lbl": "Город",
        "city_ph": "Алматы",
        "work_lbl": "Место работы / клиника",
        "work_ph": "Название клиники или центра",
        "phone_lbl": "Телефон",
        "email_lbl": "Email",
        "btn_login": "Войти в кабинет",
        "btn_reg": "Создать аккаунт",
        "prof_h": "Профиль врача",
        "btn_save": "Сохранить профиль",
        "btn_logout": "Выйти",
        "my_h": "Мои курсы и заявки",
        "my_sub": "Ваши записи на курсы и конференцию, статусы и ссылки на материалы.",
        "avail_h": "Быстрая запись в 1 клик",
        "avail_sub": "Запишитесь без повторного заполнения анкет — ваши данные подставятся из профиля.",
        "help_note": "Забыли пароль или нужна помощь? Напишите координатору в WhatsApp.",
    },
    "kk": {
        "h1": "Дәрігердің жеке кабинеті",
        "sub": "Телефон нөмірі немесе электрондық пошта арқылы кіру және тіркелу.",
        "tab_login": "Кіру",
        "tab_reg": "Тіркелу",
        "id_lbl": "Телефон нөмірі немесе Email",
        "id_ph": "+7 777 000 00 00 немесе doctor@mail.kz",
        "sec_lbl": "Қосымша байланыс (қалауыңызша)",
        "sec_ph": "Email немесе телефон нөмірі",
        "pass_lbl": "Құпиясөз",
        "pass_ph": "Кемінде 6 таңба",
        "name_lbl": "Дәрігердің аты-жөні",
        "name_ph": "Ахметова Айгүл Серікқызы",
        "spec_lbl": "Мамандығы",
        "spec_ph": "Кардиолог, терапевт, ЖПД, ФД/УДЗ дәрігері…",
        "city_lbl": "Қала",
        "city_ph": "Алматы",
        "work_lbl": "Жұмыс орны / клиника",
        "work_ph": "Клиника немесе орталық атауы",
        "phone_lbl": "Телефон",
        "email_lbl": "Email",
        "btn_login": "Кабинетке кіру",
        "btn_reg": "Аккаунт ашу",
        "prof_h": "Дәрігер профилі",
        "btn_save": "Профильді сақтау",
        "btn_logout": "Шығу",
        "my_h": "Менің курстарым мен өтінімдерім",
        "my_sub": "Курстар мен конференцияға жазылулар, мәртебелер және материалдар.",
        "avail_h": "1 басумен жылдам жазылу",
        "avail_sub": "Сауалнаманы қайта толтырмай жазылыңыз — деректеріңіз профильден алынады.",
        "help_note": "Құпиясөзді ұмыттыңыз ба? Координаторға WhatsApp-қа жазыңыз.",
    },
    "en": {
        "h1": "Physician Account",
        "sub": "Sign in or register using your phone number or email address.",
        "tab_login": "Sign in",
        "tab_reg": "Register",
        "id_lbl": "Phone number or Email",
        "id_ph": "+7 777 000 00 00 or doctor@mail.kz",
        "sec_lbl": "Secondary contact (optional)",
        "sec_ph": "Email (if phone above) or phone number",
        "pass_lbl": "Password",
        "pass_ph": "At least 6 characters",
        "name_lbl": "Full name",
        "name_ph": "Dr. Aigul Ivanova",
        "spec_lbl": "Specialty",
        "spec_ph": "Cardiologist, GP, functional diagnostics…",
        "city_lbl": "City",
        "city_ph": "Almaty",
        "work_lbl": "Workplace / clinic",
        "work_ph": "Hospital or medical centre",
        "phone_lbl": "Phone",
        "email_lbl": "Email",
        "btn_login": "Sign in",
        "btn_reg": "Create account",
        "prof_h": "Physician profile",
        "btn_save": "Save profile",
        "btn_logout": "Sign out",
        "my_h": "My courses & applications",
        "my_sub": "Your course and conference enrollments, statuses and material links.",
        "avail_h": "1-click enrollment",
        "avail_sub": "Enroll without re-filling forms — your profile details are used automatically.",
        "help_note": "Forgot your password or need help? Message our coordinator on WhatsApp.",
    },
}

def cabinet_catalog_items():
    items = []
    if CONF:
        items.append({
            "id": CONF["id"],
            "title": CONF["title"],
            "dates": {l: f'{cval("date_short", l)} · {cval("venue", l)}' for l in LANGS},
            "price": "",
            "hours": "",
            "format": "conf",
            "ts": CONF["date"].replace("-", ""),
            "open": False,
        })
    for c in COURSES:
        if c.get("archived"):
            continue
        sessions = c.get("sessions") or [{}]
        disp = pick_display(c)
        price = (disp.get("price") or "").strip() or first_nonempty(sessions, "price")
        hours = (disp.get("hours") or "").strip() or first_nonempty(sessions, "hours")
        d_raw = (disp.get("dates") or "").strip()
        d_first = d_raw.split("\n")[0] if d_raw else ""
        items.append({
            "id": c["id"],
            "title": c["title"],
            "dates": {l: tr_dates(d_first, l) for l in LANGS},
            "price": price,
            "hours": hours,
            "format": c.get("format") or "online",
            "ts": (c.get("latest") or "").replace("-", ""),
            "open": bool(c.get("open")),
        })
    return items

def page_cabinet(lang):
    t = T[lang]
    cl = CAB_L[lang]
    baked_items = json.dumps(cabinet_catalog_items(), ensure_ascii=False).replace("</", "<\\/")
    return (head(lang, t["seo_cab_t"], t["seo_cab_d"], "cabinet.html")
            + header(lang, "cabinet.html", "cabinet.html") + f"""
<section class="section cab-sec"><div class="container" id="cabinetRoot">
<div class="cab-head">
<h1>{esc(cl["h1"])}</h1>
<p class="sub">{esc(cl["sub"])}</p>
</div>

<div class="cab-auth-wrap" id="cabAuthView">
<div class="card cab-auth-card">
<div class="cab-tabs" role="tablist">
<button type="button" class="cab-tab active" id="cabTabLogin">{esc(cl["tab_login"])}</button>
<button type="button" class="cab-tab" id="cabTabReg">{esc(cl["tab_reg"])}</button>
</div>
<div id="cabAuthMsg" class="cab-alert" hidden></div>

<form id="cabLoginForm" class="cab-form" autocomplete="on">
<label class="cab-field"><span>{esc(cl["id_lbl"])} *</span>
<input name="identifier" type="text" autocomplete="username" placeholder="{esc(cl["id_ph"])}" required>
</label>
<label class="cab-field"><span>{esc(cl["pass_lbl"])} *</span>
<input name="password" type="password" autocomplete="current-password" placeholder="{esc(cl["pass_ph"])}" required>
</label>
<button type="submit" class="btn btn-primary cab-submit">{esc(cl["btn_login"])}</button>
<p class="meta cab-help"><a href="{WA}" target="_blank" rel="noopener">{esc(cl["help_note"])}</a></p>
</form>

<form id="cabRegForm" class="cab-form" autocomplete="on" hidden>
<label class="cab-field"><span>{esc(cl["name_lbl"])} *</span>
<input name="name" type="text" autocomplete="name" maxlength="100" placeholder="{esc(cl["name_ph"])}" required>
</label>
<div class="cab-form-row">
<label class="cab-field"><span>{esc(cl["id_lbl"])} *</span>
<input name="identifier" type="text" autocomplete="username" placeholder="{esc(cl["id_ph"])}" required>
</label>
<label class="cab-field"><span>{esc(cl["sec_lbl"])}</span>
<input name="secondary" type="text" placeholder="{esc(cl["sec_ph"])}">
</label>
</div>
<div class="cab-form-row">
<label class="cab-field"><span>{esc(cl["spec_lbl"])}</span>
<input name="specialty" type="text" maxlength="80" placeholder="{esc(cl["spec_ph"])}">
</label>
<label class="cab-field"><span>{esc(cl["city_lbl"])}</span>
<input name="city" type="text" maxlength="60" placeholder="{esc(cl["city_ph"])}">
</label>
</div>
<label class="cab-field"><span>{esc(cl["pass_lbl"])} *</span>
<input name="password" type="password" autocomplete="new-password" minlength="6" placeholder="{esc(cl["pass_ph"])}" required>
</label>
<button type="submit" class="btn btn-primary cab-submit">{esc(cl["btn_reg"])}</button>
</form>
</div>
</div>

<div class="cab-dash" id="cabDashView" hidden>
<div id="cabDashNotice" class="cab-alert is-ok" hidden></div>
<div class="cab-dash-bar">
<div>
<h2 id="cabUserGreeting">—</h2>
<div class="meta" id="cabUserContact"></div>
</div>
<button type="button" class="btn btn-ghost btn-sm" id="cabLogoutBtn">{esc(cl["btn_logout"])}</button>
</div>

<div class="cab-grid">
<div class="card cab-panel">
<div class="card-body">
<h3>{esc(cl["prof_h"])}</h3>
<form id="cabProfileForm" class="cab-form">
<label class="cab-field"><span>{esc(cl["name_lbl"])} *</span>
<input name="name" type="text" maxlength="100" required>
</label>
<div class="cab-form-row">
<label class="cab-field"><span>{esc(cl["phone_lbl"])}</span>
<input name="phone" type="tel" maxlength="30" placeholder="+7 777 000 00 00">
</label>
<label class="cab-field"><span>{esc(cl["email_lbl"])}</span>
<input name="email" type="email" maxlength="80" placeholder="doctor@mail.kz">
</label>
</div>
<div class="cab-form-row">
<label class="cab-field"><span>{esc(cl["spec_lbl"])}</span>
<input name="specialty" type="text" maxlength="80" placeholder="{esc(cl["spec_ph"])}">
</label>
<label class="cab-field"><span>{esc(cl["city_lbl"])}</span>
<input name="city" type="text" maxlength="60" placeholder="{esc(cl["city_ph"])}">
</label>
</div>
<label class="cab-field"><span>{esc(cl["work_lbl"])}</span>
<input name="workplace" type="text" maxlength="120" placeholder="{esc(cl["work_ph"])}">
</label>
<div class="cab-prof-actions">
<button type="submit" class="btn btn-primary">{esc(cl["btn_save"])}</button>
<span id="cabProfileMsg" class="cab-saved-note" hidden></span>
</div>
</form>
</div>
</div>

<div class="cab-main-col">
<div class="card cab-panel">
<div class="card-body">
<h3>{esc(cl["my_h"])}</h3>
<p class="meta">{esc(cl["my_sub"])}</p>
<div id="cabMyCourses" class="cab-my-list"></div>
</div>
</div>

<div class="card cab-panel">
<div class="card-body">
<h3>{esc(cl["avail_h"])}</h3>
<p class="meta">{esc(cl["avail_sub"])}</p>
<div id="cabAvailCourses" class="cab-avail-grid"></div>
</div>
</div>
</div>
</div>
</div>

</div></section>
<script>
window.DOCTRINE_CABINET_ITEMS = {baked_items};
</script>
<script src="../assets/{av('js/cabinet.js')}"></script>
""" + contacts_section(lang) + footer(lang))

def page_admin(lang):
    baked_items = json.dumps(cabinet_catalog_items(), ensure_ascii=False).replace("</", "<\\/")
    return (head(lang, "Админ-панель координатора — Doctrine", "Управление оплатами, заявками, закрытыми чатами и сертификатами врачей Doctrine.", "admin.html")
            + header(lang, "", "admin.html") + f"""
<section class="section adm-sec"><div class="container" id="adminRoot">
<div class="cab-head">
<h1>Панель координатора Doctrine</h1>
<p class="sub">Учёт оплат (кто, когда и за что заплатил), подтверждение заявок, ссылки на закрытые чаты, записи и сертификаты.</p>
</div>

<div class="cab-auth-wrap" id="admLoginView">
<div class="card cab-auth-card">
<h3>Вход для координатора</h3>
<div id="admLoginErr" class="cab-alert is-err" hidden></div>
<form id="admLoginForm" class="cab-form">
<label class="cab-field"><span>Пароль администратора</span>
<input name="password" type="password" placeholder="Введите пароль" required>
</label>
<button type="submit" class="btn btn-primary cab-submit">Войти в админ-панель</button>
</form>
</div>
</div>

<div id="admPanelView" hidden>
<div class="adm-kpis">
<div class="card adm-kpi"><span>Оплачено записей</span><b id="kpiPaidCount">0</b></div>
<div class="card adm-kpi"><span>Общая сумма оплат</span><b id="kpiPaidSum">0 KZT</b></div>
<div class="card adm-kpi"><span>Ожидают оплаты</span><b id="kpiPendingCount">0</b></div>
<div class="card adm-kpi"><span>Врачей в базе</span><b id="kpiDocCount">0</b></div>
</div>

<div class="adm-toolbar">
<div class="adm-nav-tabs">
<button type="button" class="adm-nav-tab active" data-adm-tab="payments">💳 Оплаты (кто, когда и на что)</button>
<button type="button" class="adm-nav-tab" data-adm-tab="apps">📋 Заявки врачей</button>
<button type="button" class="adm-nav-tab" data-adm-tab="links">🔒 Закрытые чаты и записи</button>
<button type="button" class="adm-nav-tab" data-adm-tab="doctors">👨‍⚕️ База врачей</button>
</div>
<div class="adm-toolbar-right">
<button type="button" class="btn btn-ghost btn-sm" id="admRefreshBtn">↻ Обновить</button>
<button type="button" class="btn btn-ghost btn-sm" id="admLogoutBtn">Выйти</button>
</div>
</div>

<!-- TAB 1: ОПЛАТЫ -->
<div class="card cab-panel adm-pane" data-adm-pane="payments">
<div class="card-body">
<div class="adm-pane-head">
<div>
<h3>Реестр оплат: кто, когда и за что заплатил</h3>
<p class="meta" id="admPaymentsFilteredSum"></p>
</div>
<div class="adm-pane-actions">
<button type="button" class="btn btn-primary btn-sm" id="admToggleManualBtn">+ Внести оплату вручную</button>
<button type="button" class="btn btn-ghost btn-sm" id="admExportPaymentsBtn">⬇ Скачать Excel / CSV</button>
</div>
</div>

<div id="admManualPayBox" class="adm-manual-box" hidden>
<h4>Добавить оплату вручную (если врач оплатил напрямую через Kaspi / WhatsApp)</h4>
<form id="admManualPayForm" class="cab-form">
<div class="cab-form-row">
<label class="cab-field"><span>ФИО врача *</span>
<input name="name" type="text" placeholder="Иванова Айгуль Сериковна" required>
</label>
<label class="cab-field"><span>Телефон или Email врача *</span>
<input name="contact" type="text" placeholder="+7 777 000 00 00" required>
</label>
</div>
<div class="cab-form-row">
<label class="cab-field"><span>За какой курс / конференцию *</span>
<select name="courseId" id="admManualCourse" class="adm-select"></select>
</label>
<label class="cab-field"><span>Сумма оплаты (KZT) *</span>
<input name="amount" id="admManualAmount" type="number" placeholder="45000" required>
</label>
</div>
<div class="cab-form-row">
<label class="cab-field"><span>Дата оплаты *</span>
<input name="paidDate" type="date" required>
</label>
<label class="cab-field"><span>Способ оплаты / комментарий</span>
<input name="note" type="text" placeholder="Kaspi / перевод / счёт">
</label>
</div>
<label class="cab-field"><span>Ссылка на именной сертификат (если уже готов)</span>
<input name="certUrl" type="url" placeholder="https://drive.google.com/...">
</label>
<div>
<button type="submit" class="btn btn-primary btn-sm">Сохранить оплату и открыть доступ врачу ✓</button>
</div>
</form>
</div>

<div class="adm-filters">
<select id="admPayCourseFilter" class="adm-select"></select>
<input id="admPaySearch" type="search" class="adm-search" placeholder="Поиск по ФИО, телефону, курсу, способу оплаты…">
</div>

<div class="adm-table-wrap">
<table class="adm-table">
<thead>
<tr>
<th>Когда</th>
<th>Кто заплатил (Врач)</th>
<th>За что (Курс / Конференция)</th>
<th>Сумма и способ</th>
<th>Сертификат участника</th>
<th>Действие</th>
</tr>
</thead>
<tbody id="admPaymentsBody"></tbody>
</table>
</div>
</div>
</div>

<!-- TAB 2: ЗАЯВКИ -->
<div class="card cab-panel adm-pane" data-adm-pane="apps" hidden>
<div class="card-body">
<h3>Заявки врачей из личного кабинета</h3>
<p class="meta">Здесь отображаются все врачи, нажавшие «Записаться». Подтвердите оплату, чтобы открыть врачу закрытый чат и запись курса.</p>
<div class="adm-filters">
<select id="admAppStatusFilter" class="adm-select">
<option value="all">Все статусы</option>
<option value="applied">Ожидают оплаты / Консультация</option>
<option value="paid">Оплачено (доступ открыт)</option>
<option value="completed">Сертификат выдан</option>
</select>
<select id="admAppCourseFilter" class="adm-select"></select>
<input id="admAppSearch" type="search" class="adm-search" placeholder="Поиск по ФИО или телефону врача…">
</div>
<div class="adm-table-wrap">
<table class="adm-table">
<thead>
<tr>
<th>Врач и контакты</th>
<th>Курс / Конференция</th>
<th>Статус</th>
<th>Подтверждение оплаты / Выдача сертификата</th>
</tr>
</thead>
<tbody id="admAppsBody"></tbody>
</table>
</div>
</div>
</div>

<!-- TAB 3: ДОСТУПЫ КУРСОВ -->
<div class="card cab-panel adm-pane" data-adm-pane="links" hidden>
<div class="card-body">
<h3>Закрытые чаты и записи лекций по курсам</h3>
<p class="meta">Укажите ссылку на закрытый чат (WhatsApp / Telegram) и ссылку на запись/эфир один раз для курса — они автоматически откроются в личном кабинете у всех врачей, у которых по этому курсу подтверждена оплата.</p>
<div id="admLinksList" class="adm-links-list"></div>
</div>
</div>

<!-- TAB 4: БАЗА ВРАЧЕЙ -->
<div class="card cab-panel adm-pane" data-adm-pane="doctors" hidden>
<div class="card-body">
<div class="adm-pane-head">
<div>
<h3>Зарегистрированные врачи</h3>
<p class="meta">Все врачи, создавшие личный кабинет на сайте.</p>
</div>
<button type="button" class="btn btn-ghost btn-sm" id="admExportDoctorsBtn">⬇ Скачать базу врачей (CSV)</button>
</div>
<div class="adm-filters">
<input id="admDocSearch" type="search" class="adm-search" placeholder="Поиск по ФИО, специальности, городу, телефону…">
</div>
<div class="adm-table-wrap">
<table class="adm-table">
<thead>
<tr>
<th>ФИО врача</th>
<th>Телефон / Email</th>
<th>Специальность / Город</th>
<th>Курсы и оплаты</th>
<th>Регистрация</th>
</tr>
</thead>
<tbody id="admDoctorsBody"></tbody>
</table>
</div>
</div>
</div>

</div>
</div></section>
<script>
window.DOCTRINE_CABINET_ITEMS = {baked_items};
</script>
<script src="../assets/{av('js/admin.js')}"></script>
""" + footer(lang))

BUILDERS = {"index.html": page_index, "schedule.html": page_schedule,
            "course.html": page_course, "teachers.html": page_teachers,
            "conference.html": page_conference, "cabinet.html": page_cabinet,
            "admin.html": page_admin, "404.html": page_404}

for lang in LANGS:
    d = os.path.join(DOCS, lang)
    os.makedirs(d, exist_ok=True)
    for name, fn in BUILDERS.items():
        page = fn(lang)
        path = os.path.join(d, name)
        if page:
            with open(path, "w", encoding="utf-8") as f:
                f.write(page)
        elif os.path.exists(path):  # e.g. conference page without conference.json
            os.remove(path)

# root redirect + sitemap + robots
with open(os.path.join(DOCS, "index.html"), "w", encoding="utf-8") as f:
    f.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=ru/"></head><body><a href="ru/">ru</a></body></html>')
with open(os.path.join(DOCS, ".nojekyll"), "w") as f:
    f.write("")
BASE = "https://doctrine.kz"
pages = ["index.html", "schedule.html", "course.html", "teachers.html", "cabinet.html"]
if CONF:
    pages.append("conference.html")
urls = [f"{BASE}/{l}/{p}" for l in LANGS for p in pages]
with open(os.path.join(DOCS, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"<url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>")
with open(os.path.join(DOCS, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
print("built:", sum(1 for l in LANGS for _ in os.listdir(os.path.join(DOCS, l))), "pages")
