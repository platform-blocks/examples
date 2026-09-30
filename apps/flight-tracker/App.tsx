import { useState } from 'react';
import type { ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Block,
  Button,
  Card,
  Column,
  Input,
  PlocksProvider,
  SafeArea,
  ScrollArea,
  Text,
  Title,
} from '@plocks/ui';

type Palette = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  border: string;
};

function AppFrame({
  name,
  subtitle,
  palette,
  children,
  dark = false,
  showHeader = true,
}: {
  name: string;
  subtitle: string;
  palette: Palette;
  children: ReactNode;
  dark?: boolean;
  showHeader?: boolean;
}) {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: dark ? 'dark' : 'light' }}>
        <SafeArea gap={0} flex={1} bg={palette.background}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          <ScrollArea
            contentProps={{ w: '100%', maw: 720, alignSelf: 'center', p: 20, pb: 64, gap: 18 }}
          >
            {showHeader && (
              <Column gap="xs">
                <Text c={palette.accent} size={11} fw="bold" lts={2}>
                  PLOCKS EXAMPLE
                </Text>
                <Title order={1} c={palette.ink} size={34}>
                  {name}
                </Title>
                <Text c={palette.muted}>{subtitle}</Text>
              </Column>
            )}
            {children}
          </ScrollArea>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}

function Panel({
  children,
  palette,
  onPress,
}: {
  children: ReactNode;
  palette: Palette;
  onPress?: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      bg={palette.surface}
      borderColor={palette.border}
      borderWidth={1}
      radius="lg"
      padding="lg"
    >
      <Column gap="sm">{children}</Column>
    </Card>
  );
}

function Action({
  title,
  palette,
  onPress,
  outline = false,
  disabled = false,
}: {
  title: string;
  palette: Palette;
  onPress: () => void;
  outline?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      title={title}
      onPress={onPress}
      disabled={disabled}
      size="sm"
      variant={outline ? 'outline' : 'filled'}
      color={palette.accent}
      textColor={outline ? palette.accent : palette.background}
    />
  );
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <Block direction="row" wrap="wrap" align="center" gap={8}>
      {children}
    </Block>
  );
}

function Label({ children, palette }: { children: ReactNode; palette: Palette }) {
  return (
    <Text c={palette.muted} size={11} fw="bold" lts={1.2}>
      {children}
    </Text>
  );
}

function Stat({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return (
    <Block gap={0} miw={100} grow={1}>
      <Label palette={palette}>{label}</Label>
      <Text c={palette.ink} size={22} fw="bold">
        {value}
      </Text>
    </Block>
  );
}

const P: Palette = {
  background: '#EFF5FA',
  surface: '#FFFFFF',
  ink: '#163149',
  muted: '#60788A',
  accent: '#2377B8',
  border: '#D3E2ED',
};
const FLIGHTS = [
  {
    number: 'PB102',
    from: 'PHX',
    to: 'SEA',
    origin: 'Phoenix',
    destination: 'Seattle',
    depart: '09:20',
    arrive: '12:10',
    status: 'In air',
    progress: 0.62,
    gate: 'A12',
  },
  {
    number: 'PB218',
    from: 'JFK',
    to: 'LAX',
    origin: 'New York',
    destination: 'Los Angeles',
    depart: '11:45',
    arrive: '15:05',
    status: 'Boarding',
    progress: 0.08,
    gate: 'B7',
  },
  {
    number: 'PB340',
    from: 'SFO',
    to: 'DEN',
    origin: 'San Francisco',
    destination: 'Denver',
    depart: '14:15',
    arrive: '17:48',
    status: 'Scheduled',
    progress: 0,
    gate: 'C21',
  },
];
export default function App() {
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState<string | null>(null);
  const flight = FLIGHTS.find((f) => f.number === selected);
  const shown = FLIGHTS.filter((f) =>
    `${f.number} ${f.from} ${f.to} ${f.origin} ${f.destination}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <AppFrame name="Flight Tracker" subtitle="Explore sample routes and flight status." palette={P}>
      <Panel palette={P}>
        <Input
          variant="outline"
          value={query}
          onChangeText={setQuery}
          placeholder="Flight number or airport"
          accessibilityLabel="Search flights"
          autoCapitalize="characters"
          mb={0}
          radius={9}
          inputColor={P.ink}
        />
      </Panel>
      {flight ? (
        <Panel palette={P}>
          <Action title="← All flights" palette={P} outline onPress={() => setSelected(null)} />
          <Label palette={P}>
            {flight.number} · {flight.status.toUpperCase()}
          </Label>
          <Actions>
            <Stat label={flight.origin.toUpperCase()} value={flight.from} palette={P} />
            <Text c={P.accent} size={26}>
              ✈ →
            </Text>
            <Stat label={flight.destination.toUpperCase()} value={flight.to} palette={P} />
          </Actions>
          <Block gap={0} h={10} bg={P.border} radius={5}>
            <Block gap={0} w={`${flight.progress * 100}%`} h={10} bg={P.accent} radius={5} />
          </Block>
          <Actions>
            <Stat label="DEPART" value={flight.depart} palette={P} />
            <Stat label="ARRIVE" value={flight.arrive} palette={P} />
            <Stat label="GATE" value={flight.gate} palette={P} />
          </Actions>
          <Text c={P.muted}>Route progress is a static illustration for this sample flight.</Text>
        </Panel>
      ) : (
        <>
          <Label palette={P}>FLIGHTS</Label>
          {shown.map((f) => (
            <Panel key={f.number} palette={P} onPress={() => setSelected(f.number)}>
              <Actions>
                <Text c={P.ink} fw="bold" size={18}>
                  {f.number}
                </Text>
                <Text c={P.accent}>{f.status}</Text>
              </Actions>
              <Text c={P.ink} size={22} fw="bold">
                {f.from} ✈ {f.to}
              </Text>
              <Text c={P.muted}>
                {f.depart} → {f.arrive} · Gate {f.gate}
              </Text>
            </Panel>
          ))}
          {!shown.length && (
            <Panel palette={P}>
              <Text c={P.muted}>No matching sample flight.</Text>
            </Panel>
          )}
        </>
      )}
      <Text c={P.muted} size={12}>
        Fictional flights and static status. No live tracking service is connected.
      </Text>
    </AppFrame>
  );
}
