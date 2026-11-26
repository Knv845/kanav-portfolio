'use client';

// The landing page: one horizontal story. The robot crane hands over a phone, the camera goes inside it, then one
// request travels to the server, through rate limiting and scaling, ending with the stack, the career log and the
// live demos. Vertical scroll drives it; lib/story/engine.ts runs the animation.

import { useEffect, useRef, type CSSProperties } from 'react';
import { startStory } from '@/lib/story/engine';
import { DemoHub } from '../demos/DemoHub';
import { EMAIL, RESUME } from '../sections';
import st from './story.module.css';

const c = (...names: string[]) => names.map((n) => st[n]).join(' ');
const cc = (color: string) => ({ '--cc': `var(--c-${color})` }) as CSSProperties;

const NATIVE_TXT = `expo-camera  → QR scan
expo-location → visit GPS
push          → order alerts

FlatList windowSize 7
memo(OrderRow)`;
const OFFLINE_TXT = `POST /orders #1041   queued
PATCH /visits/88     queued
POST /orders #1040   synced

network back → flush in order
retry with backoff`;
const STATE_TXT = `{
  user:   { id: 7, role: "rep" },
  cart:   [{ sku: "DOLO-650",
             qty: 2 }],
  orders: { ids: [1040, 1041],
            status: "idle" }
}`;

const PIPELINE: [string, string][] = [['TLS', '3 ms'], ['Rate limit', '0.2 ms'], ['Auth · JWT', '1 ms'], ['Validate', '0.4 ms'], ['Handler', '2 ms'], ['Database', '9 ms'], ['Respond', '0.5 ms']];
const TAGS: [string, number, number][] = [
  ['React Native · Expo', 120, 604], ['Redux Toolkit', 150, 640], ['Next.js · React', 392, 52], ['Node.js · Express', 560, 444],
  ['JWT · rate limits', 590, 480], ['FastAPI · Node', 905, 92], ['MongoDB · PostgreSQL', 1010, 648], ['Docker', 880, 600], ['Claude · Gemini', 760, 236],
];
const DEMOS = [
  { id: 'nearmed', name: 'NearMed', color: '#5d4c86', kind: 'Android app + store website', text: 'Nearby pharmacies price your prescription; you get 90 seconds to say yes.', secs: 40 },
  { id: 'parkassist', name: 'ParkAssist', color: '#2f6b86', kind: 'Android app', text: 'A QR sticker so a blocked driver can reach the owner in one tap.', secs: 36 },
  { id: 'saarag', name: 'Saarag', color: '#3a3d42', kind: 'RAG SaaS · web + mobile', text: 'A company knowledge assistant that answers with sources and respects who can see what.', secs: 44 },
];

function Download() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M3 13h10" />
    </svg>
  );
}

export function Story() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => startStory(rootRef.current!, st), []);

  return (
    <div className={c('root', 'runway')} ref={rootRef} data-ref="runway">
      <div className={st.theatre}>
        <header className={st.nav}>
          <a className={st.logo} href="#intro" data-go="0">
            Kanav Khera
          </a>
          <nav className={st.links} aria-label="Sections">
            <a href="#demos" data-go="11" data-ref="navlink" data-scene="demos">Work</a>
            <a href="#intro" data-go="0" data-ref="navlink" data-scene="intro">About</a>
            <a href="#screens" data-go="1" data-ref="navlink" data-scene="phone">Process</a>
            <a href="#resume" data-go="10" data-ref="navlink" data-scene="resume">Career</a>
          </nav>
          <div className={st['nav-end']}>
            <DemoHub />
            <a className={c('btn', 'resume-btn')} href={RESUME.href} download={RESUME.filename}>
              <Download />
              <span>Resume</span>
            </a>
            <a className={c('btn', 'talk')} href={`mailto:${EMAIL}`}>
              Let’s Talk ↗
            </a>
          </div>
        </header>

        <div className={st.stage}>
          <div className={st.board} role="img" aria-label="4+ years shipping apps, 5,000+ users, 4 engineers mentored, 3 live demos">
            <span className={st.led} />
            <span className={st.cells} data-ref="cells" />
          </div>
          <p className={st.watermark} aria-hidden="true">
            Portfolio
          </p>

          <div className={st.fit} data-ref="fit">
            <div className={st.world} data-ref="world" data-scene="intro" data-sub="" role="img" aria-label="A robot crane, a phone, an API gateway, a server and a database exchanging requests">
              <div className={st.cam} data-ref="cam">
                <svg className={st.wires} viewBox="0 0 1200 720" aria-hidden="true">
                  <path className={c('wire', 'w-direct')} d="M380 360 L900 360" />
                  <path className={c('wire', 'w-main')} d="M380 360 L555 360" />
                  <path className={c('wire', 'w-srv')} d="M725 360 L900 360" />
                  {[179, 319, 459, 599].map((y) => (
                    <path key={y} className={c('wire', 'w-mini')} d={`M234 ${y} L555 360`} />
                  ))}
                  {[174, 289, 404, 519].map((y) => (
                    <path key={y} className={c('wire', 'w-inst')} data-ref="winst" d={`M725 360 L860 ${y}`} />
                  ))}
                  <path className={c('wire', 'w-data')} d="M1030 290 L1060 203" />
                  <path className={c('wire', 'w-data')} d="M1030 404 L1060 475" />
                  <path className={c('wire', 'w-queue')} d="M945 563 L945 618" />
                  <path className={c('wire', 'w-web')} d="M265 108 L555 360" />
                  <path className={c('wire', 'w-stackdb')} d="M1000 520 L1060 545" />
                </svg>

                <div className={c('node', 's-phone')} aria-hidden="true">
                  <div className={c('layer', 'l-device')} />
                  <div className={c('layer', 'l-native')}>
                    <div className={st['layer-txt']}>
                      <b>NATIVE MODULES</b>
                      {NATIVE_TXT}
                    </div>
                  </div>
                  <div className={c('layer', 'l-offline')}>
                    <div className={st['layer-txt']}>
                      <b>OFFLINE QUEUE</b>
                      {OFFLINE_TXT}
                    </div>
                  </div>
                  <div className={c('layer', 'l-state')}>
                    <div className={st['layer-txt']}>
                      <b>STATE · REDUX TOOLKIT</b>
                      {STATE_TXT}
                    </div>
                  </div>
                  <div className={c('layer', 'l-ui')} data-ref="ui" data-screen="orders">
                    <div className={st.notch} />
                    <div className={c('screen', 's-orders')}>
                      <div className={st['app-bar']}>
                        <b>Today</b>
                        <i />
                      </div>
                      <div className={st['app-sub']}>3 visits · 2 orders</div>
                      <div className={st['offline-bar']}>Offline · 2 orders will sync</div>
                      <div className={st.orders} data-ref="orders">
                        {[['Sunrise Pharmacy', '2 items · ₹118', 'placed'], ['City Care', '5 items · ₹640', 'packed'], ['Wellness Chemists', '1 item · ₹31', 'delivered']].map(([n, d, status]) => (
                          <div className={st.order} key={n}>
                            <i className={st.av} />
                            <div>
                              <b>{n}</b>
                              <span>{d}</span>
                            </div>
                            <em className={st.st}>{status}</em>
                          </div>
                        ))}
                      </div>
                      <div className={st.toast} data-ref="toast" />
                      <div className={st.place} data-ref="place">
                        Place order
                      </div>
                    </div>
                    <div className={c('screen', 's-ring')}>
                      <h5>Your request · NearMed</h5>
                      <div className={st.ring}>
                        <svg viewBox="0 0 160 160">
                          <circle className={st.rtrack} cx="80" cy="80" r="70" />
                          <circle className={st.bar} cx="80" cy="80" r="70" />
                        </svg>
                        <div className={st['ring-in']}>
                          <span>Sunrise Pharmacy</span>
                          <b>₹459.00</b>
                          <em>90 s to decide</em>
                        </div>
                      </div>
                      <div className={st.yes}>Yes, order this</div>
                      <div className={st.no}>No, show the next price</div>
                    </div>
                    <div className={c('screen', 's-scan')}>
                      <h5>Scan QR Code · ParkAssist</h5>
                      <div className={st.qr}>
                        <svg viewBox="0 0 21 21" shapeRendering="crispEdges">
                          <path fill="#030712" d="M0 0h7v7H0zM2 2v3h3V2zM14 0h7v7h-7zm2 2v3h3V2zM0 14h7v7H0zm2 2v3h3v-3zM9 0h2v2H9zm2 2h2v3h-2zM8 5h2v2H8zm1 3h3v2H9zm4 0h2v2h-2zM8 11h2v3H8zm3 1h3v2h-3zm4-1h2v2h-2zm2 3h2v2h-2zm-6 3h2v3h-2zm3-1h3v2h-3zm4 2h2v3h-2zM0 8h2v2H0zm3 0h3v2H3zm-1 3h3v2H2z" />
                        </svg>
                        <i />
                      </div>
                      <div className={st.found}>
                        <b>Owner Found</b>
                        <span>98765 43210</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(
                  [
                    ['ui', 206, 'Screens', 'React Native · Expo Router'],
                    ['state', 272, 'State', 'Redux Toolkit'],
                    ['offline', 338, 'Offline queue', 'syncs on reconnect'],
                    ['native', 404, 'Native modules', 'camera · GPS · push'],
                  ] as const
                ).map(([l, top, name, sub]) => (
                  <div key={l} className={st.ll} data-l={l} style={{ top }}>
                    <b>{name}</b>
                    <span>{sub}</span>
                  </div>
                ))}

                <div className={c('node', 's-web')} aria-hidden="true">
                  <div className={st.box}>
                    <h4>Web dashboard</h4>
                    <p>Next.js · same API</p>
                  </div>
                </div>
                {[120, 260, 400, 540].map((top) => (
                  <div key={top} className={st.mini} data-ref="mini" style={{ left: 170, top }} />
                ))}

                <div className={c('node', 's-gate')} aria-hidden="true">
                  <div className={st.box} data-ref="gatebox">
                    <h4 data-ref="gate-title">API gateway</h4>
                    <p data-ref="gate-sub">HTTPS · JWT · limits</p>
                    <div className={st.bucket} data-ref="bucket" hidden />
                  </div>
                </div>

                <div className={c('node', 's-server')} aria-hidden="true">
                  <div className={st.rack}>
                    {Array.from({ length: 8 }, (_, i) => (
                      <div className={st.unit} key={i}>
                        <i />
                        <i />
                        <span />
                      </div>
                    ))}
                  </div>
                  <div className={st.pipe}>
                    <h4>API server</h4>
                    {PIPELINE.map(([n, ms]) => (
                      <div className={st.row} data-ref="row" key={n}>
                        <b>{n}</b>
                        <span>{ms}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {[130, 245, 360, 475].map((top, i) => (
                  <div key={top} className={c('node', 'inst')} data-ref="inst" style={{ top }}>
                    <div className={st.box}>
                      <h4>API · {i + 1}</h4>
                      <div className={st.cpu}>
                        <i data-ref="cpu" />
                      </div>
                      <p>0 req/s</p>
                    </div>
                  </div>
                ))}
                <div className={c('node', 's-cache')} aria-hidden="true">
                  <div className={st.box}>
                    <h4>Cache</h4>
                    <p>repeat reads</p>
                  </div>
                </div>
                <div className={c('node', 's-db')} aria-hidden="true">
                  <div className={st.box}>
                    <h4>Database</h4>
                    <p>primary + replica</p>
                  </div>
                </div>
                <div className={c('node', 's-queue')} aria-hidden="true">
                  <div className={st.box}>
                    <h4>Job queue</h4>
                    <p>emails · push</p>
                  </div>
                </div>

                {TAGS.map(([t, left, top], i) => (
                  <span key={t} className={st.ttag} style={{ left, top, transitionDelay: `${0.05 + i * 0.07}s` }}>
                    {t}
                  </span>
                ))}

                <div className={st.crane} aria-hidden="true">
                  <div className={st.rail} />
                  <div className={st.rig}>
                    <div className={st.rod} />
                    <div className={st.carriage}>
                      <div className={st.face}>
                        <i className={c('eye', 'l')} />
                        <i className={c('eye', 'r')} />
                      </div>
                    </div>
                    <div className={st.spreader}>
                      <i className={c('finger', 'l')} />
                      <i className={c('finger', 'r')} />
                    </div>
                  </div>
                </div>

                <div data-ref="pkts" />
              </div>
            </div>
          </div>

          <div className={c('fps', 'panel')} data-ref="fps" aria-hidden="true">
            <div className={st.r}>
              <span>FRAME TIME</span>
              <b data-ref="fps-num">60 fps</b>
            </div>
            <canvas data-ref="fps-canvas" width="460" height="128" />
          </div>

          <div className={st.hud} data-ref="hud" data-hud="request">
            <div className={c('panel', 'code')} data-ref="code" />
          </div>
          <div className={st.hud} data-ref="hud" data-hud="limit">
            <div className={c('panel', 'stat')}>
              <span>ALLOWED</span>
              <b className={st.good} data-ref="ok-n">0</b>
            </div>
            <div className={c('panel', 'stat')}>
              <span>429 SENT</span>
              <b className={st.bad} data-ref="err-n">0</b>
            </div>
            <div className={c('panel', 'controls')}>
              <button className={c('btn', 'brass')} type="button" data-ref="burst">
                Send a burst of 30
              </button>
              <label className={st.range} htmlFor="story-rate">
                INCOMING <span data-ref="rate-v">4 req/s</span>
                <input type="range" id="story-rate" data-ref="rate" min="1" max="16" defaultValue="4" />
              </label>
            </div>
          </div>
          <div className={st.hud} data-ref="hud" data-hud="scale">
            <div className={c('panel', 'stat')}>
              <span>TRAFFIC</span>
              <b data-ref="rps">6</b>
            </div>
            <div className={c('panel', 'stat')}>
              <span>SERVERS</span>
              <b data-ref="inst-n">1</b>
            </div>
            <div className={c('panel', 'stat')}>
              <span>P95</span>
              <b data-ref="p95">48 ms</b>
            </div>
            <div className={c('panel', 'controls')}>
              <button className={st.btn} type="button" data-ref="normal" aria-pressed="true">
                Normal
              </button>
              <button className={c('btn', 'brass')} type="button" data-ref="spike" aria-pressed="false">
                Traffic spike
              </button>
            </div>
            <div className={c('panel', 'log')} data-ref="log">
              <div>autoscaler watching p95 and CPU</div>
            </div>
          </div>

          <div className={st.overlay} data-ref="ov-resume">
            <div className={st.manifest}>
              <div className={st['mf-head']}>
                <h3>
                  Where I’ve <em>worked.</em>
                </h3>
                <p className={st['mf-no']}>
                  CARGO MANIFEST<b>KK-2026</b>
                </p>
              </div>
              <div className={st['mf-row']}>
                <p className={st['mf-when']}>Jul 2024 – now</p>
                <div>
                  <div className={st['mf-co']}>Dealermatix Technologies</div>
                  <div className={st['mf-role']}>Software Developer · field-sales apps for 5,000+ users</div>
                </div>
                <span className={c('stamp', 'live')}>In transit</span>
              </div>
              <div className={st['mf-row']}>
                <p className={st['mf-when']}>Jun 2022 – Jul 2024</p>
                <div>
                  <div className={st['mf-co']}>Tata Technologies</div>
                  <div className={st['mf-role']}>Solutions Developer · React.js and React Native apps</div>
                </div>
                <span className={st.stamp}>Delivered</span>
              </div>
              <p className={st['mf-foot']}>
                <b>Port of loading</b>Chandigarh Group of Colleges · B.Tech CS · 2022
              </p>
              <div className={st['mf-chips']}>
                {['LLM features in apps', 'End-to-end feature ownership', 'System design', 'Offline-first apps', 'Fast apps on low-end phones', 'Code reviews & mentoring'].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className={st.overlay} data-ref="ov-demos">
            <div className={st.demos}>
              {DEMOS.map((d) => (
                <article className={st.card} key={d.id}>
                  <a className={st.poster} href={`#demo/${d.id}/intro`} style={{ backgroundImage: `url(/intros/${d.id}-intro.jpg)` }} aria-label={`Watch the ${d.name} intro`} />
                  <div className={st.body}>
                    <span className={st.kind}>
                      <i style={{ background: d.color }} />
                      {d.kind}
                    </span>
                    <h4>{d.name}</h4>
                    <p>{d.text}</p>
                    <div className={st.acts}>
                      <a className={c('btn', 'brass')} href={`#demo/${d.id}`}>
                        Try the live demo
                      </a>
                      <a className={st.btn} href={`#demo/${d.id}/intro`}>
                        Intro · {d.secs}s
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className={st.band}>
          <div className={st.track} data-ref="track">
            <section className={st.ch} data-ref="chapter" data-scene="intro" data-label="Intro" style={cc('oxblood')}>
              <div>
                <p className={st.tag}>
                  <i />
                  01 / HELLO
                </p>
                <h1>
                  Hi, I’m <em>Kanav.</em>
                </h1>
              </div>
              <div>
                <p>An applied AI engineer and mobile full-stack developer, with 4+ years shipping React Native and Node.js. I build the app in your pocket and the server behind it.</p>
                <p className={st.small}>Scroll, or use the arrows. The crane hands you the phone; follow one tap all the way to the server.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="phone" data-sub="ui" data-label="Screens" style={cc('rust')}>
              <div>
                <p className={st.tag}>
                  <i />
                  INSIDE THE APP · SCREENS
                </p>
                <h2>
                  How I built NearMed’s <em>90-second ring</em>.
                </h2>
              </div>
              <div>
                <p>Every screen is a React Native component tree, routed with Expo Router. The price countdown is an SVG ring (react-native-svg) whose stroke drains with the seconds and turns orange in the last twenty.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="phone" data-sub="state" data-label="State" style={cc('sage')}>
              <div>
                <p className={st.tag}>
                  <i />
                  INSIDE THE APP · STATE
                </p>
                <h2>
                  One source of <em>truth</em>.
                </h2>
              </div>
              <div>
                <p>Redux Toolkit holds what the app knows: the signed-in user, the cart, every order. Change it on one screen and every other screen shows the change at once.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="phone" data-sub="offline" data-label="Offline" style={cc('slate')}>
              <div>
                <p className={st.tag}>
                  <i />
                  INSIDE THE APP · OFFLINE
                </p>
                <h2>
                  Works with <em>no signal</em>.
                </h2>
              </div>
              <div>
                <p>In the field-sales apps, visits and orders taken offline wait in a local queue and sync in order when the network returns. A rep in a basement still gets the order in.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="phone" data-sub="native" data-label="Native" style={cc('teal')}>
              <div>
                <p className={st.tag}>
                  <i />
                  INSIDE THE APP · NATIVE
                </p>
                <h2>
                  How ParkAssist <em>scans a car</em>.
                </h2>
              </div>
              <div>
                <p>The scanner opens the camera through a native module, reads the QR sticker and shows the owner’s number in one tap. Long lists are virtualised and rows memoised, so scrolling holds near 60 fps on low-end Android.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="request" data-label="Request" style={cc('ochre')}>
              <div>
                <p className={st.tag}>
                  <i />
                  THE API · ONE REQUEST
                </p>
                <h2>
                  One tap, one <em>request</em>.
                </h2>
              </div>
              <div>
                <p>Tapping “Place order” sends a signed HTTPS request to the API. The server answers in milliseconds and a new order appears on the screen. Watch the round trip.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="server" data-label="Server" style={cc('olive')}>
              <div>
                <p className={st.tag}>
                  <i />
                  THE API · INSIDE THE SERVER
                </p>
                <h2>
                  What happens in <em>16 ms</em>.
                </h2>
              </div>
              <div>
                <p>The rate limit is checked, the token says who you are, the body is validated, the handler talks to the database, and a response goes back.</p>
                <p className={st.small}>Timings are a sample of one request, for illustration.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="limit" data-label="Limits" style={cc('navy')}>
              <div>
                <p className={st.tag}>
                  <i />
                  THE API · RATE LIMITING
                </p>
                <h2>
                  A budget for <em>every client</em>.
                </h2>
              </div>
              <div>
                <p>A token bucket refills a few tokens a second and each request spends one. Empty bucket, and the API answers 429 instead of falling over. Send a burst and watch.</p>
                <ul className={st.limits}>
                  <li>
                    <b>login</b> 10 / 15 min
                  </li>
                  <li>
                    <b>public scans</b> 20 / min
                  </li>
                  <li>
                    <b>everything else</b> 120 / min
                  </li>
                  <li>· ParkAssist’s real limits</li>
                </ul>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="scale" data-label="Scale" style={cc('oxblood')}>
              <div>
                <p className={st.tag}>
                  <i />
                  THE API · SCALING OUT
                </p>
                <h2>
                  More traffic, more <em>copies</em>.
                </h2>
              </div>
              <div>
                <p>The API keeps no session state, so it runs as several copies behind a load balancer. Repeat reads come from a cache and slow work goes to a queue. Spike the traffic and watch it add servers.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="stack" data-label="Stack" style={cc('rust')}>
              <div>
                <p className={st.tag}>
                  <i />
                  THE WHOLE STACK
                </p>
                <h2>
                  The tools behind <em>each part</em>.
                </h2>
              </div>
              <div>
                <p>React Native, Expo and Redux Toolkit on the phone; Next.js on the web; Node.js, Express and FastAPI in the API; MongoDB, PostgreSQL and Firebase for data; Docker and Vercel to ship; Claude and Gemini for the AI features.</p>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="resume" data-label="Resume" style={cc('teal')}>
              <div>
                <p className={st.tag}>
                  <i />
                  CAREER LOG
                </p>
                <h2>
                  4+ years, <em>shipped</em>.
                </h2>
              </div>
              <div>
                <p>I own features from design to Play Store release, and I’ve mentored four engineers on React Native and AI tools.</p>
                <div className={st.acts}>
                  <a className={c('btn', 'brass')} href={RESUME.href} download={RESUME.filename}>
                    <Download />
                    Download my resume (PDF)
                  </a>
                </div>
              </div>
            </section>
            <section className={st.ch} data-ref="chapter" data-scene="demos" data-label="Demos" style={cc('navy')}>
              <div>
                <p className={st.tag}>
                  <i />
                  LIVE DEMOS
                </p>
                <h2>
                  Try my <em>apps</em>.
                </h2>
              </div>
              <div>
                <p>None of them are on a store yet, so each one runs right here as a working copy, with a short intro video.</p>
                <div className={st.acts}>
                  <a className={st.btn} href={`mailto:${EMAIL}`}>
                    Let’s talk ↗
                  </a>
                  <span className={st.mail}>{EMAIL}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={st.timeline}>
          <button className={st.navbtn} type="button" data-ref="prev" aria-label="Previous chapter">
            <svg viewBox="0 0 16 16">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <div className={st.ticks} data-ref="ticks">
            <span className={st.prog} data-ref="prog" />
          </div>
          <button className={st.navbtn} type="button" data-ref="next" aria-label="Next chapter">
            <svg viewBox="0 0 16 16">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
