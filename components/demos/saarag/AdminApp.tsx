'use client';

// Saarag admin portal, recreated. Sections and copy follow Admin/src (nav.js, Overview, Documents, Modules,
// Roles, Employees, Audit log, Settings, and the platform-only Quality page). Shares its store with the chat demo.

import { Fragment, useEffect, useState } from 'react';
import { MODULES, moduleName, store, THRESHOLD, useSaarag, type Audit, type Doc } from './data';
import { Sym } from './Sym';
import s from './saarag.module.css';

type Page = 'Overview' | 'Documents' | 'Modules' | 'Roles' | 'Employees' | 'Audit log' | 'Settings' | 'Quality';

const NAV: [Page, string][] = [
  ['Overview', 'space_dashboard'],
  ['Documents', 'description'],
  ['Modules', 'deployed_code'],
  ['Roles', 'shield_person'],
  ['Employees', 'group'],
  ['Audit log', 'manage_search'],
  ['Settings', 'settings'],
];

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

const OUTCOME_LABEL: Record<Audit['outcome'], string> = { answered: 'Answered', no_access: 'No access', below_threshold: 'Below threshold', small_talk: 'Small talk' };

function Pill({ d }: { d: Doc }) {
  return (
    <span className={`${s.pill} ${d.status === 'active' ? s.pOk : d.status === 'draft' ? s.pWarn : s.pOff}`}>
      <b>{d.status}</b> {d.sub}
    </span>
  );
}

export default function AdminApp() {
  const st = useSaarag();
  const [page, setPage] = useState<Page>('Overview');
  const [roleId, setRoleId] = useState('eng');
  const [pending, setPending] = useState<string[] | null>(null);
  const [toast, setToast] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [rating, setRating] = useState<'all' | 'up' | 'down' | 'none'>('all');
  const [upload, setUpload] = useState<null | 'scoring' | 'done'>(null);
  const [readiness, setReadiness] = useState(70);
  const [gate, setGate] = useState(THRESHOLD);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const role = st.roles.find((r) => r.id === roleId)!;
  const granted = pending ?? role.modules;
  const live = st.docs.filter((d) => d.status === 'active');
  const drafts = st.docs.filter((d) => d.status === 'draft');
  const unanswered = st.audit.filter((a) => a.outcome === 'below_threshold' || a.outcome === 'no_access');
  const noRole = st.people.filter((p) => !p.admin && !p.role);
  const week = [6, 9, 7, 12, 10, 4, 3, 8, 11, 9, 14, 12, 5, 4 + st.audit.length];

  const saveAccess = () => {
    if (!pending) return;
    store.set((s0) => ({ roles: s0.roles.map((r) => (r.id === roleId ? { ...r, modules: pending } : r)) }));
    setPending(null);
    setToast(`Saved. ${role.name} now reaches ${pending.map(moduleName).join(', ') || 'no modules'}. Try it in the Employee chat.`);
  };

  const fakeUpload = () => {
    setUpload('scoring');
    setTimeout(() => {
      store.set((s0) => ({ docs: [{ file: 'holiday_calendar_2027.pdf', module: 'hr', tags: ['holidays'], status: 'active', sub: 'Passed check', score: 84, uploaded: 'Nov 26, 2026' }, ...s0.docs.filter((d) => d.file !== 'holiday_calendar_2027.pdf')] }));
      setUpload('done');
    }, 1800);
  };

  return (
    <div className={`${s.app} ${s.admin}`}>
      <aside className={s.side}>
        <div className={s.brand}>
          <span className={s.glyph}>S</span>
          <div>
            <b>Saarag</b>
            <em>Admin console</em>
          </div>
        </div>
        <nav className={s.nav}>
          {NAV.map(([p, icon]) => (
            <button key={p} type="button" aria-current={page === p ? 'page' : undefined} onClick={() => setPage(p)}>
              <Sym n={icon} /> {p}
            </button>
          ))}
          <p className={s.caps}>Platform</p>
          <button type="button" aria-current={page === 'Quality' ? 'page' : undefined} onClick={() => setPage('Quality')}>
            <Sym n="monitoring" /> Quality
          </button>
          <button type="button" onClick={() => setToast('Evaluations: run a fixed question set against the pipeline and score recall, groundedness and refusals.')}>
            <Sym n="fact_check" /> Evaluations
          </button>
        </nav>
        <div className={s.tenant}>
          <Sym n="business" />
          <div>
            <b>Acme Corp</b>
            <em>Manufacturing</em>
          </div>
        </div>
      </aside>

      <main className={s.adminMain}>
        <header className={s.topbar}>
          <label className={s.search}>
            <Sym n="search" /> <input placeholder="Search..." aria-label="Search" />
          </label>
          <span className={s.crumb}>{page}</span>
          <span className={s.me}>AS</span>
        </header>

        <div className={s.page}>
          {page === 'Overview' && (
            <>
              <h1>Overview</h1>
              <p className={s.muted}>How Acme Corp is using Saarag, at a glance.</p>
              <div className={s.kpis}>
                <div>
                  <span>Live documents</span>
                  <b>{live.length}</b>
                  <em>{st.docs.length} in total</em>
                </div>
                <div>
                  <span>Drafts awaiting action</span>
                  <b className={drafts.length ? s.warnText : undefined}>{drafts.length}</b>
                  <em>Below the readiness threshold</em>
                </div>
                <div>
                  <span>Active employees</span>
                  <b>{st.people.filter((p) => p.status === 'Active').length}</b>
                  <em>{st.people.filter((p) => p.status === 'Pending').length} pending sign-up</em>
                </div>
                <div>
                  <span>Questions this week</span>
                  <b>{week.slice(-7).reduce((a, b) => a + b, 0)}</b>
                  <em>{st.audit.length} in the audit log</em>
                </div>
              </div>
              <div className={s.twoCol}>
                <section className={s.card}>
                  <h3>Questions</h3>
                  <p className={s.muted}>Last 14 days</p>
                  <div className={s.bars}>
                    {week.map((v, i) => (
                      <i key={i} style={{ height: `${(v / Math.max(...week)) * 100}%` }} title={`${v} questions`} />
                    ))}
                  </div>
                </section>
                <section className={s.card}>
                  <h3>Needs attention</h3>
                  {drafts.map((d) => (
                    <button key={d.file} type="button" className={s.attn} onClick={() => setPage('Documents')}>
                      <Sym n="warning" /> <span><b>{d.file}</b> scored {d.score}, below {readiness}. Override, replace or delete it.</span>
                    </button>
                  ))}
                  {unanswered.length > 0 && (
                    <button type="button" className={s.attn} onClick={() => setPage('Audit log')}>
                      <Sym n="info" /> <span><b>{unanswered.length} unanswered question{unanswered.length === 1 ? '' : 's'}</b>. A missing document, or a role that needs another module?</span>
                    </button>
                  )}
                  {noRole.map((p) => (
                    <button key={p.email} type="button" className={s.attn} onClick={() => setPage('Employees')}>
                      <Sym n="group" /> <span><b>{p.name}</b> has no role, so they can’t search anything.</span>
                    </button>
                  ))}
                </section>
              </div>
            </>
          )}

          {page === 'Documents' && (
            <>
              <div className={s.pageHead}>
                <div>
                  <h1>Documents</h1>
                  <p className={s.muted}>Upload and manage company policies. Each upload is scored for readiness first; only files that pass, or that you override, are indexed and searchable.</p>
                </div>
                <button type="button" className={s.solid} onClick={fakeUpload} disabled={upload === 'scoring'}>
                  <Sym n="upload" /> Upload document
                </button>
              </div>
              {upload && (
                <div className={upload === 'done' ? s.noticeOk : s.notice}>
                  {upload === 'scoring' ? (
                    <>
                      <i className={s.sweep} /> Scoring <b>holiday_calendar_2027.pdf</b> for readiness: text extraction, structure, duplicates…
                    </>
                  ) : (
                    <>
                      <Sym n="check" /> <b>holiday_calendar_2027.pdf</b> scored 84 (threshold {readiness}). Chunked, embedded and indexed into HR Handbook.
                    </>
                  )}
                </div>
              )}
              <p className={s.muted}>Showing {st.docs.length} documents</p>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Module</th>
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Uploaded</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {st.docs.map((d) => (
                    <tr key={d.file}>
                      <td>
                        <b>{d.file}</b>
                      </td>
                      <td>{moduleName(d.module)}</td>
                      <td>
                        {d.tags.map((t) => (
                          <span key={t} className={s.tag}>
                            {t}
                          </span>
                        ))}
                      </td>
                      <td>
                        <Pill d={d} />
                      </td>
                      <td>
                        <span className={s.score}>
                          <i style={{ width: `${d.score}%`, background: d.score >= readiness ? '#248a3d' : '#ba1a1a' }} />
                        </span>
                        {d.score}
                      </td>
                      <td className={s.muted}>{d.uploaded}</td>
                      <td>
                        {d.status === 'draft' && (
                          <button
                            type="button"
                            className={s.ghostBtn}
                            onClick={() => {
                              store.set((s0) => ({ docs: s0.docs.map((x) => (x.file === d.file ? { ...x, status: 'active', sub: 'Overridden' } : x)) }));
                              setToast(`${d.file} overridden with a note and indexed.`);
                            }}
                          >
                            Override
                          </button>
                        )}
                        {d.status === 'active' && (
                          <button
                            type="button"
                            className={s.ghostBtn}
                            onClick={() => {
                              store.set((s0) => ({ docs: s0.docs.map((x) => (x.file === d.file ? { ...x, status: 'inactive', sub: 'Deactivated' } : x)) }));
                              setToast(`${d.file} deactivated. It no longer appears in answers.`);
                            }}
                          >
                            Deactivate
                          </button>
                        )}
                        {d.status === 'inactive' && d.sub === 'Deactivated' && (
                          <button type="button" className={s.ghostBtn} onClick={() => store.set((s0) => ({ docs: s0.docs.map((x) => (x.file === d.file ? { ...x, status: 'active', sub: 'Passed check' } : x)) }))}>
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {page === 'Modules' && (
            <>
              <h1>Knowledge Modules</h1>
              <p className={s.muted}>A document belongs to one module; roles grant modules.</p>
              <div className={s.modGrid}>
                {MODULES.map((m) => (
                  <div key={m.id} className={s.card}>
                    <span className={s.modIcon}>
                      <Sym n={m.icon} size={22} />
                    </span>
                    <h3>{m.name}</h3>
                    <p className={s.muted}>{m.description}</p>
                    <p className={s.meta}>{st.docs.filter((d) => d.module === m.id && d.status === 'active').length} docs · Created Feb 2, 2026</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === 'Roles' && (
            <>
              <h1>Roles & Permissions</h1>
              <p className={s.muted}>A role is a bundle of modules. Employees only get answers from the modules their role grants.</p>
              <div className={s.rolesGrid}>
                <section className={s.card}>
                  <h3>Active Roles</h3>
                  {st.roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={s.roleRow}
                      aria-current={r.id === roleId ? 'true' : undefined}
                      onClick={() => {
                        setRoleId(r.id);
                        setPending(null);
                      }}
                    >
                      <b>{r.name}</b>
                      <em>{st.people.filter((p) => p.role === r.id).length} users</em>
                    </button>
                  ))}
                </section>
                <section className={s.card}>
                  <h3>Module Access</h3>
                  <p className={s.muted}>
                    {role.name} · {granted.length} of {MODULES.length} modules
                  </p>
                  {MODULES.map((m) => {
                    const on = granted.includes(m.id);
                    return (
                      <label key={m.id} className={s.accessRow}>
                        <div>
                          <b>{m.name}</b>
                          <span className={s.muted}>{m.description}</span>
                        </div>
                        <em className={on ? s.okText : s.mutedText}>{on ? 'Granted' : 'No access'}</em>
                        <input type="checkbox" checked={on} onChange={() => setPending(on ? granted.filter((x) => x !== m.id) : [...granted, m.id])} />
                      </label>
                    );
                  })}
                  <div className={s.saveRow}>
                    {pending && <span className={s.warnText}>Unsaved changes</span>}
                    <button type="button" className={s.solid} disabled={!pending} onClick={saveAccess}>
                      Save access
                    </button>
                  </div>
                  <p className={s.meta}>Access is all-or-nothing per module. The server reads the role from the signed-in token, so nobody can widen their own access from the browser.</p>
                </section>
              </div>
            </>
          )}

          {page === 'Employees' && (
            <>
              <h1>Employees</h1>
              <p className={s.muted}>Admins add employees; each one activates by signing up with their work email.</p>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Access</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {st.people.map((p) => {
                    const r = st.roles.find((x) => x.id === p.role);
                    return (
                      <tr key={p.email}>
                        <td>
                          <span className={s.personCell}>
                            <i>{p.name.split(' ').map((w) => w[0]).join('')}</i>
                            <span>
                              <b>{p.name}</b>
                              <em>{p.email}</em>
                            </span>
                          </span>
                        </td>
                        <td>
                          {p.admin ? (
                            'Admin'
                          ) : (
                            <select
                              className={s.select}
                              value={p.role ?? ''}
                              aria-label={`${p.name}'s role`}
                              onChange={(e) => store.set((s0) => ({ people: s0.people.map((x) => (x.email === p.email ? { ...x, role: e.target.value || null } : x)) }))}
                            >
                              <option value="">Unassigned</option>
                              {st.roles.map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <span className={`${s.pill} ${p.admin ? s.pInfo : r ? s.pOff : s.pWarn}`}>{p.admin ? 'Admin · all modules' : r ? 'Role-scoped' : 'No access'}</span>
                          {p.status === 'Pending' && <span className={`${s.pill} ${s.pOff}`}>Pending</span>}
                        </td>
                        <td className={s.muted}>{p.added}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {page === 'Audit log' && (
            <>
              <h1>Audit log</h1>
              <p className={s.muted}>Every question asked of the assistant, the answer it gave, and the chunks it cited. Questions you ask in the Employee chat appear here.</p>
              <div className={s.filters}>
                {(
                  [
                    ['all', 'All ratings'],
                    ['up', 'Marked helpful'],
                    ['down', 'Marked unhelpful'],
                    ['none', 'Unrated'],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} type="button" aria-current={rating === k ? 'true' : undefined} onClick={() => setRating(k)}>
                    {l}
                  </button>
                ))}
              </div>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Question</th>
                    <th>Outcome</th>
                    <th>Sources</th>
                    <th>Rating</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {st.audit
                    .filter((a) => rating === 'all' || (rating === 'none' ? !a.rating : a.rating === rating))
                    .map((a) => (
                      <Fragment key={a.id}>
                        <tr className={s.clickRow} onClick={() => setOpen(open === a.id ? null : a.id)}>
                          <td>{a.who}</td>
                          <td>
                            <b>{a.q}</b>
                          </td>
                          <td>
                            <span className={`${s.pill} ${a.outcome === 'answered' ? s.pOk : a.outcome === 'small_talk' ? s.pOff : s.pWarn}`}>{OUTCOME_LABEL[a.outcome]}</span>
                          </td>
                          <td>{a.chunks ? `${a.chunks} chunk${a.chunks > 1 ? 's' : ''}` : '—'}</td>
                          <td>{a.rating === 'up' ? 'Helpful' : a.rating === 'down' ? 'Unhelpful' : '—'}</td>
                          <td className={s.muted}>{ago(a.at)}</td>
                        </tr>
                        {open === a.id && (
                          <tr className={s.expanded}>
                            <td colSpan={6}>
                              <p className={s.caps}>Answer given</p>
                              <p>{a.answer}</p>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </>
          )}

          {page === 'Settings' && (
            <>
              <h1>Settings</h1>
              <section className={s.card}>
                <label className={s.slider}>
                  <span>
                    <b>Readiness threshold</b>
                    <em>Uploads scoring below this stay in draft until you override, replace or delete them.</em>
                  </span>
                  <input type="range" min={40} max={95} value={readiness} onChange={(e) => setReadiness(Number(e.target.value))} />
                  <output>{readiness}</output>
                </label>
                <label className={s.slider}>
                  <span>
                    <b>Answer threshold</b>
                    <em>Below this relevance score the model is never called, and the employee gets “I couldn’t find a clear answer”.</em>
                  </span>
                  <input type="range" min={0.4} max={0.9} step={0.01} value={gate} onChange={(e) => setGate(Number(e.target.value))} />
                  <output>{gate.toFixed(2)}</output>
                </label>
              </section>
            </>
          )}

          {page === 'Quality' && (
            <>
              <h1>Quality</h1>
              <p className={s.muted}>Platform owner view. Every live question is traced: outcome, retrieved chunks and scores, latency per stage, models and tokens.</p>
              <div className={s.kpis}>
                <div>
                  <span>Answered</span>
                  <b>{Math.round((st.audit.filter((a) => a.outcome === 'answered').length / st.audit.length) * 100)}%</b>
                  <em>of {st.audit.length} traced questions</em>
                </div>
                <div>
                  <span>Unanswered</span>
                  <b>{unanswered.length}</b>
                  <em>below threshold or no access</em>
                </div>
                <div>
                  <span>Rated helpful</span>
                  <b>{st.audit.filter((a) => a.rating === 'up').length}</b>
                  <em>{st.audit.filter((a) => a.rating === 'down').length} rated unhelpful</em>
                </div>
                <div>
                  <span>Answer gate</span>
                  <b>{gate.toFixed(2)}</b>
                  <em>reranker relevance score</em>
                </div>
              </div>
              <section className={s.card}>
                <h3>Outcomes</h3>
                {(['answered', 'below_threshold', 'no_access', 'small_talk'] as const).map((o) => {
                  const n = st.audit.filter((a) => a.outcome === o).length;
                  return (
                    <div key={o} className={s.outRow}>
                      <span>{OUTCOME_LABEL[o]}</span>
                      <span className={s.score}>
                        <i style={{ width: `${(n / st.audit.length) * 100}%`, background: o === 'answered' ? '#248a3d' : o === 'small_talk' ? '#86868b' : '#b25000' }} />
                      </span>
                      <b>{n}</b>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </main>

      {toast && (
        <p className={s.toast} role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
