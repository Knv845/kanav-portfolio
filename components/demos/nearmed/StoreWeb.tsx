'use client';

// NearMed store website, recreated on sample data. Layout and copy follow nearmed_web (Next.js):
// the dashboard's "Needs you now", the AI-drafted quote form that must be checked line by line, orders and products.

import { useEffect, useRef, useState } from 'react';
import { Icon, inr, PRODUCTS, RxPhoto, STORE } from './data';
import s from './store.module.css';

type Page = 'Dashboard' | 'Prescriptions' | 'My quotes' | 'Orders' | 'Products';
type Line = { name: string; qty: number; price: string; checked: boolean; ai: boolean; unclear?: boolean; written?: string };
type Rx = { id: number; meds: number; note: string; minsLeft: number; others: number; status: 'Needs quote' | 'Quoted' };
type QuoteState = { rx: number; total: number; lines: Line[]; status: 'In line' | 'On screen' | 'Won'; since: number };
type OStatus = 'New' | 'Accepted' | 'Packed' | 'Out for delivery' | 'Delivered' | 'Cancelled';
type Order = { id: number; status: OStatus; items: [string, number, number][]; placed: string; customer: string; fromQuote?: boolean };

const NEXT: Partial<Record<OStatus, [OStatus, string]>> = {
  New: ['Accepted', 'Mark accepted'],
  Accepted: ['Packed', 'Mark packed'],
  Packed: ['Out for delivery', 'Mark out for delivery'],
  'Out for delivery': ['Delivered', 'Mark delivered'],
};

const draftFor42 = (): Line[] => [
  { name: 'Pan 40', qty: 2, price: '155', checked: false, ai: true, written: 'Qty written: 30 · 1-0-0 × 30 days' },
  { name: 'Azithral 500', qty: 1, price: '118', checked: false, ai: true, written: 'Qty written: 3 · 1-0-0 × 3 days' },
  { name: 'Dolo 650', qty: 1, price: '31', checked: false, ai: true, unclear: true, written: 'Qty written: 10 · 1 tab twice daily' },
];

const ORDERS: Order[] = [
  { id: 11, status: 'New', items: [['Crocin Advance 500 mg', 2, 28], ['Dolo 650', 2, 31]], placed: '2 min ago', customer: 'Rohan Verma · 98111 20456' },
  { id: 10, status: 'Accepted', items: [['Crocin Advance 500 mg', 1, 28]], placed: '1:15 pm', customer: 'Demo Customer · 98000 00009' },
  { id: 9, status: 'Accepted', items: [['Dolo 650', 2, 31], ['Cetzine 10 mg', 2, 19]], placed: '11:40 am', customer: 'Ananya Rao · 98450 11223' },
  { id: 8, status: 'Packed', items: [['Cetzine 10 mg', 1, 19]], placed: 'Yesterday', customer: 'Demo Customer · 98000 00009' },
  { id: 7, status: 'Out for delivery', items: [['Crocin Advance 500 mg', 2, 28], ['Dolo 650', 2, 31]], placed: 'Yesterday', customer: 'Kabir Singh · 99880 76543' },
  { id: 6, status: 'Delivered', items: [['Dolo 650', 1, 31]], placed: '24 Nov', customer: 'Demo Customer · 98000 00009' },
  { id: 5, status: 'Delivered', items: [['Cetzine 10 mg', 2, 19], ['ORS Electral 21.8 g', 2, 21]], placed: '23 Nov', customer: 'Meera Iyer · 97400 33221' },
  { id: 1, status: 'Cancelled', items: [['Crocin Advance 500 mg', 2, 28], ['Dolo 650', 2, 31]], placed: '20 Nov', customer: 'Demo Customer · 98000 00009' },
];

const sum = (o: Order) => o.items.reduce((t, [, q, p]) => t + q * p, 0);
const chip = (st: string) =>
  st === 'New' || st === 'On screen' || st === 'In line' ? s.amber : st === 'Delivered' || st === 'Won' || st === 'Quoted' ? s.green : st === 'Cancelled' ? s.grey : s.blue;

function Spark({ data, color = '#4f378a' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - (v / max) * 24}`).join(' ');
  return (
    <svg className={s.spark} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export default function StoreWeb() {
  const [page, setPage] = useState<Page>('Dashboard');
  const [open, setOpen] = useState(true);
  const [sound, setSound] = useState(true);
  const [rxs, setRxs] = useState<Rx[]>([
    { id: 42, meds: 3, note: 'Need 10 days’ supply', minsLeft: 18, others: 0, status: 'Needs quote' },
    { id: 41, meds: 2, note: '', minsLeft: 7, others: 2, status: 'Needs quote' },
    { id: 39, meds: 4, note: 'Generic is fine', minsLeft: 26, others: 1, status: 'Quoted' },
  ]);
  const [quoting, setQuoting] = useState<number | null>(null);
  const [lines, setLines] = useState<Line[]>(draftFor42);
  const [ready, setReady] = useState('30');
  const [note, setNote] = useState('');
  const [quotes, setQuotes] = useState<QuoteState[]>([]);
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [orderTab, setOrderTab] = useState<'All' | OStatus>('All');
  const [stock, setStock] = useState<Record<string, number>>(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, p.stock])));
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, String(p.price)])));
  const [onSale, setOnSale] = useState<Record<string, boolean>>(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, true])));
  const [toast, setToast] = useState('');
  const [zoom, setZoom] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [stats, setStats] = useState({ sales: 1240, orders: 6, won: 3, sent: 5 });
  const timers = useRef<number[]>([]);
  const nextOrder = useRef(12);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const pendingRx = rxs.filter((r) => r.status === 'Needs quote');
  const newOrders = orders.filter((o) => o.status === 'New');
  const lineOk = (l: Line) => l.name.trim() && l.qty > 0 && Number(l.price) > 0 && (!l.ai || l.checked);
  const canSend = lines.length > 0 && lines.every(lineOk);
  const quoteTotal = lines.reduce((t, l) => t + l.qty * (Number(l.price) || 0), 0);

  const startQuote = (id: number) => {
    setQuoting(id);
    setLines(id === 42 ? draftFor42() : [{ name: 'Augmentin 625 Duo', qty: 1, price: '205', checked: false, ai: true, written: 'Qty written: 6 · 1-0-1 × 3 days' }, { name: 'Cetzine 10 mg', qty: 1, price: '19', checked: false, ai: true, written: 'Qty written: 5 · 0-0-1' }]);
    setReady('30');
    setNote('');
  };

  const sendQuote = () => {
    if (!canSend || quoting === null) return;
    const rx = quoting;
    const sent = { rx, total: quoteTotal, lines: lines.filter((l) => l.name.trim()) };
    setQuotes((q) => [{ ...sent, status: 'In line', since: Date.now() }, ...q.filter((x) => x.rx !== rx)]);
    // It waits its turn, goes on the customer's screen for 90 s, and here the customer says yes
    timers.current.push(
      window.setTimeout(() => setQuotes((q) => q.map((x) => (x.rx === rx ? { ...x, status: 'On screen', since: Date.now() } : x))), 4000),
      window.setTimeout(() => {
        const id = nextOrder.current++;
        setQuotes((q) => q.map((x) => (x.rx === rx ? { ...x, status: 'Won', since: Date.now() } : x)));
        setOrders((l) => [{ id, status: 'New', placed: 'Just now', customer: 'Demo Customer · 98000 00009', fromQuote: true, items: sent.lines.map((ln) => [ln.name, ln.qty, Number(ln.price)]) }, ...l]);
        setStats((st) => ({ ...st, won: st.won + 1, sales: st.sales + sent.total, orders: st.orders + 1 }));
        setToast(`🎉 You won prescription #${rx}. It is now order #${id}.`);
      }, 11000),
    );
    setRxs((l) => l.map((r) => (r.id === quoting ? { ...r, status: 'Quoted' } : r)));
    setStats((st) => ({ ...st, sent: st.sent + 1 }));
    setToast(`Quote sent for prescription #${quoting}: ${inr(quoteTotal)}. Watch it in My quotes.`);
    setQuoting(null);
  };

  const move = (id: number, to: OStatus) => setOrders((l) => l.map((o) => (o.id === id ? { ...o, status: to } : o)));

  // ---------- pieces ----------
  const QuoteForm = () => (
    <div className={s.quote}>
      <div className={s.quoteHead}>
        <h3>Price prescription #{quoting}</h3>
        <button type="button" className={s.iconBtn} aria-label="Close" onClick={() => setQuoting(null)}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className={s.quoteBody}>
        <div className={s.quotePhoto}>
          <button type="button" className={s.photoBtn} onClick={() => setZoom(true)} aria-label="Zoom the prescription photo">
            <RxPhoto />
          </button>
          <p className={s.meta}>Uploaded 4 min ago · {rxs.find((r) => r.id === quoting)?.minsLeft} min left · <b className={s.aiTag}><Icon name="sparkle" size={12} /> AI draft ready</b> · click the photo to zoom</p>
          {rxs.find((r) => r.id === quoting)?.note && <p className={s.custNote}>Customer’s note: “{rxs.find((r) => r.id === quoting)?.note}”</p>}
        </div>
        <div className={s.quoteForm}>
          <h4>Send a quote</h4>
          <p className={s.meta}>The AI drafted the lines below. Check each one against the photo and tick it before sending. You can send one quote per prescription.</p>
          <div className={s.qcols}>
            <span>Medicine</span>
            <span>Qty</span>
            <span>Unit price ₹</span>
          </div>
          {lines.map((l, i) => (
            <div key={i} className={`${s.qline} ${l.ai ? s.qlineAi : ''} ${l.unclear && !l.checked ? s.qlineUnclear : ''}`}>
              <div className={s.qrow}>
                <input value={l.name} placeholder="Medicine name" aria-label="Medicine" onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input type="number" min={0} value={l.qty} aria-label="Quantity" onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} />
                <input inputMode="decimal" value={l.price} aria-label="Unit price" onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d.]/g, '') } : x)))} />
              </div>
              {l.ai && (
                <div className={s.qai}>
                  {l.unclear && <span className={s.unclear}><Icon name="warn" size={13} /> Unclear, read the photo carefully.</span>}
                  <span className={s.meta}>{l.written}</span>
                  <label className={s.check}>
                    <input type="checkbox" checked={l.checked} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, checked: e.target.checked } : x)))} />
                    Checked against the photo
                  </label>
                </div>
              )}
            </div>
          ))}
          {lines.length < 8 && (
            <button type="button" className={s.addLine} onClick={() => setLines((ls) => [...ls, { name: '', qty: 1, price: '', checked: true, ai: false }])}>
              <Icon name="plus" size={14} /> Add a line
            </button>
          )}
          <div className={s.qrow2}>
            <label>
              Ready in (minutes)
              <input type="number" min={5} value={ready} onChange={(e) => setReady(e.target.value)} />
            </label>
            <label>
              Note (optional)
              <input value={note} placeholder="e.g. generic available" onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
          <button type="button" className={s.primaryWide} disabled={!canSend} onClick={sendQuote}>
            Send quote · {inr(quoteTotal)}
          </button>
          {!canSend && <p className={s.meta}>Tick every AI line once you have checked it against the photo.</p>}
        </div>
      </div>
    </div>
  );

  const OrderCard = (o: Order) => {
    const next = NEXT[o.status];
    return (
      <div key={o.id} className={s.ocard}>
        <div className={s.ocardMain}>
          <p className={s.ohead}>
            <b>Order #{o.id}</b> <i className={`${s.chip} ${chip(o.status)}`}>{o.status}</i> <i className={`${s.chip} ${s.grey}`}>{o.fromQuote ? 'From a quote' : 'Catalog'}</i> <span className={s.meta}>{o.placed}</span>
          </p>
          <p className={s.meta}>{o.customer}</p>
          <p className={s.meta}>
            <Icon name="pin" size={13} /> Flat 4, 21 Lake Road
          </p>
          <p className={s.olines}>
            {o.items.map(([n, q, p]) => `${q} × ${n} · ${inr(q * p)}`).join('   ')}
          </p>
          <p>
            <b>Total {inr(sum(o))}</b>
          </p>
        </div>
        <div className={s.ocardBtns}>
          {next && (
            <button type="button" className={s.primary} onClick={() => move(o.id, next[0])}>
              {next[1]}
            </button>
          )}
          {(o.status === 'New' || o.status === 'Accepted') && (
            <button type="button" className={s.outline} onClick={() => move(o.id, 'Cancelled')}>
              Cancel order
            </button>
          )}
        </div>
      </div>
    );
  };

  const nav: [Page | 'Staff' | 'Security', string, number?][] = [
    ['Dashboard', 'dash', pendingRx.length + newOrders.length],
    ['Prescriptions', 'doc', pendingRx.length],
    ['My quotes', 'quote'],
    ['Orders', 'orders', newOrders.length],
    ['Products', 'box'],
    ['Staff', 'staff'],
    ['Security', 'shield'],
  ];

  const dateLine = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <div className={s.logo}>
          <span>
            <Icon name="medical" size={20} />
          </span>
          <div>
            <b>NearMed</b>
            <em>for stores</em>
          </div>
        </div>
        <nav>
          {nav.map(([label, icon, count]) => (
            <button
              key={label}
              type="button"
              aria-current={page === label ? 'page' : undefined}
              onClick={() => (label === 'Staff' || label === 'Security' ? setToast(label === 'Staff' ? 'Staff: invite pharmacists with their own logins.' : 'Security: authenticator-app two-step sign-in and active sessions.') : (setPage(label), setQuoting(null)))}
            >
              <Icon name={icon} size={19} />
              {label}
              {!!count && <i>{count}</i>}
            </button>
          ))}
        </nav>
        <button type="button" className={s.logout} onClick={() => setToast('Logout is turned off in the demo.')}>
          <Icon name="logout" size={18} /> Logout
        </button>
      </aside>

      <div className={s.main}>
        <header className={s.top}>
          <h1>{page}</h1>
          <div className={s.who}>
            <button type="button" className={s.iconBtn} aria-label="Notifications" onClick={() => setToast(`${pendingRx.length} prescriptions and ${newOrders.length} new orders need you.`)}>
              <Icon name="bell" size={19} />
            </button>
            <span>{STORE.name}</span>
            <i>S</i>
          </div>
        </header>

        <div className={s.content}>
          {page === 'Dashboard' && (
            <>
              <div className={s.dashHead}>
                <div>
                  <p className={s.meta}>{dateLine}</p>
                  <h2>
                    {greet}, {STORE.name}
                  </h2>
                </div>
                <div className={s.toggles}>
                  <button type="button" className={s.soundBtn} aria-pressed={sound} onClick={() => setSound((v) => !v)}>
                    {sound ? '🔔' : '🔕'} Sound
                  </button>
                  <button type="button" className={open ? s.openPill : s.closedPill} aria-pressed={open} onClick={() => setOpen((v) => !v)}>
                    <span className={s.switch} />
                    {open ? 'Open · taking prescriptions' : 'Closed'}
                  </button>
                </div>
              </div>

              <div className={s.stats}>
                <div className={s.stat}>
                  <span>Sales today</span>
                  <b>{inr(stats.sales)}</b>
                  <em className={s.up}>↑ 12% on last Thursday</em>
                  <Spark data={[620, 880, 740, 1010, 930, 1100, 980, stats.sales]} />
                </div>
                <div className={s.stat}>
                  <span>Orders today</span>
                  <b>{stats.orders}</b>
                  <em className={s.up}>↑ 2 on last Thursday</em>
                  <Spark data={[3, 5, 4, 6, 4, 5, 4, stats.orders]} />
                </div>
                <div className={s.stat}>
                  <span>Prices won this week</span>
                  <b>
                    {stats.won} of {stats.sent}
                  </b>
                  <em>{Math.round((stats.won / stats.sent) * 100)}%</em>
                  <span className={s.bar}>
                    <i style={{ width: `${(stats.won / stats.sent) * 100}%` }} />
                  </span>
                </div>
                <div className={s.stat}>
                  <span>Your average reply</span>
                  <b>3 min 40 s</b>
                  <em>Fastest store: 2 min 5 s</em>
                  <span className={s.meta}>From prescription sent to your price</span>
                </div>
              </div>

              <div className={s.cols}>
                <section className={s.card}>
                  <h3>Needs you now</h3>
                  {!open && <p className={s.meta}>You’re closed, so customers can’t send you new prescriptions.</p>}
                  {pendingRx.map((r) => (
                    <div key={r.id} className={`${s.need} ${quoting === r.id ? s.needOn : ''}`}>
                      <span className={s.thumb}>
                        <RxPhoto />
                      </span>
                      <div className={s.needMid}>
                        <b>
                          Prescription #{r.id} · {r.meds} medicines
                        </b>
                        {r.note && <span className={s.meta}>“{r.note}”</span>}
                        <span className={s.tags}>
                          <i className={`${s.chip} ${r.minsLeft < 10 ? s.red : r.minsLeft < 20 ? s.amber : s.green}`}>{r.minsLeft} min left</i>
                          <i className={`${s.chip} ${s.grey}`}>{r.others ? `${r.others} stores priced it` : 'No prices yet · be first'}</i>
                          <i className={`${s.chip} ${s.purple}`}>AI draft ready</i>
                        </span>
                      </div>
                      <button type="button" className={s.primary} onClick={() => startQuote(r.id)}>
                        {quoting === r.id ? 'Pricing →' : 'Price it'}
                      </button>
                    </div>
                  ))}
                  {newOrders.map((o) => (
                    <div key={o.id} className={s.need}>
                      <span className={s.thumbIcon}>
                        <Icon name="orders" size={20} />
                      </span>
                      <div className={s.needMid}>
                        <b>
                          New order #{o.id} · {inr(sum(o))}
                        </b>
                        <span className={s.meta}>Deliver to Flat 4, 21 Lake Road · {o.placed}</span>
                      </div>
                      <button type="button" className={s.primary} onClick={() => move(o.id, 'Accepted')}>
                        Accept
                      </button>
                      <button type="button" className={s.outline} onClick={() => move(o.id, 'Cancelled')}>
                        Decline
                      </button>
                    </div>
                  ))}
                  {!pendingRx.length && !newOrders.length && <p className={s.calm}>All caught up. New prescriptions show up here.</p>}
                </section>

                {quoting !== null ? (
                  QuoteForm()
                ) : (
                  <section className={s.card}>
                    <h3>Running low</h3>
                    {PRODUCTS.filter((p) => stock[p.id] <= 5).map((p) => (
                      <div key={p.id} className={s.low}>
                        <span>{p.name}</span>
                        <i className={`${s.chip} ${stock[p.id] <= 2 ? s.red : s.amber}`}>{stock[p.id]} left</i>
                        <button type="button" className={s.outline} onClick={() => setStock((st) => ({ ...st, [p.id]: 25 }))}>
                          Restock
                        </button>
                      </div>
                    ))}
                    {!PRODUCTS.some((p) => stock[p.id] <= 5) && <p className={s.calm}>Nothing is running low.</p>}
                    <h3 className={s.mt}>Nothing to price right now?</h3>
                    <p className={s.meta}>Click “Price it” on a prescription to open the quote form here.</p>
                  </section>
                )}
              </div>

              <section className={s.card}>
                <div className={s.cardHead}>
                  <h3>Recent orders</h3>
                  <button type="button" className={s.link} onClick={() => setPage('Orders')}>
                    All orders →
                  </button>
                </div>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Placed</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{o.placed}</td>
                        <td>{o.customer.split(' · ')[0]}</td>
                        <td>{o.items.reduce((n, [, q]) => n + q, 0)}</td>
                        <td>{inr(sum(o))}</td>
                        <td>
                          <i className={`${s.chip} ${chip(o.status)}`}>{o.status}</i>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {page === 'Prescriptions' &&
            (quoting !== null ? (
              QuoteForm()
            ) : (
              <div className={s.rxGrid}>
                {rxs.map((r) => (
                  <div key={r.id} className={s.rxCard}>
                    <span className={s.rxImg}>
                      <RxPhoto />
                    </span>
                    <div className={s.rxInfo}>
                      <p className={s.ohead}>
                        <b>Prescription #{r.id}</b> <i className={`${s.chip} ${chip(r.status)}`}>{r.status}</i>
                      </p>
                      <p className={s.meta}>4 min ago · {r.minsLeft} min left · AI draft ready</p>
                      {r.status === 'Needs quote' && (
                        <button type="button" className={s.primary} onClick={() => startQuote(r.id)}>
                          Price it
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {page === 'My quotes' && (
            <div className={s.list}>
              {quotes.length === 0 && <p className={s.calm}>No quotes yet. Price prescription #42 from the Dashboard and it will show up here.</p>}
              {quotes.map((q) => {
                const left = 89 - Math.floor((now - q.since) / 1000);
                return (
                  <div key={q.rx} className={s.ocard}>
                    <div className={s.ocardMain}>
                      <p className={s.ohead}>
                        <b>Prescription #{q.rx}</b>{' '}
                        <i className={`${s.chip} ${chip(q.status)}`}>{q.status === 'On screen' ? `On screen ${Math.floor(left / 60)}:${String(Math.max(0, left % 60)).padStart(2, '0')}` : q.status}</i>
                      </p>
                      <p className={s.olines}>{q.lines.map((l) => `${l.qty} × ${l.name} · ${inr(l.qty * Number(l.price))}`).join('   ')}</p>
                      <p>
                        <b>Total {inr(q.total)}</b>
                      </p>
                      {q.status === 'In line' && <p className={s.meta}>Another store’s price is on the customer’s screen. Yours is next.</p>}
                      {q.status === 'On screen' && <p className={s.meta}>The customer has 90 seconds to say yes to your price.</p>}
                      {q.status === 'Won' && <p className={s.won}>Won · Demo Customer · 98000 00009. Their details only show now that they accepted.</p>}
                    </div>
                  </div>
                );
              })}
              <div className={`${s.ocard} ${s.faded}`}>
                <div className={s.ocardMain}>
                  <p className={s.ohead}>
                    <b>Prescription #39</b> <i className={`${s.chip} ${s.grey}`}>Skipped</i>
                  </p>
                  <p className={s.olines}>1 × Augmentin 625 Duo · ₹205.00   1 × Cetzine 10 mg · ₹19.00</p>
                </div>
              </div>
            </div>
          )}

          {page === 'Orders' && (
            <>
              <div className={s.tabs}>
                {(['All', 'New', 'Accepted', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'] as const).map((t) => (
                  <button key={t} type="button" aria-current={orderTab === t ? 'page' : undefined} onClick={() => setOrderTab(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className={s.list}>{orders.filter((o) => orderTab === 'All' || o.status === orderTab).map(OrderCard)}</div>
            </>
          )}

          {page === 'Products' && (
            <section className={s.card}>
              <h3>Your listings</h3>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price ₹</th>
                    <th>MRP ₹</th>
                    <th>Stock</th>
                    <th>On sale</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.name}</b>
                        <span className={s.meta}> · {p.generic}</span> {p.rx && <i className={`${s.chip} ${s.amber}`}>Rx</i>}
                      </td>
                      <td>
                        <input className={s.cell} value={prices[p.id]} onChange={(e) => setPrices((x) => ({ ...x, [p.id]: e.target.value }))} aria-label={`${p.name} price`} />
                      </td>
                      <td>{p.mrp.toFixed(2)}</td>
                      <td>
                        <input className={s.cell} type="number" value={stock[p.id]} onChange={(e) => setStock((x) => ({ ...x, [p.id]: Number(e.target.value) }))} aria-label={`${p.name} stock`} />
                      </td>
                      <td>
                        <input type="checkbox" checked={onSale[p.id]} onChange={(e) => setOnSale((x) => ({ ...x, [p.id]: e.target.checked }))} aria-label={`${p.name} on sale`} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={s.outline}
                          onClick={() => setToast(`Saved ${p.name}.`)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          <p className={s.foot}>© 2026 NearMed</p>
        </div>
      </div>

      {zoom && (
        <button type="button" className={s.zoom} onClick={() => setZoom(false)} aria-label="Close the photo">
          <RxPhoto />
        </button>
      )}
      {toast && (
        <p className={s.toast} role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
