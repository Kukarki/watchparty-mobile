// Shop: today's featured rotation (2 discounted), full purchasable catalog
// by category, coins/gems balances, confirm-to-buy. Prices shown here are
// display only — the server recomputes them at purchase.
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AvatarApi } from '../api';
import { useAvatarStore } from '../store';
import { Chip, ChipRow, ItemCard, Txt } from '../components';
import { colors, radius, rarity as RARITY } from '../theme';

const CATEGORY_LABELS = {
  all: 'All', hair: 'Hair', top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes',
  outfit_full: 'Full sets', acc_head: 'Head', acc_ears: 'Ears', acc_face: 'Face',
  acc_hands: 'Hands', acc_back: 'Back', effect: 'Effects', frame: 'Frames',
  background: 'Backdrops',
};

function PriceTag({ price, discountPct, owned, locked }) {
  if (owned) return <Txt s="dim" style={{ fontSize: 11 }}>Owned ✓</Txt>;
  if (locked) return <Txt s="dim" style={{ fontSize: 11 }}>🔒 {locked}</Txt>;
  const parts = [];
  if (price.coins != null) parts.push(`🪙 ${price.coins.toLocaleString()}`);
  if (price.gems != null) parts.push(`💎 ${price.gems.toLocaleString()}`);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Txt style={{ fontSize: 12, color: colors.amber, fontWeight: '700' }}>
        {parts.join('  ')}
      </Txt>
      {discountPct > 0 && (
        <View style={st.dealBadge}><Txt style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>-{discountPct}%</Txt></View>
      )}
    </View>
  );
}

export default function ShopScreen({ onClose }) {
  const store = useAvatarStore();
  const { ownedSet, progression, purchase } = store;
  const [shop, setShop] = useState(null);
  const [category, setCategory] = useState('all');
  const [busy, setBusy] = useState(null);

  const load = () => AvatarApi.shop().then(setShop).catch((e) => Alert.alert('Shop', e.message));
  useEffect(() => { load(); }, []);

  const level = (shop && shop.level) || (progression && progression.level) || 1;
  const wallet = (shop && shop.wallet) || (progression && progression.wallet) || { coins: 0, gems: 0 };

  const catalog = useMemo(() => {
    if (!shop) return [];
    return shop.catalog.filter((it) => category === 'all' || it.category === category);
  }, [shop, category]);

  const isOwned = (it) => it.owned || ownedSet.has(it.id);
  const lockedText = (it) => (it.min_level > level ? `Lv ${it.min_level}` : null);

  const buy = (it, discountPct = 0) => {
    if (isOwned(it) || lockedText(it)) return;
    const cut = (v) => (v == null ? null : Math.round(v * (100 - discountPct) / 100));
    const coins = discountPct ? cut(it.price_coins) : it.price_coins;
    const gems = discountPct ? cut(it.price_gems) : it.price_gems;
    const priceStr = coins != null ? `${coins.toLocaleString()} coins` : `${gems.toLocaleString()} gems`;

    Alert.alert(`Buy ${it.name}?`, `${it.rarity} ${CATEGORY_LABELS[it.category] || it.category} · ${priceStr}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Buy',
        onPress: async () => {
          setBusy(it.id);
          try {
            const res = await purchase(it, coins != null ? 'coins' : 'gems');
            setShop((s) => s ? { ...s, wallet: res.wallet } : s);
            load();
            Alert.alert('Unlocked! 🎉', `${it.name} is in your inventory.`);
          } catch (err) {
            Alert.alert(
              err.status === 402 ? 'Not enough funds' : 'Purchase failed',
              err.message,
            );
          } finally { setBusy(null); }
        },
      },
    ]);
  };

  if (!shop) {
    return <View style={[st.root, st.center]}><Txt s="dim">Opening shop…</Txt></View>;
  }

  return (
    <View style={st.root}>
      <View style={st.header}>
        {onClose && <Pressable onPress={onClose} hitSlop={10}><Txt s="h1">✕</Txt></Pressable>}
        <Txt s="h1">Shop</Txt>
        <Txt s="dim">
          🪙 {Number(wallet.coins).toLocaleString()}  💎 {Number(wallet.gems).toLocaleString()}
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Txt s="dim" style={st.sectionLabel}>FEATURED TODAY · rotates at UTC midnight</Txt>
        <FlatList
          horizontal
          data={shop.featured}
          keyExtractor={(it) => it.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
          renderItem={({ item }) => (
            <View style={st.featuredCell}>
              <ItemCard
                item={item}
                owned={isOwned(item)}
                equipped={false}
                level={level}
                size={110}
                onPress={() => buy(item, item.discountPct)}
              />
              <PriceTag
                price={item.price}
                discountPct={item.discountPct}
                owned={isOwned(item)}
                locked={lockedText(item)}
              />
            </View>
          )}
        />

        <Txt s="dim" style={[st.sectionLabel, { marginTop: 18 }]}>CATALOG</Txt>
        <ChipRow
          options={['all', ...new Set(shop.catalog.map((i) => i.category))].map((c) => ({
            id: c, name: CATEGORY_LABELS[c] || c,
          }))}
          value={category}
          onChange={setCategory}
          style={{ flexGrow: 0 }}
        />

        <View style={st.grid}>
          {catalog.map((item) => (
            <View key={item.id} style={{ alignItems: 'center', gap: 4 }}>
              <ItemCard
                item={item}
                owned={isOwned(item)}
                equipped={false}
                level={level}
                size={106}
                onPress={() => buy(item)}
              />
              <PriceTag price={item.price} discountPct={0}
                owned={isOwned(item)} locked={lockedText(item)} />
              {busy === item.id && <Txt s="dim" style={{ fontSize: 10 }}>buying…</Txt>}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingTop: 54 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginLeft: 16, marginBottom: 8,
  },
  featuredCell: { alignItems: 'center', gap: 4 },
  dealBadge: {
    backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 14, paddingTop: 12, justifyContent: 'flex-start',
  },
});
