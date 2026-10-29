import { AreaChart, CandlestickChart, LineChart } from '@plocks/charts';
import { Block } from '@plocks/ui-snack';
import type { History, Range } from '../data';
import { C, money, price } from '../theme';

export type ChartMode = 'line' | 'candles';

/**
 * The stock-page price chart: a scrubbable line by default, OHLC candles on
 * request. Green or red follows the move over the selected range, and the
 * dashed baseline marks where the range opened (yesterday's close on 1D).
 */
export function PriceChart({
  history,
  range,
  mode,
  height = 240,
  label,
}: {
  history: History;
  range: Range;
  mode: ChartMode;
  height?: number;
  label: string;
}) {
  const up = history.end >= history.start;
  const color = up ? C.green : C.red;
  const baseline = { y: history.start, color: C.muted, dashed: true };
  return (
    <Block gap={0} w="100%" h={height}>
      {mode === 'line' ? (
        <LineChart
          key={`line-${range}`}
          data={history.points}
          h={height}
          lineColor={color}
          lineThickness={2.5}
          showPoints={false}
          xAxis={{ show: false }}
          yAxis={{ show: false }}
          grid={{ show: false }}
          referenceLines={[baseline]}
          enableCrosshair
          liveTooltip
          tooltip={{
            show: true,
            formatter: (point) => `${price(point.y)} · ${point.label ?? ''}`,
          }}
          accessibilityLabel={`${label} price over ${range}`}
        />
      ) : (
        <CandlestickChart
          key={`candles-${range}`}
          h={height}
          series={[
            {
              id: 'price',
              name: label,
              data: history.candles,
              colorBull: C.green,
              colorBear: C.red,
              wickColor: C.muted,
            },
          ]}
          xAxis={{ show: false }}
          yAxis={{ show: true, labelFormatter: (value) => money(value, value >= 1000 ? 0 : 2), labelColor: C.muted }}
          grid={{ show: true, color: C.line }}
          enableCrosshair
          liveTooltip
          tooltip={{
            show: true,
            formatter: (candle) =>
              `O ${price(candle.open)}  H ${price(candle.high)}  L ${price(candle.low)}  C ${price(candle.close)}`,
          }}
          accessibilityLabel={`${label} candlestick chart over ${range}`}
        />
      )}
    </Block>
  );
}

/** Portfolio value over time, as a filled area. */
export function PortfolioChart({
  values,
  labels,
  height = 200,
}: {
  values: number[];
  labels: string[];
  height?: number;
}) {
  const up = values[values.length - 1] >= values[0];
  const color = up ? C.green : C.red;
  return (
    <Block gap={0} w="100%" h={height}>
      <AreaChart
        data={values.map((y, x) => ({ x, y, label: labels[x] }))}
        h={height}
        lineColor={color}
        lineThickness={2.5}
        fillColor={color}
        fillOpacity={0.24}
        showPoints={false}
        xAxis={{ show: false }}
        yAxis={{ show: false }}
        grid={{ show: false }}
        referenceLines={[{ y: values[0], color: C.muted, dashed: true }]}
        enableCrosshair
        liveTooltip
        tooltip={{ show: true, formatter: (point) => `${money(point.y)} · ${point.label ?? ''}` }}
        accessibilityLabel="Portfolio value chart"
      />
    </Block>
  );
}
