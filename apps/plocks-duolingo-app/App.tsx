import { useState } from 'react';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Label, Panel, Stat, type Palette } from '../example-common/ExampleUI';

const P: Palette = { background: '#F5FCF0', surface: '#FFFFFF', ink: '#28413B', muted: '#6B8179', accent: '#58A72E', border: '#D6E9CC' };
const QUESTIONS = [
  { prompt: 'Choose the Spanish word for “apple”.', options: ['manzana', 'perro', 'casa'], answer: 0, note: 'Manzana means apple.' },
  { prompt: 'What does “hola” mean?', options: ['goodbye', 'hello', 'please'], answer: 1, note: 'Hola is a friendly hello.' },
  { prompt: 'Choose the Spanish word for “water”.', options: ['libro', 'sol', 'agua'], answer: 2, note: 'Agua means water.' },
  { prompt: 'What does “gracias” mean?', options: ['thank you', 'morning', 'friend'], answer: 0, note: 'Gracias means thank you.' },
];
export default function App() {
  const [index, setIndex] = useState(0), [choice, setChoice] = useState<number | null>(null), [score, setScore] = useState(0);
  const done = index >= QUESTIONS.length; const question = QUESTIONS[index];
  function next() { if (choice === null) return; if (choice === question.answer) setScore(x => x+1); setIndex(x => x+1); setChoice(null); }
  function reset() { setIndex(0); setChoice(null); setScore(0); }
  return <ExampleApp name="Language Lesson" subtitle="A Duolingo-style beginner Spanish quiz." palette={P}>
    <Panel palette={P}><Actions><Stat label="PROGRESS" value={`${Math.min(index, QUESTIONS.length)} / ${QUESTIONS.length}`} palette={P} /><Stat label="CORRECT" value={String(score)} palette={P} /></Actions></Panel>
    {done ? <Panel palette={P}><Text c={P.ink} fw="bold" size={29}>Lesson complete! 🎉</Text><Text c={P.muted}>You got {score} of {QUESTIONS.length} right.</Text><Action title="Practice again" palette={P} onPress={reset} /></Panel> : <Panel palette={P}><Label palette={P}>QUESTION {index + 1}</Label><Text c={P.ink} fw="bold" size={25}>{question.prompt}</Text>
      {question.options.map((option,i) => <Action key={option} title={option} palette={P} outline={choice !== i} onPress={() => { if (choice === null) setChoice(i); }} />)}
      {choice !== null && <Text c={choice === question.answer ? P.accent : '#B34F3E'} fw="bold">{choice === question.answer ? 'Correct!' : question.note}</Text>}
      <Action title="Continue" palette={P} disabled={choice === null} onPress={next} /></Panel>}
    <Text c={P.muted} size={12}>A short, original practice set. Progress is local to this session.</Text>
  </ExampleApp>;
}
