// The crane robot's personality: speech bubble, eyes that follow the cursor, a "?" visor over containers,
// boot-up on load, and dozing when nobody has moved for a while. The crane tells it when it is working.

const DOZE_MS = 15000;

type RobotOptions = {
  stage: HTMLElement;
  claw: HTMLElement;
  reduce: MediaQueryList;
};

export type Robot = {
  /** Show a line in the speech bubble; ms = 0 keeps it up until the next line */
  say(text: string, ms?: number): void;
  setBusy(on: boolean): void;
  /** Eyes flicker on and the visor fills before the first fetch */
  boot(): Promise<void>;
  destroy(): void;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createRobot({ stage, claw, reduce }: RobotOptions): Robot {
  const bubble = claw.querySelector<HTMLElement>('.bubble')!;
  const timers = new Set<number>();
  let working = false;
  let dozing = false;
  let pointer: { x: number; y: number } | null = null;
  let lookFrame = 0;
  let hideTimer = 0;
  let idleTimer = 0;

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  const cancel = (t: number) => {
    clearTimeout(t);
    timers.delete(t);
  };
  const wait = (ms: number) => new Promise<void>((resolve) => later(resolve, ms));
  const cxNow = () => parseFloat(claw.style.getPropertyValue('--cx')) || stage.clientWidth / 2;
  const lookAt = (x: number, y: number) => {
    claw.style.setProperty('--look', `${x}px`);
    claw.style.setProperty('--look-y', `${y}px`);
  };

  function say(text: string, ms = 2200) {
    bubble.textContent = text;
    claw.classList.toggle('flip', cxNow() > stage.clientWidth - 220);
    claw.classList.add('talking');
    cancel(hideTimer);
    if (ms) hideTimer = later(() => claw.classList.remove('talking'), ms);
  }

  function followPointer() {
    lookFrame = 0;
    if (working || dozing || !pointer) return;
    const r = stage.getBoundingClientRect();
    lookAt(clamp((pointer.x - r.left - cxNow()) / 40, -4, 4), clamp((pointer.y - r.top - 22) / 120, -2, 2.5));
  }

  function doze() {
    if (working) return restartIdle();
    dozing = true;
    claw.classList.add('dozing');
    claw.classList.remove('curious');
    lookAt(0, 0);
    say('z z z', 0);
  }

  function restartIdle() {
    cancel(idleTimer);
    idleTimer = later(doze, DOZE_MS);
  }

  function wake() {
    if (dozing) {
      dozing = false;
      claw.classList.remove('dozing');
      say('Oh! Hi there.');
    }
    restartIdle();
  }

  const onMove = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    wake();
    if (!lookFrame) lookFrame = requestAnimationFrame(followPointer);
  };
  const onLeave = () => {
    pointer = null;
    if (!working) lookAt(0, 0);
  };
  // Hovering a container in the pile makes the visor show "?"
  const onOver = (e: PointerEvent) => {
    const box = (e.target as Element).closest('.box');
    claw.classList.toggle('curious', !!box && !working && !dozing && !box.classList.contains('held'));
  };
  const WAKE_EVENTS = ['keydown', 'pointerdown', 'touchstart'] as const;

  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerleave', onLeave);
  stage.addEventListener('pointerover', onOver);
  WAKE_EVENTS.forEach((t) => window.addEventListener(t, wake, { passive: true }));
  restartIdle();

  return {
    say,
    setBusy(on) {
      working = on;
      if (on) {
        wake();
        claw.classList.remove('curious');
        lookAt(0, 1.5);
      } else {
        lookAt(0, 0);
        restartIdle();
      }
    },
    async boot() {
      if (reduce.matches) return;
      claw.classList.add('booting');
      say('Booting up…', 0);
      await wait(1100);
      claw.classList.remove('booting');
      say('Hi! I’m the depot bot.', 0);
      await wait(700);
    },
    destroy() {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      cancelAnimationFrame(lookFrame);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('pointerover', onOver);
      WAKE_EVENTS.forEach((t) => window.removeEventListener(t, wake));
    },
  };
}
