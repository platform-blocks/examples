import { useState } from 'react';
import { AppShell, Badge, Column, PlocksProvider, Row, SegmentedControl, Text } from '@plocks/ui-snack';
import { createGame, nextPitch } from './game/engine';
import { GamecastScreen } from './screens/GamecastScreen';
import { ScoresScreen } from './screens/ScoresScreen';
import { StandingsScreen } from './screens/StandingsScreen';
import { BASEBALL_THEME, C } from './theme';

function BaseballApp() {
  const [view, setView] = useState('scores');
  const [game, setGame] = useState(createGame);
  return <AppShell header={{ height: 74 }} autoLayout maxContentWidth={1050} centerContent padding={0}
    headerContent={<Row align="center" justify="space-between" style={{ flex: 1, paddingHorizontal: 20 }}>
      <Column gap={0} fullWidth={false}><Text c={C.red} size={10} fw="bold" lts={2}>DIAMOND</Text><Text c={C.ink} size={20} fw="bold">GAME DAY</Text></Column>
      <Badge color={C.gold} variant="light">DEMO LEAGUE</Badge>
    </Row>}>
    <AppShell.Section grow withScrollArea>
      <Column gap="lg" style={{ width: '100%', padding: 20, paddingBottom: 48 }}>
        <SegmentedControl data={[{ value: 'scores', label: 'Scores' }, { value: 'gamecast', label: 'Gamecast' }, { value: 'standings', label: 'Standings' }]}
          value={view} onChange={setView} color={C.red} fullWidth accessibilityLabel="App views" />
        {view === 'scores' && <ScoresScreen game={game} onOpenGame={() => setView('gamecast')} />}
        {view === 'gamecast' && <GamecastScreen game={game} onPitch={() => setGame(old => nextPitch(old))} onReset={() => setGame(createGame())} />}
        {view === 'standings' && <StandingsScreen />}
      </Column>
    </AppShell.Section>
  </AppShell>;
}

export default function App() {
  return <PlocksProvider theme={BASEBALL_THEME}><BaseballApp /></PlocksProvider>;
}
