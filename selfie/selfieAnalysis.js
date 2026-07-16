// Pure analysis logic — no React, no camera. Unit-testable.
//
// Turns a decoded selfie (RGBA pixels) + optional face geometry into avatar
// recipe fields. Everything here picks from the EXISTING catalog options, so
// the result always renders correctly — no new art needed.
//
// PRIVACY: this runs on-device. The photo is never uploaded and never stored;
// only the resulting recipe values (e.g. skin: 's06') leave this module.

// ---- palettes (mirror avatar-core/constants.js) -------------------------
const SKIN_TONES = [
  { id: 's01', hex: '#F6E3D5' }, { id: 's02', hex: '#F2D3BC' },
  { id: 's03', hex: '#EAC1A3' }, { id: 's04', hex: '#E0B08D' },
  { id: 's05', hex: '#D49E77' }, { id: 's06', hex: '#C68863' },
  { id: 's07', hex: '#B57450' }, { id: 's08', hex: '#A26240' },
  { id: 's09', hex: '#8E5233' }, { id: 's10', hex: '#7A4429' },
  { id: 's11', hex: '#663821' }, { id: 's12', hex: '#532C1A' },
  { id: 's13', hex: '#402114' }, { id: 's14', hex: '#2E170E' },
];
const HAIR_COLORS = [
  { id: 'c_ink', hex: '#1B1B22' }, { id: 'c_espresso', hex: '#3B2A20' },
  { id: 'c_chestnut', hex: '#5C4030' }, { id: 'c_caramel', hex: '#8A5A33' },
  { id: 'c_sand', hex: '#C29155' }, { id: 'c_blonde', hex: '#E3C27C' },
  { id: 'c_platinum', hex: '#EFE7D4' }, { id: 'c_silver', hex: '#B9C0CC' },
  { id: 'c_crimson', hex: '#B4362F' }, { id: 'c_rose', hex: '#E6799B' },
  { id: 'c_violet', hex: '#8B7CFF' }, { id: 'c_blue', hex: '#3D7BF5' },
  { id: 'c_cyan', hex: '#35E0D0' }, { id: 'c_mint', hex: '#5FD8A2' },
  { id: 'c_amber', hex: '#FFB454' }, { id: 'c_white', hex: '#F4F6FA' },
];
const EYE_COLORS = [
  { id: 'c_umber', hex: '#4A2E1D' }, { id: 'c_hazel', hex: '#7A5A2E' },
  { id: 'c_forest', hex: '#3E6B45' }, { id: 'c_jade', hex: '#3FBF8F' },
  { id: 'c_ice', hex: '#8FD0F5' }, { id: 'c_sky', hex: '#3FA9F5' },
  { id: 'c_navy', hex: '#2C4A8A' }, { id: 'c_violet_e', hex: '#8B7CFF' },
  { id: 'c_magenta', hex: '#D25BAE' }, { id: 'c_ember', hex: '#E0642F' },
  { id: 'c_gold', hex: '#D9A93C' }, { id: 'c_onyx', hex: '#20242E' },
];

// ---- color math ---------------------------------------------------------
export const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

// sRGB -> CIELAB. Matching in Lab is far closer to human perception than RGB,
// which matters a lot for skin tones (RGB distance confuses tone with shadow).
export function rgbToLab({ r, g, b }) {
  let [R, G, B] = [r, g, b].map((v) => {
    v /= 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  [x, y, z] = [x, y, z].map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116));
  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

const labDist = (p, q) =>
  Math.sqrt((p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2);

/** Nearest palette entry to an {r,g,b}, compared in Lab space. */
export function nearest(palette, rgb, { weightL = 1 } = {}) {
  const target = rgbToLab(rgb);
  let best = palette[0], bestD = Infinity;
  for (const opt of palette) {
    const lab = rgbToLab(hexToRgb(opt.hex));
    const d = Math.sqrt(
      ((target.L - lab.L) * weightL) ** 2 + (target.a - lab.a) ** 2 + (target.b - lab.b) ** 2,
    );
    if (d < bestD) { bestD = d; best = opt; }
  }
  return { id: best.id, hex: best.hex, distance: bestD };
}

/**
 * Median color of a rectangular region of an RGBA buffer.
 * Median (not mean) so specular highlights, hair strands, and stray pixels
 * don't drag the result.
 */
export function regionColor(pixels, width, height, rect, { skipDark = 0 } = {}) {
  const x0 = Math.max(0, Math.round(rect.x));
  const y0 = Math.max(0, Math.round(rect.y));
  const x1 = Math.min(width, Math.round(rect.x + rect.width));
  const y1 = Math.min(height, Math.round(rect.y + rect.height));
  const rs = [], gs = [], bs = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
      if (a < 200) continue;
      if (skipDark && r + g + b < skipDark * 3) continue; // drop only dead-black pixels
      rs.push(r); gs.push(g); bs.push(b);
    }
  }
  if (!rs.length) return null;
  const med = (arr) => { arr.sort((m, n) => m - n); return arr[arr.length >> 1]; };
  return { r: med(rs), g: med(gs), b: med(bs), samples: rs.length };
}

/**
 * Skin tone: sample both cheeks, which are the most reliably lit, least
 * occluded skin on a selfie. Falls back to the mid-face if no landmarks.
 */
export function detectSkin(pixels, w, h, face) {
  const b = face.bounds;
  const patches = [];
  const size = b.width * 0.14;
  // left cheek, right cheek, forehead — under the eyes, beside the nose
  patches.push({ x: b.x + b.width * 0.18, y: b.y + b.height * 0.55, width: size, height: size });
  patches.push({ x: b.x + b.width * 0.68, y: b.y + b.height * 0.55, width: size, height: size });
  patches.push({ x: b.x + b.width * 0.42, y: b.y + b.height * 0.22, width: size, height: size * 0.7 });

  // NOTE: do NOT filter skin patches by absolute darkness. Deep skin tones
  // (s12-s14) are legitimately dark and an absolute threshold discards them
  // entirely — the patch is already inside the face box, so it IS skin.
  // Only fully black pixels (camera noise / no data) are dropped.
  const cols = patches.map((p) => regionColor(pixels, w, h, p, { skipDark: 6 })).filter(Boolean);
  if (!cols.length) return null;
  // Best-lit patch wins: side lighting puts one cheek in shadow constantly,
  // which biases dark. All patches are inside the face box, so the brightest
  // is the one closest to true tone under neutral light.
  const lum = (p) => 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
  cols.sort((p, q) => lum(q) - lum(p));
  const pick = cols[0];
  // weight lightness a little lower: lighting shifts L more than true tone
  return { rgb: pick, ...nearest(SKIN_TONES, pick, { weightL: 0.75 }) };
}

/** Hair: sample above the face box (top of head) and just outside the temples. */
export function detectHair(pixels, w, h, face) {
  const b = face.bounds;
  // Crown strip, just above the face box: hair if they have any.
  const crown = regionColor(pixels, w, h,
    { x: b.x + b.width * 0.3, y: b.y - b.height * 0.15, width: b.width * 0.4, height: b.height * 0.11 });
  // Temples: fallback only. They straddle the background, so never let them
  // outvote the crown (that's how blonde hair got read as black).
  const temples = [
    { x: b.x - b.width * 0.05, y: b.y + b.height * 0.2, width: b.width * 0.08, height: b.height * 0.15 },
    { x: b.x + b.width * 0.97, y: b.y + b.height * 0.2, width: b.width * 0.08, height: b.height * 0.15 },
  ].map((p) => regionColor(pixels, w, h, p)).filter(Boolean);

  const pick = crown || temples[0];
  if (!pick) return null;
  return { rgb: pick, ...nearest(HAIR_COLORS, pick) };
}

/** Eye color: a small patch at each eye landmark; take the more saturated. */
export function detectEyes(pixels, w, h, face) {
  const pts = [face.leftEye, face.rightEye].filter(Boolean);
  if (!pts.length) return null;
  const s = face.bounds.width * 0.045;
  const cols = pts
    .map((p) => regionColor(pixels, w, h, { x: p.x - s / 2, y: p.y - s / 2, width: s, height: s },
      { skipDark: 6 }))
    .filter(Boolean);
  if (!cols.length) return null;
  const sat = (p) => Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b);
  cols.sort((p, q) => sat(q) - sat(p));
  return { rgb: cols[0], ...nearest(EYE_COLORS, cols[0]) };
}

/**
 * Face geometry -> the closest built-in options.
 * Uses simple, robust ratios rather than pretending to do real morphometry.
 * Returns nulls when landmarks are missing, so callers can skip this half.
 */
export function detectGeometry(face) {
  const b = face.bounds;
  if (!b || !b.width) return {};
  const out = {};

  // --- face shape from the width:height ratio of the detected box ---------
  const ratio = b.width / b.height;                 // ~0.72 long … ~0.95 wide
  const SHAPES = [
    { id: 'f5', name: 'Long',   at: 0.70 },
    { id: 'f2', name: 'Oval',   at: 0.76 },
    { id: 'f7', name: 'Sharp',  at: 0.80 },
    { id: 'f4', name: 'Heart',  at: 0.83 },
    { id: 'f1', name: 'Round',  at: 0.86 },
    { id: 'f6', name: 'Soft',   at: 0.89 },
    { id: 'f3', name: 'Square', at: 0.92 },
    { id: 'f8', name: 'Wide',   at: 0.96 },
  ];
  out.shape = SHAPES.reduce((best, s) =>
    Math.abs(s.at - ratio) < Math.abs(best.at - ratio) ? s : best, SHAPES[0]).id;

  // --- eye style from eye spacing relative to face width ------------------
  if (face.leftEye && face.rightEye) {
    const dx = Math.abs(face.rightEye.x - face.leftEye.x);
    const spacing = dx / b.width;                   // ~0.30 close … ~0.45 wide
    out.eyes = spacing > 0.42 ? 'e2'                // Wide
      : spacing > 0.37 ? 'e1'                       // Classic
      : spacing > 0.33 ? 'e3'                       // Soft
      : 'e4';                                       // Sharp
    // big eyes when the head is small in frame but eyes sit high (kid-ish)
    if (face.eyeOpenProbability != null && face.eyeOpenProbability < 0.35) out.eyes = 'e5'; // Sleepy
  }

  // --- brows: heavier when eyes sit low in the box, thin when high --------
  if (face.leftEye) {
    const eyeY = (face.leftEye.y - b.y) / b.height; // ~0.35 typical
    out.brows = eyeY < 0.33 ? 'br4'                 // Thin
      : eyeY < 0.38 ? 'br1'                         // Straight
      : eyeY < 0.43 ? 'br2'                         // Arched
      : 'br3';                                      // Thick
  }

  // --- nose: from nose-base position between eyes and mouth ---------------
  if (face.noseBase && face.leftEye && face.mouth) {
    const eyeY = face.leftEye.y;
    const span = face.mouth.y - eyeY;
    const rel = span ? (face.noseBase.y - eyeY) / span : 0.55;
    out.nose = rel < 0.48 ? 'n1'                    // Small
      : rel < 0.58 ? 'n2'                           // Classic
      : rel < 0.66 ? 'n3'                           // Button
      : 'n4';                                       // Pointed
  }

  // --- expression: use the detector's own smile probability ---------------
  if (face.smilingProbability != null) {
    out.expression = face.smilingProbability > 0.7 ? 'grin'
      : face.smilingProbability > 0.3 ? 'soft_smile'
      : 'neutral';
  }
  return out;
}

/**
 * Full analysis: pixels + face -> recipe patch + a report for the UI.
 * @returns {{ patch: object, report: object }}
 */
export function analyzeSelfie(pixels, width, height, face) {
  const skin = detectSkin(pixels, width, height, face);
  const hair = detectHair(pixels, width, height, face);
  const eyes = detectEyes(pixels, width, height, face);
  const geo = detectGeometry(face);

  const patch = {};
  if (skin) patch['body.skin'] = skin.id;
  if (hair) patch['hair.color'] = hair.id;
  if (eyes) patch['face.eyes.color'] = eyes.id;
  if (geo.shape) patch['face.shape'] = geo.shape;
  if (geo.eyes) patch['face.eyes.id'] = geo.eyes;
  if (geo.brows) patch['face.brows'] = geo.brows;
  if (geo.nose) patch['face.nose'] = geo.nose;
  if (geo.expression) patch['face.expression'] = geo.expression;

  return {
    patch,
    report: {
      skin: skin && { picked: skin.id, hex: skin.hex, from: skin.rgb, confidence: conf(skin.distance, 30) },
      hair: hair && { picked: hair.id, hex: hair.hex, from: hair.rgb, confidence: conf(hair.distance, 45) },
      eyes: eyes && { picked: eyes.id, hex: eyes.hex, from: eyes.rgb, confidence: conf(eyes.distance, 55) },
      geometry: geo,
      hasLandmarks: !!(face.leftEye && face.rightEye),
    },
  };
}

const conf = (d, scale) => Math.max(0, Math.min(1, 1 - d / scale));

export const PALETTES = { SKIN_TONES, HAIR_COLORS, EYE_COLORS };
