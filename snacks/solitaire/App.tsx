import { useEffect, useMemo, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Block, ScrollArea, SafeArea, Button, Card, Column, Flex, PlocksProvider, Text, Title } from '@plocks/ui-snack';

import {
  SUITS,
  SUIT_SYMBOL,
  canMove,
  cardLabel,
  createGame,
  drawStock,
  findHint,
  isRed,
  isWon,
  moveCards,
  rankLabel,
  sourceCards,
  type Destination,
  type GameState,
  type PlayingCard,
  type Source,
  type Suit,
} from './game';

const COLORS = {
  page: '#0B211C',
  felt: '#174638',
  feltDeep: '#123A30',
  line: 'rgba(226, 239, 219, 0.15)',
  cream: '#FFFCF4',
  gold: '#E9C98C',
  muted: '#AEC7B9',
  white: '#F6F6E9',
  red: '#BB3D44',
  black: '#253A39',
};

const GAME_THEME = { colorScheme: 'dark' as const };

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function sourceEquals(left: Source | null, right: Source): boolean {
  if (!left || left.pile !== right.pile) return false;
  if (left.pile === 'waste') return true;
  if (left.pile === 'foundation' && right.pile === 'foundation') return left.suit === right.suit;
  return (
    left.pile === 'tableau' &&
    right.pile === 'tableau' &&
    left.column === right.column &&
    left.cardIndex === right.cardIndex
  );
}

type CardFaceProps = {
  card: PlayingCard;
  width: number;
  height: number;
  selected?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
  top?: number;
  zIndex?: number;
  accessibilityLabel?: string;
};

function CardFace({
  card,
  width,
  height,
  selected,
  highlighted,
  onPress,
  top,
  zIndex,
  accessibilityLabel,
}: CardFaceProps) {
  const red = isRed(card.suit);
  const ink = red ? COLORS.red : COLORS.black;
  const small = width < 60;
  const rankSize = small ? 14 : 21;
  const suitSize = small ? 12 : 18;
  const centerSize = small ? 27 : 43;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? (card.faceUp ? cardLabel(card) : 'Face-down card')}
      padding={0}
      radius="md"
      bg={card.faceUp ? COLORS.cream : '#20564A'}
      borderColor={selected || highlighted ? COLORS.gold : card.faceUp ? '#DFD9C8' : '#81A79A'}
      borderWidth={selected ? 3 : highlighted ? 2 : 1}
      w={width}
      h={height}
      clip
      shadow="md"
      position={top === undefined ? 'relative' : 'absolute'}
      top={top}
      left={top === undefined ? undefined : 0}
      zIndex={zIndex}
    >
      {card.faceUp ? (
        <>
          <Block
            gap={0}
            direction="column"
            position="absolute"
            top={small ? 3 : 6}
            left={small ? 4 : 8}
            fullWidth={false}
          >
            <Text fw="bold" c={ink} size={rankSize} lh={1}>
              {rankLabel(card.rank)}
            </Text>
            <Text c={ink} size={suitSize} lh={1}>
              {SUIT_SYMBOL[card.suit]}
            </Text>
          </Block>
          <Block align="center" justify="center" direction="row" flex={1}>
            <Text c={ink} size={centerSize} lh={1}>
              {SUIT_SYMBOL[card.suit]}
            </Text>
          </Block>
          {!small && (
            <Text c={ink} size={16} position="absolute" bottom={5} right={8}>
              {SUIT_SYMBOL[card.suit]}
            </Text>
          )}
        </>
      ) : (
        <Block
          align="center"
          justify="center"
          direction="row"
          flex={1}
          m={4}
          borderWidth={1}
          borderColor="#7FA69A"
          radius={6}
        >
          <Text c={COLORS.gold} size={small ? 21 : 36} lh={1}>
            ✦
          </Text>
        </Block>
      )}
    </Card>
  );
}

function EmptySlot({
  width,
  height,
  symbol,
  label,
  onPress,
  highlighted = false,
}: {
  width: number;
  height: number;
  symbol: string;
  label: string;
  onPress?: () => void;
  highlighted?: boolean;
}) {
  return (
    <Card
      variant="outline"
      bg="rgba(7, 31, 25, 0.22)"
      padding={0}
      radius="md"
      borderColor={highlighted ? COLORS.gold : 'rgba(226, 239, 219, 0.27)'}
      onPress={onPress}
      accessibilityLabel={label}
      borderStyle="dashed"
      w={width}
      h={height}
    >
      <Block align="center" justify="center" direction="row" flex={1}>
        <Text c={highlighted ? COLORS.gold : 'rgba(226, 239, 219, 0.34)'} size={width < 60 ? 22 : 38}>
          {symbol}
        </Text>
      </Block>
    </Card>
  );
}

function SolitaireScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [game, setGame] = useState<GameState>(() => createGame());
  const [history, setHistory] = useState<GameState[]>([]);
  const [selected, setSelected] = useState<Source | null>(null);
  const [message, setMessage] = useState('Select a face-up card, then tap where it should go.');
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const won = isWon(game);
  useEffect(() => {
    if (won) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [won]);

  const boardWidth = Math.max(320, Math.min(870, viewportWidth - (viewportWidth < 500 ? 60 : 72)));
  const gap = Math.max(6, Math.round(boardWidth * 0.014));
  const cardWidth = (boardWidth - gap * 6) / 7;
  const cardHeight = Math.round(cardWidth * 1.43);
  const coveredStep = Math.max(11, Math.round(cardHeight * 0.15));
  const openStep = Math.max(26, Math.round(cardHeight * 0.28));
  const foundationCount = SUITS.reduce((total, suit) => total + game.foundations[suit].length, 0);

  function commit(next: GameState, feedback: string) {
    setHistory((previous) => [...previous.slice(-99), game]);
    setGame(next);
    setSelected(null);
    setMessage(feedback);
  }

  function tryDestination(destination: Destination): boolean {
    if (!selected) return false;
    const next = moveCards(game, selected, destination);
    if (!next) return false;
    const card = sourceCards(game, selected)?.[0];
    commit(next, card ? `Moved ${cardLabel(card)}.` : 'Nice move.');
    return true;
  }

  function chooseSource(source: Source) {
    if (sourceEquals(selected, source)) {
      setSelected(null);
      setMessage('Selection cleared.');
      return;
    }
    const cards = sourceCards(game, source);
    if (!cards) return;
    setSelected(source);
    setMessage(
      cards.length > 1
        ? `${cardLabel(cards[0])} and ${cards.length - 1} more selected. Tap a tableau column.`
        : `${cardLabel(cards[0])} selected. Tap a valid destination.`,
    );
  }

  function tapTableau(column: number, cardIndex?: number) {
    if (selected && tryDestination({ pile: 'tableau', column })) return;
    if (cardIndex !== undefined) chooseSource({ pile: 'tableau', column, cardIndex });
    else if (selected) setMessage('Only a king can move into an empty column.');
  }

  function tapFoundation(suit: Suit) {
    if (selected && tryDestination({ pile: 'foundation', suit })) return;
    if (game.foundations[suit].length) chooseSource({ pile: 'foundation', suit });
    else if (selected) setMessage(`Only the ace of ${suit} starts this foundation.`);
  }

  function tapStock() {
    const next = drawStock(game);
    if (next) commit(next, game.stock.length ? 'Drew a card from the stock.' : 'Stock recycled.');
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setGame(previous);
    setHistory((items) => items.slice(0, -1));
    setSelected(null);
    setMessage('Last move undone.');
  }

  function newDeal() {
    setGame(createGame());
    setHistory([]);
    setSelected(null);
    setSeconds(0);
    setMessage('Fresh deck. Good luck!');
  }

  function showHint() {
    const hint = findHint(game);
    if (hint) {
      setSelected(hint.source);
      setMessage(hint.text);
    } else if (game.stock.length || game.waste.length) {
      setSelected(null);
      setMessage(game.stock.length ? 'Try drawing from the stock.' : 'Recycle the waste pile to keep looking.');
    } else {
      setSelected(null);
      setMessage('No available moves. Start a new deal to try again.');
    }
  }

  const tableauLayouts = useMemo(
    () =>
      game.tableau.map((pile) => {
        let offset = 0;
        const positions = pile.map((card) => {
          const position = offset;
          offset += card.faceUp ? openStep : coveredStep;
          return position;
        });
        return { positions, height: Math.max(cardHeight, (positions.at(-1) ?? 0) + cardHeight) };
      }),
    [game.tableau, cardHeight, coveredStep, openStep],
  );

  return (
    <SafeArea gap={0} flex={1} bg={COLORS.page}>
      <StatusBar barStyle="light-content" />
      <ScrollArea contentProps={{ align: 'center', pb: 44 }}>
        <Block gap="lg" direction="column" w="100%" maw={1060} px={18} pt={24}>
          <Flex direction="row" wrap="wrap" justify="space-between" align="center" gap="lg">
            <Column gap="xs" fullWidth={false}>
              <Text c={COLORS.gold} size={11} fw="bold" lts={3}>
                PLOCKS / THE CARD TABLE
              </Text>
              <Title order={1} c={COLORS.white} size={viewportWidth < 500 ? 36 : 52} lh={58}>
                Solitaire
              </Title>
              <Text c={COLORS.muted}>A quiet game of Klondike.</Text>
            </Column>
            <Flex direction="row" wrap="wrap" gap="sm" align="center">
              <Button
                title="New deal"
                size="sm"
                variant="filled"
                color={COLORS.gold}
                textColor={COLORS.page}
                onPress={newDeal}
              />
              <Button
                title="Undo"
                size="sm"
                variant="outline"
                color={COLORS.gold}
                disabled={!history.length}
                onPress={undo}
              />
              <Button title="Hint" size="sm" variant="outline" color={COLORS.gold} onPress={showHint} />
            </Flex>
          </Flex>

          <Flex direction="row" wrap="wrap" gap="sm">
            <Stat label="TIME" value={formatTime(seconds)} />
            <Stat label="MOVES" value={String(game.moves)} />
            <Stat label="FOUNDATIONS" value={`${foundationCount} / 52`} />
          </Flex>

          <Card
            bg={COLORS.felt}
            padding={viewportWidth < 500 ? 12 : 24}
            radius="xl"
            borderColor={COLORS.line}
            clip
            mih={viewportWidth < 500 ? 310 : 500}
          >
            <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ grow: 1 }}>
              <Block gap="lg" direction="column" w={boardWidth} mih={viewportWidth < 500 ? 280 : 450}>
                <Block gap={0} direction="row" w={boardWidth}>
                  <Block gap="xs" fullWidth={false} direction="column" w={cardWidth} mr={gap}>
                    <Text c={COLORS.muted} size={10} fw="bold" lts={1.5}>
                      STOCK
                    </Text>
                    {game.stock.length ? (
                      <CardFace
                        card={game.stock.at(-1)!}
                        width={cardWidth}
                        height={cardHeight}
                        onPress={tapStock}
                        accessibilityLabel={`Stock, ${game.stock.length} cards. Draw one card.`}
                      />
                    ) : (
                      <EmptySlot
                        width={cardWidth}
                        height={cardHeight}
                        symbol="↺"
                        label="Recycle waste pile"
                        onPress={game.waste.length ? tapStock : undefined}
                      />
                    )}
                  </Block>
                  <Block gap="xs" fullWidth={false} direction="column" w={cardWidth} mr={gap}>
                    <Text c={COLORS.muted} size={10} fw="bold" lts={1.5}>
                      WASTE
                    </Text>
                    {game.waste.length ? (
                      <CardFace
                        card={game.waste.at(-1)!}
                        width={cardWidth}
                        height={cardHeight}
                        selected={selected?.pile === 'waste'}
                        onPress={() => chooseSource({ pile: 'waste' })}
                        accessibilityLabel={`Waste, ${cardLabel(game.waste.at(-1)!)}. Select card.`}
                      />
                    ) : (
                      <EmptySlot width={cardWidth} height={cardHeight} symbol="✧" label="Empty waste pile" />
                    )}
                  </Block>
                  <Block direction="row" w={cardWidth} mr={gap} />
                  {SUITS.map((suit, index) => {
                    const pile = game.foundations[suit];
                    return (
                      <Block
                        key={suit}
                        gap="xs"
                        fullWidth={false}
                        direction="column"
                        w={cardWidth}
                        mr={index < 3 ? gap : 0}
                      >
                        <Text c={COLORS.muted} size={10} fw="bold" lts={1.5}>
                          {index === 0 ? 'FOUNDATIONS' : ' '}
                        </Text>
                        {pile.length ? (
                          <CardFace
                            card={pile.at(-1)!}
                            width={cardWidth}
                            height={cardHeight}
                            selected={selected?.pile === 'foundation' && selected.suit === suit}
                            highlighted={selected !== null && canMove(game, selected, { pile: 'foundation', suit })}
                            onPress={() => tapFoundation(suit)}
                            accessibilityLabel={`${suit} foundation, top card ${cardLabel(pile.at(-1)!)}.`}
                          />
                        ) : (
                          <EmptySlot
                            width={cardWidth}
                            height={cardHeight}
                            symbol={SUIT_SYMBOL[suit]}
                            label={`Empty ${suit} foundation. Tap to move a selected ace.`}
                            onPress={() => tapFoundation(suit)}
                            highlighted={
                              selected !== null &&
                              sourceCards(game, selected)?.[0]?.suit === suit &&
                              canMove(game, selected, { pile: 'foundation', suit })
                            }
                          />
                        )}
                      </Block>
                    );
                  })}
                </Block>

                <Column gap="sm">
                  <Text c={COLORS.muted} size={10} fw="bold" lts={1.5}>
                    TABLEAU
                  </Text>
                  <Block gap={0} direction="row" w={boardWidth} align="flex-start">
                    {game.tableau.map((pile, column) => {
                      const layout = tableauLayouts[column];
                      return (
                        <Block
                          key={column}
                          direction="row"
                          w={cardWidth}
                          h={layout.height}
                          mr={column < 6 ? gap : 0}
                          position="relative"
                        >
                          {!pile.length && (
                            <EmptySlot
                              width={cardWidth}
                              height={cardHeight}
                              symbol="K"
                              label={`Empty tableau column ${column + 1}. Tap to move a selected king.`}
                              onPress={() => tapTableau(column)}
                              highlighted={selected !== null && canMove(game, selected, { pile: 'tableau', column })}
                            />
                          )}
                          {pile.map((card, cardIndex) => {
                            const inSelection =
                              selected?.pile === 'tableau' &&
                              selected.column === column &&
                              cardIndex >= selected.cardIndex;
                            return (
                              <CardFace
                                key={`${card.suit}-${card.rank}`}
                                card={card}
                                width={cardWidth}
                                height={cardHeight}
                                selected={inSelection}
                                highlighted={
                                  selected !== null &&
                                  cardIndex === pile.length - 1 &&
                                  canMove(game, selected, { pile: 'tableau', column })
                                }
                                onPress={card.faceUp ? () => tapTableau(column, cardIndex) : undefined}
                                accessibilityLabel={
                                  card.faceUp
                                    ? `Column ${column + 1}, ${cardLabel(card)}${inSelection ? ', selected' : ''}`
                                    : `Column ${column + 1}, face-down card`
                                }
                                top={layout.positions[cardIndex]}
                                zIndex={cardIndex}
                              />
                            );
                          })}
                        </Block>
                      );
                    })}
                  </Block>
                </Column>
              </Block>
            </ScrollArea>
          </Card>

          {won ? (
            <Card bg="#294B3F" borderColor={COLORS.gold} padding="lg">
              <Column gap="sm">
                <Title order={2} c={COLORS.gold}>
                  You won. Beautifully played.
                </Title>
                <Text c={COLORS.white}>All 52 cards reached their foundations in {game.moves} moves.</Text>
                <Button
                  title="Play again"
                  color={COLORS.gold}
                  textColor={COLORS.page}
                  variant="filled"
                  onPress={newDeal}
                />
              </Column>
            </Card>
          ) : (
            <Text c={COLORS.gold} size={14} accessibilityLiveRegion="polite">
              {message}
            </Text>
          )}

          <Card bg={COLORS.feltDeep} borderColor={COLORS.line} padding="md">
            <Column gap="sm">
              <Flex direction="row" justify="space-between" align="center" wrap="wrap" gap="sm">
                <Text c={COLORS.white} fw="bold">
                  How to play
                </Text>
                <Button
                  title={showRules ? 'Hide rules' : 'Show rules'}
                  size="sm"
                  variant="ghost"
                  color={COLORS.gold}
                  onPress={() => setShowRules(!showRules)}
                />
              </Flex>
              {showRules && (
                <Text c={COLORS.muted} lh={1.5}>
                  Tap a face-up card or descending stack, then tap its destination. Build tableau columns downward in
                  alternating colors. Build foundations upward from aces by suit. Only kings can fill empty columns. Tap
                  the stock to draw one card; tap its empty slot to recycle the waste. Undo reverses your last move.
                </Text>
              )}
            </Column>
          </Card>
        </Block>
      </ScrollArea>
    </SafeArea>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card bg={COLORS.feltDeep} borderColor={COLORS.line} padding="sm" radius="md" miw={106}>
      <Column gap={2}>
        <Text c={COLORS.muted} size={10} fw="bold" lts={1.4}>
          {label}
        </Text>
        <Text c={COLORS.white} size={17} fw="bold">
          {value}
        </Text>
      </Column>
    </Card>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={GAME_THEME}>
        <SolitaireScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
