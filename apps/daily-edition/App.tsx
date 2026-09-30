import { useEffect, useMemo, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackgroundImage, Chip, Input, ScrollArea, SafeArea, Image, Block, Icon, PlocksProvider, Tabs, Text } from '@plocks/ui';

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

function Rule({ heavy = false }: { heavy?: boolean }) {
  return <Block gap={0} h={heavy ? 2 : 1} bg={heavy ? C.ink : C.rule} />;
}
function Kicker({ children }: { children: string }) {
  return (
    <Text c={C.blue} fw="bold" size={10} lts={1.5}>
      {children.toUpperCase()}
    </Text>
  );
}
function Ad({ compact = false }: { compact?: boolean }) {
  return (
    <Block align="center" py={compact ? 18 : 31} gap={9} borderTopWidth={1} borderBottomWidth={1} borderColor={C.rule}>
      <Text c={C.muted} size={9} lts={1.8}>
        ADVERTISEMENT · DEMO PLACEMENT
      </Text>
      <Block
        w="100%"
        maw={compact ? 360 : 720}
        mih={compact ? 92 : 130}
        bg="#DFE8E4"
        p={18}
        justify="center"
        align="center"
        gap={6}
      >
        <Text c={C.blue} fw="bold" size={11} lts={2}>
          NORTHLINE
        </Text>
        <Text c={C.ink} size={compact ? 17 : 21} ff="Georgia" lts={-0.5}>
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
      onPress={(event) => {
        event.stopPropagation();
        toggleSave(story.id);
      }}
      accessibilityRole="button"
      accessibilityLabel={saved.includes(story.id) ? `Remove ${story.title} from saved` : `Save ${story.title}`}
      p={8}
      mr={-8}
    >
      <Icon
        name="bookmark"
        variant={saved.includes(story.id) ? 'filled' : 'outlined'}
        color={saved.includes(story.id) ? C.blue : C.muted}
        size={21}
      />
    </Block>
  );
  const storyRow = (story: Story, index: number) => (
    <Block
      key={story.id}
      onPress={() => openStory(story)}
      accessibilityRole="button"
      accessibilityLabel={`Read ${story.title}`}
      py={17}
      borderTopWidth={index === 0 ? 2 : 1}
      borderColor={index === 0 ? C.ink : C.rule}
      direction="row"
      gap={17}
      align="flex-start"
    >
      <Block flex={1} gap={6}>
        <Kicker>{story.section}</Kicker>
        <Text c={C.ink} size={wide ? 22 : 19} ff="Georgia" lts={-0.5} lh={wide ? 27 : 24}>
          {story.title}
        </Text>
        <Text c={C.muted} size={13} numberOfLines={2} lh={19}>
          {story.deck}
        </Text>
        <Block direction="row" align="center" gap={7}>
          <Text c={C.muted} size={10}>
            {story.time} · {story.minutes} min read
          </Text>
          {read.includes(story.id) && (
            <Text c={C.blue} size={10}>
              · Read
            </Text>
          )}
        </Block>
      </Block>
      <Image source={ART[story.image]} w={wide ? 170 : 112} h={wide ? 118 : 92} bg={C.pale} resizeMode="cover" />
      {wide && saveButton(story)}
    </Block>
  );
  const lead = STORIES[0];
  return (
    <SafeArea gap={0} flex={1} bg={C.paper}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} bg={C.white} borderBottomWidth={1} borderBottomColor={C.rule}>
        <Block gap={0} maw={1120} w="100%" alignSelf="center" px={wide ? 24 : 16}>
          <Block gap={0} direction="row" justify="space-between" pt={10} pb={8}>
            <Text c={C.muted} size={10} lts={1}>
              THE DAILY EDITION
            </Text>
            <Text c={C.muted} size={10}>
              FICTIONAL NEWS DEMO
            </Text>
          </Block>
          <Rule heavy />
          <Block gap={0} mih={wide ? 77 : 68} direction="row" align="center" justify="space-between">
            <Block
              onPress={() => {
                chooseTab('Today');
              }}
              accessibilityRole="button"
              accessibilityLabel="Go to today edition"
              direction="row"
              align="center"
              gap={9}
            >
              <Block gap={0} w={10} h={10} radius={5} bg={C.gold} />
              <Text c={C.ink} size={wide ? 34 : 27} fw="bold" ff="Georgia" lts={-1.4}>
                The Daily Edition
              </Text>
            </Block>
            <Block
              gap={0}
              onPress={() => {
                setSelected(null);
                setSearchOpen((old) => !old);
              }}
              accessibilityRole="button"
              accessibilityLabel="Search stories"
              p={8}
            >
              <Icon name="search" color={C.ink} size={22} />
            </Block>
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
                <Block gap={0} onPress={() => setQuery('')} accessibilityLabel="Clear search">
                  <Text c={C.blue} size={13}>
                    Clear
                  </Text>
                </Block>
              )}
            </Block>
          )}
          <Rule />
          <Tabs
            navigationOnly
            scrollable
            value={tab}
            onChange={(item) => chooseTab(item as Tab)}
            color={C.blue}
            items={(['Today', 'Latest', 'Sections', 'Saved'] as Tab[]).map((item) => ({ key: item, label: item, content: null }))}
          />
        </Block>
      </Block>
      <ScrollArea
        key={`${selected ?? tab}-${section}`}
        contentProps={{ maw: 1120, w: '100%', alignSelf: 'center', px: wide ? 24 : 16, pb: 80 }}
      >
        {active ? (
          <Block w="100%" maw={780} alignSelf="center" pt={20} gap={15}>
            <Block
              onPress={() => setSelected(null)}
              accessibilityRole="button"
              accessibilityLabel="Back to stories"
              direction="row"
              gap={7}
              align="center"
            >
              <Icon name="arrowLeft" color={C.blue} size={18} />
              <Text c={C.blue} size={13}>
                Back to stories
              </Text>
            </Block>
            <Kicker>{active.section}</Kicker>
            <Text c={C.ink} size={wide ? 42 : 34} ff="Georgia" lts={-0.5} lh={wide ? 48 : 40}>
              {active.title}
            </Text>
            <Text c={C.muted} size={wide ? 19 : 17} lh={25}>
              {active.deck}
            </Text>
            <Rule heavy />
            <Block gap={0} direction="row" align="center" justify="space-between">
              <Block gap={3}>
                <Text c={C.ink} fw="bold" size={12}>
                  By {active.byline}
                </Text>
                <Text c={C.muted} size={11}>
                  {active.time} · {active.minutes} min read
                </Text>
              </Block>
              {saveButton(active)}
            </Block>
            <Image source={ART[active.image]} w="100%" aspectRatio={1.65} bg={C.pale} resizeMode="cover" />
            <Text c={C.muted} size={10}>
              {active.caption}
            </Text>
            <Block maw={650} alignSelf="center" gap={18} pt={10}>
              {active.body.map((paragraph, index) => (
                <Text key={index} c={C.ink} size={17} ff="Georgia" lh={29}>
                  {paragraph}
                </Text>
              ))}
            </Block>
            <Ad compact />
            <Text c={C.ink} fw="bold" size={21} ff="Georgia" lts={-0.5}>
              More from The Daily Edition
            </Text>
            {STORIES.filter((item) => item.id !== active.id)
              .slice(0, 3)
              .map(storyRow)}
          </Block>
        ) : (
          <Block pt={22} gap={18}>
            <Block gap={0} direction="row" align="baseline" justify="space-between">
              <Block gap={0}>
                <Text c={C.muted} size={10} lts={1.5}>
                  ORIGINAL SAMPLE STORIES
                </Text>
                <Text c={C.ink} size={29} fw="bold" ff="Georgia" lts={-0.5}>
                  {searchOpen && query ? 'Search results' : tab === 'Today' ? 'Today’s Edition' : tab}
                </Text>
              </Block>
              {tab === 'Saved' && (
                <Text c={C.muted} size={12}>
                  {saved.length} saved
                </Text>
              )}
            </Block>
            {(tab === 'Sections' || tab === 'Latest' || tab === 'Saved' || !!query) && (
              <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8, pb: 3 }}>
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
            )}
            {tab === 'Today' && !query && (
              <>
                <Rule heavy />
                <Block direction={wide ? 'row' : 'column'} gap={23}>
                  <Block
                    onPress={() => openStory(lead)}
                    accessibilityRole="button"
                    accessibilityLabel={`Read ${lead.title}`}
                    flex={1.6}
                    gap={12}
                  >
                    <BackgroundImage
                      source={ART[lead.image]}
                      w="full"
                      aspectRatio={wide ? 1.7 : 1.45}
                      justify="flex-end"
                      resizeMode="cover"
                    >
                      <Block gap={0} alignSelf="flex-start" m={12} px={9} py={5} bg={C.white}>
                        <Kicker>THE LEAD</Kicker>
                      </Block>
                    </BackgroundImage>
                    <Text c={C.ink} size={wide ? 36 : 30} ff="Georgia" lts={-0.5} lh={wide ? 41 : 35}>
                      {lead.title}
                    </Text>
                    <Text c={C.muted} size={15} lh={22}>
                      {lead.deck}
                    </Text>
                    <Text c={C.muted} size={11}>
                      By {lead.byline} · {lead.minutes} min read
                    </Text>
                  </Block>
                  <Block flex={1} gap={9}>
                    <Kicker>THE BRIEFING</Kicker>
                    <Rule heavy />
                    {STORIES.slice(1, 4).map((story) => (
                      <Block
                        key={story.id}
                        onPress={() => openStory(story)}
                        accessibilityRole="button"
                        gap={5}
                        py={10}
                        borderBottomWidth={1}
                        borderBottomColor={C.rule}
                      >
                        <Kicker>{story.section}</Kicker>
                        <Text c={C.ink} size={20} ff="Georgia" lts={-0.5} lh={25}>
                          {story.title}
                        </Text>
                        <Text c={C.muted} size={11}>
                          {story.minutes} min read
                        </Text>
                      </Block>
                    ))}
                  </Block>
                </Block>
                <Ad />
                <Block gap={5}>
                  <Text c={C.ink} size={25} fw="bold" ff="Georgia" lts={-0.5}>
                    More to Explore
                  </Text>
                  <Text c={C.muted} size={12}>
                    Ideas, places and people across the edition
                  </Text>
                </Block>
                {STORIES.slice(4).map(storyRow)}
              </>
            )}
            {(tab !== 'Today' || !!query) &&
              (visible.length ? (
                <>
                  {visible.map(storyRow)}
                  {visible.length > 3 && <Ad compact />}
                </>
              ) : (
                <Block align="center" py={70} gap={9}>
                  <Text c={C.ink} size={23} ff="Georgia" lts={-0.5}>
                    {tab === 'Saved' ? 'Your reading list is empty' : 'No stories found'}
                  </Text>
                  <Text c={C.muted} size={13}>
                    {tab === 'Saved' ? 'Bookmark an article to find it here.' : 'Try a different section or search.'}
                  </Text>
                </Block>
              ))}
          </Block>
        )}
        <Block align="center" py={34} mt={18} borderTopWidth={1} borderTopColor={C.rule} gap={4}>
          <Text c={C.ink} size={17} fw="bold" ff="Georgia" lts={-0.5}>
            The Daily Edition
          </Text>
          <Text c={C.muted} size={10}>
            An original, fictional editorial demo built with Plocks.
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
