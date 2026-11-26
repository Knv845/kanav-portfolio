// The projects in the DEMO menu: what a recruiter reads beside each live demo, and which demo views it has.
// Facts here come from each project's repo; keep them true if the projects change.

export type View = {
  id: string;
  /** Key into APPS in DemoHub */
  app: string;
  kind: 'phone' | 'browser';
  label: string;
  /** Short name for the menu tags */
  short: string;
  /** One line above the device: what to try */
  hint: string;
  /** Shown in the browser frame's address bar */
  url?: string;
};

export type Project = {
  id: string;
  /** Short intro video (recorded from the live demo, original music) */
  intro: { src: string; poster: string; seconds: number };
  name: string;
  mark: string;
  color: string;
  tagline: string;
  kicker: string;
  pitch: string;
  how: string[];
  built: string[];
  stack: string[];
  views: View[];
};

export const PROJECTS: readonly Project[] = [
  {
    id: 'nearmed',
    intro: { src: '/intros/nearmed-intro.mp4', poster: '/intros/nearmed-intro.jpg', seconds: 40 },
    name: 'NearMed',
    mark: 'N',
    color: '#5d4c86',
    tagline: 'Nearby pharmacies price your prescription',
    kicker: 'Health · Android app + store website',
    pitch:
      'Snap a prescription and nearby pharmacies send you their price for it. You see one price at a time and get 90 seconds to say yes before the next store’s price comes up. You can also shop the catalog directly. Store owners price prescriptions and run their orders from a website.',
    how: [
      'The customer photographs a prescription; it stays open for prices for 30 minutes.',
      'An AI reader drafts the medicine lines; the pharmacist ticks each one against the photo, then sends one price.',
      'Prices queue up. Each gets a 90-second window on the customer’s phone: accept, or see the next one.',
      'An accepted price becomes an order the store tracks from placed to delivered.',
    ],
    built: [
      'All three parts: FastAPI API, Expo customer app and Next.js store site.',
      'A race-safe price queue: row locks, partial unique indexes and no timers (expiry is worked out on read). 10 customers buying the last 3 units at once gives exactly 3 orders.',
      'Security: scrypt passwords, rotating refresh tokens with reuse detection, authenticator-app 2FA, Postgres row-level security, AES-256-GCM photo encryption with GPS stripped, 5-minute signed photo links.',
      'Stores never see who sent a prescription until that customer accepts their price.',
      '13 pytest tests for the queue and isolation, plus 81 scripted black-box attacks.',
    ],
    stack: ['React Native (Expo Router)', 'Next.js 16', 'Tailwind 4', 'FastAPI', 'SQLModel', 'PostgreSQL', 'Claude (prescription reader)', 'Gemini (home picks)'],
    views: [
      {
        id: 'app',
        app: 'nearmed-app',
        kind: 'phone',
        label: 'NearMed customer app',
        short: 'Customer app',
        hint: 'Tap the purple camera button, send the prescription, and watch store prices arrive.',
      },
      {
        id: 'store',
        app: 'nearmed-web',
        kind: 'browser',
        label: 'NearMed store website',
        short: 'Store website',
        url: 'store.nearmed.in/dashboard',
        hint: 'Price prescription #42: tick each AI line against the photo, then send. Accept a new order.',
      },
    ],
  },
  {
    id: 'parkassist',
    intro: { src: '/intros/parkassist-intro.mp4', poster: '/intros/parkassist-intro.jpg', seconds: 36 },
    name: 'ParkAssist',
    mark: 'P',
    color: '#2f6b86',
    tagline: 'A QR sticker so a blocked driver can reach you',
    kicker: 'Mobility · Android app',
    pitch:
      'In Indian cities, cars block gates, lanes and other cars, and the person stuck has no way to reach the owner. ParkAssist gives every owner a QR sticker for the dashboard. Anyone scans it, finds the owner and calls in one tap. ParcoAI answers questions about parking and traffic rules.',
    how: [
      'The owner generates a QR code linked to their number and puts it on the dashboard.',
      'A blocked driver scans it in the app (or with any camera, which opens the app or a download page).',
      '“Owner Found”: one tap to call. The scan is logged and counted on the owner’s home screen.',
      'ParcoAI takes a city, an area and a situation, and returns a legal verdict, the challan risk and what to do.',
    ],
    built: [
      'React Native app and Node/Express API, end to end, with an APK people can install.',
      'Auth: 15-minute access tokens and rotating 30-day refresh tokens, revoked on logout.',
      'Rate limits on login, on public scan logging (so counts can’t be inflated) and on the billed AI endpoint.',
      'ParcoAI streams Gemini answers over SSE in a fixed four-part format, at low temperature, with an off-topic guardrail.',
      'API keys stay on the server; Helmet, a CORS allowlist, validation on every input.',
    ],
    stack: ['React Native', 'Expo', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Gemini 2.5 Flash (SSE)', 'Cloudinary'],
    views: [
      {
        id: 'app',
        app: 'parkassist',
        kind: 'phone',
        label: 'ParkAssist app',
        short: 'Android app',
        hint: 'Tap Scan QR and scan the sticker, then watch the scan land in Recent Activity. Try Ask AI.',
      },
    ],
  },
  {
    id: 'saarag',
    intro: { src: '/intros/saarag-intro.mp4', poster: '/intros/saarag-intro.jpg', seconds: 44 },
    name: 'Saarag',
    mark: 'S',
    color: '#3a3d42',
    tagline: 'A company knowledge assistant that respects who can see what',
    kicker: 'AI · RAG SaaS · web + mobile',
    pitch:
      'Saarag (from Hindi सार, “essence”, + RAG) answers employees’ questions from their company’s own documents, with citations. Each answer draws only on the modules the employee’s role grants. When something is outside their access, or the documents don’t answer it, Saarag says so plainly and names who to ask instead of guessing.',
    how: [
      'Admins upload policies and SOPs into modules (HR, IT, Floor Ops). Each upload gets a readiness score; only files that pass are indexed.',
      'Roles grant modules, and employees hold a role. The server derives tenant and access from the verified token.',
      'Retrieval is hybrid: vector + keyword search, fused (RRF), reranked by a cross-encoder, capped per document.',
      'Below the relevance threshold the LLM is never called, so you get an honest “I couldn’t find a clear answer”, not a made-up one.',
    ],
    built: [
      'Three parts: FastAPI backend, employee Client and Admin portal (React 19).',
      'Permission-aware retrieval enforced server-side; a missing role searches nothing.',
      'Every query is traced: outcome, chunks and scores, latency per stage, tokens. These traces feed a Quality dashboard and an evaluation suite.',
      'LLM and embedding providers are swappable (Anthropic, OpenAI, Gemini, Groq, local) with a config change.',
      'Document lifecycle: readiness gate, admin override, versioned replace that retires the old file.',
      'A React Native (Expo) employee app that signs in with the same account and reads the same API, so chats are shared: start one on the web, carry on from the phone.',
    ],
    stack: ['React 19', 'Vite', 'Tailwind v4', 'TanStack Query', 'React Native (Expo)', 'FastAPI', 'Postgres + pgvector', 'Supabase Auth', 'Cross-encoder rerank', 'Claude / Gemini'],
    views: [
      {
        id: 'chat',
        app: 'saarag-chat',
        kind: 'browser',
        label: 'Saarag employee assistant',
        short: 'Employee chat',
        url: 'acme.saarag.app/ask',
        hint: 'You are Priya, an Engineer. Ask about leave or IT, then about forklifts, which your role can’t see.',
      },
      {
        id: 'mobile',
        app: 'saarag-mobile',
        kind: 'phone',
        label: 'Saarag mobile app',
        short: 'Mobile app',
        hint: 'Same account as the web chat: sign in, open ☰ and your web chats are in Recent. Ask here and it shows up on the web too.',
      },
      {
        id: 'admin',
        app: 'saarag-admin',
        kind: 'browser',
        label: 'Saarag admin console',
        short: 'Admin console',
        url: 'admin.saarag.app/overview',
        hint: 'Change what a role can reach, check document readiness, and read the audit log.',
      },
    ],
  },
];
