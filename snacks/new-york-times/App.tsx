import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@plocks/ui-snack';
import { Action, Actions, ExampleApp, Label, Panel, type Palette } from './ExampleUI';

const P: Palette = { background: '#F8F7F3', surface: '#FFFFFF', ink: '#171717', muted: '#646464', accent: '#2E4E67', border: '#D9D8D2' };
const ARTICLES = [
  { id: 1, section: 'World', title: 'A small city makes room for a new public garden', deck: 'The project began with a simple question about unused space.', byline: 'By Alex Rivera' },
  { id: 2, section: 'Technology', title: 'Inside a growing movement to repair old devices', deck: 'Workshops and shared tools are giving products a second life.', byline: 'By Morgan Lee' },
  { id: 3, section: 'Arts', title: 'A museum opens its doors after dark', deck: 'Evening hours invite a different kind of visit.', byline: 'By Taylor Brooks' },
  { id: 4, section: 'World', title: 'How a coastal town is planning for the next decade', deck: 'Residents are weighing what to preserve and what to change.', byline: 'By Jamie Park' },
];
const SECTIONS = ['Top Stories', 'World', 'Technology', 'Arts', 'Saved'];
export default function App() {
  const [section, setSection] = useState('Top Stories'); const [selected, setSelected] = useState<number | null>(null); const [saved, setSaved] = useState<number[]>([]);
  const article = ARTICLES.find(a => a.id === selected);
  const shown = ARTICLES.filter(a => section === 'Top Stories' || (section === 'Saved' ? saved.includes(a.id) : a.section === section));
  return <ExampleApp name="Times-style News" subtitle="A clean, editorial news reading example." palette={P}>
    <Panel palette={P}><Text c={P.ink} fw="bold" size={26} ta="center">The Daily Edition</Text><Text c={P.muted} ta="center" size={12}>A sample newspaper · Local demo content</Text></Panel>
    {article ? <Panel palette={P}><Action title="← Back" palette={P} outline onPress={() => setSelected(null)} /><Label palette={P}>{article.section.toUpperCase()}</Label>
      <Text c={P.ink} fw="bold" size={30}>{article.title}</Text><Text c={P.muted} size={17}>{article.deck}</Text><Text c={P.muted} size={12}>{article.byline}</Text>
      <View style={{ height: 1, backgroundColor: P.border }} /><Text c={P.ink}>This example article shows a reading layout with section navigation and a saved list. Its text is original sample content for the interface.</Text>
      <Action title={saved.includes(article.id) ? 'Remove from saved' : 'Save article'} palette={P} onPress={() => setSaved(old => old.includes(article.id) ? old.filter(id => id !== article.id) : [...old, article.id])} /></Panel> : <>
      <Actions>{SECTIONS.map(name => <Action key={name} title={name} palette={P} outline={section !== name} onPress={() => setSection(name)} />)}</Actions>
      {shown.length ? shown.map((item, index) => <Pressable key={item.id} onPress={() => setSelected(item.id)} accessibilityRole="button" style={{ borderTopWidth: index === 0 ? 2 : 1, borderColor: P.ink, paddingVertical: 18 }}>
        <Label palette={P}>{item.section.toUpperCase()}</Label><Text c={P.ink} fw="bold" size={index === 0 ? 27 : 21}>{item.title}</Text><Text c={P.muted}>{item.deck}</Text><Text c={P.muted} size={11}>{item.byline}</Text></Pressable>) : <Panel palette={P}><Text c={P.muted}>No saved articles yet.</Text></Panel>}
    </>}
  </ExampleApp>;
}
