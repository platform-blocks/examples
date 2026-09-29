import { useEffect, useState } from 'react';
import { ImageBackground, Linking, Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Icon, IconButton, Marquee, PlocksProvider, Text } from '@plocks/ui';
import { Video, type VideoState } from '@plocks/media';

const C = { black: '#0D0D0D', panel: '#171717', white: '#FFF', muted: '#B8B8B8', red: '#E50914', line: '#292929' };
const ART = [
  require('./assets/scene-forest.webp'), require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'), require('./assets/scene-lake.webp'),
  require('./assets/scene-ocean.webp'),
];
const FILMS = [
  { id: 'evergreen', title: 'Evergreen', genre: 'Adventure', year: '2026', rating: 'TV-14', length: '1h 48m', art: 0, caption: 'Some paths lead you back to yourself.', synopsis: 'A field researcher returns to the forest where everything began and finds an unexpected new trail.' },
  { id: 'afterdark', title: 'After Dark', genre: 'Mystery', year: '2026', rating: 'TV-MA', length: '2h 02m', art: 1, caption: 'Every city keeps a secret.', synopsis: 'One night, one city, and a clue hidden in plain sight.' },
  { id: 'goldenhour', title: 'Golden Hour', genre: 'Drama', year: '2025', rating: 'TV-14', length: '1h 39m', art: 2, caption: 'The light changes everything.', synopsis: 'Two old friends cross the desert to make good on a promise.' },
  { id: 'stillwater', title: 'Stillwater', genre: 'Documentary', year: '2026', rating: 'TV-G', length: '52m', art: 3, caption: 'Beneath the surface.', synopsis: 'An intimate look at the wild places where water shapes every life around it.' },
  { id: 'deepblue', title: 'Deep Blue', genre: 'Adventure', year: '2025', rating: 'TV-PG', length: '1h 31m', art: 4, caption: 'The horizon is only the beginning.', synopsis: 'A small crew sets sail toward a distant island and a much larger discovery.' },
  { id: 'nightshift', title: 'Night Shift', genre: 'Comedy', year: '2024', rating: 'TV-14', length: '8 episodes', art: 1, caption: 'The city never sleeps. Neither do they.', synopsis: 'A mismatched team keeps a tiny late-night radio station on the air.' },
  { id: 'wildwood', title: 'Wildwood', genre: 'Family', year: '2025', rating: 'TV-PG', length: '1h 27m', art: 0, caption: 'A summer to remember.', synopsis: 'Four siblings discover their favorite campsite has one last surprise.' },
  { id: 'mirage', title: 'Mirage', genre: 'Sci-Fi', year: '2026', rating: 'TV-14', length: '1h 56m', art: 2, caption: 'What you see is only the start.', synopsis: 'A strange signal brings a research team to the edge of the desert.' },
];
// The catalog and cast are fictional. These are clearly credited sample clips,
// played through the plocks YouTube player rather than presented as film trailers.
const CLIPS = [
  { id: 'WhWc3b3KhnY', title: 'Spring', creator: 'Blender Studio' },
  { id: 'OHOpb2fS-cM', title: 'Tears of Steel', creator: 'Blender' },
  { id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny', creator: 'Blender' },
  { id: 'WhWc3b3KhnY', title: 'Spring', creator: 'Blender Studio' },
  { id: '_cMxraX_5RE', title: 'Sprite Fright', creator: 'Blender Studio' },
] as const;
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
type Film = typeof FILMS[number];
type Tab = 'home' | 'search' | 'list';
const STORAGE = 'plocks-netflix-example:v1';

function Poster({ film, onPress, width = 160 }: { film: Film; onPress: () => void; width?: number }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${film.title}`} style={{ width, marginRight: 11 }}>
    <ImageBackground source={ART[film.art]} imageStyle={{ borderRadius: 8 }} style={{ width, height: width * 1.28, justifyContent: 'flex-end', overflow: 'hidden' }}>
      <LinearGradient colors={['transparent', '#000B']} style={{ padding: 12, paddingTop: 60 }}>
        <Text c={C.white} fw="bold" size={16} numberOfLines={2}>{film.title}</Text>
        <Text c="#DDD" size={10}>{film.genre}</Text>
      </LinearGradient>
    </ImageBackground>
  </Pressable>;
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
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { myList?: string[]; progress?: Record<string, number> };
      if (Array.isArray(data.myList)) setMyList(data.myList);
      if (data.progress && typeof data.progress === 'object') setProgress(data.progress);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ myList, progress })).catch(() => {});
  }, [myList, progress, ready]);
  const openPlayer = (id: string) => { setSelected(null); setPlaying(id); setVideoError(null); };
  const toggleList = (id: string) => setMyList((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  const nav = <View style={{ flexDirection: 'row', gap: wide ? 29 : 18, alignItems: 'center' }}>
    {([['home', 'Home'], ['search', 'Search'], ['list', 'My List']] as const).map(([item, label]) => <Pressable key={item}
      onPress={() => setTab(item)} accessibilityRole="tab" accessibilityState={{ selected: tab === item }}>
      <Text c={tab === item ? C.white : C.muted} fw={tab === item ? 'bold' : 'normal'} size={wide ? 14 : 12}>{label}</Text>
    </Pressable>)}
  </View>;
  const row = (title: string, items: Film[]) => <View style={{ marginTop: 25 }}>
    <Text c={C.white} fw="bold" size={wide ? 21 : 18} style={{ paddingHorizontal: 17, marginBottom: 11 }}>{title}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 17 }}>
      {items.map((item) => <Poster key={item.id} film={item} width={wide ? 180 : 135} onPress={() => setSelected(item.id)} />)}
    </ScrollView>
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.black }}><StatusBar barStyle="light-content" />
    <View style={{ width: '100%', maxWidth: 1300, alignSelf: 'center', flex: 1 }}>
      <View style={{ height: 65, paddingHorizontal: wide ? 30 : 17, flexDirection: 'row', alignItems: 'center', gap: wide ? 34 : 16,
        borderBottomWidth: 1, borderBottomColor: C.line }}>
        <Text c={C.red} fw="bold" size={wide ? 29 : 22}>NIGHTFALL</Text>
        <View style={{ flex: 1 }}>{nav}</View>
        {wide && <IconButton icon="search" variant="ghost" iconColor={C.white} accessibilityLabel="Search titles" onPress={() => setTab('search')} />}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 35 }}>
        {tab === 'home' && <>
          <View>
            <ImageBackground source={ART[hero.art]} style={{ width: '100%', height: wide ? 460 : 350, justifyContent: 'flex-end' }}>
              <LinearGradient colors={['#0000', '#0007', C.black]} style={{ paddingHorizontal: wide ? 45 : 21, paddingBottom: 28, paddingTop: 130 }}>
                <Text c={C.red} fw="bold" size={12}>N  SERIES PREMIERE</Text>
                <Text c={C.white} fw="bold" size={wide ? 51 : 39}>{hero.title}</Text>
                <Text c={C.white} size={15}>{hero.caption}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                  <Pressable onPress={() => openPlayer(hero.id)} accessibilityRole="button" accessibilityLabel="Play Evergreen preview"
                    style={{ backgroundColor: C.white, borderRadius: 7, paddingHorizontal: 17, paddingVertical: 10 }}>
                    <Text c={C.black} fw="bold" size={14}>▶  Play</Text></Pressable>
                  <Button title={myList.includes(hero.id) ? '✓  My List' : '+  My List'} variant="filled" color="#555A" textColor={C.white}
                    onPress={() => toggleList(hero.id)} />
                  <Button title="Info" variant="filled" color="#555A" textColor={C.white} onPress={() => setSelected(hero.id)} />
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
          {row('Trending Now', FILMS.slice(1, 6))}
          {row('Continue Watching', FILMS.filter((item) => (progress[item.id] ?? 0) > 0 && (progress[item.id] ?? 0) < 1))}
          {row('Only on Nightfall', [FILMS[0], FILMS[5], FILMS[6], FILMS[7]])}
        </>}
        {tab === 'search' && <View style={{ padding: 20 }}>
          <Text c={C.white} fw="bold" size={27}>Find something great</Text>
          <View style={{ backgroundColor: '#272727', borderRadius: 8, marginVertical: 19, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="search" color={C.muted} size={20} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Titles, genres, and more" placeholderTextColor="#A7A7A7"
              style={{ flex: 1, color: C.white, paddingVertical: 13, fontSize: 15 }} />
          </View>
          <Text c={C.muted} fw="bold" size={12}>{query ? 'RESULTS' : 'POPULAR SEARCHES'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
            {FILMS.filter((item) => `${item.title} ${item.genre} ${item.synopsis}`.toLowerCase().includes(query.toLowerCase()))
              .map((item) => <Poster key={item.id} film={item} width={wide ? 175 : 135} onPress={() => setSelected(item.id)} />)}
          </View>
        </View>}
        {tab === 'list' && <View style={{ paddingTop: 25 }}>
          <Text c={C.white} fw="bold" size={27} style={{ paddingHorizontal: 18 }}>My List</Text>
          {myList.length ? row('Saved for later', FILMS.filter((item) => myList.includes(item.id)))
            : <Text c={C.muted} style={{ padding: 18 }}>Add a title to build your list.</Text>}
        </View>}
      </ScrollView>
    </View>
    {!!film && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#000C', justifyContent: 'center', alignItems: 'center', padding: 15 }}>
      <View style={{ width: '100%', maxWidth: 610, maxHeight: '90%', backgroundColor: C.panel, borderRadius: 13, overflow: 'hidden' }}>
        <ScrollView>
          <ImageBackground source={ART[film.art]} style={{ height: 250, justifyContent: 'space-between' }}>
            <View style={{ alignSelf: 'flex-end', padding: 10 }}><IconButton icon="x" variant="filled" color="#000A" iconColor={C.white}
              accessibilityLabel="Close details" onPress={() => setSelected(null)} /></View>
            <LinearGradient colors={['transparent', C.panel]} style={{ padding: 18, paddingTop: 60 }}>
              <Text c={C.white} fw="bold" size={33}>{film.title}</Text>
            </LinearGradient>
          </ImageBackground>
          <View style={{ padding: 20, gap: 13 }}>
            <Text c="#6FD092" fw="bold" size={13}>98% match  <Text c={C.muted} size={12}>{film.year} · {film.rating} · {film.length}</Text></Text>
            <Text c={C.white} size={15} style={{ lineHeight: 23 }}>{film.synopsis}</Text>
            <Text c={C.muted} size={12}>{film.genre} · Nightfall Original</Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              <Text c={C.white} fw="bold" size={17}>Cast</Text>
              <Marquee duration={23000} gap="lg" pauseOnHover fadeEdgeColor={C.panel}>
                {CAST[film.id].map((actor, index) => <View key={actor} style={{ width: 102, alignItems: 'center', gap: 6 }}>
                  <Avatar size={46} fallback={actor.split(' ').map((part) => part[0]).join('')} bg={CAST_COLORS[index % CAST_COLORS.length]}
                    textColor={C.white} showText={false} accessibilityLabel={actor} />
                  <Text c={C.white} size={11} numberOfLines={1}>{actor}</Text>
                </View>)}
              </Marquee>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => openPlayer(film.id)} accessibilityRole="button" accessibilityLabel={`Play YouTube sample clip for ${film.title}`}
                style={{ flex: 1, backgroundColor: C.white, borderRadius: 7, padding: 12, alignItems: 'center' }}>
                <Text c={C.black} fw="bold">▶  Play sample clip</Text></Pressable>
              <IconButton icon={myList.includes(film.id) ? 'check' : 'plus'} variant="outline" iconColor={C.white}
                accessibilityLabel={myList.includes(film.id) ? 'Remove from My List' : 'Add to My List'} onPress={() => toggleList(film.id)} />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>}
    {!!current && <View style={{ position: 'absolute', inset: 0, backgroundColor: C.black }}>
      <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
        <IconButton icon="arrowLeft" variant="ghost" iconColor={C.white} accessibilityLabel="Exit player" onPress={() => setPlaying(null)} />
        <Text c={C.white} fw="bold" size={19}>{current.title}</Text>
      </View>
      <View style={{ flex: 1, width: '100%', maxWidth: 1050, alignSelf: 'center', justifyContent: 'center' }}>
        <Video key={current.id} source={{ youtube: CLIPS[current.art].id }} w="100%" aspectRatio={16 / 9} autoPlay controls
          accessibilityLabel={`YouTube sample clip for ${current.title}`}
          onTimeUpdate={(state: VideoState) => {
            if (!state.duration) return;
            const next = Math.min(1, state.currentTime / state.duration);
            setProgress((old) => Math.abs((old[current.id] ?? 0) - next) >= 0.01 || next === 1
              ? { ...old, [current.id]: next } : old);
          }}
          onError={setVideoError} />
        <View style={{ padding: 18, gap: 8 }}>
          <Text c={C.muted} size={12}>YouTube sample clip: {CLIPS[current.art].title} · {CLIPS[current.art].creator}</Text>
          {videoError && <View style={{ gap: 8 }}>
            <Text c={C.white} size={12}>This clip could not play here.</Text>
            <Button title="Open on YouTube" size="sm" onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${CLIPS[current.art].id}`)} />
          </View>}
        </View>
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'dark' }}><NightfallScreen /></PlocksProvider></SafeAreaProvider>;
}
