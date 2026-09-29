export interface Team { code: string; name: string; short: string; color: string; wins: number; losses: number; }
export const TEAMS: Record<string, Team> = {
  HBR: { code: 'HBR', name: 'Harbor Hawks', short: 'Hawks', color: '#71C2DC', wins: 43, losses: 28 },
  DSR: { code: 'DSR', name: 'Desert Suns', short: 'Suns', color: '#F1BE64', wins: 39, losses: 32 },
  MNT: { code: 'MNT', name: 'Mountain Bears', short: 'Bears', color: '#A7B7E2', wins: 37, losses: 34 },
  RIV: { code: 'RIV', name: 'River Otters', short: 'Otters', color: '#8DCCA9', wins: 34, losses: 37 },
  CTY: { code: 'CTY', name: 'City Comets', short: 'Comets', color: '#E89AB2', wins: 41, losses: 30 },
  BAY: { code: 'BAY', name: 'Bay Waves', short: 'Waves', color: '#8DBEDB', wins: 31, losses: 40 },
};
export const AWAY = TEAMS.HBR;
export const HOME = TEAMS.DSR;
export const AWAY_LINEUP = ['M. Vega', 'J. Park', 'A. Brooks', 'T. Morgan', 'C. Reed', 'L. Chen', 'N. Cruz', 'E. Price', 'S. Ellis'];
export const HOME_LINEUP = ['R. Flores', 'D. Hale', 'K. Bennett', 'I. Stone', 'P. Malik', 'W. Torres', 'B. Lane', 'O. Kim', 'F. Walsh'];

export interface Fixture { id: string; away: string; home: string; status: 'final' | 'scheduled'; awayScore?: number; homeScore?: number; note: string; }
export const EARLIER: Fixture[] = [
  { id: 'early-1', away: 'CTY', home: 'BAY', status: 'final', awayScore: 5, homeScore: 2, note: 'Final' },
  { id: 'early-2', away: 'RIV', home: 'MNT', status: 'final', awayScore: 3, homeScore: 4, note: 'Final · 10 innings' },
];
export const DEMO_SLATE: Fixture[] = [
  { id: 'today-1', away: 'CTY', home: 'BAY', status: 'final', awayScore: 6, homeScore: 1, note: 'Final' },
  { id: 'today-2', away: 'MNT', home: 'RIV', status: 'scheduled', note: '7:40 PM · Mountain Park' },
];
export const NEXT: Fixture[] = [
  { id: 'next-1', away: 'DSR', home: 'MNT', status: 'scheduled', note: '1:10 PM · Summit Field' },
  { id: 'next-2', away: 'BAY', home: 'HBR', status: 'scheduled', note: '6:35 PM · Harbor Park' },
];
