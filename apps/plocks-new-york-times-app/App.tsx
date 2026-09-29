import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon, PlocksProvider, Text } from '@plocks/ui';

const C = { paper: '#F7F5F0', white: '#FFFFFF', ink: '#171B1D', muted: '#657074', rule: '#D8D9D4', blue: '#174C63', pale: '#E8EEF0', gold: '#C3A66A' };
const ART = [
  require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'),
  require('./assets/scene-forest.webp'),
  require('./assets/scene-lake.webp'),
  require('./assets/scene-ocean.webp'),
];
const SECTIONS = ['All', 'World', 'U.S.', 'Business', 'Technology', 'Culture', 'Science', 'Food'] as const;
type Section = typeof SECTIONS[number];
type Tab = 'Today' | 'Latest' | 'Sections' | 'Saved';
type Story = {
  id: string; section: Exclude<Section, 'All'>; title: string; deck: string; byline: string;
  time: string; minutes: number; image: number; caption: string; body: string[];
};
const STORIES: Story[] = [
  { id: 'city-gardens', section: 'U.S.', title: 'The City Block That Became a Garden', deck: 'Neighbors turned a vacant corner into a place to grow food, share tools and spend time together.', byline: 'Mara Ellis', time: 'Morning edition', minutes: 6, image: 0, caption: 'An illustrated city scene from the demo artwork collection.', body: [
    'The first planting day began with a few borrowed shovels and a folding table. By afternoon, residents from three nearby streets had signed up to help care for the new garden.',
    'The project is a fictional example of the small decisions that shape a neighborhood. Its organizers started by asking what people wanted from the empty lot. The most common answer was simple: a place to meet.',
    'Now a volunteer schedule, shared tool shelf and weekly open hours give the space a routine. The larger lesson is about participation. A public place lasts when the people around it can make it their own.',
  ] },
  { id: 'coastline', section: 'World', title: 'A Coastline Plans for a Changing Future', deck: 'A long view of the shore is reshaping conversations about homes, parks and public access.', byline: 'Alex Rivera', time: '2 hours ago', minutes: 5, image: 4, caption: 'Illustrative coastal artwork for this fictional story.', body: [
    'At the edge of a small harbor, a walking path bends toward the water. On clear mornings it looks timeless, but maps of the shoreline tell a story of steady change.',
    'In this fictional account, local planners are considering several paths at once: restoring natural buffers, protecting public routes and giving residents clearer information about future conditions.',
    'The choices are connected. A protected wetland can slow flooding while making room for wildlife, and a well designed path can keep the waterfront open to everyone.',
  ] },
  { id: 'repair', section: 'Technology', title: 'The Quiet Return of the Repair Shop', deck: 'A new generation of makers is finding value in the devices people once threw away.', byline: 'Morgan Lee', time: '3 hours ago', minutes: 4, image: 2, caption: 'Illustrative landscape artwork used in this demo.', body: [
    'Inside a shared workshop, drawers of small parts line one wall and a handwritten repair guide sits beside the workbench. The tools are ordinary; the change in attitude is more interesting.',
    'This fictional story imagines a growing network of community repair sessions. Volunteers teach visitors how to diagnose a problem before they decide whether to replace a device.',
    'Repair does not solve every problem, but it can extend the life of useful objects. It also turns a frustrating failure into an opportunity to learn how something works.',
  ] },
  { id: 'night-museum', section: 'Culture', title: 'After Hours, the Museum Feels Like a New Place', deck: 'Late openings invite visitors to slow down and rediscover familiar rooms.', byline: 'Taylor Brooks', time: '4 hours ago', minutes: 5, image: 0, caption: 'Illustrative city artwork from the demo collection.', body: [
    'The gallery is quieter after sunset. Visitors linger at a single painting, return to a room they passed too quickly and talk softly beside the windows.',
    'In this fictional arts feature, a museum experiments with evening admission and small guided walks. The goal is to make a familiar public building fit more kinds of schedules.',
    'The experience suggests that access is about more than a ticket. Time, comfort and a sense of belonging all affect who feels able to step inside.',
  ] },
  { id: 'small-business', section: 'Business', title: 'What a Main Street Market Can Teach About Local Trade', deck: 'Independent shops are sharing ideas, deliveries and customers to stay flexible.', byline: 'Nina Patel', time: '5 hours ago', minutes: 7, image: 3, caption: 'Illustrative lakeside artwork used in this fictional business story.', body: [
    'A weekend market begins before the first customer arrives. Merchants trade extension cords, check on neighboring stalls and compare notes about what sold the week before.',
    'This sample business story follows an imagined group of small shops that pool resources without losing their own identities. Shared storage and coordinated deliveries lower costs for everyone.',
    'The approach has limits, but it shows how cooperation can be a practical business tool. For these shopkeepers, independence does not mean working alone.',
  ] },
  { id: 'night-sky', section: 'Science', title: 'Looking Up: The Case for Darker Night Skies', deck: 'Communities are rethinking outdoor lighting to make streets useful and the stars visible.', byline: 'Samir Shah', time: 'Yesterday', minutes: 6, image: 1, caption: 'Illustrative desert artwork for a fictional science feature.', body: [
    'Far from the brightest streets, the night sky can still feel vast. The effect is a reminder that artificial light changes the way we experience a place.',
    'This fictional science feature looks at communities testing more focused fixtures and timers. Their aim is to put light where people need it while reducing spill into homes and habitats.',
    'Good lighting is a design question rather than a contest between brightness and darkness. Careful placement can improve visibility and preserve more of the sky.',
  ] },
  { id: 'community-table', section: 'Food', title: 'The Sunday Table That Keeps Growing', deck: 'A neighborhood supper club makes room for old recipes and new friendships.', byline: 'Leah Chen', time: 'Yesterday', minutes: 4, image: 3, caption: 'Illustrative landscape artwork used in this sample food story.', body: [
    'At first, dinner fit around one table. A month later, volunteers added a second, then a third. Each guest brought a dish or a story about one.',
    'In this fictional food story, the menu changes every week. What stays the same is the invitation: come as you are, eat what is shared and help clean up.',
    'The recipes matter, but the ritual matters more. A regular meal gives neighbors a reason to recognize one another beyond a passing hello.',
  ] },
  { id: 'desert-trails', section: 'World', title: 'A New Map for Old Desert Trails', deck: 'Local guides are documenting routes and the stories that give them meaning.', byline: 'Jonah Wells', time: 'Yesterday', minutes: 5, image: 1, caption: 'Illustrative desert artwork from the demo collection.', body: [
    'The oldest routes across the desert are not always the easiest to see. Some follow washes, others rise over a ridge before turning toward the next source of shade.',
    'This fictional feature follows guides building a community map with local knowledge at its center. They record conditions, seasonal changes and the names people use for familiar places.',
    'A map can help visitors find a trail. It can also remind them that the landscape already holds stories worth listening to.',
  ] },
];
const STORAGE = 'plocks-daily-edition:v2';
const headlineStyle = { fontFamily: 'Georgia', letterSpacing: -0.5 } as const;

function Rule({ heavy = false }: { heavy?: boolean }) { return <View style={{ height: heavy ? 2 : 1, backgroundColor: heavy ? C.ink : C.rule }} />; }
function Kicker({ children }: { children: string }) { return <Text c={C.blue} fw="bold" size={10} lts={1.5}>{children.toUpperCase()}</Text>; }
function Ad({ compact = false }: { compact?: boolean }) {
  return <View style={{ alignItems: 'center', paddingVertical: compact ? 18 : 31, gap: 9, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.rule }}>
    <Text c={C.muted} size={9} lts={1.8}>ADVERTISEMENT · DEMO PLACEMENT</Text>
    <View style={{ width: '100%', maxWidth: compact ? 360 : 720, minHeight: compact ? 92 : 130, backgroundColor: '#DFE8E4', padding: 18, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
      <Text c={C.blue} fw="bold" size={11} lts={2}>NORTHLINE</Text>
      <Text c={C.ink} size={compact ? 17 : 21} style={headlineStyle}>Make room for the next journey.</Text>
      <Text c={C.muted} size={10}>Fictional sponsor · Sample ad</Text>
    </View>
  </View>;
}

function NewsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 800;
  const [tab, setTab] = useState<Tab>('Today');
  const [section, setSection] = useState<Section>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const active = STORIES.find((story) => story.id === selected);
  const visible = useMemo(() => STORIES.filter((story) => {
    if (tab === 'Saved' && !saved.includes(story.id)) return false;
    if (section !== 'All' && story.section !== section) return false;
    const text = `${story.title} ${story.deck} ${story.section}`.toLowerCase();
    return !query.trim() || text.includes(query.trim().toLowerCase());
  }), [tab, section, saved, query]);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { saved?: string[]; read?: string[] };
      if (Array.isArray(data.saved)) setSaved(data.saved);
      if (Array.isArray(data.read)) setRead(data.read);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ saved, read })).catch(() => {}); }, [saved, read, ready]);
  function openStory(story: Story) {
    setSelected(story.id);
    setRead((old) => old.includes(story.id) ? old : [...old, story.id]);
  }
  function toggleSave(id: string) { setSaved((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]); }
  function chooseTab(next: Tab) { setSelected(null); setTab(next); setSection('All'); setQuery(''); setSearchOpen(false); }
  const saveButton = (story: Story) => <Pressable onPress={(event) => { event.stopPropagation(); toggleSave(story.id); }} accessibilityRole="button"
    accessibilityLabel={saved.includes(story.id) ? `Remove ${story.title} from saved` : `Save ${story.title}`}
    style={{ padding: 8, marginRight: -8 }}>
    <Icon name="bookmark" variant={saved.includes(story.id) ? 'filled' : 'outlined'} color={saved.includes(story.id) ? C.blue : C.muted} size={21} />
  </Pressable>;
  const storyRow = (story: Story, index: number) => <Pressable key={story.id} onPress={() => openStory(story)} accessibilityRole="button"
    accessibilityLabel={`Read ${story.title}`} style={{ paddingVertical: 17, borderTopWidth: index === 0 ? 2 : 1, borderColor: index === 0 ? C.ink : C.rule,
      flexDirection: 'row', gap: 17, alignItems: 'flex-start' }}>
    <View style={{ flex: 1, gap: 6 }}><Kicker>{story.section}</Kicker>
      <Text c={C.ink} size={wide ? 22 : 19} style={[headlineStyle, { lineHeight: wide ? 27 : 24 }]}>{story.title}</Text>
      <Text c={C.muted} size={13} numberOfLines={2} style={{ lineHeight: 19 }}>{story.deck}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Text c={C.muted} size={10}>{story.time} · {story.minutes} min read</Text>
        {read.includes(story.id) && <Text c={C.blue} size={10}>· Read</Text>}</View>
    </View>
    <Image source={ART[story.image]} style={{ width: wide ? 170 : 112, height: wide ? 118 : 92, backgroundColor: C.pale }} resizeMode="cover" />
    {wide && saveButton(story)}
  </Pressable>;
  const lead = STORIES[0];
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}><StatusBar barStyle="dark-content" />
    <View style={{ backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.rule }}>
      <View style={{ maxWidth: 1120, width: '100%', alignSelf: 'center', paddingHorizontal: wide ? 24 : 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 8 }}>
          <Text c={C.muted} size={10} lts={1}>THE DAILY EDITION</Text><Text c={C.muted} size={10}>FICTIONAL NEWS DEMO</Text>
        </View><Rule heavy />
        <View style={{ minHeight: wide ? 77 : 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => { chooseTab('Today'); }} accessibilityRole="button" accessibilityLabel="Go to today edition" style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold }} />
            <Text c={C.ink} size={wide ? 34 : 27} fw="bold" style={{ fontFamily: 'Georgia', letterSpacing: -1.4 }}>The Daily Edition</Text>
          </Pressable>
          <Pressable onPress={() => { setSelected(null); setSearchOpen((old) => !old); }} accessibilityRole="button" accessibilityLabel="Search stories" style={{ padding: 8 }}>
            <Icon name="search" color={C.ink} size={22} /></Pressable>
        </View>
        {searchOpen && <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.rule, paddingVertical: 6, gap: 9 }}>
          <Icon name="search" color={C.muted} size={18} /><TextInput value={query} onChangeText={setQuery} placeholder="Search the edition" placeholderTextColor={C.muted}
            autoFocus style={{ flex: 1, color: C.ink, fontSize: 15, paddingVertical: 8 }} accessibilityLabel="Search stories" />
          {!!query && <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search"><Text c={C.blue} size={13}>Clear</Text></Pressable>}
        </View>}
        <Rule />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: wide ? 28 : 21, alignItems: 'center', paddingVertical: 12 }}>
          {(['Today', 'Latest', 'Sections', 'Saved'] as Tab[]).map((item) => <Pressable key={item} onPress={() => chooseTab(item)} accessibilityRole="tab" accessibilityState={{ selected: tab === item }}>
            <Text c={tab === item ? C.blue : C.ink} fw={tab === item ? 'bold' : 'normal'} size={13}>{item}</Text></Pressable>)}
        </ScrollView>
      </View>
    </View>
    <ScrollView key={`${selected ?? tab}-${section}`} contentContainerStyle={{ maxWidth: 1120, width: '100%', alignSelf: 'center', paddingHorizontal: wide ? 24 : 16, paddingBottom: 80 }}>
      {active ? <View style={{ width: '100%', maxWidth: 780, alignSelf: 'center', paddingTop: 20, gap: 15 }}>
        <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Back to stories" style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
          <Icon name="arrowLeft" color={C.blue} size={18} /><Text c={C.blue} size={13}>Back to stories</Text></Pressable>
        <Kicker>{active.section}</Kicker>
        <Text c={C.ink} size={wide ? 42 : 34} style={[headlineStyle, { lineHeight: wide ? 48 : 40 }]}>{active.title}</Text>
        <Text c={C.muted} size={wide ? 19 : 17} style={{ lineHeight: 25 }}>{active.deck}</Text>
        <Rule heavy />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 3 }}><Text c={C.ink} fw="bold" size={12}>By {active.byline}</Text><Text c={C.muted} size={11}>{active.time} · {active.minutes} min read</Text></View>
          {saveButton(active)}
        </View>
        <Image source={ART[active.image]} style={{ width: '100%', aspectRatio: 1.65, backgroundColor: C.pale }} resizeMode="cover" />
        <Text c={C.muted} size={10}>{active.caption}</Text>
        <View style={{ maxWidth: 650, alignSelf: 'center', gap: 18, paddingTop: 10 }}>
          {active.body.map((paragraph, index) => <Text key={index} c={C.ink} size={17} style={{ fontFamily: 'Georgia', lineHeight: 29 }}>{paragraph}</Text>)}
        </View>
        <Ad compact />
        <Text c={C.ink} fw="bold" size={21} style={headlineStyle}>More from The Daily Edition</Text>
        {STORIES.filter((item) => item.id !== active.id).slice(0, 3).map(storyRow)}
      </View> : <View style={{ paddingTop: 22, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <View><Text c={C.muted} size={10} lts={1.5}>ORIGINAL SAMPLE STORIES</Text>
            <Text c={C.ink} size={29} fw="bold" style={headlineStyle}>{searchOpen && query ? 'Search results' : tab === 'Today' ? "Today’s Edition" : tab}</Text></View>
          {tab === 'Saved' && <Text c={C.muted} size={12}>{saved.length} saved</Text>}
        </View>
        {(tab === 'Sections' || tab === 'Latest' || tab === 'Saved' || !!query) && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 3 }}>
          {SECTIONS.map((item) => <Pressable key={item} onPress={() => setSection(item)} accessibilityRole="button" accessibilityState={{ selected: section === item }}
            style={{ paddingHorizontal: 13, paddingVertical: 8, backgroundColor: section === item ? C.ink : C.white, borderWidth: 1, borderColor: section === item ? C.ink : C.rule, borderRadius: 18 }}>
            <Text c={section === item ? C.white : C.ink} size={12} fw={section === item ? 'bold' : 'normal'}>{item}</Text></Pressable>)}
        </ScrollView>}
        {tab === 'Today' && !query && <><Rule heavy />
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 23 }}>
            <Pressable onPress={() => openStory(lead)} accessibilityRole="button" accessibilityLabel={`Read ${lead.title}`} style={{ flex: 1.6, gap: 12 }}>
              <ImageBackground source={ART[lead.image]} style={{ width: '100%', aspectRatio: wide ? 1.7 : 1.45, justifyContent: 'flex-end' }} resizeMode="cover">
                <View style={{ alignSelf: 'flex-start', margin: 12, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: C.white }}><Kicker>THE LEAD</Kicker></View>
              </ImageBackground>
              <Text c={C.ink} size={wide ? 36 : 30} style={[headlineStyle, { lineHeight: wide ? 41 : 35 }]}>{lead.title}</Text>
              <Text c={C.muted} size={15} style={{ lineHeight: 22 }}>{lead.deck}</Text>
              <Text c={C.muted} size={11}>By {lead.byline} · {lead.minutes} min read</Text>
            </Pressable>
            <View style={{ flex: 1, gap: 9 }}><Kicker>THE BRIEFING</Kicker><Rule heavy />
              {STORIES.slice(1, 4).map((story) => <Pressable key={story.id} onPress={() => openStory(story)} accessibilityRole="button" style={{ gap: 5, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.rule }}>
                <Kicker>{story.section}</Kicker><Text c={C.ink} size={20} style={[headlineStyle, { lineHeight: 25 }]}>{story.title}</Text>
                <Text c={C.muted} size={11}>{story.minutes} min read</Text></Pressable>)}
            </View>
          </View>
          <Ad />
          <View style={{ gap: 5 }}><Text c={C.ink} size={25} fw="bold" style={headlineStyle}>More to Explore</Text><Text c={C.muted} size={12}>Ideas, places and people across the edition</Text></View>
          {STORIES.slice(4).map(storyRow)}
        </>}
        {(tab !== 'Today' || !!query) && (visible.length ? <>{visible.map(storyRow)}{visible.length > 3 && <Ad compact />}</> :
          <View style={{ alignItems: 'center', paddingVertical: 70, gap: 9 }}><Text c={C.ink} size={23} style={headlineStyle}>{tab === 'Saved' ? 'Your reading list is empty' : 'No stories found'}</Text>
            <Text c={C.muted} size={13}>{tab === 'Saved' ? 'Bookmark an article to find it here.' : 'Try a different section or search.'}</Text></View>)}
      </View>}
      <View style={{ alignItems: 'center', paddingVertical: 34, marginTop: 18, borderTopWidth: 1, borderTopColor: C.rule, gap: 4 }}>
        <Text c={C.ink} size={17} fw="bold" style={headlineStyle}>The Daily Edition</Text>
        <Text c={C.muted} size={10}>An original, fictional editorial demo built with Plocks.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><NewsScreen /></PlocksProvider></SafeAreaProvider>; }
