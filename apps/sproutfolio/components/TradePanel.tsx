import { useState } from 'react';
import { Block, Button, Input, SegmentedControl, Text } from '@plocks/ui';
import type { Asset, Position } from '../data';
import { C, money, quantity } from '../theme';

export type Side = 'Buy' | 'Sell';

/**
 * Order ticket. Stocks trade in whole shares; coins in fractional amounts. Used
 * inline beside the stock page on wide screens and in a bottom sheet on phones.
 */
export function TradePanel({
  asset,
  position,
  cash,
  initialSide = 'Buy',
  onSubmit,
  onCancel,
}: {
  asset: Asset;
  position?: Position;
  cash: number;
  initialSide?: Side;
  onSubmit: (side: Side, qty: number) => void;
  onCancel?: () => void;
}) {
  const [side, setSide] = useState<Side>(initialSide);
  const [amount, setAmount] = useState(asset.kind === 'crypto' ? '0.01' : '1');
  const crypto = asset.kind === 'crypto';
  const owned = position?.qty ?? 0;
  const qty = Number(amount);
  const total = qty * asset.price;
  const unit = crypto ? asset.ticker : qty === 1 ? 'share' : 'shares';
  const validAmount = Number.isFinite(qty) && qty > 0 && (crypto || Number.isInteger(qty));
  const valid = validAmount && (side === 'Buy' ? total <= cash : qty <= owned + 1e-9);
  return (
    <Block gap={12}>
      <SegmentedControl
        data={[
          { value: 'Buy', label: 'Buy' },
          { value: 'Sell', label: 'Sell', disabled: !owned },
        ]}
        value={side}
        onChange={(value) => setSide(value as Side)}
        color={side === 'Buy' ? C.green : C.red}
        fullWidth
        size="sm"
        accessibilityLabel="Order side"
      />
      <Text c={C.ink} fw="bold" size={18}>
        {side} {asset.ticker}
      </Text>
      <Block gap={0} direction="row" justify="space-between">
        <Text c={C.muted} size={13}>
          Market price
        </Text>
        <Text c={C.ink} fw="semibold" size={13}>
          {money(asset.price)}
        </Text>
      </Block>
      <Input
        variant="outline"
        label={crypto ? `Amount (${asset.ticker})` : 'Shares'}
        value={amount}
        onChangeText={setAmount}
        keyboardType={crypto ? 'decimal-pad' : 'number-pad'}
        placeholder={crypto ? '0.00' : 'Number of shares'}
        mb={0}
        radius={10}
        inputColor={C.ink}
      />
      <Block gap={0} direction="row" justify="space-between">
        <Text c={C.muted} size={13}>
          Estimated {side === 'Buy' ? 'cost' : 'credit'}
        </Text>
        <Text c={C.ink} fw="bold" size={13}>
          {validAmount ? money(total) : '—'}
        </Text>
      </Block>
      <Text c={C.muted} size={12}>
        {side === 'Buy'
          ? `${money(cash)} buying power available`
          : `${quantity(owned)} ${crypto ? asset.ticker : 'shares'} available`}
      </Text>
      <Button
        title={valid ? `Review ${side.toLowerCase()} · ${quantity(qty)} ${unit}` : `${side} ${asset.ticker}`}
        color={side === 'Buy' ? C.green : C.red}
        disabled={!valid}
        fullWidth
        onPress={() => {
          onSubmit(side, qty);
          setAmount(crypto ? '0.01' : '1');
        }}
      />
      {onCancel && <Button title="Cancel" variant="subtle" color={C.ink} fullWidth onPress={onCancel} />}
      <Text c={C.muted} size={11}>
        Simulated order with sample prices. No real trade is placed.
      </Text>
    </Block>
  );
}
