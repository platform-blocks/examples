export const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'] as const;
export type Suit = (typeof SUITS)[number];

export type PlayingCard = {
  suit: Suit;
  rank: number;
  faceUp: boolean;
};

export type GameState = {
  stock: PlayingCard[];
  waste: PlayingCard[];
  foundations: Record<Suit, PlayingCard[]>;
  tableau: PlayingCard[][];
  moves: number;
};

export type Source =
  | { pile: 'waste' }
  | { pile: 'foundation'; suit: Suit }
  | { pile: 'tableau'; column: number; cardIndex: number };

export type Destination =
  | { pile: 'foundation'; suit: Suit }
  | { pile: 'tableau'; column: number };

export type Hint = { source: Source; destination: Destination; text: string };

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
  diamonds: '♦',
};

export function rankLabel(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

export function cardLabel(card: PlayingCard): string {
  return `${rankLabel(card.rank)} of ${card.suit}`;
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function createGame(random: () => number = Math.random): GameState {
  const deck: PlayingCard[] = SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({ suit, rank: index + 1, faceUp: false })),
  );
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  const tableau: PlayingCard[][] = Array.from({ length: 7 }, () => []);
  for (let column = 0; column < 7; column += 1) {
    for (let row = 0; row <= column; row += 1) {
      tableau[column].push({ ...deck.pop()!, faceUp: row === column });
    }
  }

  return {
    stock: deck,
    waste: [],
    foundations: { spades: [], hearts: [], clubs: [], diamonds: [] },
    tableau,
    moves: 0,
  };
}

export function drawStock(game: GameState): GameState | null {
  if (game.stock.length > 0) {
    const card = game.stock[game.stock.length - 1];
    return {
      ...game,
      stock: game.stock.slice(0, -1),
      waste: [...game.waste, { ...card, faceUp: true }],
      moves: game.moves + 1,
    };
  }
  if (game.waste.length > 0) {
    return {
      ...game,
      stock: game.waste.slice().reverse().map((card) => ({ ...card, faceUp: false })),
      waste: [],
      moves: game.moves + 1,
    };
  }
  return null;
}

export function sourceCards(game: GameState, source: Source): PlayingCard[] | null {
  if (source.pile === 'waste') {
    const card = game.waste.at(-1);
    return card ? [card] : null;
  }
  if (source.pile === 'foundation') {
    const card = game.foundations[source.suit].at(-1);
    return card ? [card] : null;
  }
  const pile = game.tableau[source.column];
  if (!pile || source.cardIndex < 0 || source.cardIndex >= pile.length) return null;
  const cards = pile.slice(source.cardIndex);
  if (!cards.every((card) => card.faceUp)) return null;
  for (let index = 1; index < cards.length; index += 1) {
    if (cards[index - 1].rank !== cards[index].rank + 1 ||
        isRed(cards[index - 1].suit) === isRed(cards[index].suit)) return null;
  }
  return cards;
}

export function canMove(game: GameState, source: Source, destination: Destination): boolean {
  const cards = sourceCards(game, source);
  if (!cards) return false;
  if (source.pile === 'tableau' && destination.pile === 'tableau' &&
      source.column === destination.column) return false;
  if (source.pile === 'foundation' && destination.pile === 'foundation' &&
      source.suit === destination.suit) return false;

  const first = cards[0];
  if (destination.pile === 'foundation') {
    if (cards.length !== 1 || first.suit !== destination.suit) return false;
    const top = game.foundations[destination.suit].at(-1);
    return top ? first.rank === top.rank + 1 : first.rank === 1;
  }

  const pile = game.tableau[destination.column];
  if (!pile) return false;
  const top = pile.at(-1);
  return top
    ? top.faceUp && first.rank === top.rank - 1 && isRed(first.suit) !== isRed(top.suit)
    : first.rank === 13;
}

export function moveCards(game: GameState, source: Source, destination: Destination): GameState | null {
  if (!canMove(game, source, destination)) return null;
  const cards = sourceCards(game, source)!;
  const tableau = game.tableau.map((pile) => pile.slice());
  const foundations = Object.fromEntries(
    SUITS.map((suit) => [suit, game.foundations[suit].slice()]),
  ) as Record<Suit, PlayingCard[]>;
  let waste = game.waste.slice();

  if (source.pile === 'waste') waste = waste.slice(0, -1);
  if (source.pile === 'foundation') foundations[source.suit].pop();
  if (source.pile === 'tableau') {
    tableau[source.column] = tableau[source.column].slice(0, source.cardIndex);
    const exposed = tableau[source.column].at(-1);
    if (exposed && !exposed.faceUp) {
      tableau[source.column][tableau[source.column].length - 1] = { ...exposed, faceUp: true };
    }
  }

  if (destination.pile === 'foundation') foundations[destination.suit].push(cards[0]);
  else tableau[destination.column].push(...cards);

  return { ...game, tableau, foundations, waste, moves: game.moves + 1 };
}

export function isWon(game: GameState): boolean {
  return SUITS.every((suit) => game.foundations[suit].length === 13);
}

export function findHint(game: GameState): Hint | null {
  const sources: Source[] = [
    { pile: 'waste' },
    ...game.tableau.flatMap((pile, column) =>
      pile.flatMap((card, cardIndex) => card.faceUp
        ? [{ pile: 'tableau', column, cardIndex } as Source] : []),
    ),
  ];

  for (const source of sources) {
    const card = sourceCards(game, source)?.[0];
    if (!card) continue;
    const destination: Destination = { pile: 'foundation', suit: card.suit };
    if (canMove(game, source, destination)) {
      return { source, destination, text: `Move ${cardLabel(card)} to its foundation.` };
    }
  }

  for (const source of sources) {
    const card = sourceCards(game, source)?.[0];
    if (!card) continue;
    for (let column = 0; column < 7; column += 1) {
      const destination: Destination = { pile: 'tableau', column };
      if (canMove(game, source, destination)) {
        return { source, destination, text: `Move ${cardLabel(card)} to column ${column + 1}.` };
      }
    }
  }

  for (const suit of SUITS) {
    const source: Source = { pile: 'foundation', suit };
    const card = sourceCards(game, source)?.[0];
    if (!card) continue;
    for (let column = 0; column < 7; column += 1) {
      const destination: Destination = { pile: 'tableau', column };
      if (canMove(game, source, destination)) {
        return { source, destination, text: `Move ${cardLabel(card)} back to column ${column + 1}.` };
      }
    }
  }
  return null;
}
