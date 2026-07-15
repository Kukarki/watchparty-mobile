// Shared constants for the WatchParty avatar system.
// Used by BOTH the Express backend and the Expo app (CommonJS on purpose).

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

const RARITY_COLORS = {
  common: '#9AA3B2',
  uncommon: '#3DDC84',
  rare: '#29B6FF',
  epic: '#A46CFF',
  legendary: '#FFB454',
  mythic: '#FF4D6D',
};

// Item categories stored in the `items` catalog table.
const CATEGORIES = [
  'hair', 'top', 'bottom', 'shoes', 'outfit_full',
  'acc_head', 'acc_ears', 'acc_face', 'acc_hands', 'acc_back',
  'effect', 'frame', 'background',
];

// Which recipe slot each catalog category occupies.
const CATEGORY_TO_SLOT = {
  hair: 'hair.id',
  top: 'outfit.top',
  bottom: 'outfit.bottom',
  shoes: 'outfit.shoes',
  outfit_full: 'outfit.full',
  acc_head: 'accessories.head',
  acc_ears: 'accessories.ears',
  acc_face: 'accessories.face',
  acc_hands: 'accessories.hands',
  acc_back: 'accessories.back',
  effect: 'effects', // array slot, max MAX_EFFECTS
  frame: 'frame',
  background: 'background',
};

const MAX_EFFECTS = 2;

// ---- Built-in (non-catalog, always free) face/body options -------------

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

// Head scale (sx, sy) per face shape — drives the primitive renderer now,
// maps to blend-shape weights when real GLB heads ship later.
const FACE_SHAPES = [
  { id: 'f1', name: 'Round',  sx: 1.00, sy: 1.00 },
  { id: 'f2', name: 'Oval',   sx: 0.92, sy: 1.08 },
  { id: 'f3', name: 'Square', sx: 1.06, sy: 0.97 },
  { id: 'f4', name: 'Heart',  sx: 1.02, sy: 1.03 },
  { id: 'f5', name: 'Long',   sx: 0.88, sy: 1.14 },
  { id: 'f6', name: 'Soft',   sx: 1.04, sy: 1.04 },
  { id: 'f7', name: 'Sharp',  sx: 0.95, sy: 1.00 },
  { id: 'f8', name: 'Wide',   sx: 1.12, sy: 0.95 },
];

const EYE_STYLES = [
  { id: 'e1', name: 'Classic', scale: 1.00, tilt: 0 },
  { id: 'e2', name: 'Wide',    scale: 1.20, tilt: 0 },
  { id: 'e3', name: 'Soft',    scale: 1.05, tilt: 0.12 },
  { id: 'e4', name: 'Sharp',   scale: 0.90, tilt: -0.16 },
  { id: 'e5', name: 'Sleepy',  scale: 0.85, tilt: 0.05 },
  { id: 'e6', name: 'Big',     scale: 1.35, tilt: 0.05 },
];

const BROW_STYLES = [
  { id: 'br1', name: 'Straight', w: 1.0, angle: 0 },
  { id: 'br2', name: 'Arched',   w: 1.0, angle: 0.28 },
  { id: 'br3', name: 'Thick',    w: 1.5, angle: 0.10 },
  { id: 'br4', name: 'Thin',     w: 0.6, angle: 0.12 },
  { id: 'br5', name: 'Angled',   w: 1.1, angle: -0.30 },
  { id: 'br6', name: 'Soft',     w: 0.9, angle: 0.18 },
];

const NOSE_STYLES = [
  { id: 'n1', name: 'Small',   scale: 0.80 },
  { id: 'n2', name: 'Classic', scale: 1.00 },
  { id: 'n3', name: 'Button',  scale: 1.15 },
  { id: 'n4', name: 'Pointed', scale: 1.00 },
];

const EXPRESSIONS = [
  { id: 'soft_smile', name: 'Smile',   emoji: '🙂' },
  { id: 'grin',       name: 'Grin',    emoji: '😁' },
  { id: 'neutral',    name: 'Neutral', emoji: '😐' },
  { id: 'cool',       name: 'Cool',    emoji: '😎' },
  { id: 'shock',      name: 'Shock',   emoji: '😱' },
  { id: 'sleepy',     name: 'Sleepy',  emoji: '😴' },
  { id: 'sad',        name: 'Sad',     emoji: '🥺' },
  { id: 'laugh',      name: 'Laugh',   emoji: '😂' },
];

const BODY_TYPES = [
  { id: 'b1', name: 'Slim',     w: 0.92, h: 1.00 },
  { id: 'b2', name: 'Regular',  w: 1.00, h: 1.00 },
  { id: 'b3', name: 'Athletic', w: 1.12, h: 1.02 },
  { id: 'b4', name: 'Broad',    w: 1.24, h: 1.04 },
];

const POSES = [
  { id: 'idle_stand',        name: 'Stand' },
  { id: 'idle_lean',         name: 'Lean' },
  { id: 'idle_arms_crossed', name: 'Crossed' },
];

const PRESENCE = {
  online: '#35E0D0',
  watching: '#8B7CFF',
  listening: '#8B7CFF',
  gaming: '#8B7CFF',
  hosting: '#FFB454',
  idle: '#7A8199',
};

module.exports = {
  RARITIES, RARITY_COLORS, CATEGORIES, CATEGORY_TO_SLOT, MAX_EFFECTS,
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES, EYE_STYLES,
  BROW_STYLES, NOSE_STYLES, EXPRESSIONS, BODY_TYPES, POSES, PRESENCE,
};
