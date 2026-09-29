import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@plocks/ui';
import { ExampleApp, Panel, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#15191E', surface: '#252B32', ink: '#F7F9FA', muted: '#A6B0BA', accent: '#E9A33C', border: '#38414A' };
type Operator = '+' | '−' | '×' | '÷';
export default function App() {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [fresh, setFresh] = useState(false);
  const evaluate = (left: number, right: number, op: Operator) => op === '+' ? left + right : op === '−' ? left - right : op === '×' ? left * right : left / right;
  const format = (value: number) => Number.isFinite(value) ? String(Number(value.toPrecision(11))) : 'Error';
  function press(key: string) {
    if (key === 'AC') { setDisplay('0'); setStored(null); setOperator(null); setFresh(false); return; }
    if (/^\d$/.test(key) || key === '.') {
      if (key === '.' && !fresh && display.includes('.')) return;
      setDisplay(fresh ? (key === '.' ? '0.' : key) : display === '0' && key !== '.' ? key : display + key);
      setFresh(false); return;
    }
    if (key === '±') { setDisplay(format(-Number(display))); return; }
    if (key === '%') { setDisplay(format(Number(display) / 100)); return; }
    if (key === '=') {
      if (operator && stored !== null) { setDisplay(format(evaluate(stored, Number(display), operator))); setStored(null); setOperator(null); setFresh(true); }
      return;
    }
    const op = key as Operator;
    const next = operator && stored !== null && !fresh ? evaluate(stored, Number(display), operator) : Number(display);
    setStored(next); setDisplay(format(next)); setOperator(op); setFresh(true);
  }
  const keys = [['AC', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '.', '=']];
  return <ExampleApp name="Calculator" subtitle="A compact four-function calculator." palette={P} dark>
    <Panel palette={P}><Text c={P.muted} ta="right">{stored !== null && operator ? `${stored} ${operator}` : ' '}</Text>
      <Text c={P.ink} size={48} ta="right" numberOfLines={1}>{display}</Text></Panel>
    {keys.map((row, index) => <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
      {row.map(key => <View key={key} style={{ flex: key === '0' ? 2 : 1 }}><Button title={key} onPress={() => press(key)}
        color={'+−×÷='.includes(key) ? P.accent : P.surface} textColor={P.ink} variant="filled" style={{ width: '100%', height: 60 }} /></View>)}
    </View>)}
  </ExampleApp>;
}
