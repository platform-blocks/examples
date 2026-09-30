import { useEffect, useRef, useState } from 'react';
import { StatusBar, useWindowDimensions, type ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Input, SafeArea, ScrollArea, Block, Avatar, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui';

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
  reactions?: string[];
};
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
      reactions: ['☀️ 3'],
    },
    {
      id: '2',
      author: 'Leo',
      initials: 'LE',
      color: '#5B95B5',
      text: 'A tiny icon set for our new project. The details are taking forever but I love it.',
      time: 'Today at 9:18 AM',
      reactions: ['✨ 2'],
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
      reactions: ['☕ 5'],
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
      reactions: ['💜 4'],
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
const MEMBERS = [
  { name: 'Maya', initials: 'MA', color: '#A871C4', role: 'Admin' },
  { name: 'Leo', initials: 'LE', color: '#5B95B5', role: 'Online' },
  { name: 'Nina', initials: 'NI', color: '#D88479', role: 'Online' },
  { name: 'Owen', initials: 'OW', color: '#7DA66F', role: 'Online' },
  { name: 'You', initials: 'YO', color: '#5865F2', role: 'Online' },
];
const STORAGE = 'plocks-guildline-example:v1';
const timestamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function ChatScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const showMembers = width >= 1180;
  const [serverId, setServerId] = useState('design');
  const [channelId, setChannelId] = useState('general');
  const [messages, setMessages] = useState<MessageMap>(SEED);
  const [draft, setDraft] = useState('');
  const [showChannels, setShowChannels] = useState(true);
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const server = SERVERS.find((item) => item.id === serverId)!;
  const channel =
    server.categories.flatMap((category) => category.channels).find(([id]) => id === channelId)?.[1] ?? 'general';
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
  function react(id: string) {
    setMessages((old) => ({
      ...old,
      [channelId]: (old[channelId] ?? []).map((message) =>
        message.id === id ? { ...message, reactions: [...(message.reactions ?? []), '💜 1'] } : message,
      ),
    }));
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
        <Text c={C.white} fw="bold" size={17}>
          {server.name}
        </Text>
        <Icon name="chevronDown" color={C.white} size={18} />
      </Block>
      <ScrollArea flex={1} contentProps={{ pt: 15, px: 8 }}>
        {server.categories.map((category) => (
          <Block gap={0} key={category.title} mb={23}>
            <Text c={C.muted} fw="bold" size={11} ml={10} mb={7}>
              ⌄ {category.title}
            </Text>
            {category.channels.map(([id, name]) => (
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
              <Icon name="search" color={C.muted} size={20} />
            </Block>
            <Block gap={0} flex={1} direction="row">
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
                        {!!message.reactions?.length && (
                          <Block direction="row" gap={5} mt={6}>
                            {message.reactions.map((reaction, i) => (
                              <Block
                                gap={0}
                                key={i}
                                onPress={() => react(message.id)}
                                bg="#404249"
                                radius={8}
                                px={7}
                                py={4}
                              >
                                <Text c={C.white} size={12}>
                                  {reaction}
                                </Text>
                              </Block>
                            ))}
                          </Block>
                        )}
                        {!message.reactions?.length && (
                          <Block
                            gap={0}
                            onPress={() => react(message.id)}
                            accessibilityLabel="React with heart"
                            alignSelf="flex-start"
                            pt={4}
                          >
                            <Text c={C.dim} size={11}>
                              ♡ React
                            </Text>
                          </Block>
                        )}
                      </Block>
                    </Block>
                  ))}
                  {search && !filtered.length && (
                    <Text c={C.muted} ta="center" p={25}>
                      No messages found.
                    </Text>
                  )}
                </ScrollArea>
                <Block gap={0} px={16} pb={16} pt={7}>
                  <Block direction="row" align="center" bg={C.input} radius={8} px={12} gap={10}>
                    <Icon name="plus" color={C.muted} size={22} />
                    <Input
                      variant="unstyled"
                      value={draft}
                      onChangeText={setDraft}
                      onEnter={send}
                      placeholder={`Message #${channel}`}
                      placeholderTextColor={C.dim}
                      mb={0}
                      flex={1}
                      mih={44}
                      inputColor={C.white}
                      inputFontSize={14}
                    />
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
              {showMembers && (
                <Block gap={0} w={215} bg={C.sidebar} p={15}>
                  <Text c={C.muted} fw="bold" size={11} mb={15}>
                    ONLINE — {MEMBERS.length}
                  </Text>
                  {MEMBERS.map((member) => (
                    <Block key={member.name} direction="row" align="center" gap={10} mb={17}>
                      <Avatar size="md" fallback={member.initials} bg={member.color} textColor="#fff" />
                      <Block gap={0}>
                        <Text c={C.white} fw="semibold" size={13}>
                          {member.name}
                        </Text>
                        <Text c={C.dim} size={11}>
                          {member.role}
                        </Text>
                      </Block>
                    </Block>
                  ))}
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
