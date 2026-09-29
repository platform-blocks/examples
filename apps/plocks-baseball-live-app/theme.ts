export const C = {
  page: '#0B1720',
  panel: '#14252F',
  panelRaised: '#1A303B',
  line: '#2B4651',
  ink: '#F7F6EE',
  muted: '#9CB3BB',
  red: '#F36A55',
  gold: '#F1BE64',
  grass: '#27684D',
  grassDeep: '#184936',
  base: '#F7F2D8',
} as const;

export const BASEBALL_THEME = {
  colorScheme: 'dark' as const,
  primaryColor: C.red,
  backgrounds: {
    base: C.page,
    subtle: C.panel,
    surface: C.panel,
    elevated: C.panelRaised,
    border: C.line,
    borderStrong: C.muted,
  },
};
