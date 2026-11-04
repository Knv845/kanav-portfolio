'use client';

// Split-flap stats board: flips to the next figure every few seconds, or on click.
// The cells are updated directly so a flip never re-renders React.

import { useEffect, useRef } from 'react';

const STATS = ['5,000+ USERS', '4+ YEARS', '4 MENTEES', '81 TESTS'];
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+,';
const CELLS = 12;
const EVERY_MS = 4500;
const FLIP = [
  { transform: 'perspective(30px) rotateX(0deg)' },
  { transform: 'perspective(30px) rotateX(-75deg)', offset: 0.4 },
  { transform: 'perspective(30px) rotateX(0deg)' },
];

export function StatsBoard() {
  const cellsRef = useRef<HTMLSpanElement>(null);
  const nextRef = useRef<() => void>(() => {});
  const pausedRef = useRef(false);

  useEffect(() => {
    const cells = Array.from(cellsRef.current!.children) as HTMLElement[];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timers = new Set<number>();
    let stat = 0;
    let run = 0;

    function show(text: string) {
      const flip = ++run;
      text
        .padEnd(CELLS)
        .split('')
        .forEach((to, k) => {
          const cell = cells[k];
          if (reduce.matches) {
            cell.textContent = to;
            return;
          }
          if (cell.textContent === to) return;
          const hops = 2 + Math.floor(Math.random() * 3);
          for (let s = 0; s <= hops; s++) {
            const t = window.setTimeout(() => {
              timers.delete(t);
              if (flip !== run) return;
              cell.textContent = s === hops ? to : FLAP[Math.floor(Math.random() * FLAP.length)];
              cell.animate(FLIP, { duration: 80, easing: 'ease-out' });
            }, k * 30 + s * 80);
            timers.add(t);
          }
        });
    }

    nextRef.current = () => show(STATS[(stat = (stat + 1) % STATS.length)]);
    const interval = window.setInterval(() => {
      if (!pausedRef.current && !reduce.matches && !document.hidden) nextRef.current();
    }, EVERY_MS);
    return () => {
      window.clearInterval(interval);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <div className="board">
      <p className="board-cap" aria-hidden="true">
        PORT STATS
      </p>
      <button
        className="flaps"
        type="button"
        aria-label="Port stats board: show the next figure"
        onClick={() => nextRef.current()}
        onPointerEnter={() => (pausedRef.current = true)}
        onPointerLeave={() => (pausedRef.current = false)}
        onFocus={() => (pausedRef.current = true)}
        onBlur={() => (pausedRef.current = false)}
      >
        <span className="led" aria-hidden="true" />
        <span className="cells" aria-hidden="true" ref={cellsRef}>
          {STATS[0]
            .padEnd(CELLS)
            .split('')
            .map((c, i) => (
              <span className="cell" key={i}>
                {c}
              </span>
            ))}
        </span>
      </button>
      <ul className="sr">
        <li>5,000+ users on the field-sales app I own</li>
        <li>4+ years building React Native apps</li>
        <li>4 engineers mentored</li>
        <li>81 Jest tests on a pharmacy e-commerce backend</li>
      </ul>
    </div>
  );
}
