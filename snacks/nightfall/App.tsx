import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Gradient,
  BackgroundImage,
  Input,
  SafeArea,
  ScrollArea,
  Block,
  Avatar,
  Button,
  Dialog,
  Icon,
  IconButton,
  Marquee,
  PlocksProvider,
  Tabs,
  Text,
} from '@plocks/ui-snack';
import { Video, type VideoState } from '@plocks/media';

const C = { black: '#0D0D0D', panel: '#171717', white: '#FFF', muted: '#B8B8B8', red: '#E50914', line: '#292929' };
const ART = [
  require('./assets/scene-forest.webp'),
  require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'),
  require('./assets/scene-lake.webp'),
  require('./assets/scene-ocean.webp'),
];
const FILMS = [
  {
    id: 'evergreen',
    title: 'Evergreen',
    genre: 'Adventure',
    year: '2026',
    rating: 'TV-14',
    length: '1h 48m',
    art: 0,
    caption: 'Some paths lead you back to yourself.',
    synopsis: 'A field researcher returns to the forest where everything began and finds an unexpected new trail.',
  },
  {
    id: 'afterdark',
    title: 'After Dark',
    genre: 'Mystery',
    year: '2026',
    rating: 'TV-MA',
    length: '2h 02m',
    art: 1,
    caption: 'Every city keeps a secret.',
    synopsis: 'One night, one city, and a clue hidden in plain sight.',
  },
  {
    id: 'goldenhour',
    title: 'Golden Hour',
    genre: 'Drama',
    year: '2025',
    rating: 'TV-14',
    length: '1h 39m',
    art: 2,
    caption: 'The light changes everything.',
    synopsis: 'Two old friends cross the desert to make good on a promise.',
  },
  {
    id: 'stillwater',
    title: 'Stillwater',
    genre: 'Documentary',
    year: '2026',
    rating: 'TV-G',
    length: '52m',
    art: 3,
    caption: 'Beneath the surface.',
    synopsis: 'An intimate look at the wild places where water shapes every life around it.',
  },
  {
    id: 'deepblue',
    title: 'Deep Blue',
    genre: 'Adventure',
    year: '2025',
    rating: 'TV-PG',
    length: '1h 31m',
    art: 4,
    caption: 'The horizon is only the beginning.',
    synopsis: 'A small crew sets sail toward a distant island and a much larger discovery.',
  },
  {
    id: 'nightshift',
    title: 'Night Shift',
    genre: 'Comedy',
    year: '2024',
    rating: 'TV-14',
    length: '8 episodes',
    art: 1,
    caption: 'The city never sleeps. Neither do they.',
    synopsis: 'A mismatched team keeps a tiny late-night radio station on the air.',
  },
  {
    id: 'wildwood',
    title: 'Wildwood',
    genre: 'Family',
    year: '2025',
    rating: 'TV-PG',
    length: '1h 27m',
    art: 0,
    caption: 'A summer to remember.',
    synopsis: 'Four siblings discover their favorite campsite has one last surprise.',
  },
  {
    id: 'mirage',
    title: 'Mirage',
    genre: 'Sci-Fi',
    year: '2026',
    rating: 'TV-14',
    length: '1h 56m',
    art: 2,
    caption: 'What you see is only the start.',
    synopsis: 'A strange signal brings a research team to the edge of the desert.',
  },
];
const SAMPLE_CLIP = Asset.fromModule(require('./assets/demo-clip.mp4')).uri;
const CAST: Record<string, string[]> = {
  evergreen: ['Ava Morgan', 'Elliot Hayes', 'Mina Brooks', 'Leo Carter'],
  afterdark: ['Nora Vale', 'Julian Cross', 'Iris Chen', 'Marcus Reed'],
  goldenhour: ['Sofia Reyes', 'Caleb Ward', 'Amara Bell', 'Jonah Wells'],
  stillwater: ['Elena Park', 'Samir Shah', 'Tessa Cole', 'Micah Ford'],
  deepblue: ['Kai Bennett', 'Lena Ortiz', 'Owen Blake', 'Dara Quinn'],
  nightshift: ['Riley James', 'Theo Martin', 'Zoe Patel', 'Miles Grant'],
  wildwood: ['Piper Lane', 'Finn Walker', 'June Ellis', 'Arlo Stone'],
  mirage: ['Maya Chen', 'Isaac Holt', 'Nadia Cole', 'Evan Price'],
};
const CAST_COLORS = ['#663BA1', '#AF484E', '#2C777B', '#9A6B2C'];
type Film = (typeof FILMS)[number];
type Tab = 'home' | 'search' | 'list';
const STORAGE = 'plocks-nightfall-example:v1';

function Poster({ film, onPress, width = 160 }: { film: Film; onPress: () => void; width?: number }) {
  return (
    <Block
      gap={0}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${film.title}`}
      w={width}
      mr={11}
    >
      <BackgroundImage source={ART[film.art]} w={width} h={width * 1.28} justify="flex-end" radius={8}>
        <Gradient colors={['transparent', '#000B']} p={12} pt={60}>
          <Text c={C.white} fw="bold" size={16} numberOfLines={2}>
            {film.title}
          </Text>
          <Text c="#DDD" size={10}>
            {film.genre}
          </Text>
        </Gradient>
      </BackgroundImage>
    </Block>
  );
}

function NightfallScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const [tab, setTab] = useState<Tab>('home');
  const [query, setQuery] = useState('');
  const [myList, setMyList] = useState<string[]>(['stillwater', 'afterdark']);
  const [progress, setProgress] = useState<Record<string, number>>({ wildwood: 0.42, nightshift: 0.19 });
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const film = FILMS.find((item) => item.id === selected);
  const current = FILMS.find((item) => item.id === playing);
  const hero = FILMS[0];

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as { myList?: string[]; progress?: Record<string, number> };
        if (Array.isArray(data.myList)) setMyList(data.myList);
        if (data.progress && typeof data.progress === 'object') setProgress(data.progress);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ myList, progress })).catch(() => {});
  }, [myList, progress, ready]);
  const openPlayer = (id: string) => {
    setSelected(null);
    setPlaying(id);
    setVideoError(null);
  };
  const toggleList = (id: string) =>
    setMyList((old) => (old.includes(id) ? old.filter((item) => item !== id) : [...old, id]));
  const nav = (
    <Tabs
      navigationOnly
      variant="chip"
      value={tab}
      onChange={(item) => setTab(item as Tab)}
      color={C.red}
      activeTabTextColor={C.white}
      textStyle={{ color: C.muted }}
      labelProps={{ size: wide ? 14 : 12 }}
      items={[
        { key: 'home', label: 'Home', content: null },
        { key: 'search', label: 'Search', content: null },
        { key: 'list', label: 'My List', content: null },
      ]}
    />
  );
  const row = (title: string, items: Film[]) => (
    <Block gap={0} mt={25}>
      <Text c={C.white} fw="bold" size={wide ? 21 : 18} px={17} mb={11}>
        {title}
      </Text>
      <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ px: 17 }}>
        {items.map((item) => (
          <Poster key={item.id} film={item} width={wide ? 180 : 135} onPress={() => setSelected(item.id)} />
        ))}
      </ScrollArea>
    </Block>
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.black}>
      <StatusBar barStyle="light-content" />
      <Block gap={0} w="100%" maw={1300} alignSelf="center" flex={1}>
        <Block
          h={65}
          px={wide ? 30 : 17}
          direction="row"
          align="center"
          gap={wide ? 34 : 16}
          borderBottomWidth={1}
          borderBottomColor={C.line}
        >
          <Text c={C.red} fw="bold" size={wide ? 29 : 22}>
            NIGHTFALL
          </Text>
          <Block gap={0} flex={1}>
            {nav}
          </Block>
          {wide && (
            <IconButton
              icon="search"
              variant="ghost"
              iconColor={C.white}
              accessibilityLabel="Search titles"
              onPress={() => setTab('search')}
            />
          )}
        </Block>
        <ScrollArea flex={1} contentProps={{ pb: 35 }}>
          {tab === 'home' && (
            <>
              <Block gap={0}>
                <BackgroundImage source={ART[hero.art]} w="full" h={wide ? 460 : 350} justify="flex-end">
                  <Gradient colors={['#0000', '#0007', C.black]} px={wide ? 45 : 21} pb={28} pt={130}>
                    <Text c={C.red} fw="bold" size={12}>
                      N SERIES PREMIERE
                    </Text>
                    <Text c={C.white} fw="bold" size={wide ? 51 : 39}>
                      {hero.title}
                    </Text>
                    <Text c={C.white} size={15}>
                      {hero.caption}
                    </Text>
                    <Block direction="row" gap={10} mt={18}>
                      <Block
                        gap={0}
                        onPress={() => openPlayer(hero.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Play Evergreen preview"
                        bg={C.white}
                        radius={7}
                        px={17}
                        py={10}
                      >
                        <Text c={C.black} fw="bold" size={14}>
                          ▶ Play
                        </Text>
                      </Block>
                      <Button
                        title={myList.includes(hero.id) ? '✓  My List' : '+  My List'}
                        variant="filled"
                        color="#555A"
                        textColor={C.white}
                        onPress={() => toggleList(hero.id)}
                      />
                      <Button
                        title="Info"
                        variant="filled"
                        color="#555A"
                        textColor={C.white}
                        onPress={() => setSelected(hero.id)}
                      />
                    </Block>
                  </Gradient>
                </BackgroundImage>
              </Block>
              {row('Trending Now', FILMS.slice(1, 6))}
              {row(
                'Continue Watching',
                FILMS.filter((item) => (progress[item.id] ?? 0) > 0 && (progress[item.id] ?? 0) < 1),
              )}
              {row('Only on Nightfall', [FILMS[0], FILMS[5], FILMS[6], FILMS[7]])}
            </>
          )}
          {tab === 'search' && (
            <Block gap={0} p={20}>
              <Text c={C.white} fw="bold" size={27}>
                Find something great
              </Text>
              <Block bg="#272727" radius={8} my={19} px={12} direction="row" align="center" gap={10}>
                <Icon name="search" color={C.muted} size={20} />
                <Input
                  variant="unstyled"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Titles, genres, and more"
                  placeholderTextColor="#A7A7A7"
                  mb={0}
                  flex={1}
                  inputColor={C.white}
                  inputFontSize={15}
                />
              </Block>
              <Text c={C.muted} fw="bold" size={12}>
                {query ? 'RESULTS' : 'POPULAR SEARCHES'}
              </Text>
              <Block direction="row" wrap="wrap" gap={12} mt={14}>
                {FILMS.filter((item) =>
                  `${item.title} ${item.genre} ${item.synopsis}`.toLowerCase().includes(query.toLowerCase()),
                ).map((item) => (
                  <Poster key={item.id} film={item} width={wide ? 175 : 135} onPress={() => setSelected(item.id)} />
                ))}
              </Block>
            </Block>
          )}
          {tab === 'list' && (
            <Block gap={0} pt={25}>
              <Text c={C.white} fw="bold" size={27} px={18}>
                My List
              </Text>
              {myList.length ? (
                row(
                  'Saved for later',
                  FILMS.filter((item) => myList.includes(item.id)),
                )
              ) : (
                <Text c={C.muted} p={18}>
                  Add a title to build your list.
                </Text>
              )}
            </Block>
          )}
        </ScrollArea>
      </Block>
      {!!film && (
        <Dialog opened accessibilityLabel={`${film.title} details`} onClose={() => setSelected(null)}>
          <Block gap={0}>
            <ScrollArea>
              <BackgroundImage source={ART[film.art]} h={250} justify="space-between">
                <Block gap={0} alignSelf="flex-end" p={10}>
                  <IconButton
                    icon="x"
                    variant="filled"
                    color="#000A"
                    iconColor={C.white}
                    accessibilityLabel="Close details"
                    onPress={() => setSelected(null)}
                  />
                </Block>
                <Gradient colors={['transparent', C.panel]} p={18} pt={60}>
                  <Text c={C.white} fw="bold" size={33}>
                    {film.title}
                  </Text>
                </Gradient>
              </BackgroundImage>
              <Block p={20} gap={13}>
                <Text c="#6FD092" fw="bold" size={13}>
                  98% match{' '}
                  <Text c={C.muted} size={12}>
                    {film.year} · {film.rating} · {film.length}
                  </Text>
                </Text>
                <Text c={C.white} size={15} lh={23}>
                  {film.synopsis}
                </Text>
                <Text c={C.muted} size={12}>
                  {film.genre} · Nightfall Original
                </Text>
                <Block gap={10} mt={4}>
                  <Text c={C.white} fw="bold" size={17}>
                    Cast
                  </Text>
                  <Marquee duration={23000} gap="lg" pauseOnHover fadeEdgeColor={C.panel}>
                    {CAST[film.id].map((actor, index) => (
                      <Block key={actor} w={102} align="center" gap={6}>
                        <Avatar
                          size={46}
                          fallback={actor
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                          bg={CAST_COLORS[index % CAST_COLORS.length]}
                          textColor={C.white}
                          showText={false}
                          accessibilityLabel={actor}
                        />
                        <Text c={C.white} size={11} numberOfLines={1}>
                          {actor}
                        </Text>
                      </Block>
                    ))}
                  </Marquee>
                </Block>
                <Block direction="row" gap={10}>
                  <Block
                    gap={0}
                    onPress={() => openPlayer(film.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Play sample clip for ${film.title}`}
                    flex={1}
                    bg={C.white}
                    radius={7}
                    p={12}
                    align="center"
                  >
                    <Text c={C.black} fw="bold">
                      ▶ Play sample clip
                    </Text>
                  </Block>
                  <IconButton
                    icon={myList.includes(film.id) ? 'check' : 'plus'}
                    variant="outline"
                    iconColor={C.white}
                    accessibilityLabel={myList.includes(film.id) ? 'Remove from My List' : 'Add to My List'}
                    onPress={() => toggleList(film.id)}
                  />
                </Block>
              </Block>
            </ScrollArea>
          </Block>
        </Dialog>
      )}
      {!!current && (
        <Dialog opened variant="fullscreen" accessibilityLabel={`${current.title} player`} onClose={() => setPlaying(null)}>
          <Block gap={0} flex={1} bg={C.black}>
          <Block p={18} direction="row" align="center" gap={15}>
            <IconButton
              icon="arrowLeft"
              variant="ghost"
              iconColor={C.white}
              accessibilityLabel="Exit player"
              onPress={() => setPlaying(null)}
            />
            <Text c={C.white} fw="bold" size={19}>
              {current.title}
            </Text>
          </Block>
          <Block gap={0} flex={1} w="100%" maw={1050} alignSelf="center" justify="center">
            <Video
              key={current.id}
              source={{ url: SAMPLE_CLIP }}
              w="100%"
              aspectRatio={16 / 9}
              autoPlay
              controls
              accessibilityLabel={`Sample clip for ${current.title}`}
              onTimeUpdate={(state: VideoState) => {
                if (!state.duration) return;
                const next = Math.min(1, state.currentTime / state.duration);
                setProgress((old) =>
                  Math.abs((old[current.id] ?? 0) - next) >= 0.01 || next === 1 ? { ...old, [current.id]: next } : old,
                );
              }}
              onError={setVideoError}
            />
            <Block p={18} gap={8}>
              <Text c={C.muted} size={12}>Locally bundled preview footage.</Text>
              {videoError && (
                <Block gap={8}>
                  <Text c={C.white} size={12}>
                    This clip could not play here.
                  </Text>
                </Block>
              )}
            </Block>
          </Block>
          </Block>
        </Dialog>
      )}
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
        <NightfallScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
