// Pure layout maths for the depot: container sizes, pile poses, the lifted pose and claw grips.
// Everything is in CSS pixels relative to the stage's top-left corner.

/** x, y as fractions of the stage, then rotateX, rotateY, rotateZ in degrees. */
export type Tilt = readonly [x: number, y: number, rx: number, ry: number, rz: number];

export type Geometry = {
  sw: number;
  sh: number;
  phone: boolean;
  /** Pile container size */
  w: number;
  h: number;
  d: number;
  /** How much a container grows when lifted */
  f: number;
  /** Top edge of a lifted container */
  top: number;
};

export type Pose = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rz: number;
  w: number;
  h: number;
  d: number;
  /** Perspective distance */
  p: number;
  /** How far above its centre the box's visible top sits, as a share of its height */
  k: number;
};

export type Grip = { cx: number; len: number; span: number; fl: number };

export const PHONE_MAX = 700;
const RAIL = 14;
const ROD = RAIL + 25;
const HEAD = 34;

export function measure(sw: number, sh: number, tilts: readonly Tilt[]): Geometry {
  const phone = sw <= PHONE_MAX;
  const w = phone ? Math.min(170, sw * 0.38) : Math.min(310, Math.max(200, sw * 0.2));
  const h = w * (phone ? 0.6 : 0.43);
  const d = w * (phone ? 0.56 : 0.4);
  const top = phone ? 74 : 92;
  const pileTop = Math.min(...tilts.map((t) => t[1])) * sh - 0.62 * h;
  // Grow factor, held back if the stage is too narrow or the lifted box would reach the pile
  const f = Math.max(
    1.25,
    Math.min(phone ? 2.4 : 1.95, (sw - (phone ? 24 : 120)) / w, (pileTop - 14 - top) / (h * 1.1)),
  );
  return { sw, sh, phone, w, h, d, f, top };
}

export function pileOf(g: Geometry, tilt: Tilt): Pose {
  const [fx, fy, rx, ry, rz] = tilt;
  return { x: fx * g.sw, y: fy * g.sh, rx, ry, rz, w: g.w, h: g.h, d: g.d, p: g.phone ? 900 : 1300, k: 0.6 };
}

export function lifted(g: Geometry): Pose {
  const h = g.h * g.f;
  return { x: g.sw / 2, y: g.top + h * 0.56, rx: -7, ry: -11, rz: 0, w: g.w * g.f, h, d: g.d * g.f, p: 2600, k: 0.56 };
}

/**
 * The open container brought forward for a closer look: up to about 2× its lifted size, held back by the stage's
 * width and by its height (leaving room for the button below). A slight angle keeps its corrugated sides in view.
 * The 1.2 height allowance covers the front edge, which perspective draws taller than the box itself.
 */
export function zoomed(g: Geometry): Pose {
  const f = Math.max(
    g.f,
    Math.min(g.f * 2.1, (g.phone ? g.sw - 8 : g.sw * 0.94) / g.w, (g.sh - g.top - 64) / (g.h * 1.2)),
  );
  const h = g.h * f;
  return { x: g.sw / 2, y: g.top + h * 0.53, rx: -6, ry: -5, rz: 0, w: g.w * f, h, d: g.d * f, p: 3200, k: 0.53 };
}

export function gripOf(s: Pose): Grip {
  const top = s.y - s.k * s.h;
  return { cx: s.x, len: Math.max(6, top - ROD - HEAD + 3), span: s.w * 1.06, fl: (s.k - 0.05) * s.h + 14 };
}

export function parked(g: Geometry): Grip {
  return { cx: g.sw / 2, len: 8, span: g.w * 1.06, fl: g.h * 0.5 + 14 };
}

/** Lower containers in the pile sit in front of higher ones. */
export const stackOrder = (tilt: Tilt) => Math.round(tilt[1] * 100);
