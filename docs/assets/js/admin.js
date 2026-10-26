// Doctrine Coordinator Admin Panel:
// 1. Payments ledger ("кто заплатил, когда и на что") + manual payment entry + CSV export
// 2. Doctor applications (Consult -> Mark Paid -> Issue Certificate)
// 3. Course access links (Closed chat URL & Recording URL unlocked automatically once paid)
// 4. Registered doctors database + CSV export
(function () {
  var root = document.getElementById("adminRoot");
  if (!root) return;

  var FB_REST = "https://doctrine-1ebe5-default-rtdb.europe-west1.firebasedatabase.app";
  var LS_DB = "doctrine_cabinet_db";
  var LS_LINKS = "doctrine_cabinet_course_links";
  var LS_ADMIN_AUTH = "doctrine_admin_authed";
  var DEFAULT_ADMIN_PASS = "doctrine2026";

  var catalog = window.DOCTRINE_CABINET_ITEMS || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function todayIso() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function fmtDateTime(ms) {
    if (!ms) return "—";
    var d = new Date(ms);
    if (isNaN(d.getTime())) return String(ms);
    return d.toLocaleDateString("ru-RU");
  }

  function parsePriceNumber(s) {
    var digits = String(s || "").replace(/\D+/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  function fmtMoney(n) {
    var num = parsePriceNumber(n);
    if (!num) return "0 KZT";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " KZT";
  }

  function parsePhoneKey(raw) {
    var v = String(raw || "").trim();
    if (v.indexOf("@") !== -1) {
      return "e_" + v.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    var digits = v.replace(/\D+/g, "");
    if (digits.length === 11 && (digits.charAt(0) === "8" || digits.charAt(0) === "7")) {
      digits = "7" + digits.slice(1);
    } else if (digits.length === 10 && digits.charAt(0) === "7") {
      digits = "7" + digits;
    }
    return "p_" + (digits || Date.now());
  }

  // State
  var state = {
    users: {},
    links: {},
    tab: "payments",
    payCourse: "all",
    payQuery: "",
    appStatus: "all",
    appCourse: "all",
    appQuery: "",
    docQuery: ""
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
      var linksLocal = JSON.parse(localStorage.getItem(LS_LINKS) || "{}");
      Object.keys(linksLocal).forEach(function (k) {
        state.links[k] = linksLocal[k];
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
      localStorage.setItem(LS_LINKS, JSON.stringify(state.links));
      // Also update active session user if open in same browser
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
      fetch(FB_REST + "/cabinetCourseLinks.json").then(function (r) { return r.json(); }).catch(function () { return null; })
    ]).then(function (res) {
      var remoteUsers = res[0];
      var remoteLinks = res[1];
      if (remoteUsers && typeof remoteUsers === "object") {
        Object.keys(remoteUsers).forEach(function (uid) {
          if (remoteUsers[uid] && remoteUsers[uid].uid) {
            state.users[uid] = remoteUsers[uid];
          }
        });
      }
      if (remoteLinks && typeof remoteLinks === "object") {
        Object.keys(remoteLinks).forEach(function (cid) {
          state.links[cid] = remoteLinks[cid];
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

  function saveCourseLinkToCloud(cid, data) {
    state.links[cid] = data;
    writeLocalState();
    return fetch(FB_REST + "/cabinetCourseLinks/" + encodeURIComponent(cid) + ".json", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    }).catch(function () { return null; });
  }

  // Collect all enrollments across all users
  function getAllEnrollments() {
    var list = [];
    Object.keys(state.users).forEach(function (uid) {
      var u = state.users[uid];
      if (!u || !u.uid) return;
      var map = u.enrollments || {};
      Object.keys(map).forEach(function (cid) {
        var e = map[cid];
        if (!e) return;
        var cat = catalog.find(function (x) { return x.id === cid; }) || {};
        var cTitle = (cat.title && cat.title.ru) || e.title || cid;
        var cPrice = cat.price || e.price || "";
        list.push({
          uid: u.uid,
          user: u,
          courseId: cid,
          courseTitle: cTitle,
          defaultPrice: parsePriceNumber(cPrice),
          enrollment: e
        });
      });
    });
    list.sort(function (a, b) {
      return ((b.enrollment.paidAt || b.enrollment.createdAt) || 0) - ((a.enrollment.paidAt || a.enrollment.createdAt) || 0);
    });
    return list;
  }

  // Auth gate
  var loginBox = document.getElementById("admLoginView");
  var panelBox = document.getElementById("admPanelView");
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
      if (loginBox) loginBox.hidden = true;
      if (panelBox) panelBox.hidden = false;
      loadAllFromCloud();
    } else {
      if (loginBox) loginBox.hidden = false;
      if (panelBox) panelBox.hidden = true;
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var pass = (loginForm.elements.password.value || "").trim();
      if (pass === DEFAULT_ADMIN_PASS) {
        if (loginErr) loginErr.hidden = true;
        setAuthed(true);
        loginForm.reset();
        updateAuthUI();
      } else {
        if (loginErr) {
          loginErr.textContent = "Неверный пароль администратора.";
          loginErr.hidden = false;
        }
      }
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

  // Tabs
  var tabBtns = document.querySelectorAll("[data-adm-tab]");
  var tabPanes = document.querySelectorAll("[data-adm-pane]");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-adm-tab");
      state.tab = target;
      tabBtns.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-adm-tab") === target); });
      tabPanes.forEach(function (p) { p.hidden = (p.getAttribute("data-adm-pane") !== target); });
    });
  });

  // Populate course filter dropdowns
  function populateCourseSelects() {
    var opts = '<option value="all">Все курсы и конференция</option>' + catalog.map(function (c) {
      var t = (c.title && c.title.ru) || c.id;
      return '<option value="' + esc(c.id) + '">' + esc(t) + "</option>";
    }).join("");
    var paySel = document.getElementById("admPayCourseFilter");
    var appSel = document.getElementById("admAppCourseFilter");
    var manualSel = document.getElementById("admManualCourse");
    if (paySel && !paySel.dataset.ready) {
      paySel.innerHTML = opts;
      paySel.dataset.ready = "1";
      paySel.addEventListener("change", function () { state.payCourse = paySel.value; renderPayments(); });
    }
    if (appSel && !appSel.dataset.ready) {
      appSel.innerHTML = opts;
      appSel.dataset.ready = "1";
      appSel.addEventListener("change", function () { state.appCourse = appSel.value; renderApplications(); });
    }
    if (manualSel && !manualSel.dataset.ready) {
      manualSel.innerHTML = catalog.map(function (c) {
        var t = (c.title && c.title.ru) || c.id;
        return '<option value="' + esc(c.id) + '" data-price="' + esc(parsePriceNumber(c.price)) + '">' + esc(t) + (c.price ? " (" + esc(c.price) + ")" : "") + "</option>";
      }).join("");
      manualSel.dataset.ready = "1";
      var manualAmt = document.getElementById("admManualAmount");
      var syncManualPrice = function () {
        var opt = manualSel.options[manualSel.selectedIndex];
        var pr = opt ? opt.getAttribute("data-price") : "";
        if (manualAmt && pr && pr !== "0") manualAmt.value = pr;
      };
      manualSel.addEventListener("change", syncManualPrice);
      syncManualPrice();
    }
  }

  // Search & filter listeners
  var paySearch = document.getElementById("admPaySearch");
  if (paySearch) paySearch.addEventListener("input", function () { state.payQuery = paySearch.value.toLowerCase(); renderPayments(); });

  var appSearch = document.getElementById("admAppSearch");
  if (appSearch) appSearch.addEventListener("input", function () { state.appQuery = appSearch.value.toLowerCase(); renderApplications(); });

  var appStatusSel = document.getElementById("admAppStatusFilter");
  if (appStatusSel) appStatusSel.addEventListener("change", function () { state.appStatus = appStatusSel.value; renderApplications(); });

  var docSearch = document.getElementById("admDocSearch");
  if (docSearch) docSearch.addEventListener("input", function () { state.docQuery = docSearch.value.toLowerCase(); renderDoctors(); });

  // KPI summary
  function renderKPIs(all) {
    var paidList = all.filter(function (x) { return x.enrollment.status === "paid" || x.enrollment.status === "completed"; });
    var unpaidList = all.filter(function (x) { return !x.enrollment.status || x.enrollment.status === "applied"; });
    var totalSum = paidList.reduce(function (acc, x) {
      return acc + parsePriceNumber(x.enrollment.paidAmount || x.defaultPrice);
    }, 0);
    var docCount = Object.keys(state.users).filter(function (k) { return state.users[k] && state.users[k].uid; }).length;

    var elPaidCount = document.getElementById("kpiPaidCount");
    var elPaidSum = document.getElementById("kpiPaidSum");
    var elPendingCount = document.getElementById("kpiPendingCount");
    var elDocCount = document.getElementById("kpiDocCount");
    if (elPaidCount) elPaidCount.textContent = String(paidList.length);
    if (elPaidSum) elPaidSum.textContent = fmtMoney(totalSum);
    if (elPendingCount) elPendingCount.textContent = String(unpaidList.length);
    if (elDocCount) elDocCount.textContent = String(docCount);
  }

  // Tab 1: Payments ("Кто заплатил, когда и на что")
  function renderPayments() {
    var tbody = document.getElementById("admPaymentsBody");
    var footSum = document.getElementById("admPaymentsFilteredSum");
    if (!tbody) return;
    var all = getAllEnrollments();
    renderKPIs(all);

    var paid = all.filter(function (x) {
      var st = x.enrollment.status;
      if (st !== "paid" && st !== "completed") return false;
      if (state.payCourse !== "all" && x.courseId !== state.payCourse) return false;
      if (state.payQuery) {
        var blob = [x.user.name, x.user.phone, x.user.email, x.courseTitle, x.enrollment.paymentNote, x.enrollment.paidDate].join(" ").toLowerCase();
        if (blob.indexOf(state.payQuery) === -1) return false;
      }
      return true;
    });

    var filteredTotal = paid.reduce(function (acc, x) {
      return acc + parsePriceNumber(x.enrollment.paidAmount || x.defaultPrice);
    }, 0);
    if (footSum) {
      footSum.textContent = "Оплат по фильтру: " + paid.length + " · На сумму: " + fmtMoney(filteredTotal);
    }

    if (!paid.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="adm-empty-cell">Оплаченных записей по выбранному фильтру пока нет. Вы можете отметить оплату во вкладке «Заявки врачей» или нажать «+ Внести оплату вручную».</td></tr>';
      return;
    }

    tbody.innerHTML = paid.map(function (x) {
      var e = x.enrollment;
      var u = x.user;
      var pDate = e.paidDate || fmtDateTime(e.paidAt || e.createdAt);
      var amt = parsePriceNumber(e.paidAmount || x.defaultPrice);
      var note = e.paymentNote || "Оплачено";
      var certVal = e.certUrl || "";
      var keyAttr = esc(u.uid) + "::" + esc(x.courseId);
      return "<tr>"
        + '<td><b class="adm-date">' + esc(pDate) + "</b></td>"
        + "<td><b>" + esc(u.name || "—") + "</b><br><small>" + esc(u.phone || u.email || "") + (u.specialty ? " · " + esc(u.specialty) : "") + "</small></td>"
        + "<td><b>" + esc(x.courseTitle) + '</b><br><small class="meta">' + esc(x.courseId) + "</small></td>"
        + '<td><b class="adm-money">' + esc(fmtMoney(amt)) + "</b><br><small>" + esc(note) + "</small></td>"
        + '<td><div class="adm-cert-inline">'
        + '<input type="url" class="adm-input-sm" placeholder="Ссылка на сертификат (PDF/Drive)" value="' + esc(certVal) + '" data-cert-input="' + keyAttr + '">'
        + '<button type="button" class="btn btn-ghost btn-sm" data-save-cert="' + keyAttr + '">' + (certVal ? "Обновить" : "Выдать серт.") + "</button>"
        + "</div></td>"
        + '<td><button type="button" class="cab-cancel-btn" data-unpay="' + keyAttr + '">Снять оплату</button></td>'
        + "</tr>";
    }).join("");

    tbody.querySelectorAll("[data-save-cert]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pair = btn.getAttribute("data-save-cert").split("::");
        var uid = pair[0], cid = pair[1];
        var inp = tbody.querySelector('[data-cert-input="' + uid + "::" + cid + '"]');
        var url = inp ? inp.value.trim() : "";
        var u = state.users[uid];
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        u.enrollments[cid].certUrl = url;
        u.enrollments[cid].status = url ? "completed" : "paid";
        u.updatedAt = Date.now();
        saveUserToCloud(u).then(function () {
          btn.textContent = "Сохранено ✓";
          setTimeout(function () { renderAll(); }, 700);
        });
      });
    });

    tbody.querySelectorAll("[data-unpay]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pair = btn.getAttribute("data-unpay").split("::");
        var uid = pair[0], cid = pair[1];
        var u = state.users[uid];
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        u.enrollments[cid].status = "applied";
        delete u.enrollments[cid].paidDate;
        delete u.enrollments[cid].paidAt;
        u.updatedAt = Date.now();
        saveUserToCloud(u).then(function () { renderAll(); });
      });
    });
  }

  // Manual payment form ("+ Внести оплату вручную")
  var manualToggle = document.getElementById("admToggleManualBtn");
  var manualBox = document.getElementById("admManualPayBox");
  var manualForm = document.getElementById("admManualPayForm");
  if (manualToggle && manualBox) {
    manualToggle.addEventListener("click", function () {
      manualBox.hidden = !manualBox.hidden;
      var dateInp = manualForm && manualForm.elements.paidDate;
      if (dateInp && !dateInp.value) dateInp.value = todayIso();
    });
  }
  if (manualForm) {
    manualForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (manualForm.elements.name.value || "").trim();
      var contact = (manualForm.elements.contact.value || "").trim();
      var cid = manualForm.elements.courseId.value;
      var amount = parsePriceNumber(manualForm.elements.amount.value);
      var paidDate = manualForm.elements.paidDate.value || todayIso();
      var note = (manualForm.elements.note.value || "").trim() || "Kaspi / перевод";
      var certUrl = (manualForm.elements.certUrl.value || "").trim();
      if (!name || !contact || !cid) return;

      var uid = parsePhoneKey(contact);
      var u = state.users[uid] || {
        uid: uid,
        name: name,
        phone: contact.indexOf("@") === -1 ? contact : "",
        email: contact.indexOf("@") !== -1 ? contact : "",
        specialty: "",
        city: "",
        workplace: "",
        enrollments: {},
        createdAt: Date.now()
      };
      u.name = name;
      u.enrollments = u.enrollments || {};
      var cat = catalog.find(function (x) { return x.id === cid; }) || {};
      var cTitle = (cat.title && cat.title.ru) || cid;
      u.enrollments[cid] = {
        courseId: cid,
        title: cTitle,
        dates: (cat.dates && cat.dates.ru) || "",
        price: cat.price || "",
        format: cat.format || "online",
        status: certUrl ? "completed" : "paid",
        createdAt: (u.enrollments[cid] && u.enrollments[cid].createdAt) || Date.now(),
        paidAt: Date.now(),
        paidDate: paidDate,
        paidAmount: amount || parsePriceNumber(cat.price),
        paymentNote: note,
        certUrl: certUrl
      };
      u.updatedAt = Date.now();

      saveUserToCloud(u).then(function () {
        manualForm.reset();
        if (manualBox) manualBox.hidden = true;
        renderAll();
      });
    });
  }

  // Tab 2: Applications ("Заявки врачей")
  function renderApplications() {
    var tbody = document.getElementById("admAppsBody");
    if (!tbody) return;
    var all = getAllEnrollments();

    var filtered = all.filter(function (x) {
      var st = x.enrollment.status || "applied";
      if (state.appStatus === "applied" && st !== "applied") return false;
      if (state.appStatus === "paid" && st !== "paid" && st !== "completed") return false;
      if (state.appStatus === "completed" && st !== "completed") return false;
      if (state.appCourse !== "all" && x.courseId !== state.appCourse) return false;
      if (state.appQuery) {
        var blob = [x.user.name, x.user.phone, x.user.email, x.courseTitle].join(" ").toLowerCase();
        if (blob.indexOf(state.appQuery) === -1) return false;
      }
      return true;
    });

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="adm-empty-cell">Заявок по выбранному фильтру нет.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (x) {
      var u = x.user;
      var e = x.enrollment;
      var st = e.status || "applied";
      var isPaid = (st === "paid" || st === "completed");
      var keyAttr = esc(u.uid) + "::" + esc(x.courseId);
      var defAmt = parsePriceNumber(e.paidAmount || x.defaultPrice);
      var defDate = e.paidDate || todayIso();
      var waClean = String(u.phone || "").replace(/\D+/g, "");
      var waLink = waClean ? '<a class="adm-wa-link" href="https://wa.me/' + esc(waClean) + '" target="_blank" rel="noopener">WhatsApp ↗</a>' : "";

      var statusHtml = isPaid
        ? '<span class="badge cab-status st-confirmed">Оплачено ✓ (' + esc(e.paidDate || "—") + " · " + esc(fmtMoney(defAmt)) + ")</span>"
        : '<span class="badge cab-status st-applied">Ожидает оплаты</span>';

      var actionHtml = !isPaid
        ? '<div class="adm-pay-inline">'
          + '<input type="number" class="adm-input-sm adm-w-amt" value="' + esc(defAmt || "") + '" placeholder="Сумма KZT" data-pay-amt="' + keyAttr + '">'
          + '<input type="date" class="adm-input-sm adm-w-date" value="' + esc(defDate) + '" data-pay-date="' + keyAttr + '">'
          + '<input type="text" class="adm-input-sm adm-w-note" value="' + esc(e.paymentNote || "Kaspi") + '" placeholder="Способ (Kaspi/Счёт)" data-pay-note="' + keyAttr + '">'
          + '<button type="button" class="btn btn-primary btn-sm" data-mark-paid="' + keyAttr + '">Подтвердить оплату ✓</button>'
          + "</div>"
        : '<div class="adm-cert-inline">'
          + '<input type="url" class="adm-input-sm" placeholder="Ссылка на сертификат врача" value="' + esc(e.certUrl || "") + '" data-app-cert="' + keyAttr + '">'
          + '<button type="button" class="btn btn-ghost btn-sm" data-app-save-cert="' + keyAttr + '">Сохранить серт.</button>'
          + "</div>";

      return "<tr>"
        + "<td><b>" + esc(u.name || "—") + "</b><br><small>" + esc(u.phone || "") + (u.email ? " · " + esc(u.email) : "") + "</small> " + waLink + "</td>"
        + "<td><b>" + esc(x.courseTitle) + "</b><br><small>" + esc(fmtDateTime(e.createdAt)) + "</small></td>"
        + "<td>" + statusHtml + "</td>"
        + "<td>" + actionHtml + "</td>"
        + "</tr>";
    }).join("");

    tbody.querySelectorAll("[data-mark-paid]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var rawKey = btn.getAttribute("data-mark-paid");
        var pair = rawKey.split("::");
        var uid = pair[0], cid = pair[1];
        var u = state.users[uid];
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        var amtInp = tbody.querySelector('[data-pay-amt="' + rawKey + '"]');
        var dateInp = tbody.querySelector('[data-pay-date="' + rawKey + '"]');
        var noteInp = tbody.querySelector('[data-pay-note="' + rawKey + '"]');
        u.enrollments[cid].status = u.enrollments[cid].certUrl ? "completed" : "paid";
        u.enrollments[cid].paidAmount = amtInp ? parsePriceNumber(amtInp.value) : 0;
        u.enrollments[cid].paidDate = (dateInp && dateInp.value) || todayIso();
        u.enrollments[cid].paymentNote = (noteInp && noteInp.value.trim()) || "Kaspi";
        u.enrollments[cid].paidAt = Date.now();
        u.updatedAt = Date.now();
        saveUserToCloud(u).then(function () { renderAll(); });
      });
    });

    tbody.querySelectorAll("[data-app-save-cert]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var rawKey = btn.getAttribute("data-app-save-cert");
        var pair = rawKey.split("::");
        var uid = pair[0], cid = pair[1];
        var u = state.users[uid];
        if (!u || !u.enrollments || !u.enrollments[cid]) return;
        var certInp = tbody.querySelector('[data-app-cert="' + rawKey + '"]');
        var url = certInp ? certInp.value.trim() : "";
        u.enrollments[cid].certUrl = url;
        u.enrollments[cid].status = url ? "completed" : "paid";
        u.updatedAt = Date.now();
        saveUserToCloud(u).then(function () {
          btn.textContent = "Сохранено ✓";
          setTimeout(function () { renderAll(); }, 700);
        });
      });
    });
  }

  // Tab 3: Course Links ("Закрытые чаты и записи")
  function renderCourseLinks() {
    var box = document.getElementById("admLinksList");
    if (!box) return;
    box.innerHTML = catalog.map(function (c) {
      var cid = c.id;
      var t = (c.title && c.title.ru) || cid;
      var cur = state.links[cid] || {};
      return '<div class="adm-link-card">'
        + '<div class="adm-link-head"><b>' + esc(t) + '</b> <span class="meta">(' + esc(cid) + (c.price ? " · " + esc(c.price) : "") + ")</span></div>"
        + '<div class="adm-link-grid">'
        + '<label class="cab-field"><span>💬 Ссылка на закрытый чат (WhatsApp / Telegram)</span>'
        + '<input type="url" placeholder="https://chat.whatsapp.com/..." value="' + esc(cur.chatUrl || "") + '" data-link-chat="' + esc(cid) + '">'
        + "</label>"
        + '<label class="cab-field"><span>▶️ Ссылка на запись лекций / эфир</span>'
        + '<input type="url" placeholder="https://..." value="' + esc(cur.recordUrl || "") + '" data-link-rec="' + esc(cid) + '">'
        + "</label>"
        + '<button type="button" class="btn btn-primary btn-sm" data-save-links="' + esc(cid) + '">Сохранить доступы</button>'
        + "</div></div>";
    }).join("");

    box.querySelectorAll("[data-save-links]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-save-links");
        var chatInp = box.querySelector('[data-link-chat="' + cid + '"]');
        var recInp = box.querySelector('[data-link-rec="' + cid + '"]');
        var payload = {
          chatUrl: chatInp ? chatInp.value.trim() : "",
          recordUrl: recInp ? recInp.value.trim() : "",
          updatedAt: Date.now()
        };
        saveCourseLinkToCloud(cid, payload).then(function () {
          btn.textContent = "Сохранено ✓";
          setTimeout(function () { btn.textContent = "Сохранить доступы"; }, 1800);
        });
      });
    });
  }

  // Tab 4: Doctors Database
  function renderDoctors() {
    var tbody = document.getElementById("admDoctorsBody");
    if (!tbody) return;
    var docs = Object.keys(state.users).map(function (k) { return state.users[k]; }).filter(function (u) { return u && u.uid; });
    docs.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    if (state.docQuery) {
      docs = docs.filter(function (u) {
        var blob = [u.name, u.phone, u.email, u.specialty, u.city, u.workplace].join(" ").toLowerCase();
        return blob.indexOf(state.docQuery) !== -1;
      });
    }

    if (!docs.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="adm-empty-cell">Зарегистрированных врачей пока нет.</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(function (u) {
      var emap = u.enrollments || {};
      var ekeys = Object.keys(emap);
      var coursesSummary = ekeys.length ? ekeys.map(function (cid) {
        var item = emap[cid];
        var isP = (item.status === "paid" || item.status === "completed");
        return (item.title || cid) + (isP ? " [Оплачено ✓]" : " [Заявка]");
      }).join("; ") : "Нет заявок";
      return "<tr>"
        + "<td><b>" + esc(u.name || "—") + "</b></td>"
        + "<td>" + esc(u.phone || "—") + "<br><small>" + esc(u.email || "") + "</small></td>"
        + "<td>" + esc(u.specialty || "—") + "<br><small>" + esc(u.city || "") + (u.workplace ? " · " + esc(u.workplace) : "") + "</small></td>"
        + "<td><small>" + esc(coursesSummary) + "</small></td>"
        + "<td><small>" + esc(fmtDateTime(u.createdAt)) + "</small></td>"
        + "</tr>";
    }).join("");
  }

  // CSV Export helpers
  function downloadCSV(filename, rows) {
    var csv = "\uFEFF" + rows.map(function (r) {
      return r.map(function (cell) {
        var s = String(cell == null ? "" : cell).replace(/"/g, '""');
        return '"' + s + '"';
      }).join(";");
    }).join("\r\n");
    var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  var expPayBtn = document.getElementById("admExportPaymentsBtn");
  if (expPayBtn) {
    expPayBtn.addEventListener("click", function () {
      var all = getAllEnrollments().filter(function (x) {
        return x.enrollment.status === "paid" || x.enrollment.status === "completed";
      });
      var rows = [["Дата оплаты", "ФИО врача", "Телефон", "Email", "Специальность", "Город", "ID курса", "Название курса / конференции", "Сумма (KZT)", "Способ / комментарий", "Сертификат"]];
      all.forEach(function (x) {
        rows.push([
          x.enrollment.paidDate || fmtDateTime(x.enrollment.paidAt),
          x.user.name || "",
          x.user.phone || "",
          x.user.email || "",
          x.user.specialty || "",
          x.user.city || "",
          x.courseId,
          x.courseTitle,
          parsePriceNumber(x.enrollment.paidAmount || x.defaultPrice),
          x.enrollment.paymentNote || "",
          x.enrollment.certUrl || ""
        ]);
      });
      downloadCSV("doctrine-payments-" + todayIso() + ".csv", rows);
    });
  }

  var expDocBtn = document.getElementById("admExportDoctorsBtn");
  if (expDocBtn) {
    expDocBtn.addEventListener("click", function () {
      var docs = Object.keys(state.users).map(function (k) { return state.users[k]; }).filter(function (u) { return u && u.uid; });
      var rows = [["ФИО врача", "Телефон", "Email", "Специальность", "Город", "Место работы", "Дата регистрации", "Заявки и оплаты"]];
      docs.forEach(function (u) {
        var emap = u.enrollments || {};
        var summary = Object.keys(emap).map(function (cid) {
          var e = emap[cid];
          return (e.title || cid) + " (" + (e.status === "paid" || e.status === "completed" ? "Оплачено " + (e.paidDate || "") : "Заявка") + ")";
        }).join("; ");
        rows.push([u.name || "", u.phone || "", u.email || "", u.specialty || "", u.city || "", u.workplace || "", fmtDateTime(u.createdAt), summary]);
      });
      downloadCSV("doctrine-doctors-" + todayIso() + ".csv", rows);
    });
  }

  function renderAll() {
    populateCourseSelects();
    renderPayments();
    renderApplications();
    renderCourseLinks();
    renderDoctors();
  }

  updateAuthUI();
})();
