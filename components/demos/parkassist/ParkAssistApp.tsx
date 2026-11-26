'use client';

// ParkAssist, recreated on sample data. Layout, copy and colours follow the React Native app
// (parcoAssitBack: Home, QR view, Scan, Profile) and the ParcoAI answer format from parkbackend.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import s from './parkassist.module.css';

const OWNER = { name: 'Kanav Khera', phone: '9876543210', email: 'kanav@example.com' };
const MIN = 60_000;

type Scan = { at: number };
type Overlay = null | 'qr' | 'generate' | 'scan' | 'ai' | 'vehicles';

// ---------- Icons (lucide-style strokes, as in the app) ----------
const PATHS: Record<string, ReactNode> = {
  car: <><path d="M5 17h14M6 17v2M18 17v2M4 13l2-5h12l2 5v4H4z" /><circle cx="8" cy="14.5" r=".6" /><circle cx="16" cy="14.5" r=".6" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2" /></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" /></>,
  home: <><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M15 5l-7 7 7 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>,
  print: <><path d="M7 9V4h10v5M7 17H5v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6h-2M7 14h10v6H7z" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  flash: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01" /></>,
  logout: <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h10" />,
  send: <path d="M4 12 20 4l-6 16-3-7z" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
};

function Icon({ name, size = 20 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg className={s.icon} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// ---------- A QR-style pattern, seeded from the phone number (decorative: the real app renders a scannable code) ----------
function QrArt({ seed, size = 168 }: { seed: string; size?: number }) {
  const cells = useMemo(() => {
    const n = 25;
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 13), 1274126177)), ((h >>> 0) % 1000) / 1000);
    const finder = (x: number, y: number) => {
      for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
        const dx = x - fx, dy = y - fy;
        if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
          if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return 0;
          const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
          return ring === 1 ? 0 : 1;
        }
      }
      return -1;
    };
    const out: [number, number][] = [];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const f = finder(x, y);
        if (f === 1 || (f === -1 && rnd() > 0.52)) out.push([x, y]);
      }
    return { n, out };
  }, [seed]);
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${cells.n + 2} ${cells.n + 2}`} role="img" aria-label="QR code for your car">
      <rect x="-1" y="-1" width={cells.n + 2} height={cells.n + 2} fill="#fff" />
      {cells.out.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#030712" />
      ))}
    </svg>
  );
}

function ago(at: number, now: number) {
  const m = Math.floor((now - at) / MIN);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const fmtPhone = (p: string) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

// ---------- ParcoAI: answers in the four labelled blocks the backend's system prompt enforces ----------
type Verdict = { params: string; verdict: string; risk: 'High' | 'Medium' | 'Low'; action: string };
type Msg = { role: 'user' | 'ai'; text?: string; verdict?: Verdict; guard?: boolean; shown?: number };

const SUGGESTED = [
  'Parked near a yellow-painted kerb for 20 min, will I get a challan?',
  'Can I park on the footpath outside my own house at night?',
  'Someone blocked my gate. Can I call traffic police to tow it?',
];

function answerFor(q: string, city: string, area: string): Omit<Msg, 'role'> {
  const t = q.toLowerCase();
  const place = `${city || 'City not given'}${area ? `, ${area}` : ''}`;
  if (/(kerb|curb|yellow)/.test(t))
    return { verdict: { params: `${place} · yellow kerb · ~20 min halt`, verdict: 'A yellow kerb marks a no-parking stretch under local traffic rules. Even a short halt counts as parking.', risk: 'High', action: 'Move now. Use the nearest pay-and-park. A no-parking fine is about ₹500, plus towing charges if the car is lifted.' } };
  if (/(footpath|pavement|sidewalk)/.test(t))
    return { verdict: { params: `${place} · footpath · overnight`, verdict: 'Parking on a footpath obstructs pedestrians and is an offence under the Motor Vehicles Act (Sec. 122 / 177), whoever owns the house.', risk: 'Medium', action: 'Park inside the gate or on the carriageway edge where it is allowed. Night patrols do issue e-challans from photos.' } };
  if (/(block|gate|tow)/.test(t))
    return { verdict: { params: `${place} · vehicle blocking a private gate`, verdict: 'Leaving a vehicle so that it obstructs others is an offence (MV Act Sec. 122). The police can tow it or issue a challan.', risk: 'Low', action: 'First scan the car’s ParkAssist QR to reach the owner. If there is no QR or no answer, call the traffic helpline with the registration number and location.' } };
  if (/(park|challan|traffic|car|bike|road|fine|towing|signal|helmet|licen[cs]e)/.test(t))
    return { verdict: { params: `${place} · ${q.slice(0, 48)}${q.length > 48 ? '…' : ''}`, verdict: 'This depends on the signboards and kerb markings at the spot. Without a no-parking sign, short halts on the carriageway edge are usually allowed.', risk: 'Medium', action: 'Check for signboards within 50 m and kerb paint. If unsure, use a marked parking bay.' } };
  return { guard: true, text: '⚠️ System Guardrail: ParcoAI only assists with traffic, road, and parking queries in India. Please try again with a relevant scenario.' };
}

function AiChat({ onClose }: { onClose: () => void }) {
  const [city, setCity] = useState('Bengaluru');
  const [area, setArea] = useState('Indiranagar');
  const [draft, setDraft] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  // Reveal the answer block by block, the way the SSE stream fills it in
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'ai' || last.shown === undefined || last.shown >= 4) return;
    const t = setTimeout(() => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, shown: (x.shown ?? 0) + 1 } : x))), 420);
    return () => clearTimeout(t);
  }, [msgs]);
  const lastMsg = msgs[msgs.length - 1];
  const busy = thinking || (lastMsg?.role === 'ai' && (lastMsg.shown ?? 4) < 4);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setDraft('');
    setThinking(true);
    setMsgs((m) => [...m, { role: 'user', text }]);
    setTimeout(() => {
      const a = answerFor(text, city, area);
      setThinking(false);
      setMsgs((m) => [...m, { role: 'ai', ...a, shown: a.verdict ? 0 : 4 }]);
    }, 650);
  };

  return (
    <div className={s.sheet}>
      <header className={s.bar}>
        <button className={s.round} type="button" aria-label="Back" onClick={onClose}>
          <Icon name="back" />
        </button>
        <div className={s.barTitle}>
          <b>ParcoAI</b>
          <span>Indian parking & traffic rules</span>
        </div>
        <span className={s.aiBadge}>
          <Icon name="sparkle" size={14} /> AI
        </span>
      </header>
      <div className={s.where}>
        <label>
          City
          <input value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label>
          Area
          <input value={area} maxLength={120} onChange={(e) => setArea(e.target.value)} />
        </label>
      </div>
      <div className={s.chat} ref={listRef}>
        {msgs.length === 0 && (
          <div className={s.chatEmpty}>
            <span className={s.aiOrb}>
              <Icon name="sparkle" size={26} />
            </span>
            <b>Describe your parking situation</b>
            <p>You get a verdict, the challan risk and what to do next.</p>
            {SUGGESTED.map((q) => (
              <button key={q} type="button" className={s.suggest} onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <p key={i} className={s.me}>
              {m.text}
            </p>
          ) : m.verdict ? (
            <div key={i} className={s.ai}>
              {[
                ['EXTRACTED PARAMETERS', m.verdict.params],
                ['LEGAL VERDICT', m.verdict.verdict],
                ['CHALLAN RISK LEVEL', m.verdict.risk],
                ['RECOMMENDED ACTION', m.verdict.action],
              ]
                .slice(0, m.shown)
                .map(([k, v]) => (
                  <div key={k} className={s.block}>
                    <span>[{k}]</span>
                    {k === 'CHALLAN RISK LEVEL' ? <b className={s[`risk${v}`]}>{v}</b> : <p>{v}</p>}
                  </div>
                ))}
              {(m.shown ?? 0) < 4 && <i className={s.typing} aria-label="ParcoAI is typing" />}
            </div>
          ) : (
            <p key={i} className={`${s.ai} ${s.guard}`}>
              {m.text}
            </p>
          ),
        )}
        {busy && msgs[msgs.length - 1]?.role === 'user' && <i className={s.typing} aria-label="ParcoAI is thinking" />}
      </div>
      <form
        className={s.composer}
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <input value={draft} placeholder="e.g. Can I park outside a hospital gate?" onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" aria-label="Send" disabled={!draft.trim() || busy}>
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  );
}

// ---------- Scanner: a parked car with the owner's sticker; tapping the sticker "reads" it ----------
function Scanner({ phone, onClose, onScanned }: { phone: string; onClose: () => void; onScanned: () => void }) {
  const [flash, setFlash] = useState(false);
  const [found, setFound] = useState(false);
  const [calling, setCalling] = useState(false);

  const read = () => {
    if (found) return;
    setFound(true);
    onScanned();
  };

  return (
    <div className={`${s.scanner} ${flash ? s.flashOn : ''}`}>
      <div className={s.cam} aria-hidden="true">
        <div className={s.windshield}>
          <div className={s.dash} />
        </div>
      </div>
      <header className={s.scanTop}>
        <button className={s.glass} type="button" aria-label="Close scanner" onClick={onClose}>
          <Icon name="x" />
        </button>
        <b>Scan QR Code</b>
        <button className={`${s.glass} ${flash ? s.glassOn : ''}`} type="button" aria-pressed={flash} aria-label="Flash" onClick={() => setFlash((f) => !f)}>
          <Icon name="flash" />
        </button>
      </header>
      <div className={s.window}>
        <button className={s.sticker} type="button" onClick={read} aria-label="Point the camera at the QR sticker on the dashboard">
          <QrArt seed={phone} size={92} />
          <span>ParkAssist</span>
        </button>
        <i className={s.corner} />
        <i className={s.corner} />
        <i className={s.corner} />
        <i className={s.corner} />
        {!found && <i className={s.sweep} />}
      </div>
      <p className={s.scanHint}>Position QR code within the frame</p>
      <p className={s.scanTip}>👆 Tap the sticker to scan it</p>

      {found && (
        <div className={s.modalWrap}>
          <div className={s.modal} role="dialog" aria-label="Owner found">
            <span className={s.callOrb}>
              <Icon name="phone" size={30} />
            </span>
            <b>Owner Found</b>
            <p className={s.bigNum}>{phone}</p>
            {calling ? (
              <p className={s.calling}>📞 Opening the dialer… (in the demo, nobody is actually called)</p>
            ) : (
              <button className={s.cta} type="button" onClick={() => setCalling(true)}>
                <Icon name="phone" size={18} /> Call Now
              </button>
            )}
            <button className={s.ghost} type="button" onClick={() => { setFound(false); setCalling(false); }}>
              Scan Another
            </button>
            <p className={s.logged}>✓ Scan logged. The owner’s home screen counts it.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- The app ----------
export default function ParkAssistApp() {
  const [now, setNow] = useState(() => Date.now());
  const [scans, setScans] = useState<Scan[]>(() => {
    const t = Date.now();
    return [3, 62, 12 * 60, 26 * 60, 3 * 24 * 60, 8 * 24 * 60].map((m) => ({ at: t - m * MIN }));
  });
  const [tab, setTab] = useState<'home' | 'profile'>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [dark, setDark] = useState(true);
  const [qrPhone, setQrPhone] = useState(OWNER.phone);
  const [genInput, setGenInput] = useState('');
  const [genError, setGenError] = useState('');
  const [vehicles, setVehicles] = useState(['PB 10 GK 4521', 'DL 3C AY 7788']);
  const [plate, setPlate] = useState('');
  const [notify, setNotify] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const week = scans.filter((x) => now - x.at < 7 * 24 * 60 * MIN).length;

  const onScanned = () => {
    setScans((list) => [{ at: Date.now() }, ...list]);
    setNow(Date.now());
    if (notify) setTimeout(() => setToast('🔔 Someone scanned your QR code'), 900);
  };

  const generate = () => {
    const digits = genInput.replace(/\D/g, '');
    if (!digits) return setGenError('Please enter a phone number.');
    if (!/^[6-9]\d{9}$/.test(digits)) return setGenError('Invalid format. Use a valid phone number.');
    setGenError('');
    setQrPhone(digits);
    setOverlay('qr');
  };

  return (
    <div className={`${s.app} ${dark ? s.dark : s.light}`}>
      <div className={s.status} aria-hidden="true">
        <span>9:41</span>
        <span className={s.statusIcons}>▂▄▆ ◔ ▮</span>
      </div>

      {tab === 'home' ? (
        <main className={s.scroll}>
          <header className={s.hello}>
            <div>
              <p>Welcome back</p>
              <h1>{OWNER.name}</h1>
            </div>
            <button className={s.bell} type="button" aria-label="Notifications" onClick={() => setToast(notify ? 'Alerts are on for new scans' : 'Alerts are off')}>
              <Icon name="bell" />
              {notify && <i />}
            </button>
          </header>

          <section className={s.qrCard}>
            <div className={s.qrRow}>
              <span className={s.qrTile}>
                <Icon name="qr" size={30} />
              </span>
              <div>
                <b>Your QR Code</b>
                <p>Linked to {fmtPhone(OWNER.phone)}</p>
              </div>
            </div>
            <button className={s.cta} type="button" onClick={() => { setQrPhone(OWNER.phone); setOverlay('qr'); }}>
              View & Download <Icon name="arrow" size={18} />
            </button>
          </section>

          <div className={s.stats}>
            <div className={s.stat}>
              <b>{scans.length}</b>
              <span>Total Scans</span>
              <em>+{week} this week</em>
            </div>
            <div className={s.stat}>
              <b>{week}</b>
              <span>Scans This Week</span>
              <em>{week ? 'Active recently' : 'No scans yet'}</em>
            </div>
          </div>

          <p className={s.section}>QUICK ACTIONS</p>
          <div className={s.actions}>
            <button type="button" className={`${s.action} ${s.actionFill}`} onClick={() => { setGenInput(''); setGenError(''); setOverlay('generate'); }}>
              <span className={s.actionIcon}>
                <Icon name="qr" size={26} />
              </span>
              Generate QR
            </button>
            <button type="button" className={s.action} onClick={() => setOverlay('scan')}>
              <span className={`${s.actionIcon} ${s.actionLine}`}>
                <Icon name="scan" size={26} />
              </span>
              Scan QR
            </button>
          </div>

          <div className={s.sectionRow}>
            <p className={s.section}>RECENT ACTIVITY</p>
            <button type="button" className={s.refresh} aria-label="Refresh" onClick={() => { setRefreshing(true); setTimeout(() => { setNow(Date.now()); setRefreshing(false); }, 700); }}>
              <span className={refreshing ? s.spin : undefined}>
                <Icon name="refresh" size={16} />
              </span>
            </button>
          </div>
          <ul className={s.activity}>
            {scans.slice(0, 5).map((x, i) => (
              <li key={x.at} className={i === 0 && now - x.at < MIN ? s.fresh : undefined}>
                <span className={s.actIcon}>
                  <Icon name="scan" size={18} />
                </span>
                <div>
                  <b>QR Code Scanned</b>
                  <p>Someone scanned your code</p>
                </div>
                <time>{ago(x.at, now)}</time>
              </li>
            ))}
          </ul>
          <div className={s.spacer} />
        </main>
      ) : (
        <main className={s.scroll}>
          <header className={s.profileHead}>
            <h1>Profile</h1>
            <button className={s.bell} type="button" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark((d) => !d)}>
              <Icon name={dark ? 'sun' : 'moon'} />
            </button>
          </header>
          <section className={s.userCard}>
            <span className={s.avatar}>KK</span>
            <div>
              <b>{OWNER.name}</b>
              <p>{fmtPhone(OWNER.phone)}</p>
              <p>{OWNER.email}</p>
            </div>
          </section>
          <div className={s.pstats}>
            <div>
              <b>{vehicles.length}</b>
              <span>Vehicles</span>
            </div>
            <div>
              <b>{scans.length}</b>
              <span>Scans</span>
            </div>
          </div>
          <ul className={s.rows}>
            <li>
              <span className={s.rowIcon}>
                <Icon name="bell" size={18} />
              </span>
              <div>
                <b>Notifications</b>
                <p>Get alerts when scanned</p>
              </div>
              <button type="button" role="switch" aria-checked={notify} aria-label="Notifications" className={s.switch} onClick={() => setNotify((n) => !n)}>
                <i />
              </button>
            </li>
            <li>
              <button type="button" className={s.rowBtn} onClick={() => setOverlay('vehicles')}>
                <span className={s.rowIcon}>
                  <Icon name="car" size={18} />
                </span>
                <div>
                  <b>My Vehicles</b>
                  <p>Manage your cars</p>
                </div>
                <Icon name="chevron" size={18} />
              </button>
            </li>
            <li>
              <button type="button" className={s.rowBtn} onClick={() => setToast('Opens the privacy policy')}>
                <span className={s.rowIcon}>
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <b>Privacy Policy</b>
                  <p>Control your data</p>
                </div>
                <Icon name="chevron" size={18} />
              </button>
            </li>
            <li>
              <button type="button" className={s.rowBtn} onClick={() => setToast('Opens FAQs and contact')}>
                <span className={s.rowIcon}>
                  <Icon name="help" size={18} />
                </span>
                <div>
                  <b>Help & Support</b>
                  <p>FAQs and contact</p>
                </div>
                <Icon name="chevron" size={18} />
              </button>
            </li>
          </ul>
          <button type="button" className={s.logout} onClick={() => setToast('Logout is turned off in the demo')}>
            <Icon name="logout" size={18} /> Logout
          </button>
          <div className={s.spacer} />
        </main>
      )}

      {tab === 'home' && !overlay && (
        <button type="button" className={s.fab} onClick={() => setOverlay('ai')}>
          <Icon name="sparkle" size={18} /> Ask AI
        </button>
      )}

      <nav className={s.tabs} aria-label="App tabs">
        {(['home', 'profile'] as const).map((t) => (
          <button key={t} type="button" aria-current={tab === t ? 'page' : undefined} onClick={() => { setTab(t); setOverlay(null); }}>
            <Icon name={t === 'home' ? 'home' : 'user'} size={22} />
            {t === 'home' ? 'Home' : 'Profile'}
          </button>
        ))}
      </nav>

      {overlay === 'generate' && (
        <div className={s.sheet}>
          <header className={s.bar}>
            <button className={s.round} type="button" aria-label="Back" onClick={() => setOverlay(null)}>
              <Icon name="back" />
            </button>
            <div className={s.barTitle}>
              <b>Generate QR</b>
            </div>
          </header>
          <div className={s.genBody}>
            <span className={s.genOrb}>
              <Icon name="qr" size={44} />
            </span>
            <h2>Generate QR Code</h2>
            <p>Create a unique code linked to your phone number</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generate();
              }}
            >
              <label className={s.phoneField}>
                <span>🇮🇳 +91 |</span>
                <input inputMode="numeric" maxLength={10} placeholder="Enter 10 digit number" value={genInput} onChange={(e) => setGenInput(e.target.value.replace(/\D/g, ''))} aria-label="Phone number" />
              </label>
              {genError && <p className={s.error}>{genError}</p>}
              <button className={s.cta} type="submit">
                Generate QR Code
              </button>
            </form>
            <p className={s.tryHint}>Try any 10-digit Indian mobile number, or a short one to see the validation.</p>
          </div>
        </div>
      )}

      {overlay === 'qr' && (
        <div className={s.sheet}>
          <header className={s.bar}>
            <button className={s.round} type="button" aria-label="Back" onClick={() => setOverlay(null)}>
              <Icon name="back" />
            </button>
            <div className={s.barTitle}>
              <b>Your QR Code</b>
            </div>
            <span className={s.active}>● Active</span>
          </header>
          <div className={s.qrBody}>
            <div className={s.qrShow}>
              <i className={s.corner} />
              <i className={s.corner} />
              <i className={s.corner} />
              <i className={s.corner} />
              <div className={s.qrPaper}>
                <QrArt seed={qrPhone} size={190} />
              </div>
            </div>
            <span className={s.phoneChip}>
              <Icon name="phone" size={14} /> +91{qrPhone}
            </span>
            <p className={s.info}>Print and place on your car dashboard. Others can scan to contact you instantly.</p>
            <div className={s.tiles}>
              <button type="button" onClick={() => setToast('Shared: “Scan this QR code to call me instantly — ParkAssist”')}>
                <Icon name="share" /> Share
              </button>
              <button type="button" onClick={() => setToast('Opens the print sheet: “Your ParkAssist QR Code”')}>
                <Icon name="print" /> Print
              </button>
            </div>
            <button type="button" className={s.ghost} onClick={() => { setGenInput(''); setOverlay('generate'); }}>
              ↻ Generate for different number
            </button>
          </div>
        </div>
      )}

      {overlay === 'vehicles' && (
        <div className={s.sheet}>
          <header className={s.bar}>
            <button className={s.round} type="button" aria-label="Back" onClick={() => setOverlay(null)}>
              <Icon name="back" />
            </button>
            <div className={s.barTitle}>
              <b>My Vehicles</b>
            </div>
          </header>
          <div className={s.genBody}>
            <form
              className={s.addPlate}
              onSubmit={(e) => {
                e.preventDefault();
                const p = plate.trim().toUpperCase();
                if (p && !vehicles.includes(p)) setVehicles((v) => [...v, p]);
                setPlate('');
              }}
            >
              <input placeholder="e.g. MH 12 AB 1234" value={plate} maxLength={14} onChange={(e) => setPlate(e.target.value)} aria-label="Registration number" />
              <button type="submit" className={s.cta}>
                Add
              </button>
            </form>
            {vehicles.length === 0 ? (
              <p className={s.muted}>No vehicles added yet</p>
            ) : (
              <ul className={s.plates}>
                {vehicles.map((v) => (
                  <li key={v}>
                    <span className={s.rowIcon}>
                      <Icon name="car" size={18} />
                    </span>
                    <b>{v}</b>
                    <button type="button" aria-label={`Remove ${v}`} onClick={() => setVehicles((list) => list.filter((x) => x !== v))}>
                      <Icon name="x" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {overlay === 'scan' && <Scanner phone={OWNER.phone} onClose={() => setOverlay(null)} onScanned={onScanned} />}
      {overlay === 'ai' && <AiChat onClose={() => setOverlay(null)} />}

      {toast && (
        <p className={s.toast} role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
