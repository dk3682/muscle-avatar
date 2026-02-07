  alert("SCRIPT START");
(() => {
window.addEventListener("error", function (e) {
  alert("JS Error: " + (e && e.message ? e.message : String(e)));
});

window.addEventListener("unhandledrejection", function (e) {
  var r = e && e.reason;
  var msg = (r && r.message) ? r.message : String(r);
  alert("Promise Error: " + msg);
});
  // ---------- Utilities ----------
  const $ = (sel) => document.querySelector(sel);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const nowDateKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  };
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(()=>t.classList.remove("show"), 1400);
  };

  // ---------- Storage ----------
  const KEY = "muscle_avatar_save_v1";
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    } catch(e){ return null; }
  };
  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(state));
  };

  // ---------- Default State ----------
  const defaultState = () => ({
    profileLocked: false,
    createdAt: null,
    profile: {
      name: "",
      skinTone: 3,      // index
      skinUndertone: 1, // 0 cool,1 neutral,2 warm
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
  });

  // ---------- Options ----------
  const SKIN_BASE = [
    "#f7e6d6","#f0d6bf","#e7c3a5","#d8ab88","#c79068","#a8734f","#7c5337","#553526"
  ];
  const UNDERTONE = [
    {name:"Cool", tint:"#a8b9ff"},
    {name:"Neutral", tint:"#ffffff"},
    {name:"Warm", tint:"#ffd19a"}
  ];
  const HAIR_COLORS = ["#111318","#2a1c12","#4a2a16","#7a4a2a","#c7b18a","#c7c7c7"];
  const HAIR_STYLES = [
    "Buzz", "Short", "Side Part", "Messy", "Wavy", "Curly", "Slick Back", "Medium"
  ];
  const FACE_SHAPES = ["Round","Oval","Square","V-shape"];
  const EYES = ["Calm","Sharp","Wide","Tired"];
  const BROWS = ["Soft","Straight","Angled","Thick"];
  const MOUTHS = ["Neutral","Smile","Grin","Serious"];
  const BEARDS = ["None","Stubble","Goatee","Full"];

  // ---------- State ----------
  let state = load() || defaultState();

  // Daily reset
  const ensureDaily = () => {
    const today = nowDateKey();
    const p = state.progress;
    if (p.lastDay === null) {
      p.lastDay = today;
      p.setsLeft = 3;
      p.streak = 1;
      save();
      return;
    }
    if (p.lastDay !== today) {
      // new day
      const yesterday = p.lastDay;
      p.lastDay = today;
      p.setsLeft = 3;
      p.fatigue = Math.max(0, Math.floor(p.fatigue * 0.55)); // recover some overnight
      p.streak = (p.setsLeft === 3) ? p.streak : p.streak; // placeholder, keep streak simple
      p.streak = p.streak + 1;
      save();
      toast(`New day: sets refreshed (3).`);
    }
  };

  // ---------- Rendering / Screens ----------
  const root = $("#root");
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 620;

  // Current run data (per set)
  let run = null;

  const viewProfile = () => {
    root.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "grid two";

    const left = document.createElement("div");
    left.className = "card";

    const right = document.createElement("div");
    right.className = "card";

    // Left: editor controls
    left.innerHTML = `
      <div class="row">
        <div>
          <div class="big">Create your avatar</div>
          <div class="muted">Name + look (only once). After you confirm, it’s locked.</div>
        </div>
        <span class="phaseTag warn">PROFILE SETUP</span>
      </div>

      <div class="divider"></div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <div>
          <div class="muted" style="font-weight:800; font-size:12px; margin-bottom:6px;">NAME (1–12 chars)</div>
          <input id="nameInput" class="input" maxlength="12" placeholder="e.g., Daichi" value="${escapeHtml(state.profile.name)}">
        </div>

        <div class="row">
          <span class="pill">Face</span>
          <span class="pill">Hair</span>
          <span class="pill">Tone</span>
        </div>

        ${selector("Face shape", "faceShape", FACE_SHAPES, state.profile.faceShape)}
        ${selector("Eyes", "eyes", EYES, state.profile.eyes)}
        ${selector("Brows", "brows", BROWS, state.profile.brows)}
        ${selector("Mouth", "mouth", MOUTHS, state.profile.mouth)}
        ${selector("Beard", "beard", BEARDS, state.profile.beard)}

        ${selector("Hair style", "hairStyle", HAIR_STYLES, state.profile.hairStyle)}
        ${selector("Hair color", "hairColor", HAIR_COLORS.map((c,i)=>`Color ${i+1}`), state.profile.hairColor, true)}

        <div class="divider"></div>

        <div class="row">
          <div>
            <div style="font-weight:900;">Skin</div>
            <div class="hint">Choose tone + undertone. This affects shading too.</div>
          </div>
        </div>

        ${selector("Skin tone", "skinTone", SKIN_BASE.map((c,i)=>`Tone ${i+1}`), state.profile.skinTone, true)}
        ${selector("Undertone", "skinUndertone", UNDERTONE.map(u=>u.name), state.profile.skinUndertone)}

        <div class="footerRow" style="margin-top:8px;">
          <button id="btnConfirmProfile" class="btn primary">Confirm & Lock</button>
        </div>

        <div class="hint">
          Tip: The game is about watching your body change. After locking, you’ll grow via Chest/Shoulders/Arms.
        </div>
      </div>
    `;

    // Right: preview
    right.innerHTML = `
      <div class="row">
        <div>
          <div style="font-weight:900;">Preview</div>
          <div class="muted">Your body will change as you train.</div>
        </div>
        <span class="pill">Live</span>
      </div>
      <div style="margin-top:10px;"></div>
    `;
    right.appendChild(canvas);

    wrap.appendChild(left);
    wrap.appendChild(right);
    root.appendChild(wrap);

    // Bind events
    $("#nameInput").addEventListener("input", (e) => {
      state.profile.name = e.target.value.trim();
      save();
      drawAvatarPreview();
    });

    bindSelector("faceShape");
    bindSelector("eyes");
    bindSelector("brows");
    bindSelector("mouth");
    bindSelector("beard");
    bindSelector("hairStyle");
    bindSelector("hairColor");
    bindSelector("skinTone");
    bindSelector("skinUndertone");

    $("#btnConfirmProfile").addEventListener("click", () => {
      const name = (state.profile.name || "").trim();
      if (!name || name.length < 1) {
        toast("Please enter a name.");
        return;
      }
      const ok = confirm("Lock this avatar? You won't be able to change name or appearance later.");
      if (!ok) return;
      state.profileLocked = true;
      state.createdAt = new Date().toISOString();
      // Initialize daily keys if needed
      if (!state.progress.lastDay) state.progress.lastDay = nowDateKey();
      save();
      toast("Profile locked.");
      ensureDaily();
      viewGame();
    });

    drawAvatarPreview();
  };

  function selector(label, key, list, index, isColor=false){
    return `
      <div class="selector">
        <button class="btn" data-key="${key}" data-dir="-1">◀</button>
        <div class="label">
          <div class="muted" style="font-size:12px;">${escapeHtml(label)}</div>
          <div style="font-weight:900; font-size:14px;">
            ${isColor && key==="hairColor" ? `<span style="display:inline-flex; align-items:center; gap:8px;">
              <span style="width:14px; height:14px; border-radius:50%; background:${HAIR_COLORS[index]}; border:1px solid rgba(255,255,255,0.2)"></span>
              ${escapeHtml(list[index])}
            </span>` : isColor && key==="skinTone" ? `<span style="display:inline-flex; align-items:center; gap:8px;">
              <span style="width:14px; height:14px; border-radius:50%; background:${SKIN_BASE[index]}; border:1px solid rgba(255,255,255,0.2)"></span>
              ${escapeHtml(list[index])}
            </span>` : escapeHtml(list[index])}
          </div>
        </div>
        <button class="btn" data-key="${key}" data-dir="1">▶</button>
      </div>
    `;
  }

  function bindSelector(key){
    root.querySelectorAll(`button[data-key="${key}"]`).forEach(btn => {
      btn.addEventListener("click", () => {
        const dir = parseInt(btn.dataset.dir,10);
        const max = getOptionLength(key);
        state.profile[key] = (state.profile[key] + dir + max) % max;
        save();
        viewProfile(); // rerender to update labels cleanly
      });
    });
  }

  function getOptionLength(key){
    switch(key){
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

  const viewGame = () => {
    ensureDaily();
    root.innerHTML = "";

    const p = state.progress;

    const header = document.createElement("div");
    header.className = "card";
    header.innerHTML = `
      <div class="row">
        <div>
          <div class="big">${escapeHtml(state.profile.name)}</div>
          <div class="muted">Level ${p.level} · Streak ${p.streak} days · Total sets ${p.totalSets}</div>
        </div>
        <div class="row" style="gap:8px;">
          <span class="pill">Sets left: <b>${p.setsLeft}</b>/3</span>
          <span class="pill">Fatigue: <b>${p.fatigue}</b></span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="statgrid">
        <div class="stat"><div class="k">Chest</div><div class="v">${p.chest.toFixed(1)}</div></div>
        <div class="stat"><div class="k">Shoulders</div><div class="v">${p.shoulders.toFixed(1)}</div></div>
        <div class="stat"><div class="k">Arms</div><div class="v">${p.arms.toFixed(1)}</div></div>
      </div>
    `;

    const main = document.createElement("div");
    main.className = "grid two";

    const left = document.createElement("div");
    left.className = "card";
    left.innerHTML = `
      <div class="row">
        <div>
          <div style="font-weight:900;">Avatar</div>
          <div class="muted">Your physique reflects your training distribution.</div>
        </div>
        <span class="phaseTag good">GROWTH</span>
      </div>
      <div style="margin-top:10px;"></div>
    `;
    left.appendChild(canvas);

    const right = document.createElement("div");
    right.className = "card";
    right.innerHTML = `
      <div class="row">
        <div>
          <div style="font-weight:900;">Bench Press (Chest target)</div>
          <div class="muted">Form tweak × Rep timing → where the gains go.</div>
        </div>
        <span class="pill">1 set ≈ 30–45s</span>
      </div>

      <div class="divider"></div>

      <div id="stage"></div>

      <div class="footerRow" style="margin-top:12px;">
        <button id="btnStart" class="btn primary">Start Set</button>
      </div>

      <div class="hint">
        If your form is weird, gains leak:
        <b>Too close</b> → Arms · <b>Too wide</b> → Shoulders.
      </div>
    `;

    main.appendChild(left);
    main.appendChild(right);

    root.appendChild(header);
    root.appendChild(main);

    $("#btnStart").addEventListener("click", startSet);

    drawAvatar();
    renderStageIdle();
  };

  // ---------- Game Stage ----------
  function renderStageIdle(){
    const stage = $("#stage");
    const p = state.progress;
    stage.innerHTML = `
      <div class="row">
        <span class="phaseTag">READY</span>
        <span class="muted">Sets left today: <b>${p.setsLeft}</b></span>
      </div>
      <div class="divider"></div>
      <div class="hint">
        You’ll first adjust form for 3 seconds, then do 10 reps timing.
      </div>
    `;
    $("#btnStart").disabled = (p.setsLeft <= 0);
    if (p.setsLeft <= 0) {
      $("#btnStart").textContent = "No sets left today";
    } else {
      $("#btnStart").textContent = "Start Set";
    }
  }

  function startSet(){
    const p = state.progress;
    if (p.setsLeft <= 0) { toast("No sets left today."); return; }
    run = {
      phase: "form",
      form: 60,          // slider 0-100
      formTimeLeft: 3.0, // seconds
      repsTotal: 10,
      repIndex: 0,
      hits: 0,
      repAcc: 0,
      formAcc: 0,
      leakTarget: null,  // "arms" or "shoulders"
      lastTick: performance.now(),
      barX: 0.15,       // 0..1
      barV: 0.9,        // speed
      zoneA: 0.46,
      zoneB: 0.58,
      animPop: 0
    };
    renderFormPhase();
    requestAnimationFrame(loop);
    toast("Form phase: adjust!");
  }

  function renderFormPhase(){
    const stage = $("#stage");
    stage.innerHTML = `
      <div class="row">
        <span class="phaseTag warn">FORM (3s)</span>
        <span class="pill">Target: <b>55–70</b></span>
      </div>
      <div class="divider"></div>
      <div class="hint">Slide to set elbow flare. Try to stay in the target range.</div>
      <div style="margin:10px 0;">
        <input id="formSlider" class="slider" type="range" min="0" max="100" value="${run.form}">
      </div>
      <div class="row">
        <span class="pill">Your form: <b id="formVal">${run.form}</b></span>
        <span class="pill">Time: <b id="formTime">${run.formTimeLeft.toFixed(1)}s</b></span>
      </div>
    `;
    $("#formSlider").addEventListener("input", (e) => {
      run.form = parseInt(e.target.value,10);
      $("#formVal").textContent = run.form;
    });
    $("#btnStart").disabled = true;
    $("#btnStart").textContent = "In set...";
  }

  function renderRepPhase(){
    const stage = $("#stage");
    stage.innerHTML = `
      <div class="row">
        <span class="phaseTag good">REPS (10)</span>
        <span class="pill">Hit the green zone</span>
      </div>
      <div class="divider"></div>
      <div class="hint">Tap when the marker is in the zone. You can tap anywhere on the right card.</div>
      <div style="margin-top:10px;">
        <canvas id="repCanvas" width="900" height="180" style="width:100%; height:auto; border-radius:14px;"></canvas>
      </div>
      <div class="row" style="margin-top:10px;">
        <span class="pill">Rep: <b id="repIdx">${run.repIndex+1}</b>/${run.repsTotal}</span>
        <span class="pill">Hits: <b id="hits">${run.hits}</b></span>
      </div>
      <div class="footerRow" style="margin-top:10px;">
        <button id="tapBtn" class="btn primary">TAP</button>
      </div>
    `;
    const tap = () => handleTap();
    $("#tapBtn").addEventListener("click", tap);
    // tapping the card area should work too
    stage.addEventListener("click", (e) => {
      if (e.target && e.target.id === "tapBtn") return;
      handleTap();
    });
  }

  function renderResult(result){
    const stage = $("#stage");
    stage.innerHTML = `
      <div class="row">
        <span class="phaseTag">RESULT</span>
        <span class="pill">FormAcc <b>${(result.formAcc*100).toFixed(0)}%</b> · RepAcc <b>${(result.repAcc*100).toFixed(0)}%</b></span>
      </div>
      <div class="divider"></div>
      <div class="row" style="gap:10px;">
        <span class="pill">Chest <b>+${result.gains.chest.toFixed(2)}</b></span>
        <span class="pill">Shoulders <b>+${result.gains.shoulders.toFixed(2)}</b></span>
        <span class="pill">Arms <b>+${result.gains.arms.toFixed(2)}</b></span>
      </div>
      <div class="divider"></div>
      <div class="hint">
        ${escapeHtml(result.note)}
      </div>
      <div class="footerRow" style="margin-top:12px;">
        <button id="btnDone" class="btn primary">Done</button>
      </div>
    `;
    $("#btnDone").addEventListener("click", () => {
      run = null;
      $("#btnStart").disabled = false;
      viewGame();
      toast("Saved.");
    });
  }

  // ---------- Loop & Mechanics ----------
  function loop(t){
    if (!run) return;
    const dt = (t - run.lastTick) / 1000;
    run.lastTick = t;

    if (run.phase === "form") {
      run.formTimeLeft -= dt;
      if ($("#formTime")) $("#formTime").textContent = `${Math.max(0, run.formTimeLeft).toFixed(1)}s`;

      // Update preview while sliding (nice feel)
      drawAvatar(true);

      if (run.formTimeLeft <= 0) {
        // compute formAcc (target range 55-70)
        const v = run.form;
        const targetA=55, targetB=70;
        let acc;
        if (v >= targetA && v <= targetB) {
          // closer to center is best
          const center = (targetA+targetB)/2;
          const dist = Math.abs(v-center) / ((targetB-targetA)/2);
          acc = 1.0 - 0.10*dist; // 0.9..1
        } else {
          const dist = (v < targetA) ? (targetA - v) : (v - targetB);
          acc = clamp(0.85 - (dist/40), 0.15, 0.85);
        }
        run.formAcc = clamp(acc, 0, 1);
        run.leakTarget = (v < 45) ? "arms" : (v > 75) ? "shoulders" : null;

        run.phase = "reps";
        run.repIndex = 0;
        run.hits = 0;
        run.barX = 0.08;
        run.barV = 1.15 + (Math.random()*0.15);
        run.zoneA = 0.46;
        run.zoneB = 0.58;
        renderRepPhase();
      }
    } else if (run.phase === "reps") {
      // move marker back and forth
      run.barX += run.barV * dt;
      if (run.barX > 1.0) { run.barX = 1.0; run.barV *= -1; }
      if (run.barX < 0.0) { run.barX = 0.0; run.barV *= -1; }

      drawRepBar();
    } else if (run.phase === "result") {
      // simple pop anim decay
      run.animPop = Math.max(0, run.animPop - dt*2.4);
      drawAvatar();
    }

    requestAnimationFrame(loop);
  }

  function handleTap(){
    if (!run || run.phase !== "reps") return;

    const inZone = (run.barX >= run.zoneA && run.barX <= run.zoneB);
    if (inZone) {
      run.hits++;
      toast("Good rep!");
    } else {
      toast("Miss!");
    }

    run.repIndex++;
    $("#repIdx").textContent = String(Math.min(run.repIndex+1, run.repsTotal));
    $("#hits").textContent = String(run.hits);

    // tiny random zone drift to keep it lively
    const drift = (Math.random()*0.04 - 0.02);
    run.zoneA = clamp(run.zoneA + drift, 0.20, 0.70);
    run.zoneB = clamp(run.zoneA + 0.12, run.zoneA + 0.08, 0.92);

    if (run.repIndex >= run.repsTotal) {
      // finish
      run.repAcc = clamp(run.hits / run.repsTotal, 0, 1);
      const result = applyGains(run.formAcc, run.repAcc, run.form);
      run.phase = "result";
      run.animPop = 1;
      drawAvatar();
      renderResult(result);
      $("#btnStart").disabled = false;
    }
  }

  function applyGains(formAcc, repAcc, formVal){
    const p = state.progress;

    // base gain scales with level slightly; fatigue reduces efficiency
    const fatigueFactor = clamp(1.0 - (p.fatigue/120), 0.55, 1.0);
    const levelFactor = 1.0 + (p.level-1)*0.04;
    const base = 1.25 * levelFactor * fatigueFactor;

    // Target chest gain
    const target = base * (0.40 + 0.60*repAcc) * (0.40 + 0.60*formAcc);

    // Leak gain (bigger when form and reps are messy)
    const leakAmt = base * (1 - formAcc) * (0.50 + 0.50*(1 - repAcc));

    // Distribute leak
    let gainChest = target;
    let gainShoulders = 0, gainArms = 0;

    if (formVal < 45) {
      gainArms += leakAmt;
    } else if (formVal > 75) {
      gainShoulders += leakAmt;
    } else {
      // small general leak if near-ish but not perfect
      gainShoulders += leakAmt * 0.55;
      gainArms += leakAmt * 0.45;
    }

    // Fatigue update: success reduces fatigue cost
    const fatigueUp = Math.round(10 + (1-repAcc)*10 + (1-formAcc)*8);
    p.fatigue = clamp(p.fatigue + fatigueUp, 0, 140);

    // XP and level
    const xpGain = Math.round(14 + 18*repAcc + 16*formAcc);
    p.xp += xpGain;
    while (p.xp >= xpToNext(p.level)) {
      p.xp -= xpToNext(p.level);
      p.level++;
      toast(`Level up! ${p.level}`);
    }

    // Apply muscle gains
    p.chest += gainChest;
    p.shoulders += gainShoulders;
    p.arms += gainArms;

    // Consume set
    p.setsLeft = Math.max(0, p.setsLeft - 1);
    p.totalSets += 1;

    save();

    // Note
    let note = "";
    if (formVal < 45) note = "Form was too close — gains leaked into Arms.";
    else if (formVal > 75) note = "Form was too wide — gains leaked into Shoulders.";
    else note = "Solid form range — most gains stayed on target.";

    // Big: show visible change quickly
    run && (run.animPop = 1);

    return {
      formAcc, repAcc,
      gains: { chest: gainChest, shoulders: gainShoulders, arms: gainArms },
      note
    };
  }

  function xpToNext(level){
    return 60 + (level-1)*22;
  }

  // ---------- Drawing ----------
  function drawAvatarPreview(){
    // use small muscle defaults for preview, but show slight response
    drawAvatar(true);
  }

  function drawAvatar(isPreview=false){
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    // background vignette
    ctx.fillStyle = "#0f1018";
    ctx.fillRect(0,0,w,h);
    const grad = ctx.createRadialGradient(w*0.5,h*0.2,50,w*0.5,h*0.2,w*0.7);
    grad.addColorStop(0,"rgba(125,211,252,0.12)");
    grad.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    // Name
    ctx.fillStyle = "rgba(231,231,234,0.85)";
    ctx.font = "700 20px -apple-system,system-ui";
    const nm = (state.profile.name || "Preview").slice(0,12);
    ctx.fillText(nm, 22, 36);

    // Muscle values -> shape
    const p = state.progress;
    const chest = isPreview ? Math.min(p.chest, 14) : p.chest;
    const shoulders = isPreview ? Math.min(p.shoulders, 14) : p.shoulders;
    const arms = isPreview ? Math.min(p.arms, 14) : p.arms;

    // Normalize growth (fast early, slower later)
    const g = (x) => 1 - Math.exp(-x/40); // 0..~1
    const gC = g(chest), gS = g(shoulders), gA = g(arms);

    // Base proportions
    const cx = w*0.5;
    const topY = h*0.18;

    const shoulderWidth = 230 + 240*gS;    // main visual: shoulders
    const torsoWidth = 190 + 160*gC;       // chest width
    const torsoDepth = 34 + 44*gC;         // chest thickness (shading)
    const armRadius = 28 + 34*gA;          // arms
    const neckW = 60 + 28*clamp(gS*0.8 + gC*0.2, 0, 1);

    // Colors (skin tone with undertone)
    const baseSkin = SKIN_BASE[clamp(state.profile.skinTone,0,SKIN_BASE.length-1)];
    const under = UNDERTONE[clamp(state.profile.skinUndertone,0,UNDERTONE.length-1)].tint;

    const skin = mixColor(baseSkin, under, 0.10);
    const skinShadow = darkenColor(skin, 0.18);
    const skinDeep = darkenColor(skin, 0.30);

    // Head
    const headR = 70;
    const headX = cx, headY = topY + 60;

    // Face shape tweak
    const faceShape = state.profile.faceShape;
    const faceW = headR*2.0;
    const faceH = headR*2.12;
    const roundness = [0.92, 1.00, 0.78, 0.70][faceShape] || 1.0;

    // Neck
    const neckH = 44;

    // Torso
    const torsoTop = headY + headR + neckH - 6;
    const torsoH = 270;

    // Pop animation on result
    const pop = run ? (run.animPop || 0) : 0;
    const popScale = 1 + pop*0.03;
    ctx.save();
    ctx.translate(cx, h*0.52);
    ctx.scale(popScale, popScale);
    ctx.translate(-cx, -h*0.52);

    // Torso shadow (depth)
    drawRoundedTorso(ctx, cx, torsoTop+8, torsoWidth*1.02, torsoH, skinShadow, torsoDepth, shoulderWidth, gS, gC);

    // Torso main
    drawRoundedTorso(ctx, cx, torsoTop, torsoWidth, torsoH, skin, torsoDepth, shoulderWidth, gS, gC);

    // Shoulders / delts bulge overlay (more definition at higher S)
    if (gS > 0.35) {
      ctx.globalAlpha = clamp((gS-0.35)/0.65, 0, 1) * 0.55;
      ctx.fillStyle = skinDeep;
      // subtle delt lines
      drawDeltLines(ctx, cx, torsoTop+42, shoulderWidth, 1);
      ctx.globalAlpha = 1;
    }

    // Chest line overlay (more definition at higher C)
    if (gC > 0.40) {
      ctx.globalAlpha = clamp((gC-0.40)/0.60, 0, 1) * 0.55;
      ctx.strokeStyle = skinDeep;
      ctx.lineWidth = 5;
      ctx.beginPath();
      const y = torsoTop + 92;
      ctx.moveTo(cx - torsoWidth*0.42, y);
      ctx.quadraticCurveTo(cx, y + 22, cx + torsoWidth*0.42, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Arms
    drawArms(ctx, cx, torsoTop+74, shoulderWidth, armRadius, skin, skinShadow, gA);

    ctx.restore();

    // Head (after scaling so it stays stable)
    // Face
    ctx.save();
    // Face base
    ctx.fillStyle = skin;
    roundedRect(ctx, headX - faceW/2, headY - faceH/2, faceW, faceH, 40*roundness);
    ctx.fill();
    // Face shadow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = skinShadow;
    roundedRect(ctx, headX - faceW/2 + 10, headY - faceH/2 + 16, faceW-20, faceH-20, 36*roundness);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Hair
    drawHair(ctx, headX, headY - 40, faceW, faceH, state.profile.hairStyle, HAIR_COLORS[state.profile.hairColor]);

    // Eyes / brows / mouth
    drawFaceFeatures(ctx, headX, headY, faceW, faceH);

    ctx.restore();

    // Simple ground
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(cx, h*0.90, 260, 34, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawRoundedTorso(ctx, cx, y, width, height, fill, depth, shoulderWidth, gS, gC){
    // Torso is a rounded trapezoid-ish shape
    const topW = lerp(width*0.92, width*1.02, clamp(gS,0,1));
    const botW = width*0.78;
    const r = 60;

    // shoulder cap influences top
    const shoulderExtra = lerp(0, (shoulderWidth - width)*0.32, clamp(gS,0,1));

    const x0 = cx - topW/2 - shoulderExtra*0.2;
    const x1 = cx + topW/2 + shoulderExtra*0.2;
    const xb0 = cx - botW/2;
    const xb1 = cx + botW/2;

    ctx.fillStyle = fill;
    ctx.beginPath();
    // top
    ctx.moveTo(x0 + r, y);
    ctx.lineTo(x1 - r, y);
    ctx.quadraticCurveTo(x1, y, x1, y + r);
    // right down
    ctx.lineTo(xb1, y + height - r);
    ctx.quadraticCurveTo(xb1, y + height, xb1 - r, y + height);
    // bottom
    ctx.lineTo(xb0 + r, y + height);
    ctx.quadraticCurveTo(xb0, y + height, xb0, y + height - r);
    // left up
    ctx.lineTo(x0, y + r);
    ctx.quadraticCurveTo(x0, y, x0 + r, y);
    ctx.closePath();
    ctx.fill();

    // Depth hint (a subtle side shade)
    ctx.globalAlpha = 0.12 + 0.10*gC;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(x1 - r, y + r);
    ctx.lineTo(xb1 - r*0.2, y + height - r);
    ctx.lineTo(cx + width*0.10, y + height - r);
    ctx.lineTo(cx + width*0.18, y + r);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawArms(ctx, cx, y, shoulderWidth, armR, skin, shadow, gA){
    const leftX = cx - shoulderWidth/2 + armR*0.6;
    const rightX = cx + shoulderWidth/2 - armR*0.6;

    // Upper arms (rounded capsules)
    const upperH = 190;
    const foreH = 170;
    const foreR = armR * (0.82 + 0.28*gA);

    // Shadows first
    ctx.fillStyle = shadow;
    capsule(ctx, leftX+10, y+16, armR*1.06, upperH, 999);
    capsule(ctx, rightX+10, y+16, armR*1.06, upperH, 999);
    capsule(ctx, leftX+10, y+upperH-10, foreR*1.02, foreH, 999);
    capsule(ctx, rightX+10, y+upperH-10, foreR*1.02, foreH, 999);

    // Main
    ctx.fillStyle = skin;
    capsule(ctx, leftX, y, armR, upperH, 999);
    capsule(ctx, rightX, y, armR, upperH, 999);
    capsule(ctx, leftX, y+upperH-18, foreR, foreH, 999);
    capsule(ctx, rightX, y+upperH-18, foreR, foreH, 999);

    // Biceps definition at higher arms
    if (gA > 0.45) {
      ctx.globalAlpha = clamp((gA-0.45)/0.55, 0, 1) * 0.45;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(leftX - armR*0.2, y+72);
      ctx.quadraticCurveTo(leftX - armR*0.4, y+116, leftX + armR*0.1, y+142);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightX + armR*0.2, y+72);
      ctx.quadraticCurveTo(rightX + armR*0.4, y+116, rightX - armR*0.1, y+142);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawDeltLines(ctx, cx, y, shoulderWidth){
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 5;
    // left delt
    ctx.beginPath();
    ctx.arc(cx - shoulderWidth*0.34, y, 38, Math.PI*0.1, Math.PI*1.18);
    ctx.stroke();
    // right delt
    ctx.beginPath();
    ctx.arc(cx + shoulderWidth*0.34, y, 38, Math.PI*1.82, Math.PI*0.9, true);
    ctx.stroke();
  }

  function drawHair(ctx, x, y, faceW, faceH, styleIndex, color){
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 3;

  const top = y - faceH*0.22;
  const left = x - faceW*0.55;
  const right = x + faceW*0.55;

  ctx.beginPath();
  switch(styleIndex){
    case 0: { // buzz
      ctx.globalAlpha = 0.85;
      ctx.ellipse(x, y-faceH*0.18, faceW*0.46, faceH*0.22, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 1: { // short
      roundedRect(ctx, x-faceW*0.54, top, faceW*1.08, faceH*0.38, 42);
      ctx.fill();
      break;
    }
    case 2: { // side part
      roundedRect(ctx, x-faceW*0.56, top, faceW*1.12, faceH*0.40, 46);
      ctx.fill();
      ctx.clearRect(x+faceW*0.06, top+18, faceW*0.08, faceH*0.32);
      break;
    }
    case 3: { // messy
      roundedRect(ctx, x-faceW*0.56, top, faceW*1.12, faceH*0.38, 44);
      ctx.fill();
      for(let i=0;i<7;i++){
        ctx.beginPath();
        ctx.moveTo(x-faceW*0.40+i*18, top+10);
        ctx.lineTo(x-faceW*0.46+i*18, top-18);
        ctx.lineTo(x-faceW*0.30+i*18, top-8);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 4: { // wavy
      roundedRect(ctx, x-faceW*0.56, top, faceW*1.12, faceH*0.44, 48);
      ctx.fill();
      ctx.globalAlpha=0.25;
      ctx.strokeStyle="rgba(255,255,255,0.25)";
      ctx.lineWidth=4;
      for(let i=0;i<5;i++){
        ctx.beginPath();
        ctx.moveTo(x-faceW*0.46+i*42, top+20);
        ctx.quadraticCurveTo(x-faceW*0.40+i*42, top+52, x-faceW*0.34+i*42, top+24);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      break;
    }
    case 5: { // curly
      roundedRect(ctx, x-faceW*0.56, top, faceW*1.12, faceH*0.46, 52);
      ctx.fill();
      for(let i=0;i<14;i++){
        const px = x-faceW*0.48 + (i%7)*40;
        const py = top+14 + Math.floor(i/7)*42;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI*2);
        ctx.fill();
      }
      break;
    }
    case 6: { // slick back
      roundedRect(ctx, x-faceW*0.56, top, faceW*1.12, faceH*0.36, 44);
      ctx.fill();
      ctx.globalAlpha=0.22;
      ctx.strokeStyle="rgba(255,255,255,0.35)";
      ctx.lineWidth=4;
      for(let i=0;i<6;i++){
        ctx.beginPath();
        ctx.moveTo(left+20+i*28, top+18);
        ctx.lineTo(left+50+i*28, top+72);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      break;
    }
    case 7: { // medium
      roundedRect(ctx, x-faceW*0.58, top, faceW*1.16, faceH*0.52, 54);
      ctx.fill();
      // sides
      roundedRect(ctx, x-faceW*0.64, y-faceH*0.08, faceW*0.22, faceH*0.44, 40);
      ctx.fill();
      roundedRect(ctx, x+faceW*0.42, y-faceH*0.08, faceW*0.22, faceH*0.44, 40);
      ctx.fill();
      break;
    }
  }
  ctx.stroke();
}

  function drawFaceFeatures(ctx, x, y, faceW, faceH){
    // Brows
    const brow = state.profile.brows;
    const eye = state.profile.eyes;
    const mouth = state.profile.mouth;
    const beard = state.profile.beard;
    const hairC = HAIR_COLORS[state.profile.hairColor];

    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    const browY = y - faceH*0.10;
    const eyeY = y - faceH*0.02;

    // brows
    for (const s of [-1,1]) {
      ctx.beginPath();
      const bx = x + s*faceW*0.18;
      if (brow===0) ctx.quadraticCurveTo(bx - s*30, browY-6, bx + s*30, browY);
      if (brow===1) { ctx.moveTo(bx - s*30, browY); ctx.lineTo(bx + s*30, browY); }
      if (brow===2) ctx.quadraticCurveTo(bx - s*30, browY+6, bx + s*30, browY-8);
      if (brow===3) { ctx.lineWidth=8; ctx.moveTo(bx - s*32, browY); ctx.lineTo(bx + s*32, browY); ctx.lineWidth=6; }
      ctx.stroke();
    }

    // eyes
    ctx.lineWidth = 5;
    for (const s of [-1,1]) {
      const ex = x + s*faceW*0.18;
      ctx.beginPath();
      if (eye===0) ctx.ellipse(ex, eyeY, 18, 10, 0, 0, Math.PI*2);
      if (eye===1) ctx.ellipse(ex, eyeY, 20, 8, 0.25*s, 0, Math.PI*2);
      if (eye===2) ctx.ellipse(ex, eyeY, 22, 12, 0, 0, Math.PI*2);
      if (eye===3) ctx.ellipse(ex, eyeY+2, 18, 7, 0, 0, Math.PI*2);
      ctx.stroke();
      // pupil dot
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      ctx.arc(ex + (eye===1? s*4:0), eyeY + (eye===3?2:0), 4.5, 0, Math.PI*2);
      ctx.fill();
    }

    // mouth
    const my = y + faceH*0.18;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (mouth===0) { ctx.moveTo(x-faceW*0.12, my); ctx.lineTo(x+faceW*0.12, my); }
    if (mouth===1) ctx.quadraticCurveTo(x, my+14, x+faceW*0.12, my);
    if (mouth===2) ctx.quadraticCurveTo(x, my+18, x+faceW*0.14, my-2);
    if (mouth===3) ctx.quadraticCurveTo(x, my-10, x+faceW*0.12, my);
    ctx.stroke();

    // beard
    if (beard !== 0) {
      ctx.fillStyle = mixColor(hairC, "#000000", 0.15);
      ctx.globalAlpha = 0.35;
      if (beard===1) { // stubble
        roundedRect(ctx, x-faceW*0.32, y+faceH*0.06, faceW*0.64, faceH*0.40, 60);
        ctx.fill();
      } else if (beard===2) { // goatee
        roundedRect(ctx, x-faceW*0.10, y+faceH*0.20, faceW*0.20, faceH*0.22, 40);
        ctx.fill();
      } else if (beard===3) { // full
        roundedRect(ctx, x-faceW*0.36, y+faceH*0.04, faceW*0.72, faceH*0.48, 70);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawRepBar(){
    const c = $("#repCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    const w=c.width, h=c.height;
    ctx.clearRect(0,0,w,h);

    // background
    ctx.fillStyle="#0f1018";
    ctx.fillRect(0,0,w,h);

    // bar
    const bx = w*0.08, by=h*0.48, bw=w*0.84, bh=26;
    ctx.fillStyle="#22243a";
    roundedRect(ctx, bx, by, bw, bh, 999);
    ctx.fill();

    // zone
    const zx = bx + bw*run.zoneA;
    const zw = bw*(run.zoneB-run.zoneA);
    ctx.fillStyle="rgba(134,239,172,0.55)";
    roundedRect(ctx, zx, by, zw, bh, 999);
    ctx.fill();

    // marker
    const mx = bx + bw*run.barX;
    ctx.fillStyle="rgba(125,211,252,0.95)";
    roundedRect(ctx, mx-10, by-14, 20, bh+28, 10);
    ctx.fill();

    // helper text
    ctx.fillStyle="rgba(231,231,234,0.75)";
    ctx.font="700 20px -apple-system,system-ui";
    ctx.fillText("Tap in the zone", bx, 36);
  }


  // ---------- Reset & Export ----------
var resetStep = 0;

const btnReset = $("#btnReset");
if (btnReset) {
  btnReset.addEventListener("click", () => {
    if (resetStep === 0) {
      resetStep = 1;
      toast("Tap Reset again to confirm.");
      setTimeout(()=>resetStep=0, 3000);
      return;
    }
    const ok = confirm("This will delete EVERYTHING (including locked avatar). Proceed?");
    if (!ok) { resetStep=0; return; }
    localStorage.removeItem(KEY);
    state = defaultState();
    resetStep=0;
    toast("Reset complete.");
    boot();
  });
}

const btnExport = $("#btnExport");
if (btnExport) {
  btnExport.addEventListener("click", async () => {
    try{
      const data = JSON.stringify(state, null, 2);
      await navigator.clipboard.writeText(data);
      toast("Save data copied.");
    }catch(e){
      alert("Copy failed. You can manually copy from the console if needed.");
      console.log("SAVE DATA:", state);
    }
  });
}

  // ---------- Helpers ----------
function escapeHtml(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
  function roundedRect(ctx, x,y,w,h,r){
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }
  function capsule(ctx, x, y, r, h, rr){
    // capsule centered at x, top at y; width = 2r
    roundedRect(ctx, x-r, y, r*2, h, rr);
    ctx.fill();
  }

  function hexToRgb(hex){
    const h = hex.replace("#","").trim();
    const full = h.length===3 ? h.split("").map(ch=>ch+ch).join("") : h;
    const n = parseInt(full, 16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }
  function rgbToHex({r,g,b}){
    const to = (v)=>String(v|0).padStart(2,"0");
    return `#${to(r.toString(16))}${to(g.toString(16))}${to(b.toString(16))}`;
  }
  function mixColor(a,b,t){
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex({
      r: Math.round(lerp(A.r,B.r,t)),
      g: Math.round(lerp(A.g,B.g,t)),
      b: Math.round(lerp(A.b,B.b,t))
    });
  }
  function darkenColor(c, amt){
    const A = hexToRgb(c);
    return rgbToHex({
      r: Math.round(A.r*(1-amt)),
      g: Math.round(A.g*(1-amt)),
      b: Math.round(A.b*(1-amt))
    });
  }

  // ---------- Boot ----------
  function boot(){
    // If profile is locked, ensure daily and show game; else show profile creator
    if (state.profileLocked) {
      ensureDaily();
      viewGame();
    } else {
      viewProfile();
    }
  }

  boot();
})();
