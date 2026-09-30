import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Chip, Dialog, Input, ScrollArea, SafeArea, Block, Button, Icon, IconButton, PlocksProvider, Tabs, Text } from '@plocks/ui-snack';

const C = {
  navy: '#0D1D3B',
  blue: '#1767D5',
  sky: '#EAF3FF',
  white: '#FFF',
  ink: '#17243C',
  muted: '#6D7C93',
  line: '#E5EAF1',
  green: '#21815E',
};
const GAMES = [
  {
    id: 'hoops1',
    league: 'Basketball',
    away: 'Metro Comets',
    home: 'Harbor Waves',
    time: 'Tonight · 7:30 PM',
    awayOdds: 125,
    homeOdds: -145,
    live: true,
    score: '62 – 58',
    emoji: '🏀',
  },
  {
    id: 'hoops2',
    league: 'Basketball',
    away: 'Canyon Solars',
    home: 'Summit Bears',
    time: 'Tomorrow · 6:00 PM',
    awayOdds: -110,
    homeOdds: 105,
    live: false,
    score: '',
    emoji: '🏀',
  },
  {
    id: 'football1',
    league: 'Football',
    away: 'Coastal Hawks',
    home: 'Valley Foxes',
    time: 'Sunday · 1:00 PM',
    awayOdds: 115,
    homeOdds: -135,
    live: false,
    score: '',
    emoji: '🏈',
  },
  {
    id: 'football2',
    league: 'Football',
    away: 'Northern Lights',
    home: 'Desert Owls',
    time: 'Sunday · 4:25 PM',
    awayOdds: -120,
    homeOdds: 110,
    live: false,
    score: '',
    emoji: '🏈',
  },
  {
    id: 'hockey1',
    league: 'Hockey',
    away: 'Ice Harbor',
    home: 'River Wolves',
    time: 'Tonight · 8:00 PM',
    awayOdds: 135,
    homeOdds: -155,
    live: true,
    score: '2 – 2',
    emoji: '🏒',
  },
  {
    id: 'soccer1',
    league: 'Soccer',
    away: 'Union City',
    home: 'Blue Coast FC',
    time: 'Saturday · 5:00 PM',
    awayOdds: -105,
    homeOdds: 120,
    live: false,
    score: '',
    emoji: '⚽',
  },
];
type Game = (typeof GAMES)[number];
type Selection = { gameId: string; side: 'away' | 'home' };
type Pick = { id: string; selections: Selection[]; stake: number; payout: number; placed: string };
type Tab = 'sports' | 'live' | 'picks';
const STORAGE = 'plocks-fieldhouse-example:v1';
const money = (value: number) => '$' + value.toFixed(2);
const oddsText = (value: number) => (value > 0 ? `+${value}` : String(value));
const decimalOdds = (value: number) => (value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value));
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
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as { balance?: number; picks?: Pick[] };
        if (typeof data.balance === 'number') setBalance(data.balance);
        if (Array.isArray(data.picks)) setPicks(data.picks);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ balance, picks })).catch(() => {});
  }, [balance, picks, ready]);
  function choose(gameId: string, side: Selection['side']) {
    setSlip((old) =>
      old.some((item) => item.gameId === gameId && item.side === side)
        ? old.filter((item) => item.gameId !== gameId)
        : [...old.filter((item) => item.gameId !== gameId), { gameId, side }],
    );
    if (!wide) setShowSlip(true);
  }
  function placePick() {
    if (!valid) return;
    setBalance((old) => old - amount);
    setPicks((old) => [
      { id: `pick-${Date.now()}`, selections: slip, stake: amount, payout, placed: new Date().toLocaleString() },
      ...old,
    ]);
    setSlip([]);
    setStake('10');
    setShowSlip(false);
    setTab('picks');
  }
  const nav = (
    <Tabs
      navigationOnly
      variant="chip"
      value={tab}
      onChange={(item) => setTab(item as Tab)}
      color={C.blue}
      activeTabTextColor={C.white}
      textStyle={{ color: '#C4D5EF' }}
      labelProps={{ size: wide ? 15 : 13 }}
      items={[
        { key: 'sports', label: 'Sports', content: null },
        { key: 'live', label: 'Live', content: null },
        { key: 'picks', label: 'My Picks', content: null },
      ]}
    />
  );
  const market = (game: Game, side: 'away' | 'home') => {
    const chosen = slip.some((item) => item.gameId === game.id && item.side === side);
    const team = side === 'away' ? game.away : game.home;
    const odds = side === 'away' ? game.awayOdds : game.homeOdds;
    return (
      <Block
        onPress={() => choose(game.id, side)}
        accessibilityRole="button"
        accessibilityLabel={`Pick ${team} at ${oddsText(odds)}`}
        flex={1}
        bg={chosen ? C.blue : C.sky}
        radius={9}
        p={11}
        align="center"
        gap={3}
      >
        <Text c={chosen ? C.white : C.ink} fw="semibold" size={12} numberOfLines={1}>
          {team}
        </Text>
        <Text c={chosen ? C.white : C.blue} fw="bold" size={16}>
          {oddsText(odds)}
        </Text>
      </Block>
    );
  };
  const gameCard = (game: Game) => (
    <Block key={game.id} bg={C.white} borderWidth={1} borderColor={C.line} radius={15} p={16} mb={12} gap={12}>
      <Block gap={0} direction="row" justify="space-between" align="center">
        <Text c={C.muted} fw="bold" size={11}>
          {game.emoji} {game.league.toUpperCase()} · {game.time}
        </Text>
        {game.live && (
          <Text c="#D44545" fw="bold" size={11}>
            ● LIVE
          </Text>
        )}
      </Block>
      <Block gap={0} direction="row" justify="space-between" align="center">
        <Block gap={0} flex={1}>
          <Text c={C.ink} fw="bold" size={16}>
            {game.away}
          </Text>
          <Text c={C.ink} fw="bold" size={16}>
            {game.home}
          </Text>
        </Block>
        {!!game.score && (
          <Text c={C.blue} fw="bold" size={19}>
            {game.score}
          </Text>
        )}
      </Block>
      <Text c={C.muted} size={11}>
        Moneyline · choose the winner
      </Text>
      <Block direction="row" gap={9}>
        {market(game, 'away')}
        {market(game, 'home')}
      </Block>
    </Block>
  );
  const slipContent = (
    <Block gap={13}>
      <Block gap={0} direction="row" justify="space-between" align="center">
        <Text c={C.ink} fw="bold" size={21}>
          Pick slip
        </Text>
        <Text c={C.muted} size={12}>
          {slip.length} {slip.length === 1 ? 'selection' : 'selections'}
        </Text>
      </Block>
      {slip.length === 0 ? (
        <Block align="center" gap={8} py={40}>
          <Text size={40}>🎟️</Text>
          <Text c={C.muted} ta="center">
            Choose a moneyline to start a demo pick.
          </Text>
        </Block>
      ) : (
        <>
          {slip.map((selection) => {
            const game = GAMES.find((item) => item.id === selection.gameId)!;
            const team = selection.side === 'away' ? game.away : game.home;
            return (
              <Block key={game.id} borderBottomWidth={1} borderBottomColor={C.line} pb={11} direction="row" gap={8}>
                <Block gap={0} flex={1}>
                  <Text c={C.ink} fw="bold" size={13}>
                    {team}
                  </Text>
                  <Text c={C.muted} size={11}>
                    {game.away} vs {game.home}
                  </Text>
                </Block>
                <Text c={C.blue} fw="bold">
                  {oddsText(selectionOdds(selection))}
                </Text>
                <Block
                  gap={0}
                  onPress={() => setSlip((old) => old.filter((item) => item.gameId !== game.id))}
                  accessibilityLabel={`Remove ${team}`}
                >
                  <Icon name="x" color={C.muted} size={17} />
                </Block>
              </Block>
            );
          })}
          <Text c={C.ink} fw="bold" size={13}>
            Demo stake
          </Text>
          <Input
            variant="outline"
            value={stake}
            onChangeText={setStake}
            keyboardType="decimal-pad"
            placeholder="Amount"
            mb={0}
            radius={9}
            inputColor={C.ink}
            inputFontSize={16}
          />
          <Block gap={0} direction="row" justify="space-between">
            <Text c={C.muted} size={13}>
              Potential return
            </Text>
            <Text c={C.green} fw="bold" size={17}>
              {Number.isFinite(payout) ? money(payout) : '—'}
            </Text>
          </Block>
          <Text c={C.muted} size={12}>
            Demo credits available: {money(balance)}
          </Text>
          <Button title="Place simulated pick" color={C.blue} disabled={!valid} onPress={placePick} />
          <Text c={C.muted} size={11}>
            Fictional games and odds. No real money or wager is involved.
          </Text>
        </>
      )}
    </Block>
  );

  return (
    <SafeArea gap={0} flex={1} bg="#F6F8FB">
      <StatusBar barStyle="light-content" />
      <Block gap={0} w="100%" maw={1300} alignSelf="center" flex={1}>
        <Block gap={0} bg={C.navy} px={wide ? 28 : 17} pt={11} direction="row" align="center" justify="space-between">
          <Text c={C.white} fw="bold" size={wide ? 26 : 20}>
            FIELDHOUSE
          </Text>
          <Text c={C.white} fw="bold" size={wide ? 14 : 12}>
            ◈ {money(balance)} demo
          </Text>
        </Block>
        <Block gap={0} bg={C.navy} px={wide ? 28 : 17}>
          {nav}
        </Block>
        <Block gap={0} flex={1} direction="row">
          <ScrollArea flex={1} contentProps={{ p: wide ? 24 : 16, pb: 50 }}>
            <Block gap={0} maw={840} w="100%" alignSelf="center">
              {tab === 'picks' ? (
                <>
                  <Text c={C.ink} fw="bold" size={27}>
                    My Picks
                  </Text>
                  <Text c={C.muted} size={13} mt={4} mb={20}>
                    Your simulated picks stay on this device.
                  </Text>
                  {picks.length === 0 && (
                    <Block bg={C.white} p={30} radius={14} align="center" gap={10}>
                      <Text size={50}>🎟️</Text>
                      <Text c={C.ink} fw="bold" size={18}>
                        No picks yet
                      </Text>
                      <Button title="Explore games" color={C.blue} onPress={() => setTab('sports')} />
                    </Block>
                  )}
                  {picks.map((pick) => (
                    <Block key={pick.id} bg={C.white} p={17} radius={13} mb={11} gap={8}>
                      <Block gap={0} direction="row" justify="space-between">
                        <Text c={C.ink} fw="bold">
                          Demo pick
                        </Text>
                        <Text c={C.blue} fw="bold" size={12}>
                          PENDING
                        </Text>
                      </Block>
                      {pick.selections.map((selection) => {
                        const game = GAMES.find((item) => item.id === selection.gameId)!;
                        return (
                          <Text key={game.id} c={C.ink} size={13}>
                            {selection.side === 'away' ? game.away : game.home} · {oddsText(selectionOdds(selection))}
                          </Text>
                        );
                      })}
                      <Block gap={0} h={1} bg={C.line} />
                      <Text c={C.muted} size={12}>
                        Stake {money(pick.stake)} · Potential return {money(pick.payout)}
                      </Text>
                      <Text c={C.muted} size={11}>
                        {pick.placed}
                      </Text>
                    </Block>
                  ))}
                </>
              ) : (
                <>
                  <Block gap={0} bg={C.navy} radius={16} p={21} mb={21}>
                    <Text c="#76B6FF" fw="bold" size={11}>
                      FIELDHOUSE SPORTSBOOK · DEMO
                    </Text>
                    <Text c={C.white} fw="bold" size={27} mt={5}>
                      Make your picks.
                    </Text>
                    <Text c="#CDD9EB" size={13} mt={5}>
                      Explore fictional matchups with demo credits.
                    </Text>
                  </Block>
                  <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8, mb: 20 }}>
                    {['All', 'Basketball', 'Football', 'Hockey', 'Soccer'].map((item) => (
                      <Chip
                        key={item}
                        onPress={() => setLeague(item)}
                        pressed={league === item}
                        variant={league === item ? 'filled' : 'surface'}
                        color={C.blue}
                        size="md"
                      >
                        {item}
                      </Chip>
                    ))}
                  </ScrollArea>
                  <Text c={C.ink} fw="bold" size={21} mb={12}>
                    {tab === 'live' ? 'Live demo games' : 'Featured games'}
                  </Text>
                  {visible.map(gameCard)}
                </>
              )}
            </Block>
          </ScrollArea>
          {wide && (
            <Block gap={0} w={310} bg={C.white} borderLeftWidth={1} borderLeftColor={C.line} p={20}>
              {slipContent}
            </Block>
          )}
        </Block>
        {!wide && slip.length > 0 && !showSlip && (
          <Block
            gap={0}
            onPress={() => setShowSlip(true)}
            bg={C.blue}
            m={12}
            radius={11}
            p={13}
            direction="row"
            justify="space-between"
          >
            <Text c={C.white} fw="bold">
              Pick slip · {slip.length}
            </Text>
            <Text c={C.white} fw="bold">
              View ↑
            </Text>
          </Block>
        )}
      </Block>
      {!wide && showSlip && (
        <Dialog opened variant="bottomsheet" accessibilityLabel="Pick slip" onClose={() => setShowSlip(false)}>
          <Block gap={0}>
            <Block gap={0} alignSelf="flex-end">
              <IconButton
                icon="x"
                variant="ghost"
                iconColor={C.ink}
                accessibilityLabel="Close pick slip"
                onPress={() => setShowSlip(false)}
              />
            </Block>
            <ScrollArea>{slipContent}</ScrollArea>
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
        <FieldhouseScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
