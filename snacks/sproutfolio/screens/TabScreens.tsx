import { useState } from 'react';
import { BarChart, DonutChart, HeatmapChart, WaffleChart } from '@plocks/charts';
import { Badge, Block, Icon, Input, ScrollArea, SegmentedControl, Text } from '@plocks/ui-snack';
import { AssetLogo } from '../components/AssetLogo';
import { AssetCard, AssetRow, ChangeText, SectionTitle } from '../components/common';
import { PortfolioChart } from '../components/PriceChart';
import {
  ASSETS,
  CRYPTO,
  DIVIDENDS,
  getHistory,
  INDEXES,
  LISTS,
  RANGES,
  SECTOR_PERIODS,
  SECTOR_RETURNS,
  SECTORS,
  STOCKS,
  type Asset,
  type Position,
  type Range,
} from '../data';
import { C, compact, money, pct, quantity, signed, SLICE_COLORS, trend } from '../theme';

export type Activity = { id: string; side: 'Buy' | 'Sell'; ticker: string; qty: number; total: number };

interface PortfolioProps {
  positions: Record<string, Position>;
  cash: number;
  onOpen: (ticker: string) => void;
}

const heldValue = (asset: Asset, positions: Record<string, Position>) =>
  (positions[asset.ticker]?.qty ?? 0) * asset.price;
const holdingDetail = (asset: Asset, position: Position) =>
  `${quantity(position.qty)} ${asset.kind === 'crypto' ? asset.ticker : position.qty === 1 ? 'share' : 'shares'}`;

export function HomeScreen({
  positions,
  cash,
  watchlist,
  onOpen,
  wide,
}: PortfolioProps & { watchlist: string[]; wide: boolean }) {
  const [range, setRange] = useState<Range>('1D');
  const held = ASSETS.filter((asset) => (positions[asset.ticker]?.qty ?? 0) > 0);
  const reference = getHistory(STOCKS[0], range).points;
  const labels = reference.map((point) => point.label);
  const values = reference.map(
    (_, i) =>
      cash + held.reduce((sum, asset) => sum + positions[asset.ticker].qty * getHistory(asset, range).points[i].y, 0),
  );
  const total = values[values.length - 1];
  const move = total - values[0];
  const slices = [
    ...held
      .map((asset) => ({ label: asset.ticker, value: heldValue(asset, positions) }))
      .sort((a, b) => b.value - a.value),
    { label: 'Cash', value: cash },
  ].map((slice, i) => ({
    ...slice,
    value: Math.round(slice.value * 100) / 100,
    color: SLICE_COLORS[Math.min(i, SLICE_COLORS.length - 1)],
  }));
  const stocksHeld = held.filter((asset) => asset.kind === 'stock');
  const cryptoHeld = held.filter((asset) => asset.kind === 'crypto');
  const stockValue = stocksHeld.reduce((sum, asset) => sum + heldValue(asset, positions), 0);
  const cryptoValue = cryptoHeld.reduce((sum, asset) => sum + heldValue(asset, positions), 0);
  const movers = [...STOCKS].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);

  return (
    <Block gap={0}>
      <Block gap={0} pt={26}>
        <Text c={C.muted} fw="semibold" size={13}>
          Investing
        </Text>
        <Text c={C.ink} fw="bold" size={38} mt={2}>
          {money(total)}
        </Text>
        <Text c={trend(move)} fw="semibold" size={13}>
          {signed(move)} ({pct((move / values[0]) * 100)}) {range === '1D' ? 'today' : `past ${range}`}
        </Text>
      </Block>
      <Block gap={0} my={18}>
        <PortfolioChart values={values} labels={labels} height={wide ? 240 : 190} />
      </Block>
      <SegmentedControl
        data={RANGES}
        value={range}
        onChange={(value) => setRange(value as Range)}
        color={trend(move)}
        variant="ghost"
        size="sm"
        fullWidth
        accessibilityLabel="Portfolio time range"
      />
      <Block gap={0} bg={C.panel} radius={15} p={17} mt={20} direction="row" justify="space-between" align="center">
        <Block gap={0}>
          <Text c={C.muted} size={12}>
            Buying power
          </Text>
          <Text c={C.ink} fw="bold" size={20}>
            {money(cash)}
          </Text>
        </Block>
        <Icon name="chevronRight" color={C.muted} size={20} />
      </Block>
      <Block gap={10} direction="row" mt={14}>
        {INDEXES.map((index) => (
          <Block key={index.name} gap={2} flex={1} p={12} radius={12} borderWidth={1} borderColor={C.line}>
            <Text c={C.muted} size={11} numberOfLines={1}>
              {index.name}
            </Text>
            <Text c={C.ink} fw="semibold" size={13} numberOfLines={1}>
              {index.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
            <ChangeText value={index.change} size={11} />
          </Block>
        ))}
      </Block>

      <SectionTitle>Stocks</SectionTitle>
      {stocksHeld.map((asset) => (
        <AssetRow
          key={asset.ticker}
          asset={asset}
          detail={holdingDetail(asset, positions[asset.ticker])}
          onPress={() => onOpen(asset.ticker)}
        />
      ))}
      {!stocksHeld.length && <Text c={C.muted}>No stocks yet.</Text>}

      <SectionTitle>Crypto</SectionTitle>
      {cryptoHeld.map((asset) => (
        <AssetRow
          key={asset.ticker}
          asset={asset}
          detail={holdingDetail(asset, positions[asset.ticker])}
          onPress={() => onOpen(asset.ticker)}
        />
      ))}
      {!cryptoHeld.length && <Text c={C.muted}>No crypto yet.</Text>}

      <SectionTitle>Allocation</SectionTitle>
      <Block gap={20} direction={wide ? 'row' : 'column'} align="center">
        <Block gap={0} w={220} h={220}>
          <DonutChart
            size={220}
            w={220}
            h={220}
            padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
            data={slices}
            innerRadiusRatio={0.68}
            padAngle={1.2}
            centerLabel={(_, __, focused) => focused?.label ?? 'Total'}
            centerValueFormatter={(value) => `$${compact(value)}`}
            legend={{ show: false }}
            accessibilityLabel="Portfolio allocation by holding"
          />
        </Block>
        <Block gap={0} flex={wide ? 1 : undefined} w={wide ? undefined : '100%'}>
          {slices.map((slice) => (
            <Block
              key={slice.label}
              gap={10}
              direction="row"
              align="center"
              py={7}
              borderBottomWidth={1}
              borderBottomColor={C.line}
            >
              <Block gap={0} w={10} h={10} radius={5} bg={slice.color} />
              <Text c={C.ink} fw="semibold" size={13} flex={1}>
                {slice.label}
              </Text>
              <Text c={C.muted} size={13}>
                {money(slice.value)}
              </Text>
              <Text c={C.ink} fw="semibold" size={13} ta="right" w={52}>
                {((slice.value / total) * 100).toFixed(1)}%
              </Text>
            </Block>
          ))}
        </Block>
      </Block>
      <Text c={C.muted} fw="semibold" size={12} mt={22} mb={8}>
        ASSET MIX · EACH SQUARE IS 1% OF YOUR PORTFOLIO
      </Text>
      <WaffleChart
        h={wide ? 170 : 150}
        maw={wide ? 360 : undefined}
        rows={5}
        columns={20}
        gap={3}
        cellRadius={3}
        data={[
          { name: 'Stocks', value: stockValue, color: SLICE_COLORS[0] },
          { name: 'Crypto', value: cryptoValue, color: SLICE_COLORS[3] },
          { name: 'Cash', value: cash, color: SLICE_COLORS[8] },
        ]}
        legend={{ show: true, position: 'bottom' }}
        accessibilityLabel={`Asset mix: stocks ${Math.round((stockValue / total) * 100)}%, crypto ${Math.round((cryptoValue / total) * 100)}%, cash ${Math.round((cash / total) * 100)}%`}
      />

      <SectionTitle>Top movers</SectionTitle>
      <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ direction: 'row', gap: 10, pb: 4 }}>
        {movers.map((asset) => (
          <AssetCard key={asset.ticker} asset={asset} onPress={() => onOpen(asset.ticker)} />
        ))}
      </ScrollArea>

      <SectionTitle>Watchlist</SectionTitle>
      {watchlist.length ? (
        ASSETS.filter((asset) => watchlist.includes(asset.ticker)).map((asset) => (
          <AssetRow key={asset.ticker} asset={asset} onPress={() => onOpen(asset.ticker)} />
        ))
      ) : (
        <Text c={C.muted}>Open a stock or coin and tap the bookmark to add it here.</Text>
      )}
    </Block>
  );
}

export function SearchScreen({
  query,
  setQuery,
  onOpen,
  wide,
}: {
  query: string;
  setQuery: (value: string) => void;
  onOpen: (ticker: string) => void;
  wide: boolean;
}) {
  const term = query.trim().toLowerCase();
  const results = ASSETS.filter((asset) =>
    `${asset.ticker} ${asset.name} ${asset.sector} ${asset.lists.join(' ')}`.toLowerCase().includes(term),
  );
  return (
    <Block gap={0} pt={24}>
      <Text c={C.ink} fw="bold" size={26}>
        Search
      </Text>
      <Input
        variant="filled"
        value={query}
        onChangeText={setQuery}
        placeholder="Search stocks, crypto, and lists"
        radius={12}
        mt={18}
        mb={14}
        inputColor={C.ink}
        inputFontSize={15}
        clearable
      />
      <Block gap={8} direction="row" wrap mb={8}>
        {LISTS.map((list) => (
          <Badge
            key={list}
            color={C.darkGreen}
            variant={query === list ? 'filled' : 'light'}
            size="lg"
            onPress={() => setQuery(query === list ? '' : list)}
          >
            {list}
          </Badge>
        ))}
      </Block>
      {term ? (
        <>
          <Text c={C.muted} fw="bold" size={12} mt={14}>
            {results.length} RESULTS
          </Text>
          {results.map((asset) => (
            <AssetRow key={asset.ticker} asset={asset} onPress={() => onOpen(asset.ticker)} />
          ))}
        </>
      ) : (
        <>
          <SectionTitle>Sector performance</SectionTitle>
          <HeatmapChart
            h={wide ? 400 : 360}
            data={{ rows: SECTORS, cols: SECTOR_PERIODS, values: SECTOR_RETURNS }}
            gap={3}
            cellCornerRadius={4}
            colorScale={{ type: 'diverging', colors: [C.red, '#F3F5F4', C.green], midpoint: 0, domain: [-12, 12] }}
            showCellLabels
            valueFormatter={({ value }) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`}
            xAxis={{ show: true, labelColor: C.muted }}
            yAxis={{ show: true, labelColor: C.ink }}
            grid={{ show: false }}
            legend={{ show: false }}
            tooltip={{ show: true }}
            accessibilityLabel="Sample sector returns by period, in percent"
          />
          <Text c={C.muted} size={12} mt={4}>
            Percent change by sector and period (sample data)
          </Text>
          <SectionTitle>Stocks</SectionTitle>
          {STOCKS.map((asset) => (
            <AssetRow key={asset.ticker} asset={asset} onPress={() => onOpen(asset.ticker)} />
          ))}
          <SectionTitle>Crypto</SectionTitle>
          {CRYPTO.map((asset) => (
            <AssetRow key={asset.ticker} asset={asset} onPress={() => onOpen(asset.ticker)} />
          ))}
        </>
      )}
    </Block>
  );
}

export function WatchlistScreen({ watchlist, onOpen }: { watchlist: string[]; onOpen: (ticker: string) => void }) {
  return (
    <Block gap={0} pt={24}>
      <Text c={C.ink} fw="bold" size={26}>
        Watchlist
      </Text>
      <Text c={C.muted} size={13} mt={5} mb={14}>
        Keep an eye on what interests you.
      </Text>
      {watchlist.length ? (
        ASSETS.filter((asset) => watchlist.includes(asset.ticker)).map((asset) => (
          <AssetRow key={asset.ticker} asset={asset} onPress={() => onOpen(asset.ticker)} />
        ))
      ) : (
        <Text c={C.muted}>Open a stock or coin and tap the bookmark to add it here.</Text>
      )}
    </Block>
  );
}

export function AccountScreen({ positions, cash, activity, onOpen }: PortfolioProps & { activity: Activity[] }) {
  const equity = ASSETS.reduce((sum, asset) => sum + heldValue(asset, positions), 0);
  const cost = ASSETS.reduce(
    (sum, asset) => sum + (positions[asset.ticker]?.qty ?? 0) * (positions[asset.ticker]?.avgCost ?? 0),
    0,
  );
  const dividendTotal = DIVIDENDS.reduce((sum, item) => sum + item.value, 0);
  return (
    <Block gap={0} pt={24}>
      <Text c={C.ink} fw="bold" size={26}>
        Account
      </Text>
      <Block bg={C.panel} radius={16} p={18} mt={20} gap={8}>
        <Text c={C.muted} size={12}>
          Demo account
        </Text>
        <Text c={C.ink} fw="bold" size={24}>
          {money(cash + equity)}
        </Text>
        <Text c={C.muted} size={13}>
          Invested {money(equity)} · Cash {money(cash)}
        </Text>
        <Text c={trend(equity - cost)} fw="semibold" size={13}>
          Total return {signed(equity - cost)} ({pct(cost ? ((equity - cost) / cost) * 100 : 0)})
        </Text>
      </Block>

      <SectionTitle>Dividend income</SectionTitle>
      <Text c={C.muted} size={13} mb={8}>
        {money(dividendTotal)} received over the past 12 months
      </Text>
      <BarChart
        h={190}
        data={DIVIDENDS}
        barColor={C.green}
        barBorderRadius={4}
        xAxis={{ show: true, labelColor: C.muted }}
        yAxis={{ show: true, labelFormatter: (value) => `$${value.toFixed(0)}`, labelColor: C.muted }}
        grid={{ show: true, color: C.line }}
        tooltip={{ show: true, formatter: (datum) => `${datum.category}: ${money(datum.value)}` }}
        accessibilityLabel="Monthly dividend income, sample data"
      />

      <SectionTitle>Recent activity</SectionTitle>
      {activity.length ? (
        activity.map((item) => {
          const asset = ASSETS.find((candidate) => candidate.ticker === item.ticker);
          return (
            <Block
              key={item.id}
              gap={12}
              direction="row"
              align="center"
              py={12}
              borderBottomWidth={1}
              borderBottomColor={C.line}
              onPress={asset ? () => onOpen(asset.ticker) : undefined}
            >
              {asset && <AssetLogo asset={asset} size={34} />}
              <Text c={C.ink} fw="semibold" flex={1}>
                {item.side} {quantity(item.qty)} {item.ticker}
              </Text>
              <Text c={C.muted}>{money(item.total)}</Text>
            </Block>
          );
        })
      ) : (
        <Text c={C.muted}>No trades yet. Open a stock or coin to try a simulated order.</Text>
      )}
      <Text c={C.muted} size={12} mt={30}>
        Educational UI example. Prices are fictional sample data ({compact(ASSETS.length)} assets) and no real orders
        are placed.
      </Text>
    </Block>
  );
}
