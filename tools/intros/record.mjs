// Records a project's intro video from the live demo: node record.mjs <cdp-port> <project> <out-dir>
// Needs the dev server running (SITE, default http://localhost:3000) and Chrome started with --remote-debugging-port.
// Make the whole set with tools/intros/make.sh.
// Drives the real demo through a scripted walkthrough, overlays title cards and captions, and saves
// screencast frames plus their timestamps for ffmpeg.

import { mkdirSync, writeFileSync } from 'node:fs';

const [port, project, outDir] = process.argv.slice(2);
const SITE = process.env.SITE ?? 'http://localhost:3000';
mkdirSync(`${outDir}/frames`, { recursive: true });

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const waits = new Map();
const frames = [];
let recording = false;
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waits.has(m.id)) {
    waits.get(m.id)(m);
    waits.delete(m.id);
  }
  if (m.method === 'Page.screencastFrame') {
    ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: m.params.sessionId } }));
    const md = m.params.metadata; const sig = [md.deviceWidth, md.deviceHeight, md.pageScaleFactor, md.offsetTop, md.scrollOffsetY].join(',');
    if (process.env.DEBUG && sig !== globalThis.__sig) { globalThis.__sig = sig; console.log('meta', ((Date.now() - (globalThis.__t0 ?? Date.now())) / 1000).toFixed(1), sig); }
    // Chrome sometimes drops the viewport override mid-run: discard that frame and put the override back
    if (md.deviceWidth !== 1280 || md.deviceHeight !== 720) {
      ws.send(JSON.stringify({ id: ++id, method: 'Emulation.setDeviceMetricsOverride', params: { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false } }));
      return;
    }
    if (recording) {
      const n = frames.length;
      writeFileSync(`${outDir}/frames/f${String(n).padStart(5, '0')}.jpg`, Buffer.from(m.params.data, 'base64'));
      frames.push(m.params.metadata.timestamp);
    }
  }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const js = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed');
  return r.result?.result?.value;
};

// ---------- overlay, injected into the demo viewer (the dialog is in the top layer) ----------
const OVERLAY_CSS = `
dialog.vid .dv-top, dialog.vid .dv-info, dialog.vid .dv-views, dialog.vid .dv-hint, dialog.vid .dv-foot { display: none !important; }
dialog.vid .dv-body { grid-template-columns: 1fr !important; }
dialog.vid.v-phone .dv-stage { padding: 54px 7% 54px 50% !important; }
dialog.vid.v-browser .dv-stage { padding: 64px 64px 118px !important; }
#vid-ov { position: absolute; inset: 0; z-index: 60; pointer-events: none; font-family: var(--body); color: #fff; }
#vid-brand { position: absolute; left: 40px; top: 26px; font: 600 13px/1 var(--body); letter-spacing: .26em; color: #a9a397; text-transform: uppercase; }
#vid-brand b { color: var(--signal); }
#vid-prog { position: absolute; left: 0; bottom: 0; height: 5px; width: 0; background: var(--signal); }
.vid-card { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; text-align: center; padding: 0 10%;
  background: radial-gradient(70% 50% at 50% 100%, rgba(196,154,90,.16), transparent 70%), radial-gradient(90% 80% at 50% 40%, color-mix(in oklab, var(--pc) 22%, #0e141d), #0b111b 72%); opacity: 0; transition: opacity .55s ease; }
.vid-card.on { opacity: 1; }
.vid-card .mark { display: grid; place-items: center; width: 112px; height: 112px; border-radius: 28px; background: var(--pc); color: #efe8dc; font: 400 66px/1 var(--serif); box-shadow: 0 20px 50px rgba(0,0,0,.4), inset 0 0 0 1px rgba(239,232,220,.14); }
.vid-card.on .mark { animation: vpop .8s cubic-bezier(.22,1,.36,1); }
.vid-card .kick { margin: 30px 0 0; font: 600 15px/1 var(--body); letter-spacing: .3em; text-transform: uppercase; color: var(--signal); }
.vid-card h1 { margin: 14px 0 0; font: 400 118px/1 var(--serif); letter-spacing: -.015em; color: #efe8dc; }
.vid-card p { margin: 20px 0 0; max-width: 900px; font: 400 29px/1.4 var(--body); color: #d8d1c4; }
.vid-card .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 30px; max-width: 980px; }
.vid-card .chips span { padding: 10px 18px; border-radius: 999px; border: 1px solid rgba(239,232,220,.22); color: #efe8dc; font: 500 21px/1 var(--body); }
.vid-card .points { margin: 30px 0 0; padding: 0; list-style: none; display: grid; gap: 14px; text-align: left; font: 400 24px/1.35 var(--body); color: #d8d1c4; }
.vid-card .points li::before { content: ""; display: inline-block; width: 14px; height: 1px; margin: 0 16px 7px 0; background: var(--signal); }
.vid-card .url { margin-top: 26px; padding: 14px 26px; border-radius: 999px; background: var(--signal); color: #15110a; font: 600 26px/1 var(--body); }
.vid-card.on h1, .vid-card.on p, .vid-card.on .chips, .vid-card.on .points, .vid-card.on .url, .vid-card.on .kick { animation: vrise .7s ease both; }
.vid-card.on p { animation-delay: .12s; } .vid-card.on .chips, .vid-card.on .points { animation-delay: .22s; } .vid-card.on .url { animation-delay: .3s; }
#vid-cap { position: absolute; opacity: 0; transition: opacity .35s; }
#vid-cap.on { opacity: 1; }
#vid-cap.vc-phone { left: 6%; top: 50%; width: 38%; transform: translateY(-50%); }
#vid-cap.vc-phone .n { font: 600 15px/1 var(--body); letter-spacing: .3em; color: var(--signal); }
#vid-cap.vc-phone h2 { margin: 18px 0 0; font: 400 76px/1.02 var(--serif); letter-spacing: -.01em; color: #efe8dc; }
#vid-cap.vc-phone p { margin: 20px 0 0; font: 400 25px/1.45 var(--body); color: #cfc8ba; }
#vid-cap.vc-browser { left: 50%; bottom: 26px; transform: translateX(-50%); display: flex; align-items: center; gap: 20px; padding: 14px 26px 14px 16px; border-radius: 18px;
  background: rgba(14,20,29,.95); box-shadow: 0 14px 40px rgba(0,0,0,.45), inset 0 0 0 1px rgba(239,232,220,.12); white-space: nowrap; }
#vid-cap.vc-browser .n { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--signal); color: var(--signal); font: 400 24px/1 var(--serif); letter-spacing: 0; }
#vid-cap.vc-browser h2 { margin: 0; font: 400 36px/1.1 var(--serif); color: #efe8dc; }
#vid-cap.vc-browser p { margin: 4px 0 0; font: 400 18px/1.3 var(--body); color: #cfc8ba; }
#vid-cap.swap > * { animation: vrise .5s ease both; }
.vid-tap { position: absolute; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%; border: 4px solid var(--signal); background: rgba(255,210,63,.28);
  animation: vtap .75s cubic-bezier(.22,1,.36,1) forwards; }
@keyframes vtap { from { transform: scale(.35); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
@keyframes vpop { from { transform: scale(.85); opacity: 0; } }
@keyframes vrise { from { transform: translateY(18px); opacity: 0; } }
`;

async function setup(hash, color) {
  await send('Page.navigate', { url: `${SITE}/${hash}` });
  await sleep(4000);
  await js(`(() => {
    const d = document.querySelector('dialog.demo-viewer');
    d.classList.add('vid');
    d.style.setProperty('--pc', ${JSON.stringify(color)});
    const st = document.createElement('style'); st.textContent = ${JSON.stringify(OVERLAY_CSS)}; document.head.appendChild(st);
    const ov = document.createElement('div'); ov.id = 'vid-ov';
    ov.innerHTML = '<div id="vid-brand">Kanav Khera · <b>project intro</b></div><div id="vid-cap"></div><div class="vid-card" id="vid-card"></div><div id="vid-prog"></div>';
    d.appendChild(ov);
  })()`);
  // Load every view's code once, so switching views mid-video never shows a loading screen
  await js(`(async () => { const bs = [...document.querySelectorAll('.dv-views button')]; for (const b of bs) { b.click(); await new Promise((r) => setTimeout(r, 1200)); } bs[0]?.click(); })()`);
  await sleep(1500);
}

const layout = (mode) => js(`(() => { const d = document.querySelector('dialog.demo-viewer'); d.classList.toggle('v-phone', ${JSON.stringify(mode)} === 'phone'); d.classList.toggle('v-browser', ${JSON.stringify(mode)} === 'browser'); })()`);
const card = (html) => js(`(() => { const c = document.getElementById('vid-card'); c.innerHTML = ${JSON.stringify(html)}; c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); })()`);
const hideCard = () => js(`document.getElementById('vid-card').classList.remove('on')`);
const caption = (mode, n, title, sub) =>
  js(`(() => { const c = document.getElementById('vid-cap'); c.className = 'vc-' + ${JSON.stringify(mode)};
    c.innerHTML = '<div class="n">' + ${JSON.stringify(mode === 'phone' ? `STEP 0${n}` : String(n))} + '</div><div><h2>' + ${JSON.stringify(title)} + '</h2><p>' + ${JSON.stringify(sub)} + '</p></div>';
    void c.offsetWidth; c.classList.add('on', 'swap'); })()`);
const hideCaption = () => js(`document.getElementById('vid-cap').classList.remove('on')`);

/** Show a tap ring on the element, then click it. `scope` is a selector inside the dialog; `text` narrows by text. */
async function tap(sel, text, { delay = 260, filter = 'true' } = {}) {
  const r = await js(`(() => {
    const d = document.querySelector('dialog.demo-viewer');
    const els = [...d.querySelectorAll(${JSON.stringify(sel)})].filter((e) => (${text ? `e.textContent.includes(${JSON.stringify(text)}) || e.getAttribute('aria-label')?.includes(${JSON.stringify(text)})` : 'true'}) && (${filter}));
    const el = els[0]; if (!el) return null;
    const b = el.getBoundingClientRect(); const o = document.getElementById('vid-ov').getBoundingClientRect();
    const ring = document.createElement('i'); ring.className = 'vid-tap'; ring.style.left = (b.left + b.width / 2 - o.left) + 'px'; ring.style.top = (b.top + b.height / 2 - o.top) + 'px';
    document.getElementById('vid-ov').appendChild(ring); setTimeout(() => ring.remove(), 900);
    window.__vidTarget = el; return true; })()`);
  if (!r) throw new Error(`tap target missing: ${sel} ${text ?? ''}`);
  await sleep(delay);
  await js(`window.__vidTarget.click()`);
}

/** Type into an input or textarea a character at a time, then submit its form */
async function typeIn(sel, text, { cps = 28, submit = true } = {}) {
  for (let i = 1; i <= text.length; i++) {
    await js(`(() => { const t = document.querySelector('dialog.demo-viewer').querySelector(${JSON.stringify(sel)});
      const proto = t.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(t, ${JSON.stringify(text)}.slice(0, ${i})); t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(1000 / cps);
  }
  if (submit) {
    await sleep(250);
    await js(`document.querySelector('dialog.demo-viewer').querySelector(${JSON.stringify(sel)}).closest('form').requestSubmit()`);
  }
}
const view = (label) => js(`[...document.querySelectorAll('.dv-views button')].find((b) => b.textContent.includes(${JSON.stringify(label)})).click()`);
const scrollEnd = (sel) => js(`(() => { const el = document.querySelector('dialog.demo-viewer').querySelector(${JSON.stringify(sel)}); el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); })()`);

const titleCard = (p) => `<div class="mark">${p.mark}</div><p class="kick">${p.kicker}</p><h1>${p.name}</h1><p>${p.tagline}</p>`;
const stackCard = (p) => `<p class="kick">How it’s built</p><div class="chips">${p.stack.map((s) => `<span>${s}</span>`).join('')}</div><ul class="points">${p.points.map((s) => `<li>${s}</li>`).join('')}</ul>`;
const endCard = (p) => `<div class="mark">${p.mark}</div><h1>Try it yourself</h1><p>A working copy of ${p.name} runs right on my portfolio. No install, no sign-up.</p><div class="url">Portfolio → Demo → ${p.name}</div><p style="font-size:22px">Kanav Khera · knvkhera30@gmail.com</p>`;

// ---------- the three walkthroughs ----------
const PROJECTS = {
  nearmed: {
    hash: '#demo/nearmed', color: '#5d4c86', mark: 'N', name: 'NearMed', kicker: 'Health · Android app + store website',
    tagline: 'Snap a prescription. Nearby pharmacies send their price. You have 90 seconds to say yes.',
    stack: ['React Native (Expo)', 'Next.js 16', 'FastAPI', 'PostgreSQL', 'Claude prescription reader'],
    points: ['A race-safe price queue: row locks, no timers', 'Encrypted photos, 2FA, row-level security', 'Stores never see the customer until they accept'],
    async run() {
      await layout('phone');
      await caption('phone', 1, 'Snap a prescription', 'Take a photo and send it to every pharmacy nearby.');
      await sleep(1300);
      await tap('button', 'Upload prescription');
      await sleep(1300);
      await tap('button', 'Take photo');
      await sleep(1500);
      await tap('button', 'Send to stores');
      await sleep(900);
      await caption('phone', 2, 'Stores send their price', 'One price at a time, from the nearest pharmacies.');
      await sleep(4600);
      await caption('phone', 3, '90 seconds to say yes', 'Accept it, or see the next store’s price.');
      await sleep(2600);
      await tap('button', 'Yes, order this');
      await sleep(2000);
      await tap('button', 'See my orders');
      await sleep(2600);
      await hideCaption();
      await layout('browser');
      await view('store website');
      await sleep(600);
      await caption('browser', 4, 'Pharmacists price it on the web', 'AI drafts the medicines; every line is checked against the photo.');
      await sleep(1600);
      await tap('button', 'Price it');
      await sleep(1600);
      for (let i = 0; i < 3; i++) {
        await tap('label', 'Checked against the photo', { delay: 220, filter: '!e.querySelector("input").checked' });
        await sleep(650);
      }
      await tap('button', 'Send quote');
      await sleep(2600);
    },
  },
  parkassist: {
    hash: '#demo/parkassist', color: '#2f6b86', mark: 'P', name: 'ParkAssist', kicker: 'Mobility · Android app',
    tagline: 'Someone’s car is blocking yours? Scan its QR sticker and call the owner in one tap.',
    stack: ['React Native', 'Node.js + Express', 'MongoDB', 'JWT + rotating refresh', 'Gemini 2.5 Flash (SSE)'],
    points: ['Rate-limited public scans, so counts can’t be faked', 'Keys stay on the server, never in the app', 'ParcoAI answers in a fixed four-part legal format'],
    async run() {
      await layout('phone');
      await caption('phone', 1, 'A QR sticker for your car', 'Generate a code linked to your number and stick it on the dashboard.');
      await sleep(1300);
      await tap('button', 'View & Download');
      await sleep(2800);
      await tap('button', 'Back');
      await sleep(700);
      await caption('phone', 2, 'Blocked in? Scan it', 'Anyone can scan the sticker and reach the owner instantly.');
      await sleep(900);
      await tap('button', 'Scan QR');
      await sleep(1700);
      await tap('button', 'QR sticker');
      await sleep(1700);
      await tap('button', 'Call Now');
      await sleep(1800);
      await tap('button', 'Close scanner');
      await sleep(600);
      await caption('phone', 3, 'Every scan reaches the owner', 'Scans are logged and counted on their home screen.');
      await scrollEnd('main');
      await sleep(3000);
      await js(`document.querySelector('dialog.demo-viewer main').scrollTo({ top: 0, behavior: 'smooth' })`);
      await sleep(500);
      await caption('phone', 4, 'ParcoAI knows the rules', 'Describe a parking situation; get the verdict and the challan risk.');
      await sleep(900);
      await tap('button', 'Ask AI');
      await sleep(1300);
      await tap('button', 'yellow-painted kerb');
      await sleep(4600);
    },
  },
  saarag: {
    hash: '#demo/saarag', color: '#3a3d42', mark: 'S', name: 'Saarag', kicker: 'AI · RAG SaaS · web + mobile',
    tagline: 'Your company’s knowledge, answered with sources, and only from what your role can see.',
    stack: ['React 19 + Vite', 'React Native (Expo)', 'FastAPI', 'Postgres + pgvector', 'Hybrid search + rerank', 'Claude / Gemini'],
    points: ['Permissions enforced on the server, from the token', 'Below the relevance gate, the LLM is never called', 'Every query traced for quality and evals'],
    async run() {
      await layout('browser');
      await caption('browser', 1, 'Answers from your own documents', 'Every answer cites the policy it came from.');
      await sleep(1200);
      await tap('button', 'How many sick leaves', { filter: '!e.closest("ul")' });
      await sleep(3600);
      await tap('button', 'leave_policy.txt');
      await sleep(2400);
      await tap('aside button[aria-label="Close"]');
      await sleep(500);
      await caption('browser', 2, 'Honest when it can’t answer', 'Outside your access? It says so, and tells you who to ask.');
      await typeIn('textarea', 'What’s the lockout procedure before servicing a forklift?', { cps: 34 });
      await sleep(3200);
      await caption('browser', 3, 'Admins decide who sees what', 'Roles grant modules. Change access in one click.');
      await view('admin console');
      await sleep(900);
      await tap('nav button', 'Roles');
      await sleep(1300);
      await tap('label', 'Floor Operations');
      await sleep(900);
      await tap('button', 'Save access');
      await sleep(2300);
      await hideCaption();
      await layout('phone');
      await view('mobile app');
      await sleep(500);
      await caption('phone', 4, 'Same chats on the phone', 'Sign in with the same account. Now the forklift answer is there.');
      await sleep(1000);
      await tap('button[type=submit]', 'Sign in');
      await sleep(1500);
      await typeIn('input[aria-label=Question]', 'Lockout procedure for a forklift?', { cps: 30 });
      await sleep(4200);
      await tap('button', 'Open navigation');
      await sleep(2400);
    },
  },
};

const p = PROJECTS[project];
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false });
await send('Page.enable');
await setup(p.hash, p.color);
await card(titleCard(p));
await sleep(600);

recording = true;
const t0 = Date.now();
globalThis.__t0 = t0;
if (process.env.MODE !== 'shots') await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
const grab = (async () => {
  while (recording && process.env.MODE === 'shots') {
    const ts = Date.now() / 1000;
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86, optimizeForSpeed: true });
    if (!shot.result?.data) continue;
    writeFileSync(`${outDir}/frames/f${String(frames.length).padStart(5, '0')}.jpg`, Buffer.from(shot.result.data, 'base64'));
    frames.push(ts);
  }
})();
await sleep(3600);
await hideCard();
await sleep(500);
await p.run();
await hideCaption();
await card(stackCard(p));
await sleep(4200);
await card(endCard(p));
await sleep(3800);
recording = false;
await grab;
if (process.env.MODE !== 'shots') await send('Page.stopScreencast');
const total = (Date.now() - t0) / 1000;

// ffconcat with each frame's real duration
const lines = ['ffconcat version 1.0'];
frames.forEach((ts, i) => {
  const next = frames[i + 1] ?? frames[0] + total;
  lines.push(`file 'frames/f${String(i).padStart(5, '0')}.jpg'`, `duration ${Math.max(0.001, next - ts).toFixed(4)}`);
});
lines.push(`file 'frames/f${String(frames.length - 1).padStart(5, '0')}.jpg'`);
writeFileSync(`${outDir}/frames.ffconcat`, lines.join('\n'));
writeFileSync(`${outDir}/meta.json`, JSON.stringify({ frames: frames.length, seconds: total }));
console.log(`${project}: ${frames.length} frames over ${total.toFixed(1)}s`);
ws.close();
process.exit(0);
