import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Animated, Easing, Platform, StatusBar, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  IconArrowBackUp,
  IconBolt,
  IconBulb,
  IconCards,
  IconMenu2,
  IconRefresh,
  IconTrophy,
} from '@tabler/icons-react-native';
import { Block, Button, Dialog, Gradient, MotionBlock, PlocksProvider, ScrollArea, Switch, Text } from '@plocks/ui';

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
  type Hint,
  type PlayingCard,
  type Source,
  type Suit,
} from './game';

const C = {
  felt: ['#17694A', '#0E4F37', '#093826'] as const,
  bar: 'rgba(3, 22, 15, 0.42)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  white: '#FFFFFF',
  text: '#F3F7F4',
  muted: 'rgba(235, 245, 239, 0.62)',
  face: '#FFFFFF',
  faceEdge: 'rgba(15, 30, 25, 0.14)',
  red: '#D7263D',
  black: '#1A1F2B',
  back: ['#3456C8', '#1D2F7A'] as const,
  backLine: 'rgba(255, 255, 255, 0.28)',
  gold: '#FFC93C',
  target: '#6EF0B0',
  slot: 'rgba(0, 0, 0, 0.16)',
  slotEdge: 'rgba(255, 255, 255, 0.24)',
  slotInk: 'rgba(255, 255, 255, 0.32)',
};

const NATIVE = Platform.OS !== 'web';
const SERIF = Platform.select({ android: 'serif', default: 'Georgia' });
const PRESSED_ITEM = { opacity: 0.55 };
const PRESSED_CARD = { opacity: 0.88 };
const CONFETTI = ['#FFC93C', '#FF5D73', '#6EF0B0', '#7AA7FF', '#FFFFFF'];

type Snapshot = { game: GameState; score: number };
type Box = { w: number; h: number };
type IconType = ComponentType<{ size?: number; color?: string }>;

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function haptic(kind: 'tap' | 'error' | 'win') {
  if (Platform.OS === 'web') return;
  if (kind === 'tap') void Haptics.selectionAsync().catch(() => {});
  else void Haptics.notificationAsync(kind === 'win' ? Haptics.NotificationFeedbackType.Success
    : Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

function sameSource(left: Source | null, right: Source): boolean {
  if (!left || left.pile !== right.pile) return false;
  if (left.pile === 'foundation' && right.pile === 'foundation') return left.suit === right.suit;
  if (left.pile === 'tableau' && right.pile === 'tableau') {
    return left.column === right.column && left.cardIndex === right.cardIndex;
  }
  return true;
}

function sameDestination(left: Destination | undefined, right: Destination): boolean {
  if (!left || left.pile !== right.pile) return false;
  return left.pile === 'foundation' && right.pile === 'foundation' ? left.suit === right.suit
    : left.pile === 'tableau' && right.pile === 'tableau' && left.column === right.column;
}

function bestDestination(game: GameState, source: Source): Destination | null {
  const cards = sourceCards(game, source);
  if (!cards) return null;
  const foundation: Destination = { pile: 'foundation', suit: cards[0].suit };
  if (source.pile !== 'foundation' && canMove(game, source, foundation)) return foundation;
  const columns = [0, 1, 2, 3, 4, 5, 6].filter((column) => canMove(game, source, { pile: 'tableau', column }));
  const filled = columns.find((column) => game.tableau[column].length);
  if (filled !== undefined) return { pile: 'tableau', column: filled };
  const kingAlreadyBase = source.pile === 'tableau' && source.cardIndex === 0;
  return columns.length && !kingAlreadyBase ? { pile: 'tableau', column: columns[0] } : null;
}

function moveScore(game: GameState, source: Source, destination: Destination): number {
  let score = 0;
  if (destination.pile === 'foundation') score += source.pile === 'foundation' ? 0 : 10;
  else if (source.pile === 'waste') score += 5;
  else if (source.pile === 'foundation') score -= 15;
  if (source.pile === 'tableau' && source.cardIndex > 0 && !game.tableau[source.column][source.cardIndex - 1].faceUp) {
    score += 5;
  }
  return score;
}

function foundationMove(game: GameState): [Source, Destination] | null {
  const sources: Source[] = [
    { pile: 'waste' },
    ...game.tableau.map((pile, column): Source => ({ pile: 'tableau', column, cardIndex: pile.length - 1 })),
  ];
  for (const source of sources) {
    const card = sourceCards(game, source)?.[0];
    if (card && canMove(game, source, { pile: 'foundation', suit: card.suit })) {
      return [source, { pile: 'foundation', suit: card.suit }];
    }
  }
  return null;
}

function tableLayout(area: Box, game: GameState, compact: boolean) {
  const pad = area.w < 500 ? 6 : area.w < 900 ? 16 : 28;
  const usableW = Math.max(280, area.w - pad * 2);
  const gap = Math.max(4, Math.min(16, Math.round(usableW * 0.012)));
  const cardW = Math.floor(Math.min((usableW - gap * 6) / 7, (area.h - pad) / 4.3, 128));
  const cardH = Math.round(cardW * 1.4);
  const width = cardW * 7 + gap * 6;
  const top = compact ? 6 : pad;
  const tableauTop = top + cardH + Math.max(10, gap * 2);
  const room = area.h - tableauTop - pad - cardH;
  const rankSize = Math.max(11, Math.round(cardW * 0.32));
  const inset = Math.max(3, Math.round(cardW * 0.07));
  const minOpen = Math.round(rankSize * 1.05 + inset);
  const columns = game.tableau.map((pile) => {
    let covered = Math.round(cardH * 0.12);
    let open = Math.max(minOpen, Math.round(cardH * 0.27));
    const hidden = pile.slice(0, -1).filter((card) => !card.faceUp).length;
    const shown = Math.max(0, pile.length - 1 - hidden);
    if (hidden * covered + shown * open > room) {
      covered = Math.max(Math.round(cardH * 0.06), Math.floor((room - shown * open) / Math.max(1, hidden)));
      if (hidden * covered + shown * open > room && shown) {
        open = Math.max(minOpen, Math.floor((room - hidden * covered) / shown));
      }
    }
    let offset = 0;
    return pile.map((card) => {
      const y = offset;
      offset += card.faceUp ? open : covered;
      return y;
    });
  });
  const height = Math.max(
    area.h,
    ...columns.map((ys) => tableauTop + (ys.at(-1) ?? 0) + cardH + pad),
  );
  const x = (column: number) => column * (cardW + gap);
  return { cardW, cardH, gap, width, height, top, tableauTop, columns, rankSize, inset, x };
}

type CardSpec = {
  card: PlayingCard;
  x: number;
  y: number;
  z: number;
  label?: string;
  ring?: string;
  flat?: boolean;
  onPress?: () => void;
};

function CardFace({ card, w, h, rankSize, inset }: { card: PlayingCard; w: number; h: number; rankSize: number; inset: number }) {
  const ink = isRed(card.suit) ? C.red : C.black;
  const court = card.rank > 10;
  const suit = SUIT_SYMBOL[card.suit];
  return (
    <Block fluid gap={0}>
      <Block direction="row" justify="space-between" align="flex-start" gap={0} px={inset} pt={Math.max(1, inset - 2)}>
        <Text c={ink} fw="bold" size={rankSize} lh={1.05} lts={card.rank === 10 ? -1 : 0}>
          {rankLabel(card.rank)}
        </Text>
        <Text c={ink} size={Math.round(rankSize * 0.85)} lh={1.15}>
          {suit}
        </Text>
      </Block>
      <Block fluid align="center" justify="center" gap={0} pb={Math.round(h * 0.06)}>
        {court ? (
          <Block align="center" justify="center" gap={0} w={w * 0.62} h={h * 0.5} radius={Math.round(w * 0.08)}
            bg={isRed(card.suit) ? 'rgba(215, 38, 61, 0.08)' : 'rgba(26, 31, 43, 0.07)'}>
            <Text c={ink} ff={SERIF} fw="bold" size={Math.round(w * 0.42)} lh={1}>
              {rankLabel(card.rank)}
            </Text>
          </Block>
        ) : (
          <Text c={ink} size={Math.round(w * (card.rank === 1 ? 0.62 : 0.5))} lh={1}>
            {suit}
          </Text>
        )}
      </Block>
    </Block>
  );
}

function CardBack({ w, radius }: { w: number; radius: number }) {
  const diamond = Math.round(w * 0.3);
  return (
    <Gradient colors={C.back} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} fluid p={Math.max(3, Math.round(w * 0.07))}>
      <Block fluid align="center" justify="center" gap={0} radius={Math.max(2, radius - 3)}
        borderWidth={1} borderColor={C.backLine}>
        <Block w={diamond} h={diamond} rotate="45deg" radius={Math.round(diamond * 0.18)}
          borderWidth={1.5} borderColor={C.backLine} bg="rgba(255, 255, 255, 0.08)" />
      </Block>
    </Gradient>
  );
}

function TableCard({ spec, w, h, rankSize, inset, shake }: {
  spec: CardSpec; w: number; h: number; rankSize: number; inset: number; shake: number;
}) {
  const pos = useRef(new Animated.ValueXY({ x: spec.x, y: spec.y })).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const last = useRef({ x: spec.x, y: spec.y });
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const previous = last.current;
    last.current = { x: spec.x, y: spec.y };
    const distance = Math.abs(previous.x - spec.x) + Math.abs(previous.y - spec.y);
    if (!distance) return;
    const far = distance > h * 0.5;
    if (far) setFlying(true);
    Animated.timing(pos, {
      toValue: { x: spec.x, y: spec.y },
      duration: far ? 240 : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start(() => far && setFlying(false));
  }, [spec.x, spec.y, h, pos]);

  useEffect(() => {
    if (!shake) return;
    Animated.sequence([6, -6, 4, -4, 0].map((toValue) =>
      Animated.timing(nudge, { toValue, duration: 45, useNativeDriver: NATIVE }))).start();
  }, [shake, nudge]);

  const radius = Math.max(4, Math.round(w * 0.1));
  return (
    <MotionBlock position="absolute" top={0} left={0} translateX={pos.x} translateY={pos.y}
      zIndex={flying ? 1000 + spec.z : spec.z}>
      <MotionBlock translateX={nudge}>
        <Block w={w} h={h} radius={radius} bg={C.face} overflow="hidden" gap={0}
          borderWidth={spec.ring ? 2 : 1} borderColor={spec.ring ?? C.faceEdge}
          shadow={flying || spec.ring ? 'lg' : spec.flat ? 'none' : 'sm'}
          onPress={spec.onPress} pressedStyle={PRESSED_CARD} disabled={!spec.onPress}
          accessibilityLabel={spec.label} accessibilityElementsHidden={!spec.label}
          importantForAccessibility={spec.label ? 'auto' : 'no-hide-descendants'}>
          {spec.card.faceUp
            ? <CardFace card={spec.card} w={w} h={h} rankSize={rankSize} inset={inset} />
            : <CardBack w={w} radius={radius} />}
        </Block>
      </MotionBlock>
    </MotionBlock>
  );
}

function Slot({ x, y, w, h, ring, label, onPress, children }: {
  x: number; y: number; w: number; h: number; ring?: string; label?: string;
  onPress?: () => void; children?: ReactNode;
}) {
  return (
    <Block position="absolute" left={x} top={y} w={w} h={h} radius={Math.max(4, Math.round(w * 0.1))}
      bg={C.slot} borderWidth={ring ? 2 : 1.5} borderColor={ring ?? C.slotEdge} borderStyle={ring ? 'solid' : 'dashed'}
      align="center" justify="center" gap={0} zIndex={0}
      onPress={onPress} pressedStyle={PRESSED_ITEM} disabled={!onPress} accessibilityLabel={label}
      accessibilityElementsHidden={!label} importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}>
      {children}
    </Block>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Block align="center" gap={0} miw={64}>
      <Text c={C.muted} size={10} fw="bold" lts={1.2}>
        {label}
      </Text>
      <Text c={C.text} size={17} fw="bold" lh={1.2}>
        {value}
      </Text>
    </Block>
  );
}

function Action({ icon: Icon, label, onPress, disabled, active }: {
  icon: IconType; label: string; onPress: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <Block grow={1} basis={0} mih={56} miw={64} align="center" justify="center" gap={3} radius={14} py={6}
      bg={active ? 'rgba(255, 201, 60, 0.16)' : undefined} opacity={disabled ? 0.38 : 1}
      onPress={onPress} disabled={disabled} pressedStyle={PRESSED_ITEM} accessibilityLabel={label}>
      <Icon size={24} color={active ? C.gold : C.text} />
      <Text c={active ? C.gold : C.text} size={11} fw="semibold">
        {label}
      </Text>
    </Block>
  );
}

function Confetti({ area }: { area: Box }) {
  const pieces = useMemo(() => Array.from({ length: 36 }, (_, index) => ({
    value: new Animated.Value(-30),
    left: Math.random() * area.w,
    size: 6 + Math.random() * 6,
    color: CONFETTI[index % CONFETTI.length],
    spin: `${Math.round(360 + Math.random() * 720)}deg`,
    delay: Math.random() * 1400,
    duration: 2200 + Math.random() * 1600,
  })), [area.w]);
  useEffect(() => {
    const loops = pieces.map((piece) => Animated.loop(Animated.sequence([
      Animated.delay(piece.delay),
      Animated.timing(piece.value, {
        toValue: area.h + 30, duration: piece.duration, easing: Easing.linear, useNativeDriver: NATIVE,
      }),
    ])));
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [pieces, area.h]);
  return (
    <Block position="absolute" inset={0} zIndex={2000} pointerEvents="none" overflow="hidden">
      {pieces.map((piece, index) => (
        <MotionBlock key={index} position="absolute" top={0} left={piece.left} w={piece.size} h={piece.size * 1.6}
          radius={2} bg={piece.color} translateY={piece.value}
          motionRotate={piece.value.interpolate({ inputRange: [-30, area.h + 30], outputRange: ['0deg', piece.spin] })} />
      ))}
    </Block>
  );
}

function SolitaireScreen() {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [game, setGame] = useState<GameState>(() => createGame());
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Source | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shake, setShake] = useState<{ key: string; n: number }>({ key: '', n: 0 });
  const [seconds, setSeconds] = useState(0);
  const [area, setArea] = useState<Box | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [winClosed, setWinClosed] = useState(false);
  const [autoMove, setAutoMove] = useState(true);
  const [leftHanded, setLeftHanded] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const won = isWon(game);
  const started = game.moves > 0;
  const rail = window.width > window.height && window.height < 560;
  const canFinish = !won && !game.stock.length && !game.waste.length
    && game.tableau.every((pile) => pile.every((card) => card.faceUp));

  useEffect(() => {
    if (!started || won) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [started, won]);

  useEffect(() => {
    if (!notice && !hint) return;
    const timer = setTimeout(() => { setNotice(null); setHint(null); }, 2600);
    return () => clearTimeout(timer);
  }, [notice, hint]);

  useEffect(() => {
    if (won) { haptic('win'); setFinishing(false); }
  }, [won]);

  useEffect(() => {
    if (!finishing) return;
    const timer = setTimeout(() => {
      const move = foundationMove(game);
      if (move) apply(move[0], move[1]);
      else setFinishing(false);
    }, 110);
    return () => clearTimeout(timer);
  });

  function commit(next: GameState, delta: number) {
    setHistory((items) => [...items.slice(-199), { game, score }]);
    setGame(next);
    setScore((value) => Math.max(0, value + delta));
    setSelected(null);
    setHint(null);
  }

  function apply(source: Source, destination: Destination): boolean {
    const next = moveCards(game, source, destination);
    if (!next) return false;
    commit(next, moveScore(game, source, destination));
    haptic('tap');
    return true;
  }

  function reject(key: string, text?: string) {
    setShake((value) => ({ key, n: value.n + 1 }));
    if (text) setNotice(text);
    haptic('error');
  }

  function tapSource(source: Source, key: string, asDestination?: Destination) {
    if (selected) {
      if (asDestination && apply(selected, asDestination)) return;
      if (sameSource(selected, source)) { setSelected(null); return; }
    }
    const cards = sourceCards(game, source);
    if (!cards) {
      if (selected) reject(key);
      return;
    }
    if (autoMove) {
      const destination = bestDestination(game, source);
      if (destination) apply(source, destination);
      else reject(key, `No move for ${cardLabel(cards[0])}.`);
      return;
    }
    setSelected(source);
  }

  function tapEmpty(destination: Destination) {
    if (selected && !apply(selected, destination)) {
      setNotice(destination.pile === 'tableau' ? 'Only a king can fill an empty column.'
        : `Foundations start with an ace of ${destination.suit}.`);
    }
  }

  function tapStock() {
    const next = drawStock(game);
    if (!next) return;
    commit(next, game.stock.length ? 0 : -100);
    haptic('tap');
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setGame(previous.game);
    setScore(previous.score);
    setHistory((items) => items.slice(0, -1));
    setSelected(null);
    setHint(null);
    setFinishing(false);
  }

  function newGame() {
    setGame(createGame());
    setScore(0);
    setHistory([]);
    setSelected(null);
    setHint(null);
    setSeconds(0);
    setWinClosed(false);
    setFinishing(false);
    setMenuOpen(false);
  }

  function showHint() {
    const next = findHint(game);
    setSelected(null);
    if (next) {
      setHint(next);
      setNotice(next.text);
    } else {
      setNotice(game.stock.length ? 'Draw from the stock.' : game.waste.length ? 'Recycle the waste pile.'
        : 'No moves left. Try a new game.');
    }
  }

  function measure(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (!area || Math.abs(area.w - width) > 1 || Math.abs(area.h - height) > 1) setArea({ w: width, h: height });
  }

  const layout = area ? tableLayout(area, game, rail) : null;
  const specs: CardSpec[] = [];
  const slots: ReactNode[] = [];
  const marked = selected ?? hint?.source ?? null;
  const targetFor = (destination: Destination) =>
    (selected && canMove(game, selected, destination)) || sameDestination(hint?.destination, destination)
      ? C.target : undefined;

  if (layout) {
    const { cardW: w, cardH: h, x, top, tableauTop } = layout;
    const topX = (column: number) => x(leftHanded ? 6 - column : column);
    const fan = Math.round(w * 0.24) * (leftHanded ? -1 : 1);

    SUITS.forEach((suit, index) => {
      const pile = game.foundations[suit];
      const destination: Destination = { pile: 'foundation', suit };
      const ring = targetFor(destination);
      slots.push(
        <Slot key={suit} x={topX(index)} y={top} w={w} h={h} ring={pile.length ? undefined : ring}
          label={pile.length ? undefined : `Empty ${suit} foundation`} onPress={pile.length ? undefined : () => tapEmpty(destination)}>
          <Text c={C.slotInk} size={Math.round(w * 0.5)} lh={1}>{SUIT_SYMBOL[suit]}</Text>
        </Slot>,
      );
      pile.forEach((card, cardIndex) => {
        const isTop = cardIndex === pile.length - 1;
        const source: Source = { pile: 'foundation', suit };
        specs.push({
          card, x: topX(index), y: top, z: cardIndex + 1, flat: !isTop,
          label: `${suit} foundation, ${cardLabel(card)}`,
          ring: isTop ? (sameSource(marked, source) ? C.gold : ring) : undefined,
          onPress: isTop ? () => tapSource(source, `${card.suit}-${card.rank}`, destination) : undefined,
        });
      });
    });

    slots.push(
      <Slot key="stock" x={topX(6)} y={top} w={w} h={h}
        label={game.stock.length ? undefined : game.waste.length ? 'Recycle waste pile' : 'Empty stock'}
        onPress={game.waste.length ? tapStock : undefined}>
        {game.waste.length ? <IconRefresh size={Math.round(w * 0.42)} color={C.slotInk} /> : null}
      </Slot>,
    );
    game.stock.forEach((card, index) => specs.push({
      card, x: topX(6), y: top, z: index + 1, flat: index < game.stock.length - 1,
      label: index === game.stock.length - 1 ? `Stock, ${game.stock.length} cards. Draw a card.` : undefined,
      onPress: index === game.stock.length - 1 ? tapStock : undefined,
    }));

    game.waste.forEach((card, index) => {
      const depth = Math.min(2, game.waste.length - 1 - index);
      const isTop = index === game.waste.length - 1;
      specs.push({
        card, x: topX(5) - depth * fan, y: top, z: index + 1, flat: index < game.waste.length - 3,
        label: `Waste, ${cardLabel(card)}`,
        ring: isTop && sameSource(marked, { pile: 'waste' }) ? C.gold : undefined,
        onPress: isTop ? () => tapSource({ pile: 'waste' }, `${card.suit}-${card.rank}`) : undefined,
      });
    });

    game.tableau.forEach((pile, column) => {
      const destination: Destination = { pile: 'tableau', column };
      const ring = targetFor(destination);
      slots.push(
        <Slot key={`column-${column}`} x={x(column)} y={tableauTop} w={w} h={h} ring={pile.length ? undefined : ring}
          label={pile.length ? undefined : `Empty column ${column + 1}`} onPress={pile.length ? undefined : () => tapEmpty(destination)}>
          <Text c={C.slotInk} fw="bold" size={Math.round(w * 0.36)}>K</Text>
        </Slot>,
      );
      pile.forEach((card, cardIndex) => {
        const source: Source = { pile: 'tableau', column, cardIndex };
        const inMarked = marked?.pile === 'tableau' && marked.column === column && cardIndex >= marked.cardIndex;
        const isTop = cardIndex === pile.length - 1;
        specs.push({
          card, x: x(column), y: tableauTop + layout.columns[column][cardIndex], z: cardIndex + 1,
          label: card.faceUp ? `Column ${column + 1}, ${cardLabel(card)}` : `Column ${column + 1}, face-down card`,
          ring: inMarked ? C.gold : isTop ? ring : undefined,
          onPress: card.faceUp ? () => tapSource(source, `${card.suit}-${card.rank}`, destination)
            : selected ? () => tapEmpty(destination) : undefined,
        });
      });
    });
  }

  const wide = window.width >= 700;
  const actions = (
    <>
      <Action icon={IconCards} label="New" onPress={newGame} />
      <Action icon={IconArrowBackUp} label="Undo" onPress={undo} disabled={!history.length || finishing} />
      <Action icon={IconBulb} label="Hint" onPress={showHint} disabled={won || finishing} />
      <Action icon={IconMenu2} label="Menu" onPress={() => setMenuOpen(true)} />
    </>
  );

  return (
    <Gradient colors={C.felt} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} fluid>
      <StatusBar barStyle="light-content" />
      <Block bg={C.bar} borderBottomWidth={1} borderBottomColor={C.hairline} gap={0}
        pt={insets.top} pl={insets.left} pr={insets.right}>
        <Block direction="row" align="center" justify={wide ? 'space-between' : 'center'} h={rail ? 44 : 54}
          px={16} gap="md" w="100%" maw={1100} alignSelf="center">
          {wide && (
            <Text c={C.text} fw="bold" size={18} lts={0.3} miw={140}>
              Solitaire
            </Text>
          )}
          <Block direction="row" align="center" justify="center" gap={wide ? 'xl' : 'md'}>
            <Stat label="SCORE" value={String(score)} />
            <Stat label="TIME" value={formatTime(seconds)} />
            <Stat label="MOVES" value={String(game.moves)} />
          </Block>
          {wide && (
            <Text c={C.muted} size={13} ta="right" miw={140}>
              {SUITS.reduce((total, suit) => total + game.foundations[suit].length, 0)} / 52 home
            </Text>
          )}
        </Block>
      </Block>

      <Block fluid direction="row" gap={0} pl={rail ? insets.left : 0}>
        <Block fluid gap={0} onLayout={measure}>
          {area && layout && (
            <ScrollArea showsVerticalScrollIndicator={false}>
              <Block w={layout.width} h={layout.height} alignSelf="center" position="relative" gap={0}>
                {slots}
                {specs.map((spec) => {
                  const key = `${spec.card.suit}-${spec.card.rank}`;
                  return (
                    <TableCard key={key} spec={spec} w={layout.cardW} h={layout.cardH} rankSize={layout.rankSize}
                      inset={layout.inset} shake={shake.key === key ? shake.n : 0} />
                  );
                })}
              </Block>
            </ScrollArea>
          )}
          {(notice || canFinish) && (
            <Block position="absolute" left={0} right={0} bottom={12} align="center" gap={0} zIndex={1500}
              pointerEvents="box-none">
              {canFinish && !finishing ? (
                <Button title="Auto-finish" icon={<IconBolt size={18} color={C.black} />} variant="filled"
                  color={C.gold} textColor={C.black} radius="full" onPress={() => setFinishing(true)} />
              ) : notice ? (
                <Block bg="rgba(8, 14, 12, 0.86)" radius="full" px={16} py={9} maw={360} mx={16}>
                  <Text c={C.text} size={14} ta="center" accessibilityLiveRegion="polite">
                    {notice}
                  </Text>
                </Block>
              ) : null}
            </Block>
          )}
          {won && area && <Confetti area={area} />}
        </Block>
        {rail && (
          <Block w={84 + insets.right} pr={insets.right} py={8} px={6} gap={4} bg={C.bar}
            borderLeftWidth={1} borderLeftColor={C.hairline} justify="center">
            {actions}
          </Block>
        )}
      </Block>

      {!rail && (
        <Block bg={C.bar} borderTopWidth={1} borderTopColor={C.hairline} gap={0}
          pb={Math.max(insets.bottom, 6)} pl={insets.left} pr={insets.right}>
          <Block direction="row" gap={4} px={8} pt={6} w="100%" maw={560} alignSelf="center">
            {actions}
          </Block>
        </Block>
      )}

      <Dialog opened={menuOpen} variant="bottomsheet" title="Game" accessibilityLabel="Game menu"
        onClose={() => setMenuOpen(false)}>
        <Block gap="lg" pb={Math.max(insets.bottom, 12)}>
          <Switch label="Tap to auto-move" checked={autoMove}
            onChange={(value) => { setAutoMove(value); setSelected(null); }} />
          <Switch label="Left-handed table" checked={leftHanded} onChange={setLeftHanded} />
          <Block direction="row" gap="sm">
            <Block grow={1} basis={0}>
              <Button title="New game" variant="filled" color={C.gold} textColor={C.black} fullWidth onPress={newGame} />
            </Block>
            <Block grow={1} basis={0}>
              <Button title="How to play" variant="outline" color={C.gold} fullWidth
                onPress={() => { setMenuOpen(false); setRulesOpen(true); }} />
            </Block>
          </Block>
        </Block>
      </Dialog>

      <Dialog opened={rulesOpen} title="How to play" accessibilityLabel="How to play" onClose={() => setRulesOpen(false)}>
        <Block gap="sm">
          <Text lh={1.5}>Move every card to the four foundations, building each suit up from ace to king.</Text>
          <Text lh={1.5}>Build tableau columns down in alternating colors. Only a king can fill an empty column.</Text>
          <Text lh={1.5}>
            Tap the stock to draw one card; tap the empty stock to recycle the waste. With auto-move on, tapping a
            card sends it to the best legal spot. Turn it off in the menu to tap a card, then its destination.
          </Text>
        </Block>
      </Dialog>

      <Dialog opened={won && !winClosed} accessibilityLabel="You won" showHeader={false} onClose={() => setWinClosed(true)}>
        <Block align="center" gap="md" py="md">
          <Block w={64} h={64} radius="full" bg="rgba(255, 201, 60, 0.18)" align="center" justify="center">
            <IconTrophy size={34} color={C.gold} />
          </Block>
          <Text size={26} fw="bold" ta="center">
            You won!
          </Text>
          <Block direction="row" gap="xl" justify="center">
            {[['SCORE', String(score)], ['TIME', formatTime(seconds)], ['MOVES', String(game.moves)]].map(([label, value]) => (
              <Block key={label} align="center" gap={2}>
                <Text c="secondary" size={11} fw="bold" lts={1.2}>{label}</Text>
                <Text size={20} fw="bold">{value}</Text>
              </Block>
            ))}
          </Block>
          <Button title="Play again" variant="filled" color={C.gold} textColor={C.black} fullWidth onPress={newGame} />
        </Block>
      </Dialog>
    </Gradient>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
        <SolitaireScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
