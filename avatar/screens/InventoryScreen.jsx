// Inventory: rarity-graded grid of everything in the catalog, filterable by
// category and owned/all. Tapping an owned item equips it into the Studio
// draft (design doc §4).
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useAvatarStore } from '../store';
import { Chip, ChipRow, ItemCard, Txt } from '../components';
import { colors } from '../theme';
import { CATEGORIES } from '../../avatar-core';

const CATEGORY_LABELS = {
  all: 'All', hair: 'Hair', top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes',
  outfit_full: 'Full sets', acc_head: 'Head', acc_ears: 'Ears', acc_face: 'Face',
  acc_hands: 'Hands', acc_back: 'Back', effect: 'Effects', frame: 'Frames',
  background: 'Backdrops',
};

export default function InventoryScreen({ onEquip, onClose }) {
  const { catalog, ownedSet, progression, equipItem } = useAvatarStore();
  const [category, setCategory] = useState('all');
  const [ownedOnly, setOwnedOnly] = useState(true);

  const level = (progression && progression.level) || 1;

  const data = useMemo(() => catalog.filter((it) => {
    if (category !== 'all' && it.category !== category) return false;
    const owned = ownedSet.has(it.id) || it.unlock_type === 'default';
    return ownedOnly ? owned : true;
  }), [catalog, category, ownedOnly, ownedSet]);

  const ownedCount = useMemo(
    () => catalog.filter((it) => ownedSet.has(it.id) || it.unlock_type === 'default').length,
    [catalog, ownedSet],
  );

  const categoryOptions = ['all', ...CATEGORIES].map((c) => ({
    id: c, name: CATEGORY_LABELS[c] || c,
  }));

  return (
    <View style={st.root}>
      <View style={st.header}>
        {onClose && <Pressable onPress={onClose} hitSlop={10}><Txt s="h1">✕</Txt></Pressable>}
        <Txt s="h1">Inventory</Txt>
        <Txt s="dim">{ownedCount}/{catalog.length}</Txt>
      </View>

      <View style={st.filterRow}>
        <Chip label="Owned" active={ownedOnly} onPress={() => setOwnedOnly(true)} />
        <Chip label="All items" active={!ownedOnly} onPress={() => setOwnedOnly(false)} />
      </View>
      <ChipRow options={categoryOptions} value={category} onChange={setCategory}
        style={{ flexGrow: 0, marginTop: 8 }} />

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 14 }}
        contentContainerStyle={{ gap: 10, paddingVertical: 14, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const owned = ownedSet.has(item.id) || item.unlock_type === 'default';
          return (
            <ItemCard
              item={item}
              owned={owned}
              equipped={false}
              level={level}
              size={106}
              onPress={(it) => {
                if (!owned) return;
                equipItem(it);
                onEquip && onEquip(it);
              }}
            />
          );
        }}
        ListEmptyComponent={(
          <Txt s="dim" style={{ textAlign: 'center', marginTop: 30 }}>
            Nothing here yet — level up and keep your streak to earn drops.
          </Txt>
        )}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingTop: 54 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
});
