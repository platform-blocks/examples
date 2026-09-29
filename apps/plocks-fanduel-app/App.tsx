import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui';

const C = { navy: '#0D1D3B', blue: '#1767D5', sky: '#EAF3FF', white: '#FFF', ink: '#17243C', muted: '#6D7C93', line: '#E5EAF1', green: '#21815E' };
const GAMES = [
  { id: 'hoops1', league: 'Basketball', away: 'Metro Comets', home: 'Harbor Waves', time: 'Tonight · 7:30 PM', awayOdds: 125, homeOdds: -145, live: true, score: '62 – 58', emoji: '🏀' },
  { id: 'hoops2', league: 'Basketball', away: 'Canyon Suns', home: 'Summit Bears', time: 'Tomorrow · 6:00 PM', awayOdds: -110, homeOdds: 105, live: false, score: '', emoji: '🏀' },
  { id: 'football1', league: 'Football', away: 'Coastal Hawks', home: 'Valley Foxes', time: 'Sunday · 1:00 PM', awayOdds: 115, homeOdds: -135, live: false, score: '', emoji: '🏈' },
  { id: 'football2', league: 'Football', away: 'Northern Lights', home: 'Desert Owls', time: 'Sunday · 4:25 PM', awayOdds: -120, homeOdds: 110, live: false, score: '', emoji: '🏈' },
  { id: 'hockey1', league: 'Hockey', away: 'Ice Harbor', home: 'River Wolves', time: 'Tonight · 8:00 PM', awayOdds: 135, homeOdds: -155, live: true, score: '2 – 2', emoji: '🏒' },
  { id: 'soccer1', league: 'Soccer', away: 'Union City', home: 'Blue Coast FC', time: 'Saturday · 5:00 PM', awayOdds: -105, homeOdds: 120, live: false, score: '', emoji: '⚽' },
];
type Game = typeof GAMES[number];
type Selection = { gameId: string; side: 'away' | 'home' };
type Pick = { id: string; selections: Selection[]; stake: number; payout: number; placed: string };
type Tab = 'sports' | 'live' | 'picks';
const STORAGE = 'plocks-fanduel-example:v1';
const money = (value: number) => '$' + value.toFixed(2);
const oddsText = (value: number) => value > 0 ? `+${value}` : String(value);
const decimalOdds = (value: number) => value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
const selectionOdds = (selection: Selection) => {
  const game = GAMES.find((item) => item.id === selection.gameId)!;
  return selection.side === 'away' ? game.awayOdds : game.homeOdds;
};

function FieldhouseScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const [tab, setTab] = useState<Tab>('sports');
  const [league, setLeague] = useState('All');
  const [slip, setSlip] = useState<Selection[]>([]);
  const [stake, setStake] = useState('10');
  const [balance, setBalance] = useState(1000);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [showSlip, setShowSlip] = useState(false);
  const [ready, setReady] = useState(false);
  const amount = Number(stake);
  const combined = slip.reduce((result, selection) => result * decimalOdds(selectionOdds(selection)), 1);
  const payout = amount * combined;
  const valid = slip.length > 0 && Number.isFinite(amount) && amount > 0 && amount <= balance;
  const visible = GAMES.filter((game) => (tab !== 'live' || game.live) && (league === 'All' || game.league === league));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { balance?: number; picks?: Pick[] };
      if (typeof data.balance === 'number') setBalance(data.balance);
      if (Array.isArray(data.picks)) setPicks(data.picks);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ balance, picks })).catch(() => {});
  }, [balance, picks, ready]);
  function choose(gameId: string, side: Selection['side']) {
    setSlip((old) => old.some((item) => item.gameId === gameId && item.side === side)
      ? old.filter((item) => item.gameId !== gameId)
      : [...old.filter((item) => item.gameId !== gameId), { gameId, side }]);
    if (!wide) setShowSlip(true);
  }
  function placePick() {
    if (!valid) return;
    setBalance((old) => old - amount);
    setPicks((old) => [{ id: `pick-${Date.now()}`, selections: slip, stake: amount, payout,
      placed: new Date().toLocaleString() }, ...old]);
    setSlip([]);
    setStake('10');
    setShowSlip(false);
    setTab('picks');
  }
  const nav = <View style={{ flexDirection: 'row', gap: wide ? 28 : 20 }}>
    {([['sports', 'Sports'], ['live', 'Live'], ['picks', 'My Picks']] as const).map(([item, label]) => <Pressable key={item}
      onPress={() => setTab(item)} accessibilityRole="tab" accessibilityState={{ selected: tab === item }}
      style={{ paddingVertical: 14, borderBottomWidth: tab === item ? 3 : 0, borderBottomColor: C.white }}>
      <Text c={tab === item ? C.white : '#C4D5EF'} fw={tab === item ? 'bold' : 'medium'} size={wide ? 15 : 13}>{label}</Text>
    </Pressable>)}
  </View>;
  const market = (game: Game, side: 'away' | 'home') => {
    const chosen = slip.some((item) => item.gameId === game.id && item.side === side);
    const team = side === 'away' ? game.away : game.home;
    const odds = side === 'away' ? game.awayOdds : game.homeOdds;
    return <Pressable onPress={() => choose(game.id, side)} accessibilityRole="button"
      accessibilityLabel={`Pick ${team} at ${oddsText(odds)}`}
      style={{ flex: 1, backgroundColor: chosen ? C.blue : C.sky, borderRadius: 9, padding: 11, alignItems: 'center', gap: 3 }}>
      <Text c={chosen ? C.white : C.ink} fw="semibold" size={12} numberOfLines={1}>{team}</Text>
      <Text c={chosen ? C.white : C.blue} fw="bold" size={16}>{oddsText(odds)}</Text>
    </Pressable>;
  };
  const gameCard = (game: Game) => <View key={game.id} style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 15, padding: 16, marginBottom: 12, gap: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text c={C.muted} fw="bold" size={11}>{game.emoji}  {game.league.toUpperCase()} · {game.time}</Text>
      {game.live && <Text c="#D44545" fw="bold" size={11}>● LIVE</Text>}
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}><Text c={C.ink} fw="bold" size={16}>{game.away}</Text><Text c={C.ink} fw="bold" size={16}>{game.home}</Text></View>
      {!!game.score && <Text c={C.blue} fw="bold" size={19}>{game.score}</Text>}
    </View>
    <Text c={C.muted} size={11}>Moneyline · choose the winner</Text>
    <View style={{ flexDirection: 'row', gap: 9 }}>{market(game, 'away')}{market(game, 'home')}</View>
  </View>;
  const slipContent = <View style={{ gap: 13 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text c={C.ink} fw="bold" size={21}>Pick slip</Text>
      <Text c={C.muted} size={12}>{slip.length} {slip.length === 1 ? 'selection' : 'selections'}</Text>
    </View>
    {slip.length === 0 ? <View style={{ alignItems: 'center', gap: 8, paddingVertical: 40 }}>
      <Text size={40}>🎟️</Text><Text c={C.muted} ta="center">Choose a moneyline to start a demo pick.</Text>
    </View> : <>
      {slip.map((selection) => { const game = GAMES.find((item) => item.id === selection.gameId)!;
        const team = selection.side === 'away' ? game.away : game.home;
        return <View key={game.id} style={{ borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 11, flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Text c={C.ink} fw="bold" size={13}>{team}</Text>
            <Text c={C.muted} size={11}>{game.away} vs {game.home}</Text></View>
          <Text c={C.blue} fw="bold">{oddsText(selectionOdds(selection))}</Text>
          <Pressable onPress={() => setSlip((old) => old.filter((item) => item.gameId !== game.id))} accessibilityLabel={`Remove ${team}`}>
            <Icon name="x" color={C.muted} size={17} /></Pressable>
        </View>; })}
      <Text c={C.ink} fw="bold" size={13}>Demo stake</Text>
      <TextInput value={stake} onChangeText={setStake} keyboardType="decimal-pad" placeholder="Amount"
        style={{ borderWidth: 1, borderColor: C.line, borderRadius: 9, padding: 12, color: C.ink, fontSize: 16 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text c={C.muted} size={13}>Potential return</Text>
        <Text c={C.green} fw="bold" size={17}>{Number.isFinite(payout) ? money(payout) : '—'}</Text></View>
      <Text c={C.muted} size={12}>Demo credits available: {money(balance)}</Text>
      <Button title="Place simulated pick" color={C.blue} disabled={!valid} onPress={placePick} />
      <Text c={C.muted} size={11}>Fictional games and odds. No real money or wager is involved.</Text>
    </>}
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F8FB' }}><StatusBar barStyle="light-content" />
    <View style={{ width: '100%', maxWidth: 1300, alignSelf: 'center', flex: 1 }}>
      <View style={{ backgroundColor: C.navy, paddingHorizontal: wide ? 28 : 17, paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text c={C.white} fw="bold" size={wide ? 26 : 20}>FIELDHOUSE</Text>
        <Text c={C.white} fw="bold" size={wide ? 14 : 12}>◈ {money(balance)} demo</Text>
      </View>
      <View style={{ backgroundColor: C.navy, paddingHorizontal: wide ? 28 : 17 }}>{nav}</View>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: wide ? 24 : 16, paddingBottom: 50 }}>
          <View style={{ maxWidth: 840, width: '100%', alignSelf: 'center' }}>
            {tab === 'picks' ? <>
              <Text c={C.ink} fw="bold" size={27}>My Picks</Text>
              <Text c={C.muted} size={13} style={{ marginTop: 4, marginBottom: 20 }}>Your simulated picks stay on this device.</Text>
              {picks.length === 0 && <View style={{ backgroundColor: C.white, padding: 30, borderRadius: 14, alignItems: 'center', gap: 10 }}>
                <Text size={50}>🎟️</Text><Text c={C.ink} fw="bold" size={18}>No picks yet</Text>
                <Button title="Explore games" color={C.blue} onPress={() => setTab('sports')} /></View>}
              {picks.map((pick) => <View key={pick.id} style={{ backgroundColor: C.white, padding: 17, borderRadius: 13, marginBottom: 11, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text c={C.ink} fw="bold">Demo pick</Text>
                  <Text c={C.blue} fw="bold" size={12}>PENDING</Text></View>
                {pick.selections.map((selection) => { const game = GAMES.find((item) => item.id === selection.gameId)!;
                  return <Text key={game.id} c={C.ink} size={13}>{selection.side === 'away' ? game.away : game.home} · {oddsText(selectionOdds(selection))}</Text>; })}
                <View style={{ height: 1, backgroundColor: C.line }} />
                <Text c={C.muted} size={12}>Stake {money(pick.stake)} · Potential return {money(pick.payout)}</Text>
                <Text c={C.muted} size={11}>{pick.placed}</Text>
              </View>)}
            </> : <>
              <View style={{ backgroundColor: C.navy, borderRadius: 16, padding: 21, marginBottom: 21 }}>
                <Text c="#76B6FF" fw="bold" size={11}>FIELDHOUSE SPORTSBOOK · DEMO</Text>
                <Text c={C.white} fw="bold" size={27} style={{ marginTop: 5 }}>Make your picks.</Text>
                <Text c="#CDD9EB" size={13} style={{ marginTop: 5 }}>Explore fictional matchups with demo credits.</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
                {['All', 'Basketball', 'Football', 'Hockey', 'Soccer'].map((item) => <Pressable key={item} onPress={() => setLeague(item)}
                  style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, backgroundColor: league === item ? C.blue : C.white }}>
                  <Text c={league === item ? C.white : C.ink} fw="semibold" size={12}>{item}</Text></Pressable>)}
              </ScrollView>
              <Text c={C.ink} fw="bold" size={21} style={{ marginBottom: 12 }}>{tab === 'live' ? 'Live demo games' : 'Featured games'}</Text>
              {visible.map(gameCard)}
            </>}
          </View>
        </ScrollView>
        {wide && <View style={{ width: 310, backgroundColor: C.white, borderLeftWidth: 1, borderLeftColor: C.line, padding: 20 }}>
          {slipContent}
        </View>}
      </View>
      {!wide && slip.length > 0 && !showSlip && <Pressable onPress={() => setShowSlip(true)} style={{ backgroundColor: C.blue, margin: 12, borderRadius: 11, padding: 13, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text c={C.white} fw="bold">Pick slip · {slip.length}</Text><Text c={C.white} fw="bold">View ↑</Text></Pressable>}
    </View>
    {!wide && showSlip && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#0A1A3499', justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: C.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '85%', padding: 18 }}>
        <View style={{ alignSelf: 'flex-end' }}><IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Close pick slip" onPress={() => setShowSlip(false)} /></View>
        <ScrollView>{slipContent}</ScrollView>
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><FieldhouseScreen /></PlocksProvider></SafeAreaProvider>;
}
