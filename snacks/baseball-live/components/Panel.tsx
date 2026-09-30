import type { ReactNode } from 'react';
import { Block, Card, Column, Row, Text } from '@plocks/ui-snack';
import { C } from '../theme';

export function Panel({
  title,
  eyebrow,
  action,
  children,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card bg={C.panel} borderColor={C.line} borderWidth={1} radius="lg" padding="lg" w="100%">
      <Column gap="md">
        {(title || eyebrow || action) && (
          <Row align="center" justify="space-between" wrap="wrap" gap="sm">
            <Column gap={2} fullWidth={false}>
              {eyebrow && (
                <Text c={C.red} size={10} fw="bold" lts={2}>
                  {eyebrow.toUpperCase()}
                </Text>
              )}
              {title && (
                <Text c={C.ink} size={20} fw="bold">
                  {title}
                </Text>
              )}
            </Column>
            {action}
          </Row>
        )}
        {children}
      </Column>
    </Card>
  );
}

export function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Block gap={2} fullWidth={false} direction="column" miw={72}>
      <Text c={C.muted} size={10} fw="bold" lts={1.2}>
        {label.toUpperCase()}
      </Text>
      <Text c={accent ? C.gold : C.ink} size={20} fw="bold">
        {value}
      </Text>
    </Block>
  );
}
