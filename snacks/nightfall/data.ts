/** Fictional Nightfall catalog. Every title, person and episode here is invented demo content. */

export const ART = [
  require('./assets/scene-forest.webp'),
  require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'),
  require('./assets/scene-lake.webp'),
  require('./assets/scene-ocean.webp'),
];

export type Kind = 'movie' | 'series';

export interface Episode {
  n: number;
  title: string;
  length: string;
  synopsis: string;
}

export interface Title {
  id: string;
  title: string;
  kind: Kind;
  genres: string[];
  /** Mood tags ("This title is…"). */
  moods: string[];
  year: string;
  rating: string;
  /** Movie runtime, or a season count label for series. */
  length: string;
  art: number;
  /** Colour wash laid over the shared scene art so reused images read as different titles. */
  tint: string;
  match: number;
  caption: string;
  synopsis: string;
  cast: string[];
  creator: string;
  original?: boolean;
  label?: 'New Season' | 'Recently Added' | 'New Episodes';
  /** Release note for unreleased titles, such as "Nov 6". */
  coming?: { month: string; day: string; note: string };
  seasons?: Episode[][];
}

const ep = (n: number, title: string, length: string, synopsis: string): Episode => ({ n, title, length, synopsis });

export const TITLES: Title[] = [
  {
    id: 'dust',
    title: 'Dust & Static',
    kind: 'series',
    genres: ['Sci-Fi', 'Thriller'],
    moods: ['Gritty', 'Suspenseful', 'Mind-Bending'],
    year: '2026',
    rating: 'TV-MA',
    length: '2 Seasons',
    art: 2,
    tint: '#C2410C55',
    match: 97,
    caption: 'The signal came from nowhere. Then it started answering back.',
    synopsis:
      'At a remote desert observatory, a night-shift engineer picks up a broadcast that predicts tomorrow. Every warning she ignores comes true.',
    cast: ['Maya Chen', 'Isaac Holt', 'Nadia Cole', 'Evan Price', 'Rosa Field'],
    creator: 'Hanna Voss',
    original: true,
    label: 'New Season',
    seasons: [
      [
        ep(1, 'Dead Air', '52m', 'A routine calibration catches a voice on a frequency nobody uses.'),
        ep(2, 'Carrier Wave', '48m', 'Iris tests the broadcast with a prediction she can check by morning.'),
        ep(3, 'Interference', '51m', 'A visitor from the agency asks too many questions about the dish.'),
        ep(4, 'Feedback Loop', '55m', 'The signal names someone inside the observatory.'),
        ep(5, 'Ground Station', '49m', 'A sandstorm cuts the power and the broadcast keeps going.'),
        ep(6, 'Sign Off', '61m', 'Iris decides whether to answer the voice at last.'),
      ],
      [
        ep(1, 'Static Bloom', '54m', 'Six months later, the dish turns on by itself.'),
        ep(2, 'Night Relay', '50m', 'A second station picks up the same voice across the border.'),
        ep(3, 'Low Band', '47m', 'Old logbooks reveal the signal has called before.'),
        ep(4, 'Open Channel', '58m', 'The team broadcasts a reply and waits.'),
      ],
    ],
  },
  {
    id: 'evergreen',
    title: 'Evergreen',
    kind: 'movie',
    genres: ['Adventure', 'Drama'],
    moods: ['Heartfelt', 'Inspiring'],
    year: '2026',
    rating: 'PG-13',
    length: '1h 48m',
    art: 0,
    tint: '#15803D33',
    match: 98,
    caption: 'Some paths lead you back to yourself.',
    synopsis:
      'A field researcher returns to the forest where everything began and finds an unexpected new trail that is not on any map.',
    cast: ['Ava Morgan', 'Elliot Hayes', 'Mina Brooks', 'Leo Carter'],
    creator: 'Ruth Okafor',
    original: true,
  },
  {
    id: 'tidekeepers',
    title: 'The Tidekeepers',
    kind: 'series',
    genres: ['Fantasy', 'Drama'],
    moods: ['Imaginative', 'Epic'],
    year: '2025',
    rating: 'TV-14',
    length: '1 Season',
    art: 4,
    tint: '#1D4ED855',
    match: 95,
    caption: 'The sea keeps its promises. People do not.',
    synopsis:
      'On an island where the tide obeys an old pact, the last keeper must find an heir before the water forgets its place.',
    cast: ['Kai Bennett', 'Lena Ortiz', 'Owen Blake', 'Dara Quinn'],
    creator: 'Tomas Wilde',
    original: true,
    label: 'New Episodes',
    seasons: [
      [
        ep(1, 'Low Water', '57m', 'The tide fails to turn for the first time in a hundred years.'),
        ep(2, 'The Lighthouse Key', '53m', 'Mara inherits a key and a duty she never asked for.'),
        ep(3, 'Salt Ledger', '49m', 'The pact turns out to have a second signature.'),
        ep(4, 'Undertow', '55m', 'A storm brings a stranger who knows the old words.'),
        ep(5, 'High Water', '62m', 'The island chooses its keeper.'),
      ],
    ],
  },
  {
    id: 'afterdark',
    title: 'After Dark',
    kind: 'movie',
    genres: ['Mystery', 'Thriller'],
    moods: ['Dark', 'Suspenseful'],
    year: '2026',
    rating: 'R',
    length: '2h 02m',
    art: 1,
    tint: '#7C3AED44',
    match: 92,
    caption: 'Every city keeps a secret.',
    synopsis: 'One night, one city, and a clue hidden in plain sight. A cab driver has until dawn to prove what she saw.',
    cast: ['Nora Vale', 'Julian Cross', 'Iris Chen', 'Marcus Reed'],
    creator: 'Dev Anand Rao',
    original: true,
  },
  {
    id: 'stillwater',
    title: 'Stillwater',
    kind: 'series',
    genres: ['Documentary', 'Nature'],
    moods: ['Soothing', 'Visually Striking'],
    year: '2026',
    rating: 'TV-G',
    length: '2 Seasons',
    art: 3,
    tint: '#0E749033',
    match: 89,
    caption: 'Beneath the surface.',
    synopsis: 'An intimate look at the wild places where water shapes every life around it, filmed across four seasons.',
    cast: ['Elena Park', 'Samir Shah'],
    creator: 'Elena Park',
    seasons: [
      [
        ep(1, 'Thaw', '44m', 'Spring melt wakes a mountain lake and everything that depends on it.'),
        ep(2, 'Shallows', '42m', 'Life crowds into the warm edges of the water.'),
        ep(3, 'Deep Cold', '46m', 'Under the ice, the lake keeps moving.'),
      ],
      [
        ep(1, 'Estuary', '45m', 'Where rivers meet the sea, two worlds trade places twice a day.'),
        ep(2, 'Floodplain', '43m', 'A once-a-decade flood remakes a valley overnight.'),
      ],
    ],
  },
  {
    id: 'nightshift',
    title: 'Night Shift',
    kind: 'series',
    genres: ['Comedy'],
    moods: ['Witty', 'Feel-Good'],
    year: '2024',
    rating: 'TV-14',
    length: '2 Seasons',
    art: 1,
    tint: '#DB277744',
    match: 94,
    caption: 'The city never sleeps. Neither do they.',
    synopsis: 'A mismatched team keeps a tiny late-night radio station on the air, one strange caller at a time.',
    cast: ['Riley James', 'Theo Martin', 'Zoe Patel', 'Miles Grant'],
    creator: 'Gabe Lindqvist',
    original: true,
    seasons: [
      [
        ep(1, 'Graveyard Slot', '28m', 'Dee takes over the 2 a.m. show nobody else wants.'),
        ep(2, 'Caller Four', '26m', 'A regular caller claims to be the station’s founder.'),
        ep(3, 'Dead Air Fund', '27m', 'The team throws a pledge drive with no budget.'),
        ep(4, 'Static Love', '29m', 'Two listeners fall for each other live on air.'),
      ],
      [
        ep(1, 'Signal Boost', '30m', 'A viral clip brings the wrong kind of attention.'),
        ep(2, 'Request Line', '27m', 'Theo plays a song he swore he never would.'),
        ep(3, 'Sunrise', '31m', 'The last show before the station is sold.'),
      ],
    ],
  },
  {
    id: 'goldenhour',
    title: 'Golden Hour',
    kind: 'movie',
    genres: ['Drama'],
    moods: ['Emotional', 'Heartfelt'],
    year: '2025',
    rating: 'PG-13',
    length: '1h 39m',
    art: 2,
    tint: '#CA8A0444',
    match: 90,
    caption: 'The light changes everything.',
    synopsis: 'Two old friends cross the desert to make good on a promise they made twenty years ago.',
    cast: ['Sofia Reyes', 'Caleb Ward', 'Amara Bell', 'Jonah Wells'],
    creator: 'Lucia Marchetti',
    label: 'Recently Added',
  },
  {
    id: 'hollowpines',
    title: 'Hollow Pines',
    kind: 'series',
    genres: ['Horror', 'Mystery'],
    moods: ['Eerie', 'Ominous'],
    year: '2025',
    rating: 'TV-MA',
    length: '1 Season',
    art: 0,
    tint: '#11182799',
    match: 86,
    caption: 'Nobody hikes the north trail twice.',
    synopsis: 'When a camp counsellor goes missing, a small mountain town learns the woods have been counting.',
    cast: ['Piper Lane', 'Finn Walker', 'June Ellis', 'Arlo Stone'],
    creator: 'Marcus Dahl',
    original: true,
    seasons: [
      [
        ep(1, 'Trailhead', '47m', 'The first night of camp ends with an empty bunk.'),
        ep(2, 'Cairns', '45m', 'Someone is building stone markers around the town.'),
        ep(3, 'Ranger Station', '50m', 'An old ranger finally talks about 1994.'),
        ep(4, 'North Trail', '58m', 'The search party splits up. Not everyone comes back.'),
      ],
    ],
  },
  {
    id: 'deepblue',
    title: 'Deep Blue',
    kind: 'movie',
    genres: ['Adventure', 'Family'],
    moods: ['Exciting', 'Feel-Good'],
    year: '2025',
    rating: 'PG',
    length: '1h 31m',
    art: 4,
    tint: '#0369A133',
    match: 91,
    caption: 'The horizon is only the beginning.',
    synopsis: 'A small crew sets sail toward a distant island and a much larger discovery beneath it.',
    cast: ['Kai Bennett', 'Lena Ortiz', 'Owen Blake'],
    creator: 'Imani Brooks',
  },
  {
    id: 'mirage',
    title: 'Mirage',
    kind: 'movie',
    genres: ['Sci-Fi', 'Thriller'],
    moods: ['Mind-Bending', 'Suspenseful'],
    year: '2026',
    rating: 'PG-13',
    length: '1h 56m',
    art: 2,
    tint: '#9333EA33',
    match: 93,
    caption: 'What you see is only the start.',
    synopsis: 'A strange signal brings a research team to the edge of the desert, where the horizon refuses to stay put.',
    cast: ['Maya Chen', 'Isaac Holt', 'Nadia Cole', 'Evan Price'],
    creator: 'Hanna Voss',
    original: true,
    label: 'Recently Added',
  },
  {
    id: 'lanterns',
    title: 'Paper Lanterns',
    kind: 'movie',
    genres: ['Romance', 'Comedy'],
    moods: ['Romantic', 'Charming'],
    year: '2026',
    rating: 'PG',
    length: '1h 44m',
    art: 3,
    tint: '#F9731633',
    match: 88,
    caption: 'One lake. One summer. One very bad idea.',
    synopsis: 'A wedding planner and a rival caterer get stranded at a lakeside festival they both swore to ruin.',
    cast: ['Tessa Cole', 'Micah Ford', 'Zoe Patel', 'Riley James'],
    creator: 'Noor Haddad',
  },
  {
    id: 'wildwood',
    title: 'Wildwood',
    kind: 'movie',
    genres: ['Family', 'Adventure'],
    moods: ['Heartfelt', 'Feel-Good'],
    year: '2025',
    rating: 'PG',
    length: '1h 27m',
    art: 0,
    tint: '#65A30D33',
    match: 87,
    caption: 'A summer to remember.',
    synopsis: 'Four siblings discover their favourite campsite has one last surprise before it closes for good.',
    cast: ['Piper Lane', 'Finn Walker', 'June Ellis', 'Arlo Stone'],
    creator: 'Sam Ortega',
  },
  {
    id: 'northern',
    title: 'Northern Signal',
    kind: 'series',
    genres: ['Thriller', 'Drama'],
    moods: ['Tense', 'Atmospheric'],
    year: '2026',
    rating: 'TV-MA',
    length: '1 Season',
    art: 3,
    tint: '#0F766E55',
    match: 96,
    caption: 'Out here, the radio is the only witness.',
    synopsis: 'A lighthouse radio operator hears a mayday from a ship that sank forty years ago.',
    cast: ['Nora Vale', 'Owen Blake', 'Amara Bell'],
    creator: 'Tomas Wilde',
    original: true,
    coming: { month: 'NOV', day: '06', note: 'Coming Friday' },
    seasons: [[ep(1, 'Mayday', '54m', 'A call comes in on a channel that was closed decades ago.')]],
  },
  {
    id: 'glasshouse',
    title: 'Glasshouse',
    kind: 'movie',
    genres: ['Mystery', 'Drama'],
    moods: ['Stylish', 'Twisty'],
    year: '2026',
    rating: 'R',
    length: '2h 08m',
    art: 1,
    tint: '#BE123C44',
    match: 90,
    caption: 'Everyone can see in. Nobody can see out.',
    synopsis: 'An architect’s celebrated glass house becomes the scene of a disappearance that every guest saw — differently.',
    cast: ['Julian Cross', 'Iris Chen', 'Sofia Reyes'],
    creator: 'Dev Anand Rao',
    original: true,
    coming: { month: 'NOV', day: '13', note: 'Coming Nov 13' },
  },
  {
    id: 'saltwater',
    title: 'Saltwater Saints',
    kind: 'series',
    genres: ['Comedy', 'Drama'],
    moods: ['Warm', 'Quirky'],
    year: '2026',
    rating: 'TV-14',
    length: '1 Season',
    art: 4,
    tint: '#0284C744',
    match: 93,
    caption: 'Every harbour town needs a patron saint. This one got three.',
    synopsis: 'Three estranged sisters inherit a failing fishing boat and the family feud that comes with it.',
    cast: ['Lena Ortiz', 'Tessa Cole', 'June Ellis'],
    creator: 'Noor Haddad',
    coming: { month: 'NOV', day: '20', note: 'Coming Nov 20' },
    seasons: [[ep(1, 'Low Tide Blessing', '41m', 'The sisters meet at the dock for the first time in a decade.')]],
  },
];

export const byId = (id: string) => TITLES.find((item) => item.id === id) ?? TITLES[0];
export const released = TITLES.filter((item) => !item.coming);
export const comingSoon = TITLES.filter((item) => item.coming);
export const TOP_SHOWS = ['dust', 'tidekeepers', 'nightshift', 'hollowpines', 'stillwater'];
export const TOP_MOVIES = ['evergreen', 'mirage', 'afterdark', 'goldenhour', 'lanterns', 'deepblue', 'wildwood'];
export const topRank = (title: Title) => {
  const list = title.kind === 'series' ? TOP_SHOWS : TOP_MOVIES;
  const index = list.indexOf(title.id);
  return index < 0 ? null : index + 1;
};
export const GENRES = Array.from(new Set(released.flatMap((item) => item.genres))).sort();
export const TOP_SEARCHES = ['afterdark', 'dust', 'evergreen', 'hollowpines', 'lanterns', 'tidekeepers', 'mirage', 'nightshift'];

export function similarTo(title: Title) {
  return released
    .filter((item) => item.id !== title.id)
    .map((item) => ({ item, score: item.genres.filter((genre) => title.genres.includes(genre)).length + (item.kind === title.kind ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export const trailersFor = (title: Title) => [
  { id: `${title.id}:trailer`, label: title.coming ? 'Official Teaser' : 'Official Trailer', length: '2:18' },
  { id: `${title.id}:look`, label: title.kind === 'series' ? 'Season 1 Recap' : 'First Look', length: '1:42' },
  { id: `${title.id}:bts`, label: 'Behind the Scenes', length: '4:05' },
];

export const PROFILES = [
  { id: 'avery', name: 'Avery', color: '#2F6FDB' },
  { id: 'jordan', name: 'Jordan', color: '#E5A00D' },
  { id: 'sam', name: 'Sam', color: '#2BAE66' },
  { id: 'kids', name: 'Kids', color: '#E5487D' },
];
export type Profile = (typeof PROFILES)[number];

export const NOTIFICATIONS = [
  { id: 'n1', titleId: 'tidekeepers', kicker: 'New Episodes', text: 'The Tidekeepers', date: 'Today' },
  { id: 'n2', titleId: 'northern', kicker: 'Coming Friday', text: 'Northern Signal — remind me?', date: 'Yesterday' },
  { id: 'n3', titleId: 'dust', kicker: 'New Season', text: 'Dust & Static Season 2 is here', date: 'Oct 24' },
  { id: 'n4', titleId: 'mirage', kicker: 'Recently Added', text: 'Mirage', date: 'Oct 19' },
];

export const CAST_COLORS = ['#663BA1', '#AF484E', '#2C777B', '#9A6B2C', '#3B5BA1'];
export const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');
