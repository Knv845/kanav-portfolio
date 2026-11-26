'use client';

// Device frames for the live demos. Each demo is laid out at a fixed "design" size (a real phone or a
// laptop browser window) and scaled down to fit the space it is given, so it looks the same everywhere.

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type Size = { w: number; h: number; s: number };

/** Measures its box and works out how big the device can be. Narrow spaces get a narrower design width instead of unreadable text. */
function useFit(designW: number, designH: number, minScale: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: designW, h: designH, s: 0 });

  useLayoutEffect(() => {
    const el = ref.current!;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      let s = Math.min(width / designW, height / designH, 1);
      let w = designW;
      let h = designH;
      if (s < minScale) {
        // Reflow instead of shrinking past readability
        s = Math.min(minScale, height / designH);
        w = Math.floor(width / s);
        h = Math.floor(Math.min(designH, height / s));
      }
      setSize({ w, h, s });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designW, designH, minScale]);

  return { ref, size };
}

/** Holds the scaled device at its scaled size, so it centres and never overflows */
function Scaled({ size, children }: { size: Size; children: ReactNode }) {
  return (
    <div className="fit-box" style={{ width: size.w * size.s, height: size.h * size.s, visibility: size.s ? 'visible' : 'hidden' }}>
      <div className="fit-inner" style={{ width: size.w, height: size.h, transform: `scale(${size.s})` }}>
        {children}
      </div>
    </div>
  );
}

export function PhoneFrame({ label, children }: { label: string; children: ReactNode }) {
  // 360 × 760 screen plus a 12px bezel
  const { ref, size } = useFit(384, 784, 0);
  return (
    <div className="fit" ref={ref}>
      <Scaled size={size}>
      <div className="dv-phone" role="region" aria-label={label}>
        <div className="dv-phone-screen">
          <div className="dv-island" aria-hidden="true" />
          {children}
        </div>
      </div>
      </Scaled>
    </div>
  );
}

export function BrowserFrame({ label, url, children }: { label: string; url: string; children: ReactNode }) {
  const { ref, size } = useFit(1180, 740, 0.6);
  return (
    <div className="fit" ref={ref}>
      <Scaled size={size}>
      <div className="dv-browser" role="region" aria-label={label}>
        <div className="dv-browser-bar" aria-hidden="true">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="url">
            <svg viewBox="0 0 16 16">
              <path d="M5 7V5a3 3 0 0 1 6 0v2M4 7h8v6H4z" />
            </svg>
            {url}
          </span>
        </div>
        {/* Container queries inside the demo apps read this width */}
        <div className="dv-browser-screen">{children}</div>
      </div>
      </Scaled>
    </div>
  );
}
