import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui';

const C = { rail: '#1E1F22', sidebar: '#2B2D31', main: '#313338', top: '#2B2D31', input: '#383A40',
  white: '#F2F3F5', muted: '#A6ADB6', dim: '#828891', line: '#202127', blurple: '#5865F2', green: '#3BA55D' };
const SERVERS = [
  { id: 'design', icon: '✦', name: 'Design Den', color: '#5865F2', categories: [
    { title: 'WELCOME', channels: [['welcome', 'welcome'], ['rules', 'guidelines']] },
    { title: 'HANGOUT', channels: [['general', 'general'], ['inspiration', 'inspiration'], ['feedback', 'feedback']] },
  ] },
  { id: 'garden', icon: '🌱', name: 'The Garden', color: '#427D62', categories: [
    { title: 'LOUNGE', channels: [['garden-general', 'general'], ['garden-plants', 'plant-talk'], ['garden-photos', 'photos']] },
  ] },
  { id: 'music', icon: '♫', name: 'After Hours', color: '#B7678B', categories: [
    { title: 'CHANNELS', channels: [['music-general', 'general'], ['music-finds', 'new-finds'], ['music-playlists', 'playlists']] },
  ] },
];
type Message = { id: string; author: string; initials: string; color: string; text: string; time: string; reactions?: string[] };
type MessageMap = Record<string, Message[]>;
const SEED: MessageMap = {
  general: [
    { id: '1', author: 'Maya', initials: 'MA', color: '#A871C4', text: 'Good morning everyone! What are you working on today?', time: 'Today at 9:14 AM', reactions: ['☀️ 3'] },
    { id: '2', author: 'Leo', initials: 'LE', color: '#5B95B5', text: 'A tiny icon set for our new project. The details are taking forever but I love it.', time: 'Today at 9:18 AM', reactions: ['✨ 2'] },
    { id: '3', author: 'Nina', initials: 'NI', color: '#D88479', text: 'That sounds lovely! Drop a preview when you can 👀', time: 'Today at 9:21 AM' },
    { id: '4', author: 'Owen', initials: 'OW', color: '#7DA66F', text: 'I just made coffee and opened Figma. That counts as progress, right?', time: 'Today at 9:26 AM', reactions: ['☕ 5'] },
  ],
  inspiration: [
    { id: '5', author: 'Maya', initials: 'MA', color: '#A871C4', text: 'This color palette has been living in my head all week: lilac, moss, and warm cream.', time: 'Yesterday at 4:02 PM', reactions: ['💜 4'] },
    { id: '6', author: 'Nina', initials: 'NI', color: '#D88479', text: 'A little reminder that your moodboards are allowed to be messy.', time: 'Today at 8:40 AM' },
  ],
  feedback: [{ id: '7', author: 'Leo', initials: 'LE', color: '#5B95B5', text: 'If anyone has a spare minute, I would love fresh eyes on a navigation idea.', time: 'Today at 10:04 AM' }],
  welcome: [{ id: '8', author: 'Maya', initials: 'MA', color: '#A871C4', text: 'Welcome to Design Den! Introduce yourself and make yourself at home.', time: 'Monday at 12:00 PM' }],
  rules: [{ id: '9', author: 'Maya', initials: 'MA', color: '#A871C4', text: 'Be kind, give useful feedback, and credit the work you share.', time: 'Monday at 12:00 PM' }],
  'garden-general': [{ id: '10', author: 'Ari', initials: 'AR', color: '#8BAE78', text: 'Morning, garden crew! What is growing on your windowsill?', time: 'Today at 8:06 AM' }],
  'garden-plants': [{ id: '11', author: 'Ari', initials: 'AR', color: '#8BAE78', text: 'My monstera finally has a new leaf 🌿', time: 'Today at 8:16 AM' }],
  'garden-photos': [{ id: '12', author: 'Sam', initials: 'SA', color: '#D0A472', text: 'The light in the greenhouse was unreal this morning.', time: 'Today at 9:30 AM' }],
  'music-general': [{ id: '13', author: 'Jules', initials: 'JU', color: '#BB78A9', text: 'What is everyone listening to tonight?', time: 'Today at 7:22 PM' }],
  'music-finds': [{ id: '14', author: 'Jules', initials: 'JU', color: '#BB78A9', text: 'Found a little jazz track that feels like driving home in the rain.', time: 'Today at 7:38 PM' }],
  'music-playlists': [{ id: '15', author: 'Rae', initials: 'RA', color: '#7785B8', text: 'Post your favorite late night playlists here.', time: 'Yesterday at 11:18 PM' }],
};
const MEMBERS = [
  { name: 'Maya', initials: 'MA', color: '#A871C4', role: 'Admin' },
  { name: 'Leo', initials: 'LE', color: '#5B95B5', role: 'Online' },
  { name: 'Nina', initials: 'NI', color: '#D88479', role: 'Online' },
  { name: 'Owen', initials: 'OW', color: '#7DA66F', role: 'Online' },
  { name: 'You', initials: 'YO', color: '#5865F2', role: 'Online' },
];
const STORAGE = 'plocks-discord-example:v1';
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
  const channel = server.categories.flatMap((category) => category.channels).find(([id]) => id === channelId)?.[1] ?? 'general';
  const currentMessages = messages[channelId] ?? [];
  const filtered = currentMessages.filter((message) => `${message.author} ${message.text}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const saved = JSON.parse(raw) as MessageMap;
      if (saved && typeof saved === 'object') setMessages({ ...SEED, ...saved });
    }).catch(() => {}).finally(() => setReady(true));
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
  function openChannel(id: string) { setChannelId(id); setShowChannels(false); setSearch(''); }
  function send() {
    if (!draft.trim()) return;
    const message: Message = { id: `local-${Date.now()}`, author: 'You', initials: 'YO', color: C.blurple,
      text: draft.trim(), time: `Today at ${timestamp()}` };
    setMessages((old) => ({ ...old, [channelId]: [...(old[channelId] ?? []), message] }));
    setDraft('');
  }
  function react(id: string) {
    setMessages((old) => ({ ...old, [channelId]: (old[channelId] ?? []).map((message) => message.id === id
      ? { ...message, reactions: [...(message.reactions ?? []), '💜 1'] } : message) }));
  }

  const serverRail = <View style={{ width: 72, backgroundColor: C.rail, alignItems: 'center', paddingVertical: 14, gap: 12 }}>
    <Pressable onPress={() => openServer('design')} accessibilityLabel="Home" style={{ width: 48, height: 48, borderRadius: 16,
      backgroundColor: C.blurple, alignItems: 'center', justifyContent: 'center' }}><Text c="#fff" fw="bold" size={27}>✦</Text></Pressable>
    <View style={{ width: 30, height: 2, backgroundColor: '#46484F', marginVertical: 2 }} />
    {SERVERS.map((item) => <Pressable key={item.id} onPress={() => openServer(item.id)} accessibilityRole="button"
      accessibilityLabel={item.name} style={{ width: 48, height: 48, borderRadius: serverId === item.id ? 16 : 24,
        backgroundColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
      <Text c="#fff" fw="bold" size={25}>{item.icon}</Text></Pressable>)}
  </View>;
  const channelSidebar = <View style={{ flex: wide ? undefined : 1, width: wide ? 245 : undefined, backgroundColor: C.sidebar }}>
    <View style={{ height: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.line,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text c={C.white} fw="bold" size={17}>{server.name}</Text><Icon name="chevronDown" color={C.white} size={18} />
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 15, paddingHorizontal: 8 }}>
      {server.categories.map((category) => <View key={category.title} style={{ marginBottom: 23 }}>
        <Text c={C.muted} fw="bold" size={11} style={{ marginLeft: 10, marginBottom: 7 }}>⌄  {category.title}</Text>
        {category.channels.map(([id, name]) => <Pressable key={id} onPress={() => openChannel(id)}
          accessibilityRole="button" accessibilityLabel={`Open ${name} channel`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, height: 35, borderRadius: 5,
            backgroundColor: channelId === id ? '#404249' : 'transparent' }}>
          <Icon name="number" color={channelId === id ? C.white : C.dim} size={21} />
          <Text c={channelId === id ? C.white : C.muted} fw={channelId === id ? 'semibold' : 'normal'} size={15}>{name}</Text>
        </Pressable>)}
      </View>)}
    </ScrollView>
    <View style={{ padding: 10, backgroundColor: '#232428', flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Avatar size="md" fallback="YO" bg={C.blurple} textColor="#fff" /><View style={{ flex: 1 }}>
        <Text c={C.white} fw="bold" size={12}>You</Text><Text c={C.muted} size={11}>Online</Text></View>
      <Icon name="settings" color={C.muted} size={18} />
    </View>
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.main }}><StatusBar barStyle="light-content" />
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {serverRail}
      {(wide || showChannels) && channelSidebar}
      {(wide || !showChannels) && <View style={{ flex: 1, minWidth: 0, backgroundColor: C.main }}>
        <View style={{ height: 54, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row',
          alignItems: 'center', gap: 9, paddingHorizontal: 15 }}>
          {!wide && <IconButton icon="menu" variant="ghost" iconColor={C.muted} accessibilityLabel="Show channels" onPress={() => setShowChannels(true)} />}
          <Icon name="number" color={C.dim} size={24} />
          <Text c={C.white} fw="bold" size={16}>{channel}</Text>
          <View style={{ width: 1, height: 23, backgroundColor: '#52545A', marginHorizontal: 5 }} />
          <Text c={C.muted} size={12} numberOfLines={1} style={{ flex: 1 }}>A place to connect and share.</Text>
          <Icon name="search" color={C.muted} size={20} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 20, flexGrow: 1, justifyContent: 'flex-end' }}
              onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <View style={{ width: 55, height: 55, borderRadius: 28, backgroundColor: '#404249', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon name="number" color={C.white} size={30} /></View>
                <Text c={C.white} fw="bold" size={26}>Welcome to #{channel}!</Text>
                <Text c={C.muted} size={13}>This is the beginning of the #{channel} channel.</Text>
              </View>
              <View style={{ height: 1, backgroundColor: '#53565F', marginHorizontal: 20, marginBottom: 14 }} />
              {filtered.map((message) => <View key={message.id} style={{ flexDirection: 'row', gap: 13, paddingHorizontal: 18, paddingVertical: 9 }}>
                <Avatar size="md" fallback={message.initials} bg={message.color} textColor="#fff" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text c={C.white} fw="bold" size={14}>{message.author}</Text>
                    <Text c={C.dim} size={10}>{message.time}</Text>
                  </View>
                  <Text c="#DBDEE1" size={14} style={{ lineHeight: 22, marginTop: 3 }}>{message.text}</Text>
                  {!!message.reactions?.length && <View style={{ flexDirection: 'row', gap: 5, marginTop: 6 }}>
                    {message.reactions.map((reaction, i) => <Pressable key={i} onPress={() => react(message.id)}
                      style={{ backgroundColor: '#404249', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }}>
                      <Text c={C.white} size={12}>{reaction}</Text></Pressable>)}
                  </View>}
                  {!message.reactions?.length && <Pressable onPress={() => react(message.id)} accessibilityLabel="React with heart"
                    style={{ alignSelf: 'flex-start', paddingTop: 4 }}><Text c={C.dim} size={11}>♡ React</Text></Pressable>}
                </View>
              </View>)}
              {search && !filtered.length && <Text c={C.muted} ta="center" style={{ padding: 25 }}>No messages found.</Text>}
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, borderRadius: 8, paddingHorizontal: 12, gap: 10 }}>
                <Icon name="plus" color={C.muted} size={22} />
                <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send}
                  placeholder={`Message #${channel}`} placeholderTextColor={C.dim}
                  style={{ flex: 1, minHeight: 44, color: C.white, fontSize: 14 }} />
                <IconButton icon="arrowRight" variant="ghost" iconColor={draft.trim() ? C.white : C.dim}
                  accessibilityLabel="Send message" disabled={!draft.trim()} onPress={send} />
              </View>
            </View>
          </View>
          {showMembers && <View style={{ width: 215, backgroundColor: C.sidebar, padding: 15 }}>
            <Text c={C.muted} fw="bold" size={11} style={{ marginBottom: 15 }}>ONLINE — {MEMBERS.length}</Text>
            {MEMBERS.map((member) => <View key={member.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 17 }}>
              <Avatar size="md" fallback={member.initials} bg={member.color} textColor="#fff" />
              <View><Text c={C.white} fw="semibold" size={13}>{member.name}</Text><Text c={C.dim} size={11}>{member.role}</Text></View>
            </View>)}
            <TextInput value={search} onChangeText={setSearch} placeholder="Search this channel"
              placeholderTextColor={C.dim} style={{ marginTop: 15, borderRadius: 6, backgroundColor: C.input, padding: 9, color: C.white, fontSize: 12 }} />
          </View>}
        </View>
      </View>}
    </View>
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'dark' }}><ChatScreen /></PlocksProvider></SafeAreaProvider>;
}
