export const C = {
  ink: '#101616',
  muted: '#6F7C79',
  green: '#00B67A',
  darkGreen: '#007C56',
  line: '#E6ECE9',
  pale: '#E9F8F1',
  panel: '#F7FAF8',
  white: '#FFF',
  red: '#D45B5B',
  amber: '#C98A12',
};

/** Allocation palette, fixed order so a slice keeps its color between renders. */
export const SLICE_COLORS = [
  '#00B67A',
  '#2F7DD3',
  '#8B5CF6',
  '#E08A1E',
  '#0EA5A4',
  '#D45B5B',
  '#64748B',
  '#C2A013',
  '#B6C2BF',
];

export const money = (value: number, digits = 2) =>
  (value < 0 ? '-$' : '$') +
  Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Sub-dollar coins and tokens need more precision than whole-dollar stocks. */
export const price = (value: number) => money(value, value < 1 ? 4 : 2);

export const signed = (value: number) => (value >= 0 ? '+' : '-') + money(Math.abs(value));

export const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

export const compact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
};

export const quantity = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: Number.isInteger(value) ? 0 : 6 });

export const trend = (value: number) => (value >= 0 ? C.darkGreen : C.red);
