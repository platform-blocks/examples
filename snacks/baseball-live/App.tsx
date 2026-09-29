import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@plocks/ui-snack';
import { Action, Actions, ExampleApp, Label, Panel, Stat, type Palette } from './ExampleUI';

const P: Palette = { background: '#EEF4EE', surface: '#FFFFFF', ink: '#19372E', muted: '#647A6D', accent: '#247449', border: '#CDDDCF' };
type Game = { inning: number; half: 'Top' | 'Bottom'; home: number; away: number; balls: number; strikes: number; outs: number; bases: boolean[]; event: string };
const fresh = (): Game => ({ inning: 1, half: 'Top', home: 0, away: 0, balls: 0, strikes: 0, outs: 0, bases: [false,false,false], event: 'First pitch coming up.' });
function advance(g: Game, bases: number, label: string): Game {
  const occupied = [...g.bases]; let runs = 0;
  for (let i = 2; i >= 0; i--) if (occupied[i]) { occupied[i] = false; if (i+bases >= 3) runs++; else occupied[i+bases] = true; }
  if (bases >= 4) runs++; else occupied[bases-1] = true;
  return { ...g, bases: occupied, home: g.home + (g.half === 'Bottom' ? runs : 0), away: g.away + (g.half === 'Top' ? runs : 0), balls: 0, strikes: 0, event: `${label}${runs ? ` · ${runs} run${runs > 1 ? 's' : ''}!` : '.'}` };
}
function walk(g: Game): Game {
  const [first, second, third] = g.bases;
  const run = first && second && third ? 1 : 0;
  return { ...g, bases: [true, first || second, third || (first && second)],
    home: g.home + (g.half === 'Bottom' ? run : 0), away: g.away + (g.half === 'Top' ? run : 0),
    balls: 0, strikes: 0, event: run ? 'Bases-loaded walk · 1 run!' : 'Walk.' };
}
function out(g: Game, label: string): Game {
  if (g.outs < 2) return { ...g, outs: g.outs+1, balls: 0, strikes: 0, event: label };
  const half = g.half === 'Top' ? 'Bottom' : 'Top';
  return { ...g, inning: g.inning + (half === 'Top' ? 1 : 0), half, outs: 0, balls: 0, strikes: 0, bases: [false,false,false], event: `${label} · Side retired.` };
}
export default function App() {
  const [game, setGame] = useState<Game>(fresh);
  function pitch() { setGame(g => { const roll = Math.random(); if (roll < .26) return g.balls === 3 ? walk(g) : { ...g, balls: g.balls+1, event: 'Ball.' };
    if (roll < .52) return g.strikes === 2 ? out(g,'Strikeout') : { ...g, strikes: g.strikes+1, event: 'Strike.' };
    if (roll < .66) return out(g,'Fly out'); if (roll < .87) return advance(g,1,'Base hit'); if (roll < .96) return advance(g,2,'Double'); return advance(g,4,'Home run'); }); }
  return <ExampleApp name="Baseball Live Visualizer" subtitle="A simulated pitch-by-pitch game board." palette={P}>
    <Panel palette={P}><Label palette={P}>{game.half.toUpperCase()} {game.inning}</Label><Actions><Stat label="AWAY" value={String(game.away)} palette={P} /><Stat label="HOME" value={String(game.home)} palette={P} /></Actions></Panel>
    <Panel palette={P}><View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 102, height: 102, transform: [{ rotate: '45deg' }], backgroundColor: '#D6AF7E', borderWidth: 6, borderColor: P.accent }} />
      {[{top: 14,left: '48%' as const,on:game.bases[1]},{top: 73,left: '67%' as const,on:game.bases[0]},{top: 73,left: '29%' as const,on:game.bases[2]}].map((base,i) => <View key={i} style={{ position: 'absolute', top: base.top, left: base.left, width: 17, height: 17, transform: [{ rotate: '45deg' }], backgroundColor: base.on ? '#E5A62B' : '#FFFFFF', borderWidth: 2, borderColor: P.ink }} />)}
    </View><Actions><Stat label="BALLS" value={String(game.balls)} palette={P} /><Stat label="STRIKES" value={String(game.strikes)} palette={P} /><Stat label="OUTS" value={String(game.outs)} palette={P} /></Actions><Text c={P.ink}>{game.event}</Text></Panel>
    <Actions><Action title="Next pitch" palette={P} onPress={pitch} /><Action title="New game" palette={P} outline onPress={() => setGame(fresh())} /></Actions>
    <Text c={P.muted} size={12}>Simulated game only. No live MLB data or real teams.</Text>
  </ExampleApp>;
}
