export type Community = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  banner: string;
  members: number;
  online: number;
  about: string;
  created: string;
  rules: string[];
};
export type Post = {
  id: string;
  community: string;
  author: string;
  title: string;
  body: string;
  ts: number;
  votes: number;
  flair?: string;
  image?: { emoji: string; bg: string; caption?: string };
};
export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  author: string;
  text: string;
  ts: number;
  votes: number;
};
export type Notice = { id: string; kind: 'reply' | 'upvote' | 'community'; text: string; postId: string; ts: number };

const NOW = Date.now();
export const ago = (minutes: number) => NOW - minutes * 60000;

export const COMMUNITIES: Community[] = [
  {
    id: 'cozyspaces',
    name: 'Cozy Spaces',
    emoji: '🛋️',
    color: '#E0803A',
    banner: '#F6D9BF',
    members: 42800,
    online: 312,
    about: 'Small corners, big comfort. Share the nooks, reading chairs and sunny windows that make a home feel like yours.',
    created: 'Mar 3, 2019',
    rules: ['Share your own space', 'Be kind about budgets', 'No sales or affiliate links', 'Credit artists and makers'],
  },
  {
    id: 'askhere',
    name: 'Ask Here',
    emoji: '💬',
    color: '#3B7BD9',
    banner: '#CFE0F8',
    members: 87400,
    online: 1240,
    about: 'Curious questions and kind answers. Ask anything that sparks a good conversation.',
    created: 'Jan 18, 2018',
    rules: ['Questions go in the title', 'Answer in good faith', 'No personal info', 'No medical or legal advice'],
  },
  {
    id: 'shutterwalk',
    name: 'Shutter Walk',
    emoji: '📷',
    color: '#7A5AF8',
    banner: '#DED5FD',
    members: 61300,
    online: 488,
    about: 'Photos from everyday walks. Any camera counts, especially the one in your pocket.',
    created: 'Jun 9, 2020',
    rules: ['Original photos only', 'Add the location if you can', 'Constructive critique only'],
  },
  {
    id: 'homecooking',
    name: 'Home Cooking',
    emoji: '🍳',
    color: '#D9473B',
    banner: '#F8D3CF',
    members: 53900,
    online: 402,
    about: 'Everyday food worth sharing. Weeknight dinners, family recipes and kitchen wins.',
    created: 'Oct 2, 2017',
    rules: ['Include the recipe or method', 'No food shaming', 'Tag dietary info when you can'],
  },
  {
    id: 'pixelcraft',
    name: 'Pixel Craft',
    emoji: '✦',
    color: '#1F9E89',
    banner: '#C7EDE5',
    members: 35100,
    online: 205,
    about: 'Make, share and discuss interface, icon and type design. Works in progress welcome.',
    created: 'Feb 14, 2021',
    rules: ['Show your process', 'Feedback should be specific', 'No spec work requests'],
  },
  {
    id: 'plantparents',
    name: 'Plant Parents',
    emoji: '🪴',
    color: '#3E9B4F',
    banner: '#D3EFD7',
    members: 48700,
    online: 356,
    about: 'Houseplant help, propagation wins and the occasional crispy leaf. All growers welcome.',
    created: 'Apr 22, 2019',
    rules: ['Add light and watering details when asking for help', 'Identify pests kindly', 'No plant selling'],
  },
  {
    id: 'tabletopnight',
    name: 'Tabletop Night',
    emoji: '🎲',
    color: '#C2410C',
    banner: '#FBDCC8',
    members: 29600,
    online: 174,
    about: 'Board games, card games and the friends you play them with. Recommendations, house rules and table photos.',
    created: 'Aug 30, 2020',
    rules: ['Spoiler-tag legacy campaigns', 'Be welcoming to new players', 'No piracy'],
  },
  {
    id: 'curiouscosmos',
    name: 'Curious Cosmos',
    emoji: '🔭',
    color: '#334FB4',
    banner: '#D2DAF6',
    members: 71200,
    online: 690,
    about: 'Stargazing, space news and the big questions. Backyard telescopes to deep field images.',
    created: 'Nov 11, 2016',
    rules: ['Cite sources for news', 'No conspiracy theories', 'Astrophotography: list your gear'],
  },
];

export const POSTS: Post[] = [
  {
    id: 'p1',
    community: 'cozyspaces',
    author: 'softcorner',
    title: 'I finally made my tiny reading nook feel like home',
    body: 'A thrifted chair, a warm lamp, and a stack of books. Sometimes the small changes do the most. The blanket was my grandmother’s and the side table was a curb find.',
    ts: ago(120),
    votes: 842,
    flair: 'Before & after',
    image: { emoji: '📚', bg: '#F4E3D3', caption: 'Corner by the window' },
  },
  {
    id: 'p2',
    community: 'askhere',
    author: 'curiousbird',
    title: 'What is one small habit that made your days better?',
    body: 'Looking for little ideas that are easy to actually stick with. Mine is putting my phone in another room for the first hour of the day.',
    ts: ago(190),
    votes: 2526,
  },
  {
    id: 'p3',
    community: 'shutterwalk',
    author: 'bluehour',
    title: 'Caught the last light on my walk home',
    body: 'No special camera, just good timing and a little luck.',
    ts: ago(300),
    votes: 1204,
    flair: 'Phone shot',
    image: { emoji: '🌅', bg: '#FAD7B5', caption: 'Harbor path, 7:42 pm' },
  },
  {
    id: 'p4',
    community: 'homecooking',
    author: 'panandspoon',
    title: 'A one pot dinner I keep coming back to',
    body: 'Tomatoes, beans, greens, and a lot of lemon. It is flexible, affordable, and even better the next day.\n\n1. Soften an onion and three cloves of garlic in olive oil.\n2. Add a can of tomatoes and a can of white beans.\n3. Simmer ten minutes, stir in two big handfuls of greens.\n4. Finish with lemon zest, juice and plenty of black pepper.',
    ts: ago(420),
    votes: 379,
    flair: 'Recipe',
    image: { emoji: '🍲', bg: '#F8DCCF' },
  },
  {
    id: 'p5',
    community: 'pixelcraft',
    author: 'marlowmakes',
    title: 'Sharing a few icons from my latest project',
    body: 'I wanted them to feel friendly at very small sizes. Rounded joins, a 1.75 stroke and a 24 px grid. Feedback welcome!',
    ts: ago(600),
    votes: 689,
    flair: 'Feedback',
    image: { emoji: '🎨', bg: '#D5F0EA', caption: '48 icons, 24 px grid' },
  },
  {
    id: 'p6',
    community: 'askhere',
    author: 'justwondering',
    title: 'What movie do you wish you could watch for the first time again?',
    body: 'I need something good for a rainy weekend.',
    ts: ago(1300),
    votes: 912,
  },
  {
    id: 'p7',
    community: 'plantparents',
    author: 'fernandez_grows',
    title: 'My monstera finally put out a fenestrated leaf!',
    body: 'Three years of waiting. Moved it closer to the east window in spring and it took off.',
    ts: ago(75),
    votes: 1532,
    flair: 'Success',
    image: { emoji: '🌿', bg: '#D6EFD9', caption: 'Leaf number 11' },
  },
  {
    id: 'p8',
    community: 'plantparents',
    author: 'crispyleaf',
    title: 'Why are the tips of my snake plant turning brown?',
    body: 'Bright indirect light, watering every two weeks, terracotta pot. Tips started browning about a month ago. Is it the water?',
    ts: ago(260),
    votes: 88,
    flair: 'Help',
  },
  {
    id: 'p9',
    community: 'tabletopnight',
    author: 'meeplewhisperer',
    title: 'Game night tradition: the loser picks next week’s snack',
    body: 'It has made our group way more competitive and also way better fed. What house rules does your group have?',
    ts: ago(540),
    votes: 466,
    flair: 'Discussion',
  },
  {
    id: 'p10',
    community: 'tabletopnight',
    author: 'dicegoblin',
    title: 'Painted my first set of miniatures',
    body: 'Took about 20 hours across a month. Not perfect but I love them.',
    ts: ago(900),
    votes: 1108,
    flair: 'Show & tell',
    image: { emoji: '🐉', bg: '#FBE0CE', caption: 'Dragon and party of four' },
  },
  {
    id: 'p11',
    community: 'curiouscosmos',
    author: 'nightowl_optics',
    title: 'Saw Saturn’s rings through a telescope for the first time tonight',
    body: 'A tiny 70 mm refractor from a garage sale. I actually gasped out loud. If you have ever thought about getting into this hobby, do it.',
    ts: ago(45),
    votes: 3204,
    flair: 'Observation',
    image: { emoji: '🪐', bg: '#D9DFF7', caption: '70 mm refractor, 100x' },
  },
  {
    id: 'p12',
    community: 'curiouscosmos',
    author: 'lightyearlaura',
    title: 'If light takes time to reach us, how do we know what stars look like now?',
    body: 'Genuine question from a curious beginner. Are we always seeing the past?',
    ts: ago(720),
    votes: 742,
    flair: 'Question',
  },
  {
    id: 'p13',
    community: 'cozyspaces',
    author: 'rainyday_rue',
    title: 'Rainy afternoon setup: tea, candle, crossword',
    body: 'Nothing fancy. Just wanted to share the vibe.',
    ts: ago(1600),
    votes: 512,
    image: { emoji: '🕯️', bg: '#EFE2D2' },
  },
  {
    id: 'p14',
    community: 'homecooking',
    author: 'breadwinner',
    title: 'First loaf that didn’t come out like a brick',
    body: 'The trick was a longer cold proof in the fridge overnight. Crumb shot in the comments!',
    ts: ago(2000),
    votes: 1876,
    flair: 'Baking',
    image: { emoji: '🍞', bg: '#F5E1C6', caption: 'Overnight cold proof' },
  },
  {
    id: 'p15',
    community: 'pixelcraft',
    author: 'kerningkat',
    title: 'Hot take: most apps use too many font weights',
    body: 'Two weights and a careful size scale get you almost everything. Change my mind.',
    ts: ago(1440),
    votes: 254,
    flair: 'Discussion',
  },
  {
    id: 'p16',
    community: 'shutterwalk',
    author: 'fogandfern',
    title: 'Morning fog rolling through the park',
    body: 'Woke up early for once and it paid off.',
    ts: ago(2600),
    votes: 903,
    image: { emoji: '🌫️', bg: '#E2E6EA', caption: 'Elm Park, 6:10 am' },
  },
];

type Seed = [author: string, text: string, votes: number, minutes: number, replies?: Seed[]];
const TREES: Record<string, Seed[]> = {
  p1: [
    ['booknookbea', 'That lamp is doing so much work. Where is it from?', 214, 100, [
      ['softcorner', 'Thrift store! It was $8 and needed a new shade.', 180, 95, [
        ['booknookbea', 'The best finds always need a new shade.', 64, 90],
        ['lampcollector', 'Swapping the bulb to 2700K makes any lamp look like this, highly recommend.', 41, 70, [
          ['softcorner', 'Yes! It’s a 2700K bulb, the old one was way too blue.', 22, 60],
        ]],
      ]],
    ]],
    ['quietquill', 'Saving this for when I finally have a corner of my own.', 98, 85],
    ['grandmasquilt', 'The blanket gives it so much warmth. Hand knit?', 57, 40, [
      ['softcorner', 'My grandmother made it decades ago 🧶', 49, 35],
    ]],
  ],
  p2: [
    ['morningmara', 'Making my bed right after I get up. Takes 60 seconds and the room instantly feels calmer.', 1320, 180, [
      ['skepticsam', 'I resisted this for years and you are right, annoyingly.', 402, 170, [
        ['morningmara', 'It’s the smallest possible win, which is exactly why it works.', 211, 160, [
          ['habitnerd', 'There’s research on this, sort of. Small completed tasks build momentum for bigger ones.', 140, 150, [
            ['skepticsam', 'Source? Genuinely curious, not being snarky.', 38, 140, [
              ['habitnerd', 'Search for “behavioral momentum”. It’s more about streaks than beds specifically.', 52, 130, [
                ['curiousbird', 'This thread is exactly what I hoped for, thank you all.', 66, 120],
              ]],
            ]],
          ]],
        ]],
      ]],
      ['nightshiftnia', 'Works for night shift too, I make it when I wake up at 3 pm 😄', 188, 165],
    ]],
    ['walkingwill', 'A ten minute walk after lunch. No podcast, no phone.', 860, 175, [
      ['deskboundd', 'The “no podcast” part is the hard bit for me.', 230, 150, [
        ['walkingwill', 'Start with one day a week. Your brain gets used to the quiet.', 120, 140],
      ]],
    ]],
    ['hydrohank', 'Glass of water before coffee. That’s it, that’s the habit.', 540, 160],
    ['journaljo', 'Writing three lines in a notebook before bed. Not a journal, just three lines.', 310, 110, [
      ['quietquill', 'Three lines is so much less intimidating than a full page. Stealing this.', 95, 90],
    ]],
  ],
  p3: [
    ['goldenhourgus', 'Timing is everything and you nailed it.', 156, 280, [
      ['bluehour', 'Thanks! I almost didn’t stop to take it.', 72, 270],
    ]],
    ['pixelpeeper', 'Phone cameras have gotten so good. Which phone?', 61, 250, [
      ['bluehour', 'A three year old one honestly, I just tapped to expose for the sky.', 58, 240, [
        ['pixelpeeper', 'That tip alone improves 90% of sunset photos.', 44, 230],
      ]],
    ]],
  ],
  p4: [
    ['beanqueen', 'Made this tonight with chickpeas instead. Ten out of ten.', 88, 380, [
      ['panandspoon', 'Love that swap. A pinch of smoked paprika works great with chickpeas too.', 41, 360],
    ]],
    ['lemonlover', 'A lot of lemon is the correct amount of lemon.', 120, 400],
  ],
  p5: [
    ['kerningkat', 'The rounded joins really help at 16px. Have you tested them on dark backgrounds?', 77, 560, [
      ['marlowmakes', 'Not yet! Good call, the stroke might look heavier there.', 40, 540, [
        ['optical_oli', 'It will. Try a 1.5 stroke variant for dark mode, lots of sets do that.', 33, 500],
      ]],
    ]],
    ['gridgremlin', 'Consistent corner radius across the whole set, chef’s kiss.', 52, 520],
  ],
  p6: [
    ['reelrosa', 'Spirited Away. Every time.', 402, 1250, [
      ['totorofan', 'Seconded. The bathhouse sequence still gets me.', 160, 1200],
    ]],
    ['plottwistpat', 'Anything with a twist you can’t unsee.', 230, 1220],
  ],
  p7: [
    ['aroidaddict', 'The first split leaf is the best feeling. Congrats!', 320, 70, [
      ['fernandez_grows', 'I may have screamed a little.', 210, 65, [
        ['aroidaddict', 'Completely valid response.', 120, 60],
      ]],
    ]],
    ['crispyleaf', 'What kind of light does it get?', 45, 50, [
      ['fernandez_grows', 'East window, about three feet back. Morning sun only.', 40, 45],
    ]],
  ],
  p8: [
    ['soilscientist', 'Usually fluoride or salt buildup from tap water. Try filtered or rainwater for a while.', 64, 240, [
      ['crispyleaf', 'I do use tap water. Will switch, thanks!', 20, 230],
      ['overwaterer', 'Also check the roots. Mine had rot even on a two week schedule.', 31, 200],
    ]],
  ],
  p9: [
    ['boardgamebex', 'Whoever wins has to explain the rules of the next game. Keeps winners humble.', 188, 500, [
      ['meeplewhisperer', 'That is diabolical and I love it.', 90, 480],
    ]],
  ],
  p11: [
    ['stargazer_sol', 'That gasp is a rite of passage. Welcome to the hobby!', 812, 40, [
      ['nightowl_optics', 'I genuinely didn’t think a cheap scope could do that.', 420, 38, [
        ['stargazer_sol', 'Small refractors are amazing on planets. Jupiter’s moons next!', 300, 35, [
          ['moonmapper', 'And the Moon terminator. Craters along the shadow line look 3D.', 210, 30, [
            ['nightowl_optics', 'Adding all of this to my list. You all are the best.', 150, 25, [
              ['stargazer_sol', 'Clear skies! Post your Jupiter sketch when you get it.', 90, 20, [
                ['nightowl_optics', 'Deal 🔭', 70, 15],
              ]],
            ]],
          ]],
        ]],
      ]],
    ]],
    ['lightyearlaura', 'Okay this convinces me. What should I look for at a garage sale?', 260, 30, [
      ['moonmapper', 'A sturdy mount matters more than magnification. Avoid anything that advertises “500x”.', 230, 26],
    ]],
  ],
  p12: [
    ['astro_ari', 'Yes, we always see the past. For most stars it’s a few hundred years, which is basically nothing for a star.', 410, 700, [
      ['lightyearlaura', 'So the star probably looks the same now?', 120, 680, [
        ['astro_ari', 'Almost certainly. Stars change over millions of years, not hundreds.', 140, 660],
      ]],
    ]],
  ],
  p14: [
    ['crumbshot', 'Crumb shot or it didn’t happen 😄', 300, 1900, [
      ['breadwinner', 'Fair! Open, glossy and only slightly gummy in the middle.', 210, 1880],
    ]],
  ],
  p15: [
    ['typefacetom', 'Two weights, sure. But you need a good italic.', 66, 1400],
  ],
};

export const COMMENTS: Comment[] = Object.entries(TREES).flatMap(([postId, seeds]) => {
  const out: Comment[] = [];
  const walk = (list: Seed[], parentId: string | null) =>
    list.forEach(([author, text, votes, minutes, replies], index) => {
      const id = `${parentId ?? postId}-${index}`;
      out.push({ id, postId, parentId, author, text, votes, ts: ago(minutes) });
      if (replies) walk(replies, id);
    });
  walk(seeds, null);
  return out;
});

export const NOTICES: Notice[] = [
  { id: 'n1', kind: 'reply', text: 'u/stargazer_sol replied to a post you follow in t/curiouscosmos', postId: 'p11', ts: ago(20) },
  { id: 'n2', kind: 'upvote', text: 'Your comment in t/askhere reached 100 upvotes', postId: 'p2', ts: ago(150) },
  { id: 'n3', kind: 'community', text: 'Trending in t/plantparents: My monstera finally put out a fenestrated leaf!', postId: 'p7', ts: ago(70) },
  { id: 'n4', kind: 'reply', text: 'u/softcorner replied: “My grandmother made it decades ago”', postId: 'p1', ts: ago(35) },
  { id: 'n5', kind: 'community', text: 'Popular in t/homecooking: First loaf that didn’t come out like a brick', postId: 'p14', ts: ago(1800) },
];
