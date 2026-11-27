// The landing story's animation engine. Chapters scroll as ordinary page content; the one being read sets a scene on a
// 1200×720 world (on a pinned stage) that a camera pans and zooms through, and runs that scene's packets and timers.
// Elements are found by data-ref; class names come from the CSS module. startStory returns a cleanup function.

type Styles = Record<string, string>;
type Point = [number, number];
type Packet = { el: HTMLElement; segs: { x0: number; y0: number; x1: number; y1: number; len: number; at: number }[]; total: number; d: number; speed: number; done?: () => void };

const CAMS: Record<string, [number, number, number]> = {
  intro: [600, 380, 1], phone: [470, 340, 1.38], request: [620, 380, 1], server: [1000, 380, 1.3],
  limit: [620, 380, 1], scale: [690, 380, 0.96], stack: [640, 360, 0.94], resume: [600, 360, 1], demos: [600, 360, 1],
};
const BOARD = ['4+ YEARS', '5,000+ USERS', '4 MENTEES', '3 LIVE DEMOS'];
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+,';
const PHONE: Point = [380, 360], GATE_IN: Point = [555, 360], GATE_OUT: Point = [725, 360], SRV: Point = [900, 360];
const MINIS: Point[] = [[234, 179], [234, 319], [234, 459], [234, 599]];
const INST: Point[] = [[860, 174], [860, 289], [860, 404], [860, 519]];

export function startStory(root: HTMLElement, s: Styles): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ref = <T extends HTMLElement = HTMLElement>(name: string) => root.querySelector<T>(`[data-ref="${name}"]`)!;
  const refs = <T extends HTMLElement = HTMLElement>(name: string) => [...root.querySelectorAll<T>(`[data-ref="${name}"]`)];
  const cleanups: (() => void)[] = [];
  const listen = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    addEventListener(type, fn, opts);
    cleanups.push(() => removeEventListener(type, fn, opts));
  };
  const on = (el: HTMLElement, type: string, fn: (e: Event) => void) => {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  };

  const world = ref('world'), cam = ref('cam'), fit = ref('fit'), pktLayer = ref('pkts'), ui = ref('ui'), stage = ref('stage');
  const nav = root.querySelector('header')!;
  const chapters = refs('chapter');
  const N = chapters.length;
  // Phones and tablets held upright: the stage is pinned above the text instead of beside it (matches the CSS)
  const stacked = matchMedia('(max-width: 1000px) and (min-height: 540px)');

  // ---------- split-flap stats board ----------
  const cellsEl = ref('cells');
  const W = 12;
  cellsEl.innerHTML = `<span class="${s.cell}"></span>`.repeat(W);
  const cells = [...cellsEl.children] as HTMLElement[];
  const flips: number[] = [];
  function flipTo(text: string) {
    const t = text.padEnd(W, ' ').slice(0, W);
    cells.forEach((c, i) => {
      if (reduce) { c.textContent = t[i]; return; }
      let n = 0;
      const spin = window.setInterval(() => {
        n++;
        c.textContent = n > 6 + i ? t[i] : FLAP[Math.floor(Math.random() * FLAP.length)];
        if (n > 6 + i) clearInterval(spin);
      }, 45);
      flips.push(spin);
    });
  }
  let bi = 0;
  flipTo(BOARD[0]);
  const boardTimer = window.setInterval(() => flipTo(BOARD[(bi = (bi + 1) % BOARD.length)]), 4200);
  cleanups.push(() => { clearInterval(boardTimer); flips.forEach(clearInterval); });

  // ---------- fit the world into the stage; the camera ----------
  function resize() {
    const r = fit.getBoundingClientRect();
    // On a narrow stage, zoom a little past the width (the camera keeps the action centred) so it reads on a phone
    const k = Math.min((r.width / 1200) * (stacked.matches ? 1.24 : 1), r.height / 720);
    const y = stacked.matches ? Math.max(0, (r.height - 720 * k) * 0.32) : (r.height - 720 * k) / 2;
    world.style.transform = `translate(${(r.width - 1200 * k) / 2}px, ${y}px) scale(${k})`;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(fit);
  cleanups.push(() => ro.disconnect());
  resize();
  const camera = (scene: string) => { const [cx, cy, k] = CAMS[scene]; cam.style.transform = `translate(${600 - k * cx}px, ${360 - k * cy}px) scale(${k})`; };

  // ---------- packets ----------
  const packets = new Set<Packet>();
  function send(points: Point[], { cls = '', speed = 520, label = '', done }: { cls?: string; speed?: number; label?: string; done?: () => void } = {}) {
    const el = document.createElement('div');
    el.className = [s.pkt, ...cls.split(' ').filter(Boolean).map((c) => s[c])].join(' ');
    if (label) { const l = document.createElement('span'); l.className = s['pkt-label']; l.textContent = label; el.appendChild(l); }
    pktLayer.appendChild(el);
    const segs: Packet['segs'] = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1], [x1, y1] = points[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      segs.push({ x0, y0, x1, y1, len, at: total });
      total += len;
    }
    const p: Packet = { el, segs, total, d: 0, speed: reduce ? speed * 2 : speed, done };
    packets.add(p);
    place(p);
  }
  function place(p: Packet) {
    const g = p.segs.find((x) => p.d <= x.at + x.len) ?? p.segs[p.segs.length - 1];
    const t = g.len ? Math.min(1, (p.d - g.at) / g.len) : 1;
    p.el.style.transform = `translate(${g.x0 + (g.x1 - g.x0) * t}px, ${g.y0 + (g.y1 - g.y0) * t}px)`;
  }
  let last = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const p of packets) {
      p.d += p.speed * dt;
      if (p.d >= p.total) { packets.delete(p); p.el.remove(); p.done?.(); } else place(p);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  cleanups.push(() => cancelAnimationFrame(raf));

  // ---------- scene timers ----------
  let timers: number[] = [];
  let token = 0;
  const later = (ms: number, fn: () => void) => { const t = window.setTimeout(fn, ms); timers.push(t); };
  const every = (ms: number, fn: () => void) => { const t = window.setInterval(fn, ms); timers.push(t); };
  function stopScene() {
    timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    timers = [];
    for (const p of packets) p.el.remove();
    packets.clear();
    token++;
  }
  cleanups.push(stopScene);
  const flash = (el: HTMLElement) => { el.classList.remove(s.flash); void el.offsetWidth; el.classList.add(s.flash); };
  const gatebox = ref('gatebox');

  function intro() {
    const beat = () => send([PHONE, SRV], { cls: 'small', speed: 380, done: () => send([SRV, PHONE], { cls: 'res small', speed: 380 }) });
    later(1200, beat);
    every(2400, beat);
  }

  // ---------- inside the phone: screens and the frame-time meter ----------
  const fpsBox = ref('fps'), fpsC = ref<HTMLCanvasElement>('fps-canvas'), fctx = fpsC.getContext('2d')!, fpsNum = ref('fps-num');
  const frames = Array.from({ length: 46 }, () => 14 + Math.random() * 2.2);
  function drawFps() {
    const w = fpsC.width, h = fpsC.height, y16 = h - (16.7 / 34) * h;
    fctx.clearRect(0, 0, w, h);
    fctx.strokeStyle = 'rgba(239,232,220,.25)'; fctx.setLineDash([6, 6]); fctx.lineWidth = 2;
    fctx.beginPath(); fctx.moveTo(0, y16); fctx.lineTo(w, y16); fctx.stroke(); fctx.setLineDash([]);
    fctx.fillStyle = 'rgba(169,163,151,.9)'; fctx.font = '20px ui-monospace, monospace'; fctx.fillText('16.7 ms', 6, y16 - 6);
    const bw = w / frames.length;
    frames.forEach((ms, i) => { const bh = (ms / 34) * h; fctx.fillStyle = ms > 16.7 ? '#c0684b' : '#7fa287'; fctx.fillRect(i * bw + 2, h - bh, bw - 4, bh); });
  }
  function phone(sub: string) {
    ui.dataset.screen = sub === 'ui' ? 'ring' : sub === 'native' ? 'scan' : 'orders';
    ui.classList.toggle(s.offline, sub === 'offline');
    fpsBox.classList.toggle(s.on, sub === 'native');
    if (sub !== 'native') return;
    drawFps();
    every(reduce ? 600 : 120, () => {
      frames.shift();
      frames.push(Math.random() < 0.04 ? 18 + Math.random() * 4 : 13.5 + Math.random() * 2.6);
      drawFps();
      const avg = frames.slice(-20).reduce((a, b) => a + b, 0) / 20;
      fpsNum.textContent = `${Math.min(60, Math.round(1000 / avg))} fps`;
    });
  }

  // ---------- one request, end to end ----------
  const code = ref('code'), rows = refs('row'), placeBtn = ref('place'), toast = ref('toast'), orders = ref('orders');
  let orderNo = 1043;
  const REQ = () => `<span class="${s.k}">POST</span> /api/orders  HTTP/2\nauthorization: Bearer eyJhbGciOi…\n{ "storeId": 42, "items": [{ "sku": "DOLO-650", "qty": 2 }] }`;
  const RES = (n: number) => `<span class="${s.ok}">201 Created</span>  · 16 ms\n{ "id": ${n}, "status": "placed", "eta": "30 min" }`;
  function typeInto(html: string, my: number) {
    if (reduce) { code.innerHTML = html; return; }
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent ?? '';
    let i = 0;
    const tick = () => { if (my !== token) return; i += 3; code.textContent = text.slice(0, i); if (i < text.length) later(16, tick); else code.innerHTML = html; };
    tick();
  }
  function roundTrip(slow: boolean) {
    const my = token, n = orderNo++;
    placeBtn.classList.remove(s.tap); void placeBtn.offsetWidth; placeBtn.classList.add(s.tap);
    toast.classList.remove(s.on);
    rows.forEach((r) => r.classList.remove(s.on, s.done));
    typeInto(REQ(), my);
    send([PHONE, GATE_IN], { label: 'POST /orders', speed: 420, done: () => {
      if (my !== token) return;
      flash(gatebox);
      send([GATE_OUT, SRV], { speed: 420, done: () => {
        if (my !== token) return;
        const stepMs = slow ? 420 : 230;
        rows.forEach((_, i) => later(i * stepMs, () => { rows.forEach((x, j) => x.classList.toggle(s.on, j === i)); if (i) rows[i - 1].classList.add(s.done); }));
        later(rows.length * stepMs, () => {
          rows.forEach((r) => { r.classList.remove(s.on); r.classList.add(s.done); });
          typeInto(RES(n), my);
          send([SRV, GATE_OUT, GATE_IN, PHONE], { cls: 'res', label: '201', speed: 520, done: () => {
            if (my !== token) return;
            toast.innerHTML = `Order <b>#${n}</b> placed · 201 Created`;
            toast.classList.add(s.on);
            const row = document.createElement('div');
            row.className = `${s.order} ${s.new}`;
            row.innerHTML = `<i class="${s.av}"></i><div><b>Sunrise Pharmacy</b><span>2 items · ₹62</span></div><em class="${s.st}">placed</em>`;
            orders.prepend(row);
            while (orders.children.length > 3) orders.lastElementChild!.remove();
            later(1800, () => toast.classList.remove(s.on));
          } });
        });
      } });
    } });
  }
  function request(slow: boolean) {
    ui.dataset.screen = 'orders';
    ui.classList.remove(s.offline);
    roundTrip(slow);
    every(slow ? 7600 : 6400, () => roundTrip(slow));
  }

  // ---------- rate limiting: a token bucket at the gateway ----------
  const bucket = ref('bucket'), CAP = 10;
  bucket.innerHTML = '<i></i>'.repeat(CAP);
  const dots = [...bucket.children] as HTMLElement[], minis = refs('mini');
  const okEl = ref('ok-n'), errEl = ref('err-n');
  let tokens = CAP, okN = 0, errN = 0, rate = 4;
  const drawBucket = () => dots.forEach((d, i) => d.classList.toggle(s.empty, i >= Math.floor(tokens)));
  const pulse = (el: HTMLElement, cls: string) => { el.classList.add(s[cls]); later(500, () => el.classList.remove(s[cls])); };
  function limited() {
    const my = token, m = Math.floor(Math.random() * 4);
    send([MINIS[m], GATE_IN], { cls: 'small', speed: 560, done: () => {
      if (my !== token) return;
      if (tokens >= 1) {
        tokens -= 1; okN++; okEl.textContent = String(okN); drawBucket(); flash(gatebox);
        send([GATE_OUT, SRV], { cls: 'small', speed: 600, done: () => { if (my === token) send([SRV, GATE_OUT, GATE_IN, MINIS[m]], { cls: 'res small', speed: 700, done: () => pulse(minis[m], 'got') }); } });
      } else {
        errN++; errEl.textContent = String(errN);
        send([GATE_IN, MINIS[m]], { cls: 'err', label: '429', speed: 520, done: () => pulse(minis[m], 'hit429') });
      }
    } });
  }
  function limit() {
    tokens = CAP; drawBucket();
    let acc = 0;
    every(100, () => {
      tokens = Math.min(CAP, tokens + 0.2); drawBucket(); // refills 2 tokens a second
      acc += rate / 10;
      while (acc >= 1) { acc -= 1; limited(); }
    });
  }
  on(ref('burst'), 'click', () => { for (let i = 0; i < 30; i++) later(i * 40, limited); });
  const rateIn = ref<HTMLInputElement>('rate'), rateV = ref('rate-v');
  on(rateIn, 'input', () => { rate = +rateIn.value; rateV.textContent = `${rate} req/s`; });

  // ---------- scaling out ----------
  const insts = refs('inst'), instWires = refs('winst'), logEl = ref('log');
  const instN = ref('inst-n'), p95El = ref('p95'), rpsEl = ref('rps');
  let active = 1, rr = 0, traffic = 6, hot = 0, cool = 0;
  function log(msg: string) {
    const d = document.createElement('div');
    const t = new Date();
    d.textContent = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}  ${msg}`;
    logEl.prepend(d);
    while (logEl.children.length > 3) logEl.lastElementChild!.remove();
  }
  function setActive(n: number) {
    active = n;
    insts.forEach((el, i) => el.classList.toggle(s.up, i < n));
    instWires.forEach((w, i) => w.classList.toggle(s.up, i < n));
    instN.textContent = String(n);
  }
  function scaled() {
    const my = token, m = Math.floor(Math.random() * 4), i = rr++ % active, [ix, iy] = INST[i];
    const out: Point = [ix + 170, iy];
    send([MINIS[m], GATE_IN], { cls: 'small', speed: 640, done: () => {
      if (my !== token) return;
      send([GATE_OUT, INST[i]], { cls: 'small', speed: 640, done: () => {
        if (my !== token) return;
        const back = () => send([INST[i], GATE_OUT, GATE_IN, MINIS[m]], { cls: 'res small', speed: 780 });
        const r = Math.random();
        if (r < 0.45) send([out, [1060, 203]], { cls: 'small', speed: 700, done: () => { if (my === token) send([[1060, 203], out], { cls: 'res small', speed: 800, done: back }); } });
        else send([out, [1060, 475]], { cls: 'small', speed: 600, done: () => { if (my === token) send([[1060, 475], out], { cls: 'res small', speed: 700, done: back }); } });
        if (r > 0.85) send([[945, iy + 44], [945, 640]], { cls: 'job', speed: 260 });
      } });
    } });
  }
  const normalBtn = ref('normal'), spikeBtn = ref('spike');
  function setMode(spike: boolean, quiet = false) {
    traffic = spike ? 30 : 6;
    normalBtn.setAttribute('aria-pressed', String(!spike));
    spikeBtn.setAttribute('aria-pressed', String(spike));
    if (!quiet) log(spike ? 'traffic spike: 30 req/s' : 'traffic back to normal: 6 req/s');
  }
  on(normalBtn, 'click', () => setMode(false));
  on(spikeBtn, 'click', () => setMode(true));
  function scale() {
    setActive(1); setMode(false, true); hot = cool = 0;
    let acc = 0;
    every(100, () => { acc += traffic / 10; while (acc >= 1) { acc -= 1; scaled(); } });
    every(700, () => {
      const cpu = traffic / (active * 9);
      insts.forEach((el, i) => {
        const bar = el.querySelector<HTMLElement>('[data-ref="cpu"]')!, share = i < active ? Math.min(1, cpu) : 0;
        bar.style.width = `${Math.round(share * 100)}%`;
        bar.classList.toggle(s.hot, share > 0.8);
        el.querySelector('p')!.textContent = `${i < active ? Math.round(traffic / active) : 0} req/s`;
      });
      const p95 = Math.round(42 + Math.max(0, cpu - 0.55) * 900);
      p95El.textContent = `${p95} ms`;
      p95El.classList.toggle(s.bad, p95 > 300);
      rpsEl.textContent = String(traffic);
      if (cpu > 0.8) { hot++; cool = 0; } else if (cpu < 0.35) { cool++; hot = 0; } else { hot = cool = 0; }
      if (hot >= 3 && active < 4) { setActive(active + 1); hot = 0; log(`p95 ${p95} ms > 300 ms → added API · ${active}`); }
      if (cool >= 6 && active > 1) { log(`load is low → removed API · ${active}`); setActive(active - 1); cool = 0; }
    });
  }

  // ---------- the whole stack ----------
  function stack() {
    const loop = () => {
      const my = token;
      const ok = (fn: () => void) => () => { if (my === token) fn(); };
      send([PHONE, GATE_IN], { cls: 'small', done: ok(() => send([GATE_OUT, [900, 330]], { cls: 'small', done: ok(() => send([[1000, 520], [1060, 545]], { cls: 'small', done: ok(() => send([[1060, 545], [1000, 520]], { cls: 'res small', done: ok(() => send([[900, 330], GATE_OUT, GATE_IN, PHONE], { cls: 'res small' })) })) })) })) });
      later(700, ok(() => send([[265, 108], GATE_IN], { cls: 'small' })));
    };
    loop();
    every(2600, loop);
  }

  // ---------- chapters ----------
  const ticksEl = ref('ticks'), prog = ref('prog'), mprog = ref('mprog'), mnum = ref('mnum'), mlabel = ref('mlabel'), mchip = ref('mchip'), gateTitle = ref('gate-title'), gateSub = ref('gate-sub');
  const huds = refs('hud'), ovResume = ref('ov-resume'), ovDemos = ref('ov-demos'), navLinks = refs('navlink');
  const HUD: Record<string, string> = { request: 'request', server: 'request', limit: 'limit', scale: 'scale' };
  const SCENES: Record<string, (sub: string) => void> = { intro, phone, request: () => request(false), server: () => request(true), limit, scale, stack };
  const ticks = chapters.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = s.tick;
    b.innerHTML = `<i></i><span>${c.dataset.label}</span>`;
    b.setAttribute('aria-label', `Chapter ${i + 1}: ${c.dataset.label}`);
    b.addEventListener('click', () => go(i));
    ticksEl.appendChild(b);
    return b;
  });
  cleanups.push(() => ticks.forEach((t) => t.remove()));

  let current = -1;
  function setChapter(i: number) {
    if (i === current) return;
    const prev = chapters[current];
    current = i;
    const c = chapters[i], scene = c.dataset.scene!, sub = c.dataset.sub ?? '';
    mnum.textContent = `${String(i + 1).padStart(2, '0')} / ${N}`;
    mlabel.textContent = c.dataset.label ?? '';
    mchip.style.setProperty('--cc', c.style.getPropertyValue('--cc'));
    ticks.forEach((t, j) => { t.classList.toggle(s.on, j === i); t.classList.toggle(s.done, j < i); });
    world.dataset.scene = scene;
    world.dataset.sub = sub;
    camera(scene);
    huds.forEach((h) => h.classList.toggle(s.on, h.dataset.hud === HUD[scene]));
    ovResume.classList.toggle(s.on, scene === 'resume');
    ovDemos.classList.toggle(s.on, scene === 'demos');
    // On phones the career log and demo cards get the whole screen: the pinned stage slides up out of the way
    stage.classList.toggle(s.away, scene === 'resume' || scene === 'demos');
    navLinks.forEach((a) => a.classList.toggle(s.on, a.dataset.scene === scene));
    const sceneChanged = !prev || prev.dataset.scene !== scene;
    if (!sceneChanged && scene !== 'phone') return;
    stopScene();
    fpsBox.classList.remove(s.on);
    SCENES[scene]?.(sub);
    gateTitle.textContent = scene === 'scale' ? 'Load balancer' : 'API gateway';
    gateSub.textContent = scene === 'scale' ? 'round robin · health checks' : 'HTTPS · JWT · limits';
    bucket.hidden = scene !== 'limit';
    if (!['phone', 'request', 'server'].includes(scene)) { ui.dataset.screen = 'orders'; ui.classList.remove(s.offline); }
  }

  // Native vertical scroll. The reading line is the middle of the text area: the viewport below the nav on desktop,
  // the space under the pinned stage on phones (its layout height, not its on-screen rect, so sliding the stage away
  // never moves the line). The chapter the line falls inside sets the scene; text fades with its distance from it.
  const textTop = () => nav.offsetHeight + (stacked.matches ? stage.offsetHeight : 0);
  const line = () => (textTop() + innerHeight) / 2;
  function fromScroll() {
    const L = line(), fade = innerHeight * 0.38;
    const rects = chapters.map((ch) => ch.getBoundingClientRect());
    let i = rects.findIndex((r) => L >= r.top && L < r.bottom);
    if (i < 0) i = L < rects[0].top ? 0 : N - 1;
    const frac = Math.min(1, Math.max(0, (L - rects[i].top) / rects[i].height));
    const pos = Math.min(N - 1, Math.max(0, i + frac - 0.5));
    chapters.forEach((ch, j) => {
      const r = rects[j], d = L < r.top ? r.top - L : L > r.bottom ? L - r.bottom : 0;
      ch.style.opacity = String(Math.max(0.12, 1 - d / fade));
    });
    prog.style.height = `${(pos / (N - 1)) * Math.max(0, ticksEl.offsetHeight - 28)}px`;
    mprog.style.width = `${(pos / (N - 1)) * 100}%`;
    setChapter(i);
  }
  // Scroll chapter i to the reading line: centred if it fits the text area, otherwise its top just under it. On phones
  // the stage slides away for the career log and demos, so those land just under the nav
  function go(i: number) {
    const k = Math.max(0, Math.min(N - 1, i));
    const r = chapters[k].getBoundingClientRect(), room = innerHeight - textTop();
    const freed = stacked.matches && ['resume', 'demos'].includes(chapters[k].dataset.scene!);
    // (a short freed chapter still sits low enough that the reading line falls inside it)
    const y = freed ? r.top - Math.max(nav.offsetHeight + 8, line() - r.height + 40) : r.height <= room ? r.top + r.height / 2 - line() : r.top - textTop();
    scrollTo({ top: Math.max(0, scrollY + y), behavior: reduce ? 'auto' : 'smooth' });
  }
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; fromScroll(); }); } };
  const relayout = () => { resize(); onScroll(); };
  listen('scroll', onScroll, { passive: true });
  listen('resize', relayout);
  stacked.addEventListener('change', relayout);
  cleanups.push(() => stacked.removeEventListener('change', relayout));
  on(ref('prev'), 'click', () => go(current - 1));
  on(ref('next'), 'click', () => go(current + 1));
  root.querySelectorAll<HTMLElement>('[data-go]').forEach((a) => on(a, 'click', (e) => { e.preventDefault(); go(+a.dataset.go!); }));
  fromScroll();
  if (current < 0) setChapter(0);

  return () => cleanups.forEach((fn) => fn());
}
