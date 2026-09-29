import { useState } from 'react';
import { View } from 'react-native';
import { Text, Input } from '@plocks/ui';
import { Action, Actions, ExampleApp, Panel, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#F6F6F3', surface: '#FFFFFF', ink: '#202124', muted: '#6D7275', accent: '#538D4E', border: '#D9DCE0' };
const WORDS = ['PLANT', 'LIGHT', 'STONE', 'BREAD', 'TRAIN', 'OCEAN', 'MUSIC'];
const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
function marks(guess: string, answer: string) {
  const result = Array(5).fill('absent') as string[];
  const pool = answer.split('');
  for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) { result[i] = 'correct'; pool[i] = ''; }
  for (let i = 0; i < 5; i++) if (result[i] !== 'correct') {
    const index = pool.indexOf(guess[i]); if (index >= 0) { result[i] = 'present'; pool[index] = ''; }
  }
  return result;
}
export default function App() {
  const [answer, setAnswer] = useState(pick);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState('Guess the five-letter word in six tries.');
  const won = guesses.includes(answer), ended = won || guesses.length === 6;
  function submit() {
    const word = guess.trim().toUpperCase();
    if (word.length !== 5 || !/^[A-Z]{5}$/.test(word)) { setMessage('Enter exactly five letters.'); return; }
    setGuesses(old => [...old, word]); setGuess('');
    setMessage(word === answer ? 'You got it!' : guesses.length === 5 ? `The word was ${answer}.` : 'Keep trying.');
  }
  function reset() { setAnswer(pick()); setGuess(''); setGuesses([]); setMessage('New puzzle ready.'); }
  return <ExampleApp name="Wordle" subtitle="A small word puzzle with familiar color clues." palette={P}>
    <Panel palette={P}><Text c={P.ink}>{message}</Text></Panel>
    <View style={{ gap: 6, alignItems: 'center' }}>{Array.from({ length: 6 }, (_, row) => <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: 5 }, (_, col) => { const letter = guesses[row]?.[col] ?? (row === guesses.length && !ended ? guess.toUpperCase()[col] : '') ?? '';
        const mark = guesses[row] ? marks(guesses[row], answer)[col] : '';
        const bg = mark === 'correct' ? '#538D4E' : mark === 'present' ? '#B59F3B' : mark ? '#787C7E' : P.surface;
        return <View key={col} style={{ width: 51, height: 51, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: mark ? bg : P.border, backgroundColor: bg }}><Text c={mark ? '#FFF' : P.ink} fw="bold" size={24}>{letter}</Text></View>;
      })}</View>)}</View>
    {!ended && <Actions><View style={{ flex: 1, minWidth: 190 }}><Input label="Your guess" value={guess} maxLength={5} autoCapitalize="characters" onChangeText={setGuess} /></View><Action title="Guess" palette={P} onPress={submit} /></Actions>}
    <Action title="New puzzle" palette={P} outline onPress={reset} />
  </ExampleApp>;
}
