import { useState } from 'react';
import { Button, Column, Row, SegmentedControl, Text, Title } from '@plocks/ui-snack';
import { DEMO_SLATE, EARLIER, NEXT } from '../data';
import type { GameState } from '../game/types';
import { C } from '../theme';
import { FixtureCard } from '../components/FixtureCard';
import { Scoreboard } from '../components/Scoreboard';

export function ScoresScreen({ game, onOpenGame }: { game: GameState; onOpenGame: () => void }) {
  const [slate, setSlate] = useState('demo');
  const fixtures = slate === 'earlier' ? EARLIER : slate === 'next' ? NEXT : DEMO_SLATE;
  return <Column gap="lg">
    <Column gap="xs"><Text c={C.red} size={11} fw="bold" lts={2}>SCOREBOARD</Text><Title order={1} style={{ color: C.ink }}>Games</Title><Text c={C.muted}>Follow the demo matchup and browse the fictional league.</Text></Column>
    <SegmentedControl data={[{ value: 'earlier', label: 'Earlier' }, { value: 'demo', label: 'Demo slate' }, { value: 'next', label: 'Next' }]} value={slate} onChange={setSlate} color={C.red} fullWidth />
    {slate === 'demo' && <Column gap="sm"><Row justify="space-between" align="center"><Text c={C.ink} size={18} fw="bold">Featured matchup</Text><Text c={C.red} fw="bold" size={11}>{game.status === 'live' ? '● LIVE SIMULATION' : 'FINAL'}</Text></Row>
      <Scoreboard game={game} compact />
      <Row wrap="wrap" align="center" justify="space-between"><Text c={C.muted} size={12}>Harbor Park · fictional teams</Text><Button title="Open Gamecast" size="sm" color={C.red} variant="filled" onPress={onOpenGame} /></Row>
    </Column>}
    <Column gap="md"><Text c={C.ink} size={18} fw="bold">{slate === 'demo' ? 'Around the league' : slate === 'earlier' ? 'Earlier results' : 'Next games'}</Text>
      {fixtures.map(fixture => <FixtureCard key={fixture.id} fixture={fixture} />)}
    </Column>
    <Text c={C.muted} size={11}>All teams, results, and schedules shown here are sample data.</Text>
  </Column>;
}
