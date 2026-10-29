import { useEffect, useReducer, useRef, useState } from 'react';
import { Animated, Platform, StatusBar, useColorScheme } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IconBackspace, IconMoon, IconRefresh, IconSun } from '@tabler/icons-react-native';

import { Block, Button, MotionBlock, PlocksProvider, SafeArea, Text } from '@plocks/ui-snack';

type Mark = 'correct' | 'present' | 'absent';
type Palette = {
  background: string;
  ink: string;
  muted: string;
  empty: string;
  filled: string;
  key: string;
  correct: string;
  present: string;
  absent: string;
  toast: string;
  toastInk: string;
};

const LIGHT: Palette = {
  background: '#FFFFFF',
  ink: '#1C1D20',
  muted: '#6B6E73',
  empty: '#DCDEE2',
  filled: '#8A8D92',
  key: '#DDE0E4',
  correct: '#4E9A57',
  present: '#C9A227',
  absent: '#7B7E83',
  toast: '#1C1D20',
  toastInk: '#FFFFFF',
};
const DARK: Palette = {
  background: '#121315',
  ink: '#F2F3F5',
  muted: '#9A9DA3',
  empty: '#36383C',
  filled: '#5C5F65',
  key: '#5A5D63',
  correct: '#4E9A57',
  present: '#B8952A',
  absent: '#3A3C40',
  toast: '#F2F3F5',
  toastInk: '#121315',
};

const WORDS = [
  'PLANT', 'LIGHT', 'STONE', 'BREAD', 'TRAIN', 'OCEAN', 'MUSIC', 'CRANE', 'FLAME', 'GRAPE',
  'HOUSE', 'MAPLE', 'RIVER', 'SPOON', 'TIGER', 'CLOUD', 'BRICK', 'CHAIR', 'DANCE', 'EARTH',
  'FROST', 'GLOVE', 'HONEY', 'JUICE', 'KNIFE', 'LEMON', 'MOUSE', 'NORTH', 'PIANO', 'QUILT',
  'ROBIN', 'SHEEP', 'TOAST', 'UNCLE', 'VOICE', 'WHEAT', 'YOUTH', 'ZEBRA', 'BEACH', 'CANDY',
];
const ROWS = 6;
const COLS = 5;
const GAP = 6;
const STEP = 280; // ms between tile reveals
const REVEAL = STEP * COLS + 120;
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ENTER ZXCVBNM BACK'];
const PRAISE = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
const KEYBOARD_HEIGHT = 3 * 58 + 2 * 8 + 12;
const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];

function marks(guess: string, answer: string): Mark[] {
  const result: Mark[] = Array(COLS).fill('absent');
  const pool = answer.split('');
  for (let i = 0; i < COLS; i++)
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
      pool[i] = '';
    }
  for (let i = 0; i < COLS; i++)
    if (result[i] !== 'correct') {
      const index = pool.indexOf(guess[i]);
      if (index >= 0) {
        result[i] = 'present';
        pool[index] = '';
      }
    }
  return result;
}

type Toast = { text: string; id: number; delay: number };
type State = {
  answer: string;
  guesses: string[];
  current: string;
  status: 'playing' | 'won' | 'lost';
  toast: Toast | null;
  shake: number;
};
type Action = { type: 'key'; key: string } | { type: 'new' };

const fresh = (): State => ({ answer: pick(), guesses: [], current: '', status: 'playing', toast: null, shake: 0 });
const toast = (state: State, text: string, delay = 0): Toast => ({
  text,
  delay,
  id: (state.toast?.id ?? 0) + 1,
});

function reducer(state: State, action: Action): State {
  if (action.type === 'new') return { ...fresh(), toast: toast(state, '') };
  if (state.status !== 'playing') return state;
  const { key } = action;
  if (key === 'BACK') return { ...state, current: state.current.slice(0, -1) };
  if (key === 'ENTER') {
    if (state.current.length < COLS)
      return { ...state, toast: toast(state, 'Not enough letters'), shake: state.shake + 1 };
    const guesses = [...state.guesses, state.current];
    if (state.current === state.answer)
      return { ...state, guesses, current: '', status: 'won', toast: toast(state, PRAISE[guesses.length - 1], REVEAL) };
    if (guesses.length === ROWS)
      return { ...state, guesses, current: '', status: 'lost', toast: toast(state, state.answer, REVEAL) };
    return { ...state, guesses, current: '' };
  }
  if (/^[A-Z]$/.test(key) && state.current.length < COLS) return { ...state, current: state.current + key };
  return state;
}

function Tile({
  letter,
  mark,
  index,
  size,
  palette,
}: {
  letter: string;
  mark?: Mark;
  index: number;
  size: number;
  palette: Palette;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(!!mark);

  useEffect(() => {
    if (!letter || mark) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
  }, [letter, mark, scale]);

  useEffect(() => {
    if (!mark) {
      setShown(false);
      return;
    }
    const half = setTimeout(() => setShown(true), index * STEP + 140);
    Animated.sequence([
      Animated.delay(index * STEP),
      Animated.timing(scale, { toValue: 0.2, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
    return () => clearTimeout(half);
  }, [mark, index, scale]);

  const revealed = mark && shown;
  const color = revealed ? palette[mark] : undefined;
  return (
    <MotionBlock
      scale={scale}
      w={size}
      h={size}
      justify="center"
      align="center"
      borderWidth={revealed ? 0 : 2}
      borderColor={letter ? palette.filled : palette.empty}
      bg={color ?? palette.background}
    >
      <Text c={revealed ? '#FFFFFF' : palette.ink} fw="bold" size={Math.round(size * 0.5)} tt="uppercase">
        {letter}
      </Text>
    </MotionBlock>
  );
}

function Row({
  guess,
  answer,
  size,
  palette,
  shake,
}: {
  guess: string;
  answer?: string;
  size: number;
  palette: Palette;
  shake?: number;
}) {
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!shake) return;
    Animated.sequence(
      [-8, 8, -6, 6, -3, 0].map((toValue) => Animated.timing(offset, { toValue, duration: 50, useNativeDriver: true })),
    ).start();
  }, [shake, offset]);
  const rowMarks = answer ? marks(guess, answer) : [];
  return (
    <MotionBlock translateX={offset} direction="row" gap={GAP}>
      {Array.from({ length: COLS }, (_, col) => (
        <Tile key={col} index={col} letter={guess[col] ?? ''} mark={rowMarks[col]} size={size} palette={palette} />
      ))}
    </MotionBlock>
  );
}

function Key({
  label,
  mark,
  palette,
  onPress,
}: {
  label: string;
  mark?: Mark;
  palette: Palette;
  onPress: (key: string) => void;
}) {
  const wide = label === 'ENTER' || label === 'BACK';
  return (
    <Block
      flex={wide ? 1.5 : 1}
      h={58}
      radius={6}
      justify="center"
      align="center"
      bg={mark ? palette[mark] : palette.key}
      pressedStyle={{ opacity: 0.7 }}
      onPress={() => onPress(label)}
      role="button"
      aria-label={label === 'BACK' ? 'Backspace' : label === 'ENTER' ? 'Enter' : label}
    >
      {label === 'BACK' ? (
        <IconBackspace size={24} color={palette.ink} />
      ) : (
        <Text c={mark ? '#FFFFFF' : palette.ink} fw="bold" size={wide ? 12 : 18}>
          {label}
        </Text>
      )}
    </Block>
  );
}

function Message({ toast, palette }: { toast: Toast | null; palette: Palette }) {
  const [visible, setVisible] = useState<Toast | null>(null);
  useEffect(() => {
    if (!toast?.text) {
      setVisible(null);
      return;
    }
    const show = setTimeout(() => setVisible(toast), toast.delay);
    const hide = setTimeout(() => setVisible(null), toast.delay + 1600);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [toast]);
  if (!visible) return null;
  return (
    <Block position="absolute" top={12} left={0} right={0} align="center" zIndex={10} pointerEvents="none">
      <Block bg={palette.toast} px={16} py={12} radius={6} shadow="md">
        <Text c={palette.toastInk} fw="bold" size={15}>
          {visible.text}
        </Text>
      </Block>
    </Block>
  );
}

export default function App() {
  const system = useColorScheme();
  const [dark, setDark] = useState(system === 'dark');
  const palette = dark ? DARK : LIGHT;
  const [state, dispatch] = useReducer(reducer, undefined, fresh);
  const [board, setBoard] = useState({ w: 0, h: 0 });
  const [revealed, setRevealed] = useState(0);
  const [ended, setEnded] = useState(false);

  // Keyboard colors and the end panel wait for the tile reveal to finish.
  useEffect(() => {
    if (state.guesses.length <= revealed) {
      setRevealed(state.guesses.length);
      return;
    }
    const id = setTimeout(() => setRevealed(state.guesses.length), REVEAL);
    return () => clearTimeout(id);
  }, [state.guesses.length, revealed]);
  useEffect(() => {
    if (state.status === 'playing') {
      setEnded(false);
      return;
    }
    const id = setTimeout(() => setEnded(true), REVEAL + 900);
    return () => clearTimeout(id);
  }, [state.status]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Capture phase, so Enter types into the game even while a header button has focus.
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key =
        event.key === 'Enter' ? 'ENTER' : event.key === 'Backspace' ? 'BACK' : /^[a-z]$/i.test(event.key) ? event.key.toUpperCase() : null;
      if (!key) return;
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: 'key', key });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const keyMarks: Record<string, Mark> = {};
  state.guesses.slice(0, revealed).forEach((guess) =>
    marks(guess, state.answer).forEach((mark, i) => {
      const prev = keyMarks[guess[i]];
      if (!prev || RANK[mark] > RANK[prev]) keyMarks[guess[i]] = mark;
    }),
  );

  const size = Math.floor(
    Math.max(0, Math.min((board.w - GAP * (COLS - 1)) / COLS, (board.h - GAP * (ROWS - 1)) / ROWS, 72)),
  );
  const press = (key: string) => dispatch({ type: 'key', key });
  const onBoardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoard({ w: width, h: height });
  };

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: dark ? 'dark' : 'light' }}>
        <SafeArea gap={0} flex={1} bg={palette.background}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          <Block
            direction="row"
            align="center"
            justify="space-between"
            h={52}
            px={12}
            borderBottomWidth={1}
            borderBottomColor={palette.empty}
          >
            <Block
              w={40}
              h={40}
              radius="full"
              justify="center"
              align="center"
              onPress={() => dispatch({ type: 'new' })}
              role="button"
              aria-label="New puzzle"
            >
              <IconRefresh size={22} color={palette.ink} />
            </Block>
            <Text c={palette.ink} fw="bold" size={26} ff="Georgia, serif" lts={0.5}>
              Lettergrid
            </Text>
            <Block
              w={40}
              h={40}
              radius="full"
              justify="center"
              align="center"
              onPress={() => setDark((value) => !value)}
              role="button"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
            >
              {dark ? <IconSun size={22} color={palette.ink} /> : <IconMoon size={22} color={palette.ink} />}
            </Block>
          </Block>

          <Block flex={1} w="100%" maw={500} alignSelf="center" px={16} py={12} position="relative">
            <Message toast={state.toast} palette={palette} />
            <Block flex={1} justify="center" align="center" onLayout={onBoardLayout}>
              {size > 0 && (
                <Block gap={GAP}>
                  {Array.from({ length: ROWS }, (_, row) => {
                    const submitted = state.guesses[row];
                    const active = row === state.guesses.length && state.status === 'playing';
                    return (
                      <Row
                        key={`${state.answer}-${row}`}
                        guess={submitted ?? (active ? state.current : '')}
                        answer={submitted ? state.answer : undefined}
                        size={size}
                        palette={palette}
                        shake={active ? state.shake : 0}
                      />
                    );
                  })}
                </Block>
              )}
            </Block>
          </Block>

          {/* Fixed to the keyboard's height (3 × 58 keys, 2 × 8 gaps, 12 padding) so the board doesn't move when the end panel swaps in. */}
          <Block w="100%" maw={500} alignSelf="center" px={8} pb={12} gap={8} h={KEYBOARD_HEIGHT} justify="center">
            {ended ? (
              <Block align="center" gap={6} px={8}>
                <Text c={palette.muted} fw="bold" size={12} lts={1.5}>
                  {state.status === 'won' ? `SOLVED IN ${state.guesses.length}/${ROWS}` : 'OUT OF GUESSES'}
                </Text>
                <Text c={palette.ink} fw="bold" size={28}>
                  {state.answer}
                </Text>
                <Block mt={10} w="100%" maw={280}>
                  <Button
                    title="New puzzle"
                    onPress={() => dispatch({ type: 'new' })}
                    variant="filled"
                    color={palette.correct}
                    textColor="#FFFFFF"
                    radius="full"
                    size="lg"
                    fullWidth
                  />
                </Block>
              </Block>
            ) : (
              KEY_ROWS.map((row) => (
                <Block key={row} direction="row" gap={6} px={row.startsWith('A') ? 18 : 0}>
                  {row.split(row.includes(' ') ? ' ' : '').flatMap((part) =>
                    part === 'ENTER' || part === 'BACK' ? [part] : part.split(''),
                  ).map((key) => (
                    <Key key={key} label={key} mark={keyMarks[key]} palette={palette} onPress={press} />
                  ))}
                </Block>
              ))
            )}
          </Block>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
