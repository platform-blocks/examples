import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui-snack';

const FISH = [
  { id: 'coral', name: 'Coral', age: 3, emoji: '🐠', species: 'Clownfish', distance: '2 reefs away', bio: 'Looking for someone to get lost in the anemones with.', tags: ['Ocean sunsets', 'Plankton brunch', 'Adventure'], colors: ['#FFB369', '#E86786'] as const, mutual: true },
  { id: 'bubbles', name: 'Bubbles', age: 2, emoji: '🐡', species: 'Pufferfish', distance: '4 reefs away', bio: 'A little shy until you get to know me. Then I really open up.', tags: ['Cozy caves', 'Sea grass', 'Deep talks'], colors: ['#8BD5D9', '#4A9EBC'] as const, mutual: true },
  { id: 'finley', name: 'Finley', age: 4, emoji: '🦈', species: 'Reef shark', distance: '6 reefs away', bio: 'Big fins, bigger heart. I promise I am more chill than I look.', tags: ['Long swims', 'Live music', 'Coral reefs'], colors: ['#9EB7DF', '#667CB4'] as const, mutual: false },
  { id: 'pearl', name: 'Pearl', age: 3, emoji: '🐟', species: 'Angelfish', distance: '1 reef away', bio: 'Taking the scenic route through every part of the sea.', tags: ['Art', 'Warm currents', 'Exploring'], colors: ['#D6A9DD', '#9960AC'] as const, mutual: true },
  { id: 'sushi', name: 'Sushi', age: 2, emoji: '🐬', species: 'Dolphin', distance: '8 reefs away', bio: 'Always up for a good splash and a terrible joke.', tags: ['Games', 'Waves', 'Making friends'], colors: ['#8FC9EE', '#4D9BCB'] as const, mutual: false },
];
type Fish = typeof FISH[number];
type Tab = 'discover' | 'matches' | 'chats';
type ChatMessages = Record<string, { text: string; mine: boolean }[]>;
const C = { sea: '#073B4C', teal: '#0F8F92', coral: '#FF657D', muted: '#748491', line: '#E6EEF0', white: '#FFF', bg: '#F6FAFB' };
const STORAGE = 'plocks-fish-dating:v1';

function FishPortrait({ fish, small = false }: { fish: Fish; small?: boolean }) {
  return <LinearGradient colors={[fish.colors[0], fish.colors[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={{ width: small ? 58 : '100%', height: small ? 58 : '100%', borderRadius: small ? 29 : 22,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <Text size={small ? 31 : 140} style={{ lineHeight: small ? 48 : 185 }}>{fish.emoji}</Text>
    {!small && <View style={{ position: 'absolute', top: 18, left: 18, backgroundColor: '#FFFFFFDD', borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text c={C.sea} fw="bold" size={11}>✦  VERIFIED SEA LIFE</Text>
    </View>}
  </LinearGradient>;
}

function FinsterScreen() {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('discover');
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [chats, setChats] = useState<ChatMessages>({});
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [matchPop, setMatchPop] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const current = FISH[index % FISH.length];
  const active = FISH.find((fish) => fish.id === activeChat);
  const wide = width >= 780;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { index?: number; liked?: string[]; matches?: string[]; chats?: ChatMessages };
      if (typeof data.index === 'number') setIndex(data.index);
      if (Array.isArray(data.liked)) setLiked(data.liked);
      if (Array.isArray(data.matches)) setMatches(data.matches);
      if (data.chats && typeof data.chats === 'object') setChats(data.chats);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ index, liked, matches, chats })).catch(() => {});
  }, [index, liked, matches, chats, ready]);

  function choose(kind: 'pass' | 'like' | 'super') {
    pan.setValue({ x: 0, y: 0 });
    if (kind !== 'pass') {
      setLiked((items) => items.includes(current.id) ? items : [...items, current.id]);
      if (current.mutual) {
        setMatches((items) => items.includes(current.id) ? items : [...items, current.id]);
        setMatchPop(current.id);
      }
    }
    setIndex((value) => value + 1);
  }
  function send() {
    const value = draft.trim();
    if (!activeChat || !value) return;
    setChats((old) => ({ ...old, [activeChat]: [...(old[activeChat] ?? []), { text: value, mine: true }] }));
    setDraft('');
  }
  function openChat(id: string) { setActiveChat(id); setTab('chats'); setMatchPop(null); }
  const swipe = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 12,
    onPanResponderMove: (_, gesture) => pan.setValue({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 90) choose('like');
      else if (gesture.dx < -90) choose('pass');
      else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });

  const nav = <View style={{ flexDirection: wide ? 'column' : 'row', gap: wide ? 8 : 0, justifyContent: 'space-around' }}>
    {(['discover', 'matches', 'chats'] as const).map((item) => <Pressable key={item} onPress={() => { setTab(item); setActiveChat(null); }}
      accessibilityRole="tab" accessibilityState={{ selected: tab === item }}
      style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
        paddingVertical: wide ? 13 : 9, paddingHorizontal: wide ? 18 : 9, borderRadius: 13, backgroundColor: tab === item && wide ? '#E5F4F2' : 'transparent' }}>
      <Icon name={item === 'discover' ? 'heart' : item === 'matches' ? 'bolt' : 'message'}
        variant={tab === item ? 'filled' : 'outlined'} color={tab === item ? C.teal : C.muted} size={wide ? 23 : 24} />
      <Text c={tab === item ? C.sea : C.muted} fw={tab === item ? 'bold' : 'medium'} size={wide ? 15 : 11}>
        {item[0].toUpperCase() + item.slice(1)}{item === 'matches' && matches.length ? ` · ${matches.length}` : ''}
      </Text>
    </Pressable>)}
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
      {wide && <View style={{ width: 240, padding: 18, borderRightWidth: 1, borderRightColor: C.line, backgroundColor: C.white }}>
        <Text c={C.teal} fw="bold" size={30} style={{ marginBottom: 30 }}>finster 🐠</Text>{nav}
        <View style={{ flex: 1 }} /><Text c={C.muted} size={12}>Good things are swimming your way.</Text>
      </View>}
      <View style={{ flex: 1 }}>
        {!wide && <View style={{ height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text c={C.teal} fw="bold" size={27}>finster 🐠</Text><Icon name="settings" color={C.muted} size={23} />
        </View>}
        {tab === 'discover' && <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 18, paddingBottom: 15 }}>
          <Animated.View {...swipe.panHandlers} accessibilityLabel={`${current.name} profile. Swipe right to like or left to pass.`}
            style={{ width: '100%', maxWidth: 450, flex: 1, backgroundColor: C.white, borderRadius: 24, overflow: 'hidden',
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: pan.x.interpolate({ inputRange: [-250, 0, 250], outputRange: ['-12deg', '0deg', '12deg'] }) }],
            shadowColor: C.sea, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }}>
            <View style={{ flex: 1, minHeight: 260 }}><FishPortrait fish={current} /></View>
            <View style={{ padding: 20, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}><Text c={C.sea} fw="bold" size={27}>{current.name}, {current.age}</Text>
                <Text c={C.muted} size={13}>{current.species}</Text></View>
              <Text c={C.muted} size={12}>⌖  {current.distance}</Text>
              <Text c={C.sea} size={14} style={{ lineHeight: 21 }}>{current.bio}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                {current.tags.map((tag) => <View key={tag} style={{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EAF6F5' }}>
                  <Text c={C.teal} fw="semibold" size={11}>{tag}</Text></View>)}
              </View>
            </View>
          </Animated.View>
          <View style={{ flexDirection: 'row', gap: 23, paddingTop: 16 }}>
            {([['x', 'pass', '#8796A1', 'Pass'], ['bolt', 'super', '#57A6D8', 'Super like'], ['heart', 'like', C.coral, 'Like']] as const).map(([icon, kind, color, label]) =>
              <Pressable key={kind} onPress={() => choose(kind)} accessibilityRole="button" accessibilityLabel={label}
                style={{ width: kind === 'like' ? 66 : 58, height: kind === 'like' ? 66 : 58, borderRadius: 36, backgroundColor: C.white,
                  alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 1, borderColor: C.line,
                  shadowColor: C.sea, shadowOpacity: 0.09, shadowRadius: 8, elevation: 2 }}>
                <Icon name={icon} variant={kind === 'pass' ? 'outlined' : 'filled'} color={color} size={kind === 'like' ? 30 : 27} />
              </Pressable>)}
          </View>
        </View>}
        {tab === 'matches' && <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
          <Text c={C.sea} fw="bold" size={27}>Your matches</Text>
          <Text c={C.muted} size={14}>It's a whole ocean out there. Say hello!</Text>
          {matches.length === 0 ? <View style={{ alignItems: 'center', padding: 60, gap: 10 }}>
            <Text size={70}>🐚</Text><Text c={C.sea} fw="bold" size={18}>No matches yet</Text>
            <Text c={C.muted} ta="center">Keep exploring to find your perfect school.</Text>
            <Button title="Discover fish" color={C.teal} onPress={() => setTab('discover')} />
          </View> : matches.map((id) => { const fish = FISH.find((item) => item.id === id)!; return <Pressable key={id} onPress={() => openChat(id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, backgroundColor: C.white }}>
            <FishPortrait fish={fish} small /><View style={{ flex: 1 }}><Text c={C.sea} fw="bold" size={17}>{fish.name}</Text>
              <Text c={C.muted} size={12}>{fish.species} · Tap to chat</Text></View><Icon name="message" color={C.teal} size={20} />
          </Pressable>; })}
        </ScrollView>}
        {tab === 'chats' && <View style={{ flex: 1 }}>
          {active ? <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
              <IconButton icon="arrowLeft" variant="ghost" iconColor={C.sea} accessibilityLabel="Back to chats" onPress={() => setActiveChat(null)} />
              <FishPortrait fish={active} small /><Text c={C.sea} fw="bold" size={18}>{active.name}</Text>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 12, justifyContent: 'flex-end', flexGrow: 1 }}>
              <View style={{ alignSelf: 'flex-start', padding: 13, borderRadius: 16, backgroundColor: C.white, maxWidth: '82%' }}>
                <Text c={C.sea} size={14}>Hey! Glad we swam into each other. 🐠</Text></View>
              {(chats[active.id] ?? []).map((message, i) => <View key={i} style={{ alignSelf: message.mine ? 'flex-end' : 'flex-start',
                padding: 13, borderRadius: 16, backgroundColor: message.mine ? '#C9F0E9' : C.white, maxWidth: '82%' }}>
                <Text c={C.sea} size={14}>{message.text}</Text></View>)}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: C.white }}>
              <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send} placeholder="Send a message"
                style={{ flex: 1, borderRadius: 24, padding: 11, backgroundColor: C.bg, color: C.sea }} />
              <IconButton icon="arrowRight" variant="filled" color={C.teal} radius="full" accessibilityLabel="Send" onPress={send} disabled={!draft.trim()} />
            </View>
          </> : <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }}>
            <Text c={C.sea} fw="bold" size={27}>Messages</Text>
            {matches.length === 0 && <Text c={C.muted}>Messages with your matches will appear here.</Text>}
            {matches.map((id) => { const fish = FISH.find((item) => item.id === id)!; return <Pressable key={id} onPress={() => openChat(id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 16, padding: 13 }}>
              <FishPortrait fish={fish} small /><View><Text c={C.sea} fw="bold">{fish.name}</Text>
                <Text c={C.muted} size={12} numberOfLines={1}>{chats[id]?.at(-1)?.text ?? 'Say hello 👋'}</Text></View>
            </Pressable>; })}
          </ScrollView>}
        </View>}
        {!wide && !active && <View style={{ backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line }}>{nav}</View>}
      </View>
    </View>
    {matchPop && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#073B4CC9', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text size={96}>{FISH.find((fish) => fish.id === matchPop)?.emoji}</Text>
      <Text c={C.white} fw="bold" size={38} ta="center">It's a match!</Text>
      <Text c={C.white} size={16} ta="center" style={{ marginVertical: 15 }}>You and {FISH.find((fish) => fish.id === matchPop)?.name} both swam right.</Text>
      <Button title="Send a message" color={C.coral} onPress={() => openChat(matchPop)} />
      <Pressable onPress={() => setMatchPop(null)} style={{ padding: 18 }}><Text c={C.white} fw="bold">Keep exploring</Text></Pressable>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><FinsterScreen /></PlocksProvider></SafeAreaProvider>;
}
