import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  PanResponder,
  Animated,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';
import { COLORS, EMOJI_REACTIONS, SOCKET_EVENTS, SPACE, RADIUS } from '@/constants';
import { socketService } from '@/services/socket';
import { useRoomStore } from '@/stores/room.store';
import { useAuthStore } from '@/stores/auth.store';
import { hapticLight, hapticMedium } from '@/services/haptics';
import { ChatMessage } from '@/types';

const CHAT_THEMES = [
  { id: 'purple', label: 'Indigo', color: '#7C3AED' },
  { id: 'blue',   label: 'Blue',   color: '#2563EB' },
  { id: 'green',  label: 'Emerald',color: '#059669' },
  { id: 'orange', label: 'Amber',  color: '#D97706' },
  { id: 'rose',   label: 'Rose',   color: '#E11D48' },
  { id: 'teal',   label: 'Teal',   color: '#0891B2' },
];
const THEME_STORAGE_KEY = '@chat_theme';

function useChatTheme() {
  const [themeId, setThemeId] = useState('purple');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((v) => { if (v) setThemeId(v); }).catch(() => {});
  }, []);

  const saveTheme = (id: string) => {
    setThemeId(id);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, id).catch(() => {});
  };

  const color = CHAT_THEMES.find((t) => t.id === themeId)?.color ?? COLORS.primary;
  return { themeId, color, saveTheme };
}

// ── Full emoji keyboard ──────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    label: '😀 Smileys',
    emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤧','🥴','😇','🥳','🥸','🤠','🤡','🤥','🤫','🤭','🧐','🤓'],
  },
  {
    label: '👋 Gestures',
    emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','👀','👁','👅','👄','🦷','🦴'],
  },
  {
    label: '❤️ Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☯️','🕉','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘'],
  },
  {
    label: '🎉 Party',
    emojis: ['🎉','🎊','🎈','🎁','🎀','🎗','🎟','🎫','🎖','🏆','🥇','🥈','🥉','🏅','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎹','🥁','🪘','🎷','🎺','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩'],
  },
  {
    label: '🔥 Hype',
    emojis: ['🔥','💥','⚡','✨','💫','🌟','⭐','🌠','☄️','💢','💨','💦','💧','🌊','🌀','🌈','🌤','⛅','🌥','🌦','🌧','⛈','🌩','🌪','🌫','🌬','🌀','🌈','🌂','☂️','☔','⛱','⚡','❄️','☃️','⛄','🌡','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔'],
  },
  {
    label: '🍿 Food',
    emojis: ['🍿','🍕','🍔','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
  },
  {
    label: '💋 Couples',
    emojis: ['💋','😘','😍','🥰','😚','😗','🫦','👄','💏','👫','👬','👭','💑','💕','💞','💓','💗','💖','💘','💝','❣️','💔','🫀','😻','💌','🌹','🌷','💐','🍓','🍑','🍒','🫐','🍫','🍷','🥂','🕯️','🛏️','🛁','🧴','🧸','🎀','👙','👗','💎','💍','🩱','🩲','🩳','🫐','🔑','🗝️','💯','🔥','😈','🥵','🤤','😋','👅','🫣','🙈','🌙','⭐','✨','💫','🌸','🌺','🌻','🌼','🦋','🌊','🏖️','🌅','🌄','🌃','🌉'],
  },
  {
    label: '🐶 Animals',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🪳','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐆','🐅','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🦌','🐑','🐏','🐐','🦙','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔'],
  },
];

interface ChatPanelProps {
  roomId: string;
}

// ── Swipeable message wrapper ─────────────────────────────────────────────────
function SwipeableMessage({
  msg,
  isOwn,
  onLongPress,
  onSwipeReply,
  themeColor,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onLongPress: () => void;
  onSwipeReply: (msg: ChatMessage) => void;
  themeColor: string;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { dx }) => {
        if (dx > 0 && dx < 72) translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > 48) {
          onSwipeReply(msg);
          hapticLight();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
      <MessageBubble msg={msg} isOwn={isOwn} onLongPress={onLongPress} themeColor={themeColor} />
    </Animated.View>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isOwn,
  onLongPress,
  themeColor,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onLongPress: () => void;
  themeColor: string;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const sendReaction = (emoji: string) => {
    socketService.emit(SOCKET_EVENTS.CHAT_REACTION, {
      roomId: msg.room_id,
      messageId: msg.id,
      emoji,
    });
    setShowPicker(false);
  };

  return (
    <TouchableOpacity
      onLongPress={() => { setShowPicker(false); onLongPress(); }}
      onPress={() => showPicker && setShowPicker(false)}
      activeOpacity={0.9}
      style={[
        styles.bubble,
        isOwn
          ? [styles.bubbleOwn, { backgroundColor: themeColor }]
          : styles.bubbleOther,
      ]}
      accessibilityLabel={`${msg.username ?? 'User'}: ${msg.content}`}
      accessibilityRole="text"
    >
      {!isOwn && <Text style={[styles.username, { color: themeColor }]}>{msg.username}</Text>}
      {msg.replyTo && (
        <View style={[styles.replyQuote, { borderLeftColor: themeColor }]}>
          <Text style={styles.replyQuoteText} numberOfLines={1}>{msg.replyTo}</Text>
        </View>
      )}
      <Text style={styles.msgText}>{msg.content}</Text>
      <Text style={styles.time}>{format(new Date(msg.created_at), 'HH:mm')}</Text>

      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <View style={styles.reactionsRow}>
          {Object.entries(msg.reactions).map(([emoji, users]) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => sendReaction(emoji)}
              style={styles.reactionChip}
              accessibilityLabel={`React with ${emoji}`}
            >
              <Text style={styles.reactionEmoji}>{emoji} {(users as string[]).length}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showPicker && (
        <View style={styles.reactionPicker}>
          {EMOJI_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => sendReaction(emoji)}
              style={styles.emojiBtn}
              accessibilityLabel={`React ${emoji}`}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ users }: { users: string[] }) {
  if (users.length === 0) return null;
  const label =
    users.length === 1
      ? `${users[0]} is typing…`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing…`
      : 'Several people are typing…';

  return (
    <View style={styles.typingRow} accessibilityLabel={label} accessibilityLiveRegion="polite">
      <View style={styles.typingDots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.typingDot, { opacity: 0.4 + i * 0.3 }]} />
        ))}
      </View>
      <Text style={styles.typingText}>{label}</Text>
    </View>
  );
}

// ── Reply preview bar ─────────────────────────────────────────────────────────
function ReplyBar({ msg, onCancel }: { msg: ChatMessage; onCancel: () => void }) {
  return (
    <View style={styles.replyBar}>
      <View style={styles.replyBarLine} />
      <View style={{ flex: 1 }}>
        <Text style={styles.replyBarLabel}>Replying to {msg.username}</Text>
        <Text style={styles.replyBarContent} numberOfLines={1}>{msg.content}</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.replyBarClose} accessibilityLabel="Cancel reply">
        <Ionicons name="close" size={16} color={COLORS.muted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Theme picker ──────────────────────────────────────────────────────────────
function ThemePicker({ visible, themeId, onSelect, onClose }: {
  visible: boolean; themeId: string; onSelect: (id: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.themeBackdrop} onPress={onClose} />
      <View style={styles.themeSheet}>
        <View style={styles.themeGrabber} />
        <Text style={styles.themeTitle}>Chat Theme</Text>
        <View style={styles.themeGrid}>
          {CHAT_THEMES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.themeChip, { backgroundColor: t.color },
                themeId === t.id && styles.themeChipActive]}
              onPress={() => { onSelect(t.id); onClose(); }}>
              <Text style={styles.themeChipLabel}>{t.label}</Text>
              {themeId === t.id && <Text style={styles.themeCheck}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ── Main ChatPanel ────────────────────────────────────────────────────────────
export function ChatPanel({ roomId }: ChatPanelProps) {
  const { messages, typingUsers } = useRoomStore();
  const { user } = useAuthStore();
  const { themeId, color: themeColor, saveTheme } = useChatTheme();
  const [text, setText] = useState('');
  const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, []);

  const filteredMessages = useMemo(
    () =>
      showSearch && searchQuery
        ? messages.filter((m) =>
            m.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : messages,
    [messages, searchQuery, showSearch]
  );

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    hapticLight();
    socketService.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      roomId,
      content: trimmed,
      type: 'text',
      replyTo: replyTo ? replyTo.content.slice(0, 80) : undefined,
    });
    socketService.emit(SOCKET_EVENTS.CHAT_STOP_TYPING, { roomId, username: user.username });
    setText('');
    setReplyTo(null);
    listRef.current?.scrollToEnd({ animated: true });
  }, [text, user, roomId, replyTo]);

  function handleTextChange(val: string) {
    setText(val);
    if (!user) return;
    socketService.emit(SOCKET_EVENTS.CHAT_TYPING, { roomId, username: user.username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit(SOCKET_EVENTS.CHAT_STOP_TYPING, { roomId, username: user?.username });
    }, 2500);
  }

  function insertEmoji(emoji: string) {
    setText((t) => t + emoji);
  }

  function toggleEmojiKeyboard() {
    setShowEmojiKeyboard((v) => {
      if (!v) inputRef.current?.blur();
      else inputRef.current?.focus();
      return !v;
    });
  }

  function showMessageMenu(msg: ChatMessage, isOwn: boolean) {
    hapticMedium();
    const options: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '↩ Reply',
        onPress: () => {
          setReplyTo(msg);
          setShowEmojiKeyboard(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        },
      },
      {
        text: '📋 Copy',
        onPress: () => {
          Clipboard.setStringAsync(msg.content).catch(() => {});
        },
      },
    ];
    if (isOwn) {
      options.push({
        text: '🗑 Delete',
        style: 'destructive',
        onPress: () => {
          socketService.emit('chat:delete', { roomId, messageId: msg.id });
        },
      });
    }
    Alert.alert('Message', undefined, options);
  }

  const myTypingUsers = typingUsers.filter((u) => u !== user?.username);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ThemePicker
        visible={showThemePicker}
        themeId={themeId}
        onSelect={saveTheme}
        onClose={() => setShowThemePicker(false)}
      />

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        {showSearch ? (
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages…"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Search chat messages"
          />
        ) : (
          <Text style={styles.header}>Chat</Text>
        )}
        <TouchableOpacity
          onPress={() => setShowThemePicker(true)}
          style={styles.searchBtn}
          accessibilityLabel="Change theme"
          accessibilityRole="button"
        >
          <View style={[styles.themePreviewDot, { backgroundColor: themeColor }]} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setShowSearch((v) => {
              if (v) setSearchQuery('');
              return !v;
            });
          }}
          style={styles.searchBtn}
          accessibilityLabel={showSearch ? 'Close search' : 'Search chat'}
          accessibilityRole="button"
        >
          <Ionicons
            name={showSearch ? 'close-outline' : 'search-outline'}
            size={20}
            color={showSearch ? themeColor : COLORS.muted}
          />
        </TouchableOpacity>
      </View>

      {showSearch && searchQuery !== '' && (
        <Text style={styles.searchResultCount}>
          {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={filteredMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <SwipeableMessage
            msg={item}
            isOwn={item.user_id === user?.id}
            onLongPress={() => showMessageMenu(item, item.user_id === user?.id)}
            onSwipeReply={(msg) => {
              setReplyTo(msg);
              setShowEmojiKeyboard(false);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            themeColor={themeColor}
          />
        )}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          !showSearch && listRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <Text style={styles.emptyChat}>
            {showSearch ? 'No messages match your search' : 'No messages yet. Say hello!'}
          </Text>
        }
        accessibilityLabel="Chat messages"
      />

      {/* ── Typing indicator ── */}
      <TypingIndicator users={myTypingUsers} />

      {/* ── Reply bar ── */}
      {replyTo && <ReplyBar msg={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* ── Emoji keyboard ── */}
      {showEmojiKeyboard && (
        <View style={styles.emojiKeyboard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {EMOJI_CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveCategory(i)}
                style={[styles.categoryTab, activeCategory === i && styles.categoryTabActive]}
                accessibilityLabel={`Emoji category ${cat.label}`}
                accessibilityRole="tab"
              >
                <Text style={styles.categoryTabText}>{cat.label.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.emojiGrid}>
            <View style={styles.emojiGridInner}>
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => insertEmoji(emoji)}
                  style={styles.emojiGridBtn}
                  accessibilityLabel={`Insert ${emoji}`}
                >
                  <Text style={styles.emojiGridText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Input row ── */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={toggleEmojiKeyboard}
          style={styles.emojiToggleBtn}
          accessibilityLabel={showEmojiKeyboard ? 'Open keyboard' : 'Open emoji picker'}
          accessibilityRole="button"
        >
          <Ionicons
            name={showEmojiKeyboard ? 'keypad-outline' : 'happy-outline'}
            size={22}
            color={showEmojiKeyboard ? COLORS.primary : COLORS.muted}
          />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={handleTextChange}
          placeholder={replyTo ? `Reply to ${replyTo.username}…` : 'Message…'}
          placeholderTextColor={COLORS.muted}
          style={styles.textInput}
          onSubmitEditing={send}
          returnKeyType="send"
          maxLength={500}
          onFocus={() => setShowEmojiKeyboard(false)}
          accessibilityLabel="Chat message input"
        />

        <TouchableOpacity
          onPress={send}
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          disabled={!text.trim()}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim() ? themeColor : COLORS.muted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.card },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  header: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  searchBtn: { padding: 4 },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingVertical: 4,
  },
  searchResultCount: {
    color: COLORS.muted,
    fontSize: 11,
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontWeight: '600',
  },

  // ── Messages ──
  list: { padding: 12, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 10,
    marginBottom: 4,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardElevated,
  },
  username: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  replyQuote: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  replyQuoteText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  msgText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 20 },
  time: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  reactionChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  reactionEmoji: { fontSize: 12 },
  reactionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  emojiBtn: { padding: 3 },
  emoji: { fontSize: 20 },
  emptyChat: { color: COLORS.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },

  // ── Typing indicator ──
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
  },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.muted,
  },
  typingText: { color: COLORS.muted, fontSize: 12 },

  // ── Reply bar ──
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.cardElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  replyBarLine: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  replyBarLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  replyBarContent: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  replyBarClose: { padding: 4 },

  // ── Emoji keyboard ──
  emojiKeyboard: {
    height: 260,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryTabs: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryTabActive: {
    backgroundColor: COLORS.accentMuted,
    borderColor: COLORS.primary,
  },
  categoryTabText: { fontSize: 18 },
  emojiGrid: { flex: 1 },
  emojiGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  emojiGridBtn: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiGridText: { fontSize: 24 },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  emojiToggleBtn: { padding: 6 },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.cardElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  sendBtn: { padding: 8 },
  sendBtnDisabled: { opacity: 0.4 },

  // ── Theme picker ──
  themePreviewDot: { width: 16, height: 16, borderRadius: 8 },
  themeBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000A',
  },
  themeSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  themeGrabber: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 16,
  },
  themeTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: 'transparent',
  },
  themeChipActive: { borderColor: 'rgba(255,255,255,0.7)' },
  themeChipLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  themeCheck: { color: '#fff', fontSize: 13 },
});
