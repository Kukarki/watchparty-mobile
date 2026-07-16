// Selfie -> avatar. Camera, analysis, and a review step where every guess is
// editable. Nothing is saved until the user confirms.
//
//   npx expo install expo-camera expo-image-manipulator
//   npm i jpeg-js base-64
//
//   <SelfieAvatarScreen
//     draft={draft} catalogIndex={catalogIndex}
//     AvatarPreview={({ recipe }) => <AvatarStage recipe={recipe} framing="face" />}
//     onApply={(patch) => { /* setPart each key, or merge into draft */ }}
//     onClose={() => router.back()}
//   />
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, Text,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { analyzeSelfie, PALETTES } from './selfieAnalysis';
import { loadPixels, scaleFace } from './selfieImage';
import { detectFace, centeredFallback } from './faceDetect';

const c = {
  ink: '#0B0D14', surface: '#141826', surface2: '#1B2133', border: '#232A3F',
  beam: '#8B7CFF', beamHot: '#B7A8FF', beamDim: 'rgba(139,124,255,0.14)',
  text: '#EEF1FA', text2: '#A8B0C6', dim: '#6F7894', ok: '#3DDC84', warn: '#FFB454',
};

const FACE_SHAPES = [
  { id: 'f1', name: 'Round' }, { id: 'f2', name: 'Oval' }, { id: 'f3', name: 'Square' },
  { id: 'f4', name: 'Heart' }, { id: 'f5', name: 'Long' }, { id: 'f6', name: 'Soft' },
  { id: 'f7', name: 'Sharp' }, { id: 'f8', name: 'Wide' },
];

const setPath = (obj, path, value) => {
  const keys = path.split('.');
  let node = obj;
  for (let i = 0; i < keys.length - 1; i++) node = node[keys[i]];
  node[keys[keys.length - 1]] = value;
  return obj;
};

export default function SelfieAvatarScreen({ draft, catalogIndex, AvatarPreview, onApply, onClose }) {
  const camRef = useRef(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [shot, setShot] = useState(null);      // { uri }
  const [result, setResult] = useState(null);  // { patch, report }
  const [patch, setPatch] = useState(null);    // user-editable copy

  const preview = useMemo(() => {
    if (!draft || !patch) return draft;
    const copy = JSON.parse(JSON.stringify(draft));
    for (const [k, v] of Object.entries(patch)) setPath(copy, k, v);
    return copy;
  }, [draft, patch]);

  // ---- capture + analyse (all on device) --------------------------------
  const capture = async () => {
    if (!camRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await camRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      setShot(photo);

      const { pixels, width, height, scale } = await loadPixels(photo.uri, photo.width);
      const detected = await detectFace(photo.uri, { width: photo.width, height: photo.height });
      const face = detected
        ? scaleFace(detected, scale)
        : centeredFallback({ width, height });

      const res = analyzeSelfie(pixels, width, height, face);
      setResult(res);
      setPatch(res.patch);
    } catch (err) {
      console.warn('[selfie]', err.message);
    } finally {
      setBusy(false);
    }
  };

  const retake = () => { setShot(null); setResult(null); setPatch(null); };

  // ---- permission gate ---------------------------------------------------
  if (!perm) return <View style={st.root} />;
  if (!perm.granted) {
    return (
      <View style={[st.root, st.center, { padding: 28 }]}>
        <Ionicons name="camera-outline" size={40} color={c.beam} />
        <Text style={st.h2}>Use a selfie</Text>
        <Text style={st.body}>
          We read colors and face proportions from one photo to set up your avatar.
          The photo never leaves your phone and isn't saved — only the settings it
          picks (like "skin tone 6") are kept.
        </Text>
        <Pressable style={st.primary} onPress={requestPerm}>
          <Text style={st.primaryTxt}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ padding: 14 }}>
          <Text style={{ color: c.dim }}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  // ---- review ------------------------------------------------------------
  if (result && patch) {
    const r = result.report;
    const set = (k, v) => setPatch((p) => ({ ...p, [k]: v }));

    return (
      <View style={st.root}>
        <View style={st.bar}>
          <Pressable onPress={retake} hitSlop={12} style={st.barBtn}>
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={st.barTitle}>Here's what we picked</Text>
            <Text style={st.barSub}>Change anything that's off</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {/* side by side: your photo vs the avatar */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={{ uri: shot.uri }} style={st.shot} />
            <View style={st.previewBox}>
              {AvatarPreview && preview
                ? <AvatarPreview recipe={preview} />
                : <Ionicons name="person" size={34} color={c.dim} />}
            </View>
          </View>

          {!r.hasLandmarks && (
            <View style={st.note}>
              <Ionicons name="information-circle-outline" size={16} color={c.warn} />
              <Text style={st.noteTxt}>
                We matched colors only — pick your face shape below.
              </Text>
            </View>
          )}

          <Swatches label="SKIN TONE" palette={PALETTES.SKIN_TONES}
            value={patch['body.skin']} onChange={(v) => set('body.skin', v)}
            confidence={r.skin && r.skin.confidence} />

          <Swatches label="HAIR COLOR" palette={PALETTES.HAIR_COLORS}
            value={patch['hair.color']} onChange={(v) => set('hair.color', v)}
            confidence={r.hair && r.hair.confidence} />

          <Swatches label="EYE COLOR" palette={PALETTES.EYE_COLORS}
            value={patch['face.eyes.color']} onChange={(v) => set('face.eyes.color', v)}
            confidence={r.eyes && r.eyes.confidence} />

          <Text style={st.label}>FACE SHAPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {FACE_SHAPES.map((s) => {
              const on = patch['face.shape'] === s.id;
              return (
                <Pressable key={s.id} onPress={() => set('face.shape', s.id)}
                  style={[st.chip, on && st.chipOn]}>
                  <Text style={{ color: on ? c.beamHot : c.text2, fontWeight: '600', fontSize: 13 }}>
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={st.privacy}>
            <Ionicons name="lock-closed" size={11} color={c.dim} />{'  '}
            Analysed on your phone. The photo isn't uploaded or stored.
          </Text>
        </ScrollView>

        <View style={st.footer}>
          <Pressable style={st.ghost} onPress={retake}>
            <Text style={{ color: c.text2, fontWeight: '600' }}>Retake</Text>
          </Pressable>
          <Pressable style={[st.primary, { flex: 1, marginTop: 0 }]}
            onPress={() => { onApply && onApply(patch); onClose && onClose(); }}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={st.primaryTxt}>Use this</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---- camera ------------------------------------------------------------
  return (
    <View style={st.root}>
      <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="front" />
      <View style={st.overlay} pointerEvents="box-none">
        <View style={st.bar}>
          <Pressable onPress={onClose} hitSlop={12} style={st.barBtn}>
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={st.barTitle}>Line up your face</Text>
            <Text style={st.barSub}>Even light, no hat, hair visible</Text>
          </View>
        </View>

        <View style={st.guide} pointerEvents="none" />

        <View style={st.shutterRow}>
          <Pressable style={st.shutter} onPress={capture} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" />
              : <View style={st.shutterInner} />}
          </Pressable>
          <Text style={st.hint}>Photo stays on your phone</Text>
        </View>
      </View>
    </View>
  );
}

function Swatches({ label, palette, value, onChange, confidence }) {
  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={st.label}>{label}</Text>
        {confidence != null && (
          <View style={[st.conf, { backgroundColor: confidence > 0.6 ? 'rgba(61,220,132,0.16)' : 'rgba(255,180,84,0.16)' }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '800',
              color: confidence > 0.6 ? c.ok : c.warn }}>
              {confidence > 0.6 ? 'GOOD MATCH' : 'CHECK THIS'}
            </Text>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 9, paddingVertical: 6 }}>
        {palette.map((o) => (
          <Pressable key={o.id} onPress={() => onChange(o.id)}
            style={[st.sw, { backgroundColor: o.hex }, o.id === value && st.swOn]} />
        ))}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.ink },
  center: { alignItems: 'center', justifyContent: 'center' },
  h2: { color: c.text, fontSize: 19, fontWeight: '700', marginTop: 14 },
  body: { color: c.text2, fontSize: 13.5, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingTop: 52, paddingBottom: 10,
  },
  barBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0009', borderWidth: 1, borderColor: c.border,
  },
  barTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
  barSub: { color: c.dim, fontSize: 11 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  guide: {
    alignSelf: 'center', width: '62%', aspectRatio: 0.8,
    borderWidth: 2, borderColor: '#FFFFFF55', borderRadius: 999,
  },
  shutterRow: { alignItems: 'center', paddingBottom: 40, gap: 10 },
  shutter: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: '#FFFFFF22',
    borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  hint: { color: '#FFFFFFAA', fontSize: 11 },
  shot: { width: 120, height: 160, borderRadius: 14, backgroundColor: c.surface2 },
  previewBox: {
    flex: 1, height: 160, borderRadius: 14, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  note: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
    backgroundColor: 'rgba(255,180,84,0.1)', borderRadius: 12, padding: 10,
  },
  noteTxt: { color: c.warn, fontSize: 12, flex: 1 },
  label: { color: c.dim, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  conf: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  sw: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swOn: { borderColor: c.beamHot, transform: [{ scale: 1.12 }] },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  chipOn: { backgroundColor: c.beamDim, borderColor: c.beam },
  privacy: { color: c.dim, fontSize: 11, marginTop: 22, textAlign: 'center', lineHeight: 16 },
  footer: {
    position: 'absolute', left: 16, right: 16, bottom: 28,
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  ghost: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.beam, borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 24, marginTop: 20,
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
