import { Block, Text } from '@plocks/ui-snack';
import type { Team } from '../data';
import { C } from '../theme';

export function TeamMark({ team, size = 42 }: { team: Team; size?: number }) {
  return <Block w={size} h={size} radius="full" bg={C.panelRaised} borderWidth={2} borderColor={team.color}
    flex align="center" justify="center" accessibilityLabel={team.name}>
    <Text c={team.color} size={size < 36 ? 10 : 13} fw="bold">{team.code}</Text>
  </Block>;
}
