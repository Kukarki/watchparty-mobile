// Procedural avatar renderer — builds a stylized low-poly character from a
// recipe using three.js primitives. This is the placeholder art layer: the
// architecture (recipe -> 3D group) is final, the geometry is not.
//
// ============================== SWAP POINT ==============================
// When real GLB assets exist: give catalog items an `asset_url`, and in
// each build step below check `item.asset_url` first and load it with
// GLTFLoader (three-stdlib) onto the shared skeleton instead of building
// primitives. Everything else (recipe, validation, snapshots, Studio UI)
// stays exactly the same.
// ========================================================================
import * as THREE from 'three';
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES, EYE_STYLES,
  BROW_STYLES, NOSE_STYLES, BODY_TYPES,
} from '../../avatar-core';

const byId = (list, id, fallbackIndex = 0) =>
  list.find((o) => o.id === id) || list[fallbackIndex];

const hexOf = (list, id, fallback) => {
  const found = list.find((o) => o.id === id);
  return found ? found.hex : fallback;
};

function primaryOf(item, fallback) {
  const c = item && Array.isArray(item.colorways) && item.colorways[0];
  return (c && c.primary) || fallback;
}
function secondaryOf(item, fallback) {
  const c = item && Array.isArray(item.colorways) && item.colorways[0];
  return (c && c.secondary) || fallback;
}

const smooth = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...extra });
const flat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.04, flatShading: true, ...extra });
const glow = (color, opacity = 0.6) =>
  new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });

const capsule = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 10), mat);
const sphere = (r, mat, ws = 14, hs = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 14) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const cone = (r, h, mat, seg = 10) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
const torus = (r, t, mat, arc = Math.PI * 2) =>
  new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 20, arc), mat);

// ---------------------------------------------------------------------------
export function buildAvatar(recipe, catalogIndex = new Map()) {
  const getItem = (id) => (id == null ? null : catalogIndex.get(id) || null);
  const R = recipe;

  const bodyType = byId(BODY_TYPES, R.body.type, 1);
  const w = bodyType.w;
  const skinHex = hexOf(SKIN_TONES, R.body.skin, '#C68863');
  const skinMat = smooth(skinHex);

  // clothing colors
  const fullItem = getItem(R.outfit.full);
  const topItem = fullItem || getItem(R.outfit.top);
  const bottomItem = fullItem || getItem(R.outfit.bottom);
  const shoesItem = getItem(R.outfit.shoes);
  const topHex = primaryOf(topItem, '#5A6273');
  const bottomHex = primaryOf(bottomItem, '#2A3242');
  const shoesHex = primaryOf(shoesItem, '#EDEFF4');
  const trimHex = secondaryOf(topItem, null);

  // dimensions
  const legLen = 0.78, legR = 0.082 * w;
  const hipsY = legLen;
  const torsoLen = 0.5, torsoR = 0.205 * w;
  const shoulderY = hipsY + torsoLen + 0.02;
  const armLen = 0.5, armR = 0.06 * w;
  const headR = 0.155;

  const root = new THREE.Group();
  root.name = 'avatar';

  // ---- legs + shoes -------------------------------------------------------
  const legMat = flat(bottomHex);
  const shoeMat = flat(shoesHex);
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.105 * w, hipsY, 0);
    const mesh = capsule(legR, legLen - legR * 2, legMat);
    mesh.position.y = -legLen / 2;
    leg.add(mesh);
    const shoe = box(0.13 * w, 0.085, 0.24, shoeMat);
    shoe.position.set(0, -legLen + 0.03, 0.05);
    leg.add(shoe);
    root.add(leg);
    legs.push(leg);
  }

  // ---- torso ---------------------------------------------------------------
  const isTee = !fullItem && topItem && /tee|shirt/.test(topItem.id || '');
  const topMat = flat(topHex);
  const torso = capsule(torsoR, torsoLen - torsoR, topMat);
  torso.position.y = hipsY + torsoLen / 2 + 0.01;
  root.add(torso);

  if (trimHex) { // belt / hem accent from the colorway's secondary
    const belt = cyl(torsoR * 1.02, torsoR * 1.02, 0.05, flat(trimHex));
    belt.position.y = hipsY + 0.06;
    root.add(belt);
  }
  if (topItem && /hoodie/.test(topItem.id || '')) {
    const hood = torus(0.14, 0.045, flat(topHex));
    hood.position.set(0, shoulderY + 0.1, -0.12);
    hood.rotation.x = Math.PI / 2.4;
    root.add(hood);
  }
  if (fullItem && /dress/.test(fullItem.id || '')) {
    const skirt = cone(0.3 * w, 0.42, flat(topHex));
    skirt.position.y = hipsY - 0.04;
    root.add(skirt);
  }

  // ---- arms + hands ---------------------------------------------------------
  const armMat = isTee ? skinMat : topMat; // tees show skin, everything else sleeves
  const arms = {};
  const hands = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * (torsoR + armR * 0.7), shoulderY - 0.03, 0);
    const mesh = capsule(armR, armLen - armR * 2, armMat);
    mesh.position.y = -armLen / 2;
    arm.add(mesh);
    const hand = new THREE.Group();
    hand.position.y = -armLen - 0.015;
    hand.add(sphere(armR * 1.05, skinMat));
    arm.add(hand);
    arm.rotation.z = side * 0.14; // slight outward rest pose
    root.add(arm);
    arms[side === 1 ? 'right' : 'left'] = arm;
    hands[side === 1 ? 'right' : 'left'] = hand;
  }
  const restZ = { left: -0.14, right: 0.14 };

  // ---- head + face -----------------------------------------------------------
  const shape = byId(FACE_SHAPES, R.face.shape);
  const headGroup = new THREE.Group();
  headGroup.position.y = shoulderY + 0.1 + headR;
  headGroup.scale.set(shape.sx, shape.sy, (shape.sx + 1) / 2);
  root.add(headGroup);

  const neck = cyl(0.05 * w, 0.055 * w, 0.09, skinMat, 10);
  neck.position.y = shoulderY + 0.06;
  root.add(neck);

  headGroup.add(sphere(headR, skinMat, 20, 16));

  const faceGroup = new THREE.Group(); // rebuilt on expression change
  headGroup.add(faceGroup);

  const eyeStyle = byId(EYE_STYLES, R.face.eyes.id);
  const eyeHex = hexOf(EYE_COLORS, R.face.eyes.color, '#4A2E1D');
  const brow = byId(BROW_STYLES, R.face.brows);
  const nose = byId(NOSE_STYLES, R.face.nose);
  const hairHex = hexOf(HAIR_COLORS, R.hair.color, '#1B1B22');
  const browColor = new THREE.Color(hairHex).multiplyScalar(0.55);
  const mouthMat = smooth('#7A4A44');

  function buildFace(expressionId) {
    faceGroup.clear();
    const ex = expressionId || 'soft_smile';
    const eyeZ = headR * 0.9;
    const openEyes = !['sleepy'].includes(ex);
    const eyeScale = eyeStyle.scale * (ex === 'shock' ? 1.3 : 1);

    for (const side of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(side * 0.058, 0.02, eyeZ);
      eg.rotation.z = -side * eyeStyle.tilt;
      if (openEyes) {
        eg.add(sphere(0.03 * eyeScale, smooth('#F4F6FA'), 10, 8));
        const pupil = sphere(0.015 * eyeScale, smooth(ex === 'cool' ? '#20242E' : eyeHex), 8, 8);
        pupil.position.z = 0.02 * eyeScale;
        eg.add(pupil);
      } else {
        const lid = box(0.05, 0.012, 0.012, smooth('#20242E'));
        lid.rotation.z = side * 0.25;
        eg.add(lid);
      }
      // brows
      const b = box(0.055 * brow.w, 0.013, 0.012, smooth(browColor));
      b.position.set(0, 0.055 + (ex === 'shock' ? 0.015 : 0), 0.01);
      b.rotation.z = -side * brow.angle + (ex === 'sad' ? side * 0.2 : 0);
      eg.add(b);
      faceGroup.add(eg);
    }

    const n = cone(0.015 * nose.scale, 0.032 * nose.scale, skinMat, 8);
    n.rotation.x = Math.PI / 2;
    n.position.set(0, -0.012, headR * 0.98);
    faceGroup.add(n);

    // mouth per expression
    const mz = headR * 0.94;
    const my = -0.065;
    let mouth;
    switch (ex) {
      case 'grin':
      case 'laugh': {
        mouth = new THREE.Group();
        const open = sphere(0.03, smooth('#3A1F22'), 10, 8);
        open.scale.set(1.3, ex === 'laugh' ? 0.9 : 0.55, 0.5);
        mouth.add(open);
        if (ex === 'grin') {
          const teeth = box(0.05, 0.012, 0.01, smooth('#F4F6FA'));
          teeth.position.y = 0.012;
          mouth.add(teeth);
        }
        break;
      }
      case 'neutral':
        mouth = box(0.05, 0.009, 0.01, mouthMat);
        break;
      case 'cool':
        mouth = box(0.045, 0.009, 0.01, mouthMat);
        mouth.rotation.z = 0.18;
        mouth.position.x = 0.012;
        break;
      case 'shock':
        mouth = torus(0.02, 0.007, mouthMat);
        break;
      case 'sad':
        mouth = torus(0.035, 0.007, mouthMat, Math.PI);
        mouth.position.y = -0.02;
        break;
      case 'sleepy':
        mouth = box(0.03, 0.009, 0.01, mouthMat);
        break;
      default: // soft_smile
        mouth = torus(0.035, 0.007, mouthMat, Math.PI);
        mouth.rotation.z = Math.PI; // flip the half-arc into a smile
    }
    mouth.position.set(mouth.position.x, my + (ex === 'sad' ? -0.01 : 0), mz);
    faceGroup.add(mouth);

    if ((R.face.details || []).includes('freckles_1')) {
      for (let i = 0; i < 6; i++) {
        const f = sphere(0.005, smooth(new THREE.Color(skinHex).multiplyScalar(0.75)), 6, 6);
        f.position.set((Math.random() - 0.5) * 0.12, -0.02 + Math.random() * 0.02, headR * 0.96);
        faceGroup.add(f);
      }
    }
  }
  buildFace(R.face.expression);

  // ---- hair -------------------------------------------------------------------
  const hairItem = getItem(R.hair.id);
  const hairEmissive = hairItem && /neon/.test(hairItem.id || '');
  const hairMat = smooth(hairHex, hairEmissive
    ? { emissive: new THREE.Color(primaryOf(hairItem, hairHex)), emissiveIntensity: 0.6 }
    : {});

  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);
  const cap = (ry = 0.82, r = 1.06, y = 0.045) => {
    const c = sphere(headR * r, hairMat, 16, 12);
    c.scale.y = ry;
    c.position.set(0, y, -0.012);
    return c;
  };
  const hid = (hairItem && hairItem.id) || 'hr_short';
  switch (hid) {
    case 'hr_buzz': hairGroup.add(cap(0.74, 1.03, 0.05)); break;
    case 'hr_bob': {
      hairGroup.add(cap(1.0, 1.12, 0.01));
      const fringe = box(0.2, 0.05, 0.06, hairMat);
      fringe.position.set(0, 0.095, headR * 0.82);
      hairGroup.add(fringe);
      break;
    }
    case 'hr_pony': {
      hairGroup.add(cap());
      const tail = capsule(0.045, 0.22, hairMat);
      tail.position.set(0, -0.02, -headR * 1.05);
      tail.rotation.x = 0.6;
      hairGroup.add(tail);
      break;
    }
    case 'hr_bun': {
      hairGroup.add(cap());
      const bun = sphere(0.06, hairMat, 10, 8);
      bun.position.set(0, headR * 0.95, -0.03);
      hairGroup.add(bun);
      break;
    }
    case 'hr_wolfcut': {
      hairGroup.add(cap(0.95, 1.1, 0.02));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 1.4 + Math.PI * 0.8;
        const chop = box(0.05, 0.11, 0.03, hairMat);
        chop.position.set(Math.sin(a) * headR * 0.95, -0.05, Math.cos(a) * headR * 0.95);
        chop.rotation.y = a;
        chop.rotation.z = (i % 2 ? 1 : -1) * 0.2;
        hairGroup.add(chop);
      }
      break;
    }
    case 'hr_curls': {
      hairGroup.add(cap(0.9, 1.05, 0.03));
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const c = sphere(0.055, hairMat, 8, 6);
        c.position.set(Math.sin(a) * headR * 0.8, 0.08 + (i % 3) * 0.02, Math.cos(a) * headR * 0.8);
        hairGroup.add(c);
      }
      break;
    }
    case 'hr_spikes': {
      hairGroup.add(cap(0.8, 1.04, 0.05));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const s = cone(0.035, 0.12, hairMat, 6);
        s.position.set(Math.sin(a) * headR * 0.5, headR * 0.85, Math.cos(a) * headR * 0.5);
        s.rotation.set(Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4);
        hairGroup.add(s);
      }
      break;
    }
    case 'hr_long':
    case 'hr_neon_flow': {
      hairGroup.add(cap(1.0, 1.1, 0.01));
      for (const side of [-1, 1]) {
        const lock = box(0.06, 0.38, 0.08, hairMat);
        lock.position.set(side * headR * 0.95, -0.2, -0.02);
        hairGroup.add(lock);
      }
      const backSheet = box(0.24, 0.4, 0.05, hairMat);
      backSheet.position.set(0, -0.18, -headR * 0.95);
      hairGroup.add(backSheet);
      break;
    }
    default: hairGroup.add(cap()); // hr_short
  }

  // ---- accessories ---------------------------------------------------------------
  const accAnims = []; // per-frame accessory animators
  function addAccessory(item) {
    if (!item) return;
    const p = primaryOf(item, '#8B7CFF');
    const s = secondaryOf(item, '#141826');
    const g = new THREE.Group();
    switch (item.id) {
      case 'it_cap_wp': case 'it_beanie_ink': {
        const dome = sphere(headR * 1.06, flat(p), 14, 10);
        dome.scale.y = item.id === 'it_cap_wp' ? 0.55 : 0.7;
        dome.position.y = 0.08;
        g.add(dome);
        if (item.id === 'it_cap_wp') {
          const brim = box(0.16, 0.02, 0.12, flat(p));
          brim.position.set(0, 0.055, headR * 0.95);
          g.add(brim);
        } else {
          const rim = torus(headR * 0.98, 0.02, flat(p));
          rim.rotation.x = Math.PI / 2;
          rim.position.y = 0.02;
          g.add(rim);
        }
        headGroup.add(g);
        break;
      }
      case 'it_crown_gold': {
        const ring = cyl(headR * 0.85, headR * 0.9, 0.06, flat(p, { metalness: 0.7, roughness: 0.3 }));
        ring.position.y = headR * 0.85;
        g.add(ring);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const spike = cone(0.02, 0.06, flat(p, { metalness: 0.7, roughness: 0.3 }), 6);
          spike.position.set(Math.sin(a) * headR * 0.85, headR * 0.85 + 0.06, Math.cos(a) * headR * 0.85);
          g.add(spike);
        }
        headGroup.add(g);
        break;
      }
      case 'it_headphones_x': {
        const band = torus(headR * 1.08, 0.022, flat(p), Math.PI);
        band.position.y = 0.02;
        g.add(band);
        for (const side of [-1, 1]) {
          const cup = cyl(0.055, 0.055, 0.04, flat(p));
          cup.rotation.z = Math.PI / 2;
          cup.position.set(side * headR * 1.02, 0, 0);
          g.add(cup);
          const led = cyl(0.058, 0.058, 0.01, glow(s, 0.9));
          led.rotation.z = Math.PI / 2;
          led.position.set(side * headR * 1.08, 0, 0);
          g.add(led);
        }
        headGroup.add(g);
        break;
      }
      case 'it_buds_cy': {
        for (const side of [-1, 1]) {
          const bud = sphere(0.022, flat(p, { emissive: new THREE.Color(p), emissiveIntensity: 0.4 }), 8, 8);
          bud.position.set(side * headR * 1.0, 0, 0.01);
          g.add(bud);
        }
        headGroup.add(g);
        break;
      }
      case 'it_glasses_round': case 'it_shades_noir': case 'it_visor_neon': {
        const z = headR * 0.98;
        if (item.id === 'it_glasses_round') {
          for (const side of [-1, 1]) {
            const lens = torus(0.038, 0.006, flat(p));
            lens.position.set(side * 0.058, 0.02, z);
            g.add(lens);
          }
          const bridge = box(0.035, 0.007, 0.007, flat(p));
          bridge.position.set(0, 0.02, z);
          g.add(bridge);
        } else {
          const mat = item.id === 'it_visor_neon' ? glow(p, 0.75) : flat(p);
          const band = box(0.19, item.id === 'it_visor_neon' ? 0.05 : 0.045, 0.03, mat);
          band.position.set(0, 0.02, z);
          g.add(band);
        }
        headGroup.add(g);
        break;
      }
      case 'it_popcorn': case 'it_soda_cy': case 'it_controller': {
        if (item.id === 'it_popcorn') {
          const bucket = cyl(0.05, 0.04, 0.09, flat(p));
          g.add(bucket);
          const stripe = cyl(0.051, 0.045, 0.03, flat(s));
          g.add(stripe);
          for (let i = 0; i < 4; i++) {
            const k = sphere(0.018, flat('#FCF6DE'), 6, 6);
            k.position.set((Math.random() - 0.5) * 0.05, 0.055, (Math.random() - 0.5) * 0.05);
            g.add(k);
          }
        } else if (item.id === 'it_soda_cy') {
          g.add(cyl(0.035, 0.03, 0.1, flat(p)));
          const straw = cyl(0.006, 0.006, 0.08, flat('#F4F6FA'), 6);
          straw.position.set(0.015, 0.08, 0);
          straw.rotation.z = -0.25;
          g.add(straw);
        } else {
          const pad = box(0.11, 0.03, 0.06, flat(p));
          g.add(pad);
        }
        g.position.y = -0.02;
        hands.right.add(g);
        break;
      }
      case 'it_pack_glow': {
        const pack = box(0.2, 0.26, 0.1, flat(s));
        pack.position.set(0, hipsY + torsoLen * 0.55, -(torsoR + 0.07));
        g.add(pack);
        const strip = box(0.05, 0.22, 0.01, glow(p, 0.85));
        strip.position.set(0, hipsY + torsoLen * 0.55, -(torsoR + 0.125));
        g.add(strip);
        root.add(g);
        break;
      }
      case 'it_guitar': {
        const bodyG = box(0.16, 0.24, 0.06, flat(p));
        const neckG = cyl(0.015, 0.015, 0.3, flat('#3B2A20'), 8);
        neckG.position.y = 0.24;
        const gg = new THREE.Group();
        gg.add(bodyG); gg.add(neckG);
        gg.position.set(0.05, hipsY + torsoLen * 0.5, -(torsoR + 0.08));
        gg.rotation.z = 0.5;
        g.add(gg);
        root.add(g);
        break;
      }
      case 'it_wings_neon': {
        for (const side of [-1, 1]) {
          const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), glow(p, 0.45));
          wing.position.set(side * 0.2, shoulderY - 0.05, -(torsoR + 0.06));
          wing.rotation.y = side * 0.5;
          g.add(wing);
          accAnims.push((t) => { wing.rotation.y = side * (0.5 + Math.sin(t * 2.2) * 0.12); });
        }
        root.add(g);
        break;
      }
      default: { // unknown accessory -> readable placeholder so nothing breaks
        const ph = sphere(0.04, flat(p), 8, 8);
        ph.position.y = headR * 1.1;
        g.add(ph);
        headGroup.add(g);
      }
    }
  }
  addAccessory(getItem(R.accessories.head));
  addAccessory(getItem(R.accessories.ears));
  addAccessory(getItem(R.accessories.face));
  addAccessory(getItem(R.accessories.hands));
  addAccessory(getItem(R.accessories.back));

  // ---- effects ------------------------------------------------------------------
  const fxAnims = [];
  for (const fxId of R.effects || []) {
    const item = getItem(fxId);
    const p = primaryOf(item, '#8B7CFF');
    if (fxId === 'fx_aura_violet' || !item) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.55, 40), glow(p, 0.4));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      root.add(ring);
      fxAnims.push((t) => {
        const s = 1 + Math.sin(t * 2.4) * 0.07;
        ring.scale.set(s, s, s);
        ring.material.opacity = 0.3 + Math.sin(t * 2.4) * 0.12;
      });
    } else {
      // particle drift: sparks jitter up, embers rise, petals fall
      const N = 34;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 0.9;
        pos[i * 3 + 1] = Math.random() * 1.8;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({
        color: p, size: 0.035, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      root.add(pts);
      const falling = fxId === 'fx_petals';
      fxAnims.push((t, dt) => {
        const a = geo.attributes.position.array;
        for (let i = 0; i < N; i++) {
          a[i * 3 + 1] += (falling ? -0.25 : 0.3) * dt;
          a[i * 3] += Math.sin(t * 2 + i) * 0.0012;
          if (!falling && a[i * 3 + 1] > 1.9) a[i * 3 + 1] = 0;
          if (falling && a[i * 3 + 1] < 0) a[i * 3 + 1] = 1.8;
        }
        geo.attributes.position.needsUpdate = true;
      });
    }
  }

  // ---- pose ----------------------------------------------------------------------
  const pose = R.pose || R.body.posture || 'idle_stand';
  if (pose === 'idle_lean') {
    root.rotation.z = 0.045;
    arms.left.rotation.z = restZ.left - 0.1;
  } else if (pose === 'idle_arms_crossed') {
    for (const side of ['left', 'right']) {
      arms[side].rotation.z = (side === 'left' ? -1 : 1) * 1.15;
      arms[side].rotation.y = (side === 'left' ? 1 : -1) * 0.9;
      arms[side].rotation.x = -0.5;
    }
  }

  // ---- animation state --------------------------------------------------------------
  let waveT = -1;
  const api = {
    group: root,
    setExpression(id) { buildFace(id); },
    playEmote(name) { if (name === 'wave') waveT = 0; },
    update(t, dt) {
      torso.scale.y = 1 + Math.sin(t * 2.1) * 0.018; // breathing
      headGroup.rotation.z = Math.sin(t * 0.6) * 0.02;
      headGroup.rotation.y = Math.sin(t * 0.4) * 0.05;
      for (const fn of fxAnims) fn(t, dt);
      for (const fn of accAnims) fn(t, dt);
      if (waveT >= 0 && pose !== 'idle_arms_crossed') {
        waveT += dt;
        const lift = Math.min(1, waveT * 3);
        const drop = waveT > 1.2 ? Math.min(1, (waveT - 1.2) * 3) : 0;
        const amount = lift * (1 - drop);
        arms.right.rotation.z = restZ.right + amount * 2.15;
        hands.right.rotation.z = Math.sin(waveT * 13) * 0.45 * amount;
        if (waveT > 1.6) {
          waveT = -1;
          arms.right.rotation.z = restZ.right;
          hands.right.rotation.z = 0;
        }
      }
    },
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
    },
  };
  return api;
}
