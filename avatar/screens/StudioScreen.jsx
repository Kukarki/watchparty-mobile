// Avatar Studio — live 3D stage on top, category tabs + option carousels
// below (design doc §2). Camera auto-frames: FACE tab zooms to the face,
// everything else shows the full body.
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert, FlatList, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import AvatarStage from '../three/AvatarStage';
import { useAvatarStore } from '../store';
import { Chip, ChipRow, ColorRow, ItemCard, HSlider, Section, Txt } from '../components';
import { colors, radius } from '../theme';
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES, EYE_STYLES,
  BROW_STYLES, NOSE_STYLES, EXPRESSIONS, BODY_TYPES, POSES,
} from '../../avatar-core';

const TABS = [
  { id: 'face', label: 'FACE' }, { id: 'hair', label: 'HAIR' },
  { id: 'body', label: 'BODY' }, { id: 'fit', label: 'FIT' },
  { id: 'acc', label: 'ACC' }, { id: 'fx', label: 'FX' },
  { id: 'bg', label: 'BG' },
];

const FIT_SLOTS = [
  { id: 'top', label: 'Tops' }, { id: 'bottom', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' }, { id: 'outfit_full', label: 'Full sets' },
];
const ACC_SLOTS = [
  { id: 'acc_head', label: 'Head' }, { id: 'acc_ears', label: 'Ears' },
  { id: 'acc_face', label: 'Face' }, { id: 'acc_hands', label: 'Hands' },
  { id: 'acc_back', label: 'Back' },
];
const FACE_PARTS = [
  { id: 'shape', label: 'Shape' }, { id: 'eyes', label: 'Eyes' },
  { id: 'brows', label: 'Brows' }, { id: 'nose', label: 'Nose' },
  { id: 'skin', label: 'Skin' }, { id: 'expression', label: 'Mood' },
];

export default function StudioScreen({ onClose, onSaved }) {
  const stageRef = useRef(null);
  const store = useAvatarStore();
  const {
    draft, catalogIndex, itemsByCategory, ownedSet, progression,
    setPart, equipItem, undo, randomize, resetDraft, save, dirty, saving, history,
  } = store;

  const [tab, setTab] = useState('face');
  const [facePart, setFacePart] = useState('shape');
  const [fitSlot, setFitSlot] = useState('top');
  const [accSlot, setAccSlot] = useState('acc_head');

  const level = (progression && progression.level) || 1;
  const framing = tab === 'face' ? 'face' : tab === 'hair' ? 'head' : 'full';

  const items = useMemo(() => {
    const cat = tab === 'hair' ? 'hair'
      : tab === 'fit' ? fitSlot
      : tab === 'acc' ? accSlot
      : tab === 'fx' ? 'effect'
      : tab === 'bg' ? 'background' : null;
    return cat ? (itemsByCategory[cat] || []) : [];
  }, [tab, fitSlot, accSlot, itemsByCategory]);

  if (!draft) {
    return (
      <View style={st.root}>
        <View style={st.header}>
          <Pressable onPress={() => onClose && onClose()} hitSlop={10}>
            <Txt s="h1">✕</Txt>
          </Pressable>
          <Txt s="h2">Avatar Studio</Txt>
          <View style={{ width: 80 }} />
        </View>
        <View style={[st.center, { flex: 1 }]}>
          <Txt s="dim">Loading Studio…</Txt>
        </View>
      </View>
    );
  }

  const isEquipped = (item) => {
    const r = draft;
    switch (item.category) {
      case 'hair': return r.hair.id === item.id;
      case 'top': return r.outfit.top === item.id && !r.outfit.full;
      case 'bottom': return r.outfit.bottom === item.id && !r.outfit.full;
      case 'shoes': return r.outfit.shoes === item.id;
      case 'outfit_full': return r.outfit.full === item.id;
      case 'acc_head': return r.accessories.head === item.id;
      case 'acc_ears': return r.accessories.ears === item.id;
      case 'acc_face': return r.accessories.face === item.id;
      case 'acc_hands': return r.accessories.hands === item.id;
      case 'acc_back': return r.accessories.back === item.id;
      case 'effect': return r.effects.includes(item.id);
      case 'frame': return r.frame === item.id;
      case 'background': return r.background === item.id;
      default: return false;
    }
  };

  const handleClose = () => {
    if (!dirty) return onClose && onClose();
    Alert.alert('Discard changes?', 'Your edits are not saved yet.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { resetDraft(); onClose && onClose(); } },
    ]);
  };

  const handleSave = async () => {
    const result = await save(stageRef);
    if (result.ok) {
      onSaved && onSaved(result);
      onClose && onClose();
    } else {
      Alert.alert('Cannot save yet', (result.errors || []).slice(0, 4).join('\n'));
    }
  };

  return (
    <View style={st.root}>
      {/* header */}
      <View style={st.header}>
        <Pressable onPress={handleClose} hitSlop={10}><Txt s="h1">✕</Txt></Pressable>
        <Txt s="h2">Avatar Studio</Txt>
        <View style={st.headerRight}>
          <Pressable onPress={undo} disabled={!history.length} hitSlop={8}>
            <Txt s="h1" style={{ opacity: history.length ? 1 : 0.3 }}>↺</Txt>
          </Pressable>
          <Pressable onPress={randomize} hitSlop={8}><Txt s="h1">🎲</Txt></Pressable>
          <Pressable onPress={handleSave} disabled={saving || !dirty}
            style={[st.saveBtn, (!dirty || saving) && { opacity: 0.4 }]}>
            <Txt style={{ color: '#fff', fontWeight: '700' }}>
              {saving ? 'Saving…' : 'Save'}
            </Txt>
          </Pressable>
        </View>
      </View>

      {/* live stage */}
      <AvatarStage
        ref={stageRef}
        recipe={draft}
        catalogIndex={catalogIndex}
        framing={framing}
        style={st.stage}
      />

      {/* expression quick-row (always visible under the stage) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={st.exprRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
        {EXPRESSIONS.map((e) => (
          <Pressable key={e.id}
            onPress={() => setPart('face.expression', e.id)}
            style={[st.exprBtn, draft.face.expression === e.id && st.exprActive]}>
            <Txt style={{ fontSize: 18 }}>{e.emoji}</Txt>
          </Pressable>
        ))}
      </ScrollView>

      {/* category tabs */}
      <View style={st.tabs}>
        {TABS.map((t) => (
          <Chip key={t.id} label={t.label} active={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
      </View>

      {/* option panel */}
      <ScrollView style={st.panel} contentContainerStyle={{ paddingVertical: 12, gap: 14 }}>
        {tab === 'face' && (
          <>
            <ChipRow options={FACE_PARTS} value={facePart} onChange={setFacePart} />
            {facePart === 'shape' && (
              <Section label="Face shape">
                <ChipRow options={FACE_SHAPES} value={draft.face.shape}
                  onChange={(v) => setPart('face.shape', v)} />
              </Section>
            )}
            {facePart === 'eyes' && (
              <>
                <Section label="Eye style">
                  <ChipRow options={EYE_STYLES} value={draft.face.eyes.id}
                    onChange={(v) => setPart('face.eyes.id', v)} />
                </Section>
                <Section label="Eye color">
                  <ColorRow options={EYE_COLORS} value={draft.face.eyes.color}
                    onChange={(v) => setPart('face.eyes.color', v)} />
                </Section>
              </>
            )}
            {facePart === 'brows' && (
              <Section label="Brows">
                <ChipRow options={BROW_STYLES} value={draft.face.brows}
                  onChange={(v) => setPart('face.brows', v)} />
              </Section>
            )}
            {facePart === 'nose' && (
              <Section label="Nose">
                <ChipRow options={NOSE_STYLES} value={draft.face.nose}
                  onChange={(v) => setPart('face.nose', v)} />
              </Section>
            )}
            {facePart === 'skin' && (
              <Section label="Skin tone">
                <ColorRow options={SKIN_TONES} value={draft.body.skin}
                  onChange={(v) => setPart('body.skin', v)} />
              </Section>
            )}
            {facePart === 'expression' && (
              <Section label="Default expression">
                <ChipRow options={EXPRESSIONS} value={draft.face.expression}
                  onChange={(v) => setPart('face.expression', v)} />
              </Section>
            )}
          </>
        )}

        {tab === 'body' && (
          <>
            <Section label="Body type">
              <ChipRow options={BODY_TYPES} value={draft.body.type}
                onChange={(v) => setPart('body.type', v)} />
            </Section>
            <Section label="Height">
              <View style={{ paddingHorizontal: 14 }}>
                <HSlider value={draft.body.height}
                  onChange={(v) => setPart('body.height', Math.round(v * 100) / 100)}
                  width={280} />
              </View>
            </Section>
            <Section label="Idle pose">
              <ChipRow options={POSES} value={draft.pose}
                onChange={(v) => setPart('pose', v)} />
            </Section>
          </>
        )}

        {tab === 'hair' && (
          <Section label="Hair color">
            <ColorRow options={HAIR_COLORS} value={draft.hair.color}
              onChange={(v) => setPart('hair.color', v)} />
          </Section>
        )}

        {tab === 'fit' && <ChipRow options={FIT_SLOTS} value={fitSlot} onChange={setFitSlot} />}
        {tab === 'acc' && <ChipRow options={ACC_SLOTS} value={accSlot} onChange={setAccSlot} />}
        {tab === 'fx' && (
          <Txt s="dim" style={{ paddingHorizontal: 14 }}>
            Equip up to 2 effects. Effect items unlock at Level 30.
          </Txt>
        )}

        {items.length > 0 && (
          <FlatList
            horizontal
            data={items}
            keyExtractor={(it) => it.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                owned={ownedSet.has(item.id) || item.unlock_type === 'default'}
                equipped={isEquipped(item)}
                level={level}
                onPress={equipItem}
              />
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  saveBtn: {
    backgroundColor: colors.beam, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.pill,
  },
  stage: { height: '38%', marginHorizontal: 12, borderRadius: radius.lg },
  exprRow: { flexGrow: 0, marginTop: 8 },
  exprBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.inkRaised, borderWidth: 1, borderColor: colors.border,
  },
  exprActive: { borderColor: colors.beam, backgroundColor: colors.beam + '22' },
  tabs: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 12, paddingTop: 10,
  },
  panel: { flex: 1 },
});
