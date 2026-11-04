'use client';

// App screens inside the On Deck container: a swipeable strip with previous/next buttons.
// App screenshots sit in a phone frame, website screenshots in a browser window.

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const SLIDES = [
  {
    app: 'ParkAssist',
    caption: 'app home: your QR code and scans',
    frame: 'phone',
    src: '/screens/parkassist-home.webp',
    alt: 'ParkAssist app home screen with the owner’s QR code, scan counts and quick actions',
  },
  {
    app: 'NearMed',
    caption: 'a pharmacy pricing a prescription',
    frame: 'browser',
    src: '/screens/nearmed-quote.webp',
    alt: 'NearMed store website: a handwritten prescription beside the form a pharmacy uses to send its price',
  },
  {
    app: 'NearMed',
    caption: 'the store owner’s dashboard',
    frame: 'browser',
    src: '/screens/nearmed-dashboard.webp',
    alt: 'NearMed store dashboard with today’s sales, orders and prescriptions waiting for a price',
  },
] as const;

// How long a button-driven scroll owns the caption before swipes take over again
const STEER_MS = 700;

export function DeckCarousel({ kicker, children }: { kicker: string; children: ReactNode }) {
  const shotsRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef(0);
  const steerUntil = useRef(0);
  const [slide, setSlide] = useState(0);

  const show = useCallback((n: number) => {
    slideRef.current = n;
    setSlide(n);
  }, []);

  useEffect(() => {
    const shots = shotsRef.current!;
    let frame = 0;
    const onScroll = () => {
      if (performance.now() < steerUntil.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const n = Math.round(shots.scrollLeft / shots.clientWidth);
        if (n !== slideRef.current) show(n);
      });
    };
    // The screens grow with the container, so keep the current one lined up
    const resize = new ResizeObserver(() => {
      shots.scrollLeft = slideRef.current * shots.clientWidth;
    });
    shots.addEventListener('scroll', onScroll, { passive: true });
    resize.observe(shots);
    return () => {
      shots.removeEventListener('scroll', onScroll);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [show]);

  function step(by: number) {
    const shots = shotsRef.current!;
    const n = (slideRef.current + by + SLIDES.length) % SLIDES.length;
    show(n);
    steerUntil.current = performance.now() + STEER_MS;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    shots.scrollTo({ left: n * shots.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }

  const current = SLIDES[slide];

  return (
    <div className="content deck">
      <div className="deck-copy">
        <p className="kicker">{kicker}</p>
        {children}
        <div className="deck-nav">
          <button className="deck-btn" type="button" aria-label="Previous screen" onClick={() => step(-1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button className="deck-btn" type="button" aria-label="Next screen" onClick={() => step(1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
          <span className="deck-count">
            {slide + 1} / {SLIDES.length}
          </span>
        </div>
        <p className="deck-cap" aria-live="polite">
          <b>{current.app}</b> · {current.caption}
        </p>
      </div>
      <div className="shots" ref={shotsRef} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="App screens">
        {SLIDES.map((s, i) => {
          const screen = (
            <div className="screen">
              <Image
                src={s.src}
                alt={s.alt}
                fill
                loading="eager"
                sizes={s.frame === 'phone' ? '200px' : '(max-width: 700px) 240px, 480px'}
              />
            </div>
          );
          return (
            <figure className="shot" key={s.src} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}>
              {s.frame === 'phone' ? (
                <div className="phone">{screen}</div>
              ) : (
                <div className="browser">
                  <span className="bar" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  {screen}
                </div>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}
