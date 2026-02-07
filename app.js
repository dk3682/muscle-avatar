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
  canvas.width = 900;
  canvas.height = 620;

  // ---------- UI helpers ----------
  function selector(label, key, list, index, isColor) {
    var text = escapeHtml(list[index]);
    var swatch = "";
    if (isColor && key === "hairColor") {
      swatch = "<span style='width:14px;height:14px;border-radius:50%;background:"+HAIR_COLORS[index]+";border:1px solid rgba(255,255,255,0.2)'></span>";
      text = swatch + "<span>" + escapeHtml(list[index]) + "</span>";
    }
    if (isColor && key === "skinTone") {
      swatch = "<span style='width:14px;height:14px;border-radius:50%;background:"+SKIN_BASE[index]+";border:1px solid rgba(255,255,255,0.2)'></span>";
      text = swatch + "<span>" + escapeHtml(list[index]) + "</span>";
    }

    return (
      "<div class='selectorRow' style='display:flex;gap:10px;align-items:center;justify-content:space-between;margin:8px 0;'>" +
        "<button class='btnSmall' data-key='" + key + "' data-dir='-1'>◀</button>" +
        "<div style='flex:1; text-align:center;'>" +
          "<div style='opacity:.7;font-size:12px;font-weight:800;'>" + escapeHtml(label) + "</div>" +
          "<div style='font-weight:900;font-size:14px;display:flex;gap:8px;justify-content:center;align-items:center;'>" + text + "</div>" +
        "</div>" +
        "<button class='btnSmall' data-key='" + key + "' data-dir='1'>▶</button>" +
      "</div>"
    );
  }

  function getOptionLength(key) {
    switch (key) {
      case "skinTone": return SKIN_BASE.length;
      case "skinUndertone": return UNDERTONE.length;
      case "faceShape": return FACE_SHAPES.length;
      case "hairStyle": return HAIR_STYLES.length;
      case "hairColor": return HAIR_COLORS.length;
      case "eyes": return EYES.length;
      case "brows": return BROWS.length;
      case "mouth": return MOUTHS.length;
      case "beard": return BEARDS.length;
      default: return 1;
    }
  }

  function bindSelectorButtons() {
    var btns = root.querySelectorAll("button[data-key]");
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-key");
          var dir = parseInt(btn.getAttribute("data-dir"), 10);
          var max = getOptionLength(key);
          state.profile[key] = (state.profile[key] + dir + max) % max;
          save();
          viewProfile(); // rerender
        });
      })(btns[i]);
    }
  }

  // ---------- Screens ----------
  function viewProfile() {
    root.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr";
    wrap.style.gap = "12px";

    var card1 = document.createElement("div");
    card1.style.background = "rgba(255,255,255,0.06)";
    card1.style.border = "1px solid rgba(255,255,255,0.08)";
    card1.style.borderRadius = "16px";
    card1.style.padding = "14px";

    var card2 = document.createElement("div");
    card2.style.background = "rgba(255,255,255,0.06)";
    card2.style.border = "1px solid rgba(255,255,255,0.08)";
    card2.style.borderRadius = "16px";
    card2.style.padding = "14px";

    card1.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>" +
        "<div>" +
          "<div style='font-weight:900;font-size:18px;'>Create your avatar</div>" +
          "<div style='opacity:.7;font-size:12px;font-weight:700;'>Name + look (only once). After you confirm, it’s locked.</div>" +
        "</div>" +
        "<div style='font-size:12px;font-weight:900;opacity:.9;background:rgba(255,200,0,0.12);border:1px solid rgba(255,200,0,0.25);padding:6px 10px;border-radius:999px;'>PROFILE SETUP</div>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +

      "<div style='display:flex;flex-direction:column;gap:10px;'>" +
        "<div>" +
          "<div style='opacity:.7;font-size:12px;font-weight:900;margin-bottom:6px;'>NAME (1–12 chars)</div>" +
          "<input id='nameInput' maxlength='12' placeholder='e.g., Daichi' value='" + escapeHtml(state.profile.name) + "' " +
                 "style='width:100%;padding:12px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.25);color:#fff;font-weight:800;'>" +
        "</div>" +

        "<div style='display:flex;gap:8px;flex-wrap:wrap;'>" +
          "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;opacity:.9;font-weight:800;font-size:12px;'>Face</span>" +
          "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;opacity:.9;font-weight:800;font-size:12px;'>Hair</span>" +
          "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;opacity:.9;font-weight:800;font-size:12px;'>Tone</span>" +
        "</div>" +

        selector("Face shape", "faceShape", FACE_SHAPES, state.profile.faceShape, false) +
        selector("Eyes", "eyes", EYES, state.profile.eyes, false) +
        selector("Brows", "brows", BROWS, state.profile.brows, false) +
        selector("Mouth", "mouth", MOUTHS, state.profile.mouth, false) +
        selector("Beard", "beard", BEARDS, state.profile.beard, false) +

        "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +

        selector("Hair style", "hairStyle", HAIR_STYLES, state.profile.hairStyle, false) +
        selector("Hair color", "hairColor", ["Color 1","Color 2","Color 3","Color 4","Color 5","Color 6"], state.profile.hairColor, true) +

        "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +

        "<div style='font-weight:900;'>Skin</div>" +
        "<div style='opacity:.7;font-size:12px;font-weight:700;margin-top:2px;'>Choose tone + undertone. This affects shading too.</div>" +

        selector("Skin tone", "skinTone", ["Tone 1","Tone 2","Tone 3","Tone 4","Tone 5","Tone 6","Tone 7","Tone 8"], state.profile.skinTone, true) +
        selector("Undertone", "skinUndertone", ["Cool","Neutral","Warm"], state.profile.skinUndertone, false) +

        "<div style='margin-top:10px;display:flex;justify-content:flex-end;'>" +
          "<button id='btnConfirmProfile' style='padding:12px 14px;border-radius:12px;border:1px solid rgba(125,211,252,0.35);background:rgba(125,211,252,0.16);color:#fff;font-weight:900;'>Confirm & Lock</button>" +
        "</div>" +

        "<div style='opacity:.7;font-size:12px;font-weight:700;'>" +
          "Tip: The game is about watching your body change. After locking, you’ll grow via Chest/Shoulders/Arms." +
        "</div>" +
      "</div>";

    card2.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>" +
        "<div>" +
          "<div style='font-weight:900;'>Preview</div>" +
          "<div style='opacity:.7;font-size:12px;font-weight:700;'>Your body will change as you train.</div>" +
        "</div>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;opacity:.9;font-weight:800;font-size:12px;'>Live</span>" +
      "</div>" +
      "<div style='margin-top:10px;'></div>";

    card2.appendChild(canvas);

    wrap.appendChild(card1);
    wrap.appendChild(card2);
    root.appendChild(wrap);

    // bind
    var nameInput = $("#nameInput");
    if (nameInput) {
      nameInput.addEventListener("input", function (e) {
        state.profile.name = (e.target.value || "").trim();
        save();
        drawAvatar(true);
      });
    }

    bindSelectorButtons();

    var btn = $("#btnConfirmProfile");
    if (btn) {
      btn.addEventListener("click", function () {
        var name = (state.profile.name || "").trim();
        if (!name) { toast("Please enter a name."); return; }
        var ok = confirm("Lock this avatar? You won't be able to change name or appearance later.");
        if (!ok) return;
        state.profileLocked = true;
        state.createdAt = new Date().toISOString();
        if (!state.progress.lastDay) state.progress.lastDay = nowDateKey();
        save();
        toast("Profile locked.");
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

    var header = document.createElement("div");
    header.style.background = "rgba(255,255,255,0.06)";
    header.style.border = "1px solid rgba(255,255,255,0.08)";
    header.style.borderRadius = "16px";
    header.style.padding = "14px";
    header.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>" +
        "<div>" +
          "<div style='font-weight:900;font-size:18px;'>" + escapeHtml(state.profile.name) + "</div>" +
          "<div style='opacity:.7;font-size:12px;font-weight:700;'>Level " + p.level + " · Streak " + p.streak + " days · Total sets " + p.totalSets + "</div>" +
        "</div>" +
        "<div style='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;'>" +
          "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Sets left: <b>" + p.setsLeft + "</b>/3</span>" +
          "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>Fatigue: <b>" + p.fatigue + "</b></span>" +
        "</div>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px;'>" +
        "<div style='background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px;'><div style='opacity:.7;font-size:12px;font-weight:900;'>Chest</div><div style='font-weight:900;font-size:18px;'>" + p.chest.toFixed(1) + "</div></div>" +
        "<div style='background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px;'><div style='opacity:.7;font-size:12px;font-weight:900;'>Shoulders</div><div style='font-weight:900;font-size:18px;'>" + p.shoulders.toFixed(1) + "</div></div>" +
        "<div style='background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px;'><div style='opacity:.7;font-size:12px;font-weight:900;'>Arms</div><div style='font-weight:900;font-size:18px;'>" + p.arms.toFixed(1) + "</div></div>" +
      "</div>";

    var grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1fr";
    grid.style.gap = "12px";
    grid.style.marginTop = "12px";

    var cardA = document.createElement("div");
    cardA.style.background = "rgba(255,255,255,0.06)";
    cardA.style.border = "1px solid rgba(255,255,255,0.08)";
    cardA.style.borderRadius = "16px";
    cardA.style.padding = "14px";
    cardA.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>" +
        "<div><div style='font-weight:900;'>Avatar</div><div style='opacity:.7;font-size:12px;font-weight:700;'>Your physique reflects your training distribution.</div></div>" +
        "<div style='font-size:12px;font-weight:900;opacity:.9;background:rgba(134,239,172,0.12);border:1px solid rgba(134,239,172,0.25);padding:6px 10px;border-radius:999px;'>GROWTH</div>" +
      "</div>" +
      "<div style='margin-top:10px;'></div>";
    cardA.appendChild(canvas);

    var cardB = document.createElement("div");
    cardB.style.background = "rgba(255,255,255,0.06)";
    cardB.style.border = "1px solid rgba(255,255,255,0.08)";
    cardB.style.borderRadius = "16px";
    cardB.style.padding = "14px";
    cardB.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>" +
        "<div><div style='font-weight:900;'>Bench Press (Chest target)</div><div style='opacity:.7;font-size:12px;font-weight:700;'>Form tweak × Rep timing → where the gains go.</div></div>" +
        "<span style='padding:6px 10px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;font-weight:800;font-size:12px;'>1 set ≈ 30–45s</span>" +
      "</div>" +
      "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.10);margin:12px 0;'>" +
      "<div id='stage'></div>" +
      "<div style='margin-top:12px;display:flex;justify-content:flex-end;'>" +
        "<button id='btnStart' style='padding:12px 14px;border-radius:12px;border:1px solid rgba(125,211,252,0.35);background:rgba(125,211,252,0.16);color:#fff;font-weight:900;'>Start Set</button>" +
      "</div>" +
      "<div style='opacity:.7;font-size:12px;font-weight:700;margin-top:8px;'>" +
        "If your form is weird, gains leak: <b>Too close</b> → Arms · <b>Too wide</b> → Shoulders." +
      "</div>";

    grid.appendChild(cardA);
    grid.appendChild(cardB);

    root.appendChild(header);
    root.appendChild(grid);

    var btnStart = $("#btnStart");
    if (btnStart) btnStart.addEventListener("click", startSet);

    drawAvatar(false);
    renderStageIdle();
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

    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    var browY = y - faceH * 0.10;
    var eyeY = y - faceH * 0.02;

    // brows
    var sides = [-1, 1];
    for (var i = 0; i < sides.length; i++) {
      var s = sides[i];
      ctx.beginPath();
      var bx = x + s * faceW * 0.18;
      if (brow === 0) ctx.quadraticCurveTo(bx - s * 30, browY - 6, bx + s * 30, browY);
      if (brow === 1) { ctx.moveTo(bx - s * 30, browY); ctx.lineTo(bx + s * 30, browY); }
      if (brow === 2) ctx.quadraticCurveTo(bx - s * 30, browY + 6, bx + s * 30, browY - 8);
      if (brow === 3) { ctx.lineWidth = 8; ctx.moveTo(bx - s * 32, browY); ctx.lineTo(bx + s * 32, browY); ctx.lineWidth = 6; }
      ctx.stroke();
    }

    // eyes
    ctx.lineWidth = 5;
    for (var j = 0; j < sides.length; j++) {
      var ss = sides[j];
      var ex = x + ss * faceW * 0.18;
      ctx.beginPath();
      if (eye === 0) ctx.ellipse(ex, eyeY, 18, 10, 0, 0, Math.PI * 2);
      if (eye === 1) ctx.ellipse(ex, eyeY, 20, 8, 0.25 * ss, 0, Math.PI * 2);
      if (eye === 2) ctx.ellipse(ex, eyeY, 22, 12, 0, 0, Math.PI * 2);
      if (eye === 3) ctx.ellipse(ex, eyeY + 2, 18, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      ctx.arc(ex + (eye === 1 ? ss * 4 : 0), eyeY + (eye === 3 ? 2 : 0), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // mouth
    var my = y + faceH * 0.18;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (mouth === 0) { ctx.moveTo(x - faceW * 0.12, my); ctx.lineTo(x + faceW * 0.12, my); }
    if (mouth === 1) ctx.quadraticCurveTo(x, my + 14, x + faceW * 0.12, my);
    if (mouth === 2) ctx.quadraticCurveTo(x, my + 18, x + faceW * 0.14, my - 2);
    if (mouth === 3) ctx.quadraticCurveTo(x, my - 10, x + faceW * 0.12, my);
    ctx.stroke();

    // beard
    if (beard !== 0) {
      ctx.fillStyle = mixColor(hairC, "#000000", 0.15);
      ctx.globalAlpha = 0.35;
      if (beard === 1) {
        roundedRect(ctx, x - faceW * 0.32, y + faceH * 0.06, faceW * 0.64, faceH * 0.40, 60);
        ctx.fill();
      } else if (beard === 2) {
        roundedRect(ctx, x - faceW * 0.10, y + faceH * 0.20, faceW * 0.20, faceH * 0.22, 40);
        ctx.fill();
      } else if (beard === 3) {
        roundedRect(ctx, x - faceW * 0.36, y + faceH * 0.04, faceW * 0.72, faceH * 0.48, 70);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawHair(ctx, x, y, faceW, faceH, styleIndex, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;

    var top = y - faceH * 0.22;
    var left = x - faceW * 0.55;

    ctx.beginPath();
    switch (styleIndex) {
      case 0: // buzz
        ctx.globalAlpha = 0.85;
        ctx.ellipse(x, y - faceH * 0.18, faceW * 0.46, faceH * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 1: // short
        roundedRect(ctx, x - faceW * 0.54, top, faceW * 1.08, faceH * 0.38, 42);
        ctx.fill();
        break;
      case 2: // side part
        roundedRect(ctx, x - faceW * 0.56, top, faceW * 1.12, faceH * 0.40, 46);
        ctx.fill();
        ctx.clearRect(x + faceW * 0.06, top + 18, faceW * 0.08, faceH * 0.32);
        break;
      case 3: // messy
        roundedRect(ctx, x - faceW * 0.56, top, faceW * 1.12, faceH * 0.38, 44);
        ctx.fill();
        for (var i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.moveTo(x - faceW * 0.40 + i * 18, top + 10);
          ctx.lineTo(x - faceW * 0.46 + i * 18, top - 18);
          ctx.lineTo(x - faceW * 0.30 + i * 18, top - 8);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 4: // wavy
        roundedRect(ctx, x - faceW * 0.56, top, faceW * 1.12, faceH * 0.44, 48);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 4;
        for (var j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.moveTo(x - faceW * 0.46 + j * 42, top + 20);
          ctx.quadraticCurveTo(x - faceW * 0.40 + j * 42, top + 52, x - faceW * 0.34 + j * 42, top + 24);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 5: // curly
        roundedRect(ctx, x - faceW * 0.56, top, faceW * 1.12, faceH * 0.46, 52);
        ctx.fill();
        for (var k = 0; k < 14; k++) {
          var px = x - faceW * 0.48 + (k % 7) * 40;
          var py = top + 14 + Math.floor(k / 7) * 42;
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 6: // slick back
        roundedRect(ctx, x - faceW * 0.56, top, faceW * 1.12, faceH * 0.36, 44);
        ctx.fill();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 4;
        for (var m = 0; m < 6; m++) {
          ctx.beginPath();
          ctx.moveTo(left + 20 + m * 28, top + 18);
          ctx.lineTo(left + 50 + m * 28, top + 72);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 7: // medium
        roundedRect(ctx, x - faceW * 0.58, top, faceW * 1.16, faceH * 0.52, 54);
        ctx.fill();
        roundedRect(ctx, x - faceW * 0.64, y - faceH * 0.08, faceW * 0.22, faceH * 0.44, 40);
        ctx.fill();
        roundedRect(ctx, x + faceW * 0.42, y - faceH * 0.08, faceW * 0.22, faceH * 0.44, 40);
        ctx.fill();
        break;
    }
    ctx.stroke();
  }

  function drawAvatar(isPreview) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // background
    ctx.fillStyle = "#0f1018";
    ctx.fillRect(0, 0, w, h);

    var grad = ctx.createRadialGradient(w * 0.5, h * 0.2, 50, w * 0.5, h * 0.2, w * 0.7);
    grad.addColorStop(0, "rgba(125,211,252,0.12)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Name
    ctx.fillStyle = "rgba(231,231,234,0.85)";
    ctx.font = "700 20px -apple-system,system-ui";
    var nm = (state.profile.name || (isPreview ? "Preview" : "Player")).slice(0, 12);
    ctx.fillText(nm, 22, 36);

    var p = state.progress;
    var chest = isPreview ? Math.min(p.chest, 14) : p.chest;
    var shoulders = isPreview ? Math.min(p.shoulders, 14) : p.shoulders;
    var arms = isPreview ? Math.min(p.arms, 14) : p.arms;

    function g(x) { return 1 - Math.exp(-x / 40); }
    var gC = g(chest), gS = g(shoulders), gA = g(arms);

    var cx = w * 0.5;
    var topY = h * 0.18;

    var shoulderWidth = 230 + 240 * gS;
    var torsoWidth = 190 + 160 * gC;
    var torsoDepth = 34 + 44 * gC;
    var armRadius = 28 + 34 * gA;

    var baseSkin = SKIN_BASE[clamp(state.profile.skinTone, 0, SKIN_BASE.length - 1)];
    var under = UNDERTONE[clamp(state.profile.skinUndertone, 0, UNDERTONE.length - 1)].tint;
    var skin = mixColor(baseSkin, under, 0.10);
    var skinShadow = darkenColor(skin, 0.18);

    // head
    var headR = 70;
    var headX = cx, headY = topY + 60;

    var faceShape = state.profile.faceShape;
    var faceW = headR * 2.0;
    var faceH = headR * 2.12;
    var roundness = [0.92, 1.00, 0.78, 0.70][faceShape] || 1.0;

    var neckH = 44;
    var torsoTop = headY + headR + neckH - 6;
    var torsoH = 270;

    // torso
    function drawRoundedTorso(ctx2, cx2, y, width, height, fill, depth, shoulderW, sVal, cVal) {
      var topW = lerp(width * 0.92, width * 1.02, clamp(sVal, 0, 1));
      var botW = width * 0.78;
      var r = 60;
      var shoulderExtra = lerp(0, (shoulderW - width) * 0.32, clamp(sVal, 0, 1));

      var x0 = cx2 - topW / 2 - shoulderExtra * 0.2;
      var x1 = cx2 + topW / 2 + shoulderExtra * 0.2;
      var xb0 = cx2 - botW / 2;
      var xb1 = cx2 + botW / 2;

      ctx2.fillStyle = fill;
      ctx2.beginPath();
      ctx2.moveTo(x0 + r, y);
      ctx2.lineTo(x1 - r, y);
      ctx2.quadraticCurveTo(x1, y, x1, y + r);
      ctx2.lineTo(xb1, y + height - r);
      ctx2.quadraticCurveTo(xb1, y + height, xb1 - r, y + height);
      ctx2.lineTo(xb0 + r, y + height);
      ctx2.quadraticCurveTo(xb0, y + height, xb0, y + height - r);
      ctx2.lineTo(x0, y + r);
      ctx2.quadraticCurveTo(x0, y, x0 + r, y);
      ctx2.closePath();
      ctx2.fill();

      ctx2.globalAlpha = 0.12 + 0.10 * cVal;
      ctx2.fillStyle = "rgba(0,0,0,0.55)";
      ctx2.beginPath();
      ctx2.moveTo(x1 - r, y + r);
      ctx2.lineTo(xb1 - r * 0.2, y + height - r);
      ctx2.lineTo(cx2 + width * 0.10, y + height - r);
      ctx2.lineTo(cx2 + width * 0.18, y + r);
      ctx2.closePath();
      ctx2.fill();
      ctx2.globalAlpha = 1;
    }

    function drawArms(ctx2, cx2, y, shoulderW, armR, skin2, shadow2, aVal) {
      var leftX = cx2 - shoulderW / 2 + armR * 0.6;
      var rightX = cx2 + shoulderW / 2 - armR * 0.6;

      var upperH = 190;
      var foreH = 170;
      var foreR = armR * (0.82 + 0.28 * aVal);

      ctx2.fillStyle = shadow2;
      capsule(ctx2, leftX + 10, y + 16, armR * 1.06, upperH);
      capsule(ctx2, rightX + 10, y + 16, armR * 1.06, upperH);
      capsule(ctx2, leftX + 10, y + upperH - 10, foreR * 1.02, foreH);
      capsule(ctx2, rightX + 10, y + upperH - 10, foreR * 1.02, foreH);

      ctx2.fillStyle = skin2;
      capsule(ctx2, leftX, y, armR, upperH);
      capsule(ctx2, rightX, y, armR, upperH);
      capsule(ctx2, leftX, y + upperH - 18, foreR, foreH);
      capsule(ctx2, rightX, y + upperH - 18, foreR, foreH);
    }

    drawRoundedTorso(ctx, cx, torsoTop + 8, torsoWidth * 1.02, torsoH, skinShadow, torsoDepth, shoulderWidth, gS, gC);
    drawRoundedTorso(ctx, cx, torsoTop, torsoWidth, torsoH, skin, torsoDepth, shoulderWidth, gS, gC);
    drawArms(ctx, cx, torsoTop + 74, shoulderWidth, armRadius, skin, skinShadow, gA);

    // face
    ctx.fillStyle = skin;
    roundedRect(ctx, headX - faceW / 2, headY - faceH / 2, faceW, faceH, 40 * roundness);
    ctx.fill();

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = skinShadow;
    roundedRect(ctx, headX - faceW / 2 + 10, headY - faceH / 2 + 16, faceW - 20, faceH - 20, 36 * roundness);
    ctx.fill();
    ctx.globalAlpha = 1;

    drawHair(ctx, headX, headY - 40, faceW, faceH, state.profile.hairStyle, HAIR_COLORS[state.profile.hairColor]);
    drawFaceFeatures(ctx, headX, headY, faceW, faceH);

    // ground
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.90, 260, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
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

  // ---------- Reset / Export (single declaration; guarded) ----------
  var resetStep = 0;

  var btnReset = $("#btnReset");
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      if (resetStep === 0) {
        resetStep = 1;
        toast("Tap Reset again to confirm.");
        setTimeout(function () { resetStep = 0; }, 3000);
        return;
      }
      var ok = confirm("This will delete EVERYTHING (including locked avatar). Proceed?");
      if (!ok) { resetStep = 0; return; }
      localStorage.removeItem(KEY);
      state = defaultState();
      resetStep = 0;
      toast("Reset complete.");
      boot();
    });
  }

  var btnExport = $("#btnExport");
  if (btnExport) {
    btnExport.addEventListener("click", function () {
      try {
        var data = JSON.stringify(state, null, 2);
        // Clipboard API can fail on iOS; fallback to prompt
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
