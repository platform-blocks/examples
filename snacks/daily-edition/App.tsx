import { useEffect, useMemo, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Chip, Input, ScrollArea, SafeArea, Image, Block, Icon, PlocksProvider, Text } from '@plocks/ui-snack';

const C = {
  paper: '#F7F5F0',
  white: '#FFFFFF',
  ink: '#171B1D',
  muted: '#657074',
  rule: '#D8D9D4',
  blue: '#174C63',
  pale: '#E8EEF0',
  gold: '#C3A66A',
};
const ART = [
  require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'),
  require('./assets/scene-forest.webp'),
  require('./assets/scene-lake.webp'),
  require('./assets/scene-ocean.webp'),
];
const SECTIONS = ['All', 'World', 'U.S.', 'Business', 'Technology', 'Culture', 'Science', 'Food'] as const;
type Section = (typeof SECTIONS)[number];
type Tab = 'Today' | 'Latest' | 'Sections' | 'Saved';
type Story = {
  id: string;
  section: Exclude<Section, 'All'>;
  title: string;
  deck: string;
  byline: string;
  time: string;
  minutes: number;
  image: number;
  caption: string;
  body: string[];
};
const STORIES: Story[] = [
  {
    id: 'city-gardens',
    section: 'U.S.',
    title: 'The City Block That Became a Garden',
    deck: 'Neighbors turned a vacant corner into a place to grow food, share tools and spend time together.',
    byline: 'Mara Ellis',
    time: 'Morning edition',
    minutes: 6,
    image: 0,
    caption: 'An illustrated city scene from the demo artwork collection.',
    body: [
      'The first planting day began with a few borrowed shovels and a folding table. By afternoon, residents from three nearby streets had signed up to help care for the new garden.',
      'The project is a fictional example of the small decisions that shape a neighborhood. Its organizers started by asking what people wanted from the empty lot. The most common answer was simple: a place to meet.',
      'Now a volunteer schedule, shared tool shelf and weekly open hours give the space a routine. The larger lesson is about participation. A public place lasts when the people around it can make it their own.',
    ],
  },
  {
    id: 'coastline',
    section: 'World',
    title: 'A Coastline Plans for a Changing Future',
    deck: 'A long view of the shore is reshaping conversations about homes, parks and public access.',
    byline: 'Alex Rivera',
    time: '2 hours ago',
    minutes: 5,
    image: 4,
    caption: 'Illustrative coastal artwork for this fictional story.',
    body: [
      'At the edge of a small harbor, a walking path bends toward the water. On clear mornings it looks timeless, but maps of the shoreline tell a story of steady change.',
      'In this fictional account, local planners are considering several paths at once: restoring natural buffers, protecting public routes and giving residents clearer information about future conditions.',
      'The choices are connected. A protected wetland can slow flooding while making room for wildlife, and a well designed path can keep the waterfront open to everyone.',
    ],
  },
  {
    id: 'repair',
    section: 'Technology',
    title: 'The Quiet Return of the Repair Shop',
    deck: 'A new generation of makers is finding value in the devices people once threw away.',
    byline: 'Morgan Lee',
    time: '3 hours ago',
    minutes: 4,
    image: 2,
    caption: 'Illustrative landscape artwork used in this demo.',
    body: [
      'Inside a shared workshop, drawers of small parts line one wall and a handwritten repair guide sits beside the workbench. The tools are ordinary; the change in attitude is more interesting.',
      'This fictional story imagines a growing network of community repair sessions. Volunteers teach visitors how to diagnose a problem before they decide whether to replace a device.',
      'Repair does not solve every problem, but it can extend the life of useful objects. It also turns a frustrating failure into an opportunity to learn how something works.',
    ],
  },
  {
    id: 'night-museum',
    section: 'Culture',
    title: 'After Hours, the Museum Feels Like a New Place',
    deck: 'Late openings invite visitors to slow down and rediscover familiar rooms.',
    byline: 'Taylor Brooks',
    time: '4 hours ago',
    minutes: 5,
    image: 0,
    caption: 'Illustrative city artwork from the demo collection.',
    body: [
      'The gallery is quieter after sunset. Visitors linger at a single painting, return to a room they passed too quickly and talk softly beside the windows.',
      'In this fictional arts feature, a museum experiments with evening admission and small guided walks. The goal is to make a familiar public building fit more kinds of schedules.',
      'The experience suggests that access is about more than a ticket. Time, comfort and a sense of belonging all affect who feels able to step inside.',
    ],
  },
  {
    id: 'small-business',
    section: 'Business',
    title: 'What a Main Street Market Can Teach About Local Trade',
    deck: 'Independent shops are sharing ideas, deliveries and customers to stay flexible.',
    byline: 'Nina Patel',
    time: '5 hours ago',
    minutes: 7,
    image: 3,
    caption: 'Illustrative lakeside artwork used in this fictional business story.',
    body: [
      'A weekend market begins before the first customer arrives. Merchants trade extension cords, check on neighboring stalls and compare notes about what sold the week before.',
      'This sample business story follows an imagined group of small shops that pool resources without losing their own identities. Shared storage and coordinated deliveries lower costs for everyone.',
      'The approach has limits, but it shows how cooperation can be a practical business tool. For these shopkeepers, independence does not mean working alone.',
    ],
  },
  {
    id: 'night-sky',
    section: 'Science',
    title: 'Looking Up: The Case for Darker Night Skies',
    deck: 'Communities are rethinking outdoor lighting to make streets useful and the stars visible.',
    byline: 'Samir Shah',
    time: 'Yesterday',
    minutes: 6,
    image: 1,
    caption: 'Illustrative desert artwork for a fictional science feature.',
    body: [
      'Far from the brightest streets, the night sky can still feel vast. The effect is a reminder that artificial light changes the way we experience a place.',
      'This fictional science feature looks at communities testing more focused fixtures and timers. Their aim is to put light where people need it while reducing spill into homes and habitats.',
      'Good lighting is a design question rather than a contest between brightness and darkness. Careful placement can improve visibility and preserve more of the sky.',
    ],
  },
  {
    id: 'community-table',
    section: 'Food',
    title: 'The Sunday Table That Keeps Growing',
    deck: 'A neighborhood supper club makes room for old recipes and new friendships.',
    byline: 'Leah Chen',
    time: 'Yesterday',
    minutes: 4,
    image: 3,
    caption: 'Illustrative landscape artwork used in this sample food story.',
    body: [
      'At first, dinner fit around one table. A month later, volunteers added a second, then a third. Each guest brought a dish or a story about one.',
      'In this fictional food story, the menu changes every week. What stays the same is the invitation: come as you are, eat what is shared and help clean up.',
      'The recipes matter, but the ritual matters more. A regular meal gives neighbors a reason to recognize one another beyond a passing hello.',
    ],
  },
  {
    id: 'desert-trails',
    section: 'World',
    title: 'A New Map for Old Desert Trails',
    deck: 'Local guides are documenting routes and the stories that give them meaning.',
    byline: 'Jonah Wells',
    time: 'Yesterday',
    minutes: 5,
    image: 1,
    caption: 'Illustrative desert artwork from the demo collection.',
    body: [
      'The oldest routes across the desert are not always the easiest to see. Some follow washes, others rise over a ridge before turning toward the next source of shade.',
      'This fictional feature follows guides building a community map with local knowledge at its center. They record conditions, seasonal changes and the names people use for familiar places.',
      'A map can help visitors find a trail. It can also remind them that the landscape already holds stories worth listening to.',
    ],
  },
];
const STORAGE = 'plocks-daily-edition:v2';
const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const TABS: Tab[] = ['Today', 'Latest', 'Sections', 'Saved'];
const DATELINE = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

function Rule({ heavy = false }: { heavy?: boolean }) {
  return <Block gap={0} h={heavy ? 2 : 1} bg={heavy ? C.ink : C.rule} />;
}
function Kicker({ children, color = C.blue }: { children: string; color?: string }) {
  return (
    <Text c={color} fw="bold" size={10} lts={1.5}>
      {children.toUpperCase()}
    </Text>
  );
}
function SectionHead({ children }: { children: string }) {
  return (
    <Block gap={8}>
      <Rule heavy />
      <Kicker color={C.ink}>{children}</Kicker>
    </Block>
  );
}
function Art({ index, ratio, w = '100%' }: { index: number; ratio: number; w?: number | `${number}%` }) {
  return (
    <Block gap={0} w={w} aspectRatio={ratio} bg={C.pale} overflow="hidden">
      <Image source={ART[index]} w="100%" h="100%" resizeMode="cover" />
    </Block>
  );
}
function Ad({ compact = false }: { compact?: boolean }) {
  return (
    <Block align="center" py={compact ? 20 : 28} gap={8}>
      <Text c={C.muted} size={9} lts={1.8}>
        ADVERTISEMENT
      </Text>
      <Block
        w="100%"
        maw={compact ? 420 : 728}
        mih={compact ? 96 : 120}
        bg={C.pale}
        borderWidth={1}
        borderColor={C.rule}
        p={18}
        justify="center"
        align="center"
        gap={6}
      >
        <Text c={C.blue} fw="bold" size={11} lts={2}>
          NORTHLINE
        </Text>
        <Text c={C.ink} size={compact ? 18 : 22} ff="Georgia" ta="center">
          Make room for the next journey.
        </Text>
        <Text c={C.muted} size={10}>
          Fictional sponsor · Sample ad
        </Text>
      </Block>
    </Block>
  );
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
  const visible = useMemo(
    () =>
      STORIES.filter((story) => {
        if (tab === 'Saved' && !saved.includes(story.id)) return false;
        if (section !== 'All' && story.section !== section) return false;
        const text = `${story.title} ${story.deck} ${story.section}`.toLowerCase();
        return !query.trim() || text.includes(query.trim().toLowerCase());
      }),
    [tab, section, saved, query],
  );
  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as { saved?: string[]; read?: string[] };
        if (Array.isArray(data.saved)) setSaved(data.saved);
        if (Array.isArray(data.read)) setRead(data.read);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ saved, read })).catch(() => {});
  }, [saved, read, ready]);
  function openStory(story: Story) {
    setSelected(story.id);
    setRead((old) => (old.includes(story.id) ? old : [...old, story.id]));
  }
  function toggleSave(id: string) {
    setSaved((old) => (old.includes(id) ? old.filter((item) => item !== id) : [...old, id]));
  }
  function chooseTab(next: Tab) {
    setSelected(null);
    setTab(next);
    setSection('All');
    setQuery('');
    setSearchOpen(false);
  }
  const saveButton = (story: Story) => (
    <Block
      gap={0}
      onPress={() => toggleSave(story.id)}
      accessibilityRole="button"
      accessibilityLabel={saved.includes(story.id) ? `Remove ${story.title} from saved` : `Save ${story.title}`}
      p={8}
      m={-8}
    >
      <Icon
        name="bookmark"
        variant={saved.includes(story.id) ? 'filled' : 'outlined'}
        color={saved.includes(story.id) ? C.blue : C.muted}
        size={20}
      />
    </Block>
  );
  const meta = (story: Story) => (
    <Text c={C.muted} size={11}>
      {story.time} · {story.minutes} min read
    </Text>
  );
  // The row and its bookmark are sibling buttons; nesting them is invalid on web.
  const storyRow = (story: Story, index: number) => (
    <Block
      key={story.id}
      py={18}
      borderTopWidth={index === 0 ? 0 : 1}
      borderColor={C.rule}
      direction="row"
      gap={wide ? 24 : 14}
      align="flex-start"
    >
      <Block
        onPress={() => openStory(story)}
        accessibilityRole="button"
        accessibilityLabel={`Read ${story.title}`}
        flex={1}
        direction="row"
        gap={wide ? 24 : 14}
        align="flex-start"
      >
        <Block flex={1} gap={6}>
          <Kicker>{story.section}</Kicker>
          <Text c={read.includes(story.id) ? C.muted : C.ink} size={wide ? 22 : 18} ff="Georgia" lh={wide ? 27 : 23}>
            {story.title}
          </Text>
          {wide && (
            <Text c={C.muted} size={14} numberOfLines={2} lh={20}>
              {story.deck}
            </Text>
          )}
          {meta(story)}
        </Block>
        <Art index={story.image} w={wide ? 168 : 96} ratio={wide ? 1.5 : 1} />
      </Block>
      {saveButton(story)}
    </Block>
  );
  const storyCard = (story: Story) => (
    <Block
      key={story.id}
      onPress={() => openStory(story)}
      accessibilityRole="button"
      accessibilityLabel={`Read ${story.title}`}
      flex={1}
      gap={8}
    >
      <Art index={story.image} ratio={1.5} />
      <Block gap={6} pt={4}>
        <Kicker>{story.section}</Kicker>
        <Text c={read.includes(story.id) ? C.muted : C.ink} size={20} ff="Georgia" lh={25}>
          {story.title}
        </Text>
        <Text c={C.muted} size={14} numberOfLines={3} lh={20}>
          {story.deck}
        </Text>
        {meta(story)}
      </Block>
    </Block>
  );
  const lead = STORIES[0];
  const briefing = STORIES.slice(1, 5);
  const explore = STORIES.slice(5);
  return (
    <SafeArea gap={0} flex={1} bg={C.paper}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} bg={C.white} borderBottomWidth={1} borderBottomColor={C.rule}>
        <Block gap={0} maw={1120} w="100%" alignSelf="center" px={wide ? 24 : 16}>
          <Block gap={0} direction="row" align="center" justify="space-between" mih={wide ? 92 : 64}>
            <Block gap={0} flex={1}>
              {wide && (
                <Text c={C.muted} size={11}>
                  {DATELINE}
                </Text>
              )}
            </Block>
            <Block
              onPress={() => chooseTab('Today')}
              accessibilityRole="button"
              accessibilityLabel="Go to today’s edition"
              direction="row"
              align="center"
              gap={9}
            >
              <Block gap={0} w={9} h={9} radius={5} bg={C.gold} />
              <Text c={C.ink} size={wide ? 40 : 26} fw="bold" ff="Georgia" lts={wide ? -1.2 : -0.8}>
                The Daily Edition
              </Text>
            </Block>
            <Block gap={0} flex={1} align="flex-end">
              <Block
                gap={0}
                onPress={() => {
                  setSelected(null);
                  setSearchOpen((old) => !old);
                }}
                accessibilityRole="button"
                accessibilityLabel={searchOpen ? 'Close search' : 'Search stories'}
                p={8}
                mr={-8}
              >
                <Icon name={searchOpen ? 'x' : 'search'} color={C.ink} size={21} />
              </Block>
            </Block>
          </Block>
          <Rule heavy />
          <Block gap={0} direction="row" justify={wide ? 'center' : 'space-between'}>
            {TABS.map((item) => {
              const current = tab === item && !active;
              return (
                <Block
                  key={item}
                  gap={0}
                  onPress={() => chooseTab(item)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: current }}
                  px={wide ? 18 : 4}
                  pt={12}
                  pb={10}
                  borderBottomWidth={2}
                  borderBottomColor={current ? C.ink : 'transparent'}
                >
                  <Text c={current ? C.ink : C.muted} fw={current ? 'bold' : 'normal'} size={13}>
                    {item === 'Saved' && saved.length ? `Saved (${saved.length})` : item}
                  </Text>
                </Block>
              );
            })}
          </Block>
          {searchOpen && (
            <Block direction="row" align="center" borderTopWidth={1} borderTopColor={C.rule} py={6} gap={9}>
              <Icon name="search" color={C.muted} size={18} />
              <Input
                variant="unstyled"
                value={query}
                onChangeText={setQuery}
                placeholder="Search the edition"
                placeholderTextColor={C.muted}
                autoFocus
                mb={0}
                flex={1}
                inputColor={C.ink}
                inputFontSize={15}
                accessibilityLabel="Search stories"
              />
              {!!query && (
                <Block gap={0} onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Text c={C.blue} size={13}>
                    Clear
                  </Text>
                </Block>
              )}
            </Block>
          )}
        </Block>
      </Block>
      <ScrollArea
        key={`${selected ?? tab}-${section}`}
        contentProps={{ maw: 1120, w: '100%', alignSelf: 'center', px: wide ? 24 : 16, pb: 40 }}
      >
        {active ? (
          <Block w="100%" maw={760} alignSelf="center" pt={wide ? 28 : 18} gap={16}>
            <Block
              onPress={() => setSelected(null)}
              accessibilityRole="button"
              accessibilityLabel="Back to stories"
              alignSelf="flex-start"
              direction="row"
              gap={6}
              align="center"
            >
              <Icon name="arrowLeft" color={C.blue} size={16} />
              <Text c={C.blue} size={13}>
                {tab === 'Today' ? 'Today’s Edition' : tab}
              </Text>
            </Block>
            <Block gap={12} pt={wide ? 8 : 0}>
              <Kicker>{active.section}</Kicker>
              <Text c={C.ink} size={wide ? 44 : 32} ff="Georgia" lts={-0.6} lh={wide ? 50 : 38}>
                {active.title}
              </Text>
              <Text c={C.muted} size={wide ? 20 : 17} ff="Georgia" lh={wide ? 28 : 24}>
                {active.deck}
              </Text>
            </Block>
            <Block gap={0} direction="row" align="center" justify="space-between" py={12} borderTopWidth={1} borderBottomWidth={1} borderColor={C.rule}>
              <Block gap={2}>
                <Text c={C.ink} fw="bold" size={13}>
                  By {active.byline}
                </Text>
                {meta(active)}
              </Block>
              {saveButton(active)}
            </Block>
            <Block gap={8}>
              <Art index={active.image} ratio={wide ? 1.8 : 1.4} />
              <Text c={C.muted} size={11} lh={16}>
                {active.caption}
              </Text>
            </Block>
            <Block w="100%" maw={640} alignSelf="center" gap={20} pt={12}>
              {active.body.map((paragraph, index) => (
                <Text key={index} c={C.ink} size={wide ? 19 : 17} ff="Georgia" lh={wide ? 32 : 29}>
                  {paragraph}
                </Text>
              ))}
              <Block gap={0} w={9} h={9} radius={5} bg={C.gold} alignSelf="center" mt={4} />
            </Block>
            <Ad compact />
            <SectionHead>More from The Daily Edition</SectionHead>
            <Block gap={0}>
              {STORIES.filter((item) => item.id !== active.id)
                .slice(0, 3)
                .map(storyRow)}
            </Block>
          </Block>
        ) : tab === 'Today' && !query ? (
          <Block pt={wide ? 28 : 18} gap={wide ? 32 : 24}>
            <Block direction={wide ? 'row' : 'column'} gap={wide ? 32 : 24}>
              <Block
                onPress={() => openStory(lead)}
                accessibilityRole="button"
                accessibilityLabel={`Read ${lead.title}`}
                flex={wide ? 1.7 : undefined}
                gap={12}
              >
                <Art index={lead.image} ratio={wide ? 1.6 : 1.3} />
                <Kicker>{lead.section}</Kicker>
                <Text c={C.ink} size={wide ? 40 : 30} ff="Georgia" lts={-0.6} lh={wide ? 45 : 35}>
                  {lead.title}
                </Text>
                <Text c={C.muted} size={wide ? 17 : 15} ff="Georgia" lh={wide ? 25 : 22}>
                  {lead.deck}
                </Text>
                <Text c={C.muted} size={11}>
                  By {lead.byline} · {lead.minutes} min read
                </Text>
              </Block>
              <Block flex={wide ? 1 : undefined} gap={0} pl={wide ? 32 : 0} borderLeftWidth={wide ? 1 : 0} borderColor={C.rule}>
                <SectionHead>The Briefing</SectionHead>
                {briefing.map((story, index) => (
                  <Block
                    key={story.id}
                    onPress={() => openStory(story)}
                    accessibilityRole="button"
                    accessibilityLabel={`Read ${story.title}`}
                    direction="row"
                    gap={14}
                    py={14}
                    borderTopWidth={index === 0 ? 0 : 1}
                    borderTopColor={C.rule}
                  >
                    <Text c={C.gold} size={24} ff="Georgia" lh={26} w={18}>
                      {index + 1}
                    </Text>
                    <Block flex={1} gap={5}>
                      <Kicker>{story.section}</Kicker>
                      <Text c={read.includes(story.id) ? C.muted : C.ink} size={19} ff="Georgia" lh={24}>
                        {story.title}
                      </Text>
                      {meta(story)}
                    </Block>
                  </Block>
                ))}
              </Block>
            </Block>
            <Ad />
            <Block gap={wide ? 20 : 0}>
              <SectionHead>More to Explore</SectionHead>
              {wide ? <Block direction="row" gap={32}>{explore.map(storyCard)}</Block> : <Block gap={0}>{explore.map(storyRow)}</Block>}
            </Block>
          </Block>
        ) : (
          <Block w="100%" maw={820} alignSelf="center" pt={wide ? 28 : 18} gap={16}>
            <Block gap={0} direction="row" align="flex-end" justify="space-between">
              <Text c={C.ink} size={wide ? 34 : 28} fw="bold" ff="Georgia" lts={-0.6}>
                {query ? 'Search results' : tab}
              </Text>
              <Text c={C.muted} size={12} pb={4}>
                {visible.length} {visible.length === 1 ? 'story' : 'stories'}
              </Text>
            </Block>
            <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8, pb: 2 }}>
              {SECTIONS.map((item) => (
                <Chip
                  key={item}
                  onPress={() => setSection(item)}
                  pressed={section === item}
                  variant={section === item ? 'filled' : 'outline'}
                  color={C.ink}
                  size="sm"
                >
                  {item}
                </Chip>
              ))}
            </ScrollArea>
            <Rule heavy />
            {visible.length ? (
              <Block gap={0}>
                {visible.map(storyRow)}
                {visible.length > 3 && <Ad compact />}
              </Block>
            ) : (
              <Block align="center" py={64} gap={8}>
                <Icon name={tab === 'Saved' ? 'bookmark' : 'search'} color={C.muted} size={26} />
                <Text c={C.ink} size={22} ff="Georgia" ta="center">
                  {tab === 'Saved' && !query && section === 'All' ? 'Your reading list is empty' : 'No stories found'}
                </Text>
                <Text c={C.muted} size={13} ta="center">
                  {tab === 'Saved' && !query && section === 'All'
                    ? 'Tap the bookmark on any story to keep it here.'
                    : 'Try a different section or search.'}
                </Text>
              </Block>
            )}
          </Block>
        )}
        <Block align="center" py={32} mt={32} borderTopWidth={1} borderTopColor={C.rule} gap={6}>
          <Block direction="row" align="center" gap={7}>
            <Block gap={0} w={7} h={7} radius={4} bg={C.gold} />
            <Text c={C.ink} size={17} fw="bold" ff="Georgia">
              The Daily Edition
            </Text>
          </Block>
          <Text c={C.muted} size={11} ta="center">
            Fictional stories, bylines and sponsors · Built with plocks
          </Text>
        </Block>
      </ScrollArea>
    </SafeArea>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <NewsScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
