import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Badge, Chip, Input, ScrollArea, SafeArea, Image, Block, Icon, Masonry, PlocksProvider, Tabs, Text, useMediaQuery,
} from '@plocks/ui-snack';
import type { MasonryItem } from '@plocks/ui-snack';

const C = { red: '#E60023', ink: '#202124', muted: '#757575', line: '#ECECEC', pale: '#F5F5F5', white: '#FFFFFF' };
const STORAGE = 'plocks-idea-grid-demo:saved-v1';

type Pin = {
  id: number;
  title: string;
  category: string;
  creator: string;
  description: string;
  image: ImageSourcePropType;
  ratio: number;
};

const PINS: Pin[] = [
  {
    id: 1,
    title: 'A warm little reading nook',
    category: 'Interiors',
    creator: 'The Prototype',
    description: 'A cozy corner with vintage color and plenty of character.',
    image: require('./assets/pins/reading-nook.webp'),
    ratio: 760 / 1140,
  },
  {
    id: 2,
    title: 'Collected ceramic forms',
    category: 'Art',
    creator: 'Chloe Bolton',
    description: 'Sculptural pieces in a soft, earthy palette.',
    image: require('./assets/pins/ceramic-vase.webp'),
    ratio: 760 / 507,
  },
  {
    id: 3,
    title: 'Greenery above the city',
    category: 'Garden',
    creator: 'marisuu',
    description: 'A little balcony inspiration for plant lovers.',
    image: require('./assets/pins/balcony-garden.webp'),
    ratio: 760 / 1013,
  },
  {
    id: 4,
    title: 'Weekend flower market mood',
    category: 'Garden',
    creator: 'Annie Spratt',
    description: 'Loose flowers, warm colors, and a handmade vase.',
    image: require('./assets/pins/market-flowers.webp'),
    ratio: 760 / 1013,
  },
  {
    id: 5,
    title: 'A mid-century living room',
    category: 'Interiors',
    creator: 'Hannah Busing',
    description: 'Warm wood, plants, and the perfect place to unwind.',
    image: require('./assets/pins/living-room.webp'),
    ratio: 760 / 507,
  },
  {
    id: 6,
    title: 'The creative workday setup',
    category: 'Interiors',
    creator: 'Lgnwvr',
    description: 'A calm desk with just the right tools in reach.',
    image: require('./assets/pins/workspace.webp'),
    ratio: 760 / 507,
  },
  {
    id: 7,
    title: 'Slow morning coffee',
    category: 'Food',
    creator: 'Trent Erwin',
    description: 'A quiet espresso moment to start the day.',
    image: require('./assets/pins/coffee.webp'),
    ratio: 1,
  },
  {
    id: 8,
    title: 'Gather around the table',
    category: 'Food',
    creator: 'Wasa Crispbread',
    description: 'Easygoing food and a table made for sharing.',
    image: require('./assets/pins/table.webp'),
    ratio: 760 / 1108,
  },
  {
    id: 9,
    title: 'Simple pottery and natural light',
    category: 'Art',
    creator: 'Toa Heftiba',
    description: 'An understated still life beside the window.',
    image: require('./assets/pins/pottery.webp'),
    ratio: 760 / 1166,
  },
  {
    id: 10,
    title: 'Tools for a creative studio',
    category: 'Art',
    creator: 'Jakub Żerdzicki',
    description: 'A practical workspace with room to make things.',
    image: require('./assets/pins/studio.webp'),
    ratio: 760 / 507,
  },
  {
    id: 11,
    title: 'Flowers in a glass vase',
    category: 'Garden',
    creator: 'Sara Erasmo',
    description: 'Minimal florals in gentle afternoon light.',
    image: require('./assets/pins/minimal-flowers.webp'),
    ratio: 760 / 1140,
  },
  {
    id: 12,
    title: 'Soft neutral living spaces',
    category: 'Interiors',
    creator: 'Francesca Tosolini',
    description: 'Layered textures and a relaxed modern palette.',
    image: require('./assets/pins/interior.webp'),
    ratio: 760 / 507,
  },
];
const CATEGORIES = ['For you', 'Interiors', 'Garden', 'Food', 'Art'];

function PinTile({ pin, saved, onOpen, onSave }: { pin: Pin; saved: boolean; onOpen: () => void; onSave: () => void }) {
  const canHover = useMediaQuery('(hover: hover)');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const showSave = !canHover || hovered || focused;
  const handleBlur = (event: unknown) => {
    const focusEvent = event as { currentTarget?: { contains?: (target: unknown) => boolean }; relatedTarget?: unknown };
    if (!focusEvent.relatedTarget || !focusEvent.currentTarget?.contains?.(focusEvent.relatedTarget)) {
      setFocused(false);
    }
  };

  return (
    <Block
      gap={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      mb={8}
    >
      <Block gap={0} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${pin.title}`}>
        <Block gap={0} radius={19} overflow="hidden" bg={C.pale}>
          <Image source={pin.image} resizeMode="cover" w="100%" aspectRatio={pin.ratio} accessibilityLabel={pin.title} />
        </Block>
        <Text c={C.ink} fw="semibold" size={14} numberOfLines={2} mt={9} px={3}>
          {pin.title}
        </Text>
        <Text c={C.muted} size={11} numberOfLines={1} mt={3} px={3}>
          {pin.creator}
        </Text>
      </Block>
      {showSave && (
        <Block
          gap={0}
          onPress={onSave}
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${pin.title} from saved` : `Save ${pin.title}`}
          position="absolute"
          top={10}
          right={10}
          px={14}
          py={9}
          radius={22}
          bg={saved ? C.ink : C.red}
        >
          <Text c={C.white} fw="bold" size={12}>
            {saved ? 'Saved' : 'Save'}
          </Text>
        </Block>
      )}
    </Block>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 690 ? 3 : 2;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('For you');
  const [tab, setTab] = useState<'Explore' | 'Saved'>('Explore');
  const [saved, setSaved] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const ids = JSON.parse(raw) as unknown;
        if (Array.isArray(ids))
          setSaved(ids.filter((id) => typeof id === 'number' && PINS.some((pin) => pin.id === id)));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(saved)).catch(() => {});
  }, [saved, ready]);

  const toggle = (id: number) =>
    setSaved((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  const pin = PINS.find((item) => item.id === selected);
  const shown = PINS.filter(
    (item) =>
      (tab === 'Explore' || saved.includes(item.id)) &&
      (category === 'For you' || category === item.category) &&
      `${item.title} ${item.category} ${item.creator}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const items: MasonryItem[] = shown.map((item) => ({
    id: String(item.id),
    heightRatio: 1 / item.ratio,
    content: (
      <PinTile
        pin={item}
        saved={saved.includes(item.id)}
        onOpen={() => setSelected(item.id)}
        onSave={() => toggle(item.id)}
      />
    ),
  }));

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <SafeArea gap={0} flex={1} bg={C.white}>
          <StatusBar barStyle="dark-content" />
          <Block gap={0} borderBottomWidth={1} borderBottomColor={C.line} bg={C.white}>
            <Block w="100%" maw={1200} alignSelf="center" px={16} pt={14} pb={12} gap={13}>
              <Block direction="row" align="center" gap={13}>
                <Block
                  gap={0}
                  onPress={() => {
                    setTab('Explore');
                    setCategory('For you');
                    setSelected(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Explore ideas"
                  w={43}
                  h={43}
                  radius={22}
                  bg={C.red}
                  align="center"
                  justify="center"
                >
                  <Text c={C.white} fw="bold" size={29} fs="italic" mt={-3}>
                    P
                  </Text>
                </Block>
                <Tabs
                  navigationOnly
                  variant="chip"
                  color={C.ink}
                  value={tab}
                  onChange={(item) => {
                    setTab(item as 'Explore' | 'Saved');
                    setSelected(null);
                  }}
                  items={[
                    { key: 'Explore', label: 'Explore', content: null },
                    {
                      key: 'Saved',
                      label: 'Saved',
                      accessibilityLabel: `Saved, ${saved.length} ${saved.length === 1 ? 'pin' : 'pins'}`,
                      subLabel: saved.length > 0 ? (
                        <Badge color={C.red} variant="filled" size="sm" radius="full" labelProps={{ c: C.white }}>
                          {saved.length}
                        </Badge>
                      ) : undefined,
                      content: null,
                    },
                  ]}
                />
              </Block>
              <Block direction="row" align="center" gap={10} radius={25} px={16} h={45} bg={C.pale}>
                <Icon name="search" color={C.muted} size={20} />
                <Input
                  variant="unstyled"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search ideas"
                  placeholderTextColor={C.muted}
                  accessibilityLabel="Search ideas"
                  mb={0}
                  flex={1}
                  h="100%"
                  inputColor={C.ink}
                  inputFontSize={15}
                />
                {!!query && (
                  <Block
                    gap={0}
                    onPress={() => setQuery('')}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Icon name="x" color={C.muted} size={17} />
                  </Block>
                )}
              </Block>
              {!pin && (
                <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8 }}>
                  {CATEGORIES.map((item) => (
                    <Chip
                      key={item}
                      onPress={() => setCategory(item)}
                      pressed={category === item}
                      variant={category === item ? 'light' : 'surface'}
                      color={C.red}
                      radius={11}
                    >
                      {item}
                    </Chip>
                  ))}
                </ScrollArea>
              )}
            </Block>
          </Block>

          {pin ? (
            <ScrollArea contentProps={{ w: '100%', maw: 860, alignSelf: 'center', p: 20, pb: 50 }}>
              <Block
                onPress={() => setSelected(null)}
                accessibilityRole="button"
                direction="row"
                align="center"
                gap={6}
                alignSelf="flex-start"
                py={8}
                mb={13}
              >
                <Icon name="arrow-left" size={19} color={C.ink} />
                <Text c={C.ink} fw="semibold" size={14}>
                  Back to ideas
                </Text>
              </Block>
              <Block
                gap={0}
                direction={width >= 690 ? 'row' : 'column'}
                radius={24}
                overflow="hidden"
                bg={C.white}
                borderWidth={1}
                borderColor={C.line}
              >
                <Image
                  source={pin.image}
                  resizeMode="cover"
                  w={width >= 690 ? '53%' : '100%'}
                  aspectRatio={pin.ratio}
                  mah={620}
                  accessibilityLabel={pin.title}
                />
                <Block gap={0} flex={1} p={25} justify="center">
                  <Text c={C.muted} size={12} fw="bold" lts={1}>
                    {pin.category.toUpperCase()}
                  </Text>
                  <Text c={C.ink} size={28} fw="bold" mt={12} lh={34}>
                    {pin.title}
                  </Text>
                  <Text c={C.muted} size={15} mt={12} lh={22}>
                    {pin.description}
                  </Text>
                  <Text c={C.muted} size={13} mt={20}>
                    Photo by {pin.creator}
                  </Text>
                  <Block
                    gap={0}
                    onPress={() => toggle(pin.id)}
                    accessibilityRole="button"
                    alignSelf="flex-start"
                    mt={22}
                    px={25}
                    py={13}
                    radius={24}
                    bg={saved.includes(pin.id) ? C.ink : C.red}
                  >
                    <Text c={C.white} fw="bold" size={14}>
                      {saved.includes(pin.id) ? 'Saved ✓' : 'Save idea'}
                    </Text>
                  </Block>
                </Block>
              </Block>
            </ScrollArea>
          ) : (
            <Block gap={0} flex={1} w="100%" maw={1200} alignSelf="center">
              <Masonry
                data={items}
                numColumns={columns}
                gap={12}
                contentProps={{ px: 10, pt: 12, pb: 40 }}
                estimatedItemSize={280}
                emptyContent={
                  <Block align="center" p={50} gap={12}>
                    <Icon name={tab === 'Saved' ? 'bookmark' : 'search'} color={C.muted} size={35} />
                    <Text c={C.ink} fw="bold" size={18}>
                      {tab === 'Saved' && !saved.length ? 'Your saved ideas will appear here' : 'No ideas found'}
                    </Text>
                    <Text c={C.muted} size={13} ta="center">
                      {tab === 'Saved' && !saved.length
                        ? 'Save a pin to start your collection.'
                        : 'Try another search or topic.'}
                    </Text>
                  </Block>
                }
              />
            </Block>
          )}
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
