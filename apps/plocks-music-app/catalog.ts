export type ArtworkStyle = {
  background: string;
  accent: string;
  detail: string;
  glyph: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  seconds: number;
  source: number;
  art: ArtworkStyle;
};

export const TRACKS: Track[] = [
  {
    id: 'golden-hour', title: 'Golden Hour', artist: 'Mira Sol', album: 'Daylight Studies',
    genre: 'Chill', seconds: 20, source: require('./assets/audio/golden-hour.mp3'),
    art: { background: '#DD9C59', accent: '#F9DF9E', detail: '#864E4B', glyph: '✳' },
  },
  {
    id: 'afterglow', title: 'Afterglow', artist: 'Luna Vale', album: 'Blue Hours',
    genre: 'Chill', seconds: 21, source: require('./assets/audio/afterglow.mp3'),
    art: { background: '#8A84BA', accent: '#EBC5CF', detail: '#413E72', glyph: '✦' },
  },
  {
    id: 'night-drive', title: 'Night Drive', artist: 'Lowlight', album: 'City Lines',
    genre: 'Electronic', seconds: 17, source: require('./assets/audio/night-drive.mp3'),
    art: { background: '#284B64', accent: '#80D8CE', detail: '#ED806E', glyph: '◒' },
  },
  {
    id: 'blue-apartment', title: 'Blue Apartment', artist: 'June Ellis', album: 'Rooms',
    genre: 'Focus', seconds: 22, source: require('./assets/audio/blue-apartment.mp3'),
    art: { background: '#7799AA', accent: '#E5D5B6', detail: '#284E68', glyph: '▣' },
  },
  {
    id: 'soft-focus', title: 'Soft Focus', artist: 'Niko Bloom', album: 'Slow Motion',
    genre: 'Focus', seconds: 25, source: require('./assets/audio/soft-focus.mp3'),
    art: { background: '#7F9581', accent: '#D6E2A2', detail: '#405C53', glyph: '❋' },
  },
  {
    id: 'side-streets', title: 'Side Streets', artist: 'The Nova Club', album: 'After Dark',
    genre: 'Electronic', seconds: 16, source: require('./assets/audio/side-streets.mp3'),
    art: { background: '#B35A5D', accent: '#FFD18A', detail: '#512F52', glyph: '✺' },
  },
];

export type Collection = {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  trackIds: string[];
  art: ArtworkStyle;
};

export const COLLECTIONS: Collection[] = [
  {
    id: 'slow-mornings', title: 'Slow Mornings', subtitle: 'Made for the softer hours',
    description: 'Warm chords, open windows, and nowhere else to be.',
    trackIds: ['golden-hour', 'afterglow', 'blue-apartment', 'soft-focus'],
    art: { background: '#B18A70', accent: '#F3DFAE', detail: '#657D6A', glyph: '☼' },
  },
  {
    id: 'night-shift', title: 'Night Shift', subtitle: 'After dark, on repeat',
    description: 'A little pulse for the way home.',
    trackIds: ['night-drive', 'side-streets', 'afterglow'],
    art: { background: '#364D6A', accent: '#AFB8E9', detail: '#E77F82', glyph: '✦' },
  },
  {
    id: 'deep-focus', title: 'Deep Focus', subtitle: 'Stay in your own lane',
    description: 'Gentle instrumentals for the things that matter.',
    trackIds: ['soft-focus', 'blue-apartment', 'golden-hour'],
    art: { background: '#547868', accent: '#CDE7B4', detail: '#AAC9CF', glyph: '◌' },
  },
  {
    id: 'easy-days', title: 'Easy Days', subtitle: 'Keep the good mood going',
    description: 'Light, unhurried sounds for a day with room to breathe.',
    trackIds: ['afterglow', 'golden-hour', 'soft-focus'],
    art: { background: '#AA8B5A', accent: '#F5DFA0', detail: '#5E6951', glyph: '✳' },
  },
  {
    id: 'headphones-on', title: 'Headphones On', subtitle: 'Get lost in the sound',
    description: 'A little energy for wherever the night takes you.',
    trackIds: ['side-streets', 'night-drive', 'blue-apartment'],
    art: { background: '#69517A', accent: '#C597CF', detail: '#F0A89E', glyph: '✦' },
  },
];

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
