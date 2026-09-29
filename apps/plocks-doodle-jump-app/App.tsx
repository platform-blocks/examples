import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Panel, Stat, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#FAFBEF', surface: '#FFFFFF', ink: '#273C2B', muted: '#617364', accent: '#63A941', border: '#C8D9B8' };
type Game = { x: number; y: number; vy: number; score: number; over: boolean; platforms: { x: number; y: number }[] };
const fresh = (): Game => ({ x: 130, y: 270, vy: -8, score: 0, over: false, platforms: [{ x: 110, y: 320 }, { x: 210, y: 245 }, { x: 80, y: 170 }, { x: 180, y: 95 }, { x: 45, y: 25 }] });
export default function App() {
  const [game, setGame] = useState<Game>(fresh);
  const [direction, setDirection] = useState(0);
  useEffect(() => {
    if (game.over) return;
    const timer = setInterval(() => setGame(old => {
      if (old.over) return old;
      let y = old.y + old.vy, vy = old.vy + 0.38;
      const x = (old.x + direction * 5 + 280) % 280;
      if (old.vy > 0 && old.platforms.some(p => old.y + 24 <= p.y + 8 && y + 24 >= p.y && x + 22 > p.x && x < p.x + 65)) vy = -9;
      let platforms = [...old.platforms];
      let score = old.score;
      if (y < 130) {
        const shift = 130 - y; y = 130; score += Math.round(shift);
        platforms = platforms.map(p => ({ ...p, y: p.y + shift })).filter(p => p.y < 370);
        while (platforms.length < 5) {
          const highest = Math.min(...platforms.map(p => p.y));
          platforms.push({ x: 25 + Math.random() * 205, y: highest - 70 });
        }
      }
      return { ...old, x, y, vy, score, platforms, over: y > 360 };
    }), 35);
    return () => clearInterval(timer);
  }, [game.over, direction]);
  return <ExampleApp name="Doodle Jump" subtitle="Bounce upward and steer onto platforms." palette={P}>
    <Panel palette={P}><Actions><Stat label="HEIGHT" value={String(game.score)} palette={P} /><Action title="New game" palette={P} onPress={() => setGame(fresh())} /></Actions></Panel>
    <View style={{ width: 320, maxWidth: '100%', alignSelf: 'center', height: 360, backgroundColor: '#E9F6DB', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: P.border }}>
      {game.platforms.map((p, i) => <View key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 65, height: 9, borderRadius: 5, backgroundColor: '#5BAC57' }} />)}
      <View style={{ position: 'absolute', left: game.x, top: game.y, width: 23, height: 25, borderRadius: 9, backgroundColor: '#F7C448', borderWidth: 2, borderColor: P.ink }} />
      {game.over && <View style={{ position: 'absolute', top: 150, alignSelf: 'center', padding: 12, backgroundColor: '#FFFFFFEA', borderRadius: 10 }}><Text c={P.ink} fw="bold">Fall! Start a new game.</Text></View>}
    </View>
    <Actions><Action title="← Left" palette={P} onPress={() => setDirection(-1)} /><Action title="Stop" palette={P} outline onPress={() => setDirection(0)} /><Action title="Right →" palette={P} onPress={() => setDirection(1)} /></Actions>
    <Text c={P.muted} size={12}>Choose a direction to drift. Land on green platforms to bounce.</Text>
  </ExampleApp>;
}
