import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SPACE, RADIUS, SHADOW } from '@/constants';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/services/api';

// ── DiceBear adventurer option lists (from schema.json) ─────────────────────

const HAIR_OPTIONS = [
  'short01','short02','short03','short04','short05','short06','short07','short08',
  'short09','short10','short11','short12','short13','short14','short15','short16',
  'short17','short18','short19',
  'long01','long02','long03','long04','long05','long06','long07','long08',
  'long09','long10','long11','long12','long13','long14','long15','long16',
  'long17','long18','long19','long20','long21','long22','long23','long24',
  'long25','long26',
];

const EYES_OPTIONS = [
  'variant01','variant02','variant03','variant04','variant05','variant06',
  'variant07','variant08','variant09','variant10','variant11','variant12',
  'variant13','variant14','variant15','variant16','variant17','variant18',
  'variant19','variant20','variant21','variant22','variant23','variant24',
  'variant25','variant26',
];

const EYEBROWS_OPTIONS = [
  'variant01','variant02','variant03','variant04','variant05','variant06',
  'variant07','variant08','variant09','variant10','variant11','variant12',
  'variant13','variant14','variant15',
];

const MOUTH_OPTIONS = [
  'variant01','variant02','variant03','variant04','variant05','variant06',
  'variant07','variant08','variant09','variant10','variant11','variant12',
  'variant13','variant14','variant15','variant16','variant17','variant18',
  'variant19','variant20','variant21','variant22','variant23','variant24',
  'variant25','variant26','variant27','variant28','variant29','variant30',
];

const GLASSES_OPTIONS = ['variant01','variant02','variant03','variant04','variant05'];

const FEATURES_OPTIONS = ['mustache','blush','birthmark','freckles'];

const SKIN_COLORS = [
  'f9c9b6','f5cba7','e8b89a','d4956a','c47e47','a0522d','7b3d1e',
  'fde8d0','eecdb0','d4a87a','b07d4e','8a5a32',
];

const HAIR_COLORS = [
  '000000','3b1f0d','6b3522','a0522d','c4722a','d4a017','f5c842',
  'e8c08a','f0deb4','c8a2c8','9370db','4169e1',
  'ff6b6b','ff4500','dc143c','ffffff','808080','a9a9a9',
];

const BG_COLORS = [
  '0d0d14','1a1a2e','16213e','0f3460','533483','6b2d8b',
  '1b4332','2d6a4f','40916c','1e3a5f','023e8a','0077b6',
  '3a0000','7b0d00','b5000c','f5a623','e07b00','c85000',
];

type AvatarOptions = {
  hair: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  glasses: string | null;
  features: string | null;
  skinColor: string;
  backgroundColor: string;
};

const DEFAULT_OPTIONS: AvatarOptions = {
  hair: 'short01',
  hairColor: '000000',
  eyes: 'variant01',
  eyebrows: 'variant01',
  mouth: 'variant01',
  glasses: null,
  features: null,
  skinColor: 'f9c9b6',
  backgroundColor: '0d0d14',
};

type CategoryKey = keyof AvatarOptions;

interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  type: 'variants' | 'colors' | 'optional';
  options: string[];
}

const CATEGORIES: Category[] = [
  { key: 'hair',            label: 'Hair',     icon: 'person',          type: 'variants',  options: HAIR_OPTIONS },
  { key: 'eyes',            label: 'Eyes',     icon: 'eye',             type: 'variants',  options: EYES_OPTIONS },
  { key: 'eyebrows',        label: 'Brows',    icon: 'remove',          type: 'variants',  options: EYEBROWS_OPTIONS },
  { key: 'mouth',           label: 'Mouth',    icon: 'happy',           type: 'variants',  options: MOUTH_OPTIONS },
  { key: 'glasses',         label: 'Glasses',  icon: 'glasses',         type: 'optional',  options: GLASSES_OPTIONS },
  { key: 'features',        label: 'Features', icon: 'sparkles',        type: 'optional',  options: FEATURES_OPTIONS },
  { key: 'skinColor',       label: 'Skin',     icon: 'color-palette',   type: 'colors',    options: SKIN_COLORS },
  { key: 'hairColor',       label: 'Hair Col', icon: 'color-fill',      type: 'colors',    options: HAIR_COLORS },
  { key: 'backgroundColor', label: 'BG',       icon: 'images',          type: 'colors',    options: BG_COLORS },
];

function buildAvatarUrl(opts: AvatarOptions, size = 200): string {
  const params = new URLSearchParams({
    seed: 'custom',
    hair: opts.hair,
    hairColor: opts.hairColor,
    eyes: opts.eyes,
    eyebrows: opts.eyebrows,
    mouth: opts.mouth,
    skinColor: opts.skinColor,
    backgroundColor: opts.backgroundColor,
  });
  if (opts.glasses) {
    params.set('glasses', opts.glasses);
    params.set('glassesProbability', '100');
  }
  if (opts.features) {
    params.set('features', opts.features);
    params.set('featuresProbability', '100');
  }
  params.set('size', String(size));
  return `https://api.dicebear.com/9.x/adventurer/png?${params.toString()}`;
}

function parseExistingUrl(url: string): Partial<AvatarOptions> {
  try {
    if (!url.includes('dicebear.com')) return {};
    const u = new URL(url);
    const p = u.searchParams;
    return {
      hair:            p.get('hair')            ?? undefined,
      hairColor:       p.get('hairColor')       ?? undefined,
      eyes:            p.get('eyes')            ?? undefined,
      eyebrows:        p.get('eyebrows')        ?? undefined,
      mouth:           p.get('mouth')           ?? undefined,
      glasses:         p.get('glassesProbability') === '100' ? (p.get('glasses') ?? null) : null,
      features:        p.get('featuresProbability') === '100' ? (p.get('features') ?? null) : null,
      skinColor:       p.get('skinColor')       ?? undefined,
      backgroundColor: p.get('backgroundColor') ?? undefined,
    } as Partial<AvatarOptions>;
  } catch {
    return {};
  }
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function AvatarEditorScreen() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<CategoryKey>('hair');
  const [opts, setOpts] = useState<AvatarOptions>(() => ({
    ...DEFAULT_OPTIONS,
    ...parseExistingUrl(user?.avatar_url ?? ''),
  }));
  const [saving, setSaving] = useState(false);
  const isGuest = user?.is_guest;

  const previewUrl = buildAvatarUrl(opts);

  const setOpt = useCallback((key: CategoryKey, value: string | null) => {
    setOpts((prev) => ({ ...prev, [key]: value }));
  }, []);

  function randomize() {
    setOpts({
      hair:            randomFrom(HAIR_OPTIONS),
      hairColor:       randomFrom(HAIR_COLORS),
      eyes:            randomFrom(EYES_OPTIONS),
      eyebrows:        randomFrom(EYEBROWS_OPTIONS),
      mouth:           randomFrom(MOUTH_OPTIONS),
      glasses:         Math.random() > 0.6 ? randomFrom(GLASSES_OPTIONS) : null,
      features:        Math.random() > 0.7 ? randomFrom(FEATURES_OPTIONS) : null,
      skinColor:       randomFrom(SKIN_COLORS),
      backgroundColor: randomFrom(BG_COLORS),
    });
  }

  async function save() {
    if (isGuest) {
      Alert.alert('Sign in to save', 'Create a free account to save your avatar.');
      return;
    }
    setSaving(true);
    try {
      const avatarUrl = buildAvatarUrl(opts);
      await authApi.updateProfile({ avatar: avatarUrl });
      if (user) setUser({ ...user, avatar_url: avatarUrl });
      Toast.show({ type: 'success', text1: 'Avatar saved!' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save avatar' });
    } finally {
      setSaving(false);
    }
  }

  const activeCat = CATEGORIES.find((c) => c.key === activeTab)!;

  return (
    <View style={styles.root}>
      {/* ── Live preview ── */}
      <View style={styles.previewSection}>
        <View style={styles.previewBg}>
          <Image source={{ uri: previewUrl }} style={styles.preview} />
        </View>
        <TouchableOpacity style={styles.randomBtn} onPress={randomize}>
          <Ionicons name="dice-outline" size={18} color={COLORS.primary} />
          <Text style={styles.randomText}>Randomize</Text>
        </TouchableOpacity>
      </View>

      {/* ── Category tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, activeTab === cat.key && styles.tabActive]}
            onPress={() => setActiveTab(cat.key)}
          >
            <Ionicons
              name={cat.icon as never}
              size={14}
              color={activeTab === cat.key ? COLORS.primary : COLORS.muted}
            />
            <Text style={[styles.tabText, activeTab === cat.key && styles.tabTextActive]}>
              {cat.label}
            </Text>
            {/* Color dot for active non-null option */}
            {cat.type === 'colors' && opts[cat.key] && (
              <View style={[styles.colorDot, { backgroundColor: '#' + opts[cat.key] }]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Option grid ── */}
      <View style={styles.gridContainer}>
        {activeCat.type === 'colors' ? (
          /* Color swatches */
          <FlatList
            key="colors"
            data={activeCat.options}
            numColumns={6}
            keyExtractor={(v) => v}
            contentContainerStyle={styles.gridPad}
            renderItem={({ item }) => {
              const selected = opts[activeCat.key] === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.swatch,
                    { backgroundColor: '#' + item },
                    selected && styles.swatchSelected,
                  ]}
                  onPress={() => setOpt(activeCat.key, item)}
                >
                  {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          /* Variant grid — each cell shows avatar with that option swapped */
          <FlatList
            key={activeTab}
            data={
              activeCat.type === 'optional'
                ? [null, ...activeCat.options]
                : activeCat.options
            }
            numColumns={4}
            keyExtractor={(v) => v ?? '__none__'}
            contentContainerStyle={styles.gridPad}
            renderItem={({ item }) => {
              const selected = opts[activeCat.key] === item;
              const previewOpts = { ...opts, [activeCat.key]: item };
              const cellUrl = buildAvatarUrl(previewOpts, 96);
              return (
                <TouchableOpacity
                  style={[styles.cell, selected && styles.cellSelected]}
                  onPress={() => setOpt(activeCat.key, item)}
                >
                  {item === null ? (
                    <View style={styles.noneCell}>
                      <Ionicons name="close-circle-outline" size={28} color={COLORS.muted} />
                      <Text style={styles.noneText}>None</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: cellUrl }} style={styles.cellImg} />
                  )}
                  {selected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* ── Save button ── */}
      <View style={styles.footer}>
        {isGuest && (
          <Text style={styles.guestNote}>Sign in to save your avatar permanently</Text>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.background} />
              <Text style={styles.saveBtnText}>{isGuest ? 'Preview Only' : 'Save Avatar'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CELL_SIZE = 80;
const SWATCH_SIZE = 44;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  previewSection: {
    alignItems: 'center',
    paddingVertical: SPACE.lg,
    gap: SPACE.md,
  },
  previewBg: {
    width: 180,
    height: 180,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
    ...SHADOW.accent,
  },
  preview: { width: 180, height: 180 },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    backgroundColor: COLORS.accentMuted,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  randomText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  tabs: {
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.sm,
    gap: SPACE.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.accentMuted,
    borderColor: COLORS.primary + '66',
  },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  gridContainer: { flex: 1 },
  gridPad: { padding: SPACE.sm },

  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    margin: 5,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 4,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  cellSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2.5,
  },
  cellImg: { width: CELL_SIZE, height: CELL_SIZE },
  selectedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
  },
  noneCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  noneText: { color: COLORS.muted, fontSize: 10 },

  footer: {
    padding: SPACE.md,
    gap: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  guestNote: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACE.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.background, fontSize: 16, fontWeight: '700' },
});
