// NearMed sample data. Products, prices and the store come from the repo's seed (nearmed_backend/admin.py);
// the other stores and their distances are made up, because the seed has one store.

export const inr = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type Product = {
  id: string;
  name: string;
  generic: string;
  price: number;
  mrp: number;
  rx: boolean;
  pet?: boolean;
  stock: number;
  need: string[];
};

export const PRODUCTS: Product[] = [
  { id: 'crocin', name: 'Crocin Advance 500 mg', generic: 'paracetamol', price: 28, mrp: 30.5, rx: false, stock: 25, need: ['fever', 'pain'] },
  { id: 'dolo', name: 'Dolo 650', generic: 'paracetamol', price: 31, mrp: 33.5, rx: false, stock: 25, need: ['fever', 'pain'] },
  { id: 'pan40', name: 'Pan 40', generic: 'pantoprazole', price: 155, mrp: 160, rx: true, stock: 25, need: ['stomach'] },
  { id: 'azithral', name: 'Azithral 500', generic: 'azithromycin', price: 118, mrp: 122, rx: true, stock: 3, need: ['cold'] },
  { id: 'augmentin', name: 'Augmentin 625 Duo', generic: 'amoxicillin + clavulanic acid', price: 205, mrp: 220, rx: true, stock: 25, need: ['cold'] },
  { id: 'cetzine', name: 'Cetzine 10 mg', generic: 'cetirizine', price: 19, mrp: 21, rx: false, stock: 25, need: ['cold'] },
  { id: 'ors', name: 'ORS Electral 21.8 g', generic: 'oral rehydration salts', price: 21, mrp: 22, rx: false, stock: 2, need: ['stomach', 'vitamins'] },
  { id: 'volini', name: 'Volini Gel 30 g', generic: 'diclofenac', price: 140, mrp: 150, rx: false, stock: 25, need: ['pain'] },
  { id: 'drontal', name: 'Drontal Plus', generic: 'dog dewormer', price: 490, mrp: 520, rx: false, pet: true, stock: 25, need: ['pet'] },
  { id: 'erina', name: 'Himalaya Erina-EP Shampoo', generic: 'pet shampoo', price: 215, mrp: 230, rx: false, pet: true, stock: 25, need: ['pet'] },
];

export const STORE = { name: 'Sunrise Pharmacy', address: '12 MG Road', phone: '98000 00001' };

/** The prices that arrive for the demo prescription, in the order the queue shows them */
export const OFFERS = [
  { store: 'Sunrise Pharmacy', km: 0.8, eta: 30, lines: [['2 × Pan 40', 310], ['1 × Azithral 500', 118], ['1 × Dolo 650', 31]] as [string, number][], note: 'Generic pantoprazole available if you prefer.' },
  { store: 'Wellness Chemists', km: 1.4, eta: 45, lines: [['2 × Pan 40', 316], ['1 × Azithral 500', 121], ['1 × Dolo 650', 32]] as [string, number][] },
  { store: 'City Care Pharmacy', km: 2.1, eta: 60, lines: [['2 × Pan 40', 300], ['1 × Azithral 500', 115], ['1 × Dolo 650', 30]] as [string, number][], note: 'Delivery after 6 pm.' },
];
export const offerTotal = (o: (typeof OFFERS)[number]) => o.lines.reduce((t, [, p]) => t + p, 0);

export const ORDER_STEPS = ['Placed', 'Accepted', 'Packed', 'Out for delivery', 'Delivered'] as const;
export type OrderStatus = (typeof ORDER_STEPS)[number] | 'Cancelled';

/** A handwritten prescription, drawn so the demo needs no photo of a real one */
export function RxPhoto({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 400" role="img" aria-label="Handwritten prescription: Pan 40, Azithral 500 and an unclear third line">
      <defs>
        <linearGradient id="nm-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#efe9da" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="#c9c2b4" />
      <g transform="rotate(-2 150 200)">
        <rect x="18" y="16" width="264" height="368" rx="4" fill="url(#nm-paper)" />
        <text x="34" y="48" fontFamily="Georgia, serif" fontSize="15" fontWeight="700" fill="#1d3b70">Dr. A. Mehra, MBBS, MD</text>
        <text x="34" y="64" fontFamily="Georgia, serif" fontSize="9" fill="#4a5f86">Reg. No. 48213 · Lake Road Clinic</text>
        <line x1="34" y1="74" x2="266" y2="74" stroke="#1d3b70" strokeWidth="1" />
        <g fontFamily="'Bradley Hand', 'Segoe Script', 'Comic Sans MS', cursive" fill="#22304f">
          <text x="34" y="110" fontSize="26" fontStyle="italic">Rx</text>
          <text x="40" y="146" fontSize="17">1. Tab Pan 40</text>
          <text x="70" y="166" fontSize="13">1-0-0 × 30 days</text>
          <text x="40" y="202" fontSize="17">2. Tab Azithral 500</text>
          <text x="70" y="222" fontSize="13">1-0-0 × 3 days</text>
          <text x="40" y="258" fontSize="17" transform="skewX(-12) translate(52 0)">3. Tab Dlo 6S0</text>
          <text x="70" y="278" fontSize="13">1 tab twice daily · 10</text>
          <text x="180" y="350" fontSize="20" fontStyle="italic">A. Mehra</text>
        </g>
        <text x="34" y="368" fontFamily="Georgia, serif" fontSize="9" fill="#4a5f86">26/11/2026</text>
      </g>
    </svg>
  );
}

const I: Record<string, React.ReactNode> = {
  home: <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /><path d="M19 3v4M17 5h4" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  pin: <><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  timer: <><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 2M9.5 2.5h5" /></>,
  store: <><path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9c0 2 3.5 2 4 0 .5 2 3.5 2 4 0 .5 2 3.5 2 4 0 .5 2 4 2 4 0" /><path d="M10 20v-5h4v5" /></>,
  pill: <><rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-35 12 12)" /><path d="m10 8.5 5 6" /></>,
  paw: <><circle cx="7" cy="10" r="1.8" /><circle cx="10.5" cy="6.5" r="1.8" /><circle cx="14.5" cy="6.5" r="1.8" /><circle cx="18" cy="10" r="1.8" /><path d="M12 12c-3 0-5 3.5-5 5.5 0 1.5 1.5 2 2.5 2 1 0 1.5-.6 2.5-.6s1.5.6 2.5.6c1 0 2.5-.5 2.5-2 0-2-2-5.5-5-5.5z" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  cart: <><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M3 4h2.5l2.2 11h11.5L21 8H6.5" /></>,
  bulb: <><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  send: <path d="M4 12 20 4l-6 16-3-7z" />,
  gallery: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4 4 3 3-2 4 3" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1" />,
  hourglass: <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />,
  thermo: <><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z" /><path d="M12 9v6" /></>,
  cough: <><path d="M4 12h3M5 8l2 1.5M5 16l2-1.5" /><path d="M10 7a5 5 0 1 1 0 10" /></>,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  stomach: <path d="M9 3v4c0 2-3 2-3 6 0 4 3 7 7 7 3.5 0 5-2 5-4.5S16 12 13.5 12 11 10.5 11 8V3" />,
  vitamin: <><circle cx="12" cy="12" r="8" /><path d="M8.5 9.5 12 16l3.5-6.5" /></>,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  logout: <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h10" />,
  dash: <><rect x="4" y="4" width="7" height="8" rx="1.5" /><rect x="13" y="4" width="7" height="5" rx="1.5" /><rect x="13" y="11" width="7" height="9" rx="1.5" /><rect x="4" y="14" width="7" height="6" rx="1.5" /></>,
  quote: <><path d="M5 4h14v16H5z" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
  box: <><path d="M4 8 12 4l8 4v8l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v8" /></>,
  staff: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .5 3.2 2 3.5 5" /></>,
  shield: <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" />,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  medical: <><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7V4h6v3M12 10.5v6M9 13.5h6" /></>,
  warn: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
};

export function Icon({ name, size = 22, className }: { name: keyof typeof I; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      {I[name]}
    </svg>
  );
}
