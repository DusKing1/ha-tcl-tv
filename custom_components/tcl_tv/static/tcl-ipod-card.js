/* Original UI; no external fonts, icon packs, analytics or network requests. */
const CARD_STYLE = `
  :host { display:block; --ink:#292a37; --muted:#686876; --glass:rgba(255,255,255,.3); --line:rgba(255,255,255,.72); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif; }
  * { box-sizing:border-box; }
  button,input { font:inherit; }
  button { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  button:disabled { cursor:default; opacity:.4; }
  button:focus-visible,input:focus-visible { outline:2px solid #8378c4; outline-offset:3px; }
  .shell { position:relative; isolation:isolate; overflow:clip; width:min(100%,440px); margin:0 auto; padding:23px 21px 19px; border-radius:34px; border:1px solid var(--line);
    background:linear-gradient(140deg,rgba(255,255,255,.64),rgba(245,245,252,.32));
    backdrop-filter:blur(42px) saturate(1.3); -webkit-backdrop-filter:blur(42px) saturate(1.3);
    box-shadow:inset 0 1px 1px #fff,0 16px 44px rgba(49,43,70,.09),inset 0 -1px 1px rgba(255,255,255,.7); }
  .shell:before { content:""; position:absolute; z-index:-1; inset:0; pointer-events:none;
    background:radial-gradient(ellipse at 100% 0%,rgba(206,194,232,.5),transparent 55%),radial-gradient(ellipse at 0% 70%,rgba(183,216,211,.45),transparent 55%),radial-gradient(ellipse at 95% 100%,rgba(235,222,213,.35),transparent 45%); }
  .shell:after { content:""; position:absolute; inset:1px; border-radius:33px; border:1px solid rgba(255,255,255,.25); pointer-events:none; }
  .screen-frame { margin:0 0 9px; }
  .screen { position:relative; height:350px; color:var(--ink); }
  .status { display:flex; align-items:center; justify-content:space-between; gap:8px; height:32px; margin:0 3px 17px; }
  .device-name { font-size:25px; font-weight:600; letter-spacing:-1px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .connection { display:flex; align-items:center; gap:5px; flex:none; font-size:10px; color:var(--muted); }
  .led { width:5px; height:5px; border-radius:50%; background:#95929c; }
  .led.on { background:#399273; box-shadow:0 0 0 3px rgba(74,153,120,.09); }
  .tabs { display:flex; padding:4px; gap:3px; border:1px solid rgba(255,255,255,.65); border-radius:16px;
    background:rgba(255,255,255,.2); box-shadow:inset 0 1px 3px rgba(111,103,128,.08); }
  .tab { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; height:34px; border:1px solid transparent; border-radius:12px; color:var(--muted); background:transparent; font-size:12px; font-weight:600; }
  .tab[aria-pressed=true] { color:var(--ink); border-color:var(--line); background:rgba(255,255,255,.64); backdrop-filter:blur(18px) saturate(1.4); -webkit-backdrop-filter:blur(18px) saturate(1.4); box-shadow:0 3px 9px rgba(88,78,107,.1),inset 0 1px 1px white; }
  svg { width:18px; height:18px; flex:none; }
  .screen-content { padding-top:14px; }
  .section-title { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0 3px 11px; }
  h2 { margin:0; font-size:16px; font-weight:600; letter-spacing:-.4px; line-height:25px; }
  .count { color:var(--muted); font-size:10px; }
  .app-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; }
  .app { min-width:0; height:77px; padding:8px 3px 5px; border-radius:18px; border:1px solid rgba(255,255,255,.5); color:var(--ink); background:var(--glass);
    backdrop-filter:blur(20px) saturate(1.25); -webkit-backdrop-filter:blur(20px) saturate(1.25);
    box-shadow:inset 0 1px 1px rgba(255,255,255,.85),0 3px 7px rgba(65,67,91,.04); transition:background .15s,box-shadow .15s,transform .15s; }
  .app:active { transform:scale(.95); }
  .app-icon { display:grid; place-items:center; width:33px; height:33px; margin:0 auto 6px; border-radius:11px; background:var(--icon-bg); color:var(--icon-fg); font-size:14px; font-weight:700; letter-spacing:-.4px; box-shadow:inset 0 1px 1px rgba(255,255,255,.8); }
  .app-label { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:10px; font-weight:550; line-height:15px; }
  .pager { height:36px; display:flex; align-items:center; justify-content:space-between; gap:5px; }
  .pager button { display:grid; place-items:center; width:36px; height:32px; color:var(--ink); border:0; border-radius:12px; background:transparent; }
  .dots { display:flex; gap:6px; align-items:center; }
  .dot { width:4px; height:4px; border-radius:50%; background:rgba(114,104,137,.22); }
  .dot.active { width:13px; border-radius:5px; background:#8a80a0; }
  .empty { height:168px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--muted); text-align:center; font-size:12px; line-height:1.7; }
  .empty svg { width:30px; height:30px; opacity:.65; }
  .controls { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:12px; }
  .control { height:66px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; border:1px solid var(--line); border-radius:17px; color:var(--ink); background:var(--glass); box-shadow:inset 0 1px 1px rgba(255,255,255,.7); font-size:11px; }
  .screen-note { margin:14px 0 0; text-align:center; color:var(--muted); font-size:10px; }
  .volume-panel { padding:19px 9px 0; text-align:center; }
  .volume-value { font-size:54px; font-weight:500; letter-spacing:-3px; line-height:1.1; }
  .volume-value small { font-size:15px; letter-spacing:0; margin-left:4px; color:var(--muted); }
  input[type=range] { display:block; width:100%; margin:23px 0 10px; accent-color:#8c83aa; height:26px; cursor:pointer; }
  .volume-actions { display:flex; justify-content:center; gap:12px; }
  .volume-actions button { display:grid; place-items:center; width:43px; height:36px; border-radius:13px; border:1px solid var(--line); background:var(--glass); color:var(--ink); }
  .feedback { min-height:19px; padding:4px 5px 0; margin:0; color:var(--muted); font-size:10px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align:center; }
  .feedback.error { color:#9d343e; }
  .wheel-wrap { width:min(100%,268px); margin:0 auto; }
  .wheel { position:relative; width:100%; aspect-ratio:1; border-radius:50%; border:1px solid var(--line); touch-action:none; user-select:none;
    background:linear-gradient(150deg,rgba(255,255,255,.45),rgba(255,255,255,.09) 48%,rgba(255,255,255,.28));
    backdrop-filter:blur(20px) saturate(1.2); -webkit-backdrop-filter:blur(20px) saturate(1.2);
    box-shadow:inset 0 2px 2px rgba(255,255,255,.9),inset 0 -2px 5px rgba(255,255,255,.4),0 14px 30px rgba(61,61,86,.08); }
  .wheel:before { content:""; position:absolute; inset:5px; border-radius:50%; border:1px solid rgba(255,255,255,.35); pointer-events:none; }
  .wheel-center { position:absolute; left:50%; top:50%; width:35%; aspect-ratio:1; transform:translate(-50%,-50%); display:grid; place-items:center; border-radius:50%; border:1px solid var(--line); color:var(--ink);
    background:linear-gradient(135deg,rgba(255,255,255,.75),rgba(255,255,255,.18));
    backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    box-shadow:inset 0 1px 2px #fff,0 6px 14px rgba(80,69,103,.13); }
  .wheel-center svg { width:23px; height:23px; }
  .wheel-center:active { transform:translate(-50%,-50%) scale(.96); }
  .wheel-key { position:absolute; display:grid; place-items:center; border:0; color:var(--muted); background:transparent; }
  .wheel-key:active { color:var(--ink); transform:scale(.91); }
  .wheel-up { top:4%; left:38%; width:24%; height:21%; }
  .wheel-down { bottom:4%; left:38%; width:24%; height:21%; }
  .wheel-left { left:4%; top:38%; width:21%; height:24%; }
  .wheel-right { right:4%; top:38%; width:21%; height:24%; }
  .transport { display:flex; justify-content:space-between; gap:8px; margin:20px -15px 0; }
  .transport button { display:flex; align-items:center; justify-content:center; flex:1; min-height:43px; padding:9px; border:1px solid var(--line); border-radius:18px; color:var(--ink); background:var(--glass); box-shadow:inset 0 1px 1px #fff9,0 3px 10px #30304408; }
  .transport button:active { transform:scale(.95); }
  :host([dark]) { --ink:#f2f0f7; --muted:#bbb6c6; --glass:rgba(255,255,255,.065); --line:rgba(255,255,255,.24); }
  :host([dark]) .shell { background:linear-gradient(145deg,rgba(71,68,81,.74),rgba(36,40,48,.63)); box-shadow:inset 0 1px 1px #fff5,0 16px 40px #15132022; }
  :host([dark]) .shell:before { background:radial-gradient(ellipse at 100% 0%,#81749133,transparent 55%),radial-gradient(ellipse at 0% 70%,#6f989833,transparent 60%); }
  :host([dark]) .shell:after { border-color:#ffffff09; }
  :host([dark]) .tab[aria-pressed=true] { background:rgba(255,255,255,.13); box-shadow:0 3px 9px #2222,inset 0 1px 1px #fff3; }
  :host([dark]) .app { border-color:#fff2; box-shadow:inset 0 1px 1px #fff2,0 3px 7px #0001; }
  :host([dark]) .tabs { border-color:#fff2; background:#ffffff08; }
  :host([dark]) .dot { background:#a99ebb55; } :host([dark]) .dot.active { background:#c1b3d6; }
  :host([dark]) .feedback.error { color:#ffb5bd; }
  :host([dark]) .wheel { background:linear-gradient(145deg,#ffffff19,#ffffff04 50%,#ffffff12); box-shadow:inset 0 1px 2px #fff5,0 10px 30px #1518271a; }
  :host([dark]) .wheel:before { border-color:#ffffff12; }
  :host([dark]) .wheel-center { background:linear-gradient(145deg,#ffffff26,#ffffff08); box-shadow:inset 0 1px 1px #fff5,0 5px 20px #18212f22; }
  :host([dark]) .transport button,:host([dark]) .control { box-shadow:inset 0 1px 1px #fff2; }
  @media(max-width:360px) { .shell { padding:19px 16px; border-radius:29px; } .wheel-wrap { width:min(100%,244px); } }
  @media(prefers-reduced-motion:reduce) { .app { transition:none; } }
`;

const ICON_PATHS = {
  apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  remote: '<rect x="7" y="2" width="10" height="20" rx="4"/><circle cx="12" cy="9" r="2"/><path d="M10 16h4"/>',
  volume: '<path d="M11 4 5 9H2v6h3l6 5zM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16"/>',
  mute: '<path d="M11 4 5 9H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
  home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  back: '<path d="m9 5-7 7 7 7M2 12h12a6 6 0 0 1 6 6"/>',
  power: '<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
  source: '<rect x="2" y="3" width="20" height="14" rx="3"/><path d="M8 21h8M12 17v4m-3-11 4 4-4 4M4 10h9"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  up: '<path d="m5 15 7-7 7 7"/>',
  down: '<path d="m5 9 7 7 7-7"/>',
  check: '<path d="m6 12 4 4 8-8"/>',
  playback: '<path d="m4 4 10 8L4 20zM18 5v14M22 5v14"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.apps}</svg>`;
const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const PALETTE = [["#ece4f8","#7e639a"],["#deeee8","#507e71"],["#f6e3df","#a3635c"],["#e0e7f7","#5b73a2"],["#f1e8d6","#927643"],["#e4e5ef","#6d6b88"]];
const PAGES = [["remote","遥控"],["apps","应用"],["volume","音量"]];
const PAGE_SIZE = 6;

class TclIpodCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._screen = "remote";
    this._appPage = 0;
    this._busy = false;
    this._dial = null;
    this._signature = "";
    this._feedback = "";
    this.shadowRoot.addEventListener("click", (event) => this._click(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._key(event));
    this.shadowRoot.addEventListener("input", (event) => {
      if (event.target.matches('input[type="range"]')) {
        this.shadowRoot.querySelector(".volume-value").innerHTML = `${Number(event.target.value)}<small>%</small>`;
        this._adjusting = true;
      }
    });
    this.shadowRoot.addEventListener("change", (event) => {
      if (!event.target.matches('input[type="range"]')) return;
      this._adjusting = false;
      this._call("media_player", "volume_set", {volume_level:Number(event.target.value)/100});
    });
  }

  setConfig(config) {
    if (!config?.media_player?.startsWith("media_player.") || !config?.remote?.startsWith("remote.")) {
      throw new Error("Set media_player and remote to their respective entity IDs");
    }
    this._config = config;
    this._render(true);
  }

  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return 12; }
  getGridOptions() { return {columns:12, rows:"auto", min_columns:12}; }
  _player() { return this._hass?.states[this._config?.media_player]; }
  _remote() { return this._hass?.states[this._config?.remote]; }
  _apps() { return this._player()?.attributes.source_list ?? []; }
  _online() { return this._player()?.state === "on" && this._remote()?.state === "on"; }

  _mount() {
    if (this.shadowRoot.querySelector(".shell")) return;
    this.shadowRoot.innerHTML = `<style>${CARD_STYLE}</style><div class="shell" role="group" aria-label="电视遥控器">
      <div class="screen-frame"><div class="screen"><div class="status"></div><nav class="tabs" aria-label="遥控器页面"></nav><div class="screen-content"></div><p class="feedback" role="status"></p></div></div>
      <div class="wheel-wrap"><div class="wheel" tabindex="0" role="group" aria-label="电视方向与确认" title="始终控制电视方向与确认">
        <button class="wheel-key wheel-up" data-action="up" aria-label="上">${icon("up")}</button>
        <button class="wheel-key wheel-left" data-action="left" aria-label="左">${icon("left")}</button>
        <button class="wheel-key wheel-right" data-action="right" aria-label="右">${icon("right")}</button>
        <button class="wheel-key wheel-down" data-action="down" aria-label="下">${icon("down")}</button>
        <button class="wheel-center" data-action="ok" aria-label="电视确认">${icon("check")}</button>
      </div>
      <div class="transport"><button data-action="local-menu" aria-label="遥控页面" title="遥控页面">${icon("remote")}</button><button data-key="back" aria-label="电视返回" title="返回">${icon("back")}</button><button data-key="playback" aria-label="电视播放暂停" title="播放 / 暂停">${icon("playback")}</button><button data-key="source" aria-label="电视信号源" title="信号源">${icon("source")}</button></div></div>
    </div>`;
    const wheel = this.shadowRoot.querySelector(".wheel");
    wheel.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest(".wheel-center")) return;
      const r = wheel.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      this._dial = {id:event.pointerId, angle:Math.atan2(event.clientY-cy,event.clientX-cx), carry:0, moved:false};
      // Preserve the button target for a tap; capture only after a rotation begins.
    });
    wheel.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this._dial?.id) return;
      const r = wheel.getBoundingClientRect();
      const angle = Math.atan2(event.clientY-r.top-r.height/2,event.clientX-r.left-r.width/2);
      let delta = angle-this._dial.angle;
      if (delta > Math.PI) delta -= 2*Math.PI;
      if (delta < -Math.PI) delta += 2*Math.PI;
      this._dial.angle = angle;
      this._dial.carry += delta;
      if (Math.abs(this._dial.carry) < .3) return;
      const step = Math.sign(this._dial.carry);
      this._dial.carry -= step*.3;
      this._dial.moved = true;
      if (!wheel.hasPointerCapture(event.pointerId)) wheel.setPointerCapture(event.pointerId);
      this._rotate(step);
    });
    const stop = (event) => {
      if (event.pointerId !== this._dial?.id) return;
      this._suppressClick = this._dial.moved ? performance.now()+350 : 0;
      this._dial = null;
      if (wheel.hasPointerCapture(event.pointerId)) wheel.releasePointerCapture(event.pointerId);
    };
    wheel.addEventListener("pointerup",stop);
    wheel.addEventListener("pointercancel",stop);
    wheel.addEventListener("lostpointercapture",stop);
    wheel.addEventListener("wheel",(event) => {
      event.preventDefault();
      if (performance.now()-(this._wheelAt ?? 0)<100 || !event.deltaY) return;
      this._wheelAt = performance.now();
      this._rotate(Math.sign(event.deltaY));
    },{passive:false});
  }

  _render(force = false) {
    if (!this._config || !this._hass) return;
    this._mount();
    const player = this._player(), remote = this._remote();
    const dark = this._hass.themes?.darkMode ?? window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.toggleAttribute("dark",dark);
    const signature = JSON.stringify([player?.state,remote?.state,player?.attributes.volume_level,this._apps(),dark]);
    if (!force && (signature === this._signature || this._adjusting)) return;
    this._signature = signature;
    const focus = this.shadowRoot.activeElement;
    const focusKey = focus?.dataset.app !== undefined ? `[data-app="${focus.dataset.app}"]` : focus?.dataset.tab ? `[data-tab="${focus.dataset.tab}"]` : null;
    const state = !player || !remote ? "实体未配置" : this._online() ? "已连接" : player.state === "off" ? "离线" : "连接中";
    this.shadowRoot.querySelector(".status").innerHTML = `<span class="device-name">${esc(this._config.name || "电视")}</span><span class="connection"><i class="led ${this._online()?"on":""}"></i>${state}</span>`;
    this.shadowRoot.querySelector(".tabs").innerHTML = PAGES.map(([key,label]) => `<button class="tab" data-tab="${key}" aria-pressed="${key===this._screen}">${icon(key)}${label}</button>`).join("");
    let content;
    const disabled = this._online() ? "" : "disabled";
    if (this._screen === "apps") {
      const apps = this._apps();
      const pages = Math.ceil(apps.length/PAGE_SIZE);
      this._appPage = Math.max(0,Math.min(this._appPage,pages-1));
      const page = this._appPage;
      const start = page*PAGE_SIZE;
      const tiles = apps.slice(start,start+PAGE_SIZE).map((name,i) => {
        const index = start+i, [bg,fg] = PALETTE[index%PALETTE.length];
        const monogram = /^[a-z]/i.test(name) ? name.slice(0,2).toUpperCase() : Array.from(name)[0];
        return `<button class="app" data-app="${index}" data-source="${esc(name)}" aria-label="打开 ${esc(name)}" title="${esc(name)}" ${disabled}>
          <span class="app-icon" style="--icon-bg:${bg};--icon-fg:${fg}">${esc(monogram)}</span><span class="app-label">${esc(name)}</span></button>`;
      }).join("");
      content = `<div class="section-title"><h2>打开点什么</h2><span class="count">${apps.length} 个应用</span></div>`;
      if (apps.length) {
        content += `<div class="app-grid">${tiles}</div><div class="pager"><button data-page="-1" aria-label="上一页应用" ${page===0?"disabled":""}>${icon("left")}</button><span class="dots" aria-label="第 ${page+1} 页，共 ${pages} 页">${Array.from({length:pages},(_,i)=>`<i class="dot ${i===page?"active":""}"></i>`).join("")}</span><button data-page="1" aria-label="下一页应用" ${page+1>=pages?"disabled":""}>${icon("right")}</button></div>`;
      } else {
        content += `<div class="empty">${icon("apps")}<span>${this._online()?"正在读取应用列表":"电视连接后，应用会出现在这里"}</span></div>`;
      }
    } else if (this._screen === "remote") {
      const controls = [["home","主页"],["back","返回"],["menu","菜单"],["mute","静音"],["source","信号源"]];
      content = `<div class="section-title"><h2>轻点，就好</h2><span class="count">下方圆环控制方向</span></div><div class="controls">${controls.map(([key,label])=>`<button class="control" data-key="${key}" ${disabled}>${icon(key)}${label}</button>`).join("")}<button class="control" data-action="power">${icon("power")}${player?.state==="on"?"关机":"尝试唤醒"}</button></div><p class="screen-note">方向 · 确认 · 返回，都在手边</p>`;
    } else {
      const volume = player?.attributes.volume_level;
      const pct = this._online() && typeof volume==="number" ? Math.round(volume*100) : null;
      content = `<div class="section-title"><h2>刚刚好的音量</h2>${icon("volume")}</div><div class="volume-panel"><div class="volume-value">${pct ?? "—"}<small>%</small></div><input type="range" min="0" max="100" value="${pct ?? 0}" aria-label="电视音量" ${pct===null?"disabled":""}><div class="volume-actions"><button data-volume="-1" aria-label="降低音量" ${disabled}>${icon("minus")}</button><button data-key="mute" aria-label="切换静音" ${disabled}>${icon("mute")}</button><button data-volume="1" aria-label="提高音量" ${disabled}>${icon("plus")}</button></div></div>`;
    }
    this.shadowRoot.querySelector(".screen-content").innerHTML = content;
    this.shadowRoot.querySelectorAll(".transport [data-key]").forEach((button)=>{button.disabled=!this._online();});
    this._showFeedback();
    if (focusKey) this.shadowRoot.querySelector(focusKey)?.focus({preventScroll:true});
  }

  _navigate(page) {
    this._screen = page;
    this._feedback = "";
    this._error = false;
    this._render(true);
  }

  _click(event) {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.closest(".wheel") && performance.now() < (this._suppressClick ?? 0)) return;
    const data = button.dataset;
    if (data.tab) return this._navigate(data.tab);
    // Only explicit app tiles launch apps. The TV pad never selects an app.
    if (data.app !== undefined) return this._launchApp(data.source);
    if (data.page) {
      const lastPage = Math.max(0,Math.ceil(this._apps().length/PAGE_SIZE)-1);
      this._appPage = Math.max(0,Math.min(lastPage,this._appPage+Number(data.page)));
      return this._render(true);
    }
    if (data.volume) return this._volume(Number(data.volume));
    if (data.key) return this._sendKey(data.key);
    if (data.action === "local-menu") return this._navigate("remote");
    if (data.action === "power") {
      if (!this._player() || !this._remote()) return this._message("请检查卡片的实体配置",true);
      return this._call("media_player",this._player().state==="on"?"turn_off":"turn_on",{},this._player().state==="on"?"已发送关机按键":"已发送唤醒包，等待电视连接");
    }
    if (data.action) this._sendKey(data.action);
  }


  _rotate(step) {
    this._sendKey(step>0?"down":"up");
  }

  _key(event) {
    if (event.target.matches("input")) return;
    if (event.key==="Escape") { event.preventDefault(); this._navigate("remote"); return; }
    if (!event.target.closest(".wheel")) return;
    const key = ({ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",Enter:"ok"})[event.key];
    if (!key) return;
    // Let native Enter activate a focused button once, never also send OK.
    if (event.key==="Enter" && event.target.closest("button")) return;
    event.preventDefault();
    this._sendKey(key);
  }

  _launchApp(source) {
    if (source) this._call("media_player","select_source",{source},`已发送打开「${source}」`);
  }
  _volume(step) { this._call("media_player",step>0?"volume_up":"volume_down"); }
  _sendKey(command) { this._call("remote","send_command",{command:[command]}); }

  async _call(domain,service,data={},message="") {
    if (!this._hass) return;
    if (this._busy) {
      // Coalesce absolute slider changes: never lose the final thumb position.
      if (service === "volume_set") this._pendingVolume = data.volume_level;
      return;
    }
    if (service!=="turn_on" && !this._online()) return this._message("电视未连接",true);
    this._busy = true;
    try {
      await this._hass.callService(domain,service,{entity_id:this._config[domain],...data});
      this._message(message);
    } catch (error) {
      this._message(error.message || "指令发送失败",true);
    } finally {
      this._busy = false;
      if (this._pendingVolume !== undefined) {
        const volume_level = this._pendingVolume;
        this._pendingVolume = undefined;
        this._call("media_player","volume_set",{volume_level});
      }
    }
  }
  _message(text,error=false) { this._feedback=text; this._error=error; this._showFeedback(); }
  _showFeedback() {
    const el=this.shadowRoot.querySelector(".feedback");
    if (!el) return;
    el.textContent=this._feedback;
    el.title=this._feedback;
    el.classList.toggle("error",!!this._error);
  }
}

if (!customElements.get("tcl-ipod-card")) {
  customElements.define("tcl-ipod-card",TclIpodCard);
  window.customCards = window.customCards || [];
  window.customCards.push({type:"tcl-ipod-card",name:"TCL Glass Remote",description:"Glass app launcher with a classic click wheel."});
}
