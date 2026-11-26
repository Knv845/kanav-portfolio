'use client';

// The whole page: nav bar plus one full-height stage with the rail, the claw and the container pile.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createCrane, type Crane, type ZoomState } from '@/lib/crane';
import { ContainerBox } from './ContainerBox';
import { DemoHub } from './demos/DemoHub';
import { CONTAINERS, indexOf, NAMES, NAV, PILES } from './containers';
import { EMAIL, RESUME } from './sections';
import { StatsBoard } from './StatsBoard';

const HOME = indexOf('portfolio');

export function Depot() {
  const stageRef = useRef<HTMLElement>(null);
  const clawRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<(HTMLDivElement | null)[]>([]);
  const craneRef = useRef<Crane | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState>({ ready: false, focused: false });

  useEffect(() => {
    const crane = createCrane({
      stage: stageRef.current!,
      claw: clawRef.current!,
      boxes: boxesRef.current as HTMLDivElement[],
      piles: PILES,
      names: NAMES,
      home: HOME,
      onHeld: setHeld,
      onZoom: setZoom,
    });
    craneRef.current = crane;
    return () => {
      crane.destroy();
      craneRef.current = null;
    };
  }, []);

  const register = useCallback((index: number, el: HTMLDivElement | null) => {
    boxesRef.current[index] = el;
  }, []);
  const pickFromPile = useCallback((index: number) => craneRef.current?.pickFromPile(index), []);
  const pick = (index: number) => craneRef.current?.pick(index);

  return (
    <div className="app">
      <header className="nav">
        <button className="logo" type="button" aria-label="Kanav Khera: show the Portfolio container" onClick={() => pick(HOME)}>
          Kanav Khera
        </button>
        <nav className="links" aria-label="Sections">
          {NAV.map(({ label, id }) => {
            const index = indexOf(id);
            return (
              <button key={id} type="button" aria-current={held === index ? 'true' : undefined} onClick={() => pick(index)}>
                {label}
              </button>
            );
          })}
        </nav>
        <div className="nav-end">
          <DemoHub />
          <a className="resume" href={RESUME.href} download={RESUME.filename} data-resume aria-label="Download Kanav’s resume (PDF)">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M3 13h10" />
            </svg>
            <span>Resume</span>
          </a>
          <a className="talk" href={`mailto:${EMAIL}`}>
            Let’s Talk ↗
          </a>
        </div>
      </header>

      <main className="stage" ref={stageRef}>
        <h1 className="sr">Kanav Khera, applied AI engineer: portfolio</h1>
        <p className="depot">
          KANAV’S DEPOT · <b>{CONTAINERS.length} CONTAINERS</b> · 2026
        </p>
        <StatsBoard />
        <p className="backdrop" aria-hidden="true">
          PORTFOLIO
        </p>

        <div className="pile">
          {/* Dims the pile behind a zoomed container; clicking it zooms back out */}
          <div className="shade" onClick={() => craneRef.current?.setFocus(false)} />
          {CONTAINERS.map((spec, i) => (
            <ContainerBox key={spec.id} index={i} spec={spec} register={register} onPick={pickFromPile} />
          ))}
        </div>

        <div className="rig" aria-hidden="true">
          <div className="rail" />
          <div className="claw" ref={clawRef}>
            <div className="glow" />
            <div className="rod" />
            <div className="sleeve gloss" />
            <div className="arm l gloss" />
            <div className="arm r gloss" />
            <div className="finger l" />
            <div className="finger r" />
            <div className="beam" />
            <div className="head gloss" />
            <div className="carriage gloss">
              <span className="wheel l" />
              <span className="wheel r" />
              <span className="bot-face">
                <i className="eye l" />
                <i className="eye r" />
              </span>
            </div>
            <div className="bubble" />
          </div>
        </div>

        <button
          className="hint"
          type="button"
          disabled={!zoom.ready}
          aria-hidden={!zoom.ready}
          aria-pressed={zoom.focused}
          onClick={() => craneRef.current?.toggleFocus()}
        >
          {!zoom.ready ? (
            'PICK A CONTAINER ↓'
          ) : zoom.focused ? (
            'BACK TO THE PILE'
          ) : (
            <>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M10 2h4v4M6 14H2v-4M14 2 9.5 6.5M2 14l4.5-4.5" />
              </svg>
              LOOK CLOSER
            </>
          )}
        </button>
      </main>
    </div>
  );
}
