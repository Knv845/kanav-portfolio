'use client';

// Saarag mobile (branch feat/mobile-app, client_app/), recreated. Expo / React Native employee app that signs in
// with the same account as the web Client and lists the same chats, so either can continue a chat the other started.
// Screens and copy follow app/index.jsx (SignIn, Home), TopBar, Drawer, ChatView, Turn, Composer and CitationSheet.

import { Fragment, useEffect, useRef, useState } from 'react';
import {
  accessFor,
  askAndLog,
  chatsFor,
  moduleName,
  MODULES,
  newConversation,
  rateAnswer,
  savedAnswer,
  store,
  useSaarag,
  type Answer,
  type Chat,
  type Source,
} from './data';
import { Sym } from './Sym';
import s from './mobile.module.css';

type Turn = { id: number; q: string; a: Answer | null; shown: number; rating: 'up' | 'down' | null; auditId: number | null };

const DISCLAIMER = 'AI can make mistakes. Verify important information.';
const DEMO_LOGINS = [
  ['priya.nair@acme.in', 'Engineer'],
  ['ravi.kumar@acme.in', 'Floor Supervisor'],
  ['arjun.mehta@acme.in', 'not activated yet'],
] as const;

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const docTitle = (file: string) => file.replace(/\.[a-z]+$/, '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const fileKind = (file: string) => ({ txt: 'Text', pdf: 'PDF', docx: 'Word', md: 'Markdown' })[file.split('.').pop() ?? ''] ?? 'File';
function relative(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : h < 48 ? 'Yesterday' : `${Math.round(h / 24)}d ago`;
}

export default function MobileApp() {
  const st = useSaarag();
  const [dark, setDark] = useState(false);
  const [phase, setPhase] = useState<'signed-out' | 'loading' | 'ready' | 'unlinked'>('signed-out');
  const [email, setEmail] = useState(() => st.people.find((p) => p.name === st.asker)?.email ?? '');
  const [password, setPassword] = useState('demo-password');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const [menu, setMenu] = useState(false);
  const [conv, setConv] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<Source | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nextTurn = useRef(1);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const me = st.people.find((p) => p.name === st.asker)!;
  const access = accessFor(st, st.asker);
  const myModules = MODULES.filter((m) => access.modules.includes(m.id));
  const chats = chatsFor(st, st.asker);
  const title = chats.find((c) => c.id === conv)?.title ?? 'Saarag';
  const noAccess = myModules.length === 0;

  // Someone else signed in on the web demo: this phone follows the same account
  const [askerSeen, setAskerSeen] = useState(st.asker);
  if (askerSeen !== st.asker) {
    setAskerSeen(st.asker);
    setTurns([]);
    setConv(null);
    setSheet(null);
    setEmail(me.email);
  }

  function signIn() {
    const person = st.people.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
    if (!person || !password) return setError('Invalid login credentials');
    setError('');
    setPhase('loading');
    timers.current.push(
      window.setTimeout(() => {
        store.set({ asker: person.name });
        setPhase(person.status === 'Pending' ? 'unlinked' : 'ready');
      }, 700),
    );
  }

  function signOut() {
    setMenu(false);
    setTurns([]);
    setConv(null);
    setPhase('signed-out');
  }

  function newChat() {
    setTurns([]);
    setConv(null);
    setMenu(false);
  }

  function openChat(chat: Chat) {
    setConv(chat.id);
    setTurns(chat.turns.map((row) => ({ id: nextTurn.current++, q: row.q, a: savedAnswer(st, row), shown: 9999, rating: row.rating, auditId: row.id })));
    setMenu(false);
  }

  function send(q: string) {
    const text = q.trim();
    if (!text || busy || noAccess) return;
    setDraft('');
    setBusy(true);
    const id = nextTurn.current++;
    const c = conv ?? newConversation();
    if (conv === null) setConv(c);
    setTurns((t) => [...t, { id, q: text, a: null, shown: 0, rating: null, auditId: null }]);
    timers.current.push(
      window.setTimeout(() => {
        const { answer, auditId } = askAndLog(text, c);
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, a: answer, auditId } : x)));
        if (answer.outcome !== 'answered' && answer.outcome !== 'small_talk') return setBusy(false);
        const total = answer.text.split(' ').length;
        let shown = 0;
        const step = () => {
          shown = Math.min(total, shown + 3);
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, shown } : x)));
          if (shown < total) timers.current.push(window.setTimeout(step, 50));
          else setBusy(false);
        };
        step();
      }, 1200),
    );
  }

  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(false);
  }

  const rate = (t: Turn, r: 'up' | 'down') => {
    if (!t.auditId) return;
    const next = t.rating === r ? null : r;
    setTurns((all) => all.map((x) => (x.id === t.id ? { ...x, rating: next } : x)));
    rateAnswer(t.auditId, next);
  };

  function answerText(t: Turn) {
    const a = t.a!;
    const words = a.text.split(' ');
    const parts = words.slice(0, t.shown).join(' ').split(/(\[[^\]]+\])/g);
    return parts.map((p, i) => {
      const m = p.match(/^\[([^\]]+)\]$/);
      if (!m) return <Fragment key={i}>{p}</Fragment>;
      const src = a.sources.find((x) => x.file === m[1]);
      return (
        <button key={i} type="button" className={s.cite} onClick={() => src && setSheet(src)}>
          {m[1]}
        </button>
      );
    });
  }

  function turnBody(t: Turn) {
    if (!t.a)
      return (
        <div className={s.searching}>
          <span>Searching {myModules.map((m) => m.name).join(', ') || 'your documents'}</span>
          <i className={s.track} />
        </div>
      );
    const a = t.a;
    const done = t.shown >= a.text.split(' ').length;
    if (a.outcome === 'no_access' || a.outcome === 'below_threshold') {
      const isAccess = a.outcome === 'no_access';
      const names = a.searched;
      const scope = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
      const body = isAccess
        ? !access.hasRole
          ? 'You don’t have a role assigned yet, so there’s nothing I’m allowed to search. An admin needs to give you one.'
          : `Nothing in ${scope} covers this. Your ${access.roleName ?? 'role'} doesn’t reach any other module, and I can’t see them either.`
        : scope
          ? `I searched ${scope}, but nothing in there matched closely enough to answer from. It may also sit in a module your role doesn’t cover. Either way, I’d rather say nothing than guess.`
          : 'Nothing in the documents I can search matched closely enough to answer from. I’d rather say nothing than guess.';
      return (
        <>
          <div className={isAccess ? s.card : `${s.card} ${s.cardWarn}`}>
            <Sym n={isAccess ? 'lock' : 'info'} />
            <div>
              <b>{isAccess ? 'This is outside your access.' : 'I couldn’t find a clear answer to this.'}</b>
              <p>{body}</p>
            </div>
          </div>
          {actions(t)}
        </>
      );
    }
    return (
      <>
        <p className={s.answer}>{answerText(t)}</p>
        {done && a.sources.length > 0 && (
          <div className={s.sources}>
            {[...new Map(a.sources.map((x) => [x.file, x])).values()].map((src) => (
              <button key={src.file} type="button" onClick={() => setSheet(src)}>
                <Sym n="description" size={15} />
                <span>
                  Source: <b>{src.file}</b> · {Math.round(src.score * 100)}% match
                </span>
              </button>
            ))}
          </div>
        )}
        {done && a.outcome === 'answered' && actions(t)}
      </>
    );
  }

  const actions = (t: Turn) => (
    <div className={s.actions}>
      {(['up', 'down'] as const).map((r) => (
        <button key={r} type="button" aria-label={r === 'up' ? 'Helpful' : 'Not helpful'} aria-pressed={t.rating === r} className={t.rating === r ? s.rated : undefined} onClick={() => rate(t, r)}>
          <Sym n={r === 'up' ? 'thumb_up' : 'thumb_down'} fill={t.rating === r} size={18} />
        </button>
      ))}
    </div>
  );

  // ---------- screens ----------
  let screen;
  if (phase === 'signed-out' || phase === 'loading') {
    screen =
      phase === 'loading' ? (
        <div className={s.centered}>
          <span className={s.badge} style={{ width: 40, height: 40, fontSize: 18 }}>
            S
          </span>
          <i className={s.spinner} />
        </div>
      ) : (
        <form
          className={s.auth}
          onSubmit={(e) => {
            e.preventDefault();
            signIn();
          }}
        >
          <div className={s.authBrand}>
            <span className={s.badge} style={{ width: 36, height: 36, fontSize: 16 }}>
              S
            </span>
            <b>Saarag</b>
          </div>
          <h1>Sign in</h1>
          <p className={s.body}>Use the same email and password as the web portal. Your chats are the same on both.</p>
          <label className={s.label}>
            Work email
            <input value={email} placeholder="you@company.com" autoComplete="off" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className={s.label}>
            Password
            <span className={`${s.pwRow} ${error ? s.bad : ''}`}>
              <input type={showPw ? 'text' : 'password'} value={password} placeholder="Your password" onChange={(e) => setPassword(e.target.value)} />
              <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((v) => !v)}>
                <Sym n={showPw ? 'visibility_off' : 'visibility'} size={20} />
              </button>
            </span>
          </label>
          {error && <p className={s.error}>{error}</p>}
          <button type="submit" className={s.primary}>
            Sign in
          </button>
          <div className={s.hint}>
            <Sym n="info" size={16} />
            <p>New here or forgot your password? Use the web portal to activate your account or reset it, then come back.</p>
          </div>
          <div className={s.demoLogins}>
            <p>Demo accounts (any password)</p>
            {DEMO_LOGINS.map(([mail, what]) => (
              <button key={mail} type="button" onClick={() => setEmail(mail)}>
                {mail} <em>· {what}</em>
              </button>
            ))}
          </div>
        </form>
      );
  } else if (phase === 'unlinked') {
    screen = (
      <div className={s.centered}>
        <span className={s.blockedIcon}>
          <Sym n="mail_outline" size={26} />
        </span>
        <h2>Finish activating your account</h2>
        <p className={s.body}>Your sign-in worked, but your employee account isn’t activated yet. Finish activation on the web portal, then sign in here again.</p>
        <button type="button" className={s.secondary} onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  } else {
    screen = (
      <>
        <header className={s.topbar}>
          <button type="button" aria-label="Open navigation" onClick={() => setMenu(true)}>
            <Sym n="menu" size={24} />
          </button>
          <b>{title}</b>
          <button type="button" aria-label="New conversation" onClick={newChat}>
            <Sym n="edit_note" size={25} />
          </button>
        </header>

        <div className={s.thread} ref={threadRef}>
          {turns.length === 0 ? (
            <div className={s.empty}>
              <h1>Hello, {me.name.split(' ')[0]}</h1>
              <p className={s.body}>
                {noAccess
                  ? 'You don’t have access to any knowledge modules yet, so there’s nothing to search.'
                  : `Ask anything about ${myModules.map((m) => m.name).join(', ')}. Every answer shows the document it came from.`}
              </p>
              {noAccess ? (
                <div className={`${s.card} ${s.cardWarn}`}>
                  <Sym n="lock" />
                  <p>
                    {access.hasRole
                      ? 'Your role exists but grants no modules. An admin can add them in the admin portal under Roles.'
                      : 'No role is assigned to your account. An admin needs to assign one before you can ask anything.'}
                  </p>
                </div>
              ) : (
                chats.length > 0 && (
                  <div className={s.starters}>
                    <p className={s.caps}>Pick up where you left off</p>
                    {[...new Set(chats.map((c) => c.title))].slice(0, 4).map((q) => (
                      <button key={q} type="button" onClick={() => send(q)}>
                        <span>{q}</span>
                        <Sym n="north_east" size={16} />
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={s.turn}>
                <p className={s.question}>{t.q}</p>
                <div className={s.reply}>
                  <span className={s.mark}>
                    <Sym n="auto_awesome" fill size={13} />
                  </span>
                  <div className={s.replyBody}>{turnBody(t)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          className={s.composer}
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className={s.box}>
            {busy ? (
              <p className={s.pending}>Generating response…</p>
            ) : (
              <input value={draft} disabled={noAccess} placeholder={noAccess ? 'No modules to search yet' : turns.length ? 'Ask a follow-up' : 'Ask about a policy or procedure'} onChange={(e) => setDraft(e.target.value)} aria-label="Question" />
            )}
            {busy ? (
              <button type="button" aria-label="Stop" onClick={stop}>
                <Sym n="stop" fill size={14} />
              </button>
            ) : (
              <button type="submit" aria-label="Send" disabled={!draft.trim() || noAccess}>
                <Sym n="arrow_upward" size={18} />
              </button>
            )}
          </div>
          <p className={s.disclaimer}>{DISCLAIMER}</p>
        </form>

        {menu && (
          <div className={s.scrim} onClick={() => setMenu(false)}>
            <aside className={s.drawer} onClick={(e) => e.stopPropagation()} aria-label="Navigation">
              <div className={s.drawerBrand}>
                <span className={s.badge}>S</span>
                <div>
                  <b>Saarag</b>
                  <span>Your company’s knowledge</span>
                </div>
                <button type="button" aria-label="Close navigation" onClick={() => setMenu(false)}>
                  <Sym n="close" size={22} />
                </button>
              </div>
              <button type="button" className={s.newChat} onClick={newChat}>
                <Sym n="add" size={18} /> New conversation
              </button>
              <div className={s.drawerScroll}>
                <p className={s.caps}>Your access</p>
                {myModules.length === 0 ? (
                  <p className={s.meta}>{access.hasRole ? 'Your role has no modules yet. Ask an admin to grant one.' : 'No role assigned, so nothing is searchable yet.'}</p>
                ) : (
                  myModules.map((m) => (
                    <p key={m.id} className={s.module}>
                      <Sym n="folder_open" size={17} /> {m.name}
                    </p>
                  ))
                )}
                <p className={s.caps} style={{ marginTop: 24 }}>
                  Recent
                </p>
                {chats.length === 0 && <p className={s.meta}>No chats yet. Anything you ask here or on the web shows up here.</p>}
                {chats.map((c) => (
                  <button key={c.id} type="button" className={c.id === conv ? `${s.chat} ${s.chatOn}` : s.chat} onClick={() => openChat(c)}>
                    <span>{c.title}</span>
                    <em>
                      {relative(c.updatedAt)}
                      {c.turns.length > 1 ? ` · ${c.turns.length} questions` : ''}
                    </em>
                  </button>
                ))}
              </div>
              <div className={s.footer}>
                <span className={s.avatar}>{initials(me.name)}</span>
                <div>
                  <b>{me.name}</b>
                  <span>{access.roleName ?? me.email}</span>
                </div>
                <button type="button" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={() => setDark((d) => !d)}>
                  <Sym n={dark ? 'light_mode' : 'dark_mode'} size={20} />
                </button>
                <button type="button" aria-label="Sign out" onClick={signOut}>
                  <Sym n="logout" size={20} />
                </button>
              </div>
            </aside>
          </div>
        )}

        {sheet && (
          <div className={s.scrim} onClick={() => setSheet(null)}>
            <div className={s.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Source">
              <i className={s.grabber} />
              <p className={s.caps}>Source</p>
              <div className={s.sheetHead}>
                <span className={s.fileIcon}>
                  <Sym n="description" size={20} />
                </span>
                <div>
                  <b>{docTitle(sheet.file)}</b>
                  <span>
                    {fileKind(sheet.file)} · {sheet.file}
                  </span>
                </div>
              </div>
              <p className={s.detail}>
                <Sym n="bookmark" size={16} /> <span>Cited from</span> <b>Chunk {sheet.idx} of {sheet.total} · {moduleName(st.docs.find((d) => d.file === sheet.file)?.module ?? '')}</b>
              </p>
              <p className={s.detail}>
                <Sym n="insights" size={16} /> <span>Match</span> <b>{Math.round(sheet.score * 100)}%</b>
              </p>
              <blockquote className={s.passage}>{sheet.text}</blockquote>
              <button type="button" className={s.secondary} onClick={() => setSheet(null)}>
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`${s.app} ${dark ? s.dark : ''}`}>
      <div className={s.status} aria-hidden="true">
        <span>9:41</span>
        <span>▂▄▆ ◔ ▮</span>
      </div>
      {screen}
    </div>
  );
}
