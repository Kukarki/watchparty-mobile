import {
  analyzeSelfie, nearest, rgbToLab, regionColor, detectGeometry, PALETTES,
} from './selfieAnalysis.js';

// Build a fake selfie: background, hair region on top, face oval with cheeks,
// eyes. Then check we recover the colors we painted.
function makeFace({ w = 200, h = 260, skin, hair, eye, faceRatio = 0.86, bg = [30, 32, 40] }) {
  const px = new Uint8ClampedArray(w * h * 4);
  const put = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (Math.round(y) * w + Math.round(x)) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(x, y, bg);

  const fh = 170;
  const fw = fh * faceRatio;
  const fx = (w - fw) / 2, fy = 50;
  const bounds = { x: fx, y: fy, width: fw, height: fh };

  // hair: block above + temples
  for (let y = fy - 34; y < fy + 40; y++)
    for (let x = fx - 12; x < fx + fw + 12; x++)
      if (y < fy + 6 || x < fx + 6 || x > fx + fw - 6) put(x, y, hair);

  // face oval in skin
  const cx = fx + fw / 2, cy = fy + fh / 2;
  for (let y = fy; y < fy + fh; y++)
    for (let x = fx; x < fx + fw; x++) {
      const dx = (x - cx) / (fw / 2), dy = (y - cy) / (fh / 2);
      if (dx * dx + dy * dy <= 1) put(x, y, skin);
    }

  const leftEye = { x: fx + fw * 0.32, y: fy + fh * 0.36 };
  const rightEye = { x: fx + fw * 0.68, y: fy + fh * 0.36 };
  for (const e of [leftEye, rightEye])
    for (let y = e.y - 5; y <= e.y + 5; y++)
      for (let x = e.x - 6; x <= e.x + 6; x++)
        if ((x - e.x) ** 2 / 36 + (y - e.y) ** 2 / 25 <= 1) put(x, y, eye);

  const face = {
    bounds, leftEye, rightEye,
    noseBase: { x: cx, y: fy + fh * 0.56 },
    mouth: { x: cx, y: fy + fh * 0.75 },
    smilingProbability: 0.85,
  };
  return { px, w, h, face };
}

const rgb = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
let pass = 0, fail = 0;
const check = (name, got, want) => {
  if (got === want) { pass++; }
  else { fail++; console.log(`  FAIL ${name}: got ${got}, want ${want}`); }
};

console.log('— skin tone recovery across the full range —');
for (const t of PALETTES.SKIN_TONES) {
  const { px, w, h, face } = makeFace({ skin: rgb(t.hex), hair: rgb('#1B1B22'), eye: rgb('#4A2E1D') });
  const { report } = analyzeSelfie(px, w, h, face);
  if (!report.skin) { console.log('NULL for', t.id, 'bounds', JSON.stringify(face.bounds), 'w,h=', w, h, 'px len', px.length); process.exit(1); }
  check(`skin ${t.id}`, report.skin.picked, t.id);
}

console.log('— hair color recovery —');
for (const t of PALETTES.HAIR_COLORS) {
  const { px, w, h, face } = makeFace({ skin: rgb('#E0B08D'), hair: rgb(t.hex), eye: rgb('#4A2E1D') });
  const { report } = analyzeSelfie(px, w, h, face);
  check(`hair ${t.id}`, report.hair.picked, t.id);
}

console.log('— eye color recovery —');
for (const t of PALETTES.EYE_COLORS) {
  const { px, w, h, face } = makeFace({ skin: rgb('#EAC1A3'), hair: rgb('#3B2A20'), eye: rgb(t.hex) });
  const { report } = analyzeSelfie(px, w, h, face);
  check(`eye ${t.id}`, report.eyes.picked, t.id);
}

console.log('— face shape from ratio —');
for (const [ratio, want] of [[0.70,'f5'],[0.76,'f2'],[0.86,'f1'],[0.92,'f3'],[0.97,'f8']]) {
  const { face } = makeFace({ skin: rgb('#E0B08D'), hair: rgb('#1B1B22'), eye: rgb('#4A2E1D'), faceRatio: ratio });
  check(`shape @${ratio}`, detectGeometry(face).shape, want);
}

console.log('— robustness —');
// shadow on one cheek shouldn't change the tone much
const shadowed = makeFace({ skin: rgb('#C68863'), hair: rgb('#1B1B22'), eye: rgb('#4A2E1D') });
for (let y = 50; y < 220; y++) for (let x = 0; x < 100; x++) {
  const i = (y * shadowed.w + x) * 4;
  shadowed.px[i] *= 0.55; shadowed.px[i+1] *= 0.55; shadowed.px[i+2] *= 0.55;
}
const sh = analyzeSelfie(shadowed.px, shadowed.w, shadowed.h, shadowed.face);
check('half-shadowed face keeps tone', sh.report.skin.picked, 's06');

// smile probability -> expression
const smiley = makeFace({ skin: rgb('#E0B08D'), hair: rgb('#1B1B22'), eye: rgb('#4A2E1D') });
check('smile -> grin', analyzeSelfie(smiley.px, smiley.w, smiley.h, smiley.face).patch['face.expression'], 'grin');

// no landmarks -> geometry skipped, colors still work
const noLm = makeFace({ skin: rgb('#8E5233'), hair: rgb('#1B1B22'), eye: rgb('#4A2E1D') });
const bare = analyzeSelfie(noLm.px, noLm.w, noLm.h, { bounds: noLm.face.bounds });
check('no landmarks: skin still detected', bare.report.skin.picked, 's09');
check('no landmarks: eyes skipped', bare.report.eyes, null);
check('no landmarks: flag false', bare.report.hasLandmarks, false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
