// Zustand store: catalog + inventory + draft recipe editing with undo.
// The Studio edits `draft`; Save validates client-side, then PUTs to the
// server (which re-validates), then captures + uploads snapshots.
import { create } from 'zustand';
import {
  defaultRecipe, validateRecipe, CATEGORY_TO_SLOT, MAX_EFFECTS,
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES, EYE_STYLES,
  BROW_STYLES, NOSE_STYLES, EXPRESSIONS, BODY_TYPES,
} from '../avatar-core';
import { AvatarApi } from './api';
import { captureSnapshots } from './three/snapshot';

const clone = (o) => JSON.parse(JSON.stringify(o));
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// set a value at a dotted path ('face.eyes.color') on a cloned recipe
function setPath(obj, path, value) {
  const keys = path.split('.');
  let node = obj;
  for (let i = 0; i < keys.length - 1; i++) node = node[keys[i]];
  node[keys[keys.length - 1]] = value;
  return obj;
}

export const useAvatarStore = create((set, get) => ({
  loading: false,
  loaded: false,
  error: null,

  catalog: [],
  catalogIndex: new Map(),
  itemsByCategory: {},
  ownedSet: new Set(),

  saved: null,          // last server-confirmed recipe
  draft: null,          // what the Studio edits
  history: [],          // undo stack (max 20)
  dirty: false,
  saving: false,
  progression: null,    // { level, into, needed, title, wallet, streak }

  async init(force = false) {
    if (get().loaded && !force) return;
    set({ loading: true, error: null });
    try {
      const [manifest, avatar, inv, prog] = await Promise.all([
        AvatarApi.manifest(),
        AvatarApi.myAvatar(),
        AvatarApi.inventory(),
        AvatarApi.progression(),
      ]);
      const catalog = manifest.items || [];
      const catalogIndex = new Map(catalog.map((it) => [it.id, it]));
      const itemsByCategory = {};
      for (const it of catalog) {
        (itemsByCategory[it.category] = itemsByCategory[it.category] || []).push(it);
      }
      const ownedSet = new Set((inv.items || []).map((r) => r.item_id));
      const recipe = avatar.recipe || defaultRecipe();
      set({
        loading: false, loaded: true,
        catalog, catalogIndex, itemsByCategory, ownedSet,
        saved: clone(recipe), draft: clone(recipe),
        history: [], dirty: false, progression: prog,
      });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  async refreshProgression() {
    try { set({ progression: await AvatarApi.progression() }); } catch (_) {}
  },

  // ---- draft editing --------------------------------------------------------
  _pushHistory() {
    const { draft, history } = get();
    const next = [...history, clone(draft)];
    if (next.length > 20) next.shift();
    set({ history: next });
  },

  setPart(path, value) {
    get()._pushHistory();
    set({ draft: setPath(clone(get().draft), path, value), dirty: true });
  },

  equipItem(item) {
    const slot = CATEGORY_TO_SLOT[item.category];
    if (!slot) return;
    get()._pushHistory();
    const draft = clone(get().draft);

    if (slot === 'effects') {
      const i = draft.effects.indexOf(item.id);
      if (i >= 0) draft.effects.splice(i, 1);            // tap again = unequip
      else if (draft.effects.length < MAX_EFFECTS) draft.effects.push(item.id);
      else { draft.effects.shift(); draft.effects.push(item.id); } // replace oldest
    } else {
      setPath(draft, slot, item.id);
      // full outfits and top/bottom are mutually exclusive on the renderer
      if (item.category === 'outfit_full') { /* keep top/bottom for restore */ }
      if (item.category === 'top' || item.category === 'bottom') draft.outfit.full = null;
    }
    set({ draft, dirty: true });
  },

  unequipSlot(path) {
    get()._pushHistory();
    set({ draft: setPath(clone(get().draft), path, null), dirty: true });
  },

  undo() {
    const { history } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({ history: history.slice(0, -1), draft: prev, dirty: true });
  },

  resetDraft() {
    set({ draft: clone(get().saved), history: [], dirty: false });
  },

  randomize() {
    const { itemsByCategory, ownedSet } = get();
    const usable = (cat) => (itemsByCategory[cat] || [])
      .filter((it) => it.unlock_type === 'default' || ownedSet.has(it.id));
    get()._pushHistory();
    const draft = clone(get().draft);
    draft.body.type = rand(BODY_TYPES).id;
    draft.body.skin = rand(SKIN_TONES).id;
    draft.face.shape = rand(FACE_SHAPES).id;
    draft.face.eyes = { id: rand(EYE_STYLES).id, color: rand(EYE_COLORS).id };
    draft.face.brows = rand(BROW_STYLES).id;
    draft.face.nose = rand(NOSE_STYLES).id;
    draft.face.expression = rand(EXPRESSIONS).id;
    const hair = usable('hair'); if (hair.length) draft.hair.id = rand(hair).id;
    draft.hair.color = rand(HAIR_COLORS).id;
    const tops = usable('top'); if (tops.length) draft.outfit.top = rand(tops).id;
    const bottoms = usable('bottom'); if (bottoms.length) draft.outfit.bottom = rand(bottoms).id;
    const shoes = usable('shoes'); if (shoes.length) draft.outfit.shoes = rand(shoes).id;
    draft.outfit.full = null;
    set({ draft, dirty: true });
  },

  clientValidate() {
    const { draft, catalogIndex, ownedSet } = get();
    return validateRecipe(draft, { catalog: catalogIndex, ownedSet });
  },


  // ---- shop -------------------------------------------------------------------
  async purchase(item, currency) {
    const res = await AvatarApi.purchase(item.id, currency);
    const ownedSet = new Set(get().ownedSet);
    ownedSet.add(item.id);
    const prog = get().progression;
    set({
      ownedSet,
      progression: prog ? { ...prog, wallet: res.wallet } : prog,
    });
    return res;
  },

  // ---- save: recipe first (gets the hash), then snapshots (best-effort) -----
  async save(stageRef) {
    const check = get().clientValidate();
    if (!check.ok) return { ok: false, errors: check.errors };
    set({ saving: true });
    try {
      const row = await AvatarApi.saveRecipe(check.clean);
      set({ saved: clone(row.recipe), draft: clone(row.recipe), dirty: false, history: [] });
      if (stageRef) {
        try {
          const snaps = await captureSnapshots(stageRef);
          if (snaps.head || snaps.bust || snaps.full) {
            await AvatarApi.uploadSnapshots(snaps);
          }
        } catch (err) {
          console.warn('[avatar] snapshot upload skipped:', err.message);
        }
      }
      set({ saving: false });
      return { ok: true, recipeHash: row.recipe_hash };
    } catch (err) {
      set({ saving: false });
      return { ok: false, errors: err.details || [err.message] };
    }
  },
}));
