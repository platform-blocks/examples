import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconButton, PlocksProvider, Text } from '@plocks/ui';

const C = { bg: '#FFFFFF', sidebar: '#F8F7F5', ink: '#262626', muted: '#777674', line: '#E7E6E3', accent: '#2A6B59', pale: '#EAF3EE', white: '#FFF' };
type Message = { id: string; role: 'user' | 'assistant'; text: string };
type Chat = { id: string; title: string; messages: Message[] };
const STORAGE = 'plocks-chatgpt-example:v1';
const SUGGESTIONS = [
  { title: 'Plan a calm weekend', subtitle: 'with room to recharge', prompt: 'Plan a calm weekend with room to recharge' },
  { title: 'Brainstorm a name', subtitle: 'for a neighborhood café', prompt: 'Brainstorm a name for a neighborhood café' },
  { title: 'Write a friendly email', subtitle: 'to reschedule a meeting', prompt: 'Write a friendly email to reschedule a meeting' },
  { title: 'Explain a concept', subtitle: 'like I am new to it', prompt: 'Explain how a rainbow forms' },
];
function demoReply(prompt: string) {
  const input = prompt.toLowerCase();
  if (input.includes('weekend') || input.includes('plan')) return 'Here is a gentle weekend plan:\n\nSaturday morning: take a slow walk and get a favorite drink.\nSaturday afternoon: spend one focused hour on something creative, then leave the rest open.\nSunday: make an easy meal, call someone you miss, and prepare one small thing for Monday.\n\nKeep the plan light enough to change when you feel like it.';
  if (input.includes('name') || input.includes('brainstorm') || input.includes('idea')) return 'A few starting ideas:\n\n• Corner & Co.\n• Little Window\n• Daybreak House\n• Common Ground\n• The Warm Cup\n\nTell me the mood and neighborhood, and I can make the list more specific.';
  if (input.includes('email') || input.includes('write')) return 'Subject: Could we find another time?\n\nHi there,\n\nI hope you are doing well. Something has come up, and I need to reschedule our meeting. Would you be available later this week? I am happy to work around your schedule.\n\nThanks for understanding,\n[Your name]';
  if (input.includes('rainbow') || input.includes('explain')) return 'A rainbow appears when sunlight passes through raindrops. The light bends as it enters, reflects inside the drop, then bends again as it leaves. Different colors bend by different amounts, so the white light spreads into a colorful arc.\n\nThe sun is usually behind you and the rain is in front of you when you see one.';
  if (input.includes('hello') || input.includes('hi')) return 'Hello! I am a scripted local demo of a chat interface. Try asking me for a weekend plan, a café name, a friendly email, or a simple explanation.';
  return 'I am a local demo, so my replies come from a small set of scripted examples. I can show how this chat UI handles messages and history. Try asking for a weekend plan, a café name, a friendly email, or an explanation of a rainbow.';
}

function MosaicScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 800;
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingChat, setLoadingChat] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useRef<ScrollView>(null);
  const active = chats.find((chat) => chat.id === activeId);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as Chat[];
      if (Array.isArray(data)) setChats(data);
    }).catch(() => {}).finally(() => setReady(true));
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(chats)).catch(() => {});
  }, [chats, ready]);
  function newChat() { setActiveId(null); setDraft(''); setSidebarOpen(false); }
  function sendPrompt(value = draft) {
    const text = value.trim();
    if (!text || loadingChat) return;
    const id = activeId ?? `chat-${Date.now()}`;
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text };
    setChats((old) => {
      const existing = old.find((chat) => chat.id === id);
      if (existing) return old.map((chat) => chat.id === id ? { ...chat, messages: [...chat.messages, userMessage] } : chat);
      return [{ id, title: text.slice(0, 34) + (text.length > 34 ? '…' : ''), messages: [userMessage] }, ...old];
    });
    setActiveId(id); setDraft(''); setLoadingChat(id);
    timer.current = setTimeout(() => {
      const reply: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: demoReply(text) };
      setChats((old) => old.map((chat) => chat.id === id ? { ...chat, messages: [...chat.messages, reply] } : chat));
      setLoadingChat(null);
    }, 650);
  }
  const sidebar = <View style={{ width: wide ? 255 : 280, flex: wide ? undefined : 1, backgroundColor: C.sidebar, padding: 13 }}>
    <Pressable onPress={newChat} accessibilityRole="button" accessibilityLabel="New chat"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, borderRadius: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
      <Icon name="edit" color={C.ink} size={18} /><Text c={C.ink} fw="semibold" size={13}>New chat</Text>
    </Pressable>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, marginTop: 18, marginBottom: 10, backgroundColor: '#EEEDEB', borderRadius: 8 }}>
      <Icon name="search" color={C.muted} size={16} /><TextInput value={search} onChangeText={setSearch} placeholder="Search chats"
        style={{ flex: 1, padding: 8, color: C.ink, fontSize: 12 }} /></View>
    <Text c={C.muted} fw="bold" size={11} style={{ marginLeft: 9, marginBottom: 8 }}>RECENT</Text>
    <ScrollView style={{ flex: 1 }}>
      {chats.filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase())).map((chat) => <Pressable key={chat.id}
        onPress={() => { setActiveId(chat.id); setSidebarOpen(false); }} accessibilityRole="button" accessibilityLabel={`Open ${chat.title}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, padding: 10, backgroundColor: activeId === chat.id ? '#EAE9E6' : 'transparent' }}>
        <Icon name="message" color={C.muted} size={15} />
        <Text c={C.ink} size={12} numberOfLines={1} style={{ flex: 1 }}>{chat.title}</Text>
        <Pressable onPress={(event) => { event.stopPropagation(); setChats((old) => old.filter((item) => item.id !== chat.id)); if (activeId === chat.id) setActiveId(null); }}
          accessibilityLabel={`Delete ${chat.title}`}><Icon name="trash" color={C.muted} size={15} /></Pressable>
      </Pressable>)}
    </ScrollView>
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, padding: 11, gap: 4 }}>
      <Text c={C.ink} fw="semibold" size={12}>Mosaic demo</Text>
      <Text c={C.muted} size={10}>Scripted replies · saved on device</Text>
    </View>
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, flexDirection: 'row', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      {wide && sidebar}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ height: 58, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
          {!wide && <IconButton icon="menu" variant="ghost" iconColor={C.ink} accessibilityLabel="Show chats" onPress={() => setSidebarOpen(true)} />}
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Text c={C.white} fw="bold" size={18}>✦</Text></View>
          <Text c={C.ink} fw="bold" size={17} numberOfLines={1} style={{ flex: 1 }}>{active?.title ?? 'Mosaic'}</Text>
          <Text c={C.muted} size={11}>Demo mode</Text>
          {!wide && <IconButton icon="edit" variant="ghost" iconColor={C.ink} accessibilityLabel="New chat" onPress={newChat} />}
        </View>
        {active ? <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: wide ? 26 : 16, paddingBottom: 30 }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', gap: 22 }}>
            {active.messages.map((message) => <View key={message.id} style={{ flexDirection: 'row', gap: 12, alignSelf: message.role === 'user' ? 'flex-end' : 'stretch',
              maxWidth: message.role === 'user' ? '84%' : '100%' }}>
              {message.role === 'assistant' && <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text c={C.white} fw="bold" size={16}>✦</Text></View>}
              <View style={{ flex: 1, backgroundColor: message.role === 'user' ? '#F2F2F0' : C.white,
                padding: message.role === 'user' ? 13 : 0, borderRadius: 18 }}>
                <Text c={C.ink} size={14} style={{ lineHeight: 23 }}>{message.text}</Text>
              </View>
            </View>)}
            {loadingChat === active.id && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Text c={C.white}>✦</Text></View>
              <Text c={C.muted} size={13}>Thinking through a demo reply…</Text></View>}
          </View>
        </ScrollView> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 670, alignItems: 'center' }}>
            <View style={{ width: 51, height: 51, borderRadius: 17, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text c={C.white} fw="bold" size={27}>✦</Text></View>
            <Text c={C.ink} fw="bold" size={wide ? 31 : 26} style={{ marginTop: 17 }}>What can we explore?</Text>
            <Text c={C.muted} ta="center" size={13} style={{ marginTop: 8 }}>This is a local scripted chat demo. Pick a prompt to try it.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 35, width: '100%' }}>
              {SUGGESTIONS.map((item) => <Pressable key={item.title} onPress={() => sendPrompt(item.prompt)}
                style={{ width: '48%', minHeight: 80, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, justifyContent: 'center', gap: 4 }}>
                <Text c={C.ink} fw="semibold" size={12}>{item.title}</Text><Text c={C.muted} size={11}>{item.subtitle}</Text>
              </Pressable>)}
            </View>
          </View>
        </View>}
        <View style={{ paddingHorizontal: wide ? 28 : 12, paddingBottom: 12, paddingTop: 9, alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: 760, borderWidth: 1, borderColor: C.line, borderRadius: 20,
            flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: C.white }}>
            <TextInput value={draft} onChangeText={setDraft} multiline placeholder="Message Mosaic" placeholderTextColor={C.muted}
              style={{ flex: 1, maxHeight: 110, minHeight: 31, paddingHorizontal: 7, paddingVertical: 6, color: C.ink, fontSize: 14 }} />
            <IconButton icon="arrowUp" variant="filled" color={C.accent} iconColor={C.white} radius="full"
              accessibilityLabel="Send message" disabled={!draft.trim() || !!loadingChat} onPress={() => sendPrompt()} />
          </View>
          <Text c={C.muted} size={10} ta="center" style={{ marginTop: 7 }}>Mosaic uses scripted responses in this example. No request is sent to an AI service.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
    {!wide && sidebarOpen && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#0006', flexDirection: 'row' }}>
      {sidebar}<Pressable onPress={() => setSidebarOpen(false)} style={{ flex: 1 }} accessibilityLabel="Close chats" /></View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><MosaicScreen /></PlocksProvider></SafeAreaProvider>;
}
