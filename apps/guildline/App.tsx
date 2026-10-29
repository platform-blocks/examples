import { useEffect, useRef, useState, type ReactElement } from 'react';
import { StatusBar, useWindowDimensions, type ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EmojiPicker, type EmojiPickerSelection } from '@plocks/emoji-picker';
import {
  Avatar,
  Block,
  Button,
  Dialog,
  Icon,
  IconButton,
  Input,
  PlocksProvider,
  Popover,
  SafeArea,
  ScrollArea,
  Text,
} from '@plocks/ui';

const C = {
  rail: '#1E1F22',
  sidebar: '#2B2D31',
  main: '#313338',
  top: '#2B2D31',
  input: '#383A40',
  white: '#F2F3F5',
  muted: '#A6ADB6',
  dim: '#828891',
  line: '#202127',
  blurple: '#5865F2',
  green: '#3BA55D',
  card: '#232428',
  chip: '#404249',
  mine: '#3B3F7A',
};
const SERVERS = [
  {
    id: 'design',
    icon: '✦',
    name: 'Design Den',
    color: '#5865F2',
    categories: [
      {
        title: 'WELCOME',
        channels: [
          ['welcome', 'welcome'],
          ['rules', 'guidelines'],
        ],
      },
      {
        title: 'HANGOUT',
        channels: [
          ['general', 'general'],
          ['inspiration', 'inspiration'],
          ['feedback', 'feedback'],
        ],
      },
    ],
  },
  {
    id: 'garden',
    icon: '🌱',
    name: 'The Garden',
    color: '#427D62',
    categories: [
      {
        title: 'LOUNGE',
        channels: [
          ['garden-general', 'general'],
          ['garden-plants', 'plant-talk'],
          ['garden-photos', 'photos'],
        ],
      },
    ],
  },
  {
    id: 'music',
    icon: '♫',
    name: 'After Hours',
    color: '#B7678B',
    categories: [
      {
        title: 'CHANNELS',
        channels: [
          ['music-general', 'general'],
          ['music-finds', 'new-finds'],
          ['music-playlists', 'playlists'],
        ],
      },
    ],
  },
];
type Message = {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  reactions?: Reaction[];
};
type Reaction = { emoji: string; count: number; mine?: boolean };
type MessageMap = Record<string, Message[]>;
const SEED: MessageMap = {
  general: [
    {
      id: '1',
      author: 'Maya',
      initials: 'MA',
      color: '#A871C4',
      text: 'Good morning everyone! What are you working on today?',
      time: 'Today at 9:14 AM',
      reactions: [{ emoji: '☀️', count: 3 }],
    },
    {
      id: '2',
      author: 'Leo',
      initials: 'LE',
      color: '#5B95B5',
      text: 'A tiny icon set for our new project. The details are taking forever but I love it.',
      time: 'Today at 9:18 AM',
      reactions: [{ emoji: '✨', count: 2 }],
    },
    {
      id: '3',
      author: 'Nina',
      initials: 'NI',
      color: '#D88479',
      text: 'That sounds lovely! Drop a preview when you can 👀',
      time: 'Today at 9:21 AM',
    },
    {
      id: '4',
      author: 'Owen',
      initials: 'OW',
      color: '#7DA66F',
      text: 'I just made coffee and opened Figma. That counts as progress, right?',
      time: 'Today at 9:26 AM',
      reactions: [{ emoji: '☕', count: 5 }],
    },
  ],
  inspiration: [
    {
      id: '5',
      author: 'Maya',
      initials: 'MA',
      color: '#A871C4',
      text: 'This color palette has been living in my head all week: lilac, moss, and warm cream.',
      time: 'Yesterday at 4:02 PM',
      reactions: [{ emoji: '💜', count: 4 }],
    },
    {
      id: '6',
      author: 'Nina',
      initials: 'NI',
      color: '#D88479',
      text: 'A little reminder that your moodboards are allowed to be messy.',
      time: 'Today at 8:40 AM',
    },
  ],
  feedback: [
    {
      id: '7',
      author: 'Leo',
      initials: 'LE',
      color: '#5B95B5',
      text: 'If anyone has a spare minute, I would love fresh eyes on a navigation idea.',
      time: 'Today at 10:04 AM',
    },
  ],
  welcome: [
    {
      id: '8',
      author: 'Maya',
      initials: 'MA',
      color: '#A871C4',
      text: 'Welcome to Design Den! Introduce yourself and make yourself at home.',
      time: 'Monday at 12:00 PM',
    },
  ],
  rules: [
    {
      id: '9',
      author: 'Maya',
      initials: 'MA',
      color: '#A871C4',
      text: 'Be kind, give useful feedback, and credit the work you share.',
      time: 'Monday at 12:00 PM',
    },
  ],
  'garden-general': [
    {
      id: '10',
      author: 'Ari',
      initials: 'AR',
      color: '#8BAE78',
      text: 'Morning, garden crew! What is growing on your windowsill?',
      time: 'Today at 8:06 AM',
    },
  ],
  'garden-plants': [
    {
      id: '11',
      author: 'Ari',
      initials: 'AR',
      color: '#8BAE78',
      text: 'My monstera finally has a new leaf 🌿',
      time: 'Today at 8:16 AM',
    },
  ],
  'garden-photos': [
    {
      id: '12',
      author: 'Sam',
      initials: 'SA',
      color: '#D0A472',
      text: 'The light in the greenhouse was unreal this morning.',
      time: 'Today at 9:30 AM',
    },
  ],
  'music-general': [
    {
      id: '13',
      author: 'Jules',
      initials: 'JU',
      color: '#BB78A9',
      text: 'What is everyone listening to tonight?',
      time: 'Today at 7:22 PM',
    },
  ],
  'music-finds': [
    {
      id: '14',
      author: 'Jules',
      initials: 'JU',
      color: '#BB78A9',
      text: 'Found a little jazz track that feels like driving home in the rain.',
      time: 'Today at 7:38 PM',
    },
  ],
  'music-playlists': [
    {
      id: '15',
      author: 'Rae',
      initials: 'RA',
      color: '#7785B8',
      text: 'Post your favorite late night playlists here.',
      time: 'Yesterday at 11:18 PM',
    },
  ],
};
type Member = {
  name: string;
  username: string;
  initials: string;
  color: string;
  banner: string;
  status: 'Online' | 'Idle' | 'Do Not Disturb';
  activity: string;
  roles: { name: string; color: string }[];
  about: string;
  since: string;
};
const STATUS_COLORS = { Online: '#23A55A', Idle: '#F0B232', 'Do Not Disturb': '#F23F43' };
const MEMBERS: Member[] = [
  {
    name: 'Maya',
    username: 'maya.makes',
    initials: 'MA',
    color: '#A871C4',
    banner: '#6E4A86',
    status: 'Online',
    activity: 'Admin',
    roles: [
      { name: 'Admin', color: '#F47B67' },
      { name: 'Illustrator', color: '#A871C4' },
    ],
    about: 'Product designer by day, sketchbook hoarder by night. Ask me about color theory.',
    since: 'Mar 4, 2021',
  },
  {
    name: 'Leo',
    username: 'leo_pixels',
    initials: 'LE',
    color: '#5B95B5',
    banner: '#2F5D78',
    status: 'Online',
    activity: 'Drawing tiny icons',
    roles: [{ name: 'Icon Nerd', color: '#5B95B5' }],
    about: 'Making a 24px icon set one pixel at a time.',
    since: 'Aug 19, 2022',
  },
  {
    name: 'Nina',
    username: 'ninadraws',
    initials: 'NI',
    color: '#D88479',
    banner: '#9C544B',
    status: 'Idle',
    activity: 'Away for a bit',
    roles: [
      { name: 'Moderator', color: '#3BA55D' },
      { name: 'Motion', color: '#D88479' },
    ],
    about: 'Motion designer. Will happily critique your easing curves.',
    since: 'Jan 11, 2022',
  },
  {
    name: 'Owen',
    username: 'owen.codes',
    initials: 'OW',
    color: '#7DA66F',
    banner: '#4C6D42',
    status: 'Do Not Disturb',
    activity: 'Focusing in Figma',
    roles: [{ name: 'Prototyper', color: '#7DA66F' }],
    about: 'Design engineer. Mostly powered by coffee and auto layout.',
    since: 'Jun 2, 2023',
  },
  {
    name: 'You',
    username: 'you',
    initials: 'YO',
    color: '#5865F2',
    banner: '#3C45A5',
    status: 'Online',
    activity: 'Online',
    roles: [{ name: 'Member', color: '#A6ADB6' }],
    about: 'Just joined. Say hi!',
    since: 'Oct 29, 2026',
  },
];
const STORAGE = 'plocks-guildline-example:v2';
const timestamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

type PickerTarget = { kind: 'draft' } | { kind: 'reaction'; messageId: string };

function ProfileCard({ member, onMessage }: { member: Member; onMessage?: () => void }) {
  return (
    <Block gap={0} bg={C.card} radius={10}>
      <Block gap={0} h={64} bg={member.banner} />
      <Block gap={0} px={16} pb={16} mt={-38}>
        <Block gap={0} w={84} h={84} radius={42} bg={C.card} align="center" justify="center">
          <Avatar
            size={76}
            fallback={member.initials}
            bg={member.color}
            textColor="#fff"
            online
            indicatorColor={STATUS_COLORS[member.status]}
          />
        </Block>
        <Block gap={0} bg={C.main} radius={8} p={12} mt={10}>
          <Text c={C.white} fw="bold" size={20}>
            {member.name}
          </Text>
          <Text c={C.white} size={13}>
            {member.username}
          </Text>
          <Text c={C.muted} size={12} mt={4}>
            {member.status} · {member.activity}
          </Text>
          <Block gap={0} h={1} bg="#3F4147" my={12} />
          <Text c={C.white} fw="bold" size={11} mb={4}>
            ABOUT ME
          </Text>
          <Text c="#DBDEE1" size={13} lh={18}>
            {member.about}
          </Text>
          <Text c={C.white} fw="bold" size={11} mt={12} mb={4}>
            MEMBER SINCE
          </Text>
          <Text c="#DBDEE1" size={13}>
            {member.since}
          </Text>
          <Text c={C.white} fw="bold" size={11} mt={12} mb={6}>
            ROLES
          </Text>
          <Block direction="row" wrap="wrap" gap={5}>
            {member.roles.map((role) => (
              <Block key={role.name} direction="row" align="center" gap={5} bg={C.chip} radius={4} px={6} py={3}>
                <Block gap={0} w={10} h={10} radius={5} bg={role.color} />
                <Text c={C.white} size={12}>
                  {role.name}
                </Text>
              </Block>
            ))}
          </Block>
          {onMessage && (
            <Button mt={14} fullWidth color={C.blurple} onPress={onMessage}>
              Message @{member.username}
            </Button>
          )}
        </Block>
      </Block>
    </Block>
  );
}

function ChatScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const membersDocked = width >= 1180;
  const [serverId, setServerId] = useState('design');
  const [channelId, setChannelId] = useState('general');
  const [messages, setMessages] = useState<MessageMap>(SEED);
  const [draft, setDraft] = useState('');
  const [showChannels, setShowChannels] = useState(true);
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const scroll = useRef<ScrollView>(null);
  const server = SERVERS.find((item) => item.id === serverId)!;
  const channel =
    server.categories.flatMap((category) => category.channels).find(([id]) => id === channelId)?.[1] ?? 'general';
  const showMembers = membersDocked || membersOpen;
  const profileMember = MEMBERS.find((member) => member.name === profile);
  const currentMessages = messages[channelId] ?? [];
  const filtered = currentMessages.filter((message) =>
    `${message.author} ${message.text}`.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as MessageMap;
        if (saved && typeof saved === 'object') setMessages({ ...SEED, ...saved });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(messages)).catch(() => {});
  }, [messages, ready]);

  function openServer(id: string) {
    const next = SERVERS.find((item) => item.id === id)!;
    setServerId(id);
    setChannelId(next.categories[0].channels[0][0]);
    setShowChannels(true);
    setSearch('');
  }
  function openChannel(id: string) {
    setChannelId(id);
    setShowChannels(false);
    setSearch('');
  }
  function send() {
    if (!draft.trim()) return;
    const message: Message = {
      id: `local-${Date.now()}`,
      author: 'You',
      initials: 'YO',
      color: C.blurple,
      text: draft.trim(),
      time: `Today at ${timestamp()}`,
    };
    setMessages((old) => ({ ...old, [channelId]: [...(old[channelId] ?? []), message] }));
    setDraft('');
  }
  function toggleReaction(id: string, emoji: string, fromPicker = false) {
    setMessages((old) => ({
      ...old,
      [channelId]: (old[channelId] ?? []).map((message) => {
        if (message.id !== id) return message;
        const reactions = message.reactions ?? [];
        const existing = reactions.find((reaction) => reaction.emoji === emoji);
        if (!existing) return { ...message, reactions: [...reactions, { emoji, count: 1, mine: true }] };
        // Picking an emoji you already reacted with keeps it; pressing the chip toggles it.
        if (existing.mine && fromPicker) return message;
        const next = existing.mine
          ? { ...existing, count: existing.count - 1, mine: false }
          : { ...existing, count: existing.count + 1, mine: true };
        return {
          ...message,
          reactions: reactions
            .map((reaction) => (reaction.emoji === emoji ? next : reaction))
            .filter((reaction) => reaction.count > 0),
        };
      }),
    }));
  }
  function togglePicker(target: PickerTarget) {
    const same =
      picker?.kind === target.kind &&
      (target.kind === 'draft' || (picker.kind === 'reaction' && picker.messageId === target.messageId));
    setPicker(same ? null : target);
  }
  function pickEmoji({ emoji }: EmojiPickerSelection) {
    if (picker?.kind === 'reaction') {
      toggleReaction(picker.messageId, emoji, true);
      setPicker(null);
    } else {
      setDraft((value) => value + emoji);
    }
  }
  function messageMember(member: Member) {
    setProfile(null);
    setMembersOpen(false);
    setDraft(`@${member.username} `);
  }

  const emojiPicker = (
    <EmojiPicker
      withBorder={false}
      w={wide ? 352 : '100%'}
      h={wide ? 400 : 300}
      searchPlaceholder={picker?.kind === 'reaction' ? 'Find a reaction' : 'Find the perfect emoji'}
      onSelect={pickEmoji}
    />
  );
  // Wide screens anchor the picker to whatever opened it; narrow screens dock it above the composer.
  function withPicker(open: boolean, target: ReactElement, position: 'top-start' | 'top-end') {
    if (!wide) return target;
    return (
      <Popover opened={open} onChange={(next) => !next && setPicker(null)} position={position} offset={6}>
        <Popover.Target>{target}</Popover.Target>
        <Popover.Dropdown>{open && emojiPicker}</Popover.Dropdown>
      </Popover>
    );
  }

  const serverRail = (
    <Block w={72} bg={C.rail} align="center" py={14} gap={12}>
      <Block
        gap={0}
        onPress={() => openServer('design')}
        accessibilityLabel="Home"
        w={48}
        h={48}
        radius={16}
        bg={C.blurple}
        align="center"
        justify="center"
      >
        <Text c="#fff" fw="bold" size={27}>
          ✦
        </Text>
      </Block>
      <Block gap={0} w={30} h={2} bg="#46484F" my={2} />
      {SERVERS.map((item) => (
        <Block
          gap={0}
          key={item.id}
          onPress={() => openServer(item.id)}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          w={48}
          h={48}
          radius={serverId === item.id ? 16 : 24}
          bg={item.color}
          align="center"
          justify="center"
        >
          <Text c="#fff" fw="bold" size={25}>
            {item.icon}
          </Text>
        </Block>
      ))}
    </Block>
  );
  const channelSidebar = (
    <Block gap={0} flex={wide ? undefined : 1} w={wide ? 245 : undefined} bg={C.sidebar}>
      <Block
        gap={0}
        h={54}
        px={16}
        borderBottomWidth={1}
        borderBottomColor={C.line}
        direction="row"
        align="center"
        justify="space-between"
      >
        <Text c={C.white} fw="bold" size={16} numberOfLines={1} flex={1}>
          {server.name}
        </Text>
        <Icon name="chevronDown" color={C.muted} size={18} stroke={2.5} />
      </Block>
      <ScrollArea flex={1} contentProps={{ pt: 15, px: 8 }}>
        {server.categories.map((category) => (
          <Block gap={0} key={category.title} mb={16}>
            <Block
              direction="row"
              align="center"
              gap={2}
              h={26}
              pl={2}
              mb={2}
              onPress={() => setCollapsed((old) => ({ ...old, [category.title]: !old[category.title] }))}
              accessibilityRole="button"
              accessibilityLabel={`${collapsed[category.title] ? 'Expand' : 'Collapse'} ${category.title}`}
            >
              <Icon name={collapsed[category.title] ? 'chevronRight' : 'chevronDown'} color={C.dim} size={12} stroke={2.5} />
              <Text c={C.muted} fw="bold" size={11} lts={0.4}>
                {category.title}
              </Text>
            </Block>
            {category.channels
              .filter(([id]) => !collapsed[category.title] || id === channelId)
              .map(([id, name]) => (
              <Block
                key={id}
                onPress={() => openChannel(id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${name} channel`}
                direction="row"
                align="center"
                gap={9}
                px={10}
                h={35}
                radius={5}
                bg={channelId === id ? '#404249' : 'transparent'}
              >
                <Icon name="number" color={channelId === id ? C.white : C.dim} size={21} />
                <Text c={channelId === id ? C.white : C.muted} fw={channelId === id ? 'semibold' : 'normal'} size={15}>
                  {name}
                </Text>
              </Block>
            ))}
          </Block>
        ))}
      </ScrollArea>
      <Block p={10} bg="#232428" direction="row" align="center" gap={9}>
        <Avatar size="md" fallback="YO" bg={C.blurple} textColor="#fff" />
        <Block gap={0} flex={1}>
          <Text c={C.white} fw="bold" size={12}>
            You
          </Text>
          <Text c={C.muted} size={11}>
            Online
          </Text>
        </Block>
        <Icon name="settings" color={C.muted} size={18} />
      </Block>
    </Block>
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.main}>
      <StatusBar barStyle="light-content" />
      <Block gap={0} flex={1} direction="row">
        {serverRail}
        {(wide || showChannels) && channelSidebar}
        {(wide || !showChannels) && (
          <Block gap={0} flex={1} miw={0} bg={C.main}>
            <Block
              h={54}
              borderBottomWidth={1}
              borderBottomColor={C.line}
              direction="row"
              align="center"
              gap={9}
              px={15}
            >
              {!wide && (
                <IconButton
                  icon="menu"
                  variant="ghost"
                  iconColor={C.muted}
                  accessibilityLabel="Show channels"
                  onPress={() => setShowChannels(true)}
                />
              )}
              <Icon name="number" color={C.dim} size={24} />
              <Text c={C.white} fw="bold" size={16}>
                {channel}
              </Text>
              <Block gap={0} w={1} h={23} bg="#52545A" mx={5} />
              <Text c={C.muted} size={12} numberOfLines={1} flex={1}>
                A place to connect and share.
              </Text>
              {!membersDocked && (
                <IconButton
                  icon="users"
                  variant="ghost"
                  iconColor={membersOpen ? C.white : C.muted}
                  accessibilityLabel={membersOpen ? 'Hide member list' : 'Show member list'}
                  onPress={() => setMembersOpen((open) => !open)}
                />
              )}
              <Icon name="search" color={C.muted} size={20} />
            </Block>
            <Block gap={0} flex={1} direction="row">
              {(wide || !membersOpen) && (
              <Block gap={0} flex={1} miw={0}>
                <ScrollArea
                  ref={scroll}
                  flex={1}
                  contentProps={{ py: 20, grow: 1, justify: 'flex-end' }}
                  onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
                >
                  <Block gap={0} px={20} mb={16}>
                    <Block gap={0} w={55} h={55} radius={28} bg="#404249" align="center" justify="center" mb={12}>
                      <Icon name="number" color={C.white} size={30} />
                    </Block>
                    <Text c={C.white} fw="bold" size={26}>
                      Welcome to #{channel}!
                    </Text>
                    <Text c={C.muted} size={13}>
                      This is the beginning of the #{channel} channel.
                    </Text>
                  </Block>
                  <Block gap={0} h={1} bg="#53565F" mx={20} mb={14} />
                  {filtered.map((message) => (
                    <Block key={message.id} direction="row" gap={13} px={18} py={9}>
                      <Avatar size="md" fallback={message.initials} bg={message.color} textColor="#fff" />
                      <Block gap={0} flex={1} miw={0}>
                        <Block direction="row" align="center" gap={8}>
                          <Text c={C.white} fw="bold" size={14}>
                            {message.author}
                          </Text>
                          <Text c={C.dim} size={10}>
                            {message.time}
                          </Text>
                        </Block>
                        <Text c="#DBDEE1" size={14} lh={22} mt={3}>
                          {message.text}
                        </Text>
                        <Block direction="row" wrap="wrap" align="center" gap={5} mt={6}>
                          {(message.reactions ?? []).map((reaction) => (
                            <Block
                              key={reaction.emoji}
                              onPress={() => toggleReaction(message.id, reaction.emoji)}
                              accessibilityRole="button"
                              accessibilityLabel={`${reaction.emoji} ${reaction.count}, ${reaction.mine ? 'remove' : 'add'} your reaction`}
                              direction="row"
                              align="center"
                              gap={5}
                              h={26}
                              px={7}
                              radius={8}
                              bg={reaction.mine ? C.mine : C.chip}
                              borderWidth={1}
                              borderColor={reaction.mine ? C.blurple : 'transparent'}
                            >
                              <Text size={14}>{reaction.emoji}</Text>
                              <Text c={reaction.mine ? '#C9CDFB' : C.muted} fw="semibold" size={12}>
                                {reaction.count}
                              </Text>
                            </Block>
                          ))}
                          {withPicker(
                            picker?.kind === 'reaction' && picker.messageId === message.id,
                            <Block
                              gap={0}
                              onPress={() => togglePicker({ kind: 'reaction', messageId: message.id })}
                              accessibilityRole="button"
                              accessibilityLabel="Add reaction"
                              h={26}
                              w={34}
                              radius={8}
                              bg={C.chip}
                              align="center"
                              justify="center"
                            >
                              <Icon name="mood-plus" color={C.muted} size={16} />
                            </Block>,
                            'top-start',
                          )}
                        </Block>
                      </Block>
                    </Block>
                  ))}
                  {search && !filtered.length && (
                    <Text c={C.muted} ta="center" p={25}>
                      No messages found.
                    </Text>
                  )}
                </ScrollArea>
                {!wide && picker && (
                  <Block gap={0} bg={C.sidebar} borderTopWidth={1} borderTopColor={C.line} px={8} pt={8}>
                    {picker.kind === 'reaction' && (
                      <Block direction="row" align="center" justify="space-between" px={6} pb={6}>
                        <Text c={C.muted} fw="bold" size={11}>
                          ADD A REACTION
                        </Text>
                        <IconButton
                          icon="x"
                          variant="ghost"
                          size="sm"
                          iconColor={C.muted}
                          accessibilityLabel="Close emoji picker"
                          onPress={() => setPicker(null)}
                        />
                      </Block>
                    )}
                    {emojiPicker}
                  </Block>
                )}
                <Block gap={0} px={16} pb={16} pt={7}>
                  <Block direction="row" align="center" bg={C.input} radius={8} px={12} gap={10}>
                    <Icon name="plus" color={C.muted} size={22} />
                    <Input
                      variant="unstyled"
                      value={draft}
                      onChangeText={setDraft}
                      onEnter={send}
                      onFocus={() => !wide && setPicker(null)}
                      placeholder={`Message #${channel}`}
                      placeholderTextColor={C.dim}
                      mb={0}
                      flex={1}
                      mih={44}
                      inputColor={C.white}
                      inputFontSize={14}
                    />
                    {withPicker(
                      picker?.kind === 'draft',
                      <IconButton
                        icon="emoji"
                        variant="ghost"
                        iconColor={picker?.kind === 'draft' ? C.white : C.muted}
                        accessibilityLabel="Choose an emoji"
                        onPress={() => togglePicker({ kind: 'draft' })}
                      />,
                      'top-end',
                    )}
                    <IconButton
                      icon="arrowRight"
                      variant="ghost"
                      iconColor={draft.trim() ? C.white : C.dim}
                      accessibilityLabel="Send message"
                      disabled={!draft.trim()}
                      onPress={send}
                    />
                  </Block>
                </Block>
              </Block>
              )}
              {showMembers && (
                <Block gap={0} flex={wide ? undefined : 1} w={wide ? 240 : undefined} bg={C.sidebar} p={15}>
                  <Text c={C.muted} fw="bold" size={11} mb={15}>
                    ONLINE — {MEMBERS.length}
                  </Text>
                  {MEMBERS.map((member) => {
                    const row = (
                      <Block
                        direction="row"
                        align="center"
                        gap={10}
                        px={8}
                        py={6}
                        mb={4}
                        radius={6}
                        bg={profile === member.name ? '#404249' : 'transparent'}
                        onPress={() => setProfile(profile === member.name ? null : member.name)}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${member.name}'s profile`}
                      >
                        <Avatar
                          size="md"
                          fallback={member.initials}
                          bg={member.color}
                          textColor="#fff"
                          online
                          indicatorColor={STATUS_COLORS[member.status]}
                        />
                        <Block gap={0} flex={1} miw={0}>
                          <Text c={C.white} fw="semibold" size={13}>
                            {member.name}
                          </Text>
                          <Text c={C.dim} size={11} numberOfLines={1}>
                            {member.activity}
                          </Text>
                        </Block>
                      </Block>
                    );
                    if (!wide) return <Block key={member.name}>{row}</Block>;
                    return (
                      <Popover
                        key={member.name}
                        opened={profile === member.name}
                        onChange={(next) => !next && setProfile(null)}
                        position="left-start"
                        offset={12}
                        w={300}
                        radius={10}
                        shadow="lg"
                      >
                        <Popover.Target>{row}</Popover.Target>
                        <Popover.Dropdown>
                          <ProfileCard
                            member={member}
                            onMessage={member.name === 'You' ? undefined : () => messageMember(member)}
                          />
                        </Popover.Dropdown>
                      </Popover>
                    );
                  })}
                  <Input
                    variant="filled"
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search this channel"
                    placeholderTextColor={C.dim}
                    mb={0}
                    mt={15}
                    radius={6}
                    inputColor={C.white}
                    inputFontSize={12}
                  />
                </Block>
              )}
            </Block>
          </Block>
        )}
      </Block>
      <Dialog
        opened={!wide && !!profileMember}
        variant="bottomsheet"
        accessibilityLabel={`${profileMember?.name ?? ''} profile`}
        showHeader={false}
        p={0}
        onClose={() => setProfile(null)}
      >
        {profileMember && (
          <ProfileCard
            member={profileMember}
            onMessage={profileMember.name === 'You' ? undefined : () => messageMember(profileMember)}
          />
        )}
      </Dialog>
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
        <ChatScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
