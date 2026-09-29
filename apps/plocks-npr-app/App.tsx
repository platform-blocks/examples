import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Label, Panel, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#F7F4EE', surface: '#FFFFFF', ink: '#17212B', muted: '#63717B', accent: '#D54336', border: '#E8E2D8' };
const STORIES = [
  { id: 'one', category: 'WORLD', title: 'Communities rethink the shape of their public squares', summary: 'A look at the small changes making shared spaces more welcoming.', duration: 9 },
  { id: 'two', category: 'SCIENCE', title: 'What a neighborhood garden can teach us about climate', summary: 'Researchers follow an unexpected source of local data.', duration: 6 },
  { id: 'three', category: 'CULTURE', title: 'The art of finding new music close to home', summary: 'Independent stages are helping fresh voices find an audience.', duration: 12 },
];
export default function App() {
  const [query, setQuery] = useState(''); const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false); const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const story = STORIES.find(s => s.id === selected);
  useEffect(() => { if (!playing || !story) return; const timer = setInterval(() => setSeconds(n => n + 1), 1000); return () => clearInterval(timer); }, [playing, story]);
  useEffect(() => { if (story && seconds >= story.duration * 60) { setPlaying(false); setSeconds(0); } }, [seconds, story]);
  const toggleSaved = (id: string) => setSaved(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  return <ExampleApp name="NPR-style News" subtitle="Stories for listening and reading." palette={P}>
    <Panel palette={P}><Text c={P.accent} fw="bold" size={19}>listen · read · discover</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search stories" accessibilityLabel="Search stories" style={{ borderWidth: 1, borderColor: P.border, borderRadius: 8, padding: 10, color: P.ink }} /></Panel>
    {story ? <Panel palette={P}><Action title="← All stories" palette={P} outline onPress={() => { setSelected(null); setPlaying(false); }} />
      <Label palette={P}>{story.category} · {story.duration} MIN LISTEN</Label><Text c={P.ink} fw="bold" size={25}>{story.title}</Text><Text c={P.muted}>{story.summary}</Text>
      <Text c={P.ink}>In this sample report, local voices describe the ideas and choices shaping daily life. Explore the topics, save a story, or try the sample player.</Text>
      <Actions><Action title={playing ? 'Pause' : 'Play sample'} palette={P} onPress={() => setPlaying(x => !x)} /><Action title={saved.includes(story.id) ? 'Saved ✓' : 'Save'} palette={P} outline onPress={() => toggleSaved(story.id)} /></Actions>
      <Text c={P.muted} size={12}>Sample playback timer · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} / {story.duration}:00</Text></Panel> : <>
      <Label palette={P}>TOP STORIES</Label>{STORIES.filter(s => `${s.title} ${s.category}`.toLowerCase().includes(query.toLowerCase())).map(s => <Panel key={s.id} palette={P} onPress={() => { setSelected(s.id); setSeconds(0); }}><Label palette={P}>{s.category} · {s.duration} MIN</Label><Text c={P.ink} fw="bold" size={20}>{s.title}</Text><Text c={P.muted}>{s.summary}</Text></Panel>)}
      <Text c={P.muted} size={12}>Original sample headlines and summaries. No live news or audio feed.</Text></>}
  </ExampleApp>;
}
