// Small picker for launching a game inside a room. Creates the session and
// hands you the sessionId — you then navigate to the matching screen and
// share the sessionId with the room however your app already shares state
// (room chat message, room state field, etc).
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

const GAMES = [
  { id: 'wildbeam', name: 'WildBeam', emoji: '🎴', players: '2-8', blurb: 'Match colors, drop Boosts, call LAST CARD!' },
  { id: 'matchblitz', name: 'Match Blitz', emoji: '🧠', players: '2-6', blurb: 'Memory pairs — match to keep your turn.' },
  // add your existing Ludo here when you port it into the engine
];

export default function GamePickerSheet({ socket, roomId, onCreated, onClose }) {
  const [busy, setBusy] = useState(null);

  const create = (gameId) => {
    setBusy(gameId);
    socket.emit('game:create', { roomId, gameId }, (res) => {
      setBusy(null);
      if (res.error) return console.warn('[games]', res.error);
      onCreated && onCreated(res.session); // { sessionId, gameId, ... }
    });
  };

  return (
    <View style={st.sheet}>
      <View style={st.handle} />
      <Text style={st.title}>Start a game</Text>
      {GAMES.map((g) => (
        <Pressable key={g.id} onPress={() => create(g.id)} disabled={!!busy} style={st.row}>
          <Text style={{ fontSize: 28 }}>{g.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{g.name} <Text style={st.players}>· {g.players}</Text></Text>
            <Text style={st.blurb}>{g.blurb}</Text>
          </View>
          <Text style={st.go}>{busy === g.id ? '…' : '›'}</Text>
        </Pressable>
      ))}
      {onClose && (
        <Pressable onPress={onClose} style={{ alignSelf: 'center', padding: 10 }}>
          <Text style={{ color: colors.dim }}>Close</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  sheet: {
    backgroundColor: colors.inkRaised, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 18, paddingBottom: 30, borderWidth: 1, borderColor: colors.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  players: { color: colors.dim, fontWeight: '400', fontSize: 12 },
  blurb: { color: colors.dim, fontSize: 12, marginTop: 2 },
  go: { color: colors.beam, fontSize: 22 },
});
