// One 3D shipping container: six faces, four interior walls, two doors and the section inside.
// Memoised so React never touches the classes and custom properties the crane sets on it.

import { memo, type CSSProperties } from 'react';
import type { ContainerSpec } from './containers';

const FACES = ['f-back', 'f-top', 'f-bot', 'f-l', 'f-r', 'i-top', 'i-bot', 'i-l', 'i-r'];

type Props = {
  index: number;
  spec: ContainerSpec;
  register: (index: number, el: HTMLDivElement | null) => void;
  onPick: (index: number) => void;
};

export const ContainerBox = memo(function ContainerBox({ index, spec, register, onPick }: Props) {
  const n = String(index + 1).padStart(2, '0');
  const wallId = `wall-${spec.id}`;
  const headingId = `h-${spec.id}`;
  // The label spans both doors: each door shows its half of the same text
  const label = (
    <span className="label">
      {spec.label[0]}
      <br />
      {spec.label[1]}
    </span>
  );

  return (
    <div
      className="box"
      ref={(el) => register(index, el)}
      style={{ '--c': spec.color, '--c2': spec.dark } as CSSProperties}
      onClick={() => onPick(index)}
    >
      {FACES.map((face) => (
        <span key={face} className={`face ${face}`} />
      ))}
      <button className="front" type="button" aria-label={spec.ariaLabel} aria-expanded={false} aria-controls={wallId}>
        <span className="door l">
          <span className="out">{label}</span>
          <span className="in" />
        </span>
        <span className="door r">
          <span className="out">
            {label}
            <span className="tag">{spec.tag}</span>
          </span>
          <span className="in" />
        </span>
      </button>
      <section className="wall" id={wallId} inert aria-labelledby={headingId}>
        <spec.Content headingId={headingId} kicker={`${n} / ${spec.kicker}`} />
      </section>
    </div>
  );
});
