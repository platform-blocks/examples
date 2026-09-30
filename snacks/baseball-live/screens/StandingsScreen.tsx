import { useState } from 'react';
import { Block, Column, SegmentedControl, Text, Title } from '@plocks/ui-snack';
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
  return (
    <Column gap="lg">
      <Column gap="xs">
        <Text c={C.red} size={11} fw="bold" lts={2}>
          DEMO LEAGUE
        </Text>
        <Title order={1} c={C.ink}>
          Standings
        </Title>
        <Text c={C.muted}>A sample league table to round out the game day experience.</Text>
      </Column>
      <SegmentedControl data={['Coast', 'Inland']} value={division} onChange={setDivision} color={C.red} fullWidth />
      <Panel eyebrow={`${division} division`} title="League table">
        <Block align="center" gap="sm" direction="row" w="100%">
          <Text c={C.muted} size={10} w={32}>
            #
          </Text>
          <Text c={C.muted} size={10} flex={1}>
            CLUB
          </Text>
          <Text c={C.muted} size={10} w={37} ta="right">
            W
          </Text>
          <Text c={C.muted} size={10} w={37} ta="right">
            L
          </Text>
          <Text c={C.muted} size={10} w={42} ta="right">
            GB
          </Text>
        </Block>
        {teams.map((team, index) => {
          const gamesBack = (leader.wins - team.wins + (team.losses - leader.losses)) / 2;
          return (
            <Block
              key={team.code}
              align="center"
              gap="sm"
              direction="row"
              w="100%"
              py={10}
              borderTopWidth={1}
              borderTopColor={C.line}
            >
              <Text c={C.muted} size={13} w={32}>
                {index + 1}
              </Text>
              <TeamMark team={team} size={32} />
              <Text c={C.ink} fw="bold" size={13} flex={1}>
                {team.name}
              </Text>
              <Text c={C.ink} size={13} w={37} ta="right">
                {team.wins}
              </Text>
              <Text c={C.ink} size={13} w={37} ta="right">
                {team.losses}
              </Text>
              <Text c={C.muted} size={13} w={42} ta="right">
                {index === 0 ? '—' : gamesBack.toFixed(1)}
              </Text>
            </Block>
          );
        })}
      </Panel>
      <Text c={C.muted} size={11}>
        Records are illustrative and do not update with the pitch simulation.
      </Text>
    </Column>
  );
}
