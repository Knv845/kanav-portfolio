// The claw engine. It drives the containers and the claw through CSS custom properties
// (registered in globals.css) so React never re-renders during an animation.

import {
  gripOf,
  lifted,
  measure,
  parked,
  pileOf,
  PHONE_MAX,
  stackOrder,
  zoomed,
  type Geometry,
  type Grip,
  type Pose,
  type Tilt,
} from './geometry';
import { createRobot } from './robot';

export type ZoomState = {
  /** A container is open and the claw is idle, so "Look closer" can run */
  ready: boolean;
  focused: boolean;
};

type CraneOptions = {
  stage: HTMLElement;
  claw: HTMLElement;
  boxes: HTMLElement[];
  piles: { desktop: readonly Tilt[]; phone: readonly Tilt[] };
  /** What the robot calls each container in its speech bubble */
  names: readonly string[];
  /** The container Escape brings back, and the one picked on load */
  home: number;
  onHeld: (index: number | null) => void;
  onZoom: (state: ZoomState) => void;
};

export type Crane = {
  /** Fetch a container (nav links, Escape); focuses its heading if it is already open */
  pick(index: number): void;
  /** A click on a container in the pile; ignored for the open one so clicks inside it don't steal focus */
  pickFromPile(index: number): void;
  /** Bring the open container forward for a closer look, or send it back */
  setFocus(on: boolean): void;
  toggleFocus(): void;
  destroy(): void;
};

const HELD_Z = '500';
const ZOOM_MS = 700;

export function createCrane({ stage, claw, boxes, piles, names, home, onHeld, onZoom }: CraneOptions): Crane {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const robot = createRobot({ stage, claw, reduce });
  const timers = new Set<number>();
  let g: Geometry;
  let held: number | null = null;
  let active: number | null = null;
  let busy = false;
  let focused = false;
  let queued: { index: number; fromUser: boolean } | null = null;

  const tilts = () => (g.phone ? piles.phone : piles.desktop);
  const heldPose = () => (focused ? zoomed(g) : lifted(g));
  const time = (ms: number) => (reduce.matches ? 0 : ms);
  // Timers are cleared on destroy, which leaves any running sequence parked for good
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      if (reduce.matches) return resolve();
      const t = window.setTimeout(() => {
        timers.delete(t);
        resolve();
      }, ms);
      timers.add(t);
    });

  function moveBox(i: number, s: Pose, ms: number) {
    const st = boxes[i].style;
    st.setProperty('--dur', `${time(ms)}ms`);
    for (const k of ['x', 'y', 'w', 'h', 'd', 'p'] as const) st.setProperty(`--${k}`, `${s[k]}px`);
    for (const k of ['rx', 'ry', 'rz'] as const) st.setProperty(`--${k}`, `${s[k]}deg`);
  }

  let lastCx: number | null = null;
  function moveClaw(c: Grip, ms: number) {
    const st = claw.style;
    st.setProperty('--dur', `${time(ms)}ms`);
    for (const [k, v] of Object.entries(c)) st.setProperty(`--${k}`, `${v}px`);
    // The robot glances the way it is about to travel
    if (ms > 0 && lastCx !== null && Math.abs(c.cx - lastCx) > 2) st.setProperty('--look', `${c.cx > lastCx ? 3 : -3}px`);
    lastCx = c.cx;
  }

  function setHeld(i: number | null) {
    held = i;
    onHeld(i);
  }

  const syncZoom = () => onZoom({ ready: held !== null && !busy, focused });

  function setDoors(i: number, open: boolean) {
    const box = boxes[i];
    box.classList.toggle('open', open);
    box.querySelector<HTMLElement>('.wall')!.inert = !open;
    box.querySelector('.front')!.setAttribute('aria-expanded', String(open));
  }

  const focusHeading = (i: number) => boxes[i].querySelector<HTMLElement>('.wall h2')?.focus({ preventScroll: true });

  async function putBack(j: number) {
    focused = false;
    stage.classList.remove('focus');
    robot.say(`Putting ${names[j]} back`, 0);
    setDoors(j, false);
    await wait(450);
    const s = pileOf(g, tilts()[j]);
    moveBox(j, s, 850);
    moveClaw(gripOf(s), 850);
    await wait(850);
    claw.classList.add('open');
    await wait(240);
    boxes[j].classList.remove('held');
    boxes[j].style.zIndex = String(stackOrder(tilts()[j]));
    setHeld(null);
  }

  async function grab(i: number) {
    const box = boxes[i];
    active = i;
    box.classList.add('active');
    claw.classList.add('open');
    robot.say(`Fetching ${names[i]}…`, 0);
    moveClaw({ ...gripOf(pileOf(g, tilts()[i])), len: gripOf(lifted(g)).len }, 750); // travel along the rail
    await wait(750);
    moveClaw(gripOf(pileOf(g, tilts()[i])), 560); // drop onto the box
    await wait(560);
    robot.say('Scanning…', 0); // sweep the box with the beam
    claw.classList.add('scanning');
    await wait(520);
    claw.classList.remove('scanning');
    claw.classList.remove('open'); // grip
    robot.say(`Got ${names[i]}!`, 0);
    await wait(240);
    box.classList.add('held');
    box.classList.remove('active');
    box.style.zIndex = HELD_Z;
    active = null;
    setHeld(i);
    const up = lifted(g);
    moveBox(i, up, 950); // lift, straighten and grow
    moveClaw(gripOf(up), 950);
    await wait(950);
    setDoors(i, true); // swing the doors open
    robot.say('Here you go!');
    await wait(750);
  }

  function runQueued() {
    if (!queued) return false;
    const q = queued;
    queued = null;
    void pick(q.index, q.fromUser);
    return true;
  }

  // Clicks during a sequence are queued; the latest one runs next
  async function pick(i: number, fromUser: boolean): Promise<void> {
    if (busy) {
      queued = { index: i, fromUser };
      return;
    }
    if (i === held) {
      if (fromUser) focusHeading(i);
      return;
    }
    busy = true;
    syncZoom();
    robot.setBusy(true);
    claw.classList.add('busy');
    claw.classList.remove('happy');
    if (held !== null) await putBack(held);
    await grab(i);
    busy = false;
    syncZoom();
    robot.setBusy(false);
    claw.classList.remove('busy');
    claw.classList.add('happy');
    claw.style.setProperty('--look', '0px');
    if (runQueued()) return;
    if (fromUser) focusHeading(i);
  }

  // Look closer: the claw brings the open container forward, bigger and almost straight on
  async function setFocus(on: boolean) {
    if (busy || held === null || focused === on) return;
    busy = true;
    focused = on;
    stage.classList.toggle('focus', on);
    syncZoom();
    robot.say(on ? 'Have a closer look!' : 'Back to the pile.');
    const s = heldPose();
    moveBox(held, s, ZOOM_MS);
    moveClaw(gripOf(s), ZOOM_MS);
    await wait(ZOOM_MS);
    busy = false;
    syncZoom();
    runQueued();
  }

  // Recalculate sizes and snap everything not mid-move to its resting place
  function settle() {
    const sw = stage.clientWidth;
    g = measure(sw, stage.clientHeight, sw <= PHONE_MAX ? piles.phone : piles.desktop);
    boxes.forEach((box, i) => {
      if (i === held) {
        if (!busy) moveBox(i, heldPose(), 0);
        return;
      }
      if (i === active) return;
      moveBox(i, pileOf(g, tilts()[i]), 0);
      box.style.zIndex = String(stackOrder(tilts()[i]));
    });
    if (!busy) moveClaw(held === null ? parked(g) : gripOf(heldPose()), 0);
  }

  // Escape steps back: out of the close-up first, then home to PORTFOLIO
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (focused) void setFocus(false);
    else void pick(home, true);
  };
  // Any resume link: the browser downloads the file, the robot reacts
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('[data-resume]')) robot.say('Resume coming right up!');
  };
  // Double-clicking the open container zooms in or out
  const onDoubleClick = (e: MouseEvent) => {
    const box = (e.target as Element).closest('.box');
    if (!box || boxes.indexOf(box as HTMLElement) !== held) return;
    window.getSelection()?.removeAllRanges(); // a double-click would otherwise select the word under it
    void setFocus(!focused);
  };
  let frame = 0;
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(settle);
  });

  settle();
  claw.classList.add('open');
  stage.classList.add('ready');
  resize.observe(stage);
  window.addEventListener('keydown', onKey);
  document.addEventListener('click', onClick);
  stage.addEventListener('dblclick', onDoubleClick);
  void robot.boot().then(() => {
    const start = window.setTimeout(() => void pick(home, false), reduce.matches ? 500 : 0);
    timers.add(start);
  });

  return {
    pick: (i) => void pick(i, true),
    pickFromPile: (i) => {
      if (i !== held) void pick(i, true);
    },
    setFocus: (on) => void setFocus(on),
    toggleFocus: () => void setFocus(!focused),
    destroy() {
      robot.destroy();
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      stage.removeEventListener('dblclick', onDoubleClick);
      stage.classList.remove('focus');
    },
  };
}
