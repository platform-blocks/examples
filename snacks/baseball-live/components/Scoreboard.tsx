import { Badge, Column, Divider, Row, Text } from '@plocks/ui-snack';
import { AWAY, HOME } from '../data';
import { halfLabel } from '../game/engine';
import type { GameState } from '../game/types';
import { C } from '../theme';
import { Panel } from './Panel';
import { TeamMark } from './TeamMark';

export function Scoreboard({ game, compact = false }: { game: GameState; compact?: boolean }) {
  const status = game.status === 'final' ? 'FINAL' : `${halfLabel(game.half).toUpperCase()} ${game.inning}`;
  return <Panel eyebrow="Demo league · Game 01" action={<Badge color={game.status === 'live' ? C.red : C.muted} variant="light">{status}</Badge>}>
    <Column gap="sm">
      <TeamRow team={AWAY} score={game.away} record={`${AWAY.wins}-${AWAY.losses}`} compact={compact} />
      <Divider color={C.line} />
      <TeamRow team={HOME} score={game.home} record={`${HOME.wins}-${HOME.losses}`} compact={compact} />
    </Column>
  </Panel>;
}

function TeamRow({ team, score, record, compact }: { team: typeof AWAY; score: number; record: string; compact: boolean }) {
  return <Row align="center" gap="md" style={{ width: '100%' }}>
    <TeamMark team={team} size={compact ? 36 : 44} />
    <Column gap={0} style={{ flex: 1 }}>
      <Text c={C.ink} size={compact ? 15 : 19} fw="bold">{team.name}</Text>
      <Text c={C.muted} size={11}>{record} · {team.code}</Text>
    </Column>
    <Text c={C.ink} size={compact ? 27 : 35} fw="bold">{score}</Text>
  </Row>;
}
