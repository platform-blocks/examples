import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, nextPitch } from '../game/engine.ts';

const pitch = (state, roll) => nextPitch(state, () => roll);

test('the demo score matches its inning lines', () => {
  const game = createGame();
  assert.equal(game.innings.away.reduce((sum, runs) => sum + runs, 0), game.away);
  assert.equal(game.innings.home.reduce((sum, runs) => sum + runs, 0), game.home);
  assert.equal(game.innings.home.length, 6);
  assert.equal(game.events[0].title, 'Game in progress');
});

test('a loaded walk only advances forced runners and can win in the ninth', () => {
  const game = { ...createGame(), inning: 9, half: 'bottom', away: 2, home: 2, balls: 3,
    bases: [true, true, true], innings: { away: [0, 0, 0, 2, 0, 0, 0, 0, 0], home: [0, 1, 0, 0, 1, 0, 0, 0, 0] } };
  const next = pitch(game, 0.1);
  assert.equal(next.home, 3);
  assert.equal(next.innings.home[8], 1);
  assert.deepEqual(next.bases, [true, true, true]);
  assert.equal(next.status, 'final');
  assert.equal(pitch(next, 0.8), next);
  assert.equal(game.home, 2);
});

test('a home run clears bases, adds a hit, and updates the line score', () => {
  const game = createGame();
  const next = pitch(game, 0.99);
  assert.equal(next.away, 5);
  assert.deepEqual(next.bases, [false, false, false]);
  assert.equal(next.hits.away, 8);
  assert.equal(next.innings.away[6], 2);
  assert.equal(next.batter.away, 4);
  assert.equal(next.events[0].title, 'Home run');
});

test('a foul ball preserves two strikes and a third out changes sides', () => {
  const game = { ...createGame(), strikes: 2, outs: 2 };
  const foul = pitch(game, 0.55);
  assert.equal(foul.strikes, 2);
  const retired = pitch(foul, 0.3);
  assert.equal(retired.half, 'bottom');
  assert.equal(retired.inning, 7);
  assert.equal(retired.outs, 0);
  assert.deepEqual(retired.bases, [false, false, false]);
  assert.equal(retired.innings.home[6], 0);
  assert.equal(retired.events[0].half, 'top');
});

test('a tie after the bottom of the ninth goes to extras', () => {
  const game = { ...createGame(), inning: 9, half: 'bottom', away: 3, home: 3, outs: 2,
    innings: { away: [1, 0, 0, 2, 0, 0, 0, 0, 0], home: [0, 1, 0, 0, 1, 0, 0, 1, 0] } };
  const next = pitch(game, 0.65);
  assert.equal(next.status, 'live');
  assert.equal(next.inning, 10);
  assert.equal(next.half, 'top');
});
