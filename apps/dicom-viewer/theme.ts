export const C = {
  page: '#09131B', panel: '#10222D', panelRaised: '#162C38', viewer: '#02070B',
  border: '#26414D', ink: '#ECF5F7', muted: '#91AAB5', dim: '#66838F',
  accent: '#6EE4DB', accentSoft: '#183F43', warning: '#EDBB77', error: '#FFAA9F',
} as const;

export const VIEWER_THEME = {
  colorScheme: 'dark' as const,
  primaryColor: C.accent,
  backgrounds: { base: C.page, subtle: C.panel, surface: C.panel,
    elevated: C.panelRaised, border: C.border, borderStrong: C.dim },
};
