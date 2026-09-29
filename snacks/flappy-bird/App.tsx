import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@plocks/ui-snack';
import { Action, Actions, ExampleApp, Panel, Stat, type Palette } from './ExampleUI';

const P: Palette = { background: '#DFF5FF', surface: '#FFFFFF', ink: '#12334B', muted: '#526F80', accent: '#ED8B21', border: '#B8E4F4' };
const HEIGHT = 360;
type Game = { bird: number; velocity: number; pipe: number; gap: number; score: number; running: boolean; over: boolean; passed: boolean };
const fresh = (): Game => ({ bird: 170, velocity: 0, pipe: 360, gap: 145, score: 0, running: false, over: false, passed: false });
export default function App() {
  const [game, setGame] = useState<Game>(fresh);
  const flap = () => setGame(old => old.over ? { ...fresh(), running: true, velocity: -6 } : { ...old, running: true, velocity: -6 });
  useEffect(() => {
    if (!game.running || game.over) return;
    const timer = setInterval(() => setGame(old => {
      if (!old.running || old.over) return old;
      const velocity = Math.min(8, old.velocity + 0.45);
      const bird = old.bird + velocity;
      const pipe = old.pipe - 3;
      const gap = pipe < -55 ? 85 + Math.floor(Math.random() * 155) : old.gap;
      const nextPipe = pipe < -55 ? 360 : pipe;
      const collision = bird < 0 || bird > HEIGHT - 28 || (nextPipe < 103 && nextPipe > 37 && (bird < gap || bird + 26 > gap + 105));
      const passed = nextPipe < 35;
      return { ...old, bird, velocity, pipe: nextPipe, gap, over: collision, running: !collision,
        score: old.score + (passed && !old.passed ? 1 : 0), passed: pipe < -55 ? false : passed };
    }), 40);
    return () => clearInterval(timer);
  }, [game.running, game.over]);
  return <ExampleApp name="Flappy Bird" subtitle="Tap the sky to flap through the pipes." palette={P}>
    <Panel palette={P}><Actions><Stat label="SCORE" value={String(game.score)} palette={P} />
      <Action title="Restart" palette={P} onPress={() => setGame(fresh())} /></Actions></Panel>
    <Pressable onPress={flap} accessibilityRole="button" accessibilityLabel="Flap" style={{ width: 360, maxWidth: '100%', alignSelf: 'center', height: HEIGHT, overflow: 'hidden', borderRadius: 20, backgroundColor: '#83D5EF', borderWidth: 2, borderColor: P.border }}>
      <View style={{ position: 'absolute', left: game.pipe, top: 0, width: 52, height: game.gap, backgroundColor: '#55A947', borderWidth: 3, borderColor: '#327E39' }} />
      <View style={{ position: 'absolute', left: game.pipe, top: game.gap + 105, width: 52, height: HEIGHT, backgroundColor: '#55A947', borderWidth: 3, borderColor: '#327E39' }} />
      <View style={{ position: 'absolute', left: 54, top: game.bird, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFD34F', borderWidth: 2, borderColor: '#B87519' }} />
      {(!game.running || game.over) && <View style={{ position: 'absolute', top: 145, alignSelf: 'center', backgroundColor: '#FFFFFFE6', padding: 14, borderRadius: 12 }}><Text c={P.ink} fw="bold">{game.over ? 'Game over · tap to retry' : 'Tap to start'}</Text></View>}
    </Pressable>
    <Text c={P.muted} size={12}>A local arcade demo. Each pipe passed adds one point.</Text>
  </ExampleApp>;
}
