import assert from 'node:assert/strict';
import test from 'node:test';

import { canMove, createGame, drawStock, findHint, isWon, moveCards, sourceCards, SUITS } from '../game.ts';

const card = (suit, rank, faceUp = true) => ({ suit, rank, faceUp });
const emptyGame = () => ({
  stock: [],
  waste: [],
  foundations: { spades: [], hearts: [], clubs: [], diamonds: [] },
  tableau: Array.from({ length: 7 }, () => []),
  moves: 0,
});

test('a new game deals 28 tableau cards, 24 stock cards, and one face-up card per column', () => {
  const game = createGame(() => 0.5);
  assert.equal(game.stock.length, 24);
  game.tableau.forEach((pile, column) => {
    assert.equal(pile.length, column + 1);
    assert.deepEqual(pile.map((item) => item.faceUp),
      Array.from({ length: column + 1 }, (_, index) => index === column));
  });
  const ids = [...game.stock, ...game.tableau.flat()].map((item) => `${item.suit}-${item.rank}`);
  assert.equal(new Set(ids).size, 52);
});

test('drawing and recycling preserves the original draw order', () => {
  const game = { ...emptyGame(), stock: [card('spades', 1, false), card('hearts', 2, false)] };
  const first = drawStock(game);
  const second = drawStock(first);
  const recycled = drawStock(second);
  const again = drawStock(recycled);
  assert.equal(first.waste.at(-1).rank, 2);
  assert.equal(second.waste.at(-1).rank, 1);
  assert.equal(recycled.stock.length, 2);
  assert.equal(recycled.waste.length, 0);
  assert.equal(again.waste.at(-1).rank, 2);
  assert.equal(drawStock(emptyGame()), null);
  assert.equal(game.stock.length, 2);
});

test('an ace can move to its foundation and exposes a face-down tableau card', () => {
  const game = emptyGame();
  game.tableau[0] = [card('clubs', 9, false), card('hearts', 1)];
  const next = moveCards(game, { pile: 'tableau', column: 0, cardIndex: 1 },
    { pile: 'foundation', suit: 'hearts' });
  assert.equal(next.foundations.hearts[0].rank, 1);
  assert.equal(next.tableau[0][0].faceUp, true);
  assert.equal(game.tableau[0][0].faceUp, false);
  assert.equal(next.moves, 1);
});

test('tableau runs move together only onto the next opposite-color rank', () => {
  const game = emptyGame();
  game.tableau[0] = [card('spades', 7), card('hearts', 6)];
  game.tableau[1] = [card('hearts', 8)];
  game.tableau[2] = [card('clubs', 8)];
  const source = { pile: 'tableau', column: 0, cardIndex: 0 };
  assert.equal(canMove(game, source, { pile: 'tableau', column: 2 }), false);
  assert.equal(canMove(game, source, { pile: 'tableau', column: 1 }), true);
  const next = moveCards(game, source, { pile: 'tableau', column: 1 });
  assert.equal(next.tableau[0].length, 0);
  assert.deepEqual(next.tableau[1].map((item) => item.rank), [8, 7, 6]);
  assert.equal(moveCards(game, source, { pile: 'foundation', suit: 'spades' }), null);
});

test('only kings fill empty columns; buried or invalid runs cannot be selected', () => {
  const game = emptyGame();
  game.waste = [card('diamonds', 12)];
  game.tableau[0] = [card('spades', 13, false), card('hearts', 10)];
  game.tableau[1] = [card('clubs', 9), card('spades', 8)];
  assert.equal(canMove(game, { pile: 'waste' }, { pile: 'tableau', column: 2 }), false);
  assert.equal(sourceCards(game, { pile: 'tableau', column: 0, cardIndex: 0 }), null);
  assert.equal(sourceCards(game, { pile: 'tableau', column: 1, cardIndex: 0 }), null);
  game.waste = [card('diamonds', 13)];
  assert.equal(canMove(game, { pile: 'waste' }, { pile: 'tableau', column: 2 }), true);
});

test('foundation cards can move back to tableau when the build requires it', () => {
  const game = emptyGame();
  game.foundations.hearts = [card('hearts', 1), card('hearts', 2)];
  game.tableau[0] = [card('spades', 3)];
  const source = { pile: 'foundation', suit: 'hearts' };
  const destination = { pile: 'tableau', column: 0 };
  assert.equal(canMove(game, source, destination), true);
  const next = moveCards(game, source, destination);
  assert.equal(next.foundations.hearts.length, 1);
  assert.deepEqual(next.tableau[0].map((item) => item.rank), [3, 2]);
  assert.deepEqual(findHint(game)?.destination, destination);
});

test('hints prefer available foundation moves and all completed foundations win', () => {
  const game = emptyGame();
  game.waste = [card('clubs', 1)];
  const hint = findHint(game);
  assert.deepEqual(hint.destination, { pile: 'foundation', suit: 'clubs' });
  for (const suit of SUITS) {
    game.foundations[suit] = Array.from({ length: 13 }, (_, index) => card(suit, index + 1));
  }
  assert.equal(isWon(game), true);
});
