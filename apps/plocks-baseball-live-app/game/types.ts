export type Side = 'away' | 'home';
export type Half = 'top' | 'bottom';
export type Bases = [boolean, boolean, boolean];

export interface PlayEvent {
  id: number;
  inning: number;
  half: Half;
  title: string;
  detail: string;
  away: number;
  home: number;
}

export interface GameState {
  inning: number;
  half: Half;
  status: 'live' | 'final';
  away: number;
  home: number;
  hits: Record<Side, number>;
  errors: Record<Side, number>;
  innings: Record<Side, number[]>;
  balls: number;
  strikes: number;
  outs: number;
  bases: Bases;
  batter: Record<Side, number>;
  pitchCount: number;
  events: PlayEvent[];
}
