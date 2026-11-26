// The nine containers, in reading order. Each one's pile position lives next to its content.

import type { ComponentType } from 'react';
import type { Tilt } from '@/lib/geometry';
import { About, CareerLog, Hello, OnDeck, Process, SayHello, Toolkit, WhatIDo, Work, type SectionProps } from './sections';

export type ContainerSpec = {
  id: string;
  /** What the robot calls it in its speech bubble */
  name: string;
  color: string;
  dark: string;
  /** Two-line door label */
  label: readonly [string, string];
  tag: string;
  kicker: string;
  ariaLabel: string;
  /** Two rows on desktop, three on phones; within a row y creeps down left to right so no box covers a neighbour's label */
  pile: Tilt;
  pilePhone: Tilt;
  Content: ComponentType<SectionProps>;
};

export const CONTAINERS: readonly ContainerSpec[] = [
  {
    id: 'portfolio', name: 'PORTFOLIO', color: '#7c2f2b', dark: '#531e1b', label: ['Port', 'folio'], tag: 'Kanav', kicker: 'Hello',
    ariaLabel: 'Open the Portfolio container: hello',
    pile: [0.43, 0.645, -14, -24, 6], pilePhone: [0.5, 0.64, -14, -20, 5], Content: Hello,
  },
  {
    id: 'work', name: 'THE WORK', color: '#9a5631', dark: '#6a3a20', label: ['The', 'work'], tag: '02', kicker: 'Selected work',
    ariaLabel: 'Open The Work container: selected work',
    pile: [0.1, 0.85, -16, 28, 16], pilePhone: [0.17, 0.9, -16, 24, 12], Content: Work,
  },
  {
    id: 'on-deck', name: 'ON DECK', color: '#4e6a56', dark: '#34483a', label: ['On', 'deck'], tag: '03', kicker: 'On deck',
    ariaLabel: 'Open the On Deck container: app screens',
    pile: [0.62, 0.66, -13, 22, -8], pilePhone: [0.82, 0.655, -14, 22, -9], Content: OnDeck,
  },
  {
    id: 'about', name: 'ABOUT ME', color: '#3d5773', dark: '#283b4f', label: ['About', 'me'], tag: '04', kicker: 'About me',
    ariaLabel: 'Open the About Me container',
    pile: [0.3, 0.87, -12, -20, -10], pilePhone: [0.5, 0.915, -12, -18, -8], Content: About,
  },
  {
    id: 'career', name: 'CAREER LOG', color: '#2f5457', dark: '#1f383a', label: ['Career', 'log'], tag: '05', kicker: 'Career log',
    ariaLabel: 'Open the Career Log container: work history',
    pile: [0.51, 0.88, -15, -18, 9], pilePhone: [0.21, 0.62, -15, -24, 10], Content: CareerLog,
  },
  {
    id: 'process', name: 'PROCESS', color: '#a5823f', dark: '#73592a', label: ['Pro', 'cess'], tag: '06', kicker: 'Process',
    ariaLabel: 'Open the Process container',
    pile: [0.71, 0.895, -14, 24, 12], pilePhone: [0.84, 0.93, -14, 22, 10], Content: Process,
  },
  {
    id: 'toolkit', name: 'TOOLKIT', color: '#6a727b', dark: '#4a5057', label: ['Tool', 'kit'], tag: '07', kicker: 'Toolkit',
    ariaLabel: 'Open the Toolkit container',
    pile: [0.9, 0.9, -16, -30, -14], pilePhone: [0.2, 0.77, -16, -26, -12], Content: Toolkit,
  },
  {
    id: 'what-i-do', name: 'WHAT I DO', color: '#5e6240', dark: '#41442c', label: ['What', 'I do'], tag: '08', kicker: 'What I do',
    ariaLabel: 'Open the What I Do container',
    pile: [0.21, 0.63, -14, 30, -12], pilePhone: [0.52, 0.79, -14, 26, -9], Content: WhatIDo,
  },
  {
    id: 'say-hello', name: 'SAY HELLO', color: '#2b3d5a', dark: '#1c293d', label: ['Say', 'hello'], tag: '09', kicker: 'Say hello',
    ariaLabel: 'Open the Say Hello container: contact',
    pile: [0.82, 0.68, -14, -26, 16], pilePhone: [0.82, 0.8, -14, -22, 12], Content: SayHello,
  },
];

export const NAMES = CONTAINERS.map((c) => c.name);

export const PILES = {
  desktop: CONTAINERS.map((c) => c.pile),
  phone: CONTAINERS.map((c) => c.pilePhone),
};

export const indexOf = (id: string) => CONTAINERS.findIndex((c) => c.id === id);

export const NAV = [
  { label: 'Work', id: 'work' },
  { label: 'About', id: 'about' },
  { label: 'Process', id: 'process' },
  { label: 'Contact', id: 'say-hello' },
] as const;
