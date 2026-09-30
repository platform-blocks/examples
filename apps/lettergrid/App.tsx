import { useState } from 'react';
import type { ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Block,
  Button,
  Card,
  Column,
  Input,
  PlocksProvider,
  SafeArea,
  ScrollArea,
  Text,
  Title,
} from '@plocks/ui';

type Palette = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  border: string;
};

function AppFrame({
  name,
  subtitle,
  palette,
  children,
  dark = false,
  showHeader = true,
}: {
  name: string;
  subtitle: string;
  palette: Palette;
  children: ReactNode;
  dark?: boolean;
  showHeader?: boolean;
}) {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: dark ? 'dark' : 'light' }}>
        <SafeArea gap={0} flex={1} bg={palette.background}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          <ScrollArea
            contentProps={{ w: '100%', maw: 720, alignSelf: 'center', p: 20, pb: 64, gap: 18 }}
          >
            {showHeader && (
              <Column gap="xs">
                <Text c={palette.accent} size={11} fw="bold" lts={2}>
                  PLOCKS EXAMPLE
                </Text>
                <Title order={1} c={palette.ink} size={34}>
                  {name}
                </Title>
                <Text c={palette.muted}>{subtitle}</Text>
              </Column>
            )}
            {children}
          </ScrollArea>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}

function Panel({
  children,
  palette,
  onPress,
}: {
  children: ReactNode;
  palette: Palette;
  onPress?: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      bg={palette.surface}
      borderColor={palette.border}
      borderWidth={1}
      radius="lg"
      padding="lg"
    >
      <Column gap="sm">{children}</Column>
    </Card>
  );
}

function Action({
  title,
  palette,
  onPress,
  outline = false,
  disabled = false,
}: {
  title: string;
  palette: Palette;
  onPress: () => void;
  outline?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      title={title}
      onPress={onPress}
      disabled={disabled}
      size="sm"
      variant={outline ? 'outline' : 'filled'}
      color={palette.accent}
      textColor={outline ? palette.accent : palette.background}
    />
  );
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <Block direction="row" wrap="wrap" align="center" gap={8}>
      {children}
    </Block>
  );
}

const P: Palette = {
  background: '#F6F6F3',
  surface: '#FFFFFF',
  ink: '#202124',
  muted: '#6D7275',
  accent: '#538D4E',
  border: '#D9DCE0',
};
const WORDS = ['PLANT', 'LIGHT', 'STONE', 'BREAD', 'TRAIN', 'OCEAN', 'MUSIC'];
const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
function marks(guess: string, answer: string) {
  const result = Array(5).fill('absent') as string[];
  const pool = answer.split('');
  for (let i = 0; i < 5; i++)
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
      pool[i] = '';
    }
  for (let i = 0; i < 5; i++)
    if (result[i] !== 'correct') {
      const index = pool.indexOf(guess[i]);
      if (index >= 0) {
        result[i] = 'present';
        pool[index] = '';
      }
    }
  return result;
}
export default function App() {
  const [answer, setAnswer] = useState(pick);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState('Guess the five-letter word in six tries.');
  const won = guesses.includes(answer),
    ended = won || guesses.length === 6;
  function submit() {
    const word = guess.trim().toUpperCase();
    if (word.length !== 5 || !/^[A-Z]{5}$/.test(word)) {
      setMessage('Enter exactly five letters.');
      return;
    }
    setGuesses((old) => [...old, word]);
    setGuess('');
    setMessage(
      word === answer
        ? 'You got it!'
        : guesses.length === 5
          ? `The word was ${answer}.`
          : 'Keep trying.',
    );
  }
  function reset() {
    setAnswer(pick());
    setGuess('');
    setGuesses([]);
    setMessage('New puzzle ready.');
  }
  return (
    <AppFrame name="Lettergrid" subtitle="A small word puzzle with familiar color clues." palette={P}>
      <Panel palette={P}>
        <Text c={P.ink}>{message}</Text>
      </Panel>
      <Block gap={6} align="center">
        {Array.from({ length: 6 }, (_, row) => (
          <Block key={row} direction="row" gap={6}>
            {Array.from({ length: 5 }, (_, col) => {
              const letter =
                guesses[row]?.[col] ??
                (row === guesses.length && !ended ? guess.toUpperCase()[col] : '') ??
                '';
              const mark = guesses[row] ? marks(guesses[row], answer)[col] : '';
              const bg =
                mark === 'correct'
                  ? '#538D4E'
                  : mark === 'present'
                    ? '#B59F3B'
                    : mark
                      ? '#787C7E'
                      : P.surface;
              return (
                <Block
                  gap={0}
                  key={col}
                  w={51}
                  h={51}
                  justify="center"
                  align="center"
                  borderWidth={2}
                  borderColor={mark ? bg : P.border}
                  bg={bg}
                >
                  <Text c={mark ? '#FFF' : P.ink} fw="bold" size={24}>
                    {letter}
                  </Text>
                </Block>
              );
            })}
          </Block>
        ))}
      </Block>
      {!ended && (
        <Actions>
          <Block gap={0} flex={1} miw={190}>
            <Input
              label="Your guess"
              value={guess}
              maxLength={5}
              autoCapitalize="characters"
              onChangeText={setGuess}
            />
          </Block>
          <Action title="Guess" palette={P} onPress={submit} />
        </Actions>
      )}
      <Action title="New puzzle" palette={P} outline onPress={reset} />
    </AppFrame>
  );
}
