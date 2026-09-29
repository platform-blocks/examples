import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Label, Panel, Stat, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#F2F8F7', surface: '#FFFFFF', ink: '#173B41', muted: '#627B7D', accent: '#138E91', border: '#D2E9E7' };
export default function App() {
  const [steps, setSteps] = useState(6420), [water, setWater] = useState(3), [activity, setActivity] = useState(24);
  const [day, setDay] = useState(0);
  const daily = day === 0 ? steps : [8120, 5305, 10420, 7040, 9340, 6150][day - 1];
  return <ExampleApp name="Fitbit-style Activity" subtitle="A daily wellness dashboard with local demo data." palette={P}>
    <Panel palette={P}><Label palette={P}>TODAY'S MOVEMENT</Label><Text c={P.accent} fw="bold" size={47}>{daily.toLocaleString()}</Text><Text c={P.muted}>steps of 10,000 goal</Text>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: P.border, overflow: 'hidden' }}><View style={{ width: `${Math.min(100,daily/100)}%`, height: 12, backgroundColor: P.accent }} /></View></Panel>
    <Actions><Action title="Today" palette={P} outline={day !== 0} onPress={() => setDay(0)} />{['M','T','W','T','F','S'].map((d,i) => <Action key={i} title={d} palette={P} outline={day !== i+1} onPress={() => setDay(i+1)} />)}</Actions>
    <Panel palette={P}><Actions><Stat label="ACTIVE MIN" value={String(activity)} palette={P} /><Stat label="WATER" value={`${water} cups`} palette={P} /><Stat label="SLEEP" value="7h 42m" palette={P} /></Actions></Panel>
    <Panel palette={P}><Label palette={P}>QUICK LOG</Label><Actions><Action title="+ 500 steps" palette={P} onPress={() => { setSteps(x => x+500); setDay(0); }} /><Action title="+ Water" palette={P} outline onPress={() => setWater(x => x+1)} /><Action title="+ 10 active min" palette={P} outline onPress={() => setActivity(x => x+10)} /></Actions></Panel>
    <Text c={P.muted} size={12}>Numbers are illustrative and reset when the app reloads. No wearable connection.</Text>
  </ExampleApp>;
}
