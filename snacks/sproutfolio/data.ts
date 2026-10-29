import type { BrandName } from '@plocks/brands';

/**
 * Every number in this file is fictional sample data, generated locally from a
 * seeded random walk so the app renders the same charts on every launch. Company
 * names and logos identify real businesses; their prices and statistics do not.
 */

export type AssetKind = 'stock' | 'crypto';
export type Range = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';
export const RANGES: Range[] = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

export interface Asset {
  ticker: string;
  name: string;
  kind: AssetKind;
  price: number;
  /** Percent change today (24h for crypto). */
  change: number;
  sector: string;
  color: string;
  brand?: BrandName;
  /** Fallback mark for assets without a registry logo. */
  glyph?: string;
  about: string;
  lists: string[];
  // Stocks
  ceo?: string;
  employees?: number;
  hq?: string;
  founded?: number;
  /** Shares outstanding, billions. */
  sharesOut?: number;
  pe?: number;
  dividendYield?: number;
  // Crypto
  circulating?: number;
  maxSupply?: number | null;
  launched?: number;
  consensus?: string;
}

export const ASSETS: Asset[] = [
  {
    ticker: 'AAPL',
    name: 'Apple',
    kind: 'stock',
    price: 231.48,
    change: 1.24,
    sector: 'Technology',
    color: '#111111',
    brand: 'apple',
    about:
      'Apple designs consumer electronics, software, and services, including the iPhone, Mac, iPad, Apple Watch, and a growing subscription business spanning music, cloud storage, and payments.',
    lists: ['Big Tech', 'Hardware'],
    ceo: 'Tim Cook',
    employees: 164000,
    hq: 'Cupertino, CA',
    founded: 1976,
    sharesOut: 15.1,
    pe: 34.2,
    dividendYield: 0.44,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    kind: 'stock',
    price: 428.16,
    change: 0.62,
    sector: 'Technology',
    color: '#00A4EF',
    brand: 'microsoft',
    about:
      'Microsoft builds productivity software, the Windows platform, Azure cloud infrastructure, gaming hardware and content, and AI tooling for businesses and developers.',
    lists: ['Big Tech', 'Cloud'],
    ceo: 'Satya Nadella',
    employees: 228000,
    hq: 'Redmond, WA',
    founded: 1975,
    sharesOut: 7.43,
    pe: 36.8,
    dividendYield: 0.72,
  },
  {
    ticker: 'AMZN',
    name: 'Amazon',
    kind: 'stock',
    price: 189.72,
    change: -0.85,
    sector: 'Consumer',
    color: '#FF9900',
    brand: 'amazon',
    about:
      'Amazon runs a global online marketplace and logistics network, the AWS cloud platform, streaming media, devices, and a fast-growing advertising business.',
    lists: ['Big Tech', 'Cloud', 'E-commerce'],
    ceo: 'Andy Jassy',
    employees: 1550000,
    hq: 'Seattle, WA',
    founded: 1994,
    sharesOut: 10.5,
    pe: 41.5,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet',
    kind: 'stock',
    price: 172.35,
    change: 2.11,
    sector: 'Communication',
    color: '#4285F4',
    brand: 'google',
    about:
      'Alphabet is the parent of Google, operating Search, YouTube, Android, Chrome, and Google Cloud, along with longer-term bets in autonomous driving and life sciences.',
    lists: ['Big Tech', 'Cloud', 'Advertising'],
    ceo: 'Sundar Pichai',
    employees: 183000,
    hq: 'Mountain View, CA',
    founded: 1998,
    sharesOut: 12.3,
    pe: 24.9,
    dividendYield: 0.46,
  },
  {
    ticker: 'META',
    name: 'Meta Platforms',
    kind: 'stock',
    price: 562.9,
    change: -1.47,
    sector: 'Communication',
    color: '#0866FF',
    brand: 'meta',
    about:
      'Meta operates Facebook, Instagram, WhatsApp, Messenger, and Threads, and invests heavily in AI models and mixed-reality hardware through Reality Labs.',
    lists: ['Big Tech', 'Social Media', 'Advertising'],
    ceo: 'Mark Zuckerberg',
    employees: 72000,
    hq: 'Menlo Park, CA',
    founded: 2004,
    sharesOut: 2.53,
    pe: 27.3,
    dividendYield: 0.36,
  },
  {
    ticker: 'SPOT',
    name: 'Spotify',
    kind: 'stock',
    price: 412.55,
    change: 3.38,
    sector: 'Communication',
    color: '#1DB954',
    brand: 'spotify',
    about:
      'Spotify is an audio streaming service offering music, podcasts, and audiobooks through free ad-supported and premium subscription tiers in more than 180 markets.',
    lists: ['Streaming', 'Subscriptions'],
    ceo: 'Alex Norström & Gustav Söderström',
    employees: 7300,
    hq: 'Stockholm, Sweden',
    founded: 2006,
    sharesOut: 0.204,
    pe: 68.4,
  },
  {
    ticker: 'RDDT',
    name: 'Reddit',
    kind: 'stock',
    price: 128.4,
    change: 4.92,
    sector: 'Communication',
    color: '#FF4500',
    brand: 'reddit',
    about:
      'Reddit hosts thousands of interest-based communities where people post, discuss, and vote on content, and earns revenue from advertising and data licensing.',
    lists: ['Social Media', 'Advertising'],
    ceo: 'Steve Huffman',
    employees: 2200,
    hq: 'San Francisco, CA',
    founded: 2005,
    sharesOut: 0.18,
    pe: 92.1,
  },
  {
    ticker: 'PYPL',
    name: 'PayPal',
    kind: 'stock',
    price: 71.26,
    change: -0.38,
    sector: 'Financials',
    color: '#003087',
    brand: 'paypal',
    about:
      'PayPal runs digital payment platforms for consumers and merchants, including PayPal checkout, Venmo, Braintree, and Xoom cross-border transfers.',
    lists: ['Payments', 'Fintech'],
    ceo: 'Enrique Lores',
    employees: 24500,
    hq: 'San Jose, CA',
    founded: 1998,
    sharesOut: 1.0,
    pe: 16.8,
    dividendYield: 0.7,
  },
  {
    ticker: 'V',
    name: 'Visa',
    kind: 'stock',
    price: 296.84,
    change: 0.41,
    sector: 'Financials',
    color: '#1A1F71',
    brand: 'visa',
    about:
      'Visa operates one of the largest electronic payment networks in the world, connecting cardholders, merchants, and financial institutions across more than 200 countries.',
    lists: ['Payments'],
    ceo: 'Ryan McInerney',
    employees: 31600,
    hq: 'San Francisco, CA',
    founded: 1958,
    sharesOut: 1.95,
    pe: 31.2,
    dividendYield: 0.78,
  },
  {
    ticker: 'MA',
    name: 'Mastercard',
    kind: 'stock',
    price: 512.37,
    change: 0.27,
    sector: 'Financials',
    color: '#EB001B',
    brand: 'mastercard',
    about:
      'Mastercard runs a global payments network and offers fraud prevention, data analytics, and open-banking services to banks, merchants, and governments.',
    lists: ['Payments'],
    ceo: 'Michael Miebach',
    employees: 35300,
    hq: 'Purchase, NY',
    founded: 1966,
    sharesOut: 0.92,
    pe: 36.5,
    dividendYield: 0.58,
  },
  {
    ticker: 'AXP',
    name: 'American Express',
    kind: 'stock',
    price: 268.91,
    change: -0.66,
    sector: 'Financials',
    color: '#006FCF',
    brand: 'amex',
    about:
      'American Express issues charge and credit cards, runs its own payment network, and provides travel and lifestyle services to consumers and businesses.',
    lists: ['Payments', 'Banks'],
    ceo: 'Stephen Squeri',
    employees: 75100,
    hq: 'New York, NY',
    founded: 1850,
    sharesOut: 0.7,
    pe: 19.4,
    dividendYield: 1.12,
  },
  {
    ticker: 'PINS',
    name: 'Pinterest',
    kind: 'stock',
    price: 33.18,
    change: 1.95,
    sector: 'Communication',
    color: '#E60023',
    brand: 'pinterest',
    about:
      'Pinterest is a visual discovery platform where people save and shop ideas for home, style, food, and travel, funded by advertising.',
    lists: ['Social Media', 'Advertising'],
    ceo: 'Bill Ready',
    employees: 4700,
    hq: 'San Francisco, CA',
    founded: 2008,
    sharesOut: 0.68,
    pe: 28.6,
  },
  {
    ticker: 'SNAP',
    name: 'Snap',
    kind: 'stock',
    price: 11.42,
    change: -2.74,
    sector: 'Communication',
    color: '#FFFC00',
    brand: 'snapchat',
    about:
      'Snap makes Snapchat, a camera and messaging app built around disappearing photos and stories, plus Spectacles augmented-reality glasses.',
    lists: ['Social Media'],
    ceo: 'Evan Spiegel',
    employees: 4900,
    hq: 'Santa Monica, CA',
    founded: 2011,
    sharesOut: 1.68,
  },
  {
    ticker: 'ZM',
    name: 'Zoom Communications',
    kind: 'stock',
    price: 76.05,
    change: 0.88,
    sector: 'Technology',
    color: '#0B5CFF',
    brand: 'zoom',
    about:
      'Zoom provides video meetings, team chat, phone, contact-center, and AI companion tools used by businesses, schools, and individuals.',
    lists: ['Cloud', 'Subscriptions'],
    ceo: 'Eric Yuan',
    employees: 7400,
    hq: 'San Jose, CA',
    founded: 2011,
    sharesOut: 0.31,
    pe: 23.7,
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    kind: 'crypto',
    price: 68420.15,
    change: 2.36,
    sector: 'Crypto',
    color: '#F7931A',
    glyph: '₿',
    about:
      'Bitcoin is the first decentralized digital currency. Transactions are verified by a global network of miners and recorded on a public ledger, with issuance capped at 21 million coins.',
    lists: ['Crypto'],
    circulating: 19.79e6,
    maxSupply: 21e6,
    launched: 2009,
    consensus: 'Proof of work',
  },
  {
    ticker: 'ETH',
    name: 'Ethereum',
    kind: 'crypto',
    price: 3384.62,
    change: -1.18,
    sector: 'Crypto',
    color: '#627EEA',
    glyph: 'Ξ',
    about:
      'Ethereum is a programmable blockchain for smart contracts and decentralized applications. Ether pays for computation and secures the network through staking.',
    lists: ['Crypto'],
    circulating: 120.4e6,
    maxSupply: null,
    launched: 2015,
    consensus: 'Proof of stake',
  },
  {
    ticker: 'SOL',
    name: 'Solana',
    kind: 'crypto',
    price: 162.48,
    change: 5.71,
    sector: 'Crypto',
    color: '#9945FF',
    glyph: '◎',
    about:
      'Solana is a high-throughput blockchain designed for fast, low-cost transactions, popular for payments, trading, and consumer apps.',
    lists: ['Crypto'],
    circulating: 470e6,
    maxSupply: null,
    launched: 2020,
    consensus: 'Proof of stake + history',
  },
];

export const STOCKS = ASSETS.filter((asset) => asset.kind === 'stock');
export const CRYPTO = ASSETS.filter((asset) => asset.kind === 'crypto');
export const findAsset = (ticker: string) => ASSETS.find((asset) => asset.ticker === ticker);

export interface Position {
  qty: number;
  avgCost: number;
}
export const START_POSITIONS: Record<string, Position> = {
  AAPL: { qty: 12, avgCost: 168.4 },
  MSFT: { qty: 4, avgCost: 352.1 },
  GOOGL: { qty: 10, avgCost: 141.2 },
  SPOT: { qty: 6, avgCost: 288.75 },
  V: { qty: 5, avgCost: 271.3 },
  PINS: { qty: 30, avgCost: 38.9 },
  BTC: { qty: 0.085, avgCost: 52310 },
  ETH: { qty: 1.4, avgCost: 2875 },
};
export const START_CASH = 2450;
export const START_WATCHLIST = ['META', 'RDDT', 'MA', 'SOL'];

// ---------------------------------------------------------------------------
// Seeded randomness

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(next: () => number) {
  const u = Math.max(next(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
}

const between = (next: () => number, min: number, max: number) => min + (max - min) * next();

// ---------------------------------------------------------------------------
// Price history

/** Fixed "now" so every launch draws the same timeline. */
const NOW = Date.UTC(2026, 9, 29, 20, 0);
const DAY = 86400000;

interface RangeSpec {
  candles: number;
  steps: number;
  sigma: number;
  span: number;
  returns: [number, number];
}
const SPECS: Record<Range, RangeSpec> = {
  '1D': { candles: 26, steps: 3, sigma: 0.012, span: 0.27 * DAY, returns: [0, 0] },
  '1W': { candles: 28, steps: 3, sigma: 0.03, span: 7 * DAY, returns: [-0.05, 0.07] },
  '1M': { candles: 22, steps: 3, sigma: 0.055, span: 30 * DAY, returns: [-0.08, 0.12] },
  '3M': { candles: 26, steps: 3, sigma: 0.09, span: 91 * DAY, returns: [-0.12, 0.2] },
  '1Y': { candles: 26, steps: 3, sigma: 0.16, span: 365 * DAY, returns: [-0.2, 0.55] },
  '5Y': { candles: 30, steps: 3, sigma: 0.3, span: 1826 * DAY, returns: [-0.25, 2.4] },
};

export interface PricePoint {
  x: number;
  y: number;
  label: string;
}
export interface Candle {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export interface History {
  points: PricePoint[];
  candles: Candle[];
  start: number;
  end: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function clock(date: Date) {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}
function timeLabel(range: Range, time: number) {
  // Labels are written in market time (ET), four hours behind the UTC clock.
  const date = new Date(time - 4 * 3600000);
  if (range === '1D') return clock(date);
  if (range === '1W') return `${WEEKDAYS[date.getUTCDay()]} ${clock(date)}`;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

const historyCache = new Map<string, History>();

/** A seeded bridge walk that starts at the range's opening price and ends at today's price. */
export function getHistory(asset: Asset, range: Range): History {
  const key = `${asset.ticker}:${range}`;
  const cached = historyCache.get(key);
  if (cached) return cached;
  const spec = SPECS[range];
  const next = rng(key);
  const crypto = asset.kind === 'crypto';
  const vol = crypto ? 2 : 1;
  const end = asset.price;
  const rangeReturn = range === '1D' ? asset.change / 100 : between(next, spec.returns[0] * vol, spec.returns[1] * vol);
  const start = end / (1 + rangeReturn);
  const count = spec.candles * spec.steps;
  const stepSigma = (spec.sigma * vol) / Math.sqrt(count);
  const walk = [0];
  for (let i = 1; i <= count; i++) walk.push(walk[i - 1] + gauss(next) * stepSigma);
  const logStart = Math.log(start);
  const logEnd = Math.log(end);
  const span = crypto && range === '1D' ? DAY : spec.span;
  const values = walk.map((value, i) => {
    const t = i / count;
    return Math.exp(logStart + (logEnd - logStart) * t + value - t * walk[count]);
  });
  const points = values.map((y, i) => ({ x: i, y, label: timeLabel(range, NOW - span * (1 - i / count)) }));
  const baseVolume = averageVolume(asset) / (range === '1D' ? spec.candles : 1);
  const candles: Candle[] = [];
  for (let c = 0; c < spec.candles; c++) {
    const chunk = values.slice(c * spec.steps, (c + 1) * spec.steps + 1);
    const open = chunk[0];
    const close = chunk[chunk.length - 1];
    const wick = 1 + stepSigma * 0.6 * next();
    candles.push({
      x: c,
      open,
      close,
      high: Math.max(...chunk) * wick,
      low: Math.min(...chunk) / wick,
      volume: baseVolume * between(next, 0.55, 1.6) * (range === '1D' && (c < 3 || c > spec.candles - 4) ? 1.8 : 1),
    });
  }
  const history = { points, candles, start, end };
  historyCache.set(key, history);
  return history;
}

/** Twenty-odd intraday points for list-row sparklines. */
export function sparkline(asset: Asset) {
  return getHistory(asset, '1D')
    .points.filter((_, i) => i % 3 === 0)
    .map((point) => point.y);
}

// ---------------------------------------------------------------------------
// Statistics

export function averageVolume(asset: Asset) {
  const next = rng(`${asset.ticker}:volume`);
  if (asset.kind === 'crypto') return marketCap(asset) * between(next, 0.025, 0.06);
  return (asset.sharesOut ?? 1) * 1e9 * between(next, 0.003, 0.012);
}

export function marketCap(asset: Asset) {
  if (asset.kind === 'crypto') return (asset.circulating ?? 0) * asset.price;
  return (asset.sharesOut ?? 1) * 1e9 * asset.price;
}

export interface KeyStats {
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  low52: number;
  high52: number;
  prevClose: number;
}

export function keyStats(asset: Asset): KeyStats {
  const day = getHistory(asset, '1D');
  const year = getHistory(asset, '1Y');
  const next = rng(`${asset.ticker}:stats`);
  const avgVolume = averageVolume(asset);
  return {
    open: day.candles[0].open,
    high: Math.max(...day.candles.map((candle) => candle.high)),
    low: Math.min(...day.candles.map((candle) => candle.low)),
    volume: avgVolume * between(next, 0.7, 1.4),
    avgVolume,
    marketCap: marketCap(asset),
    low52: Math.min(...year.candles.map((candle) => candle.low)),
    high52: Math.max(...year.candles.map((candle) => candle.high)),
    prevClose: day.start,
  };
}

export interface Ratings {
  buy: number;
  hold: number;
  sell: number;
  targetLow: number;
  targetAvg: number;
  targetHigh: number;
}

export function analystRatings(asset: Asset): Ratings {
  const next = rng(`${asset.ticker}:ratings`);
  const total = Math.round(between(next, 24, 58));
  const buyShare = between(next, 0.35, 0.9);
  const buy = Math.round(total * buyShare);
  const sell = Math.round((total - buy) * between(next, 0, 0.35));
  const targetAvg = asset.price * between(next, 1.02, 1.22);
  return {
    buy,
    hold: total - buy - sell,
    sell,
    targetLow: asset.price * between(next, 0.72, 0.92),
    targetAvg,
    targetHigh: targetAvg * between(next, 1.12, 1.3),
  };
}

export interface Quarter {
  label: string;
  estimate: number;
  actual: number;
  revenue: number;
  margin: number;
}
const QUARTERS = ["Q4 '25", "Q1 '26", "Q2 '26", "Q3 '26"];

export function earnings(asset: Asset) {
  const next = rng(`${asset.ticker}:earnings`);
  const annualEps = asset.pe ? asset.price / asset.pe : -asset.price * 0.02;
  const revenueBase = marketCap(asset) / between(next, 5, 11) / 4;
  const baseMargin = asset.pe ? between(next, 12, 34) : between(next, -8, 2);
  const quarters: Quarter[] = QUARTERS.map((label, i) => {
    const estimate = (annualEps / 4) * (0.9 + i * 0.04) * between(next, 0.94, 1.06);
    const beat = next() < 0.75 ? between(next, 0.01, 0.09) : -between(next, 0.01, 0.05);
    return {
      label,
      estimate,
      actual: estimate + Math.abs(estimate) * beat,
      revenue: revenueBase * (0.9 + i * 0.035) * between(next, 0.97, 1.03),
      margin: baseMargin + i * 0.4 + between(next, -1.5, 1.5),
    };
  });
  const last = quarters[quarters.length - 1];
  return {
    quarters,
    next: { label: "Q4 '26", date: 'Jan 28, 2027', estimate: last.estimate * between(next, 1.01, 1.08) },
  };
}

export interface NewsItem {
  id: string;
  source: string;
  age: string;
  title: string;
  move: number;
}
const SOURCES = ['Market Wire', 'The Ledger', 'Sprout Daily', 'Ticker Tape', 'Capital Brief'];
const STOCK_HEADLINES = [
  '{name} shares move after analysts revisit price targets',
  'What to watch from {name} ahead of next quarter',
  '{name} expands buyback program, sample filing shows',
  'Options traders lean bullish on {ticker} into the close',
  'Is {name} still a long-term hold? Three charts to consider',
];
const CRYPTO_HEADLINES = [
  '{name} climbs as on-chain activity hits a monthly high',
  'Funds tracking {name} see another week of inflows',
  'Why {ticker} volatility is cooling this month',
  '{name} developers outline the next network upgrade',
  'Miners and stakers: who is holding {ticker} now',
];

export function news(asset: Asset): NewsItem[] {
  const next = rng(`${asset.ticker}:news`);
  const templates = asset.kind === 'crypto' ? CRYPTO_HEADLINES : STOCK_HEADLINES;
  return templates.slice(0, 4).map((template, i) => ({
    id: `${asset.ticker}-news-${i}`,
    source: SOURCES[Math.floor(next() * SOURCES.length)],
    age: i === 0 ? `${1 + Math.floor(next() * 50)}m` : `${i * 3 + Math.floor(next() * 3)}h`,
    title: template.replace('{name}', asset.name).replace('{ticker}', asset.ticker),
    move: asset.change + between(next, -1.2, 1.2),
  }));
}

/** Assets that share a list with this one, ordered by overlap. */
export function peopleAlsoOwn(asset: Asset) {
  return ASSETS.filter((other) => other.ticker !== asset.ticker && other.kind === asset.kind)
    .map((other) => ({
      other,
      score:
        other.lists.filter((list) => asset.lists.includes(list)).length + (other.sector === asset.sector ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.other.ticker.localeCompare(b.other.ticker))
    .slice(0, 6)
    .map((item) => item.other);
}

export const LISTS = Array.from(new Set(ASSETS.flatMap((asset) => asset.lists)));
export const assetsInList = (list: string) => ASSETS.filter((asset) => asset.lists.includes(list));

// ---------------------------------------------------------------------------
// Market-wide

export const SECTORS = [
  'Technology',
  'Communication',
  'Financials',
  'Consumer',
  'Healthcare',
  'Energy',
  'Industrials',
  'Utilities',
  'Real Estate',
];
export const SECTOR_PERIODS = ['1D', '1W', '1M', '3M', 'YTD', '1Y'];
const PERIOD_SCALE = [1.2, 2.6, 4.5, 7, 11, 14];

export const SECTOR_RETURNS: number[][] = SECTORS.map((sector) => {
  const next = rng(`sector:${sector}`);
  const bias = between(next, -0.4, 0.9);
  return PERIOD_SCALE.map((scale) => Math.round((bias + between(next, -1, 1)) * scale * 10) / 10);
});

export const INDEXES = [
  { name: 'S&P 500', value: 5864.21, change: 0.74 },
  { name: 'Nasdaq', value: 18512.6, change: 1.12 },
  { name: 'Dow', value: 42390.8, change: 0.21 },
];

/** Twelve months of dividend income from the demo positions. */
export const DIVIDENDS = (() => {
  const next = rng('dividends');
  return ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => ({
    category: month,
    value: Math.round((i % 3 === 2 ? between(next, 9, 14) : between(next, 1.5, 5)) * 100) / 100,
  }));
})();
