import { useState } from 'react';
import { Badge, Block, Button, Column, Divider, Row, Scroller, SegmentedControl, Text, Title } from '@plocks/ui-snack';
import { AWAY, AWAY_LINEUP, HOME, HOME_LINEUP } from '../data';
import { CountDisplay } from '../components/CountDisplay';
import { FieldDiamond } from '../components/FieldDiamond';
import { Panel, Stat } from '../components/Panel';
import { Scoreboard } from '../components/Scoreboard';
import { battingSide, halfLabel } from '../game/engine';
import type { GameState } from '../game/types';
import { C } from '../theme';

export function GamecastScreen({
  game,
  onPitch,
  onReset,
}: {
  game: GameState;
  onPitch: () => void;
  onReset: () => void;
}) {
  const [view, setView] = useState('field');
  const side = battingSide(game);
  const batter = side === 'away' ? AWAY_LINEUP[game.batter.away] : HOME_LINEUP[game.batter.home];
  const last = game.events[0];
  return (
    <Column gap="lg">
      <Row align="center" justify="space-between" wrap="wrap" gap="sm">
        <Column gap="xs" fullWidth={false}>
          <Text c={C.red} size={11} fw="bold" lts={2}>
            GAME CENTER
          </Text>
          <Title order={1} c={C.ink}>
            Gamecast
          </Title>
        </Column>
        <Badge color={C.red} variant="light">
          {game.status === 'live' ? 'LIVE DEMO' : 'FINAL'}
        </Badge>
      </Row>
      <Scoreboard game={game} />
      <SegmentedControl
        data={[
          { value: 'field', label: 'Field' },
          { value: 'plays', label: 'Play by play' },
          { value: 'box', label: 'Box score' },
        ]}
        value={view}
        onChange={setView}
        color={C.red}
        fullWidth
      />
      {view === 'field' && (
        <>
          <Panel
            eyebrow="At a glance"
            title={
              game.status === 'live'
                ? `${halfLabel(game.half)} ${game.inning} · ${game.outs} out${game.outs === 1 ? '' : 's'}`
                : 'Game complete'
            }
          >
            <Row wrap="wrap" gap="xl" align="center" justify="space-around">
              <FieldDiamond bases={game.bases} />
              <Block gap="lg" fullWidth={false} direction="column" miw={180}>
                <CountDisplay balls={game.balls} strikes={game.strikes} outs={game.outs} />
                <Column gap={3}>
                  <Text c={C.muted} size={10} fw="bold">
                    AT BAT
                  </Text>
                  <Text c={C.ink} size={21} fw="bold">
                    {game.status === 'final' ? '—' : batter}
                  </Text>
                  <Text c={C.muted} size={12}>
                    {side === 'away' ? AWAY.name : HOME.name}
                  </Text>
                </Column>
                <Stat label="Pitches in game" value={game.pitchCount} />
              </Block>
            </Row>
          </Panel>
          <Panel eyebrow="Latest play" title={last.title}>
            <Text c={C.muted}>{last.detail}</Text>
          </Panel>
          <Row wrap="wrap" gap="sm">
            <Button
              title="Next pitch"
              color={C.red}
              variant="filled"
              onPress={onPitch}
              disabled={game.status === 'final'}
            />
            <Button title="Reset simulation" color={C.red} variant="outline" onPress={onReset} />
          </Row>
        </>
      )}
      {view === 'plays' && <PlayLog game={game} />}
      {view === 'box' && <BoxScore game={game} />}
      <Text c={C.muted} size={11}>
        Gamecast advances one simulated pitch per tap. It is not connected to a live sports feed.
      </Text>
    </Column>
  );
}

function PlayLog({ game }: { game: GameState }) {
  return (
    <Panel eyebrow={`${game.events.length} recent events`} title="Play by play">
      {game.events.map((event, index) => (
        <Block key={`${event.id}-${index}`} gap="xs" direction="column" py={10}>
          <Row justify="space-between" align="center" wrap="wrap">
            <Text c={C.red} size={10} fw="bold">
              {halfLabel(event.half).toUpperCase()} {event.inning} · PITCH {event.id}
            </Text>
            <Text c={C.muted} size={11}>
              {AWAY.code} {event.away} – {HOME.code} {event.home}
            </Text>
          </Row>
          <Text c={C.ink} fw="bold">
            {event.title}
          </Text>
          <Text c={C.muted} size={13}>
            {event.detail}
          </Text>
          {index < game.events.length - 1 && <Divider color={C.line} />}
        </Block>
      ))}
    </Panel>
  );
}

function BoxScore({ game }: { game: GameState }) {
  const count = Math.max(9, game.inning);
  const labels = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <Column gap="lg">
      <Panel eyebrow="Runs by inning" title="Line score">
        <Scroller>
          <Block w={Math.max(590, 126 + count * 47)}>
            <Row gap={0}>
              <Text c={C.muted} size={11} w={115}>
                TEAM
              </Text>
              {labels.map((n) => (
                <Text key={n} c={C.muted} size={11} ta="center" w={47}>
                  {n}
                </Text>
              ))}
            </Row>
            <LineRow code={AWAY.code} values={game.innings.away} count={count} />
            <LineRow code={HOME.code} values={game.innings.home} count={count} />
          </Block>
        </Scroller>
      </Panel>
      <Panel eyebrow="Team totals" title="The numbers">
        <Block direction="row" w="100%">
          <Text c={C.muted} flex={1}>
            CLUB
          </Text>
          <Text c={C.muted} ta="right" w={42}>
            R
          </Text>
          <Text c={C.muted} ta="right" w={42}>
            H
          </Text>
          <Text c={C.muted} ta="right" w={42}>
            E
          </Text>
        </Block>
        <Totals code={AWAY.code} runs={game.away} hits={game.hits.away} errors={game.errors.away} />
        <Totals code={HOME.code} runs={game.home} hits={game.hits.home} errors={game.errors.home} />
      </Panel>
      <Panel eyebrow="Game context" title="Matchup">
        <Row wrap="wrap" gap="xl">
          <Stat label="Inning" value={`${halfLabel(game.half)} ${game.inning}`} />
          <Stat label="Total pitches" value={game.pitchCount} />
          <Stat label="Half-inning outs" value={game.outs} />
        </Row>
      </Panel>
    </Column>
  );
}

function LineRow({ code, values, count }: { code: string; values: number[]; count: number }) {
  return (
    <Block gap={0} direction="row" py={9} borderTopWidth={1} borderTopColor={C.line}>
      <Text c={C.ink} fw="bold" w={115}>
        {code}
      </Text>
      {Array.from({ length: count }, (_, i) => (
        <Text key={i} c={values[i] === undefined ? C.muted : C.ink} ta="center" w={47}>
          {values[i] ?? '–'}
        </Text>
      ))}
    </Block>
  );
}

function Totals({ code, runs, hits, errors }: { code: string; runs: number; hits: number; errors: number }) {
  return (
    <Block direction="row" w="100%" py={8} borderTopWidth={1} borderTopColor={C.line}>
      <Text c={C.ink} fw="bold" flex={1}>
        {code}
      </Text>
      <Text c={C.ink} ta="right" w={42}>
        {runs}
      </Text>
      <Text c={C.ink} ta="right" w={42}>
        {hits}
      </Text>
      <Text c={C.ink} ta="right" w={42}>
        {errors}
      </Text>
    </Block>
  );
}
