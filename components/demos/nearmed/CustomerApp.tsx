'use client';

// NearMed customer app, recreated on sample data. Screens, copy and colours follow nearmed_mobile
// (Expo Router): Home, Search, Orders, Profile, Upload, Request (the 90-second price queue), Product, Cart, Order.

import { useEffect, useState } from 'react';
import { Icon, inr, OFFERS, offerTotal, ORDER_STEPS, PRODUCTS, RxPhoto, STORE, type OrderStatus, type Product } from './data';
import s from './customer.module.css';

const WINDOW = 90; // seconds to say yes to a price
const ARRIVALS = [4, 10, 17]; // seconds after sending when each store's price lands

type Tab = 'home' | 'search' | 'orders' | 'profile';
type Screen = { name: 'tabs' } | { name: 'upload' } | { name: 'request' } | { name: 'product'; id: string } | { name: 'cart' } | { name: 'order'; id: number } | { name: 'need'; key: string };

type Request = {
  sentAt: number;
  phase: 'waiting' | 'showing' | 'accepted' | 'closed';
  /** Index of the price on screen (or next to show) */
  idx: number;
  openedAt: number | null;
  closedWhy?: string;
  orderId?: number;
};

type Order = { id: number; at: number; status: OrderStatus; items: [string, number, number][]; from: 'Shop' | 'Your prescription'; store: string; auto?: boolean };

const NEEDS = [
  { key: 'fever', label: 'Fever', icon: 'thermo' },
  { key: 'cold', label: 'Cold & cough', icon: 'cough' },
  { key: 'pain', label: 'Pain', icon: 'bolt' },
  { key: 'stomach', label: 'Stomach', icon: 'stomach' },
  { key: 'vitamins', label: 'Vitamins', icon: 'vitamin' },
  { key: 'pet', label: 'Pet care', icon: 'paw' },
] as const;

const HOUR = 3_600_000;
const seedOrders = (now: number): Order[] =>
  [
    [10, 'Accepted', [['Crocin Advance 500 mg', 1, 28]]],
    [9, 'Accepted', [['Dolo 650', 2, 31], ['Cetzine 10 mg', 2, 19]]],
    [8, 'Packed', [['Cetzine 10 mg', 1, 19]]],
    [7, 'Out for delivery', [['Crocin Advance 500 mg', 2, 28], ['Dolo 650', 2, 31]]],
    [6, 'Delivered', [['Dolo 650', 1, 31]]],
    [5, 'Delivered', [['Cetzine 10 mg', 2, 19], ['ORS Electral 21.8 g', 2, 21]]],
    [1, 'Cancelled', [['Crocin Advance 500 mg', 2, 28], ['Dolo 650', 2, 31]]],
  ].map(([id, status, items]) => ({ id: id as number, status: status as OrderStatus, items: items as Order['items'], at: now - (11 - (id as number)) * 30 * HOUR, from: 'Shop', store: STORE.name }));

const total = (o: Order) => o.items.reduce((t, [, q, p]) => t + q * p, 0);
const when = (t: number) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;

function chipFor(status: OrderStatus) {
  if (status === 'Delivered') return s.chipPlain;
  if (status === 'Cancelled') return s.chipError;
  return s.chipInfo;
}

export default function CustomerApp() {
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<Screen[]>([{ name: 'tabs' }]);
  const [photo, setPhoto] = useState(false);
  const [note, setNote] = useState('');
  const [req, setReq] = useState<Request | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => seedOrders(Date.now()));
  const [cart, setCart] = useState<Record<string, number>>({});
  const [attached, setAttached] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Pharmacy' | 'Pet care'>('All');
  const [rxOnly, setRxOnly] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'All' | 'In progress' | 'Delivered' | 'Cancelled'>('All');
  const [popup, setPopup] = useState<number | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);

  const screen = stack[stack.length - 1];
  const push = (sc: Screen) => setStack((st) => [...st, sc]);
  const pop = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const reset = (t?: Tab) => {
    setStack([{ name: 'tabs' }]);
    if (t) setTab(t);
  };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Stores send prices a few seconds apart
  const arrived = req ? ARRIVALS.filter((sec) => now - req.sentAt >= sec * 1000).length : 0;
  const onRequest = screen.name === 'request';

  // A price lands: pop the "store sent you a price" card unless it is already on screen
  const [seen, setSeen] = useState(0);
  useEffect(() => {
    if (!req || arrived <= seen) return;
    setSeen(arrived);
    if (req.phase === 'waiting' && !onRequest) setPopup(req.idx);
    if (req.phase === 'waiting' && onRequest) setReq({ ...req, phase: 'showing', openedAt: Date.now() });
  }, [arrived, seen, req, onRequest]);

  // The 90 seconds run out: move to the next price, or close the request
  const left = req?.phase === 'showing' && req.openedAt ? WINDOW - Math.floor((now - req.openedAt) / 1000) : WINDOW;
  useEffect(() => {
    if (req?.phase === 'showing' && left <= 0) skip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, req?.phase]);

  // The store moves new orders along, so tracking visibly advances
  useEffect(() => {
    const t = setInterval(() => {
      setOrders((list) =>
        list.map((o) => {
          if (!o.auto || o.status === 'Delivered' || o.status === 'Cancelled') return o;
          const i = ORDER_STEPS.indexOf(o.status as (typeof ORDER_STEPS)[number]);
          return { ...o, status: ORDER_STEPS[Math.min(i + 1, ORDER_STEPS.length - 1)] };
        }),
      );
    }, 6000);
    return () => clearInterval(t);
  }, []);

  function send() {
    setReq({ sentAt: Date.now(), phase: 'waiting', idx: 0, openedAt: null });
    setSeen(0);
    setPopup(null);
    setStack([{ name: 'tabs' }, { name: 'request' }]);
  }

  function openPrice() {
    setPopup(null);
    if (req && req.phase === 'waiting' && arrived > req.idx) setReq({ ...req, phase: 'showing', openedAt: Date.now() });
    if (!onRequest) push({ name: 'request' });
  }

  function skip() {
    if (!req) return;
    const next = req.idx + 1;
    if (next >= OFFERS.length) return setReq({ ...req, phase: 'closed', idx: next, openedAt: null, closedWhy: 'Time is up for this request.' });
    setReq({ ...req, idx: next, phase: arrived > next ? 'showing' : 'waiting', openedAt: arrived > next ? Date.now() : null });
  }

  function accept() {
    if (!req) return;
    const o = OFFERS[req.idx];
    const id = Math.max(...orders.map((x) => x.id)) + 1;
    setOrders((list) => [
      { id, at: Date.now(), status: 'Placed', auto: true, from: 'Your prescription', store: o.store, items: o.lines.map(([label, p]) => { const [q, ...n] = label.split(' × '); return [n.join(' × '), Number(q), p / Number(q)]; }) },
      ...list,
    ]);
    setReq({ ...req, phase: 'accepted', orderId: id });
  }

  function placeOrder() {
    const id = Math.max(...orders.map((x) => x.id)) + 1;
    const items = Object.entries(cart).map(([pid, q]) => {
      const p = PRODUCTS.find((x) => x.id === pid)!;
      return [p.name, q, p.price] as [string, number, number];
    });
    setOrders((list) => [{ id, at: Date.now(), status: 'Placed', auto: true, from: 'Shop', store: STORE.name, items }, ...list]);
    setCart({});
    setAttached(false);
    setStack([{ name: 'tabs' }, { name: 'order', id }]);
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((t, [id, q]) => t + q * PRODUCTS.find((p) => p.id === id)!.price, 0);
  const add = (id: string, by = 1) =>
    setCart((c) => {
      const q = Math.max(0, (c[id] ?? 0) + by);
      const next = { ...c, [id]: q };
      if (!q) delete next[id];
      return next;
    });

  // ---------- shared bits ----------
  const header = (title: string) => (
    <header className={s.header}>
      <button type="button" className={s.back} aria-label="Back" onClick={pop}>
        <Icon name="back" />
      </button>
      <h2>{title}</h2>
    </header>
  );

  const productCard = (p: Product) => (
    <button key={p.id} type="button" className={s.pcard} onClick={() => push({ name: 'product', id: p.id })}>
      <span className={s.pimg}>
        <Icon name={p.pet ? 'paw' : 'pill'} size={34} />
        {p.rx && <i className={`${s.chip} ${s.chipWarn}`}>Needs prescription</i>}
      </span>
      <span className={s.pgen}>{p.generic}</span>
      <b>{p.name}</b>
      <span className={s.pprice}>from {inr(p.price)}</span>
      <span className={s.pstores}>1 store</span>
    </button>
  );

  const requestChip = () => {
    if (!req) return null;
    if (req.phase === 'accepted') return <i className={`${s.chip} ${s.chipInfo}`}>Ordered</i>;
    if (req.phase === 'closed') return <i className={`${s.chip} ${req.closedWhy?.startsWith('You') ? s.chipError : s.chipPlain}`}>{req.closedWhy?.startsWith('You') ? 'Stopped' : 'Time is up'}</i>;
    const ready = arrived - req.idx;
    return ready > 0 ? <i className={`${s.chip} ${s.chipStock}`}>{ready > 1 ? `${ready} prices ready` : 'Price ready'}</i> : <i className={`${s.chip} ${s.chipWarn}`}>Waiting for prices</i>;
  };

  // ---------- screens (plain functions, not components, so the 4-per-second clock tick never remounts them) ----------
  function Home() {
    const waiting = req && (req.phase === 'waiting' || req.phase === 'showing') && arrived > req.idx;
    const popular = [PRODUCTS[1], PRODUCTS[5], PRODUCTS[6], PRODUCTS[7]];
    const reasons = ['Thursday pick', 'Morning pick', 'Popular now', 'Popular now'];
    return (
      <div className={s.scroll}>
        <div className={s.hero}>
          <div className={s.heroTop}>
            <div>
              <span className={s.heroLabel}>Deliver to</span>
              <b className={s.heroAddr}>
                Flat 4, 21 Lake Road <Icon name="chevron" size={16} />
              </b>
            </div>
            <button type="button" className={s.initial} onClick={() => setTab('profile')} aria-label="Profile">
              D
            </button>
          </div>
          <button type="button" className={s.heroSearch} onClick={() => setTab('search')}>
            <Icon name="search" size={20} /> Medicine name, e.g. Dolo
          </button>
        </div>

        {waiting && (
          <button type="button" className={s.strip} onClick={openPrice}>
            <Icon name="timer" size={20} />
            <span>
              <b>{OFFERS[req!.idx].store} sent you a price</b>
              <em>{req!.phase === 'showing' ? `${clock(left)} left` : 'See it'}</em>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        )}

        <div className={s.pad}>
          <div className={s.duo}>
            <button type="button" className={s.tilePrimary} onClick={() => { setPhoto(false); setNote(''); push({ name: 'upload' }); }}>
              <Icon name="camera" size={26} />
              <b>Send a prescription</b>
              <span>Stores send you prices</span>
            </button>
            <button type="button" className={s.tile} onClick={() => setTab('orders')}>
              <Icon name="refresh" size={26} />
              <b>Buy again</b>
              <span>6 things you bought</span>
            </button>
          </div>

          <h3 className={s.h3}>What do you need?</h3>
          <div className={s.needs}>
            {NEEDS.map((n) => (
              <button key={n.key} type="button" onClick={() => push({ name: 'need', key: n.key })}>
                <span>
                  <Icon name={n.icon} size={24} />
                </span>
                {n.label}
              </button>
            ))}
          </div>

          <div className={s.rowHead}>
            <h3 className={s.h3}>Popular today</h3>
            <button type="button" onClick={() => setTab('search')}>
              See all
            </button>
          </div>
          <div className={s.grid}>
            {popular.map((p, i) => (
              <div key={p.id} className={s.withReason}>
                <i className={`${s.chip} ${s.chipInfo}`}>{reasons[i]}</i>
                {productCard(p)}
              </div>
            ))}
          </div>

          <div className={s.rowHead}>
            <h3 className={s.h3}>Your requests</h3>
          </div>
          {req ? (
            <button type="button" className={s.reqCard} onClick={() => push({ name: 'request' })}>
              {requestChip()}
              <b>Prescription · 3 medicines</b>
              <span>Sent {when(req.sentAt)}</span>
            </button>
          ) : (
            <p className={s.empty}>Take a photo of a prescription and nearby stores will send you prices.</p>
          )}
          <div className={s.tabSpace} />
        </div>
      </div>
    );
  }

  function Search() {
    const list = PRODUCTS.filter(
      (p) =>
        (filter === 'All' || (filter === 'Pet care') === !!p.pet) &&
        (!rxOnly || p.rx) &&
        `${p.name} ${p.generic}`.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return (
      <div className={s.scroll}>
        <div className={s.pad}>
          <h1 className={s.title}>Search</h1>
          <label className={s.searchBox}>
            <Icon name="search" size={20} />
            <input value={query} placeholder="Medicine name, e.g. Dolo" onChange={(e) => setQuery(e.target.value)} aria-label="Search medicines" />
          </label>
          <div className={s.chips}>
            {(['All', 'Pharmacy', 'Pet care'] as const).map((f) => (
              <button key={f} type="button" className={`${s.chip} ${filter === f ? s.chipSel : s.chipPlain}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
            <button type="button" className={`${s.chip} ${rxOnly ? s.chipSel : s.chipPlain}`} onClick={() => setRxOnly((v) => !v)}>
              Needs prescription
            </button>
          </div>
          {list.length ? <div className={s.grid}>{list.map(productCard)}</div> : <p className={s.empty}>No products match “{query}”.</p>}
          <div className={s.tabSpace} />
        </div>
      </div>
    );
  }

  function Orders() {
    const list = orders.filter((o) =>
      orderFilter === 'All' ? true : orderFilter === 'Delivered' ? o.status === 'Delivered' : orderFilter === 'Cancelled' ? o.status === 'Cancelled' : o.status !== 'Delivered' && o.status !== 'Cancelled',
    );
    return (
      <div className={s.scroll}>
        <div className={s.pad}>
          <h1 className={s.title}>My orders</h1>
          <div className={s.chips}>
            {(['All', 'In progress', 'Delivered', 'Cancelled'] as const).map((f) => (
              <button key={f} type="button" className={`${s.chip} ${orderFilter === f ? s.chipSel : s.chipPlain}`} onClick={() => setOrderFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <div className={s.stackList}>
            {list.map((o) => (
              <button key={o.id} type="button" className={s.orderCard} onClick={() => push({ name: 'order', id: o.id })}>
                <span className={s.storeTile}>
                  <Icon name="store" size={22} />
                </span>
                <span className={s.orderMid}>
                  <b>{o.store}</b>
                  <span>
                    Order #{o.id}, {when(o.at)}
                  </span>
                  <span className={s.orderMeta}>
                    <i className={`${s.chip} ${chipFor(o.status)}`}>{o.status}</i> {o.items.reduce((n, [, q]) => n + q, 0)} items
                  </span>
                </span>
                <b className={s.price}>{inr(total(o))}</b>
              </button>
            ))}
          </div>
          <div className={s.tabSpace} />
        </div>
      </div>
    );
  }

  function Profile() {
    return (
      <div className={s.scroll}>
        <div className={s.pad}>
          <h1 className={s.title}>Profile</h1>
          <div className={s.profile}>
            <span className={s.bigInitial}>D</span>
            <b>Demo Customer</b>
            <span>customer@example.com</span>
            <span>98000 00009</span>
          </div>
          <div className={s.card}>
            <button type="button" className={s.prow} onClick={() => setTab('orders')}>
              <Icon name="orders" />
              <span>
                <b>My orders</b>
                <em>What you bought and where it is</em>
              </span>
              <Icon name="chevron" size={18} />
            </button>
            <button type="button" className={s.prow} onClick={() => req && push({ name: 'request' })}>
              <Icon name="doc" />
              <span>
                <b>My prescriptions</b>
                <em>Prescriptions you sent and the prices</em>
              </span>
              <Icon name="chevron" size={18} />
            </button>
            <button type="button" className={`${s.prow} ${s.prowDanger}`}>
              <Icon name="logout" />
              <span>
                <b>Log out</b>
                <em>Leave your account on this phone</em>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function Upload() {
    return (
      <div className={s.page}>
        {header('Upload prescription')}
        <div className={s.scroll}>
          <div className={s.pad}>
            <p className={s.tip}>
              <Icon name="bulb" size={20} />
              Take a clear photo of the whole prescription, in good light. Nearby stores will see it and send you prices.
            </p>
            {photo ? (
              <div className={s.photo}>
                <RxPhoto />
              </div>
            ) : (
              <div className={s.drop}>
                <Icon name="doc" size={34} />
                No photo yet
              </div>
            )}
            <button type="button" className={photo ? s.btnOutline : s.btn} onClick={() => setPhoto(true)}>
              <Icon name="camera" size={20} /> {photo ? 'Take a new photo' : 'Take photo'}
            </button>
            <button type="button" className={s.btnOutline} onClick={() => setPhoto(true)}>
              <Icon name="gallery" size={20} /> Choose from gallery
            </button>
            <label className={s.label}>
              Note for the store (optional)
              <textarea rows={3} placeholder="e.g. Need 10 days' supply" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
        </div>
        <div className={s.pinned}>
          <button type="button" className={s.btn} disabled={!photo} onClick={send}>
            Send to stores <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    );
  }

  function RequestScreen() {
    if (!req) return null;
    const R = 108;
    const C = 2 * Math.PI * R;
    const offer = OFFERS[Math.min(req.idx, OFFERS.length - 1)];
    const deadline = new Date(req.sentAt + 30 * 60_000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

    if (req.phase === 'accepted') {
      return (
        <div className={s.page}>
          {header('Your request')}
          <div className={`${s.scroll} ${s.center}`}>
            <span className={s.doneOrb}>
              <Icon name="check" size={44} />
            </span>
            <h2 className={s.bigTitle}>Ordered!</h2>
            <p className={s.sub}>Order #{req.orderId} is with the store. They’ll get it ready.</p>
            <div className={`${s.card} ${s.storeCard}`}>
              <b>{offer.store}</b>
              <span>{offer.km} km away · {STORE.address}</span>
              <span className={s.call}>
                <Icon name="phone" size={16} /> Call {STORE.phone}
              </span>
            </div>
            <button type="button" className={s.btn} onClick={() => setStack([{ name: 'tabs' }, { name: 'order', id: req.orderId! }])}>
              See my orders
            </button>
          </div>
        </div>
      );
    }
    if (req.phase === 'closed') {
      return (
        <div className={s.page}>
          {header('Your request')}
          <div className={`${s.scroll} ${s.center}`}>
            <span className={s.closedOrb}>
              <Icon name="hourglass" size={40} />
            </span>
            <h2 className={s.bigTitle}>{req.closedWhy}</h2>
            <p className={s.sub}>Stores can’t send prices for it any more. Send the prescription again to get new prices.</p>
            <button type="button" className={s.btn} onClick={send}>
              Send it again
            </button>
          </div>
        </div>
      );
    }

    const showing = req.phase === 'showing';
    const frac = showing ? Math.max(0, left) / WINDOW : 0;
    const urgent = showing && left < 20;
    return (
      <div className={s.page}>
        {header('Your request')}
        <div className={s.scroll}>
          <div className={`${s.pad} ${s.center}`}>
            <div className={s.ring}>
              <svg viewBox="0 0 248 248" width="232" height="232" aria-hidden="true">
                <circle cx="124" cy="124" r={R} fill="none" stroke="#ece7f9" strokeWidth="14" />
                {showing && (
                  <circle cx="124" cy="124" r={R} fill="none" stroke={urgent ? '#c2410c' : '#0e7a53'} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 124 124)" style={{ transition: 'stroke-dashoffset .25s linear' }} />
                )}
              </svg>
              <div className={s.ringIn}>
                {showing ? (
                  <>
                    <span className={s.ringStore}>{offer.store}</span>
                    <b className={s.ringPrice}>{inr(offerTotal(offer))}</b>
                    <span className={urgent ? s.ringUrgent : s.ringTime}>{clock(left)} to decide</span>
                  </>
                ) : (
                  <>
                    <Icon name="store" size={30} />
                    <b className={s.ringPrice}>3</b>
                    <span className={s.ringStore}>stores have your prescription</span>
                  </>
                )}
              </div>
            </div>

            {showing ? (
              <>
                <p className={s.eta}>Delivers in about {offer.eta} min · {offer.km} km away</p>
                <div className={`${s.card} ${s.lines}`}>
                  {offer.lines.map(([l, p]) => (
                    <p key={l}>
                      <span>{l}</span>
                      <b>{inr(p)}</b>
                    </p>
                  ))}
                  <hr />
                  <p className={s.totalRow}>
                    <span>Total</span>
                    <b>{inr(offerTotal(offer))}</b>
                  </p>
                  {offer.note && <p className={s.storeNote}>Store note: {offer.note}</p>}
                </div>
                <button type="button" className={s.btn} onClick={accept}>
                  <Icon name="check" size={20} /> Yes, order this
                </button>
                <button type="button" className={s.btnOutline} onClick={skip}>
                  No, show the next price
                </button>
                <p className={s.caption}>{arrived - req.idx - 1 > 0 ? `${arrived - req.idx - 1} more price${arrived - req.idx - 1 > 1 ? 's' : ''} waiting after this one.` : 'No other prices yet.'}</p>
              </>
            ) : (
              <>
                <h2 className={s.midTitle}>Waiting for prices</h2>
                <p className={s.sub}>When a store sends a price, it shows up here. You can keep using the app: we’ll tell you. Stores can answer until {deadline}.</p>
              </>
            )}
            <button type="button" className={s.btnGhost} onClick={() => setConfirmStop(true)}>
              Stop this request
            </button>
          </div>
        </div>
        {confirmStop && (
          <div className={s.alertWrap}>
            <div className={s.alert} role="alertdialog" aria-label="Stop this request?">
              <b>Stop this request?</b>
              <p>Stores will stop sending you prices for it.</p>
              <div>
                <button type="button" onClick={() => setConfirmStop(false)}>
                  Keep it
                </button>
                <button type="button" className={s.alertDanger} onClick={() => { setConfirmStop(false); setReq({ ...req, phase: 'closed', closedWhy: 'You stopped this request.' }); }}>
                  Stop request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ProductScreen(id: string) {
    const p = PRODUCTS.find((x) => x.id === id)!;
    return (
      <div className={s.page}>
        {header('Details')}
        <div className={s.scroll}>
          <div className={s.pad}>
            <div className={s.bigImg}>
              <Icon name={p.pet ? 'paw' : 'pill'} size={64} />
            </div>
            <i className={`${s.chip} ${s.chipPlain}`}>{p.pet ? 'Pet care' : 'Pharmacy'}</i>
            <p className={s.pgen}>{p.generic}</p>
            <h2 className={s.ptitle}>{p.name}</h2>
            <p className={s.pfrom}>from {inr(p.price)}</p>
            <div className={s.chips}>
              <i className={`${s.chip} ${s.chipStock}`}>In stock</i>
              {p.rx && <i className={`${s.chip} ${s.chipWarn}`}>You need a prescription to buy this</i>}
            </div>
            <h3 className={s.h3}>Available at 1 store</h3>
            <div className={`${s.card} ${s.offer}`}>
              <div>
                <b>{STORE.name}</b>
                <span>{STORE.address} · 0.8 km</span>
                <span>
                  <b className={s.price}>{inr(p.price)}</b> <s>{inr(p.mrp)}</s>
                </span>
                <span className={s.stockTxt}>{p.stock} in stock</span>
              </div>
              {cart[p.id] ? (
                <span className={s.stepper}>
                  <button type="button" aria-label="One less" onClick={() => add(p.id, -1)}>
                    <Icon name="minus" size={16} />
                  </button>
                  {cart[p.id]}
                  <button type="button" aria-label="One more" disabled={cart[p.id] >= p.stock} onClick={() => add(p.id)}>
                    <Icon name="plus" size={16} />
                  </button>
                </span>
              ) : (
                <button type="button" className={s.pill} onClick={() => add(p.id)}>
                  Add to cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function NeedScreen(k: string) {
    const n = NEEDS.find((x) => x.key === k)!;
    return (
      <div className={s.page}>
        {header(n.label)}
        <div className={s.scroll}>
          <div className={s.pad}>
            <div className={s.grid}>{PRODUCTS.filter((p) => p.need.includes(k)).map(productCard)}</div>
          </div>
        </div>
      </div>
    );
  }

  function Cart() {
    const ids = Object.keys(cart);
    const needsRx = ids.some((id) => PRODUCTS.find((p) => p.id === id)!.rx);
    const blocked = needsRx && !attached;
    if (!ids.length)
      return (
        <div className={s.page}>
          {header('Your cart')}
          <div className={`${s.scroll} ${s.center}`}>
            <Icon name="cart" size={44} />
            <p className={s.sub}>Your cart is empty.</p>
            <button type="button" className={s.btn} onClick={() => reset('search')}>
              Go shopping
            </button>
          </div>
        </div>
      );
    return (
      <div className={s.page}>
        {header('Your cart')}
        <div className={s.scroll}>
          <div className={s.pad}>
            <p className={s.caption}>From {STORE.name}</p>
            <div className={s.card}>
              {ids.map((id) => {
                const p = PRODUCTS.find((x) => x.id === id)!;
                return (
                  <div key={id} className={s.cartRow}>
                    <span>
                      <b>{p.name}</b>
                      <em>{inr(p.price)}</em>
                      {p.rx && <i className={`${s.chip} ${s.chipWarn}`}>Prescription needed</i>}
                    </span>
                    <span className={s.stepper}>
                      <button type="button" aria-label="One less" onClick={() => add(id, -1)}>
                        <Icon name="minus" size={16} />
                      </button>
                      {cart[id]}
                      <button type="button" aria-label="One more" disabled={cart[id] >= p.stock} onClick={() => add(id)}>
                        <Icon name="plus" size={16} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={`${s.card} ${s.deliver}`}>
              <Icon name="pin" />
              <span>
                <em>Deliver to</em>
                <b>Flat 4, 21 Lake Road</b>
              </span>
            </div>
            {needsRx && (
              <div className={`${s.card} ${s.attach}`}>
                <b>A medicine here needs a prescription</b>
                {req ? (
                  <button type="button" className={attached ? s.btn : s.btnOutline} onClick={() => setAttached((a) => !a)}>
                    {attached ? <><Icon name="check" size={18} /> Prescription attached</> : 'Attach a prescription'}
                  </button>
                ) : (
                  <button type="button" className={s.btnOutline} onClick={() => { setPhoto(false); push({ name: 'upload' }); }}>
                    Upload a prescription
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={s.pinned}>
          <p className={s.totalRow}>
            <span>Total</span>
            <b>{inr(cartTotal)}</b>
          </p>
          <button type="button" className={s.btn} disabled={blocked} onClick={placeOrder}>
            Place order
          </button>
          {blocked && <p className={s.caption}>Pick a prescription first.</p>}
        </div>
      </div>
    );
  }

  function OrderScreen(id: number) {
    const o = orders.find((x) => x.id === id)!;
    const step = ORDER_STEPS.indexOf(o.status as (typeof ORDER_STEPS)[number]);
    return (
      <div className={s.page}>
        {header('Order')}
        <div className={s.scroll}>
          <div className={s.pad}>
            {o.auto && o.status === 'Placed' && (
              <p className={s.placed}>
                <Icon name="check" size={18} /> <b>Order placed</b> {o.store} has your order.
              </p>
            )}
            <div className={s.orderTop}>
              <h2 className={s.ptitle}>Order #{o.id}</h2>
              <i className={`${s.chip} ${chipFor(o.status)}`}>{o.status}</i>
            </div>
            <p className={s.caption}>
              From: {o.from} · {o.store}
            </p>
            <div className={`${s.card} ${s.deliver}`}>
              <Icon name="pin" />
              <span>
                <em>Deliver to</em>
                <b>Flat 4, 21 Lake Road</b>
              </span>
            </div>
            <h3 className={s.h3}>Tracking</h3>
            {o.status === 'Cancelled' ? (
              <p className={s.sub}>This order was cancelled.</p>
            ) : (
              <ol className={s.track}>
                {ORDER_STEPS.map((st, i) => (
                  <li key={st} className={i < step || o.status === 'Delivered' ? s.done : i === step ? s.now : undefined}>
                    <span>{(i < step || o.status === 'Delivered') && <Icon name="check" size={13} />}</span>
                    {st}
                  </li>
                ))}
              </ol>
            )}
            <h3 className={s.h3}>Items</h3>
            <div className={`${s.card} ${s.lines}`}>
              {o.items.map(([n, q, p]) => (
                <p key={n}>
                  <span>
                    {n} <em>Qty {q}</em>
                  </span>
                  <b>{inr(q * p)}</b>
                </p>
              ))}
              <hr />
              <p className={s.totalRow}>
                <span>Total</span>
                <b>{inr(total(o))}</b>
              </p>
            </div>
            <button type="button" className={s.btnOutline} onClick={() => reset('home')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.app}>
      <div className={`${s.status} ${screen.name === 'tabs' && tab === 'home' ? s.statusLight : ''}`} aria-hidden="true">
        <span>9:41</span>
        <span>▂▄▆ ◔ ▮</span>
      </div>

      {screen.name === 'tabs' && (
        <>
          {tab === 'home' && Home()}
          {tab === 'search' && Search()}
          {tab === 'orders' && Orders()}
          {tab === 'profile' && Profile()}

          {cartCount > 0 && (tab === 'search' || tab === 'home') && (
            <button type="button" className={s.cartBar} onClick={() => push({ name: 'cart' })}>
              <span>
                <b>{inr(cartTotal)}</b>
                <em>
                  {cartCount} item{cartCount > 1 ? 's' : ''}
                </em>
              </span>
              View cart <Icon name="cart" size={18} />
            </button>
          )}

          <nav className={s.tabbar} aria-label="App tabs">
            <svg className={s.tabShape} viewBox="0 0 360 74" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 10 H134 C146 10 148 40 180 40 C212 40 214 10 226 10 H360 V74 H0 Z" />
            </svg>
            {(['home', 'search'] as const).map((t) => (
              <button key={t} type="button" aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
                <Icon name={t} size={24} />
                {t === 'home' ? 'Home' : 'Search'}
                <i />
              </button>
            ))}
            <span className={s.notchSlot}>
              <button type="button" className={s.notchBtn} aria-label="Upload prescription" onClick={() => { setPhoto(false); setNote(''); push({ name: 'upload' }); }}>
                <Icon name="camera" size={26} />
              </button>
            </span>
            {(['orders', 'profile'] as const).map((t) => (
              <button key={t} type="button" aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
                <Icon name={t === 'orders' ? 'orders' : 'user'} size={24} />
                {t === 'orders' ? 'Orders' : 'Profile'}
                <i />
              </button>
            ))}
          </nav>
        </>
      )}
      {screen.name === 'upload' && Upload()}
      {screen.name === 'request' && RequestScreen()}
      {screen.name === 'product' && ProductScreen(screen.id)}
      {screen.name === 'need' && NeedScreen(screen.key)}
      {screen.name === 'cart' && Cart()}
      {screen.name === 'order' && OrderScreen(screen.id)}

      {popup !== null && req && (
        <div className={s.popup} role="dialog" aria-label="A store sent you a price">
          <div className={s.popTop}>
            <span className={s.storeTile}>
              <Icon name="store" size={22} />
            </span>
            <span>
              <b>{OFFERS[popup].store} sent you a price</b>
              <span>
                <b>{inr(offerTotal(OFFERS[popup]))}</b> · delivers in about {OFFERS[popup].eta} min
              </span>
            </span>
          </div>
          <p className={s.popTime}>When you open it, you get 90 seconds to say yes.</p>
          <div className={s.popBtns}>
            <button type="button" className={s.btnOutline} onClick={() => setPopup(null)}>
              Later
            </button>
            <button type="button" className={s.btn} onClick={openPrice}>
              See price
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
