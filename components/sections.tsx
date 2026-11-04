// What's inside each container. Every section gets a kicker and a heading whose last word is the accent.

import type { ReactNode } from 'react';
import { DeckCarousel } from './DeckCarousel';

export const EMAIL = 'knvkhera30@gmail.com';
export const RESUME = { href: '/resume/Kanav-Khera-Resume.pdf', filename: 'Kanav-Khera-Resume.pdf' };

export type SectionProps = { headingId: string; kicker: string };

function Heading({ id, title, accent }: { id: string; title: string; accent: string }) {
  return (
    <h2 id={id} tabIndex={-1}>
      {title} <em>{accent}</em>
    </h2>
  );
}

function Section({ headingId, kicker, title, accent, children }: SectionProps & { title: string; accent: string; children: ReactNode }) {
  return (
    <div className="content">
      <p className="kicker">{kicker}</p>
      <Heading id={headingId} title={title} accent={accent} />
      {children}
    </div>
  );
}

export function Hello(props: SectionProps) {
  return (
    <Section {...props} title="Hi, I’m" accent="Kanav.">
      <p>
        An applied AI engineer who puts LLM features into real apps, with 4+ years of shipping React Native and Node.js
        behind me. Every container in the pile holds a piece of my work.
      </p>
    </Section>
  );
}

export function Work(props: SectionProps) {
  return (
    <Section {...props} title="The" accent="work.">
      <ul className="list">
        <li>
          <b>ParkAssist</b> · QR-code parking with an AI rules check
        </li>
        <li>
          <b>NearMed</b> · nearby pharmacies price your prescription
        </li>
      </ul>
    </Section>
  );
}

export function OnDeck({ headingId, kicker }: SectionProps) {
  return (
    <DeckCarousel kicker={kicker}>
      <Heading id={headingId} title="Apps I’ve" accent="shipped." />
    </DeckCarousel>
  );
}

export function About(props: SectionProps) {
  return (
    <Section {...props} title="A little about" accent="me.">
      <p>
        <b>4+ years</b> shipping React Native apps: now at Dealermatix Technologies, before that Tata Technologies. I own
        features from design to Play Store release and have mentored <b>4 engineers</b> on React Native and AI tools.
      </p>
    </Section>
  );
}

const VOYAGES = [
  {
    when: 'Jul 2024 – now',
    company: 'Dealermatix Technologies',
    role: 'Software Developer · field-sales apps for 5,000+ users',
    stamp: 'In transit',
    live: true,
  },
  {
    when: 'Jun 2022 – Jul 2024',
    company: 'Tata Technologies',
    role: 'Solutions Developer · React.js and React Native apps',
    stamp: 'Delivered',
    live: false,
  },
];

export function CareerLog({ headingId, kicker }: SectionProps) {
  return (
    <div className="content manifest-wrap">
      <div className="manifest">
        <div className="mf-head">
          <div>
            <p className="kicker">{kicker}</p>
            <Heading id={headingId} title="Where I’ve" accent="worked." />
          </div>
          <p className="mf-no">
            Cargo manifest<b>KK-2026</b>
          </p>
        </div>
        <ol className="mf-rows">
          {VOYAGES.map((v) => (
            <li className="mf-row" key={v.company}>
              <p className="mf-when">{v.when}</p>
              <div>
                <p className="mf-co">{v.company}</p>
                <p className="mf-role">{v.role}</p>
              </div>
              <p className={v.live ? 'stamp live' : 'stamp'}>{v.stamp}</p>
            </li>
          ))}
        </ol>
        <p className="mf-foot">
          <span>Port of loading</span>Chandigarh Group of Colleges · B.Tech CS · 2022
        </p>
      </div>
    </div>
  );
}

const STEPS = [
  ['Plan', 'requirements, system design and UI'],
  ['Build', 'app, API and database, end to end'],
  ['Ship & tune', 'release, then speed it up on low-end Android'],
];

export function Process(props: SectionProps) {
  return (
    <Section {...props} title="How I" accent="build.">
      <ol className="list">
        {STEPS.map(([step, detail], i) => (
          <li key={step}>
            <span className="n">{String(i + 1).padStart(2, '0')}</span>
            <b>{step}</b> · {detail}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="chips">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function Toolkit(props: SectionProps) {
  return (
    <Section {...props} title="What’s in the" accent="box.">
      <Chips
        items={['React Native', 'Expo', 'Redux Toolkit', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'Firebase', 'Docker', 'Claude Code']}
      />
    </Section>
  );
}

export function WhatIDo(props: SectionProps) {
  return (
    <Section {...props} title="What I" accent="do.">
      <Chips
        items={[
          'LLM features in apps',
          'End-to-end feature ownership',
          'System design',
          'Offline-first apps',
          'Fast apps on low-end phones',
          'Code reviews & mentoring',
        ]}
      />
    </Section>
  );
}

export function SayHello(props: SectionProps) {
  return (
    <Section {...props} title="Got an" accent="idea?">
      <p>Have a project in mind, a role to fill, or just want to say hi?</p>
      <div className="ctas">
        <a className="cta" href={`mailto:${EMAIL}`}>
          {EMAIL} ↗
        </a>
        <a className="cta cta-alt" href={RESUME.href} download={RESUME.filename} data-resume>
          Download resume (PDF)
        </a>
      </div>
    </Section>
  );
}
