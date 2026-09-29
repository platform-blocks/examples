import type { ReactNode } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Column, PlocksProvider, Text, Title } from '@plocks/ui';

export type Palette = { background: string; surface: string; ink: string; muted: string; accent: string; border: string };

export function ExampleApp({ name, subtitle, palette, children, dark = false }: {
  name: string; subtitle: string; palette: Palette; children: ReactNode; dark?: boolean;
}) {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: dark ? 'dark' : 'light' }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingBottom: 64, gap: 18 }}>
        <Column gap="xs"><Text c={palette.accent} size={11} fw="bold" lts={2}>PLOCKS EXAMPLE</Text>
          <Title order={1} style={{ color: palette.ink, fontSize: 34 }}>{name}</Title>
          <Text c={palette.muted}>{subtitle}</Text></Column>
        {children}
      </ScrollView>
    </SafeAreaView>
  </PlocksProvider></SafeAreaProvider>;
}

export function Panel({ children, palette, onPress }: { children: ReactNode; palette: Palette; onPress?: () => void }) {
  return <Card onPress={onPress} bg={palette.surface} borderColor={palette.border} borderWidth={1} radius="lg" padding="lg">
    <Column gap="sm">{children}</Column>
  </Card>;
}

export function Action({ title, palette, onPress, outline = false, disabled = false }: {
  title: string; palette: Palette; onPress: () => void; outline?: boolean; disabled?: boolean;
}) {
  return <Button title={title} onPress={onPress} disabled={disabled} size="sm" variant={outline ? 'outline' : 'filled'}
    color={palette.accent} textColor={outline ? palette.accent : palette.background} />;
}

export function Actions({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</View>;
}

export function Label({ children, palette }: { children: ReactNode; palette: Palette }) {
  return <Text c={palette.muted} size={11} fw="bold" lts={1.2}>{children}</Text>;
}

export function Stat({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return <View style={{ minWidth: 100, flexGrow: 1 }}><Label palette={palette}>{label}</Label>
    <Text c={palette.ink} size={22} fw="bold">{value}</Text></View>;
}
