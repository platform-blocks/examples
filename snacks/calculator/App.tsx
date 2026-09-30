import { useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Block, Button, PlocksProvider, SafeArea, Text } from '@plocks/ui-snack';

const COLORS = {
  background: '#15191E',
  surface: '#252B32',
  ink: '#F7F9FA',
  muted: '#A6B0BA',
  accent: '#E9A33C',
} as const;

const KEYS = [
  ['AC', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
] as const;
const KEY_INSET = 5;

type Operator = '+' | '−' | '×' | '÷';

const isOperator = (key: string): key is Operator => ['+', '−', '×', '÷'].includes(key);
const format = (value: number) => Number.isFinite(value) ? String(Number(value.toPrecision(11))) : 'Error';
const formatDisplay = (value: string) =>
  value.replace(/^-?\d+/, integer => integer.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
const evaluate = (left: number, right: number, operator: Operator) => {
  switch (operator) {
    case '+': return left + right;
    case '−': return left - right;
    case '×': return left * right;
    case '÷': return left / right;
  }
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [fresh, setFresh] = useState(false);
  const [keypadHeight, setKeypadHeight] = useState(0);
  const fontScale = Math.sqrt((width * height) / (390 * 844));
  const keyHeight = keypadHeight ? keypadHeight / KEYS.length - KEY_INSET * 2 : 60;
  const keyFontSize = Math.max(18, Math.min(56, 24 * fontScale, keyHeight * 0.45));
  const displayFontSize = Math.max(44, Math.min(112, 52 * fontScale));
  const historyFontSize = Math.max(16, Math.min(34, 18 * fontScale));

  function press(key: string) {
    if (key === 'AC') {
      setDisplay('0');
      setStored(null);
      setOperator(null);
      setFresh(false);
      return;
    }

    if (/^\d$/.test(key) || key === '.') {
      const starting = fresh || display === 'Error';
      if (key === '.' && !starting && display.includes('.')) return;
      setDisplay(starting ? (key === '.' ? '0.' : key) : display === '0' && key !== '.' ? key : display + key);
      setFresh(false);
      return;
    }

    if (display === 'Error') return;
    if (key === '±' || key === '%') {
      setDisplay(format(key === '±' ? -Number(display) : Number(display) / 100));
      return;
    }

    if (key === '=') {
      if (operator && stored !== null) {
        setDisplay(format(evaluate(stored, Number(display), operator)));
        setStored(null);
        setOperator(null);
        setFresh(true);
      }
      return;
    }

    if (isOperator(key)) {
      const next = operator && stored !== null && !fresh
        ? evaluate(stored, Number(display), operator)
        : Number(display);
      setStored(next);
      setDisplay(format(next));
      setOperator(key);
      setFresh(true);
    }
  }

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
        <SafeArea flex={1} gap={0} bg={COLORS.background}>
          <StatusBar barStyle="light-content" />
          <Block flex={1} gap={0} p={12}>
            <Block flex={1} gap={4} px={5} pb={12} align="flex-end" justify="flex-end">
              <Text c={COLORS.muted} size={historyFontSize} ta="right">
                {stored !== null && operator ? `${formatDisplay(format(stored))} ${operator}` : ' '}
              </Text>
              <Text c={COLORS.ink} size={displayFontSize} ta="right" numberOfLines={1}>
                {formatDisplay(display)}
              </Text>
            </Block>

            <Block flex={3} gap={0} onLayout={({ nativeEvent: { layout } }) => setKeypadHeight(layout.height)}>
              {KEYS.map((row, rowIndex) => (
                <Block key={rowIndex} flex={1} direction="row" gap={0}>
                  {row.map((key) => (
                    <Block key={key} flex={key === '0' ? 2 : 1} gap={0} p={KEY_INSET}>
                      <Button
                        title={key}
                        onPress={() => press(key)}
                        variant="filled"
                        color={isOperator(key) || key === '=' ? COLORS.accent : COLORS.surface}
                        textColor={COLORS.ink}
                        labelProps={{ size: keyFontSize, fw: '600' }}
                        radius={18}
                        fullWidth
                        h={keyHeight}
                      />
                    </Block>
                  ))}
                </Block>
              ))}
            </Block>
          </Block>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
