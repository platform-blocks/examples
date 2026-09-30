import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  MotionBlock,
  Gradient,
  Input,
  ScrollArea,
  SafeArea,
  Block,
  Button,
  Dialog,
  Icon,
  IconButton,
  PlocksProvider,
  Tabs,
  Text,
} from '@plocks/ui-snack';

const FISH = [
  {
    id: 'coral',
    name: 'Coral',
    age: 3,
    emoji: '🐠',
    species: 'Clownfish',
    distance: '2 reefs away',
    bio: 'Looking for someone to get lost in the anemones with.',
    tags: ['Ocean sunsets', 'Plankton brunch', 'Adventure'],
    colors: ['#FFB369', '#E86786'] as const,
    mutual: true,
  },
  {
    id: 'bubbles',
    name: 'Bubbles',
    age: 2,
    emoji: '🐡',
    species: 'Pufferfish',
    distance: '4 reefs away',
    bio: 'A little shy until you get to know me. Then I really open up.',
    tags: ['Cozy caves', 'Sea grass', 'Deep talks'],
    colors: ['#8BD5D9', '#4A9EBC'] as const,
    mutual: true,
  },
  {
    id: 'finley',
    name: 'Finley',
    age: 4,
    emoji: '🦈',
    species: 'Reef shark',
    distance: '6 reefs away',
    bio: 'Big fins, bigger heart. I promise I am more chill than I look.',
    tags: ['Long swims', 'Live music', 'Coral reefs'],
    colors: ['#9EB7DF', '#667CB4'] as const,
    mutual: false,
  },
  {
    id: 'pearl',
    name: 'Pearl',
    age: 3,
    emoji: '🐟',
    species: 'Angelfish',
    distance: '1 reef away',
    bio: 'Taking the scenic route through every part of the sea.',
    tags: ['Art', 'Warm currents', 'Exploring'],
    colors: ['#D6A9DD', '#9960AC'] as const,
    mutual: true,
  },
  {
    id: 'sushi',
    name: 'Sushi',
    age: 2,
    emoji: '🐬',
    species: 'Dolphin',
    distance: '8 reefs away',
    bio: 'Always up for a good splash and a terrible joke.',
    tags: ['Games', 'Waves', 'Making friends'],
    colors: ['#8FC9EE', '#4D9BCB'] as const,
    mutual: false,
  },
];
type Fish = (typeof FISH)[number];
type Tab = 'discover' | 'matches' | 'chats';
type ChatMessages = Record<string, { text: string; mine: boolean }[]>;
const C = {
  sea: '#073B4C',
  teal: '#0F8F92',
  coral: '#FF657D',
  muted: '#748491',
  line: '#E6EEF0',
  white: '#FFF',
  bg: '#F6FAFB',
};
const STORAGE = 'plocks-fish-dating:v1';

function FishPortrait({ fish, small = false }: { fish: Fish; small?: boolean }) {
  return (
    <Gradient
      colors={[fish.colors[0], fish.colors[1]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      w={small ? 58 : '100%'}
      h={small ? 58 : '100%'}
      radius={small ? 29 : 22}
      align="center"
      justify="center"
      overflow="hidden"
    >
      <Text size={small ? 31 : 140} lh={small ? 48 : 185}>
        {fish.emoji}
      </Text>
      {!small && (
        <Block gap={0} position="absolute" top={18} left={18} bg="#FFFFFFDD" radius={30} px={12} py={6}>
          <Text c={C.sea} fw="bold" size={11}>
            ✦ VERIFIED SEA LIFE
          </Text>
        </Block>
      )}
    </Gradient>
  );
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
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as { index?: number; liked?: string[]; matches?: string[]; chats?: ChatMessages };
        if (typeof data.index === 'number') setIndex(data.index);
        if (Array.isArray(data.liked)) setLiked(data.liked);
        if (Array.isArray(data.matches)) setMatches(data.matches);
        if (data.chats && typeof data.chats === 'object') setChats(data.chats);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ index, liked, matches, chats })).catch(() => {});
  }, [index, liked, matches, chats, ready]);

  function choose(kind: 'pass' | 'like' | 'super') {
    pan.setValue({ x: 0, y: 0 });
    if (kind !== 'pass') {
      setLiked((items) => (items.includes(current.id) ? items : [...items, current.id]));
      if (current.mutual) {
        setMatches((items) => (items.includes(current.id) ? items : [...items, current.id]));
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
  function openChat(id: string) {
    setActiveChat(id);
    setTab('chats');
    setMatchPop(null);
  }
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

  const nav = (
    <Tabs
      navigationOnly
      orientation={wide ? 'vertical' : 'horizontal'}
      variant="chip"
      color={C.teal}
      value={tab}
      onChange={(item) => {
        setTab(item as Tab);
        setActiveChat(null);
      }}
      items={(['discover', 'matches', 'chats'] as const).map((item) => ({
        key: item,
        label: item[0].toUpperCase() + item.slice(1),
        subLabel: item === 'matches' && matches.length ? String(matches.length) : undefined,
        icon: (
          <Icon
            name={item === 'discover' ? 'heart' : item === 'matches' ? 'bolt' : 'message'}
            color={tab === item ? C.white : C.muted}
            size={wide ? 23 : 20}
          />
        ),
        content: null,
      }))}
    />
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.bg}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} maw={1200} alignSelf="center" w="100%">
        {wide && (
          <Block gap={0} w={240} p={18} borderRightWidth={1} borderRightColor={C.line} bg={C.white}>
            <Text c={C.teal} fw="bold" size={30} mb={30}>
              finster 🐠
            </Text>
            {nav}
            <Block gap={0} flex={1} />
            <Text c={C.muted} size={12}>
              Good things are swimming your way.
            </Text>
          </Block>
        )}
        <Block gap={0} flex={1}>
          {!wide && (
            <Block gap={0} h={60} direction="row" justify="space-between" align="center" px={20}>
              <Text c={C.teal} fw="bold" size={27}>
                finster 🐠
              </Text>
              <Icon name="settings" color={C.muted} size={23} />
            </Block>
          )}
          {tab === 'discover' && (
            <Block gap={0} flex={1} align="center" px={18} pb={15}>
              <MotionBlock
                {...swipe.panHandlers}
                accessibilityLabel={`${current.name} profile. Swipe right to like or left to pass.`}
                w="full"
                maw={450}
                flex={1}
                bg={C.white}
                radius={24}
                overflow="hidden"
                shadow="lg"
                translateX={pan.x}
                translateY={pan.y}
                motionRotate={pan.x.interpolate({
                  inputRange: [-250, 0, 250],
                  outputRange: ['-12deg', '0deg', '12deg'],
                })}
              >
                <Block gap={0} flex={1} mih={260}>
                  <FishPortrait fish={current} />
                </Block>
                <Block p={20} gap={8}>
                  <Block direction="row" align="baseline" gap={8}>
                    <Text c={C.sea} fw="bold" size={27}>
                      {current.name}, {current.age}
                    </Text>
                    <Text c={C.muted} size={13}>
                      {current.species}
                    </Text>
                  </Block>
                  <Text c={C.muted} size={12}>
                    ⌖ {current.distance}
                  </Text>
                  <Text c={C.sea} size={14} lh={21}>
                    {current.bio}
                  </Text>
                  <Block direction="row" wrap="wrap" gap={7} mt={4}>
                    {current.tags.map((tag) => (
                      <Block gap={0} key={tag} radius={20} px={10} py={6} bg="#EAF6F5">
                        <Text c={C.teal} fw="semibold" size={11}>
                          {tag}
                        </Text>
                      </Block>
                    ))}
                  </Block>
                </Block>
              </MotionBlock>
              <Block direction="row" gap={23} pt={16}>
                {(
                  [
                    ['x', 'pass', '#8796A1', 'Pass'],
                    ['bolt', 'super', '#57A6D8', 'Super like'],
                    ['heart', 'like', C.coral, 'Like'],
                  ] as const
                ).map(([icon, kind, color, label]) => (
                  <Block
                    gap={0}
                    key={kind}
                    onPress={() => choose(kind)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    w={kind === 'like' ? 66 : 58}
                    h={kind === 'like' ? 66 : 58}
                    radius={36}
                    bg={C.white}
                    align="center"
                    justify="center"
                    alignSelf="center"
                    borderWidth={1}
                    borderColor={C.line}
                    shadow="sm"
                  >
                    <Icon
                      name={icon}
                      variant={kind === 'pass' ? 'outlined' : 'filled'}
                      color={color}
                      size={kind === 'like' ? 30 : 27}
                    />
                  </Block>
                ))}
              </Block>
            </Block>
          )}
          {tab === 'matches' && (
            <ScrollArea contentProps={{ p: 22, gap: 16 }}>
              <Text c={C.sea} fw="bold" size={27}>
                Your matches
              </Text>
              <Text c={C.muted} size={14}>
                It's a whole ocean out there. Say hello!
              </Text>
              {matches.length === 0 ? (
                <Block align="center" p={60} gap={10}>
                  <Text size={70}>🐚</Text>
                  <Text c={C.sea} fw="bold" size={18}>
                    No matches yet
                  </Text>
                  <Text c={C.muted} ta="center">
                    Keep exploring to find your perfect school.
                  </Text>
                  <Button title="Discover fish" color={C.teal} onPress={() => setTab('discover')} />
                </Block>
              ) : (
                matches.map((id) => {
                  const fish = FISH.find((item) => item.id === id)!;
                  return (
                    <Block
                      key={id}
                      onPress={() => openChat(id)}
                      direction="row"
                      align="center"
                      gap={14}
                      p={14}
                      radius={16}
                      bg={C.white}
                    >
                      <FishPortrait fish={fish} small />
                      <Block gap={0} flex={1}>
                        <Text c={C.sea} fw="bold" size={17}>
                          {fish.name}
                        </Text>
                        <Text c={C.muted} size={12}>
                          {fish.species} · Tap to chat
                        </Text>
                      </Block>
                      <Icon name="message" color={C.teal} size={20} />
                    </Block>
                  );
                })
              )}
            </ScrollArea>
          )}
          {tab === 'chats' && (
            <Block gap={0} flex={1}>
              {active ? (
                <>
                  <Block
                    direction="row"
                    align="center"
                    gap={10}
                    p={12}
                    borderBottomWidth={1}
                    borderBottomColor={C.line}
                  >
                    <IconButton
                      icon="arrowLeft"
                      variant="ghost"
                      iconColor={C.sea}
                      accessibilityLabel="Back to chats"
                      onPress={() => setActiveChat(null)}
                    />
                    <FishPortrait fish={active} small />
                    <Text c={C.sea} fw="bold" size={18}>
                      {active.name}
                    </Text>
                  </Block>
                  <ScrollArea flex={1} contentProps={{ p: 18, gap: 12, justify: 'flex-end', grow: 1 }}>
                    <Block gap={0} alignSelf="flex-start" p={13} radius={16} bg={C.white} maw="82%">
                      <Text c={C.sea} size={14}>
                        Hey! Glad we swam into each other. 🐠
                      </Text>
                    </Block>
                    {(chats[active.id] ?? []).map((message, i) => (
                      <Block
                        gap={0}
                        key={i}
                        alignSelf={message.mine ? 'flex-end' : 'flex-start'}
                        p={13}
                        radius={16}
                        bg={message.mine ? '#C9F0E9' : C.white}
                        maw="82%"
                      >
                        <Text c={C.sea} size={14}>
                          {message.text}
                        </Text>
                      </Block>
                    ))}
                  </ScrollArea>
                  <Block direction="row" align="center" gap={10} p={12} bg={C.white}>
                    <Input
                      variant="filled"
                      value={draft}
                      onChangeText={setDraft}
                      onEnter={send}
                      placeholder="Send a message"
                      mb={0}
                      flex={1}
                      radius={24}
                      inputColor={C.sea}
                    />
                    <IconButton
                      icon="arrowRight"
                      variant="filled"
                      color={C.teal}
                      radius="full"
                      accessibilityLabel="Send"
                      onPress={send}
                      disabled={!draft.trim()}
                    />
                  </Block>
                </>
              ) : (
                <ScrollArea contentProps={{ p: 22, gap: 14 }}>
                  <Text c={C.sea} fw="bold" size={27}>
                    Messages
                  </Text>
                  {matches.length === 0 && <Text c={C.muted}>Messages with your matches will appear here.</Text>}
                  {matches.map((id) => {
                    const fish = FISH.find((item) => item.id === id)!;
                    return (
                      <Block
                        key={id}
                        onPress={() => openChat(id)}
                        direction="row"
                        align="center"
                        gap={12}
                        bg={C.white}
                        radius={16}
                        p={13}
                      >
                        <FishPortrait fish={fish} small />
                        <Block gap={0}>
                          <Text c={C.sea} fw="bold">
                            {fish.name}
                          </Text>
                          <Text c={C.muted} size={12} numberOfLines={1}>
                            {chats[id]?.at(-1)?.text ?? 'Say hello 👋'}
                          </Text>
                        </Block>
                      </Block>
                    );
                  })}
                </ScrollArea>
              )}
            </Block>
          )}
          {!wide && !active && (
            <Block gap={0} bg={C.white} borderTopWidth={1} borderTopColor={C.line}>
              {nav}
            </Block>
          )}
        </Block>
      </Block>
      {matchPop && (
        <Dialog opened accessibilityLabel="It's a match" onClose={() => setMatchPop(null)}>
          <Block gap={0} align="center">
            <Text size={96}>{FISH.find((fish) => fish.id === matchPop)?.emoji}</Text>
            <Text c={C.sea} fw="bold" size={38} ta="center">
              It's a match!
            </Text>
            <Text c={C.sea} size={16} ta="center" my={15}>
              You and {FISH.find((fish) => fish.id === matchPop)?.name} both swam right.
            </Text>
            <Button title="Send a message" color={C.coral} onPress={() => openChat(matchPop)} />
            <Block gap={0} onPress={() => setMatchPop(null)} p={18}>
              <Text c={C.sea} fw="bold">
                Keep exploring
              </Text>
            </Block>
          </Block>
        </Dialog>
      )}
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <FinsterScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
