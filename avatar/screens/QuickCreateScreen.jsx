// 3-step first-run avatar creation (< 60 seconds): body -> face preset ->
// starter fit. Live stage updates on every tap; "Fine-tune later" is the
// Studio's job.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AvatarStage from '../three/AvatarStage';
import { useAvatarStore } from '../store';
import { ColorRow, Txt } from '../components';
import { colors, radius } from '../theme';
import { SKIN_TONES, HAIR_COLORS, BODY_TYPES, FACE_SHAPES } from '../../avatar-core';

const FACE_PRESETS = [
  { id: 'p1', label: 'Classic', shape: 'f1', eyes: 'e1', brows: 'br1' },
  { id: 'p2', label: 'Soft', shape: 'f6', eyes: 'e3', brows: 'br6' },
  { id: 'p3', label: 'Sharp', shape: 'f7', eyes: 'e4', brows: 'br5' },
  { id: 'p4', label: 'Bright', shape: 'f4', eyes: 'e6', brows: 'br2' },
  { id: 'p5', label: 'Calm', shape: 'f2', eyes: 'e5', brows: 'br4' },
  { id: 'p6', label: 'Bold', shape: 'f3', eyes: 'e2', brows: 'br3' },
];

const STARTER_FITS = [
  { id: 'f1', label: 'Slate', top: 'it_tee_slate', bottom: 'it_jeans_ink', shoes: 'it_sneaker_white' },
];

export default function QuickCreateScreen({ onDone }) {
  const store = useAvatarStore();
  const { draft, catalogIndex, itemsByCategory, ownedSet, setPart, save } = store;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const hairOptions = useMemo(
    () => (itemsByCategory.hair || [])
      .filter((it) => it.unlock_type === 'default' || ownedSet.has(it.id)),
    [itemsByCategory, ownedSet],
  );

  if (!draft) {
    return <View style={[st.root, st.center]}><Txt s="dim">Loading…</Txt></View>;
  }

  const applyFacePreset = (p) => {
    setPart('face.shape', p.shape);
    setPart('face.eyes.id', p.eyes);
    setPart('face.brows', p.brows);
  };

  const finish = async () => {
    setSaving(true);
    const result = await save(null); // snapshots come later from the Studio
    setSaving(false);
    onDone && onDone(result);
  };

  const steps = [
    {
      title: 'Pick your build',
      content: (
        <>
          <View style={st.presetRow}>
            {BODY_TYPES.map((b) => (
              <Pressable key={b.id} onPress={() => setPart('body.type', b.id)}
                style={[st.presetBtn, draft.body.type === b.id && st.presetActive]}>
                <Txt s="h2">{b.name}</Txt>
              </Pressable>
            ))}
          </View>
          <Txt s="dim" style={st.hint}>Skin tone</Txt>
          <ColorRow options={SKIN_TONES} value={draft.body.skin}
            onChange={(v) => setPart('body.skin', v)} />
        </>
      ),
    },
    {
      title: 'Pick a face',
      content: (
        <View style={st.presetRow}>
          {FACE_PRESETS.map((p) => (
            <Pressable key={p.id} onPress={() => applyFacePreset(p)}
              style={[st.presetBtn, draft.face.shape === p.shape && st.presetActive]}>
              <Txt s="h2">{p.label}</Txt>
            </Pressable>
          ))}
        </View>
      ),
    },
    {
      title: 'Hair + starter fit',
      content: (
        <>
          <View style={st.presetRow}>
            {hairOptions.map((h) => (
              <Pressable key={h.id} onPress={() => setPart('hair.id', h.id)}
                style={[st.presetBtn, draft.hair.id === h.id && st.presetActive]}>
                <Txt s="h2">{h.name}</Txt>
              </Pressable>
            ))}
          </View>
          <Txt s="dim" style={st.hint}>Hair color</Txt>
          <ColorRow options={HAIR_COLORS} value={draft.hair.color}
            onChange={(v) => setPart('hair.color', v)} />
        </>
      ),
    },
  ];

  return (
    <View style={st.root}>
      <Txt s="h1" style={st.title}>{steps[step].title}</Txt>
      <Txt s="dim" style={{ textAlign: 'center' }}>Step {step + 1} of 3 · fine-tune anytime in the Studio</Txt>

      <AvatarStage
        recipe={draft}
        catalogIndex={catalogIndex}
        framing={step === 1 ? 'face' : 'full'}
        style={st.stage}
      />

      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 8 }}>
        {steps[step].content}
      </ScrollView>

      <View style={st.footer}>
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)} style={st.ghostBtn}>
            <Txt s="h2">Back</Txt>
          </Pressable>
        ) : <View style={{ width: 80 }} />}
        <Pressable
          onPress={step < 2 ? () => setStep(step + 1) : finish}
          disabled={saving}
          style={[st.nextBtn, saving && { opacity: 0.5 }]}>
          <Txt style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {step < 2 ? 'Next' : saving ? 'Saving…' : "Let's go"}
          </Txt>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingTop: 60 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  stage: { height: '42%', margin: 14, borderRadius: radius.lg },
  presetRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  presetBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.inkRaised, borderWidth: 1.5, borderColor: colors.border,
  },
  presetActive: { borderColor: colors.beam, backgroundColor: colors.beam + '18' },
  hint: { marginLeft: 14, marginTop: 8, marginBottom: 6 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 34,
  },
  ghostBtn: { padding: 12 },
  nextBtn: {
    backgroundColor: colors.beam, paddingHorizontal: 34, paddingVertical: 14,
    borderRadius: radius.pill,
  },
});
