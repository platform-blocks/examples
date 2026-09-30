import { Block, Badge, Card, Column, Text } from '@plocks/ui';
import { TEAMS, type Fixture } from '../data';
import { C } from '../theme';
import { TeamMark } from './TeamMark';

export function FixtureCard({ fixture }: { fixture: Fixture }) {
  const away = TEAMS[fixture.away],
    home = TEAMS[fixture.home];
  return (
    <Card bg={C.panel} borderColor={C.line} borderWidth={1} radius="lg" padding="lg" w="100%">
      <Column gap="md">
        <Block justify="space-between" align="center" direction="row" w="100%">
          <Text c={C.muted} size={12}>
            {fixture.note}
          </Text>
          <Badge color={fixture.status === 'final' ? C.muted : C.gold} variant="light">
            {fixture.status === 'final' ? 'FINAL' : 'UPCOMING'}
          </Badge>
        </Block>
        <Block align="center" gap="sm" direction="row" w="100%">
          <TeamMark team={away} size={32} />
          <Text c={C.ink} fw="bold" flex={1}>
            {away.name}
          </Text>
          <Text c={C.ink} size={22} fw="bold">
            {fixture.awayScore ?? '–'}
          </Text>
        </Block>
        <Block align="center" gap="sm" direction="row" w="100%">
          <TeamMark team={home} size={32} />
          <Text c={C.ink} fw="bold" flex={1}>
            {home.name}
          </Text>
          <Text c={C.ink} size={22} fw="bold">
            {fixture.homeScore ?? '–'}
          </Text>
        </Block>
      </Column>
    </Card>
  );
}
