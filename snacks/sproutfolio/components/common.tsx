import type { ReactNode } from 'react';
import { SparklineChart } from '@plocks/charts';
import { Block, Text } from '@plocks/ui-snack';
import { sparkline, type Asset } from '../data';
import { C, pct, price, trend } from '../theme';
import { AssetLogo } from './AssetLogo';

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Block gap={0} direction="row" justify="space-between" align="center" mt={34} mb={10}>
      <Text c={C.ink} fw="bold" size={21}>
        {children}
      </Text>
      {action}
    </Block>
  );
}

export interface Stat {
  label: string;
  value: string;
}

/** Label-over-value pairs, two per row on phones and four on wide screens. */
export function StatGrid({ stats, columns = 2 }: { stats: Stat[]; columns?: number }) {
  return (
    <Block gap={0} direction="row" wrap>
      {stats.map((stat) => (
        <Block
          key={stat.label}
          gap={2}
          w={`${100 / columns}%`}
          py={11}
          pr={12}
          borderBottomWidth={1}
          borderBottomColor={C.line}
        >
          <Text c={C.muted} size={12}>
            {stat.label}
          </Text>
          <Text c={C.ink} fw="semibold" size={15} numberOfLines={1}>
            {stat.value}
          </Text>
        </Block>
      ))}
    </Block>
  );
}

export function ChangeText({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <Text c={trend(value)} fw="semibold" size={size}>
      {value >= 0 ? '▲' : '▼'} {pct(Math.abs(value)).replace('+', '')}
    </Text>
  );
}

/** A list row: logo, ticker, intraday sparkline, price and change. */
export function AssetRow({ asset, detail, onPress }: { asset: Asset; detail?: string; onPress: () => void }) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${asset.name}`}
      direction="row"
      align="center"
      gap={12}
      py={12}
      borderBottomWidth={1}
      borderBottomColor={C.line}
    >
      <AssetLogo asset={asset} />
      <Block gap={0} flex={1}>
        <Text c={C.ink} fw="bold" size={15}>
          {asset.ticker}
        </Text>
        <Text c={C.muted} size={12} numberOfLines={1}>
          {detail ?? asset.name}
        </Text>
      </Block>
      <Block gap={0} w={76} h={34}>
        <SparklineChart
          data={sparkline(asset)}
          w={76}
          h={34}
          color={trend(asset.change)}
          strokeWidth={1.6}
          animation={{ enabled: false }}
          accessibilityLabel={`${asset.ticker} intraday trend`}
        />
      </Block>
      <Block gap={0} align="flex-end" miw={86}>
        <Text c={C.ink} fw="semibold" size={14}>
          {price(asset.price)}
        </Text>
        <ChangeText value={asset.change} />
      </Block>
    </Block>
  );
}

/** Compact card for horizontal strips such as movers and "people also own". */
export function AssetCard({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${asset.name}`}
      w={148}
      p={14}
      gap={8}
      radius={16}
      borderWidth={1}
      borderColor={C.line}
      bg={C.white}
    >
      <Block gap={0} direction="row" justify="space-between" align="center">
        <AssetLogo asset={asset} size={34} />
        <ChangeText value={asset.change} />
      </Block>
      <Block gap={0}>
        <Text c={C.ink} fw="bold" size={15}>
          {asset.ticker}
        </Text>
        <Text c={C.muted} size={12} numberOfLines={1}>
          {asset.name}
        </Text>
      </Block>
      <SparklineChart
        data={sparkline(asset)}
        w={118}
        h={30}
        color={trend(asset.change)}
        fill
        fillOpacity={0.12}
        strokeWidth={1.5}
        animation={{ enabled: false }}
        accessibilityLabel={`${asset.ticker} intraday trend`}
      />
      <Text c={C.ink} fw="semibold" size={14}>
        {price(asset.price)}
      </Text>
    </Block>
  );
}
