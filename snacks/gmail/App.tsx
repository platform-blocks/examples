import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui-snack';

const C = { bg: '#F7F8FC', white: '#FFF', ink: '#202124', muted: '#697279', line: '#E6E9EF', blue: '#0B57D0', pale: '#DDE9FF', red: '#EA4335' };
type Folder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive' | 'trash';
type Mail = { id: string; from: string; to: string; subject: string; body: string; time: string; folder: Folder; starred: boolean; read: boolean };
const INITIAL: Mail[] = [
  { id: 'm1', from: 'Maya Chen', to: 'you@example.com', subject: 'Coffee this weekend?', body: 'Hey! I found a new little café near the park. Want to catch up on Saturday morning? I can bring that book I was telling you about.', time: '10:42 AM', folder: 'inbox', starred: true, read: false },
  { id: 'm2', from: 'The Weekly Edit', to: 'you@example.com', subject: 'Five things worth your time this week', body: 'Hello! This week we are sharing a thoughtful article, a beautiful photo essay, and a recipe for a very slow Sunday.', time: '9:18 AM', folder: 'inbox', starred: false, read: false },
  { id: 'm3', from: 'Alex Rivera', to: 'you@example.com', subject: 'Re: project notes', body: 'These notes look great. I added a couple of comments to the layout section. Let us review them together tomorrow.', time: 'Yesterday', folder: 'inbox', starred: false, read: true },
  { id: 'm4', from: 'Studio North', to: 'you@example.com', subject: 'Your workshop is confirmed', body: 'Thanks for signing up! We look forward to seeing you at the illustration workshop next Tuesday at 6 PM.', time: 'Yesterday', folder: 'inbox', starred: true, read: true },
  { id: 'm5', from: 'Jordan Lee', to: 'you@example.com', subject: 'Photos from the coast', body: 'Finally sorted the pictures from our weekend trip. The sunset ones came out especially well. I will send over a folder soon!', time: 'Mon', folder: 'inbox', starred: false, read: true },
  { id: 'm6', from: 'you@example.com', to: 'sam@example.com', subject: 'Thanks for your help', body: 'Hi Sam, thank you for walking me through the setup. Everything is working smoothly now.', time: 'Sun', folder: 'sent', starred: false, read: true },
  { id: 'm7', from: 'Local Library', to: 'you@example.com', subject: 'A book is ready for pickup', body: 'The title you requested is now available at the front desk. We will hold it for one week.', time: 'Sat', folder: 'archive', starred: false, read: true },
];
const STORAGE = 'plocks-gmail-example:v1';
const FOLDERS: { id: Folder; label: string; icon: string }[] = [
  { id: 'inbox', label: 'Inbox', icon: 'mail' }, { id: 'starred', label: 'Starred', icon: 'star' },
  { id: 'sent', label: 'Sent', icon: 'arrowRight' }, { id: 'drafts', label: 'Drafts', icon: 'edit' },
  { id: 'archive', label: 'Archive', icon: 'folder' }, { id: 'trash', label: 'Trash', icon: 'trash' },
];
const avatarColor = (name: string) => ['#9874BD', '#6C9CA5', '#CA8C70', '#7DA371'][name.length % 4];

function PostboxScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const [folder, setFolder] = useState<Folder>('inbox');
  const [messages, setMessages] = useState<Mail[]>(INITIAL);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showFolders, setShowFolders] = useState(false);
  const [ready, setReady] = useState(false);
  const active = messages.find((item) => item.id === selected);
  const unread = messages.filter((item) => item.folder === 'inbox' && !item.read).length;
  const shown = messages.filter((item) =>
    (query.trim() ? item.folder !== 'trash' : folder === 'starred' ? item.starred && item.folder !== 'trash' : item.folder === folder) &&
    `${item.from} ${item.to} ${item.subject} ${item.body}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as Mail[];
      if (Array.isArray(data)) setMessages(data);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(messages)).catch(() => {});
  }, [messages, ready]);
  const changeFolder = (next: Folder) => { setFolder(next); setQuery(''); setSelected(null); setShowFolders(false); };
  const openMessage = (id: string) => {
    setSelected(id);
    setMessages((old) => old.map((item) => item.id === id ? { ...item, read: true } : item));
  };
  const toggleStar = (id: string) => setMessages((old) => old.map((item) => item.id === id ? { ...item, starred: !item.starred } : item));
  const moveMessage = (id: string, next: Folder) => {
    setMessages((old) => old.map((item) => item.id === id ? { ...item, folder: next } : item));
    setSelected(null);
  };
  function startCompose(reply?: Mail) {
    setTo(reply?.from ?? '');
    setSubject(reply ? `Re: ${reply.subject.replace(/^Re: /, '')}` : '');
    setBody('');
    setCompose(true);
  }
  function saveDraft() {
    if (to.trim() || subject.trim() || body.trim()) setMessages((old) => [{
      id: `draft-${Date.now()}`, from: 'you@example.com', to: to.trim(), subject: subject.trim() || '(no subject)',
      body: body.trim(), time: 'Draft', folder: 'drafts', starred: false, read: true,
    }, ...old]);
    setCompose(false);
  }
  function send() {
    if (!to.trim() || !body.trim()) return;
    setMessages((old) => [{
      id: `sent-${Date.now()}`, from: 'you@example.com', to: to.trim(), subject: subject.trim() || '(no subject)',
      body: body.trim(), time: 'Just now', folder: 'sent', starred: false, read: true,
    }, ...old]);
    setCompose(false); setTo(''); setSubject(''); setBody(''); setFolder('sent'); setSelected(null);
  }
  const sidebar = <View style={{ width: wide ? 230 : 250, flex: wide ? undefined : 1, backgroundColor: C.bg, padding: 12, gap: 8 }}>
    <Button title="✎  Compose" color={C.pale} textColor={C.ink} radius="lg" onPress={() => { setShowFolders(false); startCompose(); }} />
    <View style={{ height: 8 }} />
    {FOLDERS.map((item) => <Pressable key={item.id} onPress={() => changeFolder(item.id)} accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 14,
        paddingVertical: 10, borderRadius: 19, backgroundColor: folder === item.id ? C.pale : 'transparent' }}>
      <Icon name={item.icon} variant={folder === item.id ? 'filled' : 'outlined'} color={folder === item.id ? C.ink : C.muted} size={19} />
      <Text c={C.ink} fw={folder === item.id ? 'bold' : 'normal'} style={{ flex: 1 }}>{item.label}</Text>
      {item.id === 'inbox' && unread > 0 && <Text c={C.ink} fw="bold" size={12}>{unread}</Text>}
    </Pressable>)}
    <View style={{ flex: 1 }} /><Text c={C.muted} size={11} style={{ padding: 12 }}>Local mail demo · no delivery</Text>
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}><StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, maxWidth: 1450, width: '100%', alignSelf: 'center' }}>
      <View style={{ height: 65, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, gap: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
        {!wide && <IconButton icon="menu" variant="ghost" iconColor={C.muted} accessibilityLabel="Show folders" onPress={() => setShowFolders(true)} />}
        <Icon name="mail" variant="filled" color={C.red} size={27} />
        <Text c={C.ink} fw="bold" size={wide ? 24 : 19}>Postbox</Text>
        <View style={{ flex: 1, maxWidth: 650, marginLeft: wide ? 40 : 0, flexDirection: 'row', backgroundColor: '#F0F4F9', borderRadius: 22, alignItems: 'center', paddingHorizontal: 13 }}>
          <Icon name="search" color={C.muted} size={19} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search mail" style={{ flex: 1, color: C.ink, padding: 11, fontSize: 14 }} />
        </View>
      </View>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {wide && sidebar}
        {(!selected || wide) && <View style={{ width: wide ? 390 : '100%', backgroundColor: C.white, borderRightWidth: wide ? 1 : 0, borderRightColor: C.line }}>
          <View style={{ paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text c={C.ink} fw="bold" size={20}>{query ? 'Search results' : FOLDERS.find((item) => item.id === folder)?.label}</Text>
            <Text c={C.muted} size={11}>{shown.length} messages</Text>
          </View>
          <ScrollView style={{ flex: 1 }}>
            {shown.length === 0 && <Text c={C.muted} style={{ padding: 24 }}>No messages here.</Text>}
            {shown.map((item) => <Pressable key={item.id} onPress={() => openMessage(item.id)}
              accessibilityRole="button" accessibilityLabel={`Open ${item.subject}`}
              style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 13,
                backgroundColor: selected === item.id ? '#EAF1FB' : item.read ? C.white : '#F4F7FC',
                borderBottomWidth: 1, borderBottomColor: C.line }}>
              <Avatar size="md" fallback={item.from.slice(0, 2).toUpperCase()} bg={avatarColor(item.from)} textColor={C.white} />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 5 }}>
                  <Text c={C.ink} fw={item.read ? 'medium' : 'bold'} size={13} numberOfLines={1} style={{ flex: 1 }}>{item.from}</Text>
                  <Text c={C.muted} size={10}>{item.time}</Text>
                </View>
                <Text c={C.ink} fw={item.read ? 'normal' : 'bold'} size={12} numberOfLines={1}>{item.subject}</Text>
                <Text c={C.muted} size={12} numberOfLines={1}>{item.body}</Text>
              </View>
              <Pressable onPress={(event) => { event.stopPropagation(); toggleStar(item.id); }} accessibilityLabel={item.starred ? 'Unstar message' : 'Star message'}
                style={{ alignSelf: 'center', padding: 4 }}><Icon name="star" variant={item.starred ? 'filled' : 'outlined'}
                  color={item.starred ? '#F2B632' : C.muted} size={19} /></Pressable>
            </Pressable>)}
          </ScrollView>
          {!wide && <Pressable onPress={() => startCompose()} accessibilityRole="button" accessibilityLabel="Compose message"
            style={{ position: 'absolute', right: 18, bottom: 18, backgroundColor: C.pale, borderRadius: 17, paddingHorizontal: 17, paddingVertical: 13 }}>
            <Text c={C.ink} fw="bold">✎  Compose</Text></Pressable>}
        </View>}
        {(wide || selected) && <View style={{ flex: 1, backgroundColor: C.white }}>
          {active ? <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
              {!wide && <IconButton icon="arrowLeft" variant="ghost" iconColor={C.ink} accessibilityLabel="Back to messages" onPress={() => setSelected(null)} />}
              <IconButton icon="folder" variant="ghost" iconColor={C.muted} accessibilityLabel="Archive message" onPress={() => moveMessage(active.id, 'archive')} />
              <IconButton icon="trash" variant="ghost" iconColor={C.muted} accessibilityLabel="Delete message" onPress={() => moveMessage(active.id, 'trash')} />
              <IconButton icon="mail" variant="ghost" iconColor={C.muted} accessibilityLabel="Mark unread"
                onPress={() => { setMessages((old) => old.map((item) => item.id === active.id ? { ...item, read: false } : item)); setSelected(null); }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: wide ? 32 : 20, maxWidth: 850, width: '100%' }}>
              <Text c={C.ink} fw="bold" size={27}>{active.subject}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 27 }}>
                <Avatar size="lg" fallback={active.from.slice(0, 2).toUpperCase()} bg={avatarColor(active.from)} textColor={C.white} />
                <View style={{ flex: 1 }}><Text c={C.ink} fw="bold" size={14}>{active.from}</Text>
                  <Text c={C.muted} size={11}>to {active.to} · {active.time}</Text></View>
                <IconButton icon="star" variant="ghost" iconColor={active.starred ? '#F2B632' : C.muted} accessibilityLabel="Toggle star"
                  onPress={() => toggleStar(active.id)} />
              </View>
              <Text c={C.ink} size={15} style={{ lineHeight: 25, marginTop: 30, marginBottom: 30 }}>{active.body}</Text>
              {active.folder !== 'sent' && <View style={{ alignSelf: 'flex-start' }}>
                <Button title="↩  Reply" variant="outline" color={C.muted} onPress={() => startCompose(active)} /></View>}
              <Text c={C.muted} size={11} style={{ marginTop: 20 }}>Demo inbox. Replies stay on this device.</Text>
            </ScrollView>
          </> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Icon name="mail" color="#C8CED7" size={55} /><Text c={C.muted}>Select a message to read it.</Text></View>}
        </View>}
      </View>
    </View>
    {!wide && showFolders && <View style={{ position: 'absolute', inset: 0, flexDirection: 'row', backgroundColor: '#0007' }}>
      {sidebar}<Pressable onPress={() => setShowFolders(false)} style={{ flex: 1 }} accessibilityLabel="Close folders" /></View>}
    {compose && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#0007', justifyContent: wide ? 'flex-end' : 'center', alignItems: 'flex-end', padding: wide ? 25 : 10 }}>
      <View style={{ width: wide ? 540 : '100%', height: wide ? 570 : '80%', backgroundColor: C.white, borderRadius: 13, overflow: 'hidden' }}>
        <View style={{ backgroundColor: '#EEF2F8', paddingHorizontal: 17, height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text c={C.ink} fw="bold">New message</Text>
          <IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Save draft and close" onPress={saveDraft} />
        </View>
        <TextInput value={to} onChangeText={setTo} placeholder="To" autoCapitalize="none" keyboardType="email-address"
          style={{ borderBottomWidth: 1, borderBottomColor: C.line, padding: 14, color: C.ink }} />
        <TextInput value={subject} onChangeText={setSubject} placeholder="Subject"
          style={{ borderBottomWidth: 1, borderBottomColor: C.line, padding: 14, color: C.ink }} />
        <TextInput value={body} onChangeText={setBody} placeholder="Write your message" multiline
          style={{ flex: 1, padding: 15, color: C.ink, textAlignVertical: 'top' }} />
        <View style={{ padding: 12, alignSelf: 'flex-start' }}><Button title="Send demo message" color={C.blue} disabled={!to.trim() || !body.trim()} onPress={send} /></View>
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><PostboxScreen /></PlocksProvider></SafeAreaProvider>;
}
