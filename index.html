/* Muscle Avatar - stable rebuild for GitHub Pages + iPhone Safari
   Requires: #root, #toast, optional #btnReset, #btnExport (provided in index.html)
*/

(function () {
  "use strict";

  // ---------- Error handler (no alert; console + toast if available) ----------
  window.addEventListener("error", function (e) {
    try {
      var msg = (e && e.message) ? e.message : String(e);
      console.error("JS Error:", msg, e);
      if (typeof window.toast === "function") window.toast("Error: " + msg);
    } catch (_) {}
  });

  window.addEventListener("unhandledrejection", function (e) {
    try {
      var r = e && e.reason;
      var msg = (r && r.message) ? r.message : String(r);
      console.error("Promise Error:", msg, e);
      if (typeof window.toast === "function") window.toast("Error: " + msg);
    } catch (_) {}
  });

  // ---------- Utilities ----------
  function $(sel) { return document.querySelector(sel); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function nowDateKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var da = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + da;
  }
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------- Toast ----------
  function toast(msg) {
    var t = $("#toast");
    if (!t) { console.log("toast:", msg); return; }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(function () { t.classList.remove("show"); }, 1400);
  }
  window.toast = toast;

  // ---------- Storage ----------
  var KEY = "muscle_avatar_save_v1";

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---------- Default State ----------
  function defaultState() {
    return {
      profileLocked: false,
      createdAt: null,
      profile: {
        name: "",
        skinTone: 3,
        skinUndertone: 1,
        faceShape: 1,
        hairStyle: 0,
        hairColor: 0,
        eyes: 0,
        brows: 0,
        mouth: 0,
        beard: 0
      },
      progress: {
        chest: 8,
        shoulders: 8,
        arms: 8,
        xp: 0,
        level: 1,
        fatigue: 0,
        lastDay: null,
        setsLeft: 3,
        streak: 0,
        totalSets: 0
      }
    };
  }

  // ---------- Options ----------
  var SKIN_BASE = ["#f7e6d6","#f0d6bf","#e7c3a5","#d8ab88","#c79068","#a8734f","#7c5337","#553526"];
  var UNDERTONE = [
    {name:"Cool", tint:"#a8b9ff"},
    {name:"Neutral", tint:"#ffffff"},
    {name:"Warm", tint:"#ffd19a"}
  ];
  var HAIR_COLORS = ["#111318","#2a1c12","#4a2a16","#7a4a2a","#c7b18a","#c7c7c7"];
  var HAIR_STYLES = ["Buzz","Short","Side Part","Messy","Wavy","Curly","Slick Back","Medium"];
  var FACE_SHAPES = ["Round","Oval","Square","V-shape"];
  var EYES = ["Calm","Sharp","Wide","Tired"];
  var BROWS = ["Soft","Straight","Angled","Thick"];
  var MOUTHS = ["Neutral","Smile","Grin","Serious"];
  var BEARDS = ["None","Stubble","Goatee","Full"];

  // ---------- State ----------
  var state = load() || defaultState();

  function ensureDaily() {
    var today = nowDateKey();
    var p = state.progress;

    if (p.lastDay === null) {
      p.lastDay = today;
      p.setsLeft = 3;
      p.streak = 1;
      save();
      return;
    }

    if (p.lastDay !== today) {
      p.lastDay = today;
      p.setsLeft = 3;
      p.fatigue = Math.max(0, Math.floor(p.fatigue * 0.55));
      p.streak = p.streak + 1;
      save();
      toast("New day: sets refreshed (3).");
    }
  }

  // ---------- Root / Canvas ----------
  var root = $("#root");
  if (!root) {
    // This should not happen with your index.html, but guard anyway.
    document.body.innerHTML = "<pre style='color:#fff'>#root not found</pre>";
    return;
  }

  var canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 410;
  canvas.style.width = "100%";
  canvas.style.maxWidth = "420px";
  canvas.style.height = "auto";
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";

  // ---------- UI helpers ----------
  function selectField(label, key, list) {
    var html = "<label class='fLabel'>" + escapeHtml(label) + "</label>";
    html += "<select class='fSelect' data-select='" + key + "'>";
    for (var i = 0; i < list.length; i++) {
      var selected = (state.profile[key] === i) ? " selected" : "";
      html += "<option value='" + i + "'" + selected + ">" + escapeHtml(list[i]) + "</option>";
    }
    html += "</select>";
    return "<div class='fRow'>" + html + "</div>";
  }

  function bindSelects() {
    var selects = root.querySelectorAll("select[data-select]");
    for (var i = 0; i < selects.length; i++) {
      (function (el) {
        el.addEventListener("change", function () {
          var key = el.getAttribute("data-select");
          state.profile[key] = parseInt(el.value, 10) || 0;
          save();
          drawAvatar(true);
        });
      })(selects[i]);
    }
  }

  function viewProfile() {
    root.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.style.height = "100%";
    wrap.style.display = "grid";
    wrap.style.gridTemplateRows = "auto minmax(0,1fr) auto";
    wrap.style.gap = "10px";

    var head = document.createElement("div");
    head.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:center;gap:8px;'>" +
        "<div><div style='font-size:19px;font-weight:900;'>Mii風アバター作成</div><div style='opacity:.72;font-size:12px;'>一度確定すると見た目は固定されます</div></div>" +
        "<span style='font-size:11px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.2);'>SETUP</span>" +
      "</div>";

    var body = document.createElement("div");
    body.style.display = "grid";
    body.style.gridTemplateColumns = (window.innerWidth < 820) ? "1fr" : "1fr 1fr";
    body.style.gap = "10px";
    body.style.minHeight = "0";

    var left = document.createElement("div");
    left.style.background = "var(--panel)";
    left.style.border = "1px solid var(--line)";
    left.style.borderRadius = "16px";
    left.style.padding = "10px";
    left.style.display = "grid";
    left.style.gridTemplateRows = "auto minmax(0,1fr)";
    left.innerHTML =
      "<div><label class='fLabel'>NAME</label><input id='nameInput' maxlength='12' value='" + escapeHtml(state.profile.name) + "' placeholder='e.g. Daichi' class='fInput'></div>" +
      "<div style='overflow:auto;padding-right:4px;display:grid;gap:8px;'>" +
      selectField("Face", "faceShape", FACE_SHAPES) +
      selectField("Eyes", "eyes", EYES) +
      selectField("Brows", "brows", BROWS) +
      selectField("Mouth", "mouth", MOUTHS) +
      selectField("Beard", "beard", BEARDS) +
      selectField("Hair style", "hairStyle", HAIR_STYLES) +
      selectField("Hair color", "hairColor", ["Black","Dark","Brown","Light Brown","Blonde","Gray"]) +
      selectField("Skin", "skinTone", ["Tone 1","Tone 2","Tone 3","Tone 4","Tone 5","Tone 6","Tone 7","Tone 8"]) +
      selectField("Undertone", "skinUndertone", ["Cool","Neutral","Warm"]) +
      "</div>";

    var right = document.createElement("div");
    right.style.background = "var(--panel)";
    right.style.border = "1px solid var(--line)";
    right.style.borderRadius = "16px";
    right.style.padding = "8px";
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.appendChild(canvas);

    body.appendChild(left);
    body.appendChild(right);

    var foot = document.createElement("div");
    foot.style.display = "flex";
    foot.style.gap = "8px";
    foot.innerHTML =
      "<button id='btnReset' class='pBtn pBtnSub'>Reset</button>" +
      "<button id='btnConfirmProfile' class='pBtn'>確定して開始</button>";

    wrap.appendChild(head);
    wrap.appendChild(body);
    wrap.appendChild(foot);
    root.appendChild(wrap);

    var nameInput = $("#nameInput");
    if (nameInput) {
      nameInput.addEventListener("input", function (e) {
        state.profile.name = (e.target.value || "").trim();
        save();
        drawAvatar(true);
      });
    }

    bindSelects();
    bindUtilityButtons();

    var btn = $("#btnConfirmProfile");
    if (btn) {
      btn.addEventListener("click", function () {
        var name = (state.profile.name || "").trim();
        if (!name) { toast("名前を入力してください"); return; }
        var ok = confirm("この見た目で固定しますか？");
        if (!ok) return;
        state.profileLocked = true;
        state.createdAt = new Date().toISOString();
        if (!state.progress.lastDay) state.progress.lastDay = nowDateKey();
        save();
        ensureDaily();
        viewGame();
      });
    }

    drawAvatar(true);
  }

  // ---------- Game ----------
  var run = null;

  function viewGame() {
    ensureDaily();
    root.innerHTML = "";

    var p = state.progress;

    var layout = document.createElement("div");
    layout.style.height = "100%";
    layout.style.display = "grid";
    layout.style.gridTemplateRows = "auto minmax(0,1fr) auto";
    layout.style.gap = "10px";

    var header = document.createElement("div");
    header.style.background = "var(--panel)";
    header.style.border = "1px solid var(--line)";
    header.style.borderRadius = "14px";
    header.style.padding = "10px";
    header.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>" +
      "<div><div style='font-weight:900;font-size:18px;'>" + escapeHtml(state.profile.name) + "</div><div style='font-size:12px;opacity:.75;'>Lv." + p.level + " / XP " + p.xp + " / Streak " + p.streak + "日</div></div>" +
      "<div style='display:grid;gap:4px;text-align:right;font-size:12px;'><b>残りセット " + p.setsLeft + "/3</b><span style='opacity:.75;'>Fatigue " + p.fatigue + "</span></div>" +
      "</div>" +
      "<div style='margin-top:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:11px;'>" +
      "<div class='mini'>胸<br><b>" + p.chest.toFixed(1) + "</b></div><div class='mini'>肩<br><b>" + p.shoulders.toFixed(1) + "</b></div><div class='mini'>腕<br><b>" + p.arms.toFixed(1) + "</b></div>" +
      "</div>";

    var middle = document.createElement("div");
    middle.style.display = "grid";
    middle.style.gridTemplateColumns = (window.innerWidth < 820) ? "1fr" : "1.05fr 1fr";
    middle.style.gap = "10px";
    middle.style.minHeight = "0";

    var avatarCard = document.createElement("div");
    avatarCard.style.background = "var(--panel)";
    avatarCard.style.border = "1px solid var(--line)";
    avatarCard.style.borderRadius = "14px";
    avatarCard.style.padding = "8px";
    avatarCard.style.display = "flex";
    avatarCard.style.alignItems = "center";
    avatarCard.appendChild(canvas);

    var gameCard = document.createElement("div");
    gameCard.style.background = "var(--panel)";
    gameCard.style.border = "1px solid var(--line)";
    gameCard.style.borderRadius = "14px";
    gameCard.style.padding = "10px";
    gameCard.style.display = "grid";
    gameCard.style.gridTemplateRows = "auto minmax(0,1fr) auto";
    gameCard.innerHTML =
      "<div><b>Bench Press</b><div style='font-size:12px;opacity:.75;'>フォーム+タイミングで成長先が変化</div></div>" +
      "<div id='stage' style='overflow:auto'></div>" +
      "<button id='btnStart' class='pBtn'>セット開始</button>";

    middle.appendChild(avatarCard);
    middle.appendChild(gameCard);

    var foot = document.createElement("div");
    foot.style.display = "flex";
    foot.style.gap = "8px";
    foot.innerHTML = "<button id='btnExport' class='pBtn pBtnSub'>Export</button><button id='btnReset' class='pBtn pBtnSub'>Reset</button>";

    layout.appendChild(header);
    layout.appendChild(middle);
    layout.appendChild(foot);
    root.appendChild(layout);

    var btnStart = $("#btnStart");
    if (btnStart) btnStart.addEventListener("click", startSet);

    drawAvatar(false);
    renderStageIdle();
    bindUtilityButtons();
  }

  function renderStageIdle() {
    var stage = $("#stage");
    if (!stage) return;
    var p = state.progress;

    stage.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;'>" +
        "<span style='font-size:12px;font-weight:900;opacity:.9;border:1px solid rgba(255,255,255,0.12);padding:6px 10px;border-radius:999px;'>READY</span>" +
        "<span style='opacity:.7;font-size:12px;font-weight:700;'>Sets left today: <b>" + p.setsLeft + "</b></span>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div style='opacity:.7;font-size:12px;font-weight:700;'>You’ll first adjust form for 3 seconds, then do 10 reps timing.</div>";

    var btn = $("#btnStart");
    if (!btn) return;
    btn.disabled = (p.setsLeft <= 0);
    btn.textContent = (p.setsLeft <= 0) ? "No sets left today" : "Start Set";
  }

  function startSet() {
    var p = state.progress;
    if (p.setsLeft <= 0) { toast("No sets left today."); return; }

    run = {
      phase: "form",
      form: 60,
      formTimeLeft: 3.0,
      repsTotal: 10,
      repIndex: 0,
      hits: 0,
      repAcc: 0,
      formAcc: 0,
      leakTarget: null,
      lastTick: performance.now(),
      barX: 0.15,
      barV: 0.9,
      zoneA: 0.46,
      zoneB: 0.58
    };

    renderFormPhase();
    requestAnimationFrame(loop);
    toast("Form phase: adjust!");
  }

  function renderFormPhase() {
    var stage = $("#stage");
    if (!stage) return;

    stage.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;'>" +
        "<span style='font-size:12px;font-weight:900;opacity:.9;background:rgba(255,200,0,0.12);border:1px solid rgba(255,200,0,0.25);padding:6px 10px;border-radius:999px;'>FORM (3s)</span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Target: <b>55–70</b></span>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div style='opacity:.7;font-size:12px;font-weight:700;'>Slide to set elbow flare. Try to stay in the target range.</div>" +
      "<div style='margin:10px 0;'>" +
        "<input id='formSlider' type='range' min='0' max='100' value='" + run.form + "' style='width:100%;'>" +
      "</div>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap;'>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Your form: <b id='formVal'>" + run.form + "</b></span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Time: <b id='formTime'>" + run.formTimeLeft.toFixed(1) + "s</b></span>" +
      "</div>";

    var slider = $("#formSlider");
    if (slider) {
      slider.addEventListener("input", function (e) {
        run.form = parseInt(e.target.value, 10);
        var fv = $("#formVal");
        if (fv) fv.textContent = String(run.form);
      });
    }

    var btn = $("#btnStart");
    if (btn) { btn.disabled = true; btn.textContent = "In set..."; }
  }

  function renderRepPhase() {
    var stage = $("#stage");
    if (!stage) return;

    stage.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;'>" +
        "<span style='font-size:12px;font-weight:900;opacity:.9;background:rgba(134,239,172,0.12);border:1px solid rgba(134,239,172,0.25);padding:6px 10px;border-radius:999px;'>REPS (10)</span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Hit the green zone</span>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div style='opacity:.7;font-size:12px;font-weight:700;'>Tap when the marker is in the zone. You can tap anywhere in this panel.</div>" +
      "<div style='margin-top:10px;'>" +
        "<canvas id='repCanvas' width='900' height='180' style='width:100%;height:auto;border-radius:14px;'></canvas>" +
      "</div>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;'>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Rep: <b id='repIdx'>" + (run.repIndex + 1) + "</b>/" + run.repsTotal + "</span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Hits: <b id='hits'>" + run.hits + "</b></span>" +
      "</div>" +
      "<div style='margin-top:10px;display:flex;justify-content:flex-end;'>" +
        "<button id='tapBtn' style='padding:12px 14px;border-radius:12px;border:1px solid rgba(125,211,252,0.35);background:rgba(125,211,252,0.16);color:#fff;font-weight:900;'>TAP</button>" +
      "</div>";

    var tapBtn = $("#tapBtn");
    if (tapBtn) tapBtn.addEventListener("click", handleTap);
    stage.addEventListener("click", function (e) {
      if (e && e.target && e.target.id === "tapBtn") return;
      handleTap();
    });
  }

  function renderResult(result) {
    var stage = $("#stage");
    if (!stage) return;

    stage.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;'>" +
        "<span style='font-size:12px;font-weight:900;opacity:.9;border:1px solid rgba(255,255,255,0.12);padding:6px 10px;border-radius:999px;'>RESULT</span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>" +
          "FormAcc <b>" + Math.round(result.formAcc * 100) + "%</b> · RepAcc <b>" + Math.round(result.repAcc * 100) + "%</b>" +
        "</span>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap;'>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Chest <b>+" + result.gains.chest.toFixed(2) + "</b></span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Shoulders <b>+" + result.gains.shoulders.toFixed(2) + "</b></span>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Arms <b>+" + result.gains.arms.toFixed(2) + "</b></span>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div style='opacity:.7;font-size:12px;font-weight:700;'>" + escapeHtml(result.note) + "</div>" +
      "<div style='margin-top:12px;display:flex;justify-content:flex-end;'>" +
        "<button id='btnDone' style='padding:12px 14px;border-radius:12px;border:1px solid rgba(125,211,252,0.35);background:rgba(125,211,252,0.16);color:#fff;font-weight:900;'>Done</button>" +
      "</div>";

    var btnDone = $("#btnDone");
    if (btnDone) {
      btnDone.addEventListener("click", function () {
        run = null;
        var bs = $("#btnStart");
        if (bs) bs.disabled = false;
        viewGame();
        toast("Saved.");
      });
    }
  }

  function loop(t) {
    if (!run) return;
    var dt = (t - run.lastTick) / 1000;
    run.lastTick = t;

    if (run.phase === "form") {
      run.formTimeLeft -= dt;
      var ft = $("#formTime");
      if (ft) ft.textContent = (Math.max(0, run.formTimeLeft)).toFixed(1) + "s";

      drawAvatar(true);

      if (run.formTimeLeft <= 0) {
        var v = run.form;
        var targetA = 55, targetB = 70;
        var acc;
        if (v >= targetA && v <= targetB) {
          var center = (targetA + targetB) / 2;
          var dist = Math.abs(v - center) / ((targetB - targetA) / 2);
          acc = 1.0 - 0.10 * dist;
        } else {
          var dist2 = (v < targetA) ? (targetA - v) : (v - targetB);
          acc = clamp(0.85 - (dist2 / 40), 0.15, 0.85);
        }
        run.formAcc = clamp(acc, 0, 1);

        run.phase = "reps";
        run.repIndex = 0;
        run.hits = 0;
        run.barX = 0.08;
        run.barV = 1.15 + (Math.random() * 0.15);
        run.zoneA = 0.46;
        run.zoneB = 0.58;
        renderRepPhase();
      }
    } else if (run.phase === "reps") {
      run.barX += run.barV * dt;
      if (run.barX > 1.0) { run.barX = 1.0; run.barV *= -1; }
      if (run.barX < 0.0) { run.barX = 0.0; run.barV *= -1; }
      drawRepBar();
    }

    requestAnimationFrame(loop);
  }

  function handleTap() {
    if (!run || run.phase !== "reps") return;

    var inZone = (run.barX >= run.zoneA && run.barX <= run.zoneB);
    if (inZone) {
      run.hits++;
      toast("Good rep!");
    } else {
      toast("Miss!");
    }

    run.repIndex++;

    var repIdx = $("#repIdx");
    var hitsEl = $("#hits");
    if (repIdx) repIdx.textContent = String(Math.min(run.repIndex + 1, run.repsTotal));
    if (hitsEl) hitsEl.textContent = String(run.hits);

    var drift = (Math.random() * 0.04 - 0.02);
    run.zoneA = clamp(run.zoneA + drift, 0.20, 0.70);
    run.zoneB = clamp(run.zoneA + 0.12, run.zoneA + 0.08, 0.92);

    if (run.repIndex >= run.repsTotal) {
      run.repAcc = clamp(run.hits / run.repsTotal, 0, 1);
      var result = applyGains(run.formAcc, run.repAcc, run.form);
      run.phase = "result";
      drawAvatar(false);
      renderResult(result);

      var btn = $("#btnStart");
      if (btn) btn.disabled = false;
    }
  }

  function xpToNext(level) { return 60 + (level - 1) * 22; }

  function applyGains(formAcc, repAcc, formVal) {
    var p = state.progress;

    var fatigueFactor = clamp(1.0 - (p.fatigue / 120), 0.55, 1.0);
    var levelFactor = 1.0 + (p.level - 1) * 0.04;
    var base = 1.25 * levelFactor * fatigueFactor;

    var target = base * (0.40 + 0.60 * repAcc) * (0.40 + 0.60 * formAcc);
    var leakAmt = base * (1 - formAcc) * (0.50 + 0.50 * (1 - repAcc));

    var gainChest = target;
    var gainShoulders = 0, gainArms = 0;

    if (formVal < 45) gainArms += leakAmt;
    else if (formVal > 75) gainShoulders += leakAmt;
    else { gainShoulders += leakAmt * 0.55; gainArms += leakAmt * 0.45; }

    var fatigueUp = Math.round(10 + (1 - repAcc) * 10 + (1 - formAcc) * 8);
    p.fatigue = clamp(p.fatigue + fatigueUp, 0, 140);

    var xpGain = Math.round(14 + 18 * repAcc + 16 * formAcc);
    p.xp += xpGain;
    while (p.xp >= xpToNext(p.level)) {
      p.xp -= xpToNext(p.level);
      p.level++;
      toast("Level up! " + p.level);
    }

    p.chest += gainChest;
    p.shoulders += gainShoulders;
    p.arms += gainArms;

    p.setsLeft = Math.max(0, p.setsLeft - 1);
    p.totalSets += 1;

    save();

    var note = "Solid form range — most gains stayed on target.";
    if (formVal < 45) note = "Form was too close — gains leaked into Arms.";
    else if (formVal > 75) note = "Form was too wide — gains leaked into Shoulders.";

    return {
      formAcc: formAcc,
      repAcc: repAcc,
      gains: { chest: gainChest, shoulders: gainShoulders, arms: gainArms },
      note: note
    };
  }

  // ---------- Drawing helpers ----------
  function roundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function capsule(ctx, x, y, r, h) {
    roundedRect(ctx, x - r, y, r * 2, h, 999);
    ctx.fill();
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "").trim();
    var full = (h.length === 3) ? (h[0]+h[0]+h[1]+h[1]+h[2]+h[2]) : h;
    var n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(rgb) {
    function to2(v) { var s = (v|0).toString(16); return (s.length === 1) ? ("0"+s) : s; }
    return "#" + to2(rgb.r) + to2(rgb.g) + to2(rgb.b);
  }

  function mixColor(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex({ r: Math.round(lerp(A.r, B.r, t)), g: Math.round(lerp(A.g, B.g, t)), b: Math.round(lerp(A.b, B.b, t)) });
  }

  function darkenColor(c, amt) {
    var A = hexToRgb(c);
    return rgbToHex({ r: Math.round(A.r * (1 - amt)), g: Math.round(A.g * (1 - amt)), b: Math.round(A.b * (1 - amt)) });
  }

  function drawFaceFeatures(ctx, x, y, faceW, faceH) {
    var brow = state.profile.brows;
    var eye = state.profile.eyes;
    var mouth = state.profile.mouth;
    var beard = state.profile.beard;
    var hairC = HAIR_COLORS[state.profile.hairColor];

    var browY = y - faceH * 0.15;
    var eyeY = y - faceH * 0.05;
    var spacing = faceW * 0.2;

    // brows (Mii-like bold simple lines)
    ctx.strokeStyle = "#1e1f28";
    ctx.lineCap = "round";
    ctx.lineWidth = 4.5;
    for (var i = -1; i <= 1; i += 2) {
      var bx = x + i * spacing;
      ctx.beginPath();
      if (brow === 0) { ctx.moveTo(bx - i * 16, browY + 1); ctx.lineTo(bx + i * 16, browY - 1); }
      if (brow === 1) { ctx.moveTo(bx - i * 16, browY - 2); ctx.lineTo(bx + i * 16, browY - 2); }
      if (brow === 2) { ctx.moveTo(bx - i * 16, browY + 4); ctx.lineTo(bx + i * 16, browY - 5); }
      if (brow === 3) { ctx.lineWidth = 6; ctx.moveTo(bx - i * 18, browY + 2); ctx.lineTo(bx + i * 18, browY - 2); ctx.lineWidth = 4.5; }
      ctx.stroke();
    }

    // eyes (black ovals)
    ctx.fillStyle = "#1f2433";
    for (var j = -1; j <= 1; j += 2) {
      var ex = x + j * spacing;
      var rx = eye === 2 ? 8 : 7;
      var ry = eye === 3 ? 4 : 5;
      ctx.beginPath();
      if (eye === 1) ctx.ellipse(ex, eyeY, rx + 1, ry, j * 0.25, 0, Math.PI * 2);
      else ctx.ellipse(ex, eyeY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // simple nose
    ctx.strokeStyle = "#2b2f3f";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 2);
    ctx.lineTo(x + 2, y + 16);
    ctx.quadraticCurveTo(x + 1, y + 20, x - 5, y + 20);
    ctx.stroke();

    // mouth
    var my = y + faceH * 0.20;
    ctx.strokeStyle = "#2f3038";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    if (mouth === 0) { ctx.moveTo(x - 14, my); ctx.lineTo(x + 14, my); }
    if (mouth === 1) { ctx.moveTo(x - 14, my - 2); ctx.quadraticCurveTo(x, my + 7, x + 14, my - 2); }
    if (mouth === 2) { ctx.moveTo(x - 14, my - 4); ctx.quadraticCurveTo(x, my + 10, x + 14, my - 4); }
    if (mouth === 3) { ctx.moveTo(x - 14, my + 3); ctx.quadraticCurveTo(x, my - 6, x + 14, my + 3); }
    ctx.stroke();

    // subtle blush dots
    ctx.fillStyle = "rgba(255,120,140,0.18)";
    ctx.beginPath();
    ctx.ellipse(x - spacing - 8, y + faceH * 0.08, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + spacing + 8, y + faceH * 0.08, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (beard !== 0) {
      ctx.fillStyle = mixColor(hairC, "#000", 0.15);
      ctx.globalAlpha = 0.22;
      roundedRect(ctx, x - faceW * 0.19, y + faceH * 0.20, faceW * 0.38, beard === 2 ? 18 : 30, 16);
      ctx.fill();
      if (beard === 3) {
        roundedRect(ctx, x - faceW * 0.30, y + faceH * 0.12, faceW * 0.60, 48, 20);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawHair(ctx, x, y, faceW, faceH, styleIndex, color) {
    var top = y - faceH * 0.58;
    var left = x - faceW * 0.58;
    var hw = faceW * 1.16;
    var hh = faceH * 0.58;

    // base cap
    var grad = ctx.createLinearGradient(0, top, 0, top + hh);
    grad.addColorStop(0, mixColor(color, "#ffffff", 0.10));
    grad.addColorStop(1, mixColor(color, "#000000", 0.25));
    ctx.fillStyle = grad;
    roundedRect(ctx, left, top, hw, hh, 46);
    ctx.fill();

    // style spikes/bangs
    ctx.fillStyle = mixColor(color, "#000000", 0.18);
    ctx.beginPath();
    var spikes = 6 + (styleIndex % 3);
    for (var i = 0; i < spikes; i++) {
      var px = left + 10 + i * (hw - 20) / (spikes - 1);
      var deep = (i % 2 === 0 ? 16 : 8) + (styleIndex === 5 ? 8 : 0);
      ctx.moveTo(px - 8, y - faceH * 0.19);
      ctx.lineTo(px, y - faceH * 0.19 + deep);
      ctx.lineTo(px + 8, y - faceH * 0.19);
    }
    ctx.fill();

    // side part/slick accents
    if (styleIndex === 2 || styleIndex === 6) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 12, top + 12);
      ctx.lineTo(x + 20, top + hh - 10);
      ctx.stroke();
    }
  }

  function drawAvatar(isPreview) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // neutral light background like Mii editor
    ctx.fillStyle = "#e6e6e6";
    ctx.fillRect(0, 0, w, h);

    var p = state.progress;
    var chest = isPreview ? Math.min(p.chest, 14) : p.chest;
    var shoulders = isPreview ? Math.min(p.shoulders, 14) : p.shoulders;
    var arms = isPreview ? Math.min(p.arms, 14) : p.arms;

    function g(x) { return 1 - Math.exp(-x / 48); }
    var gC = g(chest), gS = g(shoulders), gA = g(arms);

    var cx = w * 0.5;
    var headY = h * 0.23;

    var skinBase = SKIN_BASE[state.profile.skinTone] || SKIN_BASE[3];
    var tint = UNDERTONE[state.profile.skinUndertone].tint;
    var skin = mixColor(skinBase, tint, 0.08);
    var skinShadow = darkenColor(skin, 0.12);

    // Mii-like proportion: big head, compact torso, slim legs
    var headW = 146;
    var headH = 158;
    var faceShape = state.profile.faceShape;
    var roundness = [64, 56, 44, 38][faceShape] || 56;

    var neckY = headY + headH * 0.50;
    var shoulderW = 90 + 52 * gS;
    var torsoW = 66 + 44 * gC;
    var torsoH = 96;
    var armW = 12 + 10 * gA;
    var legW = 16 + 4 * gA;
    var legH = 98;

    // neck
    ctx.fillStyle = skinShadow;
    roundedRect(ctx, cx - 13, neckY - 4, 26, 18, 10);
    ctx.fill();

    // shirt (example-like red)
    var shirtGrad = ctx.createLinearGradient(cx - torsoW, neckY + 18, cx + torsoW, neckY + 18);
    shirtGrad.addColorStop(0, "#f34b3f");
    shirtGrad.addColorStop(0.5, "#ff5d4e");
    shirtGrad.addColorStop(1, "#f14639");

    ctx.fillStyle = shirtGrad;
    roundedRect(ctx, cx - shoulderW / 2, neckY + 12, shoulderW, torsoH * 0.45, 18);
    ctx.fill();
    roundedRect(ctx, cx - torsoW / 2, neckY + 30, torsoW, torsoH, 20);
    ctx.fill();

    // arms + hands
    ctx.fillStyle = shirtGrad;
    roundedRect(ctx, cx - shoulderW / 2 - armW + 5, neckY + 28, armW, 86, 12);
    roundedRect(ctx, cx + shoulderW / 2 - 5, neckY + 28, armW, 86, 12);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(cx - shoulderW / 2 - armW / 2 + 5, neckY + 114, 10, 0, Math.PI * 2);
    ctx.arc(cx + shoulderW / 2 + armW / 2 - 5, neckY + 114, 10, 0, Math.PI * 2);
    ctx.fill();

    // pants
    var pantsGrad = ctx.createLinearGradient(0, neckY + 110, 0, h);
    pantsGrad.addColorStop(0, "#505665");
    pantsGrad.addColorStop(1, "#2b3040");
    ctx.fillStyle = pantsGrad;
    roundedRect(ctx, cx - torsoW * 0.46, neckY + 120, torsoW * 0.92, 34, 12);
    ctx.fill();

    // legs + shoes
    ctx.fillStyle = pantsGrad;
    roundedRect(ctx, cx - 6 - legW, neckY + 148, legW, legH, 12);
    roundedRect(ctx, cx + 6, neckY + 148, legW, legH, 12);
    ctx.fill();

    ctx.fillStyle = "#3a3f4f";
    roundedRect(ctx, cx - 8 - legW, neckY + 238, legW + 6, 14, 8);
    roundedRect(ctx, cx + 2, neckY + 238, legW + 6, 14, 8);
    ctx.fill();

    // head
    ctx.fillStyle = skin;
    roundedRect(ctx, cx - headW / 2, headY - headH / 2, headW, headH, roundness);
    ctx.fill();

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = skinShadow;
    roundedRect(ctx, cx - headW / 2 + 10, headY - headH / 2 + 12, headW - 20, headH - 18, roundness - 8);
    ctx.fill();
    ctx.globalAlpha = 1;

    drawHair(ctx, cx, headY, headW, headH, state.profile.hairStyle, HAIR_COLORS[state.profile.hairColor]);
    drawFaceFeatures(ctx, cx, headY + 4, headW, headH);

    // shadow + name
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.ellipse(cx, h - 18, 58, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(40,40,50,0.85)";
    ctx.font = "800 15px -apple-system,system-ui";
    var nm = (state.profile.name || (isPreview ? "Preview" : "Player")).slice(0, 12);
    ctx.fillText(nm, 14, 24);
  }

  function drawRepBar() {
    var c = $("#repCanvas");
    if (!c || !run) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#0f1018";
    ctx.fillRect(0, 0, w, h);

    var bx = w * 0.08, by = h * 0.48, bw = w * 0.84, bh = 26;

    ctx.fillStyle = "#22243a";
    roundedRect(ctx, bx, by, bw, bh, 999);
    ctx.fill();

    var zx = bx + bw * run.zoneA;
    var zw = bw * (run.zoneB - run.zoneA);
    ctx.fillStyle = "rgba(134,239,172,0.55)";
    roundedRect(ctx, zx, by, zw, bh, 999);
    ctx.fill();

    var mx = bx + bw * run.barX;
    ctx.fillStyle = "rgba(125,211,252,0.95)";
    roundedRect(ctx, mx - 10, by - 14, 20, bh + 28, 10);
    ctx.fill();

    ctx.fillStyle = "rgba(231,231,234,0.75)";
    ctx.font = "700 20px -apple-system,system-ui";
    ctx.fillText("Tap in the zone", bx, 36);
  }

  // ---------- Reset / Export ----------
  var resetStep = 0;

  function bindUtilityButtons() {
    var btnReset = $("#btnReset");
    if (btnReset && !btnReset._bound) {
      btnReset._bound = true;
      btnReset.addEventListener("click", function () {
        if (resetStep === 0) {
          resetStep = 1;
          toast("もう一度Resetで初期化");
          setTimeout(function () { resetStep = 0; }, 2500);
          return;
        }
        var ok = confirm("すべてのデータを削除しますか？");
        if (!ok) { resetStep = 0; return; }
        localStorage.removeItem(KEY);
        state = defaultState();
        resetStep = 0;
        toast("初期化しました");
        boot();
      });
    }

    var btnExport = $("#btnExport");
    if (btnExport && !btnExport._bound) {
      btnExport._bound = true;
      btnExport.addEventListener("click", function () {
        try {
          var data = JSON.stringify(state, null, 2);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(data).then(function () {
              toast("Save data copied.");
            }).catch(function () {
              prompt("Copy save data:", data);
            });
          } else {
            prompt("Copy save data:", data);
          }
        } catch (e) {
          prompt("Copy save data:", JSON.stringify(state));
        }
      });
    }
  }

  // ---------- Boot ----------
  function boot() {
    if (state.profileLocked) {
      ensureDaily();
      viewGame();
    } else {
      viewProfile();
    }
  }

  boot();

})();
