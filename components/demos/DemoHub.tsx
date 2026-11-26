'use client';

// The DEMO button in the nav. It opens a small menu of projects; picking one opens the viewer: what the
// project is on one side, a working copy of the app in a phone or browser frame on the other.
// None of the apps are on a store or hosted yet, so each demo runs on sample data in the browser.
// Every demo has its own link (#demo/nearmed etc.) to paste straight to a recruiter.

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useId, useRef, useState, type ComponentType } from 'react';
import { BrowserFrame, PhoneFrame } from './Frames';
import { EMAIL } from '../sections';
import { PROJECTS, type Project, type View } from './projects';

const loading = () => <p className="dv-loading">Starting the app…</p>;

// Each app only downloads when someone opens it
const APPS: Record<string, ComponentType> = {
  'nearmed-app': dynamic(() => import('./nearmed/CustomerApp'), { ssr: false, loading }),
  'nearmed-web': dynamic(() => import('./nearmed/StoreWeb'), { ssr: false, loading }),
  parkassist: dynamic(() => import('./parkassist/ParkAssistApp'), { ssr: false, loading }),
  'saarag-chat': dynamic(() => import('./saarag/ChatApp'), { ssr: false, loading }),
  'saarag-admin': dynamic(() => import('./saarag/AdminApp'), { ssr: false, loading }),
  'saarag-mobile': dynamic(() => import('./saarag/MobileApp'), { ssr: false, loading }),
};

const HASH = '#demo/';

function DeviceIcon({ kind }: { kind: View['kind'] }) {
  return (
    <svg className="dev-ico" viewBox="0 0 16 16" aria-hidden="true">
      {kind === 'phone' ? <path d="M5 1.5h6a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM7 12.5h2" /> : <path d="M2 3h12v8H2zM6 14h4M8 11v3" />}
    </svg>
  );
}

function readHash(): { project: Project; view: number; intro: boolean } | null {
  if (!location.hash.startsWith(HASH)) return null;
  const [id, viewId] = location.hash.slice(HASH.length).split('/');
  const project = PROJECTS.find((p) => p.id === id);
  if (!project) return null;
  return { project, view: Math.max(0, project.views.findIndex((v) => v.id === viewId)), intro: viewId === 'intro' };
}

function writeHash(project: Project | null, view = 0) {
  const url = project ? `${HASH}${project.id}${view ? `/${project.views[view].id}` : ''}` : location.pathname + location.search;
  history.replaceState(null, '', url);
}

export function DemoHub() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<Project | null>(null);
  const [view, setView] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [intro, setIntro] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuId = useId();

  const open = useCallback((project: Project, v = 0, withIntro = false) => {
    setMenuOpen(false);
    setActive(project);
    setView(v);
    setInfoOpen(false);
    setIntro(withIntro);
    writeHash(project, v);
  }, []);

  const close = useCallback(() => {
    setActive(null);
    setIntro(false);
    writeHash(null);
    buttonRef.current?.focus();
  }, []);

  // A shared link opens its demo straight away
  useEffect(() => {
    const fromHash = () => {
      const hit = readHash();
      if (hit) open(hit.project, hit.view, hit.intro);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    if (active && !dialog.open) dialog.showModal();
    if (!active && dialog.open) dialog.close();
  }, [active]);

  // Close the menu on an outside click or Escape. Escape must not also reach the crane, which would fetch a container.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      setMenuOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, [menuOpen]);

  const pickView = (i: number) => {
    setView(i);
    if (active) writeHash(active, i);
  };

  const current: View | undefined = active?.views[view];
  const App = current ? APPS[current.app] : null;

  return (
    <div className="demo-hub" ref={menuRef}>
      <button
        ref={buttonRef}
        className="demo-btn"
        type="button"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="live-dot" aria-hidden="true" />
        Demo
      </button>

      <div className="demo-menu" id={menuId} hidden={!menuOpen}>
        <p className="dm-kicker">Live demos</p>
        <p className="dm-note">
          Not on the stores yet, so here’s a working copy of each app. Click one to use it right here, or ▶ for a short intro video.
        </p>
        <ul>
          {PROJECTS.map((p) => (
            <li key={p.id} className="dm-row" style={{ '--pc': p.color } as React.CSSProperties}>
              <button type="button" className="dm-play" aria-label={`Watch the ${p.name} intro (${p.intro.seconds} seconds)`} onClick={() => open(p, 0, true)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5 3.5v9l7.5-4.5z" />
                </svg>
                {p.intro.seconds}s
              </button>
              <button type="button" className="dm-item" onClick={() => open(p)}>
                <span className="dm-mark" aria-hidden="true">
                  {p.mark}
                </span>
                <span className="dm-text">
                  <b>{p.name}</b>
                  <span>{p.tagline}</span>
                  <span className="dm-tags">
                    {p.views.map((v) => (
                      <i key={v.id}>
                        <DeviceIcon kind={v.kind} /> {v.short}
                      </i>
                    ))}
                  </span>
                </span>
                <span className="dm-go" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="demo-viewer"
        aria-label={active ? `${active.name} live demo` : 'Live demo'}
        style={active ? ({ '--pc': active.color } as React.CSSProperties) : undefined}
        onCancel={(e) => {
          e.preventDefault();
          if (intro) setIntro(false);
          else close();
        }}
        onKeyDown={(e) => {
          // Keep keys typed into the demos (Escape above all) away from the crane's window listener
          e.nativeEvent.stopImmediatePropagation();
          e.stopPropagation();
        }}
      >
        {active && current && App && (
          <>
            <header className="dv-top">
              <nav className="dv-tabs" aria-label="Projects">
                {PROJECTS.map((p) => (
                  <button key={p.id} type="button" aria-current={p.id === active.id ? 'page' : undefined} onClick={() => open(p)}>
                    {p.name}
                  </button>
                ))}
              </nav>
              <button className="dv-intro-btn" type="button" onClick={() => setIntro(true)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5 3.5v9l7.5-4.5z" />
                </svg>
                Intro <span>· {active.intro.seconds}s</span>
              </button>
              <button className="dv-close" type="button" onClick={close} aria-label="Close the demo">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m3.5 3.5 9 9m0-9-9 9" />
                </svg>
              </button>
            </header>

            <div className="dv-body">
              <aside className={infoOpen ? 'dv-info open' : 'dv-info'}>
                <button className="dv-info-toggle" type="button" aria-expanded={infoOpen} onClick={() => setInfoOpen((o) => !o)}>
                  About {active.name} <span aria-hidden="true">{infoOpen ? '▴' : '▾'}</span>
                </button>
                <div className="dv-info-body">
                  <p className="dv-kicker">{active.kicker}</p>
                  <h2>{active.name}</h2>
                  <p className="dv-pitch">{active.pitch}</p>

                  <button type="button" className="dv-intro-card" onClick={() => setIntro(true)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size poster, no resizing needed */}
                    <img src={active.intro.poster} alt="" width={1280} height={720} loading="lazy" />
                    <span className="dv-intro-play" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <path d="M5 3.5v9l7.5-4.5z" />
                      </svg>
                    </span>
                    <span className="dv-intro-label">
                      Watch the {active.intro.seconds}-second intro <em>with sound</em>
                    </span>
                  </button>

                  <h3>How it works</h3>
                  <ol className="dv-steps">
                    {active.how.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>

                  <h3>What I built</h3>
                  <ul className="dv-points">
                    {active.built.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>

                  <h3>Stack</h3>
                  <ul className="dv-chips">
                    {active.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>

                  <p className="dv-source">
                    The code is in a private GitHub repo. I’m happy to walk you through it or share access.{' '}
                    <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(`${active.name}: code walkthrough`)}`}>
                      Ask me ↗
                    </a>
                  </p>
                </div>
              </aside>

              <section className="dv-stage" aria-label={`${active.name} demo`}>
                {active.views.length > 1 && (
                  <div className="dv-views" role="tablist" aria-label="Which part of the app">
                    {active.views.map((v, i) => (
                      <button key={v.id} type="button" role="tab" aria-selected={i === view} onClick={() => pickView(i)}>
                        <DeviceIcon kind={v.kind} /> {v.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="dv-hint">{current.hint}</p>
                <div className="dv-device">
                  {current.kind === 'phone' ? (
                    <PhoneFrame key={current.app} label={current.label}>
                      <App />
                    </PhoneFrame>
                  ) : (
                    <BrowserFrame key={current.app} label={current.label} url={current.url ?? ''}>
                      <App />
                    </BrowserFrame>
                  )}
                </div>
                <p className="dv-foot">Sample data · runs in your browser · nothing you type is sent anywhere</p>
              </section>
            </div>

            {intro && (
              <div className="dv-intro" role="dialog" aria-label={`${active.name} intro video`}>
                <video key={active.id} src={active.intro.src} poster={active.intro.poster} controls autoPlay playsInline preload="auto" />
                <div className="dv-intro-bar">
                  <b>{active.name} · intro</b>
                  <a href={active.intro.src} download={`${active.name}-intro.mp4`}>
                    Download MP4
                  </a>
                  <button type="button" className="dv-intro-done" onClick={() => setIntro(false)}>
                    Try the live demo →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
