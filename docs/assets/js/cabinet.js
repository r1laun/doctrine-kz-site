// Doctrine Personal Cabinet: registration & sign-in by phone number or email,
// doctor profile, 1-click enrollment (including ?enroll=ID from schedule/course pages),
// payment statuses, and unlocked access to closed chat, recordings, and certificates.
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
      enrolledBanner: "Курс добавлен в ваши заявки ✓ Консультация и реквизиты для оплаты — в карточке курса ниже.",
      pendingEnrollHint: "Войдите или создайте аккаунт за 15 секунд — и вы будете автоматически записаны на: ",
      statusApplied: "Заявка · ожидает оплаты",
      statusPaid: "Оплачено · доступ открыт ✓",
      statusDone: "Сертификат выдан ✓",
      paidDateLbl: "Оплачено: ",
      lockNote: "🔒 Закрытый чат курса, запись лекций и именной сертификат откроются здесь автоматически после подтверждения оплаты.",
      paidWaitLinks: "Оплата подтверждена ✓ Ссылки на закрытый чат и запись появятся здесь перед стартом потока.",
      enroll1Click: "Записаться · бронь",
      enrolledBtn: "В ваших заявках ✓",
      paidBtn: "Оплачено ✓",
      cancelEnroll: "Отменить заявку",
      waConsultPay: "Проконсультироваться / Оплатить в WhatsApp →",
      waCoordinator: "Написать координатору в WhatsApp →",
      chatBtn: "💬 Закрытый чат курса →",
      recordBtn: "▶️ Смотреть запись / эфир →",
      certBtn: "🎓 Скачать сертификат →",
      emptyMy: "У вас пока нет активных заявок. Выберите курс или конференцию ниже или в расписании — запись бесплатна и ни к чему не обязывает.",
      confBadge: "Конференция",
      online: "Онлайн",
      offline: "Офлайн",
      hybrid: "Очно + онлайн",
      waPayPrefix: "Здравствуйте! Я оставил(а) заявку в личном кабинете Doctrine на курс «",
      waPayMid: "». Хочу проконсультироваться / получить реквизиты для оплаты. Врач: ",
      waPayPhone: ", тел.: "
    },
    kk: {
      errId: "Дұрыс телефон нөмірін (мысалы, +7 777 000 00 00) немесе email енгізіңіз.",
      errPass: "Құпиясөз кемінде 6 таңбадан тұруы керек.",
      errName: "Аты-жөніңізді көрсетіңіз.",
      errExists: "Бұл нөмір немесе email тіркелген. «Кіру» қойындысы арқылы кіріңіз.",
      errNotFound: "Аккаунт табылмады. Нөмірді/поштаны тексеріңіз немесе тіркеліңіз.",
      errWrongPass: "Құпиясөз қате. Қайтадан көріңіз.",
      saved: "Профиль сақталды ✓",
      enrolledBanner: "Курс өтінімдеріңізге қосылды ✓ Кеңес алу және төлем деректемелері төменде.",
      pendingEnrollHint: "Аккаунтқа кіріңіз немесе тіркеліңіз — сіз автоматты түрде келесі бағдарламаға жазыласыз: ",
      statusApplied: "Өтінім · төлем күтілуде",
      statusPaid: "Төленді · қолжетімді ✓",
      statusDone: "Сертификат берілді ✓",
      paidDateLbl: "Төленген күні: ",
      lockNote: "🔒 Жабық чат, дәрістер жазбасы және сертификат төлем расталғаннан кейін осында автоматты түрде ашылады.",
      paidWaitLinks: "Төлем расталды ✓ Жабық чат пен жазба сілтемелері курс басталар алдында осында пайда болады.",
      enroll1Click: "Жазылу · бронь",
      enrolledBtn: "Өтінімдерде ✓",
      paidBtn: "Төленді ✓",
      cancelEnroll: "Өтінімді болдырмау",
      waConsultPay: "WhatsApp арқылы кеңес алу / төлеу →",
      waCoordinator: "Координаторға WhatsApp-қа жазу →",
      chatBtn: "💬 Курстың жабық чаты →",
      recordBtn: "▶️ Жазбаны / эфирді көру →",
      certBtn: "🎓 Сертификатты жүктеу →",
      emptyMy: "Сізде әзірге белсенді өтінімдер жоқ. Төменнен немесе кестеден курс таңдап, 1 басумен өтінім қалдырыңыз.",
      confBadge: "Конференция",
      online: "Онлайн",
      offline: "Офлайн",
      hybrid: "Офлайн + онлайн",
      waPayPrefix: "Сәлеметсіз бе! Мен Doctrine жеке кабинетінде «",
      waPayMid: "» курсына өтінім қалдырдым. Кеңес алғым / төлем деректемелерін алғым келеді. Дәрігер: ",
      waPayPhone: ", тел.: "
    },
    en: {
      errId: "Enter a valid phone number (e.g. +7 777 000 00 00) or email address.",
      errPass: "Password must be at least 6 characters.",
      errName: "Please enter your full name.",
      errExists: "An account with this phone or email already exists. Please sign in.",
      errNotFound: "Account not found. Check your phone/email or register a new account.",
      errWrongPass: "Incorrect password. Please try again.",
      saved: "Profile saved ✓",
      enrolledBanner: "Course added to your applications ✓ Consultation and payment details are available below.",
      pendingEnrollHint: "Sign in or register in 15 seconds to automatically apply for: ",
      statusApplied: "Application · awaiting payment",
      statusPaid: "Paid · access unlocked ✓",
      statusDone: "Certificate issued ✓",
      paidDateLbl: "Paid on: ",
      lockNote: "🔒 Access to the private course chat, lecture recordings and certificate unlocks automatically once payment is confirmed.",
      paidWaitLinks: "Payment confirmed ✓ Private chat and recording links will appear here before the course starts.",
      enroll1Click: "Apply · reserve",
      enrolledBtn: "In your applications ✓",
      paidBtn: "Paid ✓",
      cancelEnroll: "Cancel application",
      waConsultPay: "Consult / Pay via WhatsApp →",
      waCoordinator: "Message coordinator on WhatsApp →",
      chatBtn: "💬 Private course chat →",
      recordBtn: "▶️ Watch recording / stream →",
      certBtn: "🎓 Download certificate →",
      emptyMy: "You have no active applications yet. Select a course or conference below to reserve your spot.",
      confBadge: "Conference",
      online: "Online",
      offline: "Offline",
      hybrid: "In person + online",
      waPayPrefix: "Hello! I applied via my Doctrine account for “",
      waPayMid: "”. I would like to consult / get payment details. Doctor: ",
      waPayPhone: ", phone: "
    }
  }[lang] || {};

  var LS_USER = "doctrine_cabinet_user";
  var LS_DB = "doctrine_cabinet_db";
  var LS_LINKS = "doctrine_cabinet_course_links";
  var WA_BASE = "https://wa.me/77770357345";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

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

  var FB_REST = "https://doctrine-1ebe5-default-rtdb.europe-west1.firebasedatabase.app";

  function readLocalDB() {
    try { return JSON.parse(localStorage.getItem(LS_DB) || "{}"); } catch (e) { return {}; }
  }
  function writeLocalDB(data) {
    try { localStorage.setItem(LS_DB, JSON.stringify(data || {})); } catch (e) { /* ignore */ }
  }
  function getCourseLinks() {
    try { return JSON.parse(localStorage.getItem(LS_LINKS) || "{}"); } catch (e) { return {}; }
  }
  function setCourseLinks(links) {
    try { localStorage.setItem(LS_LINKS, JSON.stringify(links || {})); } catch (e) { /* ignore */ }
  }
  function getSessionUser() {
    try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { return null; }
  }
  function setSessionUser(u) {
    try {
      if (u) localStorage.setItem(LS_USER, JSON.stringify(u));
      else localStorage.removeItem(LS_USER);
      if (window.updateDoctrineCabinetNav) window.updateDoctrineCabinetNav();
    } catch (e) { /* ignore */ }
  }

  var courseLinksMap = getCourseLinks();
  fetch(FB_REST + "/cabinetCourseLinks.json")
    .then(function (r) { return r.json(); })
    .then(function (val) {
      if (val && typeof val === "object") {
        courseLinksMap = val;
        setCourseLinks(val);
        var u = getSessionUser();
        if (u) renderMyCourses(u);
      }
    })
    .catch(function () { /* offline fallback */ });

  function fetchUserByKey(key) {
    var local = readLocalDB();
    var localHit = (local.users && local.users[key]) || null;

    return fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(key) + ".json")
      .then(function (r) { return r.json(); })
      .then(function (val) {
        if (val && val.uid) return val;
        return fetch(FB_REST + "/cabinetAliases/" + encodeURIComponent(key) + ".json")
          .then(function (r2) { return r2.json(); })
          .then(function (targetUid) {
            if (!targetUid) return localHit;
            return fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(targetUid) + ".json")
              .then(function (r3) { return r3.json(); })
              .then(function (uVal) { return (uVal && uVal.uid) ? uVal : localHit; });
          });
      })
      .catch(function () { return localHit; });
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

    var reqs = [
      fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(user.uid) + ".json", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(user)
      }).catch(function () { return null; })
    ];
    if (user.phone) {
      var p = parseIdentifier(user.phone);
      if (p && p.key !== user.uid) {
        reqs.push(fetch(FB_REST + "/cabinetAliases/" + encodeURIComponent(p.key) + ".json", {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(user.uid)
        }).catch(function () { return null; }));
      }
    }
    if (user.email) {
      var em = parseIdentifier(user.email);
      if (em && em.key !== user.uid) {
        reqs.push(fetch(FB_REST + "/cabinetAliases/" + encodeURIComponent(em.key) + ".json", {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(user.uid)
        }).catch(function () { return null; }));
      }
    }
    return Promise.all(reqs).then(function () { return user; });
  }

  var catalogAll = window.DOCTRINE_CABINET_ITEMS || [];
  var nowD = new Date();
  var todayTs = nowD.getFullYear() * 10000 + (nowD.getMonth() + 1) * 100 + nowD.getDate();
  var catalog = catalogAll.filter(function (c) {
    if (c.open) return true;
    var ts = parseInt(c.ts || "0", 10);
    return !ts || ts >= todayTs;
  });

  // Check if URL has ?enroll=COURSE_ID
  var urlParams = new URLSearchParams(window.location.search);
  var pendingEnrollId = (urlParams.get("enroll") || "").trim();

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

  function showAuthMsg(text, isOk) {
    if (!authMsg) return;
    authMsg.textContent = text || "";
    authMsg.className = "cab-alert " + (isOk ? "is-ok" : "is-err");
    authMsg.hidden = !text;
  }

  function showDashNotice(text) {
    if (!dashNotice) return;
    dashNotice.textContent = text || "";
    dashNotice.hidden = !text;
    if (text) {
      setTimeout(function () { dashNotice.hidden = true; }, 6000);
    }
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

  function enrollUserInCourse(u, cid) {
    var cat = catalogAll.find(function (x) { return x.id === cid; });
    if (!cat || !u) return Promise.resolve(u);
    u.enrollments = u.enrollments || {};
    if (u.enrollments[cid]) return Promise.resolve(u);
    var cTitle = (cat.title && (cat.title[lang] || cat.title.ru)) || cid;
    var cDates = (cat.dates && (cat.dates[lang] || cat.dates.ru)) || "";
    var now = Date.now();
    u.enrollments[cid] = {
      courseId: cid,
      title: (cat.title && cat.title.ru) || cTitle,
      dates: cDates,
      price: cat.price || "",
      format: cat.format || "online",
      status: "applied",
      createdAt: now
    };
    u.updatedAt = now;
    fetch(FB_REST + "/cabinetApplications/" + encodeURIComponent(u.uid + "_" + cid) + ".json", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        id: u.uid + "_" + cid,
        uid: u.uid,
        name: u.name || "",
        phone: u.phone || "",
        email: u.email || "",
        specialty: u.specialty || "",
        city: u.city || "",
        courseId: cid,
        courseTitle: (cat.title && cat.title.ru) || cTitle,
        price: cat.price || "",
        status: "applied",
        createdAt: now
      })
    }).catch(function () { return null; });
    return saveUserRecord(u);
  }

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
      var cat = catalogAll.find(function (x) { return x.id === cid; }) || {};
      var title = (cat.title && (cat.title[lang] || cat.title.ru)) || item.title || cid;
      var dates = (cat.dates && (cat.dates[lang] || cat.dates.ru)) || item.dates || "";
      var price = cat.price || item.price || "";
      var fmt = cat.format || item.format || "online";
      var fmtLabel = fmt === "conf" ? L.confBadge : (fmt === "offline" ? L.offline : L.online);

      var st = item.status || "applied";
      var isPaid = (st === "paid" || st === "completed" || st === "confirmed");
      var isDone = (st === "completed" || !!item.certUrl);

      var statusLabel = isDone ? L.statusDone : (isPaid ? L.statusPaid : L.statusApplied);
      var statusCls = isPaid ? "st-confirmed" : "st-applied";

      var shared = courseLinksMap[cid] || {};
      var chatUrl = item.chatUrl || shared.chatUrl || "";
      var recordUrl = item.recordUrl || shared.recordUrl || item.materialUrl || "";
      var certUrl = item.certUrl || "";

      var waText = L.waPayPrefix + title + (price ? " (" + price + ")" : "") + L.waPayMid + (user.name || "")
        + (user.phone ? L.waPayPhone + user.phone : "");
      var waHref = WA_BASE + "?text=" + encodeURIComponent(waText);

      var accessBlock = "";
      if (isPaid) {
        var btns = [];
        if (chatUrl) {
          btns.push('<a class="btn btn-primary btn-sm" href="' + esc(chatUrl) + '" target="_blank" rel="noopener">' + esc(L.chatBtn) + "</a>");
        }
        if (recordUrl) {
          btns.push('<a class="btn btn-primary btn-sm" href="' + esc(recordUrl) + '" target="_blank" rel="noopener">' + esc(L.recordBtn) + "</a>");
        }
        if (certUrl) {
          btns.push('<a class="btn btn-ghost btn-sm cab-cert-btn" href="' + esc(certUrl) + '" target="_blank" rel="noopener">' + esc(L.certBtn) + "</a>");
        }
        var paidMeta = item.paidDate ? '<div class="cab-paid-date">' + esc(L.paidDateLbl + item.paidDate) + (item.paidAmount ? " · " + esc(item.paidAmount) + " KZT" : "") + "</div>" : "";
        accessBlock = paidMeta + (btns.length
          ? '<div class="cab-unlocked-box">' + btns.join("") + "</div>"
          : '<div class="cab-unlocked-wait">' + esc(L.paidWaitLinks) + "</div>");
      } else {
        accessBlock = '<div class="cab-lock-box">' + esc(L.lockNote) + "</div>";
      }

      var cancelBtn = !isPaid
        ? '<button type="button" class="cab-cancel-btn" data-cancel-id="' + esc(cid) + '">' + esc(L.cancelEnroll) + "</button>"
        : "";

      return '<div class="cab-course-item' + (isPaid ? " is-paid" : "") + '">'
        + '<div class="cab-course-top">'
        + '<div class="badges"><span class="badge format">' + esc(fmtLabel) + '</span>'
        + '<span class="badge cab-status ' + statusCls + '">' + esc(statusLabel) + "</span>"
        + (price && !isPaid ? '<span class="badge hours">' + esc(price) + "</span>" : "")
        + "</div>"
        + cancelBtn
        + "</div>"
        + "<h4>" + esc(title) + "</h4>"
        + (dates ? '<div class="meta">' + esc(dates) + "</div>" : "")
        + accessBlock
        + '<div class="cab-course-actions">'
        + '<a class="btn ' + (isPaid ? "btn-ghost" : "btn-primary") + ' btn-sm" href="' + esc(waHref) + '" target="_blank" rel="noopener">'
        + esc(isPaid ? L.waCoordinator : L.waConsultPay) + "</a>"
        + "</div></div>";
    }).join("");

    myList.querySelectorAll("[data-cancel-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-cancel-id");
        var u = getSessionUser();
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        delete u.enrollments[cid];
        u.updatedAt = Date.now();
        fetch(FB_REST + "/cabinetApplications/" + encodeURIComponent(u.uid + "_" + cid) + ".json", {
          method: "DELETE"
        }).catch(function () { return null; });
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
      var existing = enrolledMap[c.id];
      var isEnrolled = !!existing;
      var isPaid = existing && (existing.status === "paid" || existing.status === "completed");
      var btnCls = isEnrolled ? "btn btn-ghost btn-sm is-enrolled" : "btn btn-primary btn-sm";
      var btnTxt = isPaid ? L.paidBtn : (isEnrolled ? L.enrolledBtn : L.enroll1Click);
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
        enrollUserInCourse(u, cid).then(function (updated) {
          showDashNotice(L.enrolledBanner);
          renderMyCourses(updated);
          renderAvailCourses(updated);
        });
      });
    });
  }

  function clearEnrollParamFromUrl() {
    try {
      var u = new URL(window.location.href);
      if (u.searchParams.has("enroll")) {
        u.searchParams.delete("enroll");
        history.replaceState(null, "", u.toString());
      }
    } catch (e) { /* ignore */ }
  }

  function renderDashboard(user) {
    if (!user) {
      if (authView) authView.hidden = false;
      if (dashView) dashView.hidden = true;
      if (pendingEnrollId) {
        var targetCat = catalogAll.find(function (x) { return x.id === pendingEnrollId; });
        if (targetCat) {
          var tName = (targetCat.title && (targetCat.title[lang] || targetCat.title.ru)) || pendingEnrollId;
          showAuthMsg(L.pendingEnrollHint + "«" + tName + "»", true);
        }
      }
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

    if (pendingEnrollId) {
      var cidToEnroll = pendingEnrollId;
      pendingEnrollId = "";
      clearEnrollParamFromUrl();
      enrollUserInCourse(user, cidToEnroll).then(function (updated) {
        showDashNotice(L.enrolledBanner);
        renderMyCourses(updated);
        renderAvailCourses(updated);
      });
    } else {
      renderMyCourses(user);
      renderAvailCourses(user);
    }

    // Refresh user from cloud so admin changes (payment status, chatUrl, certUrl) appear immediately
    if (user.uid) {
      fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(user.uid) + ".json")
        .then(function (r) { return r.json(); })
        .then(function (remote) {
          if (remote && remote.uid && (remote.updatedAt || 0) >= (user.updatedAt || 0)) {
            var local = readLocalDB();
            local.users = local.users || {};
            local.users[remote.uid] = remote;
            writeLocalDB(local);
            setSessionUser(remote);
            renderMyCourses(remote);
            renderAvailCourses(remote);
          }
        })
        .catch(function () { /* ignore */ });
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

  renderDashboard(getSessionUser());
})();
