import { Block, Column, Row, Text } from '@plocks/ui';
import type { Bases } from '../game/types';
import { C } from '../theme';

function Base({ active, x, y, label }: { active: boolean; x: number; y: number; label: string }) {
  return (
    <Block
      position="absolute"
      left={x}
      top={y}
      w={20}
      h={20}
      bg={active ? C.gold : C.base}
      borderWidth={2}
      borderColor={active ? C.gold : C.ink}
      rotate="45deg"
      accessibilityLabel={`${label} base ${active ? 'occupied' : 'empty'}`}
    />
  );
}

export function FieldDiamond({ bases }: { bases: Bases }) {
  return (
    <Column gap="xs" align="center" fullWidth={false}>
      <Block
        w={260}
        h={205}
        bg={C.grassDeep}
        radius="lg"
        borderWidth={1}
        borderColor={C.line}
        position="relative"
        overflow="hidden"
      >
        <Block
          position="absolute"
          left={71}
          top={37}
          w={118}
          h={118}
          bg={C.grass}
          borderWidth={2}
          borderColor="#6AB68B"
          rotate="45deg"
        />
        <Block position="absolute" left={107} top={72} w={46} h={46} bg="#B48A62" radius="full" />
        <Base active={bases[1]} x={120} y={35} label="Second" />
        <Base active={bases[2]} x={42} y={113} label="Third" />
        <Base active={bases[0]} x={198} y={113} label="First" />
        <Base active={false} x={120} y={168} label="Home" />
        <Block position="absolute" left={117} top={90} w={26} h={26} bg={C.base} radius="full" />
      </Block>
      <Row gap="md" align="center">
        <Text c={C.gold} size={11}>
          ◆
        </Text>
        <Text c={C.muted} size={11}>
          Gold bases have runners on.
        </Text>
      </Row>
    </Column>
  );
}
