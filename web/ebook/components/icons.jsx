/* =========================================================
   线性图标 · 1.5 stroke · 24x24
   ========================================================= */
const Icon = ({ d, size = 20, stroke = 1.5, fill = 'none', children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Menu:     (p) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h10"/></Icon>,
  Close:    (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18"/>,
  Back:     (p) => <Icon {...p} d="M15 6l-6 6 6 6"/>,
  Chevron:  (p) => <Icon {...p} d="M9 6l6 6-6 6"/>,
  Search:   (p) => <Icon {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/></Icon>,
  Book:     (p) => <Icon {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M19 17H6a2 2 0 0 0-2 2"/></Icon>,
  Bookmark: (p) => <Icon {...p} d="M7 4h10v17l-5-3-5 3V4z"/>,
  Note:     (p) => <Icon {...p}><path d="M5 4h11l4 4v12H5z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 16h6"/></Icon>,
  Aa:       (p) => (
    <svg width={p?.size||20} height={p?.size||20} viewBox="0 0 24 24" fill="none">
      <text x="3" y="17" fontFamily="Georgia, serif" fontSize="14" fontWeight="600" fill="currentColor">A</text>
      <text x="12" y="17" fontFamily="Georgia, serif" fontSize="11" fontWeight="600" fill="currentColor">a</text>
    </svg>
  ),
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,

  Play:     (p) => <Icon {...p} stroke={1.4} fill="currentColor"><path d="M7 5v14l12-7z" stroke="none"/></Icon>,
  Pause:    (p) => <Icon {...p} stroke={1.4} fill="currentColor"><rect x="7" y="5" width="3.5" height="14" rx="1" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" stroke="none"/></Icon>,
  Prev:     (p) => <Icon {...p}><path d="M19 5L9 12l10 7zM6 5v14"/></Icon>,
  Next:     (p) => <Icon {...p}><path d="M5 5l10 7-10 7zM18 5v14"/></Icon>,
  Back15:   (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><text x="7.5" y="15" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">15</text></Icon>,
  Fwd15:    (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/><text x="7.5" y="15" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">15</text></Icon>,
  Headphone:(p) => <Icon {...p}><path d="M4 14v-2a8 8 0 1 1 16 0v2"/><rect x="3" y="13" width="5" height="7" rx="1.5"/><rect x="16" y="13" width="5" height="7" rx="1.5"/></Icon>,
  Speed:    (p) => <Icon {...p}><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 12l5-3"/></Icon>,
  Mic:      (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  Wave:     (p) => <Icon {...p}><path d="M3 12c2-6 4 6 6 0s4 6 6 0 4 6 6 0"/></Icon>,
  Expand:   (p) => <Icon {...p}><path d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7"/></Icon>,
  Collapse: (p) => <Icon {...p}><path d="M9 4v5H4M15 20v-5h5M4 9l6-6M20 15l-6 6"/></Icon>,
  Sun:      (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></Icon>,
  Moon:     (p) => <Icon {...p} d="M21 14A9 9 0 1 1 10 3a7 7 0 0 0 11 11z"/>,
  Paper:    (p) => <Icon {...p}><path d="M5 4h11l3 3v13H5z"/><path d="M16 4v3h3"/></Icon>,
  Dot:      (p) => <Icon {...p} fill="currentColor" stroke="none"><circle cx="12" cy="12" r="3"/></Icon>,
  Plus:     (p) => <Icon {...p} d="M12 5v14M5 12h14"/>,
  Minus:    (p) => <Icon {...p} d="M5 12h14"/>,
  Check:    (p) => <Icon {...p} d="M5 12l5 5L20 7"/>,
};

window.Icons = Icons;
