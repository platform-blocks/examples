import { useState } from 'react';
import { BulletChart, ComboChart, GroupedBarChart, RadialBarChart } from '@plocks/charts';
import { Badge, Block, Button, Dialog, IconButton, Progress, ScrollArea, SegmentedControl, Text } from '@plocks/ui';
import { AssetLogo } from '../components/AssetLogo';
import { AssetCard, SectionTitle, StatGrid, type Stat } from '../components/common';
import { PriceChart, type ChartMode } from '../components/PriceChart';
import { TradePanel, type Side } from '../components/TradePanel';
import {
  analystRatings,
  earnings,
  getHistory,
  keyStats,
  news,
  peopleAlsoOwn,
  RANGES,
  type Asset,
  type Position,
  type Range,
} from '../data';
import { C, compact, money, pct, price, quantity, signed, trend } from '../theme';

const RANGE_WORDS: Record<Range, string> = {
  '1D': 'Today',
  '1W': 'Past week',
  '1M': 'Past month',
  '3M': 'Past 3 months',
  '1Y': 'Past year',
  '5Y': 'Past 5 years',
};

export function AssetScreen({
  asset,
  position,
  cash,
  portfolioValue,
  watched,
  wide,
  onBack,
  onToggleWatch,
  onOpen,
  onOpenList,
  onTrade,
}: {
  asset: Asset;
  position?: Position;
  cash: number;
  portfolioValue: number;
  watched: boolean;
  wide: boolean;
  onBack: () => void;
  onToggleWatch: () => void;
  onOpen: (ticker: string) => void;
  onOpenList: (list: string) => void;
  onTrade: (side: Side, qty: number) => void;
}) {
  const [range, setRange] = useState<Range>('1D');
  const [mode, setMode] = useState<ChartMode>('line');
  const [ticket, setTicket] = useState<Side | null>(null);
  const crypto = asset.kind === 'crypto';
  const history = getHistory(asset, range);
  const move = history.end - history.start;
  const movePct = (move / history.start) * 100;
  const stats = keyStats(asset);
  const owned = position && position.qty > 0 ? position : undefined;
  const columns = wide ? 3 : 2;

  const header = (
    <Block
      gap={0}
      h={56}
      px={8}
      direction="row"
      align="center"
      justify="space-between"
      borderBottomWidth={1}
      borderBottomColor={C.line}
    >
      <IconButton
        icon="chevronLeft"
        variant="ghost"
        iconColor={C.ink}
        accessibilityLabel="Back to list"
        onPress={onBack}
      />
      <Text c={C.ink} fw="bold" size={15}>
        {asset.ticker}
      </Text>
      <IconButton
        icon="bookmark"
        iconVariant={watched ? 'filled' : 'outlined'}
        variant="ghost"
        iconColor={C.darkGreen}
        accessibilityLabel={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        onPress={onToggleWatch}
      />
    </Block>
  );

  const content = (
    <Block gap={0} w="100%" maw={760}>
      <Block gap={12} pt={22} direction="row" align="center">
        <AssetLogo asset={asset} size={48} />
        <Block gap={0} flex={1}>
          <Text c={C.ink} fw="bold" size={24} numberOfLines={1}>
            {asset.name}
          </Text>
          <Text c={C.muted} size={13}>
            {asset.ticker} · {crypto ? 'Cryptocurrency' : asset.sector}
          </Text>
        </Block>
      </Block>
      <Text c={C.ink} fw="bold" size={36} mt={16}>
        {price(asset.price)}
      </Text>
      <Text c={trend(move)} fw="semibold" size={14}>
        {signed(move)} ({pct(movePct)}) {RANGE_WORDS[range]}
      </Text>
      {range !== '1D' && (
        <Text c={trend(asset.change)} size={12} mt={2}>
          {pct(asset.change)} {crypto ? 'past 24 hours' : 'today'}
        </Text>
      )}

      <Block gap={0} mt={18}>
        <PriceChart history={history} range={range} mode={mode} label={asset.name} height={wide ? 280 : 230} />
      </Block>
      <Block gap={10} mt={10} direction="row" align="center">
        <Block gap={0} flex={1}>
          <SegmentedControl
            data={RANGES}
            value={range}
            onChange={(value) => setRange(value as Range)}
            color={trend(move)}
            variant="ghost"
            size="sm"
            fullWidth
            accessibilityLabel="Chart time range"
          />
        </Block>
        <SegmentedControl
          data={[
            { value: 'line', label: 'Line' },
            { value: 'candles', label: 'Candles' },
          ]}
          value={mode}
          onChange={(value) => setMode(value as ChartMode)}
          size="sm"
          color={C.ink}
          accessibilityLabel="Chart style"
        />
      </Block>

      {owned && (
        <PositionSection asset={asset} position={owned} prevClose={stats.prevClose} portfolioValue={portfolioValue} />
      )}

      <SectionTitle>About</SectionTitle>
      <Text c={C.ink} size={14} lh={21}>
        {asset.about}
      </Text>
      <StatGrid
        columns={wide && !crypto ? 4 : columns}
        stats={
          crypto
            ? [
                { label: 'Launched', value: String(asset.launched) },
                { label: 'Consensus', value: asset.consensus ?? '—' },
                { label: 'Category', value: asset.lists.join(', ') },
              ]
            : [
                { label: 'CEO', value: asset.ceo ?? '—' },
                { label: 'Employees', value: (asset.employees ?? 0).toLocaleString('en-US') },
                { label: 'Headquarters', value: asset.hq ?? '—' },
                { label: 'Founded', value: String(asset.founded) },
              ]
        }
      />

      <SectionTitle>Key statistics</SectionTitle>
      <StatGrid columns={columns} stats={crypto ? cryptoStats(asset, stats) : stockStats(asset, stats)} />
      <Text c={C.muted} fw="semibold" size={12} mt={20} mb={8}>
        52-WEEK RANGE
      </Text>
      <BulletChart
        h={wide ? 70 : 64}
        min={stats.low52}
        max={stats.high52}
        value={asset.price}
        target={owned && owned.avgCost >= stats.low52 && owned.avgCost <= stats.high52 ? owned.avgCost : undefined}
        ranges={[{ value: stats.high52, color: C.pale, label: '52-week range' }]}
        color={C.green}
        targetColor={C.ink}
        barThickness={0.4}
        withAxis
        ticks={4}
        valueFormatter={(value) => money(value, value >= 1000 ? 0 : 2)}
        accessibilityLabel={`52-week range ${money(stats.low52)} to ${money(stats.high52)}, now ${money(asset.price)}`}
      />
      <Text c={C.muted} size={12} mt={4}>
        Bar shows today's price
        {owned && owned.avgCost >= stats.low52 && owned.avgCost <= stats.high52 ? '; tick marks your average cost' : ''}
        .
      </Text>
      {crypto && <SupplySection asset={asset} />}

      {!crypto && <RatingsSection asset={asset} />}
      {!crypto && <EarningsSection asset={asset} wide={wide} />}

      <SectionTitle>News</SectionTitle>
      {news(asset).map((item) => (
        <Block key={item.id} gap={4} py={13} borderBottomWidth={1} borderBottomColor={C.line}>
          <Text c={C.muted} fw="semibold" size={12}>
            {item.source} · {item.age}
          </Text>
          <Text c={C.ink} fw="semibold" size={15} lh={21}>
            {item.title}
          </Text>
          <Text c={trend(item.move)} size={12}>
            {asset.ticker} {pct(item.move)}
          </Text>
        </Block>
      ))}

      <SectionTitle>People also own</SectionTitle>
      <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ direction: 'row', gap: 10, pb: 4 }}>
        {peopleAlsoOwn(asset).map((other) => (
          <AssetCard key={other.ticker} asset={other} onPress={() => onOpen(other.ticker)} />
        ))}
      </ScrollArea>

      <SectionTitle>Related lists</SectionTitle>
      <Block gap={8} direction="row" wrap>
        {asset.lists.map((list) => (
          <Badge key={list} color={C.darkGreen} variant="light" size="lg" onPress={() => onOpenList(list)}>
            {list}
          </Badge>
        ))}
      </Block>
      <Text c={C.muted} size={11} mt={30}>
        Sample data for a UI demo. Prices, statistics, ratings, and headlines are generated locally and are not real
        market information.
      </Text>
    </Block>
  );

  return (
    <Block gap={0} flex={1}>
      {header}
      <Block gap={0} flex={1} direction="row">
        <ScrollArea key={asset.ticker} flex={1} contentProps={{ align: 'center', px: 20, pb: 40 }}>
          {content}
        </ScrollArea>
        {wide && (
          <Block gap={0} w={300} p={18} borderLeftWidth={1} borderLeftColor={C.line}>
            <TradePanel key={asset.ticker} asset={asset} position={position} cash={cash} onSubmit={onTrade} />
          </Block>
        )}
      </Block>
      {!wide && (
        <Block
          gap={12}
          px={18}
          py={12}
          direction="row"
          align="center"
          borderTopWidth={1}
          borderTopColor={C.line}
          bg={C.white}
        >
          <Block gap={0} flex={1}>
            <Text c={C.muted} size={11}>
              {owned ? 'Your position' : 'Buying power'}
            </Text>
            <Text c={C.ink} fw="bold" size={15}>
              {owned ? money(owned.qty * asset.price) : money(cash)}
            </Text>
          </Block>
          {!!owned && <Button title="Sell" variant="outline" color={C.red} onPress={() => setTicket('Sell')} />}
          <Button title="Buy" color={C.green} onPress={() => setTicket('Buy')} />
        </Block>
      )}
      {!wide && !!ticket && (
        <Dialog
          opened
          variant="bottomsheet"
          accessibilityLabel={`${ticket} ${asset.ticker}`}
          onClose={() => setTicket(null)}
        >
          <Block gap={0} p={20}>
            <TradePanel
              asset={asset}
              position={position}
              cash={cash}
              initialSide={ticket}
              onSubmit={(side, qty) => {
                onTrade(side, qty);
                setTicket(null);
              }}
              onCancel={() => setTicket(null)}
            />
          </Block>
        </Dialog>
      )}
    </Block>
  );
}

function stockStats(asset: Asset, stats: ReturnType<typeof keyStats>): Stat[] {
  return [
    { label: 'Market cap', value: compact(stats.marketCap) },
    { label: 'P/E ratio', value: asset.pe ? asset.pe.toFixed(2) : '—' },
    { label: 'Dividend yield', value: asset.dividendYield ? `${asset.dividendYield.toFixed(2)}%` : '—' },
    { label: 'Average volume', value: compact(stats.avgVolume) },
    { label: 'Volume', value: compact(stats.volume) },
    { label: 'Open', value: money(stats.open) },
    { label: "Today's high", value: money(stats.high) },
    { label: "Today's low", value: money(stats.low) },
    { label: '52-week high', value: money(stats.high52) },
    { label: '52-week low', value: money(stats.low52) },
    { label: 'Previous close', value: money(stats.prevClose) },
    { label: 'Shares outstanding', value: compact((asset.sharesOut ?? 0) * 1e9) },
  ];
}

function cryptoStats(asset: Asset, stats: ReturnType<typeof keyStats>): Stat[] {
  return [
    { label: 'Market cap', value: compact(stats.marketCap) },
    { label: 'Volume (24h)', value: compact(stats.volume) },
    { label: 'Avg volume (30d)', value: compact(stats.avgVolume) },
    { label: 'Circulating supply', value: `${compact(asset.circulating ?? 0)} ${asset.ticker}` },
    { label: 'Max supply', value: asset.maxSupply ? `${compact(asset.maxSupply)} ${asset.ticker}` : 'No cap' },
    { label: 'Fully diluted value', value: asset.maxSupply ? compact(asset.maxSupply * asset.price) : '—' },
    { label: '24h high', value: money(stats.high) },
    { label: '24h low', value: money(stats.low) },
    { label: '24h open', value: money(stats.open) },
    { label: '52-week high', value: money(stats.high52) },
    { label: '52-week low', value: money(stats.low52) },
    { label: 'Trading', value: '24/7' },
  ];
}

function PositionSection({
  asset,
  position,
  prevClose,
  portfolioValue,
}: {
  asset: Asset;
  position: Position;
  prevClose: number;
  portfolioValue: number;
}) {
  const value = position.qty * asset.price;
  const cost = position.qty * position.avgCost;
  const today = position.qty * (asset.price - prevClose);
  const total = value - cost;
  const rows = [
    {
      label: "Today's return",
      value: `${signed(today)} (${pct((asset.price / prevClose - 1) * 100)})`,
      color: trend(today),
    },
    { label: 'Total return', value: `${signed(total)} (${pct((total / cost) * 100)})`, color: trend(total) },
  ];
  return (
    <>
      <SectionTitle>Your position</SectionTitle>
      <Block gap={0} bg={C.panel} radius={16} p={16}>
        <Block gap={0} direction="row">
          <Block gap={2} flex={1}>
            <Text c={C.muted} size={12}>
              {asset.kind === 'crypto' ? 'Quantity' : 'Shares'}
            </Text>
            <Text c={C.ink} fw="bold" size={20}>
              {quantity(position.qty)}
            </Text>
          </Block>
          <Block gap={2} flex={1}>
            <Text c={C.muted} size={12}>
              Market value
            </Text>
            <Text c={C.ink} fw="bold" size={20}>
              {money(value)}
            </Text>
          </Block>
        </Block>
        <Block gap={0} direction="row" mt={14}>
          <Block gap={2} flex={1}>
            <Text c={C.muted} size={12}>
              Average cost
            </Text>
            <Text c={C.ink} fw="semibold" size={15}>
              {price(position.avgCost)}
            </Text>
          </Block>
          <Block gap={2} flex={1}>
            <Text c={C.muted} size={12}>
              Portfolio diversity
            </Text>
            <Text c={C.ink} fw="semibold" size={15}>
              {((value / portfolioValue) * 100).toFixed(2)}%
            </Text>
          </Block>
        </Block>
        {rows.map((row) => (
          <Block
            key={row.label}
            gap={0}
            direction="row"
            justify="space-between"
            mt={14}
            pt={12}
            borderTopWidth={1}
            borderTopColor={C.line}
          >
            <Text c={C.muted} size={13}>
              {row.label}
            </Text>
            <Text c={row.color} fw="semibold" size={13}>
              {row.value}
            </Text>
          </Block>
        ))}
      </Block>
    </>
  );
}

function SupplySection({ asset }: { asset: Asset }) {
  const circulating = asset.circulating ?? 0;
  return (
    <>
      <SectionTitle>Supply</SectionTitle>
      {asset.maxSupply ? (
        <Block gap={8}>
          <Progress value={(circulating / asset.maxSupply) * 100} color={asset.color} size={10} radius="xl" />
          <Text c={C.muted} size={13}>
            {((circulating / asset.maxSupply) * 100).toFixed(1)}% of the {compact(asset.maxSupply)} {asset.ticker} cap
            is in circulation. {compact(asset.maxSupply - circulating)} {asset.ticker} remain to be issued.
          </Text>
        </Block>
      ) : (
        <Text c={C.muted} size={13}>
          {asset.name} has no fixed maximum supply. {compact(circulating)} {asset.ticker} are in circulation, with new
          issuance paid to validators.
        </Text>
      )}
    </>
  );
}

function RatingsSection({ asset }: { asset: Asset }) {
  const ratings = analystRatings(asset);
  const total = ratings.buy + ratings.hold + ratings.sell;
  const share = (count: number) => Math.round((count / total) * 100);
  return (
    <>
      <SectionTitle>Analyst ratings</SectionTitle>
      <Block gap={16} direction="row" align="center" wrap>
        <Block gap={0} w={170} h={170}>
          <RadialBarChart
            w={170}
            h={170}
            data={[{ value: share(ratings.buy), max: 100, label: 'Buy', color: C.green, trackColor: C.pale }]}
            barThickness={12}
            showValueLabels={false}
            centerLabel={`${share(ratings.buy)}%`}
            centerSubLabel="Buy"
            accessibilityLabel={`${share(ratings.buy)} percent of ${total} analysts rate ${asset.ticker} a buy`}
          />
        </Block>
        <Block gap={10} flex={1} miw={200}>
          {[
            { label: 'Buy', count: ratings.buy, color: C.green },
            { label: 'Hold', count: ratings.hold, color: '#9AA6A3' },
            { label: 'Sell', count: ratings.sell, color: C.red },
          ].map((row) => (
            <Block key={row.label} gap={10} direction="row" align="center">
              <Text c={C.ink} fw="semibold" size={13} w={36}>
                {row.label}
              </Text>
              <Block gap={0} flex={1}>
                <Progress value={share(row.count)} color={row.color} size={10} radius="xl" />
              </Block>
              <Text c={C.ink} fw="semibold" size={13} ta="right" w={40}>
                {share(row.count)}%
              </Text>
            </Block>
          ))}
          <Text c={C.muted} size={12}>
            Based on {total} sample analyst ratings
          </Text>
        </Block>
      </Block>
      <Text c={C.muted} fw="semibold" size={12} mt={20} mb={4}>
        12-MONTH PRICE TARGETS
      </Text>
      <BulletChart
        h={64}
        min={Math.floor(Math.min(ratings.targetLow, asset.price) * 0.97)}
        max={Math.ceil(ratings.targetHigh * 1.02)}
        value={asset.price}
        target={ratings.targetAvg}
        ranges={[
          { value: ratings.targetLow, color: '#F2F5F4', label: 'Below low target' },
          { value: ratings.targetHigh, color: C.pale, label: 'Analyst target range' },
          { value: Math.ceil(ratings.targetHigh * 1.02), color: '#F2F5F4', label: 'Above high target' },
        ]}
        color={C.ink}
        targetColor={C.green}
        barThickness={0.4}
        withAxis
        ticks={4}
        valueFormatter={(value) => money(value, 0)}
        accessibilityLabel={`Price targets from ${money(ratings.targetLow)} to ${money(ratings.targetHigh)}, average ${money(ratings.targetAvg)}`}
      />
      <Text c={C.muted} size={12} mt={4}>
        Bar shows today's price ({money(asset.price, 0)}); green tick is the average target (
        {money(ratings.targetAvg, 0)}), shaded band spans low to high targets.
      </Text>
    </>
  );
}

function EarningsSection({ asset, wide }: { asset: Asset; wide: boolean }) {
  const { quarters, next } = earnings(asset);
  const beats = quarters.filter((quarter) => quarter.actual >= quarter.estimate).length;
  return (
    <>
      <SectionTitle>Earnings</SectionTitle>
      <GroupedBarChart
        h={210}
        series={[
          {
            id: 'estimate',
            name: 'Estimated EPS',
            color: '#B6C2BF',
            data: quarters.map((q) => ({ category: q.label, value: round(q.estimate) })),
          },
          {
            id: 'actual',
            name: 'Actual EPS',
            color: C.green,
            data: quarters.map((q) => ({ category: q.label, value: round(q.actual) })),
          },
        ]}
        legend={{ show: true, position: 'bottom' }}
        yAxis={{ show: true, labelFormatter: (value) => `$${value.toFixed(2)}`, labelColor: C.muted }}
        xAxis={{ show: true, labelColor: C.muted }}
        grid={{ show: true, color: C.line }}
        liveTooltip
        accessibilityLabel={`${asset.ticker} estimated versus actual earnings per share for the last four quarters`}
      />
      <Text c={C.muted} size={13} mt={6}>
        Beat estimates in {beats} of the last 4 quarters. {next.label} report expected {next.date} · est. EPS{' '}
        {money(next.estimate)}.
      </Text>

      <Text c={C.ink} fw="bold" size={17} mt={26} mb={6}>
        Revenue and net margin
      </Text>
      <ComboChart
        h={wide ? 220 : 200}
        layers={[
          {
            type: 'bar',
            id: 'revenue',
            name: 'Revenue',
            color: '#2F7DD3',
            data: quarters.map((q, x) => ({ x, y: q.revenue })),
          },
          {
            type: 'line',
            id: 'margin',
            name: 'Net margin',
            color: C.amber,
            targetAxis: 'right',
            showPoints: true,
            data: quarters.map((q, x) => ({ x, y: Math.round(q.margin * 10) / 10 })),
          },
        ]}
        xDomain={[-0.6, quarters.length - 0.4]}
        yDomain={[0, Math.max(...quarters.map((q) => q.revenue)) * 1.15]}
        yDomainRight={[
          Math.min(0, ...quarters.map((q) => q.margin)) * 1.3,
          Math.max(5, ...quarters.map((q) => q.margin)) * 1.5,
        ]}
        xAxis={{
          show: true,
          ticks: quarters.map((_, x) => x),
          labelFormatter: (x) => quarters[Math.round(x)]?.label ?? '',
          labelColor: C.muted,
        }}
        yAxis={{ show: true, labelFormatter: (value) => `$${compact(value)}`, labelColor: C.muted }}
        yAxisRight={{ show: true, labelFormatter: (value) => `${value.toFixed(0)}%`, labelColor: C.muted }}
        grid={{ show: true, color: C.line }}
        legend={{ show: true, position: 'bottom' }}
        multiTooltip
        accessibilityLabel={`${asset.ticker} quarterly revenue and net margin`}
      />
    </>
  );
}

const round = (value: number) => Math.round(value * 100) / 100;
