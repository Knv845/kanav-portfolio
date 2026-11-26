// Stand-ins for the Material Symbols the Saarag portals use, drawn inline so the demo loads no icon font.

const P: Record<string, React.ReactNode> = {
  thumb_up: <path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H19a1.5 1.5 0 0 1 1.5 1.8l-1.4 6.6A2 2 0 0 1 17.2 20H7" />,
  thumb_down: <path d="M17 13V4h3v9zM17 13l-4 7c-1.5 0-2.5-1-2.2-2.6l.6-3.4H5a1.5 1.5 0 0 1-1.5-1.8l1.4-6.6A2 2 0 0 1 6.8 4H17" />,
  content_copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 7 8.5-7" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></>,
  add: <path d="M12 5v14M5 12h14" />,
  folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />,
  database: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" /><path d="M3.5 4v4.5H8M12 8v4l3 2" /></>,
  verified_user: <><path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  description: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  auto_awesome: <path d="M10 4l1.8 4.7L16.5 10.5l-4.7 1.8L10 17l-1.8-4.7L3.5 10.5l4.7-1.8zM18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />,
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  arrow_upward: <path d="M12 19V5M6 11l6-6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  space_dashboard: <><rect x="4" y="4" width="7" height="16" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  deployed_code: <><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>,
  shield_person: <><path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" /><circle cx="12" cy="10" r="2.2" /><path d="M8.5 16c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4" /></>,
  group: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5M16 5a3 3 0 0 1 0 6M17.5 14c1.8.6 3 2.2 3.5 5" /></>,
  manage_search: <><path d="M3 6h7M3 12h5M3 18h7" /><circle cx="15.5" cy="12" r="4" /><path d="m18.5 15 3 3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.2 6.2l2.1 2.1M17.7 15.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 17.8l2.1-2.1M17.7 8.3l2.1-2.1" /></>,
  monitoring: <path d="M4 20V10M9 20V4M14 20v-7M19 20V8M3 20h18" />,
  fact_check: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h4M7 13h4M7 17h4M14 12l1.5 1.5L18 11" /></>,
  upload: <path d="M12 16V5M7 10l5-5 5 5M5 20h14" />,
  business: <><path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 10h5a1 1 0 0 1 1 1v10M3 21h18" /><path d="M7.5 8h3M7.5 12h3M7.5 16h3" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  expand_more: <path d="m6 9 6 6 6-6" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  warning: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  badge: <><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M9 6V4h6v2" /><circle cx="12" cy="12" r="2.2" /><path d="M8.5 17c.8-1.4 2-2 3.5-2s2.7.6 3.5 2" /></>,
  laptop: <><rect x="5" y="5" width="14" height="10" rx="1.5" /><path d="M3 19h18" /></>,
  factory: <path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17zM7 17h2M12 17h2M17 17h2" />,
  dark_mode: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5" />,
  notifications: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" /></>,
  override: <path d="M5 12.5 9.5 17 19 7.5M4 20h16" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  edit_note: <path d="M4 7h10M4 11h7M4 15h5M14.5 19.5l-3 .7.7-3 6.3-6.3a1.6 1.6 0 0 1 2.3 2.3z" />,
  folder_open: <path d="M3 18V6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h7.5A1.5 1.5 0 0 1 20 8.5V10M3 18l2.6-7.2A1.5 1.5 0 0 1 7 9.8h14l-2.7 7.5A1.5 1.5 0 0 1 16.9 18.3H3z" />,
  light_mode: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  logout: <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h10" />,
  visibility: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  visibility_off: <><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  north_east: <path d="M7 17 17 7M9 7h8v8" />,
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  insights: <path d="M3 17l5-6 4 3 6-8M18 6h3v3" />,
  mail_outline: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 7 8.5-7" /></>,
};

export function Sym({ n, fill, size = 18 }: { n: string; fill?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      {P[n] ?? P.info}
    </svg>
  );
}
