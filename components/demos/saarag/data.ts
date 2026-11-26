// Saarag sample tenant, plus a tiny in-browser version of its pipeline so the demo behaves like the real one:
// role → modules → permission-filtered retrieval → relevance gate → cited answer, or an honest refusal.
// Passages for leave and IT come from the repo's Backend/sample_docs; the rest are made up for "Acme Corp".
// One store is shared by the employee chat and the admin console, so access changes made in one show in the other.

import { useSyncExternalStore } from 'react';

export type Module = { id: string; name: string; description: string; icon: string };
export type Doc = { file: string; module: string; tags: string[]; status: 'active' | 'draft' | 'inactive'; sub: string; score: number; uploaded: string };
export type Chunk = { file: string; idx: number; total: number; keys: string[]; text: string; answer: string };
export type Role = { id: string; name: string; modules: string[] };
export type Person = { name: string; email: string; role: string | null; admin?: boolean; added: string; status: 'Active' | 'Pending' };
export type Outcome = 'answered' | 'no_access' | 'below_threshold' | 'small_talk';
export type Source = { file: string; idx: number; total: number; score: number; text: string };
export type Audit = { id: number; who: string; q: string; outcome: Outcome; chunks: number; rating: 'up' | 'down' | null; at: number; answer: string; conversation: number };

export const MODULES: Module[] = [
  { id: 'hr', name: 'HR Handbook', description: 'Company policies, benefits information, and employee guidelines.', icon: 'badge' },
  { id: 'it', name: 'IT Support', description: 'VPN, devices, accounts and access requests.', icon: 'laptop' },
  { id: 'floor', name: 'Floor Operations', description: 'Shift SOPs, machine safety and incident reporting.', icon: 'factory' },
];

export const DOCS: Doc[] = [
  { file: 'leave_policy.txt', module: 'hr', tags: ['leave', 'wfh'], status: 'active', sub: 'Passed check', score: 88, uploaded: 'Mar 3, 2026' },
  { file: 'travel_reimbursement.pdf', module: 'hr', tags: ['travel', 'claims'], status: 'active', sub: 'Passed check', score: 81, uploaded: 'Apr 18, 2026' },
  { file: 'it_helpdesk_sop.txt', module: 'it', tags: ['tickets', 'laptops'], status: 'active', sub: 'Passed check', score: 91, uploaded: 'Mar 3, 2026' },
  { file: 'vpn_setup.md', module: 'it', tags: ['vpn'], status: 'active', sub: 'Passed check', score: 86, uploaded: 'Jun 9, 2026' },
  { file: 'forklift_sop.docx', module: 'floor', tags: ['safety', 'forklift'], status: 'active', sub: 'Overridden', score: 64, uploaded: 'Aug 21, 2026' },
  { file: 'shift_handover.pdf', module: 'floor', tags: ['shifts'], status: 'active', sub: 'Passed check', score: 77, uploaded: 'Aug 21, 2026' },
  { file: 'leave_policy_2025.pdf', module: 'hr', tags: ['leave'], status: 'inactive', sub: 'Replaced', score: 79, uploaded: 'Jan 6, 2025' },
  { file: 'canteen_menu_scan.pdf', module: 'hr', tags: [], status: 'draft', sub: 'Below threshold', score: 41, uploaded: 'Nov 24, 2026' },
];

export const CHUNKS: Chunk[] = [
  { file: 'leave_policy.txt', idx: 1, total: 6, keys: ['casual', 'leave', 'leaves', 'carry', 'forward', 'cl'], text: 'Employees are entitled to 12 casual leave days per calendar year, accrued at 1 day per month. Casual leave cannot be carried forward to the next year and lapses on December 31st.', answer: 'You get 12 casual leave days a year, accrued at 1 day a month. They can’t be carried forward: unused casual leave lapses on 31 December [leave_policy.txt].' },
  { file: 'leave_policy.txt', idx: 2, total: 6, keys: ['sick', 'leave', 'leaves', 'medical', 'certificate', 'ill', 'unwell'], text: 'Employees receive 10 sick leave days per year. A medical certificate is required for sick leave exceeding 3 consecutive days.', answer: 'You get 10 sick leave days a year. If you’re off sick for more than 3 days in a row, you need a medical certificate [leave_policy.txt].' },
  { file: 'leave_policy.txt', idx: 3, total: 6, keys: ['earned', 'leave', 'leaves', 'el', 'privilege', 'carry', 'forward', 'accrue'], text: 'Employees accrue 1.5 days of earned leave per month, up to a maximum of 18 days per year. Earned leave can be carried forward up to a cap of 45 days.', answer: 'Earned leave accrues at 1.5 days a month, up to 18 days a year, and you can carry it forward up to a cap of 45 days [leave_policy.txt].' },
  { file: 'leave_policy.txt', idx: 5, total: 6, keys: ['work', 'home', 'wfh', 'remote', 'remotely'], text: 'Employees may work from home up to 8 days per month with manager approval, requested at least 24 hours in advance except in emergencies.', answer: 'You can work from home up to 8 days a month with your manager’s approval. Ask at least 24 hours ahead, except in an emergency [leave_policy.txt].' },
  { file: 'leave_policy.txt', idx: 6, total: 6, keys: ['apply', 'application', 'leave', 'portal', 'advance'], text: 'All leave requests must be submitted through the HR portal at least 2 working days in advance, except for sick leave which can be applied on the day of absence.', answer: 'Apply through the HR portal at least 2 working days in advance. Sick leave is the exception: you can apply on the day [leave_policy.txt].' },
  { file: 'travel_reimbursement.pdf', idx: 2, total: 4, keys: ['travel', 'reimbursement', 'claim', 'expense', 'expenses', 'receipts', 'allowance'], text: 'Submit travel claims through the HR portal within 30 days of return, with original receipts. Daily allowance is ₹2,500 in metro cities and ₹1,800 elsewhere.', answer: 'Submit travel claims in the HR portal within 30 days of getting back, with receipts. The daily allowance is ₹2,500 in metro cities and ₹1,800 elsewhere [travel_reimbursement.pdf].' },
  { file: 'it_helpdesk_sop.txt', idx: 2, total: 5, keys: ['priority', 'p1', 'p2', 'p3', 'p4', 'sla', 'response', 'ticket', 'urgent', 'outage'], text: 'P1 (Critical): System-wide outage. Response time: 30 minutes. P2 (High): Individual system down, blocking work. Response time: 4 hours. P3 (Medium): Non-blocking issue. Response time: 1 business day. P4 (Low): Feature request or minor issue. Response time: 3 business days.', answer: 'IT responds by priority: P1 (system-wide outage) in 30 minutes, P2 (your system is down and blocking work) in 4 hours, P3 in 1 business day and P4 in 3 business days [it_helpdesk_sop.txt].' },
  { file: 'it_helpdesk_sop.txt', idx: 3, total: 5, keys: ['laptop', 'replacement', 'replace', 'hardware', 'refresh'], text: 'Laptops are eligible for replacement after 3 years of use, or earlier in case of irreparable hardware failure verified by IT.', answer: 'Laptops can be replaced after 3 years of use, or sooner if IT verifies a hardware failure that can’t be repaired [it_helpdesk_sop.txt].' },
  { file: 'it_helpdesk_sop.txt', idx: 4, total: 5, keys: ['password', 'reset', 'locked', 'sso', 'login', 'otp'], text: 'Password resets can be self-served via the SSO portal. If locked out, employees must verify identity via the registered mobile OTP before IT can manually reset credentials.', answer: 'Reset your password yourself in the SSO portal. If you’re locked out, verify yourself with the OTP on your registered mobile first, then IT can reset it for you [it_helpdesk_sop.txt].' },
  { file: 'it_helpdesk_sop.txt', idx: 5, total: 5, keys: ['software', 'license', 'licence', 'install', 'procurement'], text: 'Requests for new software licenses must be approved by the employee’s manager and routed through IT procurement. Approval typically takes 3-5 business days.', answer: 'New software needs your manager’s approval and goes through IT procurement; it usually takes 3 to 5 business days [it_helpdesk_sop.txt].' },
  { file: 'vpn_setup.md', idx: 1, total: 3, keys: ['vpn', 'remote', 'connect', 'home', 'globalprotect', 'network'], text: 'Install GlobalProtect from the Self Service portal, sign in with your work email and choose the Mumbai-HQ gateway. Use the Singapore gateway only when travelling in APAC.', answer: 'Install GlobalProtect from the Self Service portal, sign in with your work email, and pick the Mumbai-HQ gateway [vpn_setup.md].' },
  { file: 'forklift_sop.docx', idx: 2, total: 5, keys: ['forklift', 'lockout', 'servicing', 'maintenance', 'battery', 'tag'], text: 'Before servicing a forklift: lower the forks fully, set the parking brake, switch off and remove the key, then apply a lockout tag to the battery disconnect. Only certified technicians may service the hydraulics.', answer: 'Before servicing a forklift, lower the forks fully, set the parking brake, switch off and remove the key, then put a lockout tag on the battery disconnect. Only certified technicians may work on the hydraulics [forklift_sop.docx].' },
  { file: 'shift_handover.pdf', idx: 1, total: 3, keys: ['shift', 'shifts', 'handover', 'timings', 'night'], text: 'Shifts run 06:00–14:00, 14:00–22:00 and 22:00–06:00. The outgoing supervisor completes the handover log before leaving the floor.', answer: 'Shifts run 6 am–2 pm, 2–10 pm and 10 pm–6 am, and the outgoing supervisor fills in the handover log before leaving the floor [shift_handover.pdf].' },
];

const STOP = new Set('a an the i me my we our you your is are am do does did can could how what when where which who why to of in on for with and or at by be it this that there if any many much get got have has from as per about please tell'.split(' '));
const SMALL_TALK = /^(hi|hii+|hello|hey|thanks|thank you|thx|ok|okay|good (morning|afternoon|evening)|help)[!. ]*$/i;
export const THRESHOLD = 0.65;

const words = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

type State = {
  roles: Role[];
  people: Person[];
  docs: Doc[];
  audit: Audit[];
  /** The demo's sign-in: whose questions the chat asks as */
  asker: string;
};

const MIN = 60_000;
let state: State = {
  roles: [
    { id: 'eng', name: 'Engineer', modules: ['hr', 'it'] },
    { id: 'hrm', name: 'HR Manager', modules: ['hr'] },
    { id: 'sup', name: 'Floor Supervisor', modules: ['hr', 'floor'] },
  ],
  people: [
    { name: 'Aditi Sharma', email: 'aditi.sharma@acme.in', role: null, admin: true, added: 'Feb 2, 2026', status: 'Active' },
    { name: 'Priya Nair', email: 'priya.nair@acme.in', role: 'eng', added: 'Mar 4, 2026', status: 'Active' },
    { name: 'Ravi Kumar', email: 'ravi.kumar@acme.in', role: 'sup', added: 'Mar 4, 2026', status: 'Active' },
    { name: 'Neha Gupta', email: 'neha.gupta@acme.in', role: 'hrm', added: 'Apr 11, 2026', status: 'Active' },
    { name: 'Arjun Mehta', email: 'arjun.mehta@acme.in', role: null, added: 'Nov 25, 2026', status: 'Pending' },
  ],
  docs: DOCS,
  // Question history, grouped into conversations. Both employee apps (web and phone) read and write it.
  audit: [
    { id: 6, who: 'Ravi Kumar', q: 'What are the shift timings?', outcome: 'answered', chunks: 1, rating: 'up', at: Date.now() - 40 * MIN, answer: CHUNKS[12].answer, conversation: 4 },
    { id: 5, who: 'Priya Nair', q: 'How do I reset my password?', outcome: 'answered', chunks: 1, rating: null, at: Date.now() - 2 * 60 * MIN, answer: CHUNKS[8].answer, conversation: 3 },
    { id: 4, who: 'Priya Nair', q: 'What’s the response time for a P2 ticket?', outcome: 'answered', chunks: 1, rating: 'up', at: Date.now() - 2 * 60 * MIN - 3 * MIN, answer: CHUNKS[6].answer, conversation: 3 },
    { id: 3, who: 'Neha Gupta', q: 'Is there a stipend for home internet?', outcome: 'below_threshold', chunks: 0, rating: null, at: Date.now() - 3 * 60 * MIN, answer: 'No relevant information found for this question.', conversation: 2 },
    { id: 2, who: 'Priya Nair', q: 'Can I carry forward earned leave?', outcome: 'answered', chunks: 1, rating: null, at: Date.now() - 26 * 60 * MIN + 2 * MIN, answer: CHUNKS[2].answer, conversation: 1 },
    { id: 1, who: 'Priya Nair', q: 'How many sick leaves do I get?', outcome: 'answered', chunks: 1, rating: 'up', at: Date.now() - 26 * 60 * MIN, answer: CHUNKS[1].answer, conversation: 1 },
  ],
  asker: 'Priya Nair',
};

const listeners = new Set<() => void>();
export const store = {
  get: () => state,
  set(patch: Partial<State> | ((s: State) => Partial<State>)) {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
export const useSaarag = () => useSyncExternalStore(store.subscribe, store.get, store.get);

export const moduleName = (id: string) => MODULES.find((m) => m.id === id)?.name ?? id;
export const docModule = (file: string) => state.docs.find((d) => d.file === file)?.module ?? '';

/** The modules a person's retrieval may search: admins everything, a role its modules, no role nothing */
export function accessFor(s: State, name: string) {
  const p = s.people.find((x) => x.name === name)!;
  if (p.admin) return { modules: MODULES.map((m) => m.id), roleName: 'Admin', hasRole: true };
  const role = s.roles.find((r) => r.id === p.role);
  return { modules: role?.modules ?? [], roleName: role?.name ?? null, hasRole: !!role };
}

export type Answer = { outcome: Outcome; text: string; sources: Source[]; searched: string[] };

/** Retrieve from searchable documents in the asker's modules, gate on relevance, then answer with citations */
export function ask(s: State, question: string): Answer {
  const { modules } = accessFor(s, s.asker);
  const searched = modules.map(moduleName);
  if (SMALL_TALK.test(question.trim()))
    return { outcome: 'small_talk', text: 'Hi! Ask me about a policy or procedure, like leave, IT tickets or travel claims, and I’ll answer from your company’s documents with the source.', sources: [], searched };
  if (!modules.length) return { outcome: 'no_access', text: 'No accessible documents found for this question.', sources: [], searched };

  const live = new Set(s.docs.filter((d) => d.status === 'active' && modules.includes(d.module)).map((d) => d.file));
  const qw = words(question);
  const scored = CHUNKS.filter((c) => live.has(c.file))
    .map((c) => {
      const hits = qw.filter((w) => c.keys.some((k) => k === w || (w.length > 3 && (k.startsWith(w) || w.startsWith(k))))).length;
      return { c, score: hits ? Math.min(0.94, 0.53 + 0.15 * hits) : 0.22 + (c.idx % 4) * 0.04 };
    })
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return { outcome: 'no_access', text: 'No accessible documents found for this question.', sources: [], searched };
  const best = scored[0];
  if (best.score < THRESHOLD) return { outcome: 'below_threshold', text: 'No relevant information found for this question.', sources: [], searched };

  // Up to two passages that clear the gate; a second one only if it is nearly as relevant as the best
  const picked = scored.filter((x) => x.score >= THRESHOLD && x.score >= best.score - 0.1).slice(0, 2);
  const text = picked.map((x) => x.c.answer).join(' ');
  return {
    outcome: 'answered',
    text,
    sources: picked.map(({ c, score }) => ({ file: c.file, idx: c.idx, total: c.total, score, text: c.text })),
    searched,
  };
}

// ---------- Conversations, shared by the web and phone clients (as GET /audit-log/me grouped by conversation_id) ----------

export type Chat = { id: number; title: string; updatedAt: number; turns: Audit[] };

let conversationSeq = 100;
export const newConversation = () => ++conversationSeq;

/** One person's chats, newest first; each chat's turns oldest first, titled by its first question */
export function chatsFor(s: State, who: string): Chat[] {
  const byId = new Map<number, Audit[]>();
  for (const a of s.audit) if (a.who === who) byId.set(a.conversation, [...(byId.get(a.conversation) ?? []), a]);
  return [...byId.entries()]
    .map(([id, rows]) => {
      const turns = [...rows].sort((x, y) => x.at - y.at);
      return { id, title: turns[0].q, updatedAt: turns[turns.length - 1].at, turns };
    })
    .sort((x, y) => y.updatedAt - x.updatedAt);
}

/** Ask as the signed-in person and write the audit row, as POST /query does */
export function askAndLog(question: string, conversation: number) {
  const s = store.get();
  const a = ask(s, question);
  const id = Math.max(0, ...s.audit.map((x) => x.id)) + 1;
  store.set((s0) => ({
    audit: [{ id, who: s0.asker, q: question, outcome: a.outcome, chunks: a.sources.length, rating: null, at: Date.now(), answer: a.text, conversation }, ...s0.audit],
  }));
  return { answer: a, auditId: id };
}

export const rateAnswer = (auditId: number, rating: 'up' | 'down' | null) =>
  store.set((s0) => ({ audit: s0.audit.map((a) => (a.id === auditId ? { ...a, rating } : a)) }));

/** Saved history keeps the answer and outcome but not the passages, so a reopened turn has no source rows */
export function savedAnswer(s: State, row: Audit): Answer {
  return { outcome: row.outcome, text: row.answer, sources: [], searched: accessFor(s, row.who).modules.map(moduleName) };
}
