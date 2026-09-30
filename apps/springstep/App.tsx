import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Block, SafeArea, Button, PlocksProvider, Text } from '@plocks/ui';

const P = { background: '#E9F6DB', ink: '#273C2B', muted: '#617364', accent: '#63A941' };
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 30;
const PLATFORM_WIDTH = 72;
const PLATFORM_HEIGHT = 10;
const PLATFORM_GAP = 90;
const TICK_MS = 35;

type Size = { width: number; height: number };
type GamePlatform = { x: number; y: number };
type Game = { x: number; y: number; vy: number; score: number; over: boolean; platforms: GamePlatform[] };

const platformWidth = (width: number) => Math.min(PLATFORM_WIDTH, width * 0.28);
const clampX = (x: number, width: number) => Math.max(0, Math.min(width - PLAYER_WIDTH, x));

function fresh({ width, height }: Size): Game {
  const maxPlatformX = Math.max(0, width - platformWidth(width));
  const positions = [0.5, 0.72, 0.24, 0.6, 0.16, 0.78];
  const platforms: GamePlatform[] = [];
  for (let y = height - 90, i = 0; y > -PLATFORM_GAP; y -= PLATFORM_GAP, i++) {
    platforms.push({ x: positions[i % positions.length] * maxPlatformX, y });
  }
  return {
    x: clampX((width - PLAYER_WIDTH) / 2, width),
    y: height - 125,
    vy: -9,
    score: 0,
    over: false,
    platforms,
  };
}

export default function App() {
  const window = useWindowDimensions();
  const [size, setSize] = useState<Size>(() => ({ width: window.width, height: window.height }));
  const [game, setGame] = useState<Game>(() => fresh({ width: window.width, height: window.height }));

  useEffect(() => {
    if (game.over) return;
    const timer = setInterval(
      () =>
        setGame((old) => {
          if (old.over) return old;
          let y = old.y + old.vy;
          let vy = old.vy + 0.38;
          const width = platformWidth(size.width);

          if (old.vy > 0) {
            const landing = old.platforms.find(
              (p) =>
                old.y + PLAYER_HEIGHT <= p.y + PLATFORM_HEIGHT &&
                y + PLAYER_HEIGHT >= p.y &&
                old.x + PLAYER_WIDTH > p.x &&
                old.x < p.x + width,
            );
            if (landing) {
              y = landing.y - PLAYER_HEIGHT;
              vy = -9;
            }
          }

          let platforms = old.platforms;
          let score = old.score;
          const scrollLine = size.height * 0.35;
          if (y < scrollLine) {
            const shift = scrollLine - y;
            y = scrollLine;
            score += Math.round(shift);
            platforms = old.platforms
              .map((p) => ({ ...p, y: p.y + shift }))
              .filter((p) => p.y < size.height + PLATFORM_HEIGHT);
            let highest = platforms.length ? Math.min(...platforms.map((p) => p.y)) : scrollLine;
            while (highest > -PLATFORM_GAP) {
              highest -= PLATFORM_GAP;
              platforms.push({ x: Math.random() * Math.max(0, size.width - width), y: highest });
            }
          }

          return { ...old, y, vy, score, platforms, over: y > size.height };
        }),
      TICK_MS,
    );
    return () => clearInterval(timer);
  }, [game.over, size]);

  const moveTo = (x: number) => {
    setGame((old) => (old.over ? old : { ...old, x: clampX(x - PLAYER_WIDTH / 2, size.width) }));
  };

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <SafeArea gap={0} flex={1} bg={P.background}>
          <StatusBar barStyle="dark-content" />
          <Block
            gap={0}
            flex={1}
            overflow="hidden"
            bg={P.background}
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
            {game.platforms.map((p, i) => (
              <Block
                gap={0}
                key={i}
                pointerEvents="none"
                position="absolute"
                left={p.x}
                top={p.y}
                w={platformWidth(size.width)}
                h={PLATFORM_HEIGHT}
                radius={5}
                bg="#5BAC57"
              />
            ))}
            <Block
              gap={0}
              pointerEvents="none"
              position="absolute"
              left={game.x}
              top={game.y}
              w={PLAYER_WIDTH}
              h={PLAYER_HEIGHT}
              radius={10}
              bg="#F7C448"
              borderWidth={2}
              borderColor={P.ink}
            />
            <Block
              gap={0}
              position="absolute"
              inset={0}
              touchAction="none"
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(event) => moveTo(event.nativeEvent.locationX)}
              onResponderMove={(event) => moveTo(event.nativeEvent.locationX)}
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
                <Text c={P.muted} size={11} fw="bold" lts={1}>
                  HEIGHT
                </Text>
                <Text c={P.ink} size={28} fw="bold">
                  {game.score}
                </Text>
              </Block>
              <Button title="New game" color={P.accent} variant="filled" onPress={() => setGame(fresh(size))} />
            </Block>
            {game.over && (
              <Block
                gap={0}
                pointerEvents="none"
                position="absolute"
                top="45%"
                alignSelf="center"
                p={16}
                radius={12}
                bg="#FFFFFFEA"
              >
                <Text c={P.ink} fw="bold">
                  Fall! Start a new game.
                </Text>
              </Block>
            )}
            {!game.over && (
              <Block gap={0} pointerEvents="none" position="absolute" bottom={20} alignSelf="center">
                <Text c={P.muted} size={12}>
                  Press and drag to move
                </Text>
              </Block>
            )}
          </Block>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
