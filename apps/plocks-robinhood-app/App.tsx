import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Defs, LinearGradient, Stop, Path, Polyline } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui';

const C = { ink: '#101616', muted: '#6F7C79', green: '#00B67A', darkGreen: '#007C56', line: '#E6ECE9', pale: '#E9F8F1', white: '#FFF', red: '#D45B5B' };
const STOCKS = [
  { ticker: 'AAPL', name: 'Apple', price: 192.45, change: 1.82, color: '#242424', initials: 'A' },
  { ticker: 'NVDA', name: 'Nvidia', price: 128.74, change: 3.47, color: '#74B900', initials: 'N' },
  { ticker: 'MSFT', name: 'Microsoft', price: 421.36, change: -0.64, color: '#2777BD', initials: 'M' },
  { ticker: 'TSLA', name: 'Tesla', price: 251.08, change: -1.25, color: '#DF3434', initials: 'T' },
  { ticker: 'AMZN', name: 'Amazon', price: 185.62, change: 0.93, color: '#F5A623', initials: 'A' },
  { ticker: 'SPY', name: 'S&P 500 ETF', price: 548.21, change: 0.71, color: '#555C6C', initials: 'S' },
];
const SERIES: Record<string, number[]> = {
  '1D': [31, 32, 30, 34, 33, 36, 34, 39, 38, 42, 40, 41, 45, 44, 48, 47, 51, 50, 53, 55],
  '1W': [22, 25, 23, 29, 27, 33, 32, 30, 37, 42, 40, 39, 45, 48, 46, 51, 53, 50, 54, 56],
  '1M': [18, 22, 25, 21, 28, 32, 30, 36, 33, 38, 42, 40, 45, 43, 48, 52, 49, 54, 52, 57],
  '3M': [15, 18, 23, 20, 25, 27, 32, 30, 35, 39, 36, 41, 44, 47, 45, 49, 51, 50, 54, 57],
  '1Y': [10, 14, 18, 21, 19, 24, 27, 31, 29, 33, 36, 40, 38, 43, 45, 46, 49, 51, 53, 57],
  ALL: [7, 10, 13, 17, 15, 21, 24, 23, 30, 28, 34, 37, 35, 41, 44, 42, 48, 50, 53, 57],
};
type Tab = 'home' | 'search' | 'watchlist' | 'account';
type Holding = Record<string, number>;
type Activity = { id: string; side: 'Buy' | 'Sell'; ticker: string; shares: number; total: number };
const STORAGE = 'plocks-robinhood-example:v1';
const money = (value: number) => '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TrendChart({ values, height = 180 }: { values: number[]; height?: number }) {
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 400},${150 - value * 2.15}`).join(' ');
  const line = values.map((value, index) => `${index ? 'L' : 'M'} ${(index / (values.length - 1)) * 400} ${150 - value * 2.15}`).join(' ');
  return <Svg width="100%" height={height} viewBox="0 0 400 160" preserveAspectRatio="none" accessibilityLabel="Portfolio value chart">
    <Defs><LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.green} stopOpacity="0.22" /><Stop offset="1" stopColor={C.green} stopOpacity="0" /></LinearGradient></Defs>
    <Path d={`${line} L 400 160 L 0 160 Z`} fill="url(#chartFill)" />
    <Polyline points={points} fill="none" stroke={C.green} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
  </Svg>;
}

function StockMark({ stock }: { stock: typeof STOCKS[number] }) {
  return <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: stock.color, alignItems: 'center', justifyContent: 'center' }}>
    <Text c="#fff" fw="bold" size={17}>{stock.initials}</Text>
  </View>;
}

function SproutScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const [tab, setTab] = useState<Tab>('home');
  const [range, setRange] = useState('1D');
  const [holdings, setHoldings] = useState<Holding>({ AAPL: 8, NVDA: 5, SPY: 3 });
  const [cash, setCash] = useState(2450);
  const [watchlist, setWatchlist] = useState<string[]>(['TSLA', 'AMZN']);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ticket, setTicket] = useState<'Buy' | 'Sell' | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const stock = STOCKS.find((item) => item.ticker === selected);
  const shares = stock ? holdings[stock.ticker] ?? 0 : 0;
  const count = Number(quantity);
  const total = stock ? count * stock.price : 0;
  const validOrder = !!stock && Number.isInteger(count) && count > 0 && (ticket === 'Buy' ? total <= cash : count <= shares);
  const equity = STOCKS.reduce((sum, item) => sum + (holdings[item.ticker] ?? 0) * item.price, 0);
  const portfolio = cash + equity;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { holdings?: Holding; cash?: number; watchlist?: string[]; activity?: Activity[] };
      if (data.holdings && typeof data.holdings === 'object') setHoldings(data.holdings);
      if (typeof data.cash === 'number') setCash(data.cash);
      if (Array.isArray(data.watchlist)) setWatchlist(data.watchlist);
      if (Array.isArray(data.activity)) setActivity(data.activity);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ holdings, cash, watchlist, activity })).catch(() => {});
  }, [holdings, cash, watchlist, activity, ready]);

  function submitOrder() {
    if (!validOrder || !stock || !ticket) return;
    setHoldings((old) => ({ ...old, [stock.ticker]: (old[stock.ticker] ?? 0) + (ticket === 'Buy' ? count : -count) }));
    setCash((old) => old + (ticket === 'Buy' ? -total : total));
    setActivity((old) => [{ id: `trade-${Date.now()}`, side: ticket, ticker: stock.ticker, shares: count, total }, ...old]);
    setTicket(null);
    setQuantity('1');
  }
  const stockRow = (item: typeof STOCKS[number]) => <Pressable key={item.ticker} onPress={() => setSelected(item.ticker)}
    accessibilityRole="button" accessibilityLabel={`View ${item.name}`}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line }}>
    <StockMark stock={item} /><View style={{ flex: 1 }}><Text c={C.ink} fw="bold" size={15}>{item.ticker}</Text>
      <Text c={C.muted} size={12}>{item.name}</Text></View>
    <View style={{ alignItems: 'flex-end' }}><Text c={C.ink} fw="semibold" size={14}>{money(item.price)}</Text>
      <Text c={item.change >= 0 ? C.darkGreen : C.red} size={12}>{item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%</Text></View>
  </Pressable>;
  const nav = <View style={{ flexDirection: wide ? 'column' : 'row', gap: wide ? 7 : 0, justifyContent: 'space-around' }}>
    {(['home', 'search', 'watchlist', 'account'] as const).map((item) => <Pressable key={item} onPress={() => { setTab(item); setSelected(null); }}
      accessibilityRole="tab" accessibilityState={{ selected: tab === item }} style={{ flexDirection: wide ? 'row' : 'column',
        alignItems: 'center', gap: wide ? 14 : 4, paddingHorizontal: wide ? 15 : 5, paddingVertical: 10,
        borderRadius: 11, backgroundColor: wide && tab === item ? C.pale : 'transparent' }}>
      <Icon name={item === 'home' ? 'home' : item === 'search' ? 'search' : item === 'watchlist' ? 'bookmark' : 'avatar'}
        variant={tab === item ? 'filled' : 'outlined'} color={tab === item ? C.darkGreen : C.muted} size={wide ? 21 : 23} />
      <Text c={tab === item ? C.ink : C.muted} fw={tab === item ? 'bold' : 'normal'} size={wide ? 14 : 10}>{item[0].toUpperCase() + item.slice(1)}</Text>
    </Pressable>)}
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}><StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
      {wide && <View style={{ width: 218, padding: 18, borderRightWidth: 1, borderRightColor: C.line, gap: 26 }}>
        <Text c={C.green} fw="bold" size={28}>sprout ↗</Text>{nav}
        <View style={{ flex: 1 }} /><Text c={C.muted} size={11}>Simulated prices and trades</Text>
      </View>}
      <View style={{ flex: 1 }}>
        {!wide && <View style={{ height: 60, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text c={C.green} fw="bold" size={25}>sprout ↗</Text><Text c={C.muted} size={12}>Demo portfolio</Text>
        </View>}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 35 }}>
          <View style={{ width: '100%', maxWidth: 820 }}>
            {tab === 'home' && <>
              <View style={{ paddingTop: 27 }}><Text c={C.muted} fw="semibold" size={13}>Portfolio value</Text>
                <Text c={C.ink} fw="bold" size={38} style={{ marginTop: 2 }}>{money(portfolio)}</Text>
                <Text c={C.darkGreen} fw="semibold" size={13}>↗ $142.38 (1.42%) today</Text>
              </View>
              <View style={{ marginVertical: 22 }}><TrendChart values={SERIES[range]} /></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 20 }}>
                {Object.keys(SERIES).map((item) => <Pressable key={item} onPress={() => setRange(item)}
                  style={{ backgroundColor: range === item ? C.pale : 'transparent', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }}>
                  <Text c={range === item ? C.darkGreen : C.muted} fw="bold" size={12}>{item}</Text></Pressable>)}
              </View>
              <View style={{ backgroundColor: '#F7FAF8', borderRadius: 15, padding: 17, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View><Text c={C.muted} size={12}>Buying power</Text><Text c={C.ink} fw="bold" size={20}>{money(cash)}</Text></View>
                <View style={{ alignSelf: 'center' }}><Icon name="chevronRight" color={C.muted} size={20} /></View>
              </View>
              <Text c={C.ink} fw="bold" size={21} style={{ marginTop: 30, marginBottom: 6 }}>Your stocks</Text>
              {STOCKS.filter((item) => (holdings[item.ticker] ?? 0) > 0).map(stockRow)}
              <Text c={C.ink} fw="bold" size={21} style={{ marginTop: 30, marginBottom: 6 }}>Watchlist</Text>
              {STOCKS.filter((item) => watchlist.includes(item.ticker)).map(stockRow)}
            </>}
            {tab === 'search' && <View style={{ paddingTop: 24 }}>
              <Text c={C.ink} fw="bold" size={26}>Search</Text>
              <TextInput value={query} onChangeText={setQuery} placeholder="Search stocks and ETFs"
                style={{ backgroundColor: '#F3F7F5', borderRadius: 12, padding: 14, marginVertical: 18, color: C.ink, fontSize: 15 }} />
              <Text c={C.muted} fw="bold" size={12}>{query ? 'RESULTS' : 'POPULAR TODAY'}</Text>
              {STOCKS.filter((item) => `${item.ticker} ${item.name}`.toLowerCase().includes(query.toLowerCase())).map(stockRow)}
            </View>}
            {tab === 'watchlist' && <View style={{ paddingTop: 24 }}><Text c={C.ink} fw="bold" size={26}>Watchlist</Text>
              <Text c={C.muted} size={13} style={{ marginTop: 5, marginBottom: 20 }}>Keep an eye on what interests you.</Text>
              {watchlist.length ? STOCKS.filter((item) => watchlist.includes(item.ticker)).map(stockRow)
                : <Text c={C.muted}>Open a stock and tap the bookmark to add it here.</Text>}
            </View>}
            {tab === 'account' && <View style={{ paddingTop: 24 }}>
              <Text c={C.ink} fw="bold" size={26}>Account</Text>
              <View style={{ backgroundColor: '#F7FAF8', borderRadius: 16, padding: 18, marginVertical: 20, gap: 10 }}>
                <Text c={C.muted} size={12}>Demo account</Text><Text c={C.ink} fw="bold" size={24}>{money(portfolio)}</Text>
                <Text c={C.muted} size={13}>Invested {money(equity)} · Cash {money(cash)}</Text>
              </View>
              <Text c={C.ink} fw="bold" size={19}>Recent activity</Text>
              {activity.length ? activity.map((item) => <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line }}>
                <Text c={C.ink} fw="semibold">{item.side} {item.shares} {item.ticker}</Text><Text c={C.muted}>{money(item.total)}</Text></View>)
                : <Text c={C.muted} style={{ marginTop: 14 }}>No trades yet. Explore a stock to try a simulated order.</Text>}
              <Text c={C.muted} size={12} style={{ marginTop: 30 }}>Educational UI example. Prices are fictional and no real orders are placed.</Text>
            </View>}
          </View>
        </ScrollView>
        {!wide && <View style={{ borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white }}>{nav}</View>}
      </View>
    </View>
    {!!stock && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#091F18AA', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <View style={{ width: '100%', maxWidth: 490, maxHeight: '92%', backgroundColor: C.white, borderRadius: 18, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <StockMark stock={stock} /><IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Close stock details"
              onPress={() => { setSelected(null); setTicket(null); }} />
          </View>
          <Text c={C.ink} fw="bold" size={27} style={{ marginTop: 15 }}>{stock.name}</Text><Text c={C.muted} size={13}>{stock.ticker}</Text>
          <Text c={C.ink} fw="bold" size={32} style={{ marginTop: 17 }}>{money(stock.price)}</Text>
          <Text c={stock.change >= 0 ? C.darkGreen : C.red} size={13}>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}% today</Text>
          <View style={{ marginVertical: 15 }}><TrendChart values={SERIES['1D']} height={140} /></View>
          <Text c={C.muted} size={13}>Your position: {shares} {shares === 1 ? 'share' : 'shares'} · {money(shares * stock.price)}</Text>
          <Pressable onPress={() => setWatchlist((old) => old.includes(stock.ticker) ? old.filter((id) => id !== stock.ticker) : [...old, stock.ticker])}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 }}>
            <Icon name="bookmark" variant={watchlist.includes(stock.ticker) ? 'filled' : 'outlined'} color={C.darkGreen} size={20} />
            <Text c={C.darkGreen} fw="semibold">{watchlist.includes(stock.ticker) ? 'Remove from watchlist' : 'Add to watchlist'}</Text>
          </Pressable>
          {ticket ? <View style={{ gap: 11, paddingTop: 7, borderTopWidth: 1, borderTopColor: C.line }}>
            <Text c={C.ink} fw="bold" size={18}>{ticket} {stock.ticker}</Text>
            <TextInput value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Number of shares"
              style={{ borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, color: C.ink }} />
            <Text c={C.muted} size={13}>Estimated total: {Number.isFinite(total) ? money(total) : '—'}</Text>
            <Text c={C.muted} size={12}>Available: {ticket === 'Buy' ? money(cash) : `${shares} shares`}</Text>
            <Button title={`Confirm simulated ${ticket.toLowerCase()}`} color={C.green} disabled={!validOrder} onPress={submitOrder} />
            <Button title="Cancel" variant="subtle" color={C.ink} onPress={() => setTicket(null)} />
          </View> : <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}><Button title="Buy" color={C.green} fullWidth onPress={() => { setQuantity('1'); setTicket('Buy'); }} /></View>
            <View style={{ flex: 1 }}><Button title="Sell" variant="outline" color={C.darkGreen} fullWidth disabled={!shares}
              onPress={() => { setQuantity('1'); setTicket('Sell'); }} /></View>
          </View>}
        </ScrollView>
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><SproutScreen /></PlocksProvider></SafeAreaProvider>;
}
