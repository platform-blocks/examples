import { Badge, Button, Card, Column, Row, Text } from '@plocks/ui';
import { TEAMS, type Fixture } from '../data';
import { C } from '../theme';
import { TeamMark } from './TeamMark';

export function FixtureCard({ fixture }: { fixture: Fixture }) {
  const away = TEAMS[fixture.away], home = TEAMS[fixture.home];
  return <Card bg={C.panel} borderColor={C.line} borderWidth={1} radius="lg" padding="lg" style={{ width: '100%' }}>
    <Column gap="md">
      <Row justify="space-between" align="center" style={{ width: '100%' }}><Text c={C.muted} size={12}>{fixture.note}</Text><Badge color={fixture.status === 'final' ? C.muted : C.gold} variant="light">{fixture.status === 'final' ? 'FINAL' : 'UPCOMING'}</Badge></Row>
      <Row align="center" gap="sm" style={{ width: '100%' }}><TeamMark team={away} size={32} /><Text c={C.ink} fw="bold" style={{ flex: 1 }}>{away.name}</Text><Text c={C.ink} size={22} fw="bold">{fixture.awayScore ?? '–'}</Text></Row>
      <Row align="center" gap="sm" style={{ width: '100%' }}><TeamMark team={home} size={32} /><Text c={C.ink} fw="bold" style={{ flex: 1 }}>{home.name}</Text><Text c={C.ink} size={22} fw="bold">{fixture.homeScore ?? '–'}</Text></Row>
    </Column>
  </Card>;
}
