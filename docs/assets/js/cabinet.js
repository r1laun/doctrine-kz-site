// Doctrine Personal Cabinet:
// - Registration & sign-in by phone number (+7...) or email
// - Single-device session guard (prevents sharing login/password with others)
// - Protected YouTube course player (controls=0 + full click/contextmenu shield +
//   custom Doctrine controls + dynamic floating watermark with doctor's name & phone)
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
      errOtherDevice: "Выполнен вход в ваш аккаунт с другого устройства. Для защиты видеозаписей курсов одновременный доступ с нескольких устройств запрещён.",
      saved: "Профиль сохранён ✓",
      statusOpen: "Доступ к записи открыт ✓",
      statusExpired: "Срок доступа истёк",
      statusApplied: "Ожидает открытия доступа",
      untilLbl: "Доступ до: ",
      watchBtn: "▶️ Смотреть запись курса",
      closePlayer: "✕ Закрыть плеер",
      certBtn: "🎓 Скачать сертификат →",
      waConfirm: "Написать координатору в WhatsApp →",
      emptyMy: "У вас пока нет открытых видеозаписей курсов. После оплаты курса координатор откроет доступ, и запись появится здесь.",
      lessonWord: "Урок",
      fsBtn: "⛶ На весь экран",
      protectNote: "🔒 Защищённый просмотр: видео предназначено только для вашего аккаунта. На кадр нанесён персональный водяной знак.",
      online: "Онлайн",
      offline: "Офлайн",
      waMsgPrefix: "Здравствуйте! Пишу из личного кабинета Doctrine по курсу «",
      waMsgMid: "». Врач: ",
      waMsgPhone: ", тел.: "
    },
    kk: {
      errId: "Дұрыс телефон нөмірін (мысалы, +7 777 000 00 00) немесе email енгізіңіз.",
      errPass: "Құпиясөз кемінде 6 таңбадан тұруы керек.",
      errName: "Аты-жөніңізді көрсетіңіз.",
      errExists: "Бұл нөмір немесе email тіркелген. «Кіру» қойындысы арқылы кіріңіз.",
      errNotFound: "Аккаунт табылмады. Нөмірді/поштаны тексеріңіз немесе тіркеліңіз.",
      errWrongPass: "Құпиясөз қате. Қайтадан көріңіз.",
      errOtherDevice: "Аккаунтыңызға басқа құрылғыдан кіру орындалды. Курс жазбаларын қорғау үшін бірнеше құрылғыдан бір уақытта қарауға тыйым салынады.",
      saved: "Профиль сақталды ✓",
      statusOpen: "Жазбаға қолжетімділік ашық ✓",
      statusExpired: "Мерзімі аяқталды",
      statusApplied: "Қолжетімділік күтілуде",
      untilLbl: "Мерзімі: ",
      watchBtn: "▶️ Курс жазбасын көру",
      closePlayer: "✕ Плеерді жабу",
      certBtn: "🎓 Сертификатты жүктеу →",
      waConfirm: "Координаторға WhatsApp-қа жазу →",
      emptyMy: "Сізде әзірге ашық курс жазбалары жоқ. Төлем расталғаннан кейін координатор қолжетімділікті ашады.",
      lessonWord: "Сабақ",
      fsBtn: "⛶ Толық экран",
      protectNote: "🔒 Қорғалған бейне: тек сіздің аккаунтыңызға арналған. Бейнеде жеке су белгісі бар.",
      online: "Онлайн",
      offline: "Офлайн",
      waMsgPrefix: "Сәлеметсіз бе! Doctrine жеке кабинетінен «",
      waMsgMid: "» курсы бойынша жазып отырмын. Дәрігер: ",
      waMsgPhone: ", тел.: "
    },
    en: {
      errId: "Enter a valid phone number (e.g. +7 777 000 00 00) or email address.",
      errPass: "Password must be at least 6 characters.",
      errName: "Please enter your full name.",
      errExists: "An account with this phone or email already exists. Please sign in.",
      errNotFound: "Account not found. Check your phone/email or register a new account.",
      errWrongPass: "Incorrect password. Please try again.",
      errOtherDevice: "Your account was signed in on another device. Simultaneous viewing on multiple devices is disabled to protect course recordings.",
      saved: "Profile saved ✓",
      statusOpen: "Recording access active ✓",
      statusExpired: "Access expired",
      statusApplied: "Awaiting access activation",
      untilLbl: "Valid until: ",
      watchBtn: "▶️ Watch course recording",
      closePlayer: "✕ Close player",
      certBtn: "🎓 Download certificate →",
      waConfirm: "Message coordinator on WhatsApp →",
      emptyMy: "You have no active course recordings yet. Once your payment is confirmed, the coordinator will unlock your course here.",
      lessonWord: "Lesson",
      fsBtn: "⛶ Fullscreen",
      protectNote: "🔒 Protected playback: licensed for your personal account only with a dynamic watermark.",
      online: "Online",
      offline: "Offline",
      waMsgPrefix: "Hello! Writing from my Doctrine account regarding “",
      waMsgMid: "”. Doctor: ",
      waMsgPhone: ", phone: "
    }
  }[lang] || {};

  var FB_REST = "https://doctrine-1ebe5-default-rtdb.europe-west1.firebasedatabase.app";
  var LS_USER = "doctrine_cabinet_user";
  var LS_DB = "doctrine_cabinet_db";
  var LS_VIDEOS = "doctrine_cabinet_videos";
  var LS_TOKEN = "doctrine_cabinet_session_token";
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

  function generateSessionToken() {
    return "st_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  function decodeYtId(encoded) {
    var s = String(encoded || "").trim();
    if (!s) return "";
    if (s.indexOf("obf:") === 0) {
      try {
        var rev = s.slice(4).split("").reverse().join("");
        return atob(rev);
      } catch (e) { return ""; }
    }
    return s;
  }

  function readLocalDB() {
    try { return JSON.parse(localStorage.getItem(LS_DB) || "{}"); } catch (e) { return {}; }
  }
  function writeLocalDB(data) {
    try { localStorage.setItem(LS_DB, JSON.stringify(data || {})); } catch (e) { /* ignore */ }
  }
  function getCourseVideosMap() {
    try { return JSON.parse(localStorage.getItem(LS_VIDEOS) || "{}"); } catch (e) { return {}; }
  }
  function setCourseVideosMap(v) {
    try { localStorage.setItem(LS_VIDEOS, JSON.stringify(v || {})); } catch (e) { /* ignore */ }
  }
  function getSessionUser() {
    try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { return null; }
  }
  function setSessionUser(u, token) {
    try {
      if (u) {
        localStorage.setItem(LS_USER, JSON.stringify(u));
        if (token) localStorage.setItem(LS_TOKEN, token);
      } else {
        localStorage.removeItem(LS_USER);
        localStorage.removeItem(LS_TOKEN);
      }
      if (window.updateDoctrineCabinetNav) window.updateDoctrineCabinetNav();
    } catch (e) { /* ignore */ }
  }
  function getLocalToken() {
    try { return localStorage.getItem(LS_TOKEN) || ""; } catch (e) { return ""; }
  }

  var courseVideosMap = getCourseVideosMap();
  fetch(FB_REST + "/cabinetCourseVideos.json")
    .then(function (r) { return r.json(); })
    .then(function (val) {
      if (val && typeof val === "object") {
        courseVideosMap = val;
        setCourseVideosMap(val);
        var u = getSessionUser();
        if (u) renderMyCourses(u);
      }
    })
    .catch(function () { /* ignore */ });

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

  function saveUserRecord(user, newToken) {
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
    setSessionUser(user, newToken);

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
  var userTitle = document.getElementById("cabUserGreeting");
  var userSub = document.getElementById("cabUserContact");

  // Player DOM
  var playerPanel = document.getElementById("cabPlayerPanel");
  var playerCourseTitle = document.getElementById("cabPlayerCourseTitle");
  var playerLessonsBar = document.getElementById("cabPlayerLessons");
  var playerStage = document.getElementById("cabPlayerStage");
  var playerShield = document.getElementById("cabPlayerShield");
  var watermarkEl = document.getElementById("cabWatermark");
  var btnPlayPause = document.getElementById("cabBtnPlay");
  var btnBack15 = document.getElementById("cabBtnBack15");
  var btnFwd15 = document.getElementById("cabBtnFwd15");
  var seekSlider = document.getElementById("cabSeekSlider");
  var timeLabel = document.getElementById("cabTimeLabel");
  var speedSelect = document.getElementById("cabSpeedSelect");
  var btnFullscreen = document.getElementById("cabBtnFullscreen");
  var btnClosePlayer = document.getElementById("cabClosePlayerBtn");

  var catalogAll = window.DOCTRINE_CABINET_ITEMS || [];

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

  // ================= PROTECTED YOUTUBE PLAYER =================
  var ytPlayer = null;
  var ytApiReady = false;
  var pendingVideoId = "";
  var progressTimer = null;
  var watermarkTimer = null;

  function fmtSec(sec) {
    var s = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var rem = s % 60;
    var mm = String(m).padStart(2, "0");
    var ss = String(rem).padStart(2, "0");
    return h > 0 ? (h + ":" + mm + ":" + ss) : (mm + ":" + ss);
  }

  var WM_POSITIONS = [
    { top: "12%", left: "6%" },
    { top: "18%", left: "24%" },
    { top: "68%", left: "8%" },
    { top: "62%", left: "22%" },
    { top: "38%", left: "14%" }
  ];
  var wmIdx = 0;

  function updateWatermark(user) {
    if (!watermarkEl || !user) return;
    var label = (user.name || "Врач") + " · " + (user.phone || user.email || user.uid) + " · Doctrine.kz";
    watermarkEl.textContent = label;
    var pos = WM_POSITIONS[wmIdx % WM_POSITIONS.length];
    wmIdx++;
    watermarkEl.style.top = pos.top;
    watermarkEl.style.left = pos.left;
  }

  function startWatermarkLoop(user) {
    if (watermarkTimer) clearInterval(watermarkTimer);
    updateWatermark(user);
    watermarkTimer = setInterval(function () {
      updateWatermark(user);
    }, 12000);
  }

  function stopPlayer() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    if (watermarkTimer) { clearInterval(watermarkTimer); watermarkTimer = null; }
    if (ytPlayer && ytPlayer.stopVideo) {
      try { ytPlayer.stopVideo(); } catch (e) { /* ignore */ }
    }
    if (playerPanel) playerPanel.hidden = true;
  }

  function startProgressLoop() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(function () {
      if (!ytPlayer || !ytPlayer.getCurrentTime || !ytPlayer.getDuration) return;
      var cur = ytPlayer.getCurrentTime() || 0;
      var dur = ytPlayer.getDuration() || 0;
      if (seekSlider && dur > 0) {
        seekSlider.value = String(Math.round((cur / dur) * 1000));
      }
      if (timeLabel) {
        timeLabel.textContent = fmtSec(cur) + " / " + fmtSec(dur);
      }
    }, 500);
  }

  function ensureYouTubeApi(cb) {
    if (window.YT && window.YT.Player) {
      ytApiReady = true;
      cb();
      return;
    }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      ytApiReady = true;
      if (prev) prev();
      cb();
    };
    if (!document.getElementById("doctrineYtApiScript")) {
      var tag = document.createElement("script");
      tag.id = "doctrineYtApiScript";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }

  function loadVideoById(videoId, user) {
    if (!videoId) return;
    pendingVideoId = videoId;
    startWatermarkLoop(user);

    ensureYouTubeApi(function () {
      if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(pendingVideoId);
        startProgressLoop();
        return;
      }
      ytPlayer = new window.YT.Player("cabYtMount", {
        host: "https://www.youtube-nocookie.com",
        videoId: pendingVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: function () {
            startProgressLoop();
          },
          onStateChange: function (ev) {
            if (!btnPlayPause) return;
            var playing = (ev.data === window.YT.PlayerState.PLAYING);
            btnPlayPause.textContent = playing ? "❚❚" : "▶";
          }
        }
      });
    });
  }

  function togglePlayPause() {
    if (!ytPlayer || !ytPlayer.getPlayerState) return;
    var st = ytPlayer.getPlayerState();
    if (st === 1) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  }

  if (playerShield) {
    playerShield.addEventListener("click", togglePlayPause);
    playerShield.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  if (playerStage) {
    playerStage.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", togglePlayPause);
  }
  if (btnBack15) {
    btnBack15.addEventListener("click", function () {
      if (!ytPlayer || !ytPlayer.getCurrentTime) return;
      ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - 15), true);
    });
  }
  if (btnFwd15) {
    btnFwd15.addEventListener("click", function () {
      if (!ytPlayer || !ytPlayer.getCurrentTime) return;
      ytPlayer.seekTo(ytPlayer.getCurrentTime() + 15, true);
    });
  }
  if (seekSlider) {
    seekSlider.addEventListener("input", function () {
      if (!ytPlayer || !ytPlayer.getDuration) return;
      var dur = ytPlayer.getDuration() || 0;
      if (dur > 0) {
        var target = (parseFloat(seekSlider.value) / 1000) * dur;
        ytPlayer.seekTo(target, true);
      }
    });
  }
  if (speedSelect) {
    speedSelect.addEventListener("change", function () {
      if (!ytPlayer || !ytPlayer.setPlaybackRate) return;
      ytPlayer.setPlaybackRate(parseFloat(speedSelect.value) || 1);
    });
  }
  if (btnFullscreen && playerStage) {
    btnFullscreen.addEventListener("click", function () {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        if (playerStage.requestFullscreen) playerStage.requestFullscreen();
        else if (playerStage.webkitRequestFullscreen) playerStage.webkitRequestFullscreen();
      }
    });
  }
  if (btnClosePlayer) {
    btnClosePlayer.addEventListener("click", stopPlayer);
  }

  function openCoursePlayer(user, cid, courseTitle, lessons) {
    if (!playerPanel || !lessons || !lessons.length) return;
    // Verify single-device session before playing
    verifySingleDeviceSession(user).then(function (valid) {
      if (!valid) return;
      playerPanel.hidden = false;
      if (playerCourseTitle) playerCourseTitle.textContent = courseTitle;
      if (playerLessonsBar) {
        if (lessons.length > 1) {
          playerLessonsBar.hidden = false;
          playerLessonsBar.innerHTML = lessons.map(function (ls, idx) {
            var lbl = ls.title || (L.lessonWord + " " + (idx + 1));
            return '<button type="button" class="cab-lesson-btn' + (idx === 0 ? " active" : "") + '" data-lesson-idx="' + idx + '">' + esc(lbl) + "</button>";
          }).join("");
          playerLessonsBar.querySelectorAll("[data-lesson-idx]").forEach(function (b) {
            b.addEventListener("click", function () {
              var i = parseInt(b.getAttribute("data-lesson-idx"), 10) || 0;
              playerLessonsBar.querySelectorAll(".cab-lesson-btn").forEach(function (x) { x.classList.remove("active"); });
              b.classList.add("active");
              loadVideoById(decodeYtId(lessons[i].ytId), user);
            });
          });
        } else {
          playerLessonsBar.hidden = true;
          playerLessonsBar.innerHTML = "";
        }
      }
      playerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      loadVideoById(decodeYtId(lessons[0].ytId), user);
    });
  }

  function getLessonsForCourse(cid, item) {
    var list = [];
    if (item && Array.isArray(item.lessons) && item.lessons.length) {
      list = item.lessons;
    } else if (courseVideosMap[cid] && Array.isArray(courseVideosMap[cid].lessons)) {
      list = courseVideosMap[cid].lessons;
    }
    return list.filter(function (x) { return x && x.ytId; });
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
    var nowMs = Date.now();
    myList.innerHTML = keys.map(function (cid) {
      var item = map[cid];
      var cat = catalogAll.find(function (x) { return x.id === cid; }) || {};
      var title = (cat.title && (cat.title[lang] || cat.title.ru)) || item.title || cid;
      var dates = (cat.dates && (cat.dates[lang] || cat.dates.ru)) || item.dates || "";
      var fmt = cat.format || item.format || "online";
      var fmtLabel = fmt === "offline" ? L.offline : L.online;

      var isExpired = !!(item.expiresAt && nowMs > item.expiresAt);
      var isUnlocked = (item.status === "paid" || item.status === "confirmed" || item.status === "completed") && !isExpired;
      var lessons = getLessonsForCourse(cid, item);

      var statusLabel = isExpired ? L.statusExpired : (isUnlocked ? L.statusOpen : L.statusApplied);
      var statusCls = isUnlocked ? "st-confirmed" : "st-applied";

      var expStr = "";
      if (item.expiresAt) {
        var ed = new Date(item.expiresAt);
        if (!isNaN(ed.getTime())) expStr = L.untilLbl + ed.toLocaleDateString("ru-RU");
      }

      var waText = L.waMsgPrefix + title + L.waMsgMid + (user.name || "")
        + (user.phone ? L.waMsgPhone + user.phone : "");
      var waHref = WA_BASE + "?text=" + encodeURIComponent(waText);

      var actionBtns = "";
      if (isUnlocked && lessons.length) {
        actionBtns += '<button type="button" class="btn btn-primary btn-sm" data-watch-cid="' + esc(cid) + '">' + esc(L.watchBtn) + (lessons.length > 1 ? " (" + lessons.length + ")" : "") + "</button>";
      }
      if (isUnlocked && item.certUrl) {
        actionBtns += '<a class="btn btn-ghost btn-sm" href="' + esc(item.certUrl) + '" target="_blank" rel="noopener">' + esc(L.certBtn) + "</a>";
      }
      actionBtns += '<a class="btn btn-ghost btn-sm" href="' + esc(waHref) + '" target="_blank" rel="noopener">' + esc(L.waConfirm) + "</a>";

      return '<div class="cab-course-item' + (isUnlocked ? " is-paid" : "") + '">'
        + '<div class="cab-course-top">'
        + '<div class="badges"><span class="badge format">' + esc(fmtLabel) + '</span>'
        + '<span class="badge cab-status ' + statusCls + '">' + esc(statusLabel) + "</span>"
        + (expStr ? '<span class="badge hours">' + esc(expStr) + "</span>" : "")
        + "</div></div>"
        + "<h4>" + esc(title) + "</h4>"
        + (dates ? '<div class="meta">' + esc(dates) + "</div>" : "")
        + '<div class="cab-course-actions">' + actionBtns + "</div></div>";
    }).join("");

    myList.querySelectorAll("[data-watch-cid]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-watch-cid");
        var u = getSessionUser();
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        var item = u.enrollments[cid];
        var cat = catalogAll.find(function (x) { return x.id === cid; }) || {};
        var title = (cat.title && (cat.title[lang] || cat.title.ru)) || item.title || cid;
        var lessons = getLessonsForCourse(cid, item);
        openCoursePlayer(u, cid, title, lessons);
      });
    });
  }

  // Single-device check against cloud
  function verifySingleDeviceSession(user) {
    if (!user || !user.uid) return Promise.resolve(false);
    var myToken = getLocalToken();
    return fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(user.uid) + ".json")
      .then(function (r) { return r.json(); })
      .then(function (remote) {
        if (!remote || !remote.uid) return true;
        if (remote.sessionToken && myToken && remote.sessionToken !== myToken) {
          stopPlayer();
          setSessionUser(null);
          renderDashboard(null);
          showAuthMsg(L.errOtherDevice, false);
          return false;
        }
        // Also sync any new courses/videos unlocked by coordinator
        if ((remote.updatedAt || 0) >= (user.updatedAt || 0)) {
          var local = readLocalDB();
          local.users = local.users || {};
          local.users[remote.uid] = remote;
          writeLocalDB(local);
          setSessionUser(remote, myToken || remote.sessionToken);
          renderMyCourses(remote);
        }
        return true;
      })
      .catch(function () { return true; });
  }

  var sessionGuardTimer = null;
  function startSessionGuard() {
    if (sessionGuardTimer) clearInterval(sessionGuardTimer);
    sessionGuardTimer = setInterval(function () {
      var u = getSessionUser();
      if (u && u.uid) verifySingleDeviceSession(u);
    }, 15000);
  }

  function renderDashboard(user) {
    if (!user) {
      stopPlayer();
      if (sessionGuardTimer) { clearInterval(sessionGuardTimer); sessionGuardTimer = null; }
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
    verifySingleDeviceSession(user);
    startSessionGuard();
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
          var token = generateSessionToken();
          var newUser = {
            uid: parsed.key,
            name: name.slice(0, 100),
            phone: phone,
            email: email,
            specialty: specialty.slice(0, 80),
            city: city.slice(0, 60),
            workplace: "",
            passHash: passHash,
            sessionToken: token,
            enrollments: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          saveUserRecord(newUser, token).then(function (u) {
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
        var token = generateSessionToken();
        user.sessionToken = token;
        user.updatedAt = Date.now();
        saveUserRecord(user, token).then(function (saved) {
          formLogin.reset();
          renderDashboard(saved);
        });
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

      saveUserRecord(u, getLocalToken()).then(function (saved) {
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
      stopPlayer();
      setSessionUser(null);
      renderDashboard(null);
      switchTab("login");
    });
  }

  renderDashboard(getSessionUser());
})();
