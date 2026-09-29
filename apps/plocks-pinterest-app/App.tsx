import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Label, Panel, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#FAF8F5', surface: '#FFFFFF', ink: '#282421', muted: '#7D756F', accent: '#BD2C37', border: '#E7E0D8' };
const PINS = [
  { id: 1, title: 'A reading corner with warm light', category: 'Interiors', color: '#DAB89D', icon: '🪑' },
  { id: 2, title: 'Summer citrus sketchbook', category: 'Art', color: '#EACA70', icon: '🍋' },
  { id: 3, title: 'A small balcony garden', category: 'Garden', color: '#A9C29C', icon: '🌿' },
  { id: 4, title: 'Weekend market flowers', category: 'Garden', color: '#D7A5AD', icon: '🌷' },
  { id: 5, title: 'Handmade ceramic shapes', category: 'Art', color: '#B0BEC1', icon: '🏺' },
  { id: 6, title: 'Cozy desk setup', category: 'Interiors', color: '#B3A7A0', icon: '🕯️' },
];
export default function App() {
  const [query, setQuery] = useState(''), [tab, setTab] = useState('Explore'), [saved, setSaved] = useState<number[]>([]), [selected, setSelected] = useState<number | null>(null);
  const pin = PINS.find(x => x.id === selected);
  const shown = PINS.filter(x => (tab !== 'Saved' || saved.includes(x.id)) && `${x.title} ${x.category}`.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id: number) => setSaved(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  return <ExampleApp name="Pinterest-style Ideas" subtitle="Find inspiration and collect favorites." palette={P}>
    <Panel palette={P}><TextInput value={query} onChangeText={setQuery} placeholder="Search ideas" accessibilityLabel="Search ideas" style={{ borderWidth: 1, borderColor: P.border, borderRadius: 10, padding: 10, color: P.ink }} />
      <Actions><Action title="Explore" palette={P} outline={tab !== 'Explore'} onPress={() => { setTab('Explore'); setSelected(null); }} /><Action title={`Saved (${saved.length})`} palette={P} outline={tab !== 'Saved'} onPress={() => { setTab('Saved'); setSelected(null); }} /></Actions></Panel>
    {pin ? <Panel palette={P}><Action title="← Back" palette={P} outline onPress={() => setSelected(null)} /><View style={{ height: 230, backgroundColor: pin.color, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Text size={78}>{pin.icon}</Text></View>
      <Label palette={P}>{pin.category.toUpperCase()}</Label><Text c={P.ink} fw="bold" size={25}>{pin.title}</Text><Action title={saved.includes(pin.id) ? 'Remove from saved' : 'Save idea'} palette={P} onPress={() => toggle(pin.id)} /></Panel> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {shown.map(item => <View key={item.id} style={{ width: '48%', minWidth: 145, flexGrow: 1 }}><Panel palette={P} onPress={() => setSelected(item.id)}><View style={{ height: item.id % 2 ? 145 : 195, backgroundColor: item.color, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}><Text size={56}>{item.icon}</Text></View><Text c={P.ink} fw="bold">{item.title}</Text><Label palette={P}>{item.category}</Label></Panel></View>)}
      {!shown.length && <Text c={P.muted}>No ideas match this view.</Text>}</View>}
    <Text c={P.muted} size={12}>Original sample ideas and placeholder artwork.</Text>
  </ExampleApp>;
}
