import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LineChart } from '@plocks/charts';
import { Input, ScrollArea, SafeArea, Block, Button, Dialog, Icon, IconButton, PlocksProvider, SegmentedControl, Tabs, Text } from '@plocks/ui';

const C = {
  ink: '#101616',
  muted: '#6F7C79',
  green: '#00B67A',
  darkGreen: '#007C56',
  line: '#E6ECE9',
  pale: '#E9F8F1',
  white: '#FFF',
  red: '#D45B5B',
};
const STOCKS = [
  { ticker: 'ASTR', name: 'Aster Devices', price: 192.45, change: 1.82, color: '#242424', initials: 'A' },
  { ticker: 'NIVA', name: 'Nivara Graphics', price: 128.74, change: 3.47, color: '#74B900', initials: 'N' },
  { ticker: 'MERA', name: 'Meridian Systems', price: 421.36, change: -0.64, color: '#2777BD', initials: 'M' },
  { ticker: 'VYLT', name: 'Vyltra Motors', price: 251.08, change: -1.25, color: '#DF3434', initials: 'V' },
  { ticker: 'NORT', name: 'Northway Commerce', price: 185.62, change: 0.93, color: '#F5A623', initials: 'N' },
  { ticker: 'BASK', name: 'Market Basket Fund', price: 548.21, change: 0.71, color: '#555C6C', initials: 'B' },
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
const STORAGE = 'plocks-sproutfolio-example:v1';
const money = (value: number) =>
  '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TrendChart({ values, height = 180 }: { values: number[]; height?: number }) {
  const [width, setWidth] = useState(0);
  return (
    <Block gap={0} w="100%" h={height} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <LineChart
          data={values.map((value, index) => ({ x: index, y: value }))}
          w={width}
          h={height}
          lineColor={C.green}
          lineThickness={3}
          fill
          fillColor={C.green}
          fillOpacity={0.22}
          showPoints={false}
          xAxis={{ show: false }}
          yAxis={{ show: false }}
          grid={{ show: false }}
          accessibilityLabel="Portfolio value chart"
        />
      )}
    </Block>
  );
}

function StockMark({ stock }: { stock: (typeof STOCKS)[number] }) {
  return (
    <Block gap={0} w={42} h={42} radius={21} bg={stock.color} align="center" justify="center">
      <Text c="#fff" fw="bold" size={17}>
        {stock.initials}
      </Text>
    </Block>
  );
}

function SproutfolioScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const [tab, setTab] = useState<Tab>('home');
  const [range, setRange] = useState('1D');
  const [holdings, setHoldings] = useState<Holding>({ ASTR: 8, NIVA: 5, BASK: 3 });
  const [cash, setCash] = useState(2450);
  const [watchlist, setWatchlist] = useState<string[]>(['VYLT', 'NORT']);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ticket, setTicket] = useState<'Buy' | 'Sell' | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const stock = STOCKS.find((item) => item.ticker === selected);
  const shares = stock ? (holdings[stock.ticker] ?? 0) : 0;
  const count = Number(quantity);
  const total = stock ? count * stock.price : 0;
  const validOrder =
    !!stock && Number.isInteger(count) && count > 0 && (ticket === 'Buy' ? total <= cash : count <= shares);
  const equity = STOCKS.reduce((sum, item) => sum + (holdings[item.ticker] ?? 0) * item.price, 0);
  const portfolio = cash + equity;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as {
          holdings?: Holding;
          cash?: number;
          watchlist?: string[];
          activity?: Activity[];
        };
        if (data.holdings && typeof data.holdings === 'object') setHoldings(data.holdings);
        if (typeof data.cash === 'number') setCash(data.cash);
        if (Array.isArray(data.watchlist)) setWatchlist(data.watchlist);
        if (Array.isArray(data.activity)) setActivity(data.activity);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ holdings, cash, watchlist, activity })).catch(() => {});
  }, [holdings, cash, watchlist, activity, ready]);

  function submitOrder() {
    if (!validOrder || !stock || !ticket) return;
    setHoldings((old) => ({ ...old, [stock.ticker]: (old[stock.ticker] ?? 0) + (ticket === 'Buy' ? count : -count) }));
    setCash((old) => old + (ticket === 'Buy' ? -total : total));
    setActivity((old) => [
      { id: `trade-${Date.now()}`, side: ticket, ticker: stock.ticker, shares: count, total },
      ...old,
    ]);
    setTicket(null);
    setQuantity('1');
  }
  const stockRow = (item: (typeof STOCKS)[number]) => (
    <Block
      key={item.ticker}
      onPress={() => setSelected(item.ticker)}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}`}
      direction="row"
      align="center"
      gap={13}
      py={13}
      borderBottomWidth={1}
      borderBottomColor={C.line}
    >
      <StockMark stock={item} />
      <Block gap={0} flex={1}>
        <Text c={C.ink} fw="bold" size={15}>
          {item.ticker}
        </Text>
        <Text c={C.muted} size={12}>
          {item.name}
        </Text>
      </Block>
      <Block gap={0} align="flex-end">
        <Text c={C.ink} fw="semibold" size={14}>
          {money(item.price)}
        </Text>
        <Text c={item.change >= 0 ? C.darkGreen : C.red} size={12}>
          {item.change >= 0 ? '+' : ''}
          {item.change.toFixed(2)}%
        </Text>
      </Block>
    </Block>
  );
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
      items={(['home', 'search', 'watchlist', 'account'] as const).map((item) => ({
        key: item,
        label: item[0].toUpperCase() + item.slice(1),
        icon: (
          <Icon
            name={item === 'home' ? 'home' : item === 'search' ? 'search' : item === 'watchlist' ? 'bookmark' : 'avatar'}
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
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} maw={1200} w="100%" alignSelf="center">
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
          <ScrollArea flex={1} contentProps={{ align: 'center', px: 20, pb: 35 }}>
            <Block gap={0} w="100%" maw={820}>
              {tab === 'home' && (
                <>
                  <Block gap={0} pt={27}>
                    <Text c={C.muted} fw="semibold" size={13}>
                      Portfolio value
                    </Text>
                    <Text c={C.ink} fw="bold" size={38} mt={2}>
                      {money(portfolio)}
                    </Text>
                    <Text c={C.darkGreen} fw="semibold" size={13}>
                      ↗ $142.38 (1.42%) today
                    </Text>
                  </Block>
                  <Block gap={0} my={22}>
                    <TrendChart values={SERIES[range]} />
                  </Block>
                  <SegmentedControl
                    data={Object.keys(SERIES)}
                    value={range}
                    onChange={setRange}
                    color={C.darkGreen}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    accessibilityLabel="Portfolio time range"
                  />
                  <Block gap={0} bg="#F7FAF8" radius={15} p={17} mt={20} direction="row" justify="space-between">
                    <Block gap={0}>
                      <Text c={C.muted} size={12}>
                        Buying power
                      </Text>
                      <Text c={C.ink} fw="bold" size={20}>
                        {money(cash)}
                      </Text>
                    </Block>
                    <Block gap={0} alignSelf="center">
                      <Icon name="chevronRight" color={C.muted} size={20} />
                    </Block>
                  </Block>
                  <Text c={C.ink} fw="bold" size={21} mt={30} mb={6}>
                    Your stocks
                  </Text>
                  {STOCKS.filter((item) => (holdings[item.ticker] ?? 0) > 0).map(stockRow)}
                  <Text c={C.ink} fw="bold" size={21} mt={30} mb={6}>
                    Watchlist
                  </Text>
                  {STOCKS.filter((item) => watchlist.includes(item.ticker)).map(stockRow)}
                </>
              )}
              {tab === 'search' && (
                <Block gap={0} pt={24}>
                  <Text c={C.ink} fw="bold" size={26}>
                    Search
                  </Text>
                  <Input
                    variant="filled"
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search stocks and ETFs"
                    mb={0}
                    radius={12}
                    my={18}
                    inputColor={C.ink}
                    inputFontSize={15}
                  />
                  <Text c={C.muted} fw="bold" size={12}>
                    {query ? 'RESULTS' : 'POPULAR TODAY'}
                  </Text>
                  {STOCKS.filter((item) =>
                    `${item.ticker} ${item.name}`.toLowerCase().includes(query.toLowerCase()),
                  ).map(stockRow)}
                </Block>
              )}
              {tab === 'watchlist' && (
                <Block gap={0} pt={24}>
                  <Text c={C.ink} fw="bold" size={26}>
                    Watchlist
                  </Text>
                  <Text c={C.muted} size={13} mt={5} mb={20}>
                    Keep an eye on what interests you.
                  </Text>
                  {watchlist.length ? (
                    STOCKS.filter((item) => watchlist.includes(item.ticker)).map(stockRow)
                  ) : (
                    <Text c={C.muted}>Open a stock and tap the bookmark to add it here.</Text>
                  )}
                </Block>
              )}
              {tab === 'account' && (
                <Block gap={0} pt={24}>
                  <Text c={C.ink} fw="bold" size={26}>
                    Account
                  </Text>
                  <Block bg="#F7FAF8" radius={16} p={18} my={20} gap={10}>
                    <Text c={C.muted} size={12}>
                      Demo account
                    </Text>
                    <Text c={C.ink} fw="bold" size={24}>
                      {money(portfolio)}
                    </Text>
                    <Text c={C.muted} size={13}>
                      Invested {money(equity)} · Cash {money(cash)}
                    </Text>
                  </Block>
                  <Text c={C.ink} fw="bold" size={19}>
                    Recent activity
                  </Text>
                  {activity.length ? (
                    activity.map((item) => (
                      <Block
                        gap={0}
                        key={item.id}
                        direction="row"
                        justify="space-between"
                        py={13}
                        borderBottomWidth={1}
                        borderBottomColor={C.line}
                      >
                        <Text c={C.ink} fw="semibold">
                          {item.side} {item.shares} {item.ticker}
                        </Text>
                        <Text c={C.muted}>{money(item.total)}</Text>
                      </Block>
                    ))
                  ) : (
                    <Text c={C.muted} mt={14}>
                      No trades yet. Explore a stock to try a simulated order.
                    </Text>
                  )}
                  <Text c={C.muted} size={12} mt={30}>
                    Educational UI example. Prices are fictional and no real orders are placed.
                  </Text>
                </Block>
              )}
            </Block>
          </ScrollArea>
          {!wide && (
            <Block gap={0} borderTopWidth={1} borderTopColor={C.line} bg={C.white}>
              {nav}
            </Block>
          )}
        </Block>
      </Block>
      {!!stock && (
        <Dialog opened accessibilityLabel={`${stock.name} details`} onClose={() => {
          setSelected(null);
          setTicket(null);
        }}>
          <Block gap={0}>
            <ScrollArea contentProps={{ p: 20 }}>
              <Block gap={0} direction="row" justify="space-between" align="center">
                <StockMark stock={stock} />
                <IconButton
                  icon="x"
                  variant="ghost"
                  iconColor={C.ink}
                  accessibilityLabel="Close stock details"
                  onPress={() => {
                    setSelected(null);
                    setTicket(null);
                  }}
                />
              </Block>
              <Text c={C.ink} fw="bold" size={27} mt={15}>
                {stock.name}
              </Text>
              <Text c={C.muted} size={13}>
                {stock.ticker}
              </Text>
              <Text c={C.ink} fw="bold" size={32} mt={17}>
                {money(stock.price)}
              </Text>
              <Text c={stock.change >= 0 ? C.darkGreen : C.red} size={13}>
                {stock.change >= 0 ? '+' : ''}
                {stock.change.toFixed(2)}% today
              </Text>
              <Block gap={0} my={15}>
                <TrendChart values={SERIES['1D']} height={140} />
              </Block>
              <Text c={C.muted} size={13}>
                Your position: {shares} {shares === 1 ? 'share' : 'shares'} · {money(shares * stock.price)}
              </Text>
              <Block
                onPress={() =>
                  setWatchlist((old) =>
                    old.includes(stock.ticker) ? old.filter((id) => id !== stock.ticker) : [...old, stock.ticker],
                  )
                }
                direction="row"
                align="center"
                gap={8}
                py={16}
              >
                <Icon
                  name="bookmark"
                  variant={watchlist.includes(stock.ticker) ? 'filled' : 'outlined'}
                  color={C.darkGreen}
                  size={20}
                />
                <Text c={C.darkGreen} fw="semibold">
                  {watchlist.includes(stock.ticker) ? 'Remove from watchlist' : 'Add to watchlist'}
                </Text>
              </Block>
              {ticket ? (
                <Block gap={11} pt={7} borderTopWidth={1} borderTopColor={C.line}>
                  <Text c={C.ink} fw="bold" size={18}>
                    {ticket} {stock.ticker}
                  </Text>
                  <Input
                    variant="outline"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                    placeholder="Number of shares"
                    mb={0}
                    radius={10}
                    inputColor={C.ink}
                  />
                  <Text c={C.muted} size={13}>
                    Estimated total: {Number.isFinite(total) ? money(total) : '—'}
                  </Text>
                  <Text c={C.muted} size={12}>
                    Available: {ticket === 'Buy' ? money(cash) : `${shares} shares`}
                  </Text>
                  <Button
                    title={`Confirm simulated ${ticket.toLowerCase()}`}
                    color={C.green}
                    disabled={!validOrder}
                    onPress={submitOrder}
                  />
                  <Button title="Cancel" variant="subtle" color={C.ink} onPress={() => setTicket(null)} />
                </Block>
              ) : (
                <Block direction="row" gap={10} mt={8}>
                  <Block gap={0} flex={1}>
                    <Button
                      title="Buy"
                      color={C.green}
                      fullWidth
                      onPress={() => {
                        setQuantity('1');
                        setTicket('Buy');
                      }}
                    />
                  </Block>
                  <Block gap={0} flex={1}>
                    <Button
                      title="Sell"
                      variant="outline"
                      color={C.darkGreen}
                      fullWidth
                      disabled={!shares}
                      onPress={() => {
                        setQuantity('1');
                        setTicket('Sell');
                      }}
                    />
                  </Block>
                </Block>
              )}
            </ScrollArea>
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
        <SproutfolioScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
