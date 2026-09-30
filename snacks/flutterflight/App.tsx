import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Block, Button, PlocksProvider, SafeArea, Text } from '@plocks/ui-snack';

const COLORS = {
  sky: '#83D5EF',
  ink: '#12334B',
  pipe: '#55A947',
  pipeBorder: '#327E39',
} as const;
const BIRD_X = 54;
const BIRD_SIZE = 28;
const PIPE_WIDTH = 52;
const GAP_HEIGHT = 120;
const TICK_MS = 40;

type Size = { width: number; height: number };
type Game = {
  bird: number;
  velocity: number;
  pipe: number;
  gap: number;
  score: number;
  running: boolean;
  over: boolean;
  passed: boolean;
};

const gapHeight = (height: number) => Math.min(GAP_HEIGHT, Math.max(80, height * 0.24));
const randomGap = (height: number) => 40 + Math.random() * Math.max(0, height - gapHeight(height) - 80);
const fresh = ({ width, height }: Size): Game => ({
  bird: Math.max(0, height / 2 - BIRD_SIZE / 2),
  velocity: 0,
  pipe: width,
  gap: randomGap(height),
  score: 0,
  running: false,
  over: false,
  passed: false,
});

export default function App() {
  const window = useWindowDimensions();
  const [size, setSize] = useState<Size>(() => ({ width: window.width, height: window.height }));
  const [game, setGame] = useState<Game>(() => fresh({ width: window.width, height: window.height }));

  const flap = () =>
    setGame((old) =>
      old.over
        ? { ...fresh(size), running: true, velocity: -6 }
        : { ...old, running: true, velocity: -6 },
    );

  useEffect(() => {
    if (!game.running || game.over) return;
    const timer = setInterval(() => {
      setGame((old) => {
        if (!old.running || old.over) return old;
        const velocity = Math.min(8, old.velocity + 0.45);
        const bird = old.bird + velocity;
        const movedPipe = old.pipe - Math.max(3, Math.min(8, size.width / 120));
        const wrapped = movedPipe < -PIPE_WIDTH;
        const pipe = wrapped ? size.width : movedPipe;
        const gap = wrapped ? randomGap(size.height) : old.gap;
        const hitPipe = pipe < BIRD_X + BIRD_SIZE && pipe + PIPE_WIDTH > BIRD_X;
        const collision =
          bird < 0 ||
          bird > size.height - BIRD_SIZE ||
          (hitPipe && (bird < gap || bird + BIRD_SIZE > gap + gapHeight(size.height)));
        const passed = pipe + PIPE_WIDTH < BIRD_X;
        return {
          ...old,
          bird,
          velocity,
          pipe,
          gap,
          over: collision,
          running: !collision,
          score: old.score + (passed && !old.passed ? 1 : 0),
          passed: wrapped ? false : passed,
        };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [game.running, game.over, size]);

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <SafeArea flex={1} gap={0} bg={COLORS.sky}>
          <StatusBar barStyle="dark-content" />
          <Block
            flex={1}
            gap={0}
            overflow="hidden"
            bg={COLORS.sky}
            onLayout={({ nativeEvent: { layout } }) => {
              const next = { width: layout.width, height: layout.height };
              if (
                next.width > 0 &&
                next.height > 0 &&
                (Math.abs(next.width - size.width) > 1 || Math.abs(next.height - size.height) > 1)
              ) {
                setSize(next);
                setGame(fresh(next));
              }
            }}
          >
            <Block
              gap={0}
              pointerEvents="none"
              position="absolute"
              left={game.pipe}
              top={0}
              w={PIPE_WIDTH}
              h={game.gap}
              bg={COLORS.pipe}
              borderWidth={3}
              borderColor={COLORS.pipeBorder}
            />
            <Block
              gap={0}
              pointerEvents="none"
              position="absolute"
              left={game.pipe}
              top={game.gap + gapHeight(size.height)}
              w={PIPE_WIDTH}
              h={size.height}
              bg={COLORS.pipe}
              borderWidth={3}
              borderColor={COLORS.pipeBorder}
            />
            <Block
              gap={0}
              pointerEvents="none"
              position="absolute"
              left={BIRD_X}
              top={game.bird}
              w={BIRD_SIZE}
              h={BIRD_SIZE}
              radius={BIRD_SIZE / 2}
              bg="#FFD34F"
              borderWidth={2}
              borderColor="#B87519"
            />
            <Block
              gap={0}
              position="absolute"
              inset={0}
              touchAction="none"
              onStartShouldSetResponder={() => true}
              onResponderRelease={flap}
              accessibilityRole="button"
              accessibilityLabel="Flap"
            />
            <Block
              gap={0}
              pointerEvents="box-none"
              position="absolute"
              top={16}
              left={20}
              right={20}
              direction="row"
              align="center"
              justify="space-between"
            >
              <Block gap={0} pointerEvents="none">
                <Text c={COLORS.ink} size={11} fw="bold" lts={1}>SCORE</Text>
                <Text c={COLORS.ink} size={30} fw="bold">{game.score}</Text>
              </Block>
              <Button title="Restart" color="#ED8B21" onPress={() => setGame(fresh(size))} />
            </Block>
            {(!game.running || game.over) && (
              <Block
                gap={0}
                pointerEvents="none"
                position="absolute"
                top="45%"
                alignSelf="center"
                bg="#FFFFFFE6"
                p={14}
                radius={12}
              >
                <Text c={COLORS.ink} fw="bold">
                  {game.over ? 'Game over · tap to retry' : 'Tap to start'}
                </Text>
              </Block>
            )}
          </Block>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
