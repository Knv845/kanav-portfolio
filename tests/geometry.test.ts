import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gripOf, lifted, measure, parked, pileOf, PHONE_MAX, stackOrder, zoomed, type Tilt } from '../lib/geometry.ts';

// Same pile tables as components/containers.ts (kept here so the test runs without React)
const DESKTOP: Tilt[] = [
  [0.43, 0.645, -14, -24, 6], [0.1, 0.85, -16, 28, 16], [0.62, 0.66, -13, 22, -8], [0.3, 0.87, -12, -20, -10],
  [0.51, 0.88, -15, -18, 9], [0.71, 0.895, -14, 24, 12], [0.9, 0.9, -16, -30, -14], [0.21, 0.63, -14, 30, -12],
  [0.82, 0.68, -14, -26, 16],
];
const PHONE: Tilt[] = [
  [0.5, 0.64, -14, -20, 5], [0.17, 0.9, -16, 24, 12], [0.82, 0.655, -14, 22, -9], [0.5, 0.915, -12, -18, -8],
  [0.21, 0.62, -15, -24, 10], [0.84, 0.93, -14, 22, 10], [0.2, 0.77, -16, -26, -12], [0.52, 0.79, -14, 26, -9],
  [0.82, 0.8, -14, -22, 12],
];

// Stage sizes: width × (viewport height − nav)
const STAGES = [
  [1920, 1008], [1440, 828], [1280, 648], [1024, 696], [768, 952], [701, 500],
  [700, 740], [430, 836], [390, 748], [360, 600],
] as const;

const tiltsFor = (sw: number) => (sw <= PHONE_MAX ? PHONE : DESKTOP);

describe('measure', () => {
  it('sizes desktop containers at 20% of the stage, between 200 and 310px', () => {
    assert.equal(measure(1440, 828, DESKTOP).w, 288);
    assert.equal(measure(800, 828, DESKTOP).w, 200);
    assert.equal(measure(2400, 1200, DESKTOP).w, 310);
  });

  it('switches to the phone layout at 700px and below', () => {
    assert.equal(measure(700, 740, PHONE).phone, true);
    assert.equal(measure(701, 740, DESKTOP).phone, false);
    assert.equal(measure(390, 748, PHONE).w, 390 * 0.38);
    assert.ok(measure(600, 748, PHONE).w <= 170);
  });

  it('uses the full grow factor when there is room', () => {
    assert.equal(measure(1440, 828, DESKTOP).f, 1.95);
    assert.equal(measure(390, 748, PHONE).f, 2.4);
  });

  for (const [sw, sh] of STAGES) {
    it(`keeps a lifted container clear of the pile and inside the stage at ${sw}×${sh}`, () => {
      const tilts = tiltsFor(sw);
      const g = measure(sw, sh, tilts);
      const up = lifted(g);
      const bottom = up.y + up.h * 0.55; // tilted box reaches a little past h/2
      const pileTop = Math.min(...tilts.map((t) => pileOf(g, t).y - 0.62 * g.h));
      if (g.f > 1.25) assert.ok(bottom <= pileTop, `lifted bottom ${bottom.toFixed(0)} overlaps pile top ${pileTop.toFixed(0)}`);
      assert.ok(up.w <= sw - (g.phone ? 24 : 120) + 1e-9, `lifted width ${up.w} too wide for ${sw}`);
    });
  }
});

describe('look closer', () => {
  it('brings the container to about 2× its lifted size on a laptop screen', () => {
    const g = measure(1440, 828, DESKTOP);
    const ratio = zoomed(g).w / lifted(g).w;
    assert.ok(ratio > 1.9 && ratio <= 2.1 + 1e-9, `ratio ${ratio}`);
  });

  for (const [sw, sh] of STAGES) {
    it(`never shrinks, fits the width and leaves room for the button at ${sw}×${sh}`, () => {
      const g = measure(sw, sh, tiltsFor(sw));
      const z = zoomed(g);
      assert.ok(z.w >= lifted(g).w - 1e-9, 'smaller than the lifted container');
      assert.ok(z.w <= (g.phone ? sw - 8 : sw * 0.94) + 1e-9 || z.w === lifted(g).w, `width ${z.w} wider than ${sw}`);
      // Front edge, drawn about 20% taller by perspective, stays above the 64px button strip
      if (z.w > lifted(g).w) assert.ok(g.top + z.h * 1.2 <= sh - 64 + 1e-6, `bottom ${(g.top + z.h * 1.2).toFixed(0)} past ${sh - 64}`);
      assert.equal(gripOf(z).cx, sw / 2);
    });
  }
});

describe('claw grips', () => {
  it('spans 1.06 × the container width', () => {
    const g = measure(1440, 828, DESKTOP);
    assert.equal(gripOf(lifted(g)).span, lifted(g).w * 1.06);
    assert.equal(gripOf(pileOf(g, DESKTOP[0])).span, g.w * 1.06);
  });

  it('lowers the head onto the visible top of the container', () => {
    const g = measure(1440, 828, DESKTOP);
    for (const s of [lifted(g), pileOf(g, DESKTOP[3])]) {
      const { len } = gripOf(s);
      const headBottom = 14 + 25 + len + 34;
      assert.ok(Math.abs(headBottom - (s.y - s.k * s.h)) <= 3);
    }
  });

  it('lifts a container to the top centre', () => {
    const g = measure(1440, 828, DESKTOP);
    assert.equal(lifted(g).x, 720);
    assert.equal(gripOf(lifted(g)).cx, 720);
    assert.equal(parked(g).cx, 720);
  });
});

describe('stacking', () => {
  it('puts lower containers in front', () => {
    assert.ok(stackOrder(DESKTOP[6]) > stackOrder(DESKTOP[0]));
  });

  it('never lets a left neighbour cover the next box’s label within a row', () => {
    for (const tilts of [DESKTOP, PHONE]) {
      const rows = new Map<number, Tilt[]>();
      for (const t of tilts) {
        const row = Math.round(t[1] * 5); // rows sit roughly 0.2 of the stage apart
        rows.set(row, [...(rows.get(row) ?? []), t]);
      }
      for (const row of rows.values()) {
        const byX = [...row].sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < byX.length; i++) assert.ok(stackOrder(byX[i]) >= stackOrder(byX[i - 1]));
      }
    }
  });
});
