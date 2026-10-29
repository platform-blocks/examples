import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChartThemeProvider } from '@plocks/charts';
import { Block, Icon, PlocksProvider, SafeArea, ScrollArea, Tabs, Text, useTheme } from '@plocks/ui-snack';
import type { Side } from './components/TradePanel';
import { findAsset, START_CASH, START_POSITIONS, START_WATCHLIST, type Position } from './data';
import { AssetScreen } from './screens/AssetScreen';
import { AccountScreen, HomeScreen, SearchScreen, WatchlistScreen, type Activity } from './screens/TabScreens';
import { C } from './theme';

type Tab = 'home' | 'search' | 'watchlist' | 'account';
const TABS: Tab[] = ['home', 'search', 'watchlist', 'account'];
const TAB_ICONS: Record<Tab, string> = { home: 'home', search: 'search', watchlist: 'bookmark', account: 'avatar' };
const STORAGE = 'plocks-sproutfolio-example:v2';

function SproutfolioScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const [tab, setTab] = useState<Tab>('home');
  const [positions, setPositions] = useState<Record<string, Position>>(START_POSITIONS);
  const [cash, setCash] = useState(START_CASH);
  const [watchlist, setWatchlist] = useState<string[]>(START_WATCHLIST);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const asset = selected ? findAsset(selected) : undefined;
  const equity = Object.entries(positions).reduce(
    (sum, [ticker, position]) => sum + position.qty * (findAsset(ticker)?.price ?? 0),
    0,
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as {
          positions?: Record<string, Position>;
          cash?: number;
          watchlist?: string[];
          activity?: Activity[];
        };
        if (data.positions && typeof data.positions === 'object') setPositions(data.positions);
        if (typeof data.cash === 'number') setCash(data.cash);
        if (Array.isArray(data.watchlist)) setWatchlist(data.watchlist);
        if (Array.isArray(data.activity)) setActivity(data.activity);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ positions, cash, watchlist, activity })).catch(() => {});
  }, [positions, cash, watchlist, activity, ready]);

  function trade(side: Side, qty: number) {
    if (!asset) return;
    const total = qty * asset.price;
    setPositions((old) => {
      const current = old[asset.ticker] ?? { qty: 0, avgCost: 0 };
      const nextQty = Math.round((current.qty + (side === 'Buy' ? qty : -qty)) * 1e8) / 1e8;
      const avgCost = side === 'Buy' ? (current.qty * current.avgCost + total) / nextQty : current.avgCost;
      const next = { ...old };
      if (nextQty > 0) next[asset.ticker] = { qty: nextQty, avgCost };
      else delete next[asset.ticker];
      return next;
    });
    setCash((old) => old + (side === 'Buy' ? -total : total));
    setActivity((old) => [{ id: `trade-${Date.now()}`, side, ticker: asset.ticker, qty, total }, ...old]);
  }

  const open = (ticker: string) => setSelected(ticker);
  const nav = (
    <Tabs
      navigationOnly
      orientation={wide ? 'vertical' : 'horizontal'}
      variant={wide ? 'chip' : 'line'}
      color={C.darkGreen}
      value={tab}
      onChange={(item) => {
        setTab(item as Tab);
        setSelected(null);
      }}
      items={TABS.map((item) => ({
        key: item,
        label: item[0].toUpperCase() + item.slice(1),
        icon: (
          <Icon
            name={TAB_ICONS[item]}
            color={tab === item && wide ? C.white : tab === item ? C.darkGreen : C.muted}
            size={wide ? 21 : 20}
          />
        ),
        content: null,
      }))}
    />
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.white}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} maw={1280} w="100%" alignSelf="center">
        {wide && (
          <Block w={218} p={18} borderRightWidth={1} borderRightColor={C.line} gap={26}>
            <Text c={C.green} fw="bold" size={28}>
              sprout ↗
            </Text>
            {nav}
            <Block gap={0} flex={1} />
            <Text c={C.muted} size={11}>
              Simulated prices and trades
            </Text>
          </Block>
        )}
        <Block gap={0} flex={1}>
          {asset ? (
            <AssetScreen
              key={asset.ticker}
              asset={asset}
              position={positions[asset.ticker]}
              cash={cash}
              portfolioValue={cash + equity}
              watched={watchlist.includes(asset.ticker)}
              wide={wide}
              onBack={() => setSelected(null)}
              onToggleWatch={() =>
                setWatchlist((old) =>
                  old.includes(asset.ticker) ? old.filter((id) => id !== asset.ticker) : [...old, asset.ticker],
                )
              }
              onOpen={open}
              onOpenList={(list) => {
                setQuery(list);
                setTab('search');
                setSelected(null);
              }}
              onTrade={trade}
            />
          ) : (
            <>
              {!wide && (
                <Block
                  gap={0}
                  h={60}
                  px={18}
                  direction="row"
                  justify="space-between"
                  align="center"
                  borderBottomWidth={1}
                  borderBottomColor={C.line}
                >
                  <Text c={C.green} fw="bold" size={25}>
                    sprout ↗
                  </Text>
                  <Text c={C.muted} size={12}>
                    Demo portfolio
                  </Text>
                </Block>
              )}
              <ScrollArea key={tab} flex={1} contentProps={{ align: 'center', px: 20, pb: 35 }}>
                <Block gap={0} w="100%" maw={820}>
                  {tab === 'home' && (
                    <HomeScreen positions={positions} cash={cash} watchlist={watchlist} onOpen={open} wide={wide} />
                  )}
                  {tab === 'search' && <SearchScreen query={query} setQuery={setQuery} onOpen={open} wide={wide} />}
                  {tab === 'watchlist' && <WatchlistScreen watchlist={watchlist} onOpen={open} />}
                  {tab === 'account' && (
                    <AccountScreen positions={positions} cash={cash} activity={activity} onOpen={open} />
                  )}
                </Block>
              </ScrollArea>
            </>
          )}
          {!wide && !asset && (
            <Block gap={0} borderTopWidth={1} borderTopColor={C.line} bg={C.white}>
              {nav}
            </Block>
          )}
        </Block>
      </Block>
    </SafeArea>
  );
}

/** Chart labels inherit the app font and ink; without it SVG text falls back to the browser serif on web. */
function ChartTheme({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const bridge = useMemo(
    () => ({
      textPrimary: C.ink,
      textSecondary: C.muted,
      background: C.white,
      grid: C.line,
      fontFamily: theme.fontFamily,
    }),
    [theme.fontFamily],
  );
  return <ChartThemeProvider hostThemeBridge={bridge}>{children}</ChartThemeProvider>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <ChartTheme>
          <SproutfolioScreen />
        </ChartTheme>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
