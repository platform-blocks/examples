import type { Bases, GameState, Half, PlayEvent, Side } from './types';

export const battingSide = (game: GameState): Side => game.half === 'top' ? 'away' : 'home';
export const halfLabel = (half: Half) => half === 'top' ? 'Top' : 'Bottom';

export function createGame(): GameState {
  return {
    inning: 7, half: 'top', status: 'live', away: 3, home: 2,
    hits: { away: 7, home: 5 }, errors: { away: 0, home: 1 },
    innings: { away: [1, 0, 0, 2, 0, 0, 0, 0, 0], home: [0, 1, 0, 0, 1, 0, 0, 0, 0] },
    balls: 1, strikes: 1, outs: 1, bases: [false, true, false],
    batter: { away: 3, home: 4 }, pitchCount: 95,
    events: [{ id: 95, inning: 7, half: 'top', title: 'Game in progress', detail: 'Hawks have a runner on second with one out.', away: 3, home: 2 }],
  };
}

function log(game: GameState, title: string, detail: string): GameState {
  const event: PlayEvent = { id: game.pitchCount, inning: game.inning, half: game.half, title, detail, away: game.away, home: game.home };
  return { ...game, events: [event, ...game.events].slice(0, 80) };
}

function nextBatter(game: GameState, side: Side): Record<Side, number> {
  return { ...game.batter, [side]: (game.batter[side] + 1) % 9 };
}

function withRuns(game: GameState, side: Side, runs: number): GameState {
  if (!runs) return game;
  const row = [...game.innings[side]];
  while (row.length < game.inning) row.push(0);
  row[game.inning - 1] += runs;
  const updated: GameState = { ...game, [side]: game[side] + runs, innings: { ...game.innings, [side]: row } };
  if (game.half === 'bottom' && game.inning >= 9 && updated.home > updated.away) updated.status = 'final';
  return updated;
}

function finishAtBat(game: GameState, bases: Bases, runs: number, title: string, detail: string, hit: boolean): GameState {
  const side = battingSide(game);
  const scored = withRuns(game, side, runs);
  const updated: GameState = { ...scored, bases, balls: 0, strikes: 0, batter: nextBatter(game, side),
    hits: hit ? { ...scored.hits, [side]: scored.hits[side] + 1 } : scored.hits };
  return log(updated, title, runs ? `${detail} ${runs} run${runs === 1 ? '' : 's'} score${runs === 1 ? 's' : ''}.` : detail);
}

function hit(game: GameState, basesTaken: 1 | 2 | 4, title: string): GameState {
  const next: Bases = [false, false, false];
  let runs = 0;
  for (let base = 2; base >= 0; base--) {
    if (!game.bases[base]) continue;
    if (base + basesTaken >= 3) runs++;
    else next[base + basesTaken] = true;
  }
  if (basesTaken === 4) runs++;
  else next[basesTaken - 1] = true;
  return finishAtBat(game, next, runs, title, basesTaken === 4 ? 'The ball clears the fence.' : 'The ball is in play.', true);
}

function walk(game: GameState): GameState {
  const [first, second, third] = game.bases;
  const runs = first && second && third ? 1 : 0;
  return finishAtBat(game, [true, first || second, third || (first && second)], runs, 'Walk', 'Ball four puts the batter on first.', false);
}

function out(game: GameState, title: string): GameState {
  const side = battingSide(game);
  if (game.outs < 2) return log({ ...game, outs: game.outs + 1, balls: 0, strikes: 0, batter: nextBatter(game, side) }, title, `${game.outs + 1} out${game.outs ? 's' : ''} in the inning.`);
  const afterTop = game.half === 'top';
  const final = afterTop ? game.inning >= 9 && game.home > game.away : game.inning >= 9 && game.home !== game.away;
  return log({ ...game, status: final ? 'final' : 'live', inning: afterTop || final ? game.inning : game.inning + 1,
    half: final ? game.half : afterTop ? 'bottom' : 'top', outs: 0, balls: 0, strikes: 0,
    bases: [false, false, false], batter: nextBatter(game, side) }, title,
    final ? 'Side retired. The game is final.' : `Side retired. ${afterTop ? 'Bottom' : 'Top'} of the ${afterTop ? game.inning : game.inning + 1}${ordinal(afterTop ? game.inning : game.inning + 1)} is next.`);
}

function ordinal(n: number): string { return n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'; }

/** A random value can be injected to reproduce a pitch in tests. */
export function nextPitch(state: GameState, random: () => number = Math.random): GameState {
  if (state.status === 'final') return state;
  const game = { ...state, pitchCount: state.pitchCount + 1 };
  const roll = random();
  if (roll < .25) return game.balls === 3 ? walk(game) : log({ ...game, balls: game.balls + 1 }, 'Ball', `Count ${game.balls + 1}–${game.strikes}.`);
  if (roll < .50) return game.strikes === 2 ? out(game, 'Strikeout') : log({ ...game, strikes: game.strikes + 1 }, 'Called strike', `Count ${game.balls}–${game.strikes + 1}.`);
  if (roll < .60) return log({ ...game, strikes: Math.min(2, game.strikes + 1) }, 'Foul ball', 'The batter stays alive.');
  if (roll < .74) return out(game, 'Fly out');
  if (roll < .88) return hit(game, 1, 'Single');
  if (roll < .96) return hit(game, 2, 'Double');
  return hit(game, 4, 'Home run');
}
