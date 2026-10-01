const CARD_STYLE = `
  :host { display:block; color:#202124; font-family:Inter,Roboto,"Helvetica Neue",Arial,sans-serif; }
  * { box-sizing:border-box; }
  .shell { position:relative; width:min(100%,420px); margin:0 auto; padding:25px 25px 27px; border-radius:38px; background:linear-gradient(118deg,#fff 0%,#eceef1 17%,#fff 43%,#e7e9ed 100%); border:1px solid rgba(120,125,135,.25); box-shadow:inset 0 2px 4px #fff,inset 0 -3px 8px rgba(95,100,110,.16),0 16px 38px rgba(28,31,38,.23),0 3px 8px rgba(28,31,38,.12); }
  .shell:before { content:""; position:absolute; inset:7px; border-radius:32px; border:1px solid rgba(255,255,255,.86); pointer-events:none; }
  .brand { height:25px; display:flex; align-items:center; justify-content:center; gap:7px; color:#9b9da2; font-size:11px; font-weight:750; letter-spacing:4px; text-transform:uppercase; }
  .brand-mark { font-size:14px; letter-spacing:0; color:#aeb1b7; }
  .screen-frame { padding:8px; margin:4px 0 22px; border-radius:15px; background:linear-gradient(145deg,#d5d8dd,#f8f9fa 55%,#cbd0d7); box-shadow:inset 0 1px 4px rgba(48,52,60,.23),0 1px 0 #fff; }
  .screen { overflow:hidden; position:relative; height:260px; border-radius:8px; color:#111; background:linear-gradient(145deg,#e9edf0 0%,#dce2e7 57%,#d2d9df 100%); box-shadow:inset 0 2px 7px rgba(34,43,52,.32); }
  .screen:after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(160deg,rgba(255,255,255,.52),transparent 42%); }
  .status { height:31px; display:flex; align-items:center; justify-content:space-between; padding:0 11px; background:rgba(255,255,255,.53); border-bottom:1px solid rgba(40,50,60,.15); font-size:11px; font-weight:700; letter-spacing:.15px; }
  .status-left { display:flex; align-items:center; gap:6px; }
  .led { width:7px; height:7px; border-radius:50%; background:#7d858b; box-shadow:0 0 0 2px rgba(80,90,100,.1); } .led.on { background:#42a66a; box-shadow:0 0 7px rgba(44,165,93,.7); }
  .battery { width:19px; height:9px; border:1px solid #555d62; border-radius:2px; padding:1px; position:relative; } .battery:after { content:""; position:absolute; right:-3px; top:2px; height:3px; width:2px; background:#555d62; border-radius:0 2px 2px 0; } .battery i { display:block; height:100%; width:72%; background:#707a7f; border-radius:1px; }
  .screen-content { position:relative; z-index:1; height:calc(100% - 31px); } .screen-title { margin:0; padding:10px 12px 7px; font-size:19px; font-weight:780; letter-spacing:-.4px; } .subtitle { margin:-3px 12px 8px; color:#485058; font-size:11px; }
  .menu-list { padding:0 7px 5px; } .menu-row { height:36px; padding:0 9px; display:flex; align-items:center; justify-content:space-between; border-radius:5px; font-size:13px; font-weight:600; } .menu-row.selected { background:linear-gradient(#79b8ed,#398cda); color:#fff; text-shadow:0 1px 1px rgba(0,0,0,.22); box-shadow:inset 0 1px rgba(255,255,255,.35),0 1px 2px rgba(0,0,0,.14); }
  .row-left { display:flex; align-items:center; gap:9px; min-width:0; } .row-icon { width:19px; text-align:center; font-size:15px; } .row-label { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; } .chevron { opacity:.8; font-size:18px; font-weight:400; }
  .now-playing { display:flex; align-items:center; gap:12px; padding:16px 12px; } .album { width:74px; height:74px; border-radius:5px; flex:none; display:grid; place-items:center; color:#69737c; font-size:31px; background:linear-gradient(145deg,#f9fafb,#bfc9d2); box-shadow:0 2px 5px #9ca5ad; } .np-copy { min-width:0; } .np-title { font-size:14px; font-weight:750; } .np-detail { margin-top:6px; color:#515a60; font-size:11px; line-height:1.45; }
  .volume-panel { padding:18px 14px; } .volume-number { font-size:34px; line-height:1; font-weight:760; letter-spacing:-1.5px; } .volume-number small { font-size:14px; color:#4e575e; letter-spacing:0; } .meter { height:9px; margin:16px 0 12px; overflow:hidden; border-radius:9px; background:#b7c0c7; box-shadow:inset 0 1px 3px rgba(0,0,0,.22); } .meter-fill { height:100%; border-radius:inherit; background:linear-gradient(#80bdf0,#3187d6); box-shadow:0 0 7px rgba(44,135,214,.5); } .hint { color:#475058; font-size:11px; }
  .quick-row { display:flex; gap:8px; padding:0 9px; } .quick { flex:1; height:28px; border:1px solid rgba(70,80,90,.21); border-radius:5px; color:#343b40; background:rgba(255,255,255,.5); font:700 11px/1 inherit; cursor:pointer; }
  .wheel-wrap { width:min(80vw,310px); margin:0 auto; } .wheel { position:relative; width:100%; aspect-ratio:1; border-radius:50%; background:radial-gradient(circle at 34% 27%,#fff 0%,#fafbfc 26%,#e7e9ed 57%,#d1d4d9 78%,#f8f9fa 100%); border:1px solid rgba(130,135,143,.33); box-shadow:inset 0 3px 9px rgba(255,255,255,.95),inset 0 -5px 12px rgba(92,97,105,.2),0 5px 12px rgba(55,60,70,.18); touch-action:none; user-select:none; } .wheel:before { content:""; position:absolute; inset:6px; border-radius:50%; border:1px solid rgba(255,255,255,.92); pointer-events:none; }
  .wheel-center { position:absolute; left:50%; top:50%; width:38%; aspect-ratio:1; transform:translate(-50%,-50%); display:grid; place-items:center; border-radius:50%; border:1px solid rgba(135,140,147,.42); color:#8c9198; background:linear-gradient(145deg,#fff,#e7e9ed 75%); box-shadow:0 2px 6px rgba(50,55,65,.18),inset 0 1px #fff; font-size:10px; font-weight:800; letter-spacing:1.3px; cursor:pointer; } .wheel-center:active { background:linear-gradient(#c8cdd2,#f2f3f4); transform:translate(-50%,-49%); }
  .wheel-key { position:absolute; display:grid; place-items:center; border:0; color:#91969d; background:transparent; cursor:pointer; font-weight:750; } .wheel-key:active { color:#555c63; transform:scale(.93); } .wheel-up { top:5%; left:39%; width:22%; height:18%; font-size:18px; } .wheel-down { bottom:5%; left:39%; width:22%; height:18%; font-size:18px; } .wheel-left { left:5%; top:39%; width:18%; height:22%; font-size:17px; } .wheel-right { right:5%; top:39%; width:18%; height:22%; font-size:17px; }
  .wheel-hint { text-align:center; margin-top:12px; color:#8b9097; font-size:9px; font-weight:650; letter-spacing:1.5px; text-transform:uppercase; } .transport { display:flex; justify-content:space-around; gap:5px; margin-top:7px; } .transport button { padding:5px 7px; border:0; border-radius:7px; color:#8b9097; background:transparent; font:750 9px/1.2 inherit; letter-spacing:.6px; cursor:pointer; } .transport button:active { background:#aebdc9; transform:translateY(1px); }
  @media(max-width:360px) { .shell { padding:18px 17px 21px; border-radius:30px; } .screen { height:235px; } .wheel-wrap { width:min(82vw,290px); } }
`;

const MENU = [
  { label: "遥控器", icon: "⌘", screen: "remote" },
  { label: "应用程序", icon: "▦", screen: "apps" },
  { label: "音量", icon: "♫", screen: "volume" },
  { label: "播放信息", icon: "▶", screen: "playing" },
];

const KEYS = new Set(["up","down","left","right","ok","back","home","menu","power","playback","mute","volume_up","volume_down","source","channel_up","channel_down"]);

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[ch]));

class TclIpodCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._screen = "menu";
    this._selected = 0;
    this._appOffset = 0;
    this._signature = "";
    this.tabIndex = 0;
    this.addEventListener("keydown", this._onKeyDown);
  }

  setConfig(config) {
    if (!config?.media_player || !config?.remote) throw new Error("Set media_player and remote entity IDs");
    this._config = config;
    this._render(true);
  }

  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return 10; }
  _state(entity) { return this._hass?.states?.[entity]; }
  _apps() { return this._state(this._config?.media_player)?.attributes?.source_list ?? []; }

  _render(force = false) {
    if (!this._config || !this._hass) return;
    const player = this._state(this._config.media_player);
    const signature = JSON.stringify([player?.state, player?.attributes?.volume_level, player?.attributes?.source_list]);
    if (!force && signature === this._signature) return;
    this._signature = signature;
    const isOn = player?.state === "on";
    const volumePct = volume != null && Number.isFinite(Number(volume)) ? Math.max(0, Math.min(100, Math.round(Number(volume) * 100))) : null;
    const menu = this._screen === "menu" ? MENU : this._screen === "apps" ? this._apps().map((label) => ({ label, icon: "▸" })) : [];
    const items = this._visibleItems(menu);
    let content = "";
    if (this._screen === "menu" || this._screen === "apps") {
      const title = this._screen === "menu" ? "TCL 电视" : "应用程序";
      const subtitle = this._screen === "menu" ? "滚动点击环 · 中央键选择" : `${this._apps().length} 个已安装应用`;
      content = `<h2 class="screen-title">${title}</h2><p class="subtitle">${subtitle}</p><div class="menu-list">${items.map((item, index) => `
        <div class="menu-row ${index === this._selected - this._appOffset ? "selected" : ""}" data-row="${index}">
          <span class="row-left"><span class="row-icon">${esc(item.icon)}</span><span class="row-label">${esc(item.label)}</span></span><span class="chevron">›</span>
        </div>`).join("")}</div>`;
    } else if (this._screen === "remote") {
      content = `<h2 class="screen-title">遥控器</h2><p class="subtitle">点击触控环或使用键盘方向键</p>
        <div class="quick-row"><button class="quick" data-action="power">⏻ 电源</button><button class="quick" data-action="home">⌂ 主页</button><button class="quick" data-action="mute">静音</button></div>
        <div class="now-playing"><div class="album">⌂</div><div class="np-copy"><div class="np-title">${isOn ? "已连接" : "电视未连接"}</div><div class="np-detail">${isOn ? "触控环控制电视方向键" : "尝试网络唤醒，或用实体遥控器开机"}</div></div></div>`;
    } else if (this._screen === "volume") {
      content = `<h2 class="screen-title">音量</h2><p class="subtitle">使用触控环上 / 下调节</p><div class="volume-panel">
        <div class="volume-number">${volumePct === null ? "—" : volumePct}<small> %</small></div>
        <div class="meter"><div class="meter-fill" style="width:${volumePct ?? 0}%"></div></div>
        <div class="hint">${volumePct === null ? "音量状态暂不可用" : `音量 ${volumePct} / 100`}</div></div>`;
    } else {
      content = `<h2 class="screen-title">播放信息</h2><div class="now-playing"><div class="album">♫</div><div class="np-copy"><div class="np-title">电视已连接</div><div class="np-detail">此协议不提供当前前台 App / 播放内容查询。</div></div></div>`;
    }
    const source = this._screen === "menu" ? "主菜单" : this._screen === "apps" ? "应用程序" : this._screen === "remote" ? "遥控器" : this._screen === "volume" ? "音量" : "播放信息";
    this.shadowRoot.innerHTML = `<style>${CARD_STYLE}</style>
      <div class="shell" role="group" aria-label="TCL iPod-style remote">
        <div class="brand"><span class="brand-mark">●</span> TCL CLASSIC</div>
        <div class="screen-frame"><div class="screen">
          <div class="status"><span class="status-left"><i class="led ${isOn ? "on" : ""}"></i><span>${isOn ? "CONNECTED" : "STANDBY"}</span></span><span>${esc(source)}</span><span class="battery"><i></i></span></div>
          <div class="screen-content">${content}</div>
        </div></div>
        <div class="wheel-wrap"><div class="wheel" aria-label="Click wheel">
          <button class="wheel-key wheel-up" data-action="wheel-up" aria-label="上">⌃</button>
          <button class="wheel-key wheel-left" data-action="wheel-left" aria-label="左">‹</button>
          <button class="wheel-key wheel-right" data-action="wheel-right" aria-label="右">›</button>
          <button class="wheel-key wheel-down" data-action="wheel-down" aria-label="下">⌄</button>
          <button class="wheel-center" data-action="wheel-center" aria-label="选择">SELECT</button>
        </div><div class="wheel-hint">CLICK WHEEL · SELECT</div>
          <div class="transport"><button data-action="menu">MENU</button><button data-action="back">BACK</button><button data-action="playback">PLAY / PAUSE</button><button data-action="source">SOURCE</button></div>
        </div>
      </div>`;
    this._bind();
  }

  _visibleItems(items) {
    if (this._screen === "apps") {
      this._selected = Math.max(0, Math.min(Math.max(0, items.length - 1), this._selected));
      const start = Math.max(0, Math.min(this._selected - 2, items.length - 5));
      this._appOffset = start;
      return items.slice(start, start + 5);
    }
    this._appOffset = 0;
    return items;
  }

  _bind() {
    this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", (event) => {
      event.stopPropagation(); this._action(button.dataset.action);
    }));
    this.shadowRoot.querySelectorAll("[data-row]").forEach((row) => row.addEventListener("click", () => {
      this._selected = this._screen === "apps" ? this._appOffset + Number(row.dataset.row) : Number(row.dataset.row);
      this._select();
    }));
    const wheel = this.shadowRoot.querySelector(".wheel");
    wheel?.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      const rect = wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      this._dial = { id: event.pointerId, angle: Math.atan2(event.clientY - cy, event.clientX - cx), carry: 0, at: 0 };
      wheel.setPointerCapture(event.pointerId);
    });
    this.addEventListener("pointermove", (event) => {
      if (!this._dial || this._dial.id !== event.pointerId) return;
      const rect = wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(event.clientY - cy, event.clientX - cx);
      let delta = angle - this._dial.angle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      this._dial.angle = angle;
      this._dial.carry += delta * rect.width * 0.41;
      if (Math.abs(this._dial.carry) >= 22 && performance.now() - this._dial.at > 80) {
        this._dial.at = performance.now();
        this._action(this._dial.carry < 0 ? "wheel-up" : "wheel-down");
        this._dial.carry = 0;
      }
    });
    const stopDial = (event) => { if (this._dial?.id === event.pointerId) this._dial = null; };
    this.addEventListener("pointerup", stopDial);
    this.addEventListener("pointercancel", stopDial);
    wheel?.addEventListener("wheel", (event) => {
      event.preventDefault();
      this._action(event.deltaY < 0 ? "wheel-up" : "wheel-down");
    }, { passive: false });

  }
  _onKeyDown = (event) => {
    const map = { ArrowUp: "wheel-up", ArrowDown: "wheel-down", ArrowLeft: "wheel-left", ArrowRight: "wheel-right", Enter: "wheel-center", Escape: "menu" };
    if (map[event.key]) { event.preventDefault(); this._action(map[event.key]); }
  };

  _action(action) {
    if (action === "menu") {
      if (this._screen === "menu") this._sendKey("menu");
      else { this._screen = "menu"; this._selected = 0; this._render(true); }
      return;
    }
    if (action === "back") {
      if (this._screen !== "menu") { this._screen = "menu"; this._selected = 0; this._render(true); }
      else this._sendKey("back");
      return;
    }
    if (action === "wheel-up" || action === "wheel-down") {
      if (this._screen === "menu") this._selected = (this._selected + (action === "wheel-up" ? MENU.length - 1 : 1)) % MENU.length;
      else if (this._screen === "apps") this._selected = Math.max(0, Math.min(this._apps().length - 1, this._selected + (action === "wheel-up" ? -1 : 1)));
      else if (this._screen === "volume") this._call("media_player", action === "wheel-up" ? "volume_up" : "volume_down", { entity_id: this._config.media_player });
      else this._sendKey(action === "wheel-up" ? "up" : "down");
      this._render(true); return;
    }
    if (action === "wheel-left" || action === "wheel-right") {
      if (this._screen === "remote") this._sendKey(action === "wheel-left" ? "left" : "right");
      else if (this._screen === "apps") this._selected = Math.max(0, Math.min(this._apps().length - 1, this._selected + (action === "wheel-left" ? -1 : 1)));
      else if (this._screen === "menu") this._sendKey(action === "wheel-left" ? "left" : "right");
      this._render(true); return;
    }
    if (action === "wheel-center") { this._select(); return; }
    if (action === "power") {
      const state = this._state(this._config.media_player);
      this._call("media_player", state?.state === "on" ? "turn_off" : "turn_on", { entity_id: this._config.media_player });
      return;
    }
    if (KEYS.has(action)) this._sendKey(action);
  }

  _select() {
    if (this._screen === "menu") {
      const item = MENU[this._selected];
      if (item) { this._screen = item.screen; this._selected = 0; }
    } else if (this._screen === "apps") {
      const appName = this._apps()[this._selected];
      if (appName) this._call("media_player", "select_source", { entity_id: this._config.media_player, source: appName });
    } else if (this._screen === "remote") this._sendKey("ok");
    this._render(true);
  }

  _sendKey(command) { this._call("remote", "send_command", { entity_id: this._config.remote, command: [command] }); }
  _call(domain, service, data) { if (this._hass) this._hass.callService(domain, service, data); }
}

if (!customElements.get("tcl-ipod-card")) customElements.define("tcl-ipod-card", TclIpodCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "tcl-ipod-card", name: "TCL iPod remote", description: "A tactile, iPod-inspired remote for TCL TVs." });
