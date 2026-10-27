// Doctrine Personal Cabinet: registration & sign-in by phone number or email,
// doctor profile, 1-click enrollment for courses & conference, and "My courses".
(function () {
  var root = document.getElementById("cabinetRoot");
  if (!root) return;

  var lang = document.documentElement.lang || "ru";
  var L = {
    ru: {
      errId: "Введите корректный номер телефона (например, +7 777 000 00 00) или email.",
      errPass: "Пароль должен содержать минимум 6 символов.",
      errName: "Укажите ваше ФИО.",
      errExists: "Аккаунт с этим номером или почтой уже зарегистрирован. Войдите во вкладке «Вход».",
      errNotFound: "Аккаунт не найден. Проверьте номер/почту или зарегистрируйтесь.",
      errWrongPass: "Неверный пароль. Попробуйте ещё раз.",
      saved: "Профиль сохранён ✓",
      enrolledToast: "Заявка отправлена в Google Form и добавлена в «Мои курсы и заявки» ✓ Мы свяжемся с вами для консультации и оплаты.",
      statusApplied: "Заявка отправлена",
      statusConfirmed: "Подтверждено",
      statusDone: "Завершён",
      enroll1Click: "Записаться в 1 клик",
      enrolledBtn: "Вы записаны ✓",
      cancelEnroll: "Отменить запись",
      waConfirm: "Написать координатору в WhatsApp →",
      materialBtn: "Материалы / эфир →",
      certBtn: "Скачать сертификат →",
      emptyMy: "У вас пока нет активных записей. Выберите подходящий курс в разделе «Расписание».",
      confBadge: "Конференция",
      online: "Онлайн",
      offline: "Офлайн",
      hybrid: "Очно + онлайн",
      waMsgPrefix: "Здравствуйте! Я записался(-ась) через личный кабинет Doctrine на «",
      waMsgMid: "». ФИО: ",
      waMsgPhone: ", тел.: "
    },
    kk: {
      errId: "Дұрыс телефон нөмірін (мысалы, +7 777 000 00 00) немесе email енгізіңіз.",
      errPass: "Құпиясөз кемінде 6 таңбадан тұруы керек.",
      errName: "Аты-жөніңізді көрсетіңіз.",
      errExists: "Бұл нөмір немесе email тіркелген. «Кіру» қойындысы арқылы кіріңіз.",
      errNotFound: "Аккаунт табылмады. Нөмірді/поштаны тексеріңіз немесе тіркеліңіз.",
      errWrongPass: "Құпиясөз қате. Қайтадан көріңіз.",
      saved: "Профиль сақталды ✓",
      enrolledToast: "Өтінім Google Form-ға жіберілді және «Менің курстарым» бөліміне қосылды ✓ Кеңес алу және төлем бойынша хабарласамыз.",
      statusApplied: "Өтінім жіберілді",
      statusConfirmed: "Расталды",
      statusDone: "Аяқталды",
      enroll1Click: "1 басумен жазылу",
      enrolledBtn: "Сіз жазылдыңыз ✓",
      cancelEnroll: "Жазылудан бас тарту",
      waConfirm: "Координаторға WhatsApp-қа жазу →",
      materialBtn: "Материалдар / эфир →",
      certBtn: "Сертификатты жүктеу →",
      emptyMy: "Сізде әзірге белсенді жазбалар жоқ. «Кесте» бөлімінен курс таңдаңыз.",
      confBadge: "Конференция",
      online: "Онлайн",
      offline: "Офлайн",
      hybrid: "Офлайн + онлайн",
      waMsgPrefix: "Сәлеметсіз бе! Мен Doctrine жеке кабинеті арқылы «",
      waMsgMid: "» бағдарламасына жазылдым. Аты-жөнім: ",
      waMsgPhone: ", тел.: "
    },
    en: {
      errId: "Enter a valid phone number (e.g. +7 777 000 00 00) or email address.",
      errPass: "Password must be at least 6 characters.",
      errName: "Please enter your full name.",
      errExists: "An account with this phone or email already exists. Please sign in.",
      errNotFound: "Account not found. Check your phone/email or register a new account.",
      errWrongPass: "Incorrect password. Please try again.",
      saved: "Profile saved ✓",
      enrolledToast: "Application submitted to Google Form and added to “My courses” ✓ We will contact you regarding consultation and payment.",
      statusApplied: "Application sent",
      statusConfirmed: "Confirmed",
      statusDone: "Completed",
      enroll1Click: "1-click enroll",
      enrolledBtn: "Enrolled ✓",
      cancelEnroll: "Cancel",
      waConfirm: "Message coordinator on WhatsApp →",
      materialBtn: "Materials / stream →",
      certBtn: "Download certificate →",
      emptyMy: "You have no active enrollments yet. Browse upcoming programs in the “Schedule” section.",
      confBadge: "Conference",
      online: "Online",
      offline: "Offline",
      hybrid: "In person + online",
      waMsgPrefix: "Hello! I registered via the Doctrine personal account for “",
      waMsgMid: "”. Name: ",
      waMsgPhone: ", phone: "
    }
  }[lang] || {};

  var LS_USER = "doctrine_cabinet_user";
  var LS_DB = "doctrine_cabinet_db";
  var WA_BASE = "https://wa.me/77770357345";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Normalize phone (+7XXXXXXXXXX) or email
  function parseIdentifier(raw) {
    var v = String(raw || "").trim();
    if (!v) return null;
    if (v.indexOf("@") !== -1) {
      var em = v.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return null;
      var ek = "e_" + em.replace(/[^a-z0-9]/g, "_");
      return { type: "email", value: em, key: ek };
    }
    var digits = v.replace(/\D+/g, "");
    if (digits.length === 11 && (digits.charAt(0) === "8" || digits.charAt(0) === "7")) {
      digits = "7" + digits.slice(1);
    } else if (digits.length === 10 && digits.charAt(0) === "7") {
      digits = "7" + digits;
    }
    if (digits.length < 10 || digits.length > 15) return null;
    return { type: "phone", value: "+" + digits, key: "p_" + digits };
  }

  // Deterministic SHA-256 (Web Crypto API with pure-JS fallback)
  function fallbackHash(str) {
    var h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "fb_" + (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
  }

  function hashPassword(pass) {
    var salted = "doctrine-kz-v1:" + String(pass || "");
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted))
        .then(function (buf) {
          var arr = Array.from(new Uint8Array(buf));
          return arr.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
        })
        .catch(function () { return fallbackHash(salted); });
    }
    return Promise.resolve(fallbackHash(salted));
  }

  // Local cache + Firebase Realtime Database sync
  var db = null;
  try {
    if (window.firebase && window.DOCTRINE_CABINET_FB) {
      var appName = "doctrineCabinet";
      var existing = (window.firebase.apps || []).find(function (a) { return a.name === appName; });
      var app = existing || window.firebase.initializeApp(window.DOCTRINE_CABINET_FB, appName);
      db = app.database();
    }
  } catch (e) { db = null; }

  function readLocalDB() {
    try { return JSON.parse(localStorage.getItem(LS_DB) || "{}"); } catch (e) { return {}; }
  }
  function writeLocalDB(data) {
    try { localStorage.setItem(LS_DB, JSON.stringify(data || {})); } catch (e) { /* ignore */ }
  }
  function getSessionUser() {
    try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { return null; }
  }
  function setSessionUser(u) {
    try {
      if (u) localStorage.setItem(LS_USER, JSON.stringify(u));
      else localStorage.removeItem(LS_USER);
      if (window. updateDoctrineCabinetNav) window.updateDoctrineCabinetNav();
    } catch (e) { /* ignore */ }
  }

  function fetchUserByKey(key) {
    var local = readLocalDB();
    var localHit = (local.users && local.users[key]) || null;
    if (!db) return Promise.resolve(localHit);

    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve(localHit); }
      }, 4500);

      db.ref("cabinetUsers/" + key).once("value", function (snap) {
        var val = snap && snap.val();
        if (val) {
          clearTimeout(timer);
          if (!done) { done = true; resolve(val); }
          return;
        }
        // Check alias table (when user logs in with secondary phone/email)
        db.ref("cabinetAliases/" + key).once("value", function (asnap) {
          var targetUid = asnap && asnap.val();
          if (!targetUid) {
            clearTimeout(timer);
            if (!done) { done = true; resolve(localHit); }
            return;
          }
          db.ref("cabinetUsers/" + targetUid).once("value", function (usnap) {
            clearTimeout(timer);
            if (!done) { done = true; resolve((usnap && usnap.val()) || localHit); }
          }, function () {
            clearTimeout(timer);
            if (!done) { done = true; resolve(localHit); }
          });
        }, function () {
          clearTimeout(timer);
          if (!done) { done = true; resolve(localHit); }
        });
      }, function () {
        clearTimeout(timer);
        if (!done) { done = true; resolve(localHit); }
      });
    });
  }

  function saveUserRecord(user) {
    var local = readLocalDB();
    local.users = local.users || {};
    local.users[user.uid] = user;
    if (user.phone) {
      var pId = parseIdentifier(user.phone);
      if (pId) local.users[pId.key] = user;
    }
    if (user.email) {
      var eId = parseIdentifier(user.email);
      if (eId) local.users[eId.key] = user;
    }
    writeLocalDB(local);
    setSessionUser(user);

    if (!db) return Promise.resolve(user);
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { resolve(user); }, 4000);
      db.ref("cabinetUsers/" + user.uid).set(user, function () {
        if (user.phone) {
          var p = parseIdentifier(user.phone);
          if (p && p.key !== user.uid) db.ref("cabinetAliases/" + p.key).set(user.uid);
        }
        if (user.email) {
          var em = parseIdentifier(user.email);
          if (em && em.key !== user.uid) db.ref("cabinetAliases/" + em.key).set(user.uid);
        }
        clearTimeout(timer);
        resolve(user);
      });
    });
  }

  // DOM elements
  var authView = document.getElementById("cabAuthView");
  var dashView = document.getElementById("cabDashView");
  var tabLogin = document.getElementById("cabTabLogin");
  var tabReg = document.getElementById("cabTabReg");
  var formLogin = document.getElementById("cabLoginForm");
  var formReg = document.getElementById("cabRegForm");
  var authMsg = document.getElementById("cabAuthMsg");
  var profForm = document.getElementById("cabProfileForm");
  var profMsg = document.getElementById("cabProfileMsg");
  var logoutBtn = document.getElementById("cabLogoutBtn");
  var myList = document.getElementById("cabMyCourses");
  var availList = document.getElementById("cabAvailCourses");
  var userTitle = document.getElementById("cabUserGreeting");
  var userSub = document.getElementById("cabUserContact");
  var dashNotice = document.getElementById("cabDashNotice");

  var GFORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLScYw9nEO2795mUJKK9XbUweuwuwEyh7T97OE5DnzlL49QUw-w/formResponse";

  function mapCourseToGFormOption(courseTitleRu) {
    var t = String(courseTitleRu || "").toLowerCase().replace(/ё/g, "е");
    if (t.indexOf("клапан") !== -1) return 'Эхокардиография. Продвинутый уровень. «Клапаны под контролем" Октябрь, 45 тыс';
    if (t.indexOf("холтер") !== -1 && t.indexOf("смад") !== -1) return "Как читать Холтер и СМАД, чтобы не ошибаться? Ноябрь, Онлайн 45 тыс";
    if (t.indexOf("кардиоонкол") !== -1) return "Кардиоонкология онлайн 50 тыс. октябрь- 19, 21,  23";
    if (t.indexOf("экг") !== -1) return "Электрокардиография (полный курс) 100 тыс тенге октябрь  на казахском/русском";
    if (t.indexOf("гипертенз") !== -1 || t.indexOf("беремен") !== -1) return "Гипертензивные расстройства  и другие сердечно-сосудистые патологии во время беременности. 1 вебинар. 3 часа, 1.5 зачетных единиц  22 сентября, 17.00. Стоимость  20 тыс";
    if (t.indexOf("qt") !== -1) return "Интервал QT  и ЛП.1 вебинар. 3 часа, 1.5 ЗЕ. по мере формирования групп Стоимость 15 тыс";
    if (t.indexOf("женщин") !== -1) return "Сердечно сосудистое здоровье женщины в разные периоды жизни. 2 Вебинара. 6 часов, 3 зачетные единицы. Стоимость 25 тыс";
    if (t.indexOf("экс") !== -1) return "Особенности Холтеровского мониторирования у пациентов с ЭКС, 30 тыс";
    if (t.indexOf("с нуля") !== -1) return "ЭХОКГ с нуля для врача-клинициста,  40 тыс тенге (предзапись)";
    if (t.indexOf("нагрузоч") !== -1) return "Нагрузочное тестирование в записи стоимость:30 тысяч тенге";
    return 'Эхокардиография. Продвинутый уровень. «Клапаны под контролем" Октябрь, 45 тыс';
  }

  function submitGoogleForm(user, cat) {
    try {
      var ruTitle = (cat && cat.title && cat.title.ru) || (cat && cat.id) || "";
      var datesStr = (cat && cat.dates && cat.dates.ru) || "";
      var params = new URLSearchParams();
      params.append("entry.879967369", user.name || "Врач (личный кабинет)");
      params.append("entry.1929126407", "Личный кабинет");
      params.append("entry.1550552032", "предпочитаю не указывать");
      params.append("entry.1441737628", user.phone || user.email || "Не указан");
      params.append("entry.2080135981", user.email || (user.phone ? user.phone + " (WhatsApp)" : "cabinet@doctrine.kz"));
      params.append("entry.792610250", user.specialty || "Врач");
      params.append("entry.567902859", "3-5 лет");
      params.append("entry.1829931592", user.workplace || "Личный кабинет сайта");
      params.append("entry.1272487501", user.city || "Казахстан");
      params.append("entry.108758175", mapCourseToGFormOption(ruTitle));
      params.append("entry.1303695089", "Сайт");
      params.append("entry.843712369", "Я даю согласие на обработку моих персональных данных в соответствии с законодательством РК");
      params.append("entry.970047895", "Ознакомлен (а)");
      params.append("entry.1941425607", "Заявка в 1 клик из личного кабинета Doctrine: " + ruTitle + (datesStr ? " (" + datesStr + ")" : "") + (cat && cat.price ? ", " + cat.price : ""));
      params.append("fvv", "1");
      params.append("pageHistory", "0");

      return fetch(GFORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
      }).catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function showDashNotice(text) {
    if (!dashNotice) return;
    dashNotice.textContent = text || "";
    dashNotice.hidden = !text;
    if (text) {
      setTimeout(function () { dashNotice.hidden = true; }, 6500);
    }
  }

  function showAuthMsg(text, isOk) {
    if (!authMsg) return;
    authMsg.textContent = text || "";
    authMsg.className = "cab-alert " + (isOk ? "is-ok" : "is-err");
    authMsg.hidden = !text;
  }

  function switchTab(mode) {
    var isLogin = (mode === "login");
    if (tabLogin) tabLogin.classList.toggle("active", isLogin);
    if (tabReg) tabReg.classList.toggle("active", !isLogin);
    if (formLogin) formLogin.hidden = !isLogin;
    if (formReg) formReg.hidden = isLogin;
    showAuthMsg("");
  }

  if (tabLogin) tabLogin.addEventListener("click", function () { switchTab("login"); });
  if (tabReg) tabReg.addEventListener("click", function () { switchTab("register"); });

  var catalogAll = window.DOCTRINE_CABINET_ITEMS || [];
  var nowD = new Date();
  var todayTs = nowD.getFullYear() * 10000 + (nowD.getMonth() + 1) * 100 + nowD.getDate();
  var catalog = catalogAll.filter(function (c) {
    if (c.open) return true;
    var ts = parseInt(c.ts || "0", 10);
    return !ts || ts >= todayTs;
  });

  function renderMyCourses(user) {
    if (!myList) return;
    var map = (user && user.enrollments) || {};
    var keys = Object.keys(map);
    if (!keys.length) {
      myList.innerHTML = '<div class="cab-empty">' + esc(L.emptyMy) + "</div>";
      return;
    }
    keys.sort(function (a, b) {
      return ((map[b] && map[b].createdAt) || 0) - ((map[a] && map[a].createdAt) || 0);
    });
    myList.innerHTML = keys.map(function (cid) {
      var item = map[cid];
      var cat = catalog.find(function (x) { return x.id === cid; }) || {};
      var title = (cat.title && (cat.title[lang] || cat.title.ru)) || item.title || cid;
      var dates = (cat.dates && (cat.dates[lang] || cat.dates.ru)) || item.dates || "";
      var fmt = cat.format || item.format || "online";
      var fmtLabel = fmt === "conf" ? L.confBadge : (fmt === "offline" ? L.offline : L.online);
      var statusLabel = item.status === "confirmed" ? L.statusConfirmed
        : (item.status === "done" ? L.statusDone : L.statusApplied);
      var statusCls = item.status === "confirmed" ? "st-confirmed" : "st-applied";
      var waText = L.waMsgPrefix + title + L.waMsgMid + (user.name || "")
        + (user.phone ? L.waMsgPhone + user.phone : "");
      var waHref = WA_BASE + "?text=" + encodeURIComponent(waText);
      var extraLinks = "";
      if (item.materialUrl) {
        extraLinks += '<a class="btn btn-primary btn-sm" href="' + esc(item.materialUrl) + '" target="_blank" rel="noopener">' + esc(L.materialBtn) + "</a>";
      }
      if (item.certUrl) {
        extraLinks += '<a class="btn btn-ghost btn-sm" href="' + esc(item.certUrl) + '" target="_blank" rel="noopener">' + esc(L.certBtn) + "</a>";
      }
      return '<div class="cab-course-item">'
        + '<div class="cab-course-top">'
        + '<div class="badges"><span class="badge format">' + esc(fmtLabel) + '</span>'
        + '<span class="badge cab-status ' + statusCls + '">' + esc(statusLabel) + "</span></div>"
        + '<button type="button" class="cab-cancel-btn" data-cancel-id="' + esc(cid) + '">' + esc(L.cancelEnroll) + "</button>"
        + "</div>"
        + "<h4>" + esc(title) + "</h4>"
        + (dates ? '<div class="meta">' + esc(dates) + "</div>" : "")
        + '<div class="cab-course-actions">'
        + extraLinks
        + '<a class="btn btn-ghost btn-sm" href="' + esc(waHref) + '" target="_blank" rel="noopener">' + esc(L.waConfirm) + "</a>"
        + "</div></div>";
    }).join("");

    myList.querySelectorAll("[data-cancel-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-cancel-id");
        var u = getSessionUser();
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        delete u.enrollments[cid];
        saveUserRecord(u).then(function () {
          renderMyCourses(u);
          renderAvailCourses(u);
        });
      });
    });
  }

  function renderAvailCourses(user) {
    if (!availList) return;
    var enrolledMap = (user && user.enrollments) || {};
    availList.innerHTML = catalog.map(function (c) {
      var title = (c.title && (c.title[lang] || c.title.ru)) || "";
      var dates = (c.dates && (c.dates[lang] || c.dates.ru)) || "";
      var price = c.price || "";
      var isConf = c.format === "conf";
      var badge = isConf
        ? '<span class="badge conf-badge">' + esc(L.confBadge) + '</span><span class="badge format fmt-hybrid">' + esc(L.hybrid) + "</span>"
        : '<span class="badge format ' + (c.format === "offline" ? "fmt-offline" : "fmt-online") + '">' + esc(c.format === "offline" ? L.offline : L.online) + "</span>"
          + (c.hours ? '<span class="badge hours">' + esc(c.hours) + "</span>" : "");
      var isEnrolled = !!enrolledMap[c.id];
      var btnCls = isEnrolled ? "btn btn-ghost btn-sm is-enrolled" : "btn btn-primary btn-sm";
      var btnTxt = isEnrolled ? L.enrolledBtn : L.enroll1Click;
      return '<div class="cab-avail-card' + (isConf ? " is-conf" : "") + '">'
        + '<div class="badges">' + badge + "</div>"
        + "<h4>" + esc(title) + "</h4>"
        + (dates ? '<div class="meta">' + esc(dates) + "</div>" : "")
        + '<div class="cab-avail-foot">'
        + '<span class="cab-avail-price">' + esc(price) + "</span>"
        + '<button type="button" class="' + btnCls + '" data-enroll-id="' + esc(c.id) + '"' + (isEnrolled ? " disabled" : "") + ">" + esc(btnTxt) + "</button>"
        + "</div></div>";
    }).join("");

    availList.querySelectorAll("[data-enroll-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-enroll-id");
        var u = getSessionUser();
        if (!u) return;
        var cat = catalog.find(function (x) { return x.id === cid; });
        if (!cat) return;
        u.enrollments = u.enrollments || {};
        var cTitle = (cat.title && (cat.title[lang] || cat.title.ru)) || cid;
        var cDates = (cat.dates && (cat.dates[lang] || cat.dates.ru)) || "";
        u.enrollments[cid] = {
          courseId: cid,
          title: cTitle,
          dates: cDates,
          format: cat.format || "online",
          status: "applied",
          createdAt: Date.now()
        };
        if (db) {
          db.ref("cabinetApplications").push({
            uid: u.uid,
            name: u.name || "",
            phone: u.phone || "",
            email: u.email || "",
            specialty: u.specialty || "",
            city: u.city || "",
            courseId: cid,
            courseTitle: (cat.title && cat.title.ru) || cTitle,
            createdAt: Date.now()
          });
        }
        submitGoogleForm(u, cat);
        saveUserRecord(u).then(function () {
          showDashNotice(L.enrolledToast);
          renderMyCourses(u);
          renderAvailCourses(u);
        });
      });
    });
  }

  function renderDashboard(user) {
    if (!user) {
      if (authView) authView.hidden = false;
      if (dashView) dashView.hidden = true;
      return;
    }
    if (authView) authView.hidden = true;
    if (dashView) dashView.hidden = false;

    if (userTitle) userTitle.textContent = user.name || "—";
    if (userSub) {
      var parts = [];
      if (user.phone) parts.push(user.phone);
      if (user.email) parts.push(user.email);
      if (user.specialty) parts.push(user.specialty);
      userSub.textContent = parts.join(" · ");
    }
    if (profForm) {
      profForm.elements.name.value = user.name || "";
      profForm.elements.phone.value = user.phone || "";
      profForm.elements.email.value = user.email || "";
      profForm.elements.specialty.value = user.specialty || "";
      profForm.elements.city.value = user.city || "";
      profForm.elements.workplace.value = user.workplace || "";
    }
    renderMyCourses(user);
    renderAvailCourses(user);

    // Refresh user from cloud in background if available
    if (db && user.uid) {
      db.ref("cabinetUsers/" + user.uid).once("value", function (snap) {
        var remote = snap && snap.val();
        if (remote && (remote.updatedAt || 0) > (user.updatedAt || 0)) {
          setSessionUser(remote);
          renderMyCourses(remote);
          renderAvailCourses(remote);
        }
      });
    }
  }

  // Registration submit
  if (formReg) {
    formReg.addEventListener("submit", function (e) {
      e.preventDefault();
      showAuthMsg("");
      var name = (formReg.elements.name.value || "").trim();
      var rawId = (formReg.elements.identifier.value || "").trim();
      var rawSecond = (formReg.elements.secondary && formReg.elements.secondary.value || "").trim();
      var specialty = (formReg.elements.specialty.value || "").trim();
      var city = (formReg.elements.city.value || "").trim();
      var pass = formReg.elements.password.value || "";

      if (!name) { showAuthMsg(L.errName); return; }
      var parsed = parseIdentifier(rawId);
      if (!parsed) { showAuthMsg(L.errId); return; }
      if (pass.length < 6) { showAuthMsg(L.errPass); return; }

      var phone = parsed.type === "phone" ? parsed.value : "";
      var email = parsed.type === "email" ? parsed.value : "";
      if (rawSecond) {
        var p2 = parseIdentifier(rawSecond);
        if (p2) {
          if (p2.type === "phone" && !phone) phone = p2.value;
          if (p2.type === "email" && !email) email = p2.value;
        }
      }

      fetchUserByKey(parsed.key).then(function (existing) {
        if (existing && existing.passHash) {
          showAuthMsg(L.errExists);
          return;
        }
        hashPassword(pass).then(function (passHash) {
          var newUser = {
            uid: parsed.key,
            name: name.slice(0, 100),
            phone: phone,
            email: email,
            specialty: specialty.slice(0, 80),
            city: city.slice(0, 60),
            workplace: "",
            passHash: passHash,
            enrollments: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          saveUserRecord(newUser).then(function (u) {
            formReg.reset();
            renderDashboard(u);
          });
        });
      });
    });
  }

  // Login submit
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      showAuthMsg("");
      var rawId = (formLogin.elements.identifier.value || "").trim();
      var pass = formLogin.elements.password.value || "";
      var parsed = parseIdentifier(rawId);
      if (!parsed) { showAuthMsg(L.errId); return; }
      if (!pass) { showAuthMsg(L.errPass); return; }

      Promise.all([fetchUserByKey(parsed.key), hashPassword(pass)]).then(function (res) {
        var user = res[0];
        var hash = res[1];
        if (!user || !user.passHash) {
          showAuthMsg(L.errNotFound);
          return;
        }
        if (user.passHash !== hash) {
          showAuthMsg(L.errWrongPass);
          return;
        }
        setSessionUser(user);
        formLogin.reset();
        renderDashboard(user);
      });
    });
  }

  // Profile save
  if (profForm) {
    profForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = getSessionUser();
      if (!u) return;
      var name = (profForm.elements.name.value || "").trim();
      if (!name) return;
      var rawPhone = (profForm.elements.phone.value || "").trim();
      var rawEmail = (profForm.elements.email.value || "").trim();
      var pPhone = rawPhone ? parseIdentifier(rawPhone) : null;
      var pEmail = rawEmail ? parseIdentifier(rawEmail) : null;

      u.name = name.slice(0, 100);
      u.phone = (pPhone && pPhone.type === "phone") ? pPhone.value : rawPhone.slice(0, 30);
      u.email = (pEmail && pEmail.type === "email") ? pEmail.value : rawEmail.slice(0, 80);
      u.specialty = (profForm.elements.specialty.value || "").trim().slice(0, 80);
      u.city = (profForm.elements.city.value || "").trim().slice(0, 60);
      u.workplace = (profForm.elements.workplace.value || "").trim().slice(0, 120);
      u.updatedAt = Date.now();

      saveUserRecord(u).then(function (saved) {
        renderDashboard(saved);
        if (profMsg) {
          profMsg.textContent = L.saved;
          profMsg.hidden = false;
          setTimeout(function () { profMsg.hidden = true; }, 3500);
        }
      });
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      setSessionUser(null);
      renderDashboard(null);
      switchTab("login");
    });
  }

  // Initial state
  renderDashboard(getSessionUser());
})();
