// Doctrine Coordinator Page (admin.html):
// 1. Grant / revoke course recording access to doctors (with optional expiration & certificate link)
// 2. Attach YouTube (Unlisted) video lessons to courses (stored obfuscated, played inside cabinet's protected player)
(function () {
  var root = document.getElementById("adminRoot");
  if (!root) return;

  var FB_REST = "https://doctrine-1ebe5-default-rtdb.europe-west1.firebasedatabase.app";
  var LS_DB = "doctrine_cabinet_db";
  var LS_VIDEOS = "doctrine_cabinet_videos";
  var LS_ADMIN_AUTH = "doctrine_admin_authed_v2";

  // SHA-256 hash of "doctrine-admin-v1:<password>" (plaintext is never stored in code)
  var ADMIN_SHA256 = "632b7b54c4576a4366cd80a0c8c987330ce967f57ffedd17bed0aed1f7838ba3";
  var ADMIN_FB_HASH = "fb_a0b0c31c7154b6c2";

  var catalog = window.DOCTRINE_ADMIN_COURSES || window.DOCTRINE_CABINET_ITEMS || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  function hashAdminPass(pass) {
    var salted = "doctrine-admin-v1:" + String(pass || "");
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

  function extractYouTubeId(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    var m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : "";
  }

  function encodeYtId(id) {
    try {
      return "obf:" + btoa(id).split("").reverse().join("");
    } catch (e) { return id; }
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

  function parseLessonsText(text) {
    var lines = String(text || "").split("\n");
    var out = [];
    lines.forEach(function (ln, idx) {
      var trimmed = ln.trim();
      if (!trimmed) return;
      var title = "";
      var urlPart = trimmed;
      if (trimmed.indexOf("|") !== -1) {
        var parts = trimmed.split("|");
        title = parts[0].trim();
        urlPart = parts.slice(1).join("|").trim();
      }
      var yid = extractYouTubeId(urlPart);
      if (yid) {
        out.push({
          title: title || ("Занятие " + (out.length + 1)),
          ytId: encodeYtId(yid)
        });
      }
    });
    return out;
  }

  function formatLessonsText(lessons) {
    if (!Array.isArray(lessons) || !lessons.length) return "";
    return lessons.map(function (ls, i) {
      var id = decodeYtId(ls.ytId);
      var url = id ? ("https://youtu.be/" + id) : "";
      var defTitle = "Занятие " + (i + 1);
      return (ls.title && ls.title !== defTitle) ? (ls.title + " | " + url) : url;
    }).join("\n");
  }

  var state = {
    users: {},
    videos: {},
    docQuery: "",
    courseQuery: ""
  };

  function readLocalState() {
    try {
      var dbLocal = JSON.parse(localStorage.getItem(LS_DB) || "{}");
      if (dbLocal.users) {
        Object.keys(dbLocal.users).forEach(function (k) {
          var u = dbLocal.users[k];
          if (u && u.uid) state.users[u.uid] = u;
        });
      }
      var vLocal = JSON.parse(localStorage.getItem(LS_VIDEOS) || "{}");
      Object.keys(vLocal).forEach(function (k) {
        state.videos[k] = vLocal[k];
      });
    } catch (e) { /* ignore */ }
  }

  function writeLocalState() {
    try {
      var dbLocal = JSON.parse(localStorage.getItem(LS_DB) || "{}");
      dbLocal.users = dbLocal.users || {};
      Object.keys(state.users).forEach(function (uid) {
        dbLocal.users[uid] = state.users[uid];
      });
      localStorage.setItem(LS_DB, JSON.stringify(dbLocal));
      localStorage.setItem(LS_VIDEOS, JSON.stringify(state.videos));
      var sess = JSON.parse(localStorage.getItem("doctrine_cabinet_user") || "null");
      if (sess && sess.uid && state.users[sess.uid]) {
        localStorage.setItem("doctrine_cabinet_user", JSON.stringify(state.users[sess.uid]));
      }
    } catch (e) { /* ignore */ }
  }

  function loadAllFromCloud() {
    readLocalState();
    return Promise.all([
      fetch(FB_REST + "/cabinetUsers.json").then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch(FB_REST + "/cabinetCourseVideos.json").then(function (r) { return r.json(); }).catch(function () { return null; })
    ]).then(function (res) {
      var rUsers = res[0];
      var rVideos = res[1];
      if (rUsers && typeof rUsers === "object") {
        Object.keys(rUsers).forEach(function (uid) {
          if (rUsers[uid] && rUsers[uid].uid) state.users[uid] = rUsers[uid];
        });
      }
      if (rVideos && typeof rVideos === "object") {
        Object.keys(rVideos).forEach(function (cid) {
          state.videos[cid] = rVideos[cid];
        });
      }
      writeLocalState();
      renderAll();
    });
  }

  function saveUserToCloud(user) {
    if (!user || !user.uid) return Promise.resolve();
    state.users[user.uid] = user;
    writeLocalState();
    return fetch(FB_REST + "/cabinetUsers/" + encodeURIComponent(user.uid) + ".json", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(user)
    }).catch(function () { return null; });
  }

  function saveCourseVideosToCloud(cid, payload) {
    state.videos[cid] = payload;
    writeLocalState();
    return fetch(FB_REST + "/cabinetCourseVideos/" + encodeURIComponent(cid) + ".json", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    }).catch(function () { return null; });
  }

  // Auth gate
  var loginView = document.getElementById("admLoginView");
  var panelView = document.getElementById("admPanelView");
  var loginForm = document.getElementById("admLoginForm");
  var loginErr = document.getElementById("admLoginErr");
  var logoutBtn = document.getElementById("admLogoutBtn");
  var refreshBtn = document.getElementById("admRefreshBtn");

  function isAuthed() {
    try { return sessionStorage.getItem(LS_ADMIN_AUTH) === "1" || localStorage.getItem(LS_ADMIN_AUTH) === "1"; } catch (e) { return false; }
  }
  function setAuthed(v) {
    try {
      if (v) { sessionStorage.setItem(LS_ADMIN_AUTH, "1"); localStorage.setItem(LS_ADMIN_AUTH, "1"); }
      else { sessionStorage.removeItem(LS_ADMIN_AUTH); localStorage.removeItem(LS_ADMIN_AUTH); }
    } catch (e) { /* ignore */ }
  }

  function updateAuthUI() {
    if (isAuthed()) {
      if (loginView) loginView.hidden = true;
      if (panelView) panelView.hidden = false;
      loadAllFromCloud();
    } else {
      if (loginView) loginView.hidden = false;
      if (panelView) panelView.hidden = true;
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var pass = (loginForm.elements.password.value || "").trim();
      hashAdminPass(pass).then(function (h) {
        if (h === ADMIN_SHA256 || h === ADMIN_FB_HASH) {
          if (loginErr) loginErr.hidden = true;
          setAuthed(true);
          loginForm.reset();
          updateAuthUI();
        } else {
          if (loginErr) {
            loginErr.textContent = "Неверный пароль координатора.";
            loginErr.hidden = false;
          }
        }
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      setAuthed(false);
      updateAuthUI();
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      loadAllFromCloud();
    });
  }

  // Grant access form
  var grantForm = document.getElementById("admGrantForm");
  var grantUserSel = document.getElementById("admGrantUser");
  var grantCourseSel = document.getElementById("admGrantCourse");
  var grantMsg = document.getElementById("admGrantMsg");

  function getSortedUsers() {
    var list = Object.keys(state.users).map(function (k) { return state.users[k]; }).filter(function (u) { return u && u.uid; });
    list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return list;
  }

  function populateSelects() {
    var users = getSortedUsers();
    if (grantUserSel) {
      var prevU = grantUserSel.value;
      grantUserSel.innerHTML = users.length
        ? users.map(function (u) {
            var contact = u.phone || u.email || u.uid;
            return '<option value="' + esc(u.uid) + '">' + esc(u.name || "—") + " (" + esc(contact) + ")</option>";
          }).join("")
        : '<option value="">Пока нет зарегистрированных врачей</option>';
      if (prevU && state.users[prevU]) grantUserSel.value = prevU;
    }
    if (grantCourseSel && !grantCourseSel.dataset.ready) {
      grantCourseSel.innerHTML = catalog.map(function (c) {
        var t = (c.title && c.title.ru) || c.id;
        return '<option value="' + esc(c.id) + '">' + esc(t) + " (" + esc(c.id) + ")</option>";
      }).join("");
      grantCourseSel.dataset.ready = "1";
    }
  }

  if (grantForm) {
    grantForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var uid = grantUserSel ? grantUserSel.value : "";
      var cid = grantCourseSel ? grantCourseSel.value : "";
      var days = parseInt(grantForm.elements.days.value || "0", 10);
      var certUrl = (grantForm.elements.certUrl.value || "").trim();
      var u = state.users[uid];
      if (!u || !cid) return;

      var cat = catalog.find(function (x) { return x.id === cid; }) || {};
      var cTitle = (cat.title && cat.title.ru) || cid;
      var now = Date.now();
      var expiresAt = days > 0 ? (now + days * 86400000) : 0;

      u.enrollments = u.enrollments || {};
      u.enrollments[cid] = {
        courseId: cid,
        title: cTitle,
        dates: (cat.dates && cat.dates.ru) || "",
        format: cat.format || "online",
        status: "paid",
        createdAt: (u.enrollments[cid] && u.enrollments[cid].createdAt) || now,
        paidAt: now,
        expiresAt: expiresAt,
        certUrl: certUrl
      };
      u.updatedAt = now;

      saveUserToCloud(u).then(function () {
        if (grantMsg) {
          grantMsg.textContent = "Доступ к курсу «" + cTitle + "» открыт для " + (u.name || uid) + " ✓";
          grantMsg.hidden = false;
          setTimeout(function () { grantMsg.hidden = true; }, 4500);
        }
        grantForm.elements.certUrl.value = "";
        renderAll();
      });
    });
  }

  // Doctors & active accesses table
  var docSearch = document.getElementById("admDocSearch");
  if (docSearch) {
    docSearch.addEventListener("input", function () {
      state.docQuery = docSearch.value.toLowerCase();
      renderDoctorsTable();
    });
  }

  function renderDoctorsTable() {
    var tbody = document.getElementById("admDoctorsBody");
    if (!tbody) return;
    var users = getSortedUsers();
    if (state.docQuery) {
      users = users.filter(function (u) {
        var blob = [u.name, u.phone, u.email, u.specialty, u.city].join(" ").toLowerCase();
        return blob.indexOf(state.docQuery) !== -1;
      });
    }
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="adm-empty-cell">Врачей по запросу не найдено.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(function (u) {
      var emap = u.enrollments || {};
      var cids = Object.keys(emap);
      var badges = cids.length ? cids.map(function (cid) {
        var item = emap[cid];
        var exp = item.expiresAt ? (" до " + new Date(item.expiresAt).toLocaleDateString("ru-RU")) : " (бессрочно)";
        var keyAttr = esc(u.uid) + "::" + esc(cid);
        return '<div class="adm-access-pill">'
          + "<span><b>" + esc(item.title || cid) + "</b><small>" + esc(exp) + "</small></span>"
          + '<button type="button" class="cab-cancel-btn" data-revoke="' + keyAttr + '" title="Закрыть доступ">✕ Закрыть</button>'
          + "</div>";
      }).join("") : '<span class="meta">Нет открытых курсов</span>';

      return "<tr>"
        + "<td><b>" + esc(u.name || "—") + "</b><br><small>" + esc(u.specialty || "") + (u.city ? " · " + esc(u.city) : "") + "</small></td>"
        + "<td>" + esc(u.phone || "—") + "<br><small>" + esc(u.email || "") + "</small></td>"
        + "<td>" + badges + "</td>"
        + '<td><button type="button" class="btn btn-ghost btn-sm" data-pick-user="' + esc(u.uid) + '">Выбрать врача ↑</button></td>'
        + "</tr>";
    }).join("");

    tbody.querySelectorAll("[data-revoke]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pair = btn.getAttribute("data-revoke").split("::");
        var uid = pair[0], cid = pair[1];
        var u = state.users[uid];
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        delete u.enrollments[cid];
        u.updatedAt = Date.now();
        saveUserToCloud(u).then(function () { renderAll(); });
      });
    });

    tbody.querySelectorAll("[data-pick-user]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var uid = btn.getAttribute("data-pick-user");
        if (grantUserSel) {
          grantUserSel.value = uid;
          grantUserSel.scrollIntoView({ behavior: "smooth", block: "center" });
          grantUserSel.focus();
        }
      });
    });
  }

  // Course YouTube videos section
  var courseSearch = document.getElementById("admCourseSearch");
  if (courseSearch) {
    courseSearch.addEventListener("input", function () {
      state.courseQuery = courseSearch.value.toLowerCase();
      renderCourseVideos();
    });
  }

  function renderCourseVideos() {
    var box = document.getElementById("admCourseVideosList");
    if (!box) return;
    var items = catalog.slice();
    if (state.courseQuery) {
      items = items.filter(function (c) {
        var t = ((c.title && c.title.ru) || "") + " " + c.id;
        return t.toLowerCase().indexOf(state.courseQuery) !== -1;
      });
    }

    box.innerHTML = items.map(function (c) {
      var cid = c.id;
      var t = (c.title && c.title.ru) || cid;
      var rec = state.videos[cid] || {};
      var lessons = rec.lessons || [];
      var textVal = formatLessonsText(lessons);
      var countBadge = lessons.length
        ? '<span class="badge cab-status st-confirmed">Видео привязано: ' + lessons.length + " ур. ✓</span>"
        : '<span class="badge badge-past">Видео не добавлено</span>';

      return '<div class="adm-link-card">'
        + '<div class="adm-link-head">'
        + '<div><b>' + esc(t) + '</b> <span class="meta">(' + esc(cid) + ")</span></div>"
        + countBadge
        + "</div>"
        + '<label class="cab-field"><span>Ссылки на YouTube (по одной на строку, либо «Название урока | https://youtu.be/...»)</span>'
        + '<textarea rows="3" class="adm-video-ta" placeholder="Занятие 1 | https://youtu.be/...\nЗанятие 2 | https://youtu.be/..." data-video-ta="' + esc(cid) + '">' + esc(textVal) + "</textarea>"
        + "</label>"
        + '<div class="adm-video-foot">'
        + '<button type="button" class="btn btn-primary btn-sm" data-save-video="' + esc(cid) + '">Сохранить видео курса</button>'
        + "</div></div>";
    }).join("");

    box.querySelectorAll("[data-save-video]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-save-video");
        var ta = box.querySelector('[data-video-ta="' + cid + '"]');
        var lessons = parseLessonsText(ta ? ta.value : "");
        var payload = {
          courseId: cid,
          lessons: lessons,
          updatedAt: Date.now()
        };
        saveCourseVideosToCloud(cid, payload).then(function () {
          btn.textContent = "Сохранено (" + lessons.length + " ур.) ✓";
          setTimeout(function () { renderCourseVideos(); }, 900);
        });
      });
    });
  }

  function renderAll() {
    populateSelects();
    renderDoctorsTable();
    renderCourseVideos();
  }

  updateAuthUI();
})();
