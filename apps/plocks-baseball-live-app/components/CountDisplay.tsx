import { Block, Column, Row, Text } from '@plocks/ui';
import { C } from '../theme';

function Dots({ count, total, color }: { count: number; total: number; color: string }) {
  return <Row gap={5}>{Array.from({ length: total }, (_, index) => <Block key={index} w={11} h={11} radius="full" bg={index < count ? color : C.line} />)}</Row>;
}
export function CountDisplay({ balls, strikes, outs }: { balls: number; strikes: number; outs: number }) {
  return <Row gap="xl" wrap="wrap" align="center">
    <Column gap={5} fullWidth={false}><Text c={C.muted} size={10} fw="bold">BALLS</Text><Dots count={balls} total={3} color={C.grass} /></Column>
    <Column gap={5} fullWidth={false}><Text c={C.muted} size={10} fw="bold">STRIKES</Text><Dots count={strikes} total={2} color={C.gold} /></Column>
    <Column gap={5} fullWidth={false}><Text c={C.muted} size={10} fw="bold">OUTS</Text><Dots count={outs} total={2} color={C.red} /></Column>
  </Row>;
}
