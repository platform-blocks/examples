import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from '@plocks/ui-snack';
import { Action, Actions, ExampleApp, Label, Panel, Stat, type Palette } from './ExampleUI';

const P: Palette = { background: '#EFF5FA', surface: '#FFFFFF', ink: '#163149', muted: '#60788A', accent: '#2377B8', border: '#D3E2ED' };
const FLIGHTS = [
  { number: 'PB102', from: 'PHX', to: 'SEA', origin: 'Phoenix', destination: 'Seattle', depart: '09:20', arrive: '12:10', status: 'In air', progress: .62, gate: 'A12' },
  { number: 'PB218', from: 'JFK', to: 'LAX', origin: 'New York', destination: 'Los Angeles', depart: '11:45', arrive: '15:05', status: 'Boarding', progress: .08, gate: 'B7' },
  { number: 'PB340', from: 'SFO', to: 'DEN', origin: 'San Francisco', destination: 'Denver', depart: '14:15', arrive: '17:48', status: 'Scheduled', progress: 0, gate: 'C21' },
];
export default function App() {
  const [query, setQuery] = useState(''), [selected, setSelected] = useState<string | null>(null);
  const flight = FLIGHTS.find(f => f.number === selected);
  const shown = FLIGHTS.filter(f => `${f.number} ${f.from} ${f.to} ${f.origin} ${f.destination}`.toLowerCase().includes(query.toLowerCase()));
  return <ExampleApp name="Flight Tracker" subtitle="Explore sample routes and flight status." palette={P}>
    <Panel palette={P}><TextInput value={query} onChangeText={setQuery} placeholder="Flight number or airport" accessibilityLabel="Search flights" autoCapitalize="characters" style={{ borderWidth: 1, borderColor: P.border, borderRadius: 9, padding: 11, color: P.ink }} /></Panel>
    {flight ? <Panel palette={P}><Action title="← All flights" palette={P} outline onPress={() => setSelected(null)} /><Label palette={P}>{flight.number} · {flight.status.toUpperCase()}</Label>
      <Actions><Stat label={flight.origin.toUpperCase()} value={flight.from} palette={P} /><Text c={P.accent} size={26}>✈ →</Text><Stat label={flight.destination.toUpperCase()} value={flight.to} palette={P} /></Actions>
      <View style={{ height: 10, backgroundColor: P.border, borderRadius: 5 }}><View style={{ width: `${flight.progress*100}%`, height: 10, backgroundColor: P.accent, borderRadius: 5 }} /></View>
      <Actions><Stat label="DEPART" value={flight.depart} palette={P} /><Stat label="ARRIVE" value={flight.arrive} palette={P} /><Stat label="GATE" value={flight.gate} palette={P} /></Actions>
      <Text c={P.muted}>Route progress is a static illustration for this sample flight.</Text></Panel> : <><Label palette={P}>FLIGHTS</Label>{shown.map(f => <Panel key={f.number} palette={P} onPress={() => setSelected(f.number)}>
      <Actions><Text c={P.ink} fw="bold" size={18}>{f.number}</Text><Text c={P.accent}>{f.status}</Text></Actions><Text c={P.ink} size={22} fw="bold">{f.from}  ✈  {f.to}</Text><Text c={P.muted}>{f.depart} → {f.arrive} · Gate {f.gate}</Text></Panel>)}
      {!shown.length && <Panel palette={P}><Text c={P.muted}>No matching sample flight.</Text></Panel>}</>}
    <Text c={P.muted} size={12}>Fictional flights and static status. No live tracking service is connected.</Text>
  </ExampleApp>;
}
