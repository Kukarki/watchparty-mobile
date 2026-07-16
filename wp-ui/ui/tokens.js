// WatchParty design system — one accent (Beam violet), one dark ink surface.
// Netflix/YouTube/etc brand colors are allowed ONLY on platform tiles.
export const c = {
  ink:      '#0B0D14',   // page
  surface:  '#141826',   // card
  surface2: '#1B2133',   // raised / pressed
  border:   '#232A3F',
  borderHi: '#3A4460',

  beam:     '#8B7CFF',   // THE accent — primary actions, active states
  beamHot:  '#B7A8FF',
  beamDim:  'rgba(139,124,255,0.14)',

  text:     '#EEF1FA',
  text2:    '#A8B0C6',   // secondary
  text3:    '#6F789440'.slice(0, 7), // muted
  dim:      '#6F7894',

  ok:       '#3DDC84',
  warn:     '#FFB454',
  danger:   '#FF4D6D',
  live:     '#FF4D6D',
};

export const r = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
export const sp = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };

export const t = {
  h1:    { fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.4 },
  h2:    { fontSize: 19, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
  h3:    { fontSize: 15, fontWeight: '600', color: c.text },
  body:  { fontSize: 14, color: c.text },
  sub:   { fontSize: 13, color: c.text2 },
  cap:   { fontSize: 11, color: c.dim },
  label: { fontSize: 11, fontWeight: '700', color: c.dim, letterSpacing: 1.1 },
  num:   { fontSize: 20, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
};

// Only place brand colors are allowed.
export const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0033' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'prime',   name: 'Prime',   color: '#00A8E1' },
  { id: 'disney',  name: 'Disney+', color: '#1F80E0' },
  { id: 'hbo',     name: 'Max',     color: '#7B2BF9' },
];
