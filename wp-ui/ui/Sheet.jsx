// The three-dot menu. One component, used for rooms, people, tracks, messages.
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Icon from './Icon';
import { Txt } from './kit';
import { c, r, sp } from './tokens';

/**
 * <ActionSheet
 *   visible={!!target} title="Movie night"
 *   actions={[{ icon:'share-social-outline', label:'Share room', onPress },
 *             { icon:'flag-outline', label:'Report', danger:true, onPress }]}
 *   onClose={() => setTarget(null)} />
 */
export default function ActionSheet({ visible, title, subtitle, actions = [], onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={st.grabber} />
          {title ? (
            <View style={{ paddingHorizontal: sp.l, paddingBottom: sp.m }}>
              <Txt s="h3">{title}</Txt>
              {subtitle ? <Txt s="cap">{subtitle}</Txt> : null}
            </View>
          ) : null}
          {actions.map((a, i) => (
            <Pressable key={i}
              onPress={() => { onClose && onClose(); a.onPress && a.onPress(); }}
              style={({ pressed }) => [st.item, pressed && { backgroundColor: c.surface2 }]}>
              <Icon name={a.icon} size={19} color={a.danger ? c.danger : c.text2} />
              <Txt style={a.danger ? { color: c.danger } : null}>{a.label}</Txt>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={st.cancel}>
            <Txt style={{ fontWeight: '700', color: c.text2 }}>Cancel</Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl,
    paddingTop: sp.m, paddingBottom: 30, borderTopWidth: 1, borderColor: c.border,
  },
  grabber: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: c.borderHi,
    alignSelf: 'center', marginBottom: sp.m,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    paddingVertical: 14, paddingHorizontal: sp.l,
  },
  cancel: {
    marginTop: sp.s, marginHorizontal: sp.l, paddingVertical: 13,
    alignItems: 'center', borderRadius: r.md, backgroundColor: c.surface2,
  },
});
