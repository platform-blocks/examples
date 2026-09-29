import { useState } from 'react';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Label, Panel, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#F8F4EA', surface: '#FFFDF8', ink: '#372C23', muted: '#776F65', accent: '#8B6542', border: '#E8DCC7' };
const PASSAGES = [
  { ref: 'Psalm 23:1–4', verses: ['The LORD is my shepherd; I shall not want.', 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.', 'He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.', 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.'] },
  { ref: 'Proverbs 3:5–6', verses: ['Trust in the LORD with all thine heart; and lean not unto thine own understanding.', 'In all thy ways acknowledge him, and he shall direct thy paths.'] },
  { ref: 'John 1:1–3', verses: ['In the beginning was the Word, and the Word was with God, and the Word was God.', 'The same was in the beginning with God.', 'All things were made by him; and without him was not any thing made that was made.'] },
];
export default function App() {
  const [chapter, setChapter] = useState(0), [bookmarks, setBookmarks] = useState<string[]>([]), [showSaved, setShowSaved] = useState(false);
  const passage = PASSAGES[chapter];
  const toggle = () => setBookmarks(old => old.includes(passage.ref) ? old.filter(x => x !== passage.ref) : [...old, passage.ref]);
  return <ExampleApp name="Bible Reader" subtitle="Read a passage and keep a simple bookmark list." palette={P}>
    <Panel palette={P}><Actions>{PASSAGES.map((item, i) => <Action key={item.ref} title={item.ref.split(' ')[0]} palette={P} outline={i !== chapter} onPress={() => { setChapter(i); setShowSaved(false); }} />)}</Actions></Panel>
    {showSaved ? <Panel palette={P}><Label palette={P}>BOOKMARKS</Label>{bookmarks.length ? bookmarks.map(ref => <Action key={ref} title={ref} palette={P} outline onPress={() => { setChapter(PASSAGES.findIndex(x => x.ref === ref)); setShowSaved(false); }} />) : <Text c={P.muted}>No bookmarks yet.</Text>}</Panel> : <Panel palette={P}><Label palette={P}>KING JAMES VERSION</Label><Text c={P.ink} fw="bold" size={29}>{passage.ref}</Text>
      {passage.verses.map((verse,i) => <Text key={i} c={P.ink} size={18} style={{ lineHeight: 30 }}><Text c={P.accent} fw="bold">{i+1} </Text>{verse}</Text>)}
      <Action title={bookmarks.includes(passage.ref) ? 'Remove bookmark' : 'Bookmark passage'} palette={P} onPress={toggle} /></Panel>}
    <Action title={showSaved ? 'Read passage' : `Bookmarks (${bookmarks.length})`} palette={P} outline onPress={() => setShowSaved(x => !x)} />
    <Text c={P.muted} size={12}>Public-domain King James Version excerpts. Bookmarks reset on reload.</Text>
  </ExampleApp>;
}
