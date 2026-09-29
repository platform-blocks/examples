import { useState } from 'react';
import { Column, Row, SegmentedControl, Text, Title } from '@plocks/ui-snack';
import { TEAMS, type Team } from '../data';
import { C } from '../theme';
import { Panel } from '../components/Panel';
import { TeamMark } from '../components/TeamMark';

const DIVISIONS: Record<string, Team[]> = {
  Coast: [TEAMS.HBR, TEAMS.CTY, TEAMS.BAY],
  Inland: [TEAMS.DSR, TEAMS.MNT, TEAMS.RIV],
};
export function StandingsScreen() {
  const [division, setDivision] = useState('Coast');
  const teams = [...DIVISIONS[division]].sort((a, b) => b.wins - a.wins);
  const leader = teams[0];
  return <Column gap="lg">
    <Column gap="xs"><Text c={C.red} size={11} fw="bold" lts={2}>DEMO LEAGUE</Text><Title order={1} style={{ color: C.ink }}>Standings</Title><Text c={C.muted}>A sample league table to round out the game day experience.</Text></Column>
    <SegmentedControl data={['Coast', 'Inland']} value={division} onChange={setDivision} color={C.red} fullWidth />
    <Panel eyebrow={`${division} division`} title="League table">
      <Row align="center" gap="sm" style={{ width: '100%' }}><Text c={C.muted} size={10} style={{ width: 32 }}>#</Text><Text c={C.muted} size={10} style={{ flex: 1 }}>CLUB</Text><Text c={C.muted} size={10} style={{ width: 37, textAlign: 'right' }}>W</Text><Text c={C.muted} size={10} style={{ width: 37, textAlign: 'right' }}>L</Text><Text c={C.muted} size={10} style={{ width: 42, textAlign: 'right' }}>GB</Text></Row>
      {teams.map((team, index) => {
        const gamesBack = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
        return <Row key={team.code} align="center" gap="sm" style={{ width: '100%', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line }}>
          <Text c={C.muted} size={13} style={{ width: 32 }}>{index + 1}</Text><TeamMark team={team} size={32} /><Text c={C.ink} fw="bold" size={13} style={{ flex: 1 }}>{team.name}</Text>
          <Text c={C.ink} size={13} style={{ width: 37, textAlign: 'right' }}>{team.wins}</Text><Text c={C.ink} size={13} style={{ width: 37, textAlign: 'right' }}>{team.losses}</Text><Text c={C.muted} size={13} style={{ width: 42, textAlign: 'right' }}>{index === 0 ? '—' : gamesBack.toFixed(1)}</Text>
        </Row>;
      })}
    </Panel>
    <Text c={C.muted} size={11}>Records are illustrative and do not update with the pitch simulation.</Text>
  </Column>;
}
