import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StatusBar, useWindowDimensions, type ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import {
  IconArrowDownLeft,
  IconArrowLeft,
  IconArrowUpRight,
  IconCamera,
  IconChecks,
  IconChevronDown,
  IconCircleDashed,
  IconDotsVertical,
  IconKeyboard,
  IconLock,
  IconMessageCircle,
  IconMessageCirclePlus,
  IconMicrophone,
  IconMicrophoneOff,
  IconMoodSmile,
  IconPaperclip,
  IconPhone,
  IconPhoneOff,
  IconPhonePlus,
  IconPlus,
  IconSearch,
  IconSend2,
  IconUser,
  IconUserPlus,
  IconVideo,
  IconVideoOff,
  IconVolume,
} from '@tabler/icons-react-native';
import { EmojiPicker, type EmojiPickerSelection } from '@plocks/emoji-picker';
import {
  KeyboardAvoidingArea,
  SafeArea,
  ScrollArea,
  Block,
  Avatar,
  BottomAppBar,
  Button,
  Column,
  Flex,
  Gradient,
  IconButton,
  Input,
  PlocksProvider,
  Row,
  Text,
  Title,
} from '@plocks/ui-snack';

import { RECENT_CALLS, SEED_CHATS, STATUSES, timeNow, type Chat, type Message } from './data';

const COLORS = {
  green: '#008069',
  brightGreen: '#25D366',
  pill: '#D8FDD2',
  ink: '#111B21',
  muted: '#667781',
  faint: '#8696A0',
  line: '#E9EDEF',
  chrome: '#F0F2F5',
  white: '#FFFFFF',
  chat: '#EFEAE2',
  doodle: '#D6CDBF',
  outgoing: '#D9FDD3',
  tick: '#53BDEB',
  missed: '#EA0038',
  callBg: '#0B141A',
};
const STORAGE_KEY = 'plocks-chatline-app:chats';
const THEME = { colorScheme: 'light' as const };
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

type Tab = 'chats' | 'updates' | 'calls';
type Filter = 'all' | 'unread' | 'groups';
type Detail = { kind: 'chat' | 'status' | 'call'; id: string; video?: boolean } | null;
type PickerTarget = { kind: 'draft' } | { kind: 'reaction'; messageId: string } | null;

// Tabler outline glyphs (24px grid) for the chat wallpaper, merged to one path each.
const DOODLES = {
  heart: 'M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572',
  star: 'M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245',
  smile: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M9 10l.01 0M15 10l.01 0M9.5 15a3.5 3.5 0 0 0 5 0',
  music: 'M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0M9 17v-13h10v13M9 8h10',
  coffee:
    'M3 14c.83 .642 2.077 1.017 3.5 1c1.423 .017 2.67 -.358 3.5 -1c.83 -.642 2.077 -1.017 3.5 -1c1.423 -.017 2.67 .358 3.5 1M8 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2M12 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2M3 10h14v5a6 6 0 0 1 -6 6h-2a6 6 0 0 1 -6 -6v-5M16.746 16.726a3 3 0 1 0 .252 -5.555',
  camera:
    'M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0',
  cloud:
    'M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878',
  moon: 'M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008',
  leaf: 'M5 21c.5 -4.5 2.5 -8 7 -10M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0',
  gift: 'M3 9a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -2M12 8l0 13M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5',
  plane: 'M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3l4 7',
  umbrella: 'M4 12a8 8 0 0 1 16 0l-16 0M12 12v6a2 2 0 0 0 4 0',
  balloon: 'M14 8a2 2 0 0 0 -2 -2M6 8a6 6 0 1 1 12 0c0 4.97 -2.686 9 -6 9s-6 -4.03 -6 -9M12 17v1a2 2 0 0 1 -2 2h-3a2 2 0 0 0 -2 2',
  pizza:
    'M12 21.5c-3.04 0 -5.952 -.714 -8.5 -1.983l8.5 -16.517l8.5 16.517a19.09 19.09 0 0 1 -8.5 1.983M5.38 15.866a14.94 14.94 0 0 0 6.815 1.634a14.944 14.944 0 0 0 6.502 -1.479M13 11.01v-.01M11 14v-.01',
  sun: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7',
};
// [glyph, x, y, rotation, scale] on a 240px tile.
const DOODLE_LAYOUT: [keyof typeof DOODLES, number, number, number, number][] = [
  ['heart', 12, 10, -12, 1.1],
  ['music', 84, 22, 8, 1],
  ['coffee', 160, 6, -6, 1.15],
  ['star', 206, 70, 18, 0.9],
  ['smile', 30, 78, 10, 1.2],
  ['plane', 110, 86, -24, 1.1],
  ['leaf', 176, 128, 14, 1.1],
  ['camera', 8, 150, -8, 1.05],
  ['moon', 76, 150, 20, 0.95],
  ['gift', 128, 176, -10, 1],
  ['balloon', 200, 196, 6, 1],
  ['cloud', 30, 206, 0, 1.1],
  ['umbrella', 140, 40, 30, 0.85],
  ['pizza', 92, 214, -18, 0.9],
  ['sun', 196, 12, 0, 0.8],
];

/** An all-over doodle wallpaper: one tiled SVG pattern, so it costs a few dozen nodes at any size. */
function DoodleWallpaper({ color }: { color: string }) {
  return (
    <Block position="absolute" inset={0} pointerEvents="none" aria-hidden>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="chatline-doodles" patternUnits="userSpaceOnUse" width={240} height={240}>
            {DOODLE_LAYOUT.map(([glyph, x, y, rotation, scale]) => (
              <G key={glyph} transform={`translate(${x} ${y}) rotate(${rotation} 12 12) scale(${scale})`}>
                <Path
                  d={DOODLES[glyph]}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#chatline-doodles)" />
      </Svg>
    </Block>
  );
}

function isSavedChats(value: unknown): value is Chat[] {
  return (
    Array.isArray(value) &&
    value.length === SEED_CHATS.length &&
    value.every(
      (chat) =>
        chat &&
        typeof chat === 'object' &&
        typeof chat.id === 'string' &&
        typeof chat.name === 'string' &&
        typeof chat.initials === 'string' &&
        typeof chat.color === 'string' &&
        typeof chat.unread === 'number' &&
        Array.isArray(chat.messages) &&
        chat.messages.every(
          (message: Message) =>
            message &&
            typeof message.id === 'string' &&
            typeof message.text === 'string' &&
            typeof message.time === 'string' &&
            typeof message.outgoing === 'boolean',
        ),
    )
  );
}

function ChatAvatar({ chat, size = 'lg' }: { chat: Chat; size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' }) {
  return (
    <Avatar
      size={size}
      fallback={chat.initials}
      bg={chat.color}
      textColor={COLORS.white}
      accessibilityLabel={`${chat.name} avatar`}
    />
  );
}

function ChatRow({ chat, active, onPress }: { chat: Chat; active: boolean; onPress: () => void }) {
  const last = chat.messages[chat.messages.length - 1];
  return (
    <Block
      gap={0}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${chat.name}`}
      bg={active ? COLORS.chrome : COLORS.white}
      px={16}
      py={11}
    >
      <Row align="center" gap={14} fullWidth>
        <ChatAvatar chat={chat} size="lg" />
        <Block gap={3} direction="column" flex={1} miw={0}>
          <Row align="center" justify="space-between" fullWidth gap="sm">
            <Text c={COLORS.ink} fw="semibold" size={16} numberOfLines={1} flex={1}>
              {chat.name}
            </Text>
            <Text c={chat.unread ? COLORS.brightGreen : COLORS.muted} fw={chat.unread ? 'semibold' : undefined} size={12}>
              {last?.time ?? ''}
            </Text>
          </Row>
          <Row align="center" justify="space-between" fullWidth gap={4}>
            {last?.outgoing && <IconChecks size={17} color={COLORS.tick} />}
            <Text c={COLORS.muted} size={14} numberOfLines={1} flex={1}>
              {last?.text ?? 'Start a conversation'}
            </Text>
            {chat.unread > 0 && (
              <Block align="center" justify="center" direction="row" miw={20} h={20} px={5} radius={10} bg={COLORS.brightGreen}>
                <Text c={COLORS.white} fw="bold" size={11}>
                  {chat.unread}
                </Text>
              </Block>
            )}
          </Row>
        </Block>
      </Row>
    </Block>
  );
}

function MessageBubble({
  message,
  first,
  reacting,
  onLongPress,
  onReact,
  onMoreReactions,
}: {
  message: Message;
  first: boolean;
  reacting: boolean;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
  onMoreReactions: () => void;
}) {
  const side = message.outgoing ? 'flex-end' : 'flex-start';
  return (
    <Block gap={4} direction="column" align={side} fullWidth mt={first ? 6 : 0}>
      {reacting && (
        <Block
          direction="row"
          align="center"
          gap={2}
          bg={COLORS.white}
          radius={24}
          px={6}
          py={4}
          shadow="md"
          accessibilityRole="toolbar"
          accessibilityLabel="React to message"
        >
          {QUICK_REACTIONS.map((emoji) => (
            <Block
              key={emoji}
              gap={0}
              w={38}
              h={38}
              radius={19}
              align="center"
              justify="center"
              bg={message.reaction === emoji ? COLORS.chrome : undefined}
              onPress={() => onReact(emoji)}
              accessibilityRole="button"
              accessibilityLabel={`React ${emoji}`}
            >
              <Text size={24}>{emoji}</Text>
            </Block>
          ))}
          <IconButton
            icon={IconPlus}
            size="sm"
            variant="secondary"
            color={COLORS.muted}
            radius="full"
            accessibilityLabel="More reactions"
            onPress={onMoreReactions}
          />
        </Block>
      )}
      <Flex fullWidth justify={side}>
        <Block
          gap={0}
          direction="row"
          wrap="wrap"
          align="flex-end"
          maw="80%"
          pl={9}
          pr={7}
          pt={6}
          pb={5}
          radius={8}
          bg={message.outgoing ? COLORS.outgoing : COLORS.white}
          borderTopRightRadius={message.outgoing && first ? 0 : 8}
          borderTopLeftRadius={!message.outgoing && first ? 0 : 8}
          shadow="xs"
          onLongPress={onLongPress}
          accessibilityHint="Long press to react"
        >
          <Text c={COLORS.ink} size={15} lh={20} pr={8} shrink={1}>
            {message.text}
          </Text>
          <Row align="center" gap={3} ml="auto" mb={-1}>
            <Text c={COLORS.muted} size={11}>
              {message.time}
            </Text>
            {message.outgoing && <IconChecks size={16} color={COLORS.tick} />}
          </Row>
        </Block>
      </Flex>
      {message.reaction && (
        <Block
          gap={0}
          direction="row"
          mt={-10}
          mx={10}
          px={5}
          py={1}
          radius={12}
          bg={COLORS.white}
          borderWidth={1}
          borderColor={COLORS.chat}
          onPress={() => onReact(message.reaction!)}
          accessibilityRole="button"
          accessibilityLabel={`Remove reaction ${message.reaction}`}
        >
          <Text size={14}>{message.reaction}</Text>
        </Block>
      )}
    </Block>
  );
}

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function CallControl({
  label,
  icon,
  active = false,
  danger = false,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Block
      gap={0}
      w={58}
      h={58}
      radius={29}
      align="center"
      justify="center"
      bg={danger ? COLORS.missed : active ? COLORS.white : 'rgba(255,255,255,0.14)'}
      onPress={onPress}
      accessibilityRole={danger ? 'button' : 'switch'}
      accessibilityState={danger ? undefined : { checked: active }}
      accessibilityLabel={label}
    >
      {icon}
    </Block>
  );
}

function CallScreen({ chat, video, onEnd }: { chat: Chat; video: boolean; onEnd: () => void }) {
  const [elapsed, setElapsed] = useState(-3);
  const [speaker, setSpeaker] = useState(video);
  const [camera, setCamera] = useState(video);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const status = elapsed < -1 ? 'Calling…' : elapsed < 0 ? 'Ringing…' : formatDuration(elapsed);
  const iconColor = (on: boolean) => (on ? COLORS.ink : COLORS.white);

  return (
    <Gradient
      colors={[chat.color, '#1F2C33', COLORS.callBg]}
      locations={[0, 0.45, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      direction="column"
      flex={1}
      px={20}
      pt={14}
      pb={28}
    >
      <StatusBar barStyle="light-content" />
      <Row align="center" justify="space-between" fullWidth>
        <IconButton
          icon={IconChevronDown}
          variant="ghost"
          iconColor={COLORS.white}
          accessibilityLabel="Minimize call"
          onPress={onEnd}
        />
        <Row align="center" gap={5}>
          <IconLock size={13} color="rgba(255,255,255,0.75)" />
          <Text c="rgba(255,255,255,0.75)" size={12}>
            End-to-end encrypted
          </Text>
        </Row>
        <IconButton icon={IconUserPlus} variant="ghost" iconColor={COLORS.white} accessibilityLabel="Add participant" />
      </Row>

      <Block align="center" gap={6} direction="column" mt={36}>
        <Text c={COLORS.white} fw="bold" size={28} ta="center">
          {chat.name}
        </Text>
        <Text c="rgba(255,255,255,0.8)" size={15} accessibilityLiveRegion="polite">
          {video ? 'Video call' : 'Voice call'} · {status}
        </Text>
      </Block>

      <Block align="center" justify="center" direction="row" flex={1}>
        <Block align="center" justify="center" gap={0} p={22} radius={999} bg="rgba(255,255,255,0.06)">
          <Block align="center" justify="center" gap={0} p={18} radius={999} bg="rgba(255,255,255,0.08)">
            <Avatar size={128} fallback={chat.initials} bg={chat.color} textColor={COLORS.white} accessibilityLabel={`${chat.name} avatar`} />
          </Block>
        </Block>
      </Block>

      <Block
        direction="row"
        align="center"
        justify="space-between"
        alignSelf="center"
        w="100%"
        maw={360}
        px={18}
        py={16}
        radius={36}
        bg="rgba(255,255,255,0.1)"
        accessibilityRole="toolbar"
        accessibilityLabel="Call controls"
      >
        <CallControl label="Speaker" active={speaker} onPress={() => setSpeaker((on) => !on)} icon={<IconVolume size={26} color={iconColor(speaker)} />} />
        <CallControl
          label="Camera"
          active={camera}
          onPress={() => setCamera((on) => !on)}
          icon={camera ? <IconVideo size={26} color={iconColor(true)} /> : <IconVideoOff size={26} color={iconColor(false)} />}
        />
        <CallControl
          label="Mute"
          active={muted}
          onPress={() => setMuted((on) => !on)}
          icon={muted ? <IconMicrophoneOff size={26} color={iconColor(true)} /> : <IconMicrophone size={26} color={iconColor(false)} />}
        />
        <CallControl label="End call" danger onPress={onEnd} icon={<IconPhoneOff size={26} color={COLORS.white} />} />
      </Block>
    </Gradient>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text c={COLORS.ink} fw="bold" size={17} px={16} pt={18} pb={8}>
      {children}
    </Text>
  );
}

function ChatlineScreen() {
  const { width } = useWindowDimensions();
  const desktop = width >= 820;
  const messageScroll = useRef<ScrollView>(null);
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('chats');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [detail, setDetail] = useState<Detail>(null);
  const [newChat, setNewChat] = useState(false);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const parsed: unknown = JSON.parse(saved);
        if (isSavedChats(parsed)) setChats(parsed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats)).catch(() => {});
  }, [chats, ready]);

  const selected =
    detail ?? (desktop && tab === 'chats' && !newChat ? { kind: 'chat' as const, id: chats[0].id } : null);
  const activeChat = selected?.kind === 'chat' ? chats.find((chat) => chat.id === selected.id) : null;
  const unreadTotal = chats.reduce((total, chat) => total + chat.unread, 0);
  const shownChats = chats.filter((chat) => {
    const matches = `${chat.name} ${chat.messages[chat.messages.length - 1]?.text ?? ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    return (
      matches && (filter === 'all' || (filter === 'unread' && chat.unread > 0) || (filter === 'groups' && chat.isGroup))
    );
  });

  function openChat(id: string) {
    setChats((current) => current.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)));
    setDetail({ kind: 'chat', id });
    setNewChat(false);
    setDraft('');
    setPicker(null);
    setReactingTo(null);
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || !activeChat) return;
    const message: Message = { id: `local-${Date.now()}`, text, time: timeNow(), outgoing: true };
    setChats((current) => {
      const updated = current.find((chat) => chat.id === activeChat.id);
      if (!updated) return current;
      return [
        { ...updated, unread: 0, messages: [...updated.messages, message] },
        ...current.filter((chat) => chat.id !== updated.id),
      ];
    });
    setDetail({ kind: 'chat', id: activeChat.id });
    setDraft('');
  }

  function react(messageId: string, emoji: string) {
    if (!activeChat) return;
    setChats((current) =>
      current.map((chat) =>
        chat.id !== activeChat.id
          ? chat
          : {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId
                  ? { ...message, reaction: message.reaction === emoji ? undefined : emoji }
                  : message,
              ),
            },
      ),
    );
    setReactingTo(null);
  }

  function toggleEmojiPicker() {
    if (picker) {
      setPicker(null);
    } else {
      Keyboard.dismiss();
      setReactingTo(null);
      setPicker({ kind: 'draft' });
    }
  }

  function selectTab(next: Tab) {
    setTab(next);
    setDetail(null);
    setNewChat(false);
    setQuery('');
  }

  function startCall(chatId: string, video = false) {
    setDetail({ kind: 'call', id: `new:${chatId}`, video });
  }

  function renderSidebarContent() {
    if (newChat) {
      return (
        <>
          <Text c={COLORS.muted} size={13} fw="semibold" px={16} pt={14} pb={6}>
            Contacts on Chatline
          </Text>
          {chats
            .filter((chat) => !chat.isGroup)
            .map((chat) => (
              <ChatRow key={chat.id} chat={chat} active={false} onPress={() => openChat(chat.id)} />
            ))}
        </>
      );
    }

    if (tab === 'updates') {
      return (
        <Block gap={0} direction="column" pb={8}>
          <SectionLabel>Status</SectionLabel>
          <Block align="center" gap={14} direction="row" px={16} py={8}>
            <Block gap={0}>
              <Avatar size="lg" fallback={<IconUser size={30} color={COLORS.white} />} bg="#CFD7DB" textColor={COLORS.white} accessibilityLabel="Your avatar" />
              <Block
                gap={0}
                position="absolute"
                right={-2}
                bottom={-2}
                w={22}
                h={22}
                radius={11}
                align="center"
                justify="center"
                bg={COLORS.brightGreen}
                borderWidth={2}
                borderColor={COLORS.white}
              >
                <IconPlus size={13} color={COLORS.white} strokeWidth={3} />
              </Block>
            </Block>
            <Column gap={2}>
              <Text c={COLORS.ink} fw="semibold" size={16}>
                My status
              </Text>
              <Text c={COLORS.muted} size={13}>
                Tap to add status update
              </Text>
            </Column>
          </Block>
          <Text c={COLORS.muted} fw="semibold" size={13} px={16} pt={14} pb={4}>
            Recent updates
          </Text>
          {STATUSES.map((status) => {
            const chat = chats.find((item) => item.id === status.chatId)!;
            return (
              <Block
                key={status.id}
                align="center"
                gap={14}
                direction="row"
                px={16}
                py={8}
                onPress={() => setDetail({ kind: 'status', id: status.id })}
                accessibilityRole="button"
                accessibilityLabel={`View ${chat.name}'s status`}
              >
                <Block gap={0} p={2} borderWidth={2} radius={32} borderColor={COLORS.brightGreen}>
                  <ChatAvatar chat={chat} size="lg" />
                </Block>
                <Column gap={2}>
                  <Text c={COLORS.ink} fw="semibold" size={16}>
                    {chat.name}
                  </Text>
                  <Text c={COLORS.muted} size={13}>
                    {status.time}
                  </Text>
                </Column>
              </Block>
            );
          })}
        </Block>
      );
    }

    if (tab === 'calls') {
      const favourites = chats.filter((chat) => !chat.isGroup).slice(0, 4);
      return (
        <Block gap={0} direction="column" pb={8}>
          <SectionLabel>Favourites</SectionLabel>
          <Row gap={18} px={16} pb={6}>
            {favourites.map((chat) => (
              <Block
                key={chat.id}
                align="center"
                gap={6}
                direction="column"
                w={64}
                onPress={() => startCall(chat.id)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${chat.name}`}
              >
                <ChatAvatar chat={chat} size="xl" />
                <Text c={COLORS.ink} size={12} numberOfLines={1}>
                  {chat.name.split(' ')[0]}
                </Text>
              </Block>
            ))}
          </Row>
          <SectionLabel>Recent</SectionLabel>
          {RECENT_CALLS.map((call) => {
            const chat = chats.find((item) => item.id === call.chatId)!;
            const Direction = call.missed ? IconArrowDownLeft : IconArrowUpRight;
            const CallType = call.type === 'video' ? IconVideo : IconPhone;
            return (
              <Block
                key={call.id}
                align="center"
                gap={14}
                direction="row"
                px={16}
                py={9}
                onPress={() => setDetail({ kind: 'call', id: call.id })}
                accessibilityRole="button"
                accessibilityLabel={`${call.missed ? 'Missed' : 'Outgoing'} ${call.type} call with ${chat.name}, ${call.time}`}
              >
                <ChatAvatar chat={chat} size="lg" />
                <Block gap={3} direction="column" flex={1}>
                  <Text c={call.missed ? COLORS.missed : COLORS.ink} fw="semibold" size={16}>
                    {chat.name}
                  </Text>
                  <Row align="center" gap={4}>
                    <Direction size={16} color={call.missed ? COLORS.missed : COLORS.brightGreen} />
                    <Text c={COLORS.muted} size={13}>
                      {call.time}
                    </Text>
                  </Row>
                </Block>
                <CallType size={22} color={COLORS.ink} />
              </Block>
            );
          })}
        </Block>
      );
    }

    return (
      <>
        <Block direction="row" px={16} pt={4} pb={10}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            startSection={<IconSearch size={19} color={COLORS.muted} />}
            variant="filled"
            radius="full"
            accessibilityLabel="Search chats"
          />
        </Block>
        <Row gap={8} px={16} pb={8} accessibilityRole="tablist" accessibilityLabel="Filter chats">
          {(['all', 'unread', 'groups'] as const).map((item) => {
            const on = filter === item;
            return (
              <Block
                key={item}
                gap={0}
                px={14}
                py={7}
                radius={999}
                bg={on ? COLORS.pill : COLORS.chrome}
                onPress={() => setFilter(item)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Text c={on ? '#0A5C36' : COLORS.muted} fw="semibold" size={14}>
                  {item === 'unread' && unreadTotal ? `Unread ${unreadTotal}` : item[0].toUpperCase() + item.slice(1)}
                </Text>
              </Block>
            );
          })}
        </Row>
        {shownChats.length ? (
          shownChats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              active={desktop && selected?.kind === 'chat' && selected.id === chat.id}
              onPress={() => openChat(chat.id)}
            />
          ))
        ) : (
          <Block align="center" gap="xs" direction="column" p={30}>
            <IconSearch size={26} color={COLORS.faint} />
            <Text c={COLORS.muted} ta="center">
              No chats found. Try another search or filter.
            </Text>
          </Block>
        )}
      </>
    );
  }

  function renderDetail() {
    if (selected?.kind === 'status') {
      const status = STATUSES.find((item) => item.id === selected.id)!;
      const chat = chats.find((item) => item.id === status.chatId)!;
      return (
        <Block direction="column" flex={1} bg={status.color}>
          <Block gap={0} mx={10} mt={10} h={3} radius={2} bg="rgba(255,255,255,0.9)" />
          <Block align="center" gap="sm" direction="row" px={8} py={10}>
            <IconButton
              icon={IconArrowLeft}
              variant="ghost"
              iconColor={COLORS.ink}
              accessibilityLabel="Close status"
              onPress={() => setDetail(null)}
            />
            <ChatAvatar chat={chat} size="md" />
            <Column gap={0}>
              <Text c={COLORS.ink} fw="bold">
                {chat.name}
              </Text>
              <Text c={COLORS.ink} size={12}>
                {status.time}
              </Text>
            </Column>
          </Block>
          <Block align="center" justify="center" direction="row" flex={1} p={32}>
            <Text c={COLORS.ink} fw="bold" size={30} ta="center" lh={42}>
              {status.caption}
            </Text>
          </Block>
          <Button
            title={`Reply to ${chat.name}`}
            variant="filled"
            color={COLORS.green}
            radius="full"
            m={20}
            onPress={() => {
              setTab('chats');
              openChat(chat.id);
            }}
          />
        </Block>
      );
    }

    if (selected?.kind === 'call') {
      const call = RECENT_CALLS.find((item) => item.id === selected.id);
      const chat = chats.find((item) => item.id === (call?.chatId ?? selected.id.replace('new:', '')))!;
      const backToChat = selected.id.startsWith('new:');
      return (
        <CallScreen
          key={selected.id}
          chat={chat}
          video={selected.video ?? call?.type === 'video'}
          onEnd={() => setDetail(backToChat ? { kind: 'chat', id: chat.id } : null)}
        />
      );
    }

    if (!activeChat) {
      return (
        <Block align="center" justify="center" gap="md" direction="column" flex={1} bg={COLORS.chrome} p={36}>
          <Block align="center" justify="center" direction="row" w={86} h={86} radius={43} bg="#DDECE7">
            <IconMessageCircle size={40} color={COLORS.green} />
          </Block>
          <Title order={2} c={COLORS.ink}>
            A good conversation starts here.
          </Title>
          <Text c={COLORS.muted} ta="center">
            Pick a chat to catch up with someone.
          </Text>
        </Block>
      );
    }

    const hasDraft = draft.trim().length > 0;
    return (
      <KeyboardAvoidingArea behavior={Platform.OS === 'ios' ? 'padding' : undefined} flex={1} bg={COLORS.chat} gap={0}>
        <Block align="center" gap={6} direction="row" pl={4} pr={6} py={8} bg={COLORS.white} borderBottomWidth={1} borderBottomColor={COLORS.line}>
          {!desktop && (
            <IconButton
              icon={IconArrowLeft}
              variant="ghost"
              iconColor={COLORS.ink}
              accessibilityLabel="Back to chats"
              onPress={() => setDetail(null)}
            />
          )}
          <ChatAvatar chat={activeChat} size="md" />
          <Block gap={1} direction="column" flex={1} miw={0} pl={4}>
            <Text c={COLORS.ink} fw="semibold" size={16} numberOfLines={1}>
              {activeChat.name}
            </Text>
            <Text c={COLORS.muted} size={12} numberOfLines={1}>
              {activeChat.isGroup ? 'tap here for group info' : activeChat.online ? 'online' : 'last seen recently'}
            </Text>
          </Block>
          <IconButton
            icon={IconVideo}
            variant="ghost"
            iconColor={COLORS.ink}
            accessibilityLabel={`Video call ${activeChat.name}`}
            onPress={() => startCall(activeChat.id, true)}
          />
          <IconButton
            icon={IconPhone}
            variant="ghost"
            iconColor={COLORS.ink}
            accessibilityLabel={`Voice call ${activeChat.name}`}
            onPress={() => startCall(activeChat.id)}
          />
          <IconButton icon={IconDotsVertical} variant="ghost" iconColor={COLORS.ink} accessibilityLabel="More options" />
        </Block>
        <Block gap={0} flex={1} position="relative">
          <DoodleWallpaper color={COLORS.doodle} />
          <ScrollArea
            ref={messageScroll}
            flex={1}
            keyboardShouldPersistTaps="handled"
            contentProps={{ px: 12, pt: 14, pb: 10, gap: 4, grow: 1, justify: 'flex-end' }}
            onContentSizeChange={() => messageScroll.current?.scrollToEnd({ animated: false })}
          >
            <Block gap={0} direction="row" alignSelf="center" bg={COLORS.white} px={12} py={5} radius={8} mb={6} shadow="xs">
              <Text c={COLORS.muted} size={12} fw="medium">
                Today
              </Text>
            </Block>
            <Block gap={0} direction="row" alignSelf="center" maw={320} bg="#FFF5C4" px={12} py={7} radius={8} mb={10}>
              <Text c="#54656F" size={12} ta="center">
                🔒 Messages and calls are end-to-end encrypted. Only people in this chat can read them.
              </Text>
            </Block>
            {activeChat.messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                first={activeChat.messages[index - 1]?.outgoing !== message.outgoing}
                reacting={reactingTo === message.id}
                onLongPress={() => {
                  setPicker(null);
                  setReactingTo((current) => (current === message.id ? null : message.id));
                }}
                onReact={(emoji) => react(message.id, emoji)}
                onMoreReactions={() => {
                  setReactingTo(null);
                  setPicker({ kind: 'reaction', messageId: message.id });
                }}
              />
            ))}
          </ScrollArea>
          <Row align="flex-end" gap={6} px={6} pb={8} pt={4}>
            <Block direction="row" align="center" flex={1} gap={0} bg={COLORS.white} radius={26} pl={4} pr={6} mih={50} shadow="xs">
              <IconButton
                icon={picker?.kind === 'draft' ? IconKeyboard : IconMoodSmile}
                variant="ghost"
                iconColor={COLORS.muted}
                iconSize={24}
                radius="full"
                accessibilityLabel={picker?.kind === 'draft' ? 'Show keyboard' : 'Emoji'}
                onPress={toggleEmojiPicker}
              />
              <Block direction="row" flex={1}>
                <Input
                  value={draft}
                  onChangeText={setDraft}
                  onEnter={sendMessage}
                  onFocus={() => setPicker(null)}
                  placeholder="Message"
                  variant="unstyled"
                  accessibilityLabel="Type a message"
                />
              </Block>
              <IconButton icon={IconPaperclip} variant="ghost" iconColor={COLORS.muted} radius="full" accessibilityLabel="Attach" />
              {!hasDraft && (
                <IconButton icon={IconCamera} variant="ghost" iconColor={COLORS.muted} radius="full" accessibilityLabel="Camera" />
              )}
            </Block>
            <Block
              gap={0}
              w={50}
              h={50}
              radius={25}
              align="center"
              justify="center"
              bg={COLORS.green}
              onPress={hasDraft ? sendMessage : undefined}
              accessibilityRole="button"
              accessibilityLabel={hasDraft ? 'Send message' : 'Record voice message'}
            >
              {hasDraft ? <IconSend2 size={22} color={COLORS.white} /> : <IconMicrophone size={23} color={COLORS.white} />}
            </Block>
          </Row>
        </Block>
        {picker && (
          <Block gap={0} bg={COLORS.chrome} px={6} pt={6} pb={8} borderTopWidth={1} borderTopColor={COLORS.line}>
            <EmojiPicker
              w="100%"
              h={300}
              searchPlaceholder={picker.kind === 'reaction' ? 'Search reactions' : 'Search emoji'}
              onSelect={({ emoji }: EmojiPickerSelection) => {
                if (picker.kind === 'reaction') {
                  react(picker.messageId, emoji);
                  setPicker(null);
                } else {
                  setDraft((value) => value + emoji);
                }
              }}
            />
          </Block>
        )}
      </KeyboardAvoidingArea>
    );
  }

  const title = newChat ? 'New chat' : null;

  return (
    <SafeArea gap={0} flex={1} bg={selected?.kind === 'call' && !desktop ? COLORS.callBg : COLORS.white}>
      <StatusBar barStyle="dark-content" />
      <Block
        align="stretch"
        direction="row"
        flex={1}
        w="100%"
        maw={1440}
        alignSelf="center"
        bg={COLORS.white}
        borderLeftWidth={desktop ? 1 : 0}
        borderRightWidth={desktop ? 1 : 0}
        borderColor={COLORS.line}
      >
        {(desktop || !detail) && (
          <Block
            align="stretch"
            gap={0}
            direction="column"
            w={desktop ? 390 : '100%'}
            shrink={0}
            bg={COLORS.white}
            borderRightWidth={desktop ? 1 : 0}
            borderRightColor={COLORS.line}
          >
            <Block align="center" justify="space-between" direction="row" pl={title ? 4 : 16} pr={6} pt={10} pb={6}>
              {title ? (
                <Row align="center" gap={4}>
                  <IconButton
                    icon={IconArrowLeft}
                    variant="ghost"
                    iconColor={COLORS.ink}
                    accessibilityLabel="Back to chats"
                    onPress={() => setNewChat(false)}
                  />
                  <Text c={COLORS.ink} fw="semibold" size={20}>
                    {title}
                  </Text>
                </Row>
              ) : (
                <Text c={tab === 'chats' ? COLORS.green : COLORS.ink} fw="bold" size={tab === 'chats' ? 24 : 22}>
                  {tab === 'chats' ? 'Chatline' : tab === 'updates' ? 'Updates' : 'Calls'}
                </Text>
              )}
              <Row align="center" gap={0}>
                {!title && tab !== 'chats' && (
                  <IconButton icon={IconSearch} variant="ghost" iconColor={COLORS.ink} accessibilityLabel="Search" />
                )}
                {!title && (
                  <IconButton icon={IconCamera} variant="ghost" iconColor={COLORS.ink} accessibilityLabel="Camera" />
                )}
                <IconButton icon={IconDotsVertical} variant="ghost" iconColor={COLORS.ink} accessibilityLabel="Menu" />
              </Row>
            </Block>
            <ScrollArea flex={1} keyboardShouldPersistTaps="handled" contentProps={{ pb: Platform.OS === 'web' ? 88 : 160 }}>
              {renderSidebarContent()}
            </ScrollArea>
            {!newChat && (
              <Block position="absolute" right={16} bottom={Platform.OS === 'web' ? 86 : 96} zIndex={2}>
                <Block
                  gap={0}
                  w={56}
                  h={56}
                  radius={16}
                  align="center"
                  justify="center"
                  bg={COLORS.brightGreen}
                  shadow="md"
                  onPress={() => {
                    if (tab === 'updates') {
                      setDetail({ kind: 'status', id: STATUSES[0].id });
                    } else {
                      setNewChat(true);
                      setDetail(null);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={tab === 'calls' ? 'New call' : tab === 'updates' ? 'New status' : 'New chat'}
                >
                  {tab === 'calls' ? (
                    <IconPhonePlus size={24} color={COLORS.ink} />
                  ) : tab === 'updates' ? (
                    <IconCamera size={24} color={COLORS.ink} />
                  ) : (
                    <IconMessageCirclePlus size={24} color={COLORS.ink} />
                  )}
                </Block>
              </Block>
            )}
            <BottomAppBar
              accessibilityLabel="Main"
              activeKey={tab}
              onItemPress={(key) => selectTab(key as Tab)}
              bg={COLORS.white}
              borderColor={COLORS.line}
              activeColor={COLORS.ink}
              inactiveColor={COLORS.muted}
              indicator={COLORS.pill}
              badgeColor={COLORS.brightGreen}
              items={[
                {
                  key: 'chats',
                  label: 'Chats',
                  badgeCount: unreadTotal,
                  icon: ({ active, color }) => (
                    <IconMessageCircle size={24} color={active ? '#0A5C36' : color} strokeWidth={active ? 2.2 : 1.8} />
                  ),
                },
                {
                  key: 'updates',
                  label: 'Updates',
                  icon: ({ active, color }) => (
                    <IconCircleDashed size={24} color={active ? '#0A5C36' : color} strokeWidth={active ? 2.2 : 1.8} />
                  ),
                },
                {
                  key: 'calls',
                  label: 'Calls',
                  icon: ({ active, color }) => (
                    <IconPhone size={24} color={active ? '#0A5C36' : color} strokeWidth={active ? 2.2 : 1.8} />
                  ),
                },
              ]}
            />
          </Block>
        )}
        {(desktop || detail) && (
          <Block align="stretch" direction="row" flex={1} miw={0}>
            {renderDetail()}
          </Block>
        )}
      </Block>
    </SafeArea>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={THEME}>
        <ChatlineScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
