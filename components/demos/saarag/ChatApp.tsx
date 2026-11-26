'use client';

// Saarag employee client, recreated. Layout, copy and the two refusal panels follow Client/src
// (Sidebar, AskPage, Turn, GeneratingPanel, AnswerBody, SourceList, CitationDrawer, RefusalPanel, WhoToAsk).

import { Fragment, useEffect, useRef, useState } from 'react';
import { accessFor, askAndLog, chatsFor, docModule, moduleName, MODULES, newConversation, rateAnswer, savedAnswer, store, useSaarag, type Answer, type Chat } from './data';
import { Sym } from './Sym';
import s from './saarag.module.css';

type Turn = { id: number; q: string; a: Answer | null; shown: number; rating: 'up' | 'down' | null; copied: boolean; auditId: number | null };
type View = 'ask' | 'kb' | 'history' | 'status';

const STARTERS = ['How many sick leaves do I get?', 'How do I connect to the VPN from home?', 'What’s the lockout procedure before servicing a forklift?', 'Is there a stipend for home internet?'];

const list = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const pretty = (file: string) => file.replace(/\.[a-z]+$/, '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function ChatApp() {
  const st = useSaarag();
  const me = st.people.find((p) => p.name === st.asker)!;
  const access = accessFor(st, st.asker);
  const myModules = MODULES.filter((m) => access.modules.includes(m.id));
  const docCount = st.docs.filter((d) => d.status === 'active' && access.modules.includes(d.module)).length;
  const admins = st.people.filter((p) => p.admin);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState<{ file: string; idx: number; total: number; score: number; text: string } | null>(null);
  const [view, setView] = useState<View>('ask');
  /** The open conversation; null until the first question of a new one */
  const [conv, setConv] = useState<number | null>(null);
  const chats = chatsFor(st, st.asker);
  const listRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  // Switching who is signed in starts a fresh conversation
  const [askerSeen, setAskerSeen] = useState(st.asker);
  if (askerSeen !== st.asker) {
    setAskerSeen(st.asker);
    setTurns([]);
    setDrawer(null);
    setConv(null);
  }
  const nextTurn = useRef(1);

  function submit(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setDraft('');
    setView('ask');
    setBusy(true);
    const id = nextTurn.current++;
    const c = conv ?? newConversation();
    if (conv === null) setConv(c);
    setTurns((t) => [...t, { id, q: text, a: null, shown: 0, rating: null, copied: false, auditId: null }]);

    timers.current.push(
      window.setTimeout(() => {
        const { answer: a, auditId } = askAndLog(text, c);
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, a, auditId } : x)));
        if (a.outcome !== 'answered' && a.outcome !== 'small_talk') return setBusy(false);
        // Stream the answer in, a few words at a time, as the real client does over SSE
        const total = a.text.split(' ').length;
        let shown = 0;
        const step = () => {
          shown = Math.min(total, shown + 3);
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, shown } : x)));
          if (shown < total) timers.current.push(window.setTimeout(step, 45));
          else setBusy(false);
        };
        step();
      }, 1300),
    );
  }

  const rate = (t: Turn, r: 'up' | 'down') => {
    const next = t.rating === r ? null : r;
    setTurns((all) => all.map((x) => (x.id === t.id ? { ...x, rating: next } : x)));
    if (t.auditId) rateAnswer(t.auditId, next);
  };

  const copy = (t: Turn) => {
    navigator.clipboard?.writeText(t.a?.text ?? '').catch(() => {});
    setTurns((all) => all.map((x) => (x.id === t.id ? { ...x, copied: true } : x)));
    timers.current.push(window.setTimeout(() => setTurns((all) => all.map((x) => (x.id === t.id ? { ...x, copied: false } : x))), 1500));
  };

  // Open a saved chat (possibly started on the phone) and carry on in it
  function openChat(chat: Chat) {
    setView('ask');
    setDrawer(null);
    setConv(chat.id);
    setTurns(chat.turns.map((row) => ({ id: nextTurn.current++, q: row.q, a: savedAnswer(st, row), shown: 9999, rating: row.rating, copied: false, auditId: row.id })));
  }

  // Answer text with [file] citations turned into chips
  function body(t: Turn) {
    const a = t.a!;
    const shownText = a.text.split(' ').slice(0, t.shown).join(' ');
    const parts = shownText.split(/(\[[^\]]+\])/g);
    return parts.map((p, i) => {
      const m = p.match(/^\[([^\]]+)\]$/);
      if (!m) return <Fragment key={i}>{p}</Fragment>;
      const src = a.sources.find((x) => x.file === m[1]);
      return (
        <button key={i} type="button" className={s.cite} onClick={() => src && setDrawer(src)}>
          {m[1]}
        </button>
      );
    });
  }

  const actions = (t: Turn) => (
    <div className={s.actions}>
      <span>
        <button type="button" className={t.rating === 'up' ? s.rated : undefined} aria-label="Helpful" aria-pressed={t.rating === 'up'} onClick={() => rate(t, 'up')}>
          <Sym n="thumb_up" fill={t.rating === 'up'} />
        </button>
        <button type="button" className={t.rating === 'down' ? s.rated : undefined} aria-label="Not helpful" aria-pressed={t.rating === 'down'} onClick={() => rate(t, 'down')}>
          <Sym n="thumb_down" fill={t.rating === 'down'} />
        </button>
      </span>
      <button type="button" onClick={() => copy(t)}>
        <Sym n="content_copy" /> {t.copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );

  const whoToAsk = (
    <div className={s.who}>
      <p className={s.caps}>Who to ask</p>
      {admins.map((p) => (
        <div key={p.email} className={s.person}>
          <span>{p.name.split(' ').map((w) => w[0]).join('')}</span>
          <div>
            <b>{p.name}</b>
            <a href={`mailto:${p.email}`} onClick={(e) => e.preventDefault()}>
              <Sym n="mail" /> {p.email}
            </a>
          </div>
        </div>
      ))}
    </div>
  );

  function refusal(t: Turn) {
    const a = t.a!;
    const isAccess = a.outcome === 'no_access';
    const scope = list(a.searched);
    const text = isAccess
      ? !access.hasRole
        ? 'You don’t have a role assigned yet, so there’s nothing I’m allowed to search. An admin needs to give you one.'
        : `Nothing in ${scope} covers this. Your ${access.roleName} role doesn’t reach any other module, and I can’t see them either.`
      : `I searched ${scope}, but nothing in there matched closely enough to answer from. It may also sit in a module your role doesn’t cover. Either way, I’d rather say nothing than guess.`;
    return (
      <div className={isAccess ? s.refuseAccess : s.refuseUnknown}>
        <div className={s.refuseHead}>
          <Sym n={isAccess ? 'lock' : 'info'} />
          <div>
            <h3>{isAccess ? 'This is outside your access.' : 'I couldn’t find a clear answer to this.'}</h3>
            <p>{text}</p>
          </div>
        </div>
        <hr />
        {whoToAsk}
      </div>
    );
  }

  const firstName = me.name.split(' ')[0];

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <div className={s.brand}>
          <span className={s.glyph}>S</span>
          <div>
            <b>Saarag</b>
            <em>Internal knowledge</em>
          </div>
        </div>
        <button type="button" className={s.newQ} onClick={() => { setTurns([]); setView('ask'); setDrawer(null); setConv(null); }}>
          <Sym n="add" /> New question
        </button>

        <p className={s.caps}>Your access</p>
        <ul className={s.access}>
          {myModules.length ? (
            myModules.map((m) => (
              <li key={m.id}>
                <Sym n="folder" /> {m.name}
              </li>
            ))
          ) : (
            <li className={s.none}>No modules yet</li>
          )}
        </ul>

        <nav className={s.nav}>
          {(
            [
              ['kb', 'database', 'Knowledge base'],
              ['history', 'history', 'Recent history'],
              ['status', 'verified_user', 'System status'],
            ] as const
          ).map(([v, icon, label]) => (
            <button key={v} type="button" aria-current={view === v ? 'page' : undefined} onClick={() => setView(view === v ? 'ask' : v)}>
              <Sym n={icon} /> {label}
            </button>
          ))}
        </nav>

        {chats.length > 0 && (
          <>
            <p className={s.caps}>Recent</p>
            <ul className={s.recent}>
              {chats.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button type="button" aria-current={c.id === conv ? 'true' : undefined} onClick={() => openChat(c)} title={c.title}>
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className={s.signedIn}>
          <p className={s.caps}>Demo · signed in as</p>
          <select value={st.asker} onChange={(e) => store.set({ asker: e.target.value })} aria-label="Switch the signed-in employee">
            {st.people
              .filter((p) => p.status === 'Active' || !p.role)
              .map((p) => {
                const r = st.roles.find((x) => x.id === p.role);
                return (
                  <option key={p.email} value={p.name}>
                    {p.name} · {p.admin ? 'Admin' : r ? r.name : 'no role'}
                  </option>
                );
              })}
          </select>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.well} ref={listRef}>
          {view === 'kb' && (
            <section className={s.panel}>
              <h2>Knowledge base</h2>
              <p className={s.muted}>The documents your answers can come from: {docCount} live in {list(myModules.map((m) => m.name)) || 'no modules'}.</p>
              {st.docs
                .filter((d) => d.status === 'active' && access.modules.includes(d.module))
                .map((d) => (
                  <div key={d.file} className={s.kbRow}>
                    <Sym n="description" />
                    <span>{d.file}</span>
                    <em>{moduleName(d.module)}</em>
                  </div>
                ))}
            </section>
          )}
          {view === 'history' && (
            <section className={s.panel}>
              <h2>Recent history</h2>
              {st.audit.filter((a) => a.who === st.asker).map((a) => (
                <button key={a.id} type="button" className={s.kbRow} onClick={() => submit(a.q)}>
                  <Sym n="history" />
                  <span>{a.q}</span>
                  <em>{a.outcome === 'answered' ? 'Answered' : a.outcome === 'small_talk' ? 'Small talk' : 'Not answered'}</em>
                </button>
              ))}
            </section>
          )}
          {view === 'status' && (
            <section className={s.panel}>
              <h2>System status</h2>
              {['API', 'Search index', 'Answer model'].map((x) => (
                <div key={x} className={s.kbRow}>
                  <i className={s.dotOk} />
                  <span>{x}</span>
                  <em>Operational</em>
                </div>
              ))}
            </section>
          )}

          {view === 'ask' && turns.length === 0 && (
            <div className={s.empty}>
              <h1>Hello, {firstName}</h1>
              <p className={s.muted}>
                {myModules.length
                  ? `Ask anything about ${list(myModules.map((m) => m.name))}. Every answer shows the document it came from.`
                  : 'You don’t have access to any documents yet. An admin needs to give you a role.'}
              </p>
              <p className={s.caps}>Try one of these</p>
              <div className={s.starters}>
                {STARTERS.map((q) => (
                  <button key={q} type="button" onClick={() => submit(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'ask' &&
            turns.map((t) => (
              <div key={t.id} className={s.turn}>
                <p className={s.q}>{t.q}</p>
                <div className={s.reply}>
                  <span className={s.avatar}>
                    <Sym n="auto_awesome" fill />
                  </span>
                  <div className={s.replyBody}>
                    {!t.a ? (
                      <div className={s.generating}>
                        <span>
                          Searching {list(myModules.map((m) => m.name)) || 'your documents'}
                          {docCount > 0 && ` — ${docCount} document${docCount === 1 ? '' : 's'}`}
                        </span>
                        <i className={s.sweep} />
                      </div>
                    ) : t.a.outcome === 'answered' || t.a.outcome === 'small_talk' ? (
                      <>
                        <p className={s.answer}>{body(t)}</p>
                        {t.a.sources.length > 0 && t.shown >= t.a.text.split(' ').length && (
                          <ul className={s.sources}>
                            {[...new Map(t.a.sources.map((x) => [x.file, x])).values()].map((src) => (
                              <li key={src.file + src.idx}>
                                <button type="button" onClick={() => setDrawer(src)}>
                                  <Sym n="description" /> Source: <b>{src.file}</b> · {Math.round(src.score * 100)}% match
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {t.shown >= t.a.text.split(' ').length && t.a.outcome === 'answered' && actions(t)}
                      </>
                    ) : (
                      <>
                        {refusal(t)}
                        {actions(t)}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        <form
          className={s.composer}
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <div className={s.box}>
            {busy ? (
              <p className={s.pending}>Generating response...</p>
            ) : (
              <textarea
                rows={1}
                value={draft}
                placeholder="Ask about a policy or procedure"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit(draft);
                  }
                }}
              />
            )}
            <button type="submit" aria-label="Send" disabled={busy || !draft.trim()}>
              <Sym n={busy ? 'stop' : 'arrow_upward'} />
            </button>
          </div>
          <p className={s.caps}>AI can make mistakes. Verify important information.</p>
        </form>
      </main>

      {drawer && (
        <aside className={s.drawer} aria-label="Source">
          <button type="button" className={s.close} aria-label="Close" onClick={() => setDrawer(null)}>
            <Sym n="close" />
          </button>
          <h3>{pretty(drawer.file)}</h3>
          <p className={s.muted}>
            {drawer.file.split('.').pop()!.toUpperCase()} · {moduleName(docModule(drawer.file))} · Ingested {st.docs.find((d) => d.file === drawer.file)?.uploaded}
          </p>
          <p className={s.caps}>Matched passage</p>
          <p className={s.muted}>
            Chunk {drawer.idx} of {drawer.file} · {Math.round(drawer.score * 100)}% match
          </p>
          <blockquote className={s.passage}>{drawer.text}</blockquote>
          <p className={s.caps}>Status</p>
          <p className={s.statusLine}>
            <i className={s.dotOk} /> Current version
          </p>
          <p className={s.caps}>Tags</p>
          <div className={s.tags}>
            {st.docs.find((d) => d.file === drawer.file)?.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <button type="button" className={s.solid}>
            <Sym n="download" /> Download original
          </button>
        </aside>
      )}
    </div>
  );
}
