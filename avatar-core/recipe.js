// The avatar "recipe" — a compact JSON document that fully describes an
// avatar. Stored in Postgres, validated on the server, rendered on any
// client. Cosmetics reference `items` catalog rows by id; face/body basics
// reference the free built-in constants.

const {
  MAX_EFFECTS, SKIN_TONES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES,
  EYE_STYLES, BROW_STYLES, NOSE_STYLES, EXPRESSIONS, BODY_TYPES, POSES,
} = require('./constants');

const RECIPE_VERSION = 2;

function defaultRecipe() {
  return {
    v: RECIPE_VERSION,
    body: { type: 'b2', height: 0.5, skin: 's06', posture: 'idle_stand' },
    face: {
      shape: 'f1',
      eyes: { id: 'e1', color: 'c_umber' },
      brows: 'br1',
      nose: 'n2',
      details: [],
      expression: 'soft_smile',
    },
    hair: { id: 'hr_short', color: 'c_ink', fx: null },
    outfit: { top: 'it_tee_slate', bottom: 'it_jeans_ink', shoes: 'it_sneaker_white', full: null },
    accessories: { head: null, ears: null, face: null, hands: null, back: null },
    effects: [],
    frame: null,
    background: 'bg_room',
    pose: 'idle_stand',
  };
}

const hasId = (list, id) => list.some((o) => o.id === id);
const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

function lockText(item) {
  if (item.unlock_type === 'level') return `unlocks at Level ${item.min_level}`;
  if (item.unlock_type === 'achievement') return 'achievement reward';
  if (item.unlock_type === 'event') return 'event reward';
  return 'available in the shop';
}

/**
 * Validate a recipe and return a clean copy (unknown fields dropped).
 * @param {object} input  recipe from the client
 * @param {object} opts   { catalog: Map(id->item) | {id:item}, ownedSet: Set<string> }
 * @returns {{ ok: boolean, errors: string[], clean: object }}
 */
function validateRecipe(input, opts = {}) {
  const errors = [];
  const src = input && typeof input === 'object' ? input : {};
  const catalog = opts.catalog instanceof Map
    ? opts.catalog
    : new Map(Object.entries(opts.catalog || {}));
  const owned = opts.ownedSet || new Set();

  const pickBuiltin = (list, id, fallback, label) => {
    if (id != null && hasId(list, id)) return id;
    if (id != null) errors.push(`${label}: unknown option '${id}'`);
    return fallback;
  };

  const itemOk = (id, expectedCategory, label, { required = false } = {}) => {
    if (id == null) {
      if (required) errors.push(`${label}: required`);
      return null;
    }
    const item = catalog.get(id);
    if (!item) { errors.push(`${label}: unknown item '${id}'`); return null; }
    if (item.category !== expectedCategory) {
      errors.push(`${label}: '${id}' is a ${item.category}, not ${expectedCategory}`);
      return null;
    }
    if (item.unlock_type !== 'default' && !owned.has(id)) {
      errors.push(`${label}: '${item.name || id}' is locked — ${lockText(item)}`);
      return null;
    }
    return id;
  };

  const d = defaultRecipe();
  const body = src.body || {};
  const face = src.face || {};
  const eyes = face.eyes || {};
  const hair = src.hair || {};
  const outfit = src.outfit || {};
  const acc = src.accessories || {};

  const clean = {
    v: RECIPE_VERSION,
    body: {
      type: pickBuiltin(BODY_TYPES, body.type, d.body.type, 'body.type'),
      height: clamp01(body.height != null ? body.height : d.body.height),
      skin: pickBuiltin(SKIN_TONES, body.skin, d.body.skin, 'body.skin'),
      posture: pickBuiltin(POSES, body.posture, d.body.posture, 'body.posture'),
    },
    face: {
      shape: pickBuiltin(FACE_SHAPES, face.shape, d.face.shape, 'face.shape'),
      eyes: {
        id: pickBuiltin(EYE_STYLES, eyes.id, d.face.eyes.id, 'face.eyes.id'),
        color: pickBuiltin(EYE_COLORS, eyes.color, d.face.eyes.color, 'face.eyes.color'),
      },
      brows: pickBuiltin(BROW_STYLES, face.brows, d.face.brows, 'face.brows'),
      nose: pickBuiltin(NOSE_STYLES, face.nose, d.face.nose, 'face.nose'),
      details: Array.isArray(face.details) ? face.details.slice(0, 3).map(String) : [],
      expression: pickBuiltin(EXPRESSIONS, face.expression, d.face.expression, 'face.expression'),
    },
    hair: {
      id: itemOk(hair.id != null ? hair.id : d.hair.id, 'hair', 'hair') || d.hair.id,
      color: pickBuiltin(HAIR_COLORS, hair.color, d.hair.color, 'hair.color'),
      fx: hair.fx != null ? String(hair.fx) : null,
    },
    outfit: {
      top: itemOk(outfit.top !== undefined ? outfit.top : d.outfit.top, 'top', 'outfit.top'),
      bottom: itemOk(outfit.bottom !== undefined ? outfit.bottom : d.outfit.bottom, 'bottom', 'outfit.bottom'),
      shoes: itemOk(outfit.shoes !== undefined ? outfit.shoes : d.outfit.shoes, 'shoes', 'outfit.shoes'),
      full: itemOk(outfit.full !== undefined ? outfit.full : null, 'outfit_full', 'outfit.full'),
    },
    accessories: {
      head: itemOk(acc.head, 'acc_head', 'accessories.head'),
      ears: itemOk(acc.ears, 'acc_ears', 'accessories.ears'),
      face: itemOk(acc.face, 'acc_face', 'accessories.face'),
      hands: itemOk(acc.hands, 'acc_hands', 'accessories.hands'),
      back: itemOk(acc.back, 'acc_back', 'accessories.back'),
    },
    effects: (Array.isArray(src.effects) ? src.effects : [])
      .slice(0, MAX_EFFECTS)
      .map((id) => itemOk(id, 'effect', 'effects'))
      .filter(Boolean),
    frame: itemOk(src.frame, 'frame', 'frame'),
    background: itemOk(src.background !== undefined ? src.background : d.background, 'background', 'background') || d.background,
    pose: pickBuiltin(POSES, src.pose, d.pose, 'pose'),
  };

  // A full outfit overrides top/bottom; keep them (they restore when
  // the full outfit is removed) but renderers must prioritize `full`.
  if (Array.isArray(src.effects) && src.effects.length > MAX_EFFECTS) {
    errors.push(`effects: max ${MAX_EFFECTS} equipped`);
  }

  return { ok: errors.length === 0, errors, clean };
}

// Stable stringify with recursively sorted keys — the canonical form that
// gets hashed. Same recipe always produces the same hash on every client.
function canonicalize(recipe) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = sort(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(sort(recipe));
}

module.exports = { RECIPE_VERSION, defaultRecipe, validateRecipe, canonicalize };
