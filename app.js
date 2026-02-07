(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const KEY = 'muscle_avatar_save_v2';
  const state = load() || defaultState();
  let run = null;

  const STAGE_THRESHOLDS = [0, 6, 12, 18, 24, 30];

  function defaultState() {
    return {
      profileLocked: false,
      profile: { name: '', hair: 0, tone: 2 },
      progress: {
        chest: 8, shoulders: 8, arms: 8,
        level: 0, xp: 0, totalSets: 0,
        setsLeft: 3, fatigue: 0,
        streak: 0, lastTrainingDate: null,
        dailyGoalDoneDate: null,
        trainingLog: []
      }
    };
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function dateKey(d = new Date()) { return d.toISOString().slice(0, 10); }
  function startOfWeek(now = new Date()) {
    const d = new Date(now); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  }
  function weekCount() {
    const start = startOfWeek();
    return state.progress.trainingLog.filter((d) => d >= start).length;
  }

  function ensureDaily() {
    const p = state.progress;
    const today = dateKey();
    const stamp = p.lastDailyReset || '';
    if (stamp !== today) {
      p.setsLeft = 3;
      p.fatigue = Math.max(0, Math.round(p.fatigue * 0.65));
      p.lastDailyReset = today;
      save();
    }
  }

  function xpToNext(level) { return Math.round(42 + level * 10 + Math.pow(level, 1.35) * 5); }
  function avatarStage(level) {
    let stage = 0;
    for (let i = 0; i < STAGE_THRESHOLDS.length; i++) if (level >= STAGE_THRESHOLDS[i]) stage = i;
    return clamp(stage, 0, 5);
  }

  function badges() {
    const p = state.progress;
    const list = [];
    if (p.streak >= 3) list.push('Consistency I');
    if (p.streak >= 7) list.push('Consistency II');
    if (p.streak >= 21) list.push('Consistency III');
    if (p.totalSets >= 30) list.push('Iron Habit');
    if (list.length === 0) list.push('Starter');
    return list;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => t.classList.remove('show'), 1500);
  }

  function confirmModal(title, message) {
    const dialog = $('#appModal');
    $('#modalTitle').textContent = title;
    $('#modalMessage').textContent = message;
    dialog.showModal();
    return new Promise((resolve) => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    });
  }

  function transitionRender(html) {
    const main = $('#mainContent');
    main.innerHTML = html;
    main.classList.remove('fade-slide');
    requestAnimationFrame(() => main.classList.add('fade-slide'));
    setHeader();
    bindFooter();
  }

  function setHeader() {
    $('#headerLevelPill').textContent = `Lv.${state.progress.level}`;
  }

  function setAvatarLevel(level, animate) {
    const stage = avatarStage(level);
    const img = $('#avatarImage');
    if (!img) return;
    img.src = `./assets/avatar/stage-${stage}.svg`;
    img.alt = `Avatar Stage ${stage}`;
    $('#avatarStage').textContent = `見た目段階: ${stage}/5`;
    if (animate) {
      const wrap = $('.avatar-wrap');
      wrap.classList.add('levelup');
      setTimeout(() => wrap.classList.remove('levelup'), 220);
    }
  }

  function profileView() {
    $('#primaryAction').textContent = 'この見た目で開始';
    $('#secondaryAction').style.display = 'none';
    $('#tertiaryAction').style.display = 'none';
    transitionRender(`
      <section class="section-card avatar-wrap">
        <img id="avatarImage" src="./assets/avatar/stage-0.svg" alt="avatar" />
        <p id="avatarStage" class="eyebrow"></p>
      </section>
      <section class="section-card form-grid">
        <div><label>プレイヤー名</label><input id="nameInput" maxlength="12" placeholder="例: だいち" value="${state.profile.name || ''}"></div>
        <div><label>髪型</label><select id="hairSelect"><option value="0">ショート</option><option value="1">ミディアム</option><option value="2">カーリー</option></select></div>
        <div><label>肌トーン</label><select id="toneSelect"><option value="1">ライト</option><option value="2">ナチュラル</option><option value="3">タン</option></select></div>
      </section>
    `);
    setAvatarLevel(state.progress.level);
  }

  function gameView() {
    ensureDaily();
    const p = state.progress;
    const next = xpToNext(p.level);
    const dailyDone = p.dailyGoalDoneDate === dateKey();
    transitionRender(`
      <section class="section-card avatar-wrap">
        <img id="avatarImage" src="./assets/avatar/stage-0.svg" alt="avatar" />
        <div class="avatar-meta"><span>${state.profile.name}</span><span id="avatarStage"></span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${(p.xp/next)*100}%"></div></div>
        <div class="avatar-meta"><span>XP ${p.xp} / ${next}</span><span>次Lvまで ${next - p.xp}</span></div>
      </section>
      <section class="section-card">
        <div class="stats-grid">
          <div class="stat"><div class="label">連続日数</div><div class="value">${p.streak}</div></div>
          <div class="stat"><div class="label">今週達成</div><div class="value">${weekCount()}回</div></div>
          <div class="stat"><div class="label">今日の目標</div><div class="value">${dailyDone ? '達成' : '未達成'}</div></div>
        </div>
        <div class="badges">${badges().map((b) => `<span class="badge">${b}</span>`).join('')}</div>
      </section>
      <section class="section-card">
        <p class="eyebrow">ベンチプレスミニゲーム（フォーム3秒 + 10タップ）</p>
        <div id="stageArea"></div>
      </section>
    `);
    setAvatarLevel(p.level);
    renderIdleStage();
    $('#secondaryAction').style.display = 'block';
    $('#tertiaryAction').style.display = 'block';
    $('#primaryAction').textContent = p.setsLeft > 0 ? `セット開始（残り${p.setsLeft}）` : '今日は終了';
    $('#primaryAction').disabled = p.setsLeft <= 0;
  }

  function renderIdleStage() {
    $('#stageArea').innerHTML = `<p>フォームを適正ゾーンに合わせ、タイミングバーで10回タップ。</p>`;
  }

  function startSet() {
    if (state.progress.setsLeft <= 0) return;
    run = {
      phase: 'form',
      form: 60, formTimeLeft: 3,
      repsTotal: 10, repIndex: 0, hits: 0,
      barX: 0.15, barV: 1.15, zoneA: 0.46, zoneB: 0.58,
      lastTick: performance.now(), formAcc: 0, repAcc: 0
    };
    $('#stageArea').innerHTML = `<p>フォーム調整: <b id="formTime">3.0s</b> / 値 <b id="formValue">60</b></p>
      <input type="range" id="formRange" min="0" max="100" value="60">
      <canvas id="repCanvas" width="360" height="120"></canvas>
      <p class="eyebrow">次フェーズでバーが表示されます</p>`;
    $('#formRange').addEventListener('input', (e) => {
      run.form = parseInt(e.target.value, 10) || 0;
      $('#formValue').textContent = String(run.form);
    });
    requestAnimationFrame(loop);
  }

  function loop(t) {
    if (!run) return;
    const dt = (t - run.lastTick) / 1000;
    run.lastTick = t;
    if (run.phase === 'form') {
      run.formTimeLeft -= dt;
      $('#formTime').textContent = `${Math.max(0, run.formTimeLeft).toFixed(1)}s`;
      if (run.formTimeLeft <= 0) {
        const v = run.form;
        run.formAcc = (v >= 55 && v <= 70) ? 0.95 : clamp(0.85 - Math.abs(v - 62) / 70, 0.2, 0.85);
        run.phase = 'reps';
        $('#stageArea').innerHTML = `<p>タイミングでタップ <b id="repInfo">1/10</b> 命中 <b id="hitInfo">0</b></p>
          <canvas id="repCanvas" width="360" height="140"></canvas>
          <button id="tapBtn" class="btn btn-primary" type="button">タップ</button>`;
        $('#tapBtn').addEventListener('click', tapRep);
      }
    } else if (run.phase === 'reps') {
      run.barX += run.barV * dt;
      if (run.barX >= 1 || run.barX <= 0) run.barV *= -1;
      drawRepBar();
    }
    requestAnimationFrame(loop);
  }

  function drawRepBar() {
    const c = $('#repCanvas'); if (!c || !run) return;
    const ctx = c.getContext('2d');
    const { width:w, height:h } = c;
    ctx.clearRect(0,0,w,h);
    const bx=24, by=58, bw=w-48, bh=24;
    ctx.fillStyle='#16233d'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#263a61'; ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle='rgba(112,247,183,.75)'; ctx.fillRect(bx + bw*run.zoneA, by, bw*(run.zoneB-run.zoneA), bh);
    ctx.fillStyle='#5fd1ff'; ctx.fillRect(bx + bw*run.barX - 9, by-12, 18, bh+24);
  }

  function tapRep() {
    if (!run || run.phase !== 'reps') return;
    const hit = run.barX >= run.zoneA && run.barX <= run.zoneB;
    if (hit) run.hits++;
    run.repIndex++;
    $('#repInfo').textContent = `${Math.min(run.repIndex + 1, run.repsTotal)}/10`;
    $('#hitInfo').textContent = String(run.hits);
    run.zoneA = clamp(run.zoneA + (Math.random() * 0.05 - 0.025), 0.2, 0.7);
    run.zoneB = run.zoneA + 0.12;
    if (run.repIndex >= run.repsTotal) {
      run.repAcc = run.hits / run.repsTotal;
      const leveled = applyGains(run.formAcc, run.repAcc, run.form);
      run = null;
      gameView();
      if (leveled) setAvatarLevel(state.progress.level, true);
    }
  }

  function applyGains(formAcc, repAcc, formVal) {
    const p = state.progress;
    const beforeLevel = p.level;
    const fatigueFactor = clamp(1 - p.fatigue / 160, 0.55, 1);
    const base = 1.2 * fatigueFactor;
    const target = base * (0.45 + 0.55 * repAcc) * (0.45 + 0.55 * formAcc);
    const leak = base * (1 - formAcc) * (0.5 + 0.5 * (1 - repAcc));

    p.chest += target;
    if (formVal < 45) p.arms += leak; else if (formVal > 75) p.shoulders += leak; else { p.shoulders += leak * 0.55; p.arms += leak * 0.45; }

    const streakBonus = clamp(p.streak * 0.5, 0, 8);
    const xpGain = Math.round(18 + 16 * repAcc + 14 * formAcc + streakBonus);
    p.xp += xpGain;
    while (p.xp >= xpToNext(p.level)) {
      p.xp -= xpToNext(p.level);
      p.level++;
    }

    p.fatigue = clamp(p.fatigue + Math.round(9 + (1-repAcc)*8 + (1-formAcc)*8), 0, 150);
    p.setsLeft = Math.max(0, p.setsLeft - 1);
    p.totalSets += 1;

    const today = dateKey();
    if (p.lastTrainingDate !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = dateKey(y);
      p.streak = (p.lastTrainingDate === yesterday) ? p.streak + 1 : 1;
      p.lastTrainingDate = today;
      p.trainingLog.push(today);
      p.trainingLog = [...new Set(p.trainingLog)].slice(-180);
    }
    p.dailyGoalDoneDate = today;

    save();
    toast(beforeLevel !== p.level ? `レベルアップ！ Lv.${p.level}` : `+${xpGain} XP 獲得`);
    return beforeLevel !== p.level;
  }

  function bindFooter() {
    $('#primaryAction').onclick = async () => {
      if (!state.profileLocked) {
        state.profile.name = ($('#nameInput')?.value || '').trim();
        state.profile.hair = parseInt($('#hairSelect')?.value || '0', 10);
        state.profile.tone = parseInt($('#toneSelect')?.value || '2', 10);
        if (!state.profile.name) return toast('名前を入力してください');
        const ok = await confirmModal('開始しますか？', 'この見た目を確定してゲームを始めます。');
        if (!ok) return;
        state.profileLocked = true;
        save();
        gameView();
      } else {
        startSet();
      }
    };

    $('#secondaryAction').onclick = () => {
      const data = JSON.stringify(state, null, 2);
      navigator.clipboard?.writeText(data).then(() => toast('データをコピーしました')).catch(() => prompt('コピーしてください', data));
    };

    $('#tertiaryAction').onclick = async () => {
      const ok = await confirmModal('リセットしますか？', '全データを初期化します。');
      if (!ok) return;
      localStorage.removeItem(KEY);
      Object.assign(state, defaultState());
      save();
      profileView();
      toast('リセットしました');
    };
  }

  function registerSW() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  function boot() {
    registerSW();
    ensureDaily();
    state.profileLocked ? gameView() : profileView();
  }

  boot();
})();
