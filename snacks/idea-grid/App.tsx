import { useEffect, useState } from 'react';
import { Share, StatusBar, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Avatar, Badge, Block, Button, Chip, Icon, IconButton, Image, Input, Masonry, Menu, MenuDropdown, MenuItem,
  PlocksProvider, SafeArea, ScrollArea, Tabs, Text, useMediaQuery,
} from '@plocks/ui-snack';
import type { MasonryItem } from '@plocks/ui-snack';

const C = { red: '#E60023', ink: '#111111', muted: '#767676', line: '#E9E9E9', pale: '#F1F1F1', white: '#FFFFFF', shade: 'rgba(0,0,0,0.28)' };
const STORAGE = 'plocks-idea-grid-demo:saved-v1';
const AVATARS = ['#C9A27E', '#8FA98B', '#B98B8B', '#8B9DB9', '#B9A88B', '#A08BB9'];

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
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const followers = (pin: Pin) => `${(((pin.id * 53) % 90) + 6) / 10}k followers`;
const likes = (pin: Pin) => 24 + ((pin.id * 37) % 180);

function SaveButton({ saved, title, onPress, size = 'md' }: { saved: boolean; title: string; onPress: () => void; size?: 'md' | 'lg' }) {
  return (
    <Button
      onPress={onPress}
      variant="filled"
      color={saved ? C.ink : C.red}
      radius="full"
      size={size === 'lg' ? 48 : 40}
      accessibilityLabel={saved ? `Remove ${title} from saved` : `Save ${title}`}
      labelProps={{ c: C.white, fw: 'bold', size: size === 'lg' ? 16 : 14 }}
    >
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}

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
      mb={10}
    >
      <Block gap={0} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${pin.title}`}>
        <Block gap={0} radius={16} overflow="hidden" bg={C.pale} aspectRatio={pin.ratio}>
          <Image source={pin.image} resizeMode="cover" w="100%" h="100%" accessibilityLabel={pin.title} />
          {canHover && hovered && <Block gap={0} position="absolute" inset={0} bg={C.shade} pointerEvents="none" />}
        </Block>
        <Text c={C.ink} fw="semibold" size={14} lh={19} numberOfLines={2} mt={8} px={4}>
          {pin.title}
        </Text>
        <Block direction="row" align="center" gap={6} mt={6} px={4}>
          <Avatar size={20} fallback={initials(pin.creator)} bg={AVATARS[pin.id % AVATARS.length]} textColor={C.white} fallbackProps={{ size: 9, fw: 'bold' }} />
          <Text c={C.muted} size={12} numberOfLines={1} shrink={1}>
            {pin.creator}
          </Text>
        </Block>
      </Block>
      {showSave && (
        <Block gap={0} position="absolute" top={10} right={10}>
          <SaveButton saved={saved} title={pin.title} onPress={onSave} />
        </Block>
      )}
    </Block>
  );
}

type CloseupProps = {
  pin: Pin;
  wide: boolean;
  saved: boolean;
  liked: boolean;
  following: boolean;
  comments: string[];
  onBack: () => void;
  onSave: () => void;
  onLike: () => void;
  onFollow: () => void;
  onComment: (text: string) => void;
  onCreator: () => void;
};

function Closeup({ pin, wide, saved, liked, following, comments, onBack, onSave, onLike, onFollow, onComment, onCreator }: CloseupProps) {
  const [draft, setDraft] = useState('');
  const send = () => {
    if (!draft.trim()) return;
    onComment(draft.trim());
    setDraft('');
  };
  const share = () =>
    Share.share({ message: `${pin.title} — ${pin.description}` }).catch(() =>
      Clipboard.setStringAsync(pin.title).catch(() => {}),
    );

  return (
    <Block gap={0} px={6} pt={wide ? 20 : 4}>
      <Block
        gap={0}
        direction={wide ? 'row' : 'column'}
        align={wide ? 'flex-start' : 'stretch'}
        w="100%"
        maw={wide ? 1016 : undefined}
        alignSelf="center"
        radius={wide ? 32 : 0}
        bg={C.white}
        shadow={wide ? 'lg' : undefined}
      >
        <Block gap={0} w={wide ? '50%' : '100%'}>
          <Block
            gap={0}
            radius={wide ? 32 : 24}
            borderTopRightRadius={wide ? 0 : undefined}
            borderBottomRightRadius={wide ? 0 : undefined}
            overflow="hidden"
            bg={C.pale}
            aspectRatio={pin.ratio}
          >
            <Image source={pin.image} resizeMode="cover" w="100%" h="100%" accessibilityLabel={pin.title} />
          </Block>
          <Block gap={0} position="absolute" top={14} left={14}>
            <IconButton
              icon="arrow-left"
              onPress={onBack}
              variant="filled"
              color={C.white}
              iconColor={C.ink}
              radius="full"
              size={44}
              shadow="md"
              accessibilityLabel="Back to ideas"
            />
          </Block>
        </Block>

        <Block gap={0} flex={1} px={wide ? 32 : 6} pt={wide ? 28 : 14} pb={wide ? 28 : 0}>
          <Block direction="row" align="center" justify="space-between" gap={8}>
            <Block direction="row" align="center" gap={2} ml={-10}>
              <IconButton
                icon="heart"
                iconVariant={liked ? 'filled' : 'outlined'}
                onPress={onLike}
                variant="ghost"
                iconColor={liked ? C.red : C.ink}
                radius="full"
                size={44}
                accessibilityLabel={liked ? 'Unlike' : 'Like'}
              />
              <Text c={C.ink} fw="semibold" size={14} mr={6}>
                {likes(pin) + (liked ? 1 : 0)}
              </Text>
              <IconButton icon="share" onPress={share} variant="ghost" iconColor={C.ink} radius="full" size={44} accessibilityLabel="Share" />
              <Menu position="bottom-start">
                <IconButton icon="dots" variant="ghost" iconColor={C.ink} radius="full" size={44} accessibilityLabel="More options" />
                <MenuDropdown>
                  <MenuItem startSection={<Icon name="copy" size="sm" />} onPress={() => Clipboard.setStringAsync(pin.description).catch(() => {})}>
                    Copy description
                  </MenuItem>
                  <MenuItem startSection={<Icon name="search" size="sm" />} onPress={onCreator}>
                    {`More from ${pin.creator}`}
                  </MenuItem>
                </MenuDropdown>
              </Menu>
            </Block>
            <SaveButton saved={saved} title={pin.title} onPress={onSave} size="lg" />
          </Block>

          <Text c={C.ink} size={wide ? 28 : 24} fw="semibold" lh={wide ? 34 : 30} mt={wide ? 20 : 14}>
            {pin.title}
          </Text>
          <Text c={C.ink} size={15} lh={22} mt={10}>
            {pin.description}
          </Text>
          <Text c={C.muted} size={13} mt={8}>
            {pin.category}
          </Text>

          <Block direction="row" align="center" gap={12} mt={22}>
            <Avatar size={48} fallback={initials(pin.creator)} bg={AVATARS[pin.id % AVATARS.length]} textColor={C.white} fallbackProps={{ size: 16, fw: 'bold' }} />
            <Block gap={2} flex={1}>
              <Text c={C.ink} fw="semibold" size={15} numberOfLines={1}>
                {pin.creator}
              </Text>
              <Text c={C.muted} size={13}>
                {followers(pin)}
              </Text>
            </Block>
            <Button
              onPress={onFollow}
              variant="filled"
              color={following ? C.ink : C.line}
              radius="full"
              size={44}
              labelProps={{ c: following ? C.white : C.ink, fw: 'bold', size: 15 }}
            >
              {following ? 'Following' : 'Follow'}
            </Button>
          </Block>

          <Block gap={12} mt={26}>
            <Text c={C.ink} fw="semibold" size={17}>
              {comments.length ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}` : 'Comments'}
            </Text>
            {comments.length ? (
              comments.map((comment, index) => (
                <Block key={index} direction="row" gap={10} align="flex-start">
                  <Avatar size={32} fallback="Y" bg={C.ink} textColor={C.white} fallbackProps={{ size: 12, fw: 'bold' }} />
                  <Text c={C.ink} size={14} lh={20} flex={1} mt={6}>
                    <Text c={C.ink} size={14} fw="semibold">You </Text>
                    {comment}
                  </Text>
                </Block>
              ))
            ) : (
              <Text c={C.muted} size={14}>
                No comments yet. Add one to start the conversation.
              </Text>
            )}
          </Block>

          <Block gap={0} mt={18} pt={16} borderTopWidth={1} borderTopColor={C.line}>
            <Text c={C.ink} fw="semibold" size={15}>
              What do you think?
            </Text>
          </Block>
          <Block direction="row" align="center" gap={8} mt={10} radius={24} pl={18} pr={4} h={48} bg={C.pale}>
            <Input
              variant="unstyled"
              value={draft}
              onChangeText={setDraft}
              onEnter={send}
              placeholder="Add a comment"
              placeholderTextColor={C.muted}
              accessibilityLabel="Add a comment"
              mb={0}
              flex={1}
              h="100%"
              inputColor={C.ink}
              inputFontSize={15}
            />
            {!!draft.trim() && (
              <IconButton icon="arrow-up" onPress={send} variant="filled" color={C.red} iconColor={C.white} radius="full" size={40} accessibilityLabel="Post comment" />
            )}
          </Block>
        </Block>
      </Block>

      <Text c={C.ink} fw="semibold" size={wide ? 22 : 18} ta="center" mt={wide ? 44 : 32} mb={14}>
        More like this
      </Text>
    </Block>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const columns = width >= 1000 ? 5 : width >= 690 ? 3 : 2;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('For you');
  const [tab, setTab] = useState<'Explore' | 'Saved'>('Explore');
  const [saved, setSaved] = useState<number[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<number, string[]>>({});
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

  const flip = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const toggle = (id: number) => setSaved((current) => flip(current, id));
  const pin = PINS.find((item) => item.id === selected);
  const shown = pin
    ? PINS.filter((item) => item.id !== pin.id).sort(
        (a, b) => Number(b.category === pin.category) - Number(a.category === pin.category),
      )
    : PINS.filter(
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
  const goHome = () => {
    setTab('Explore');
    setCategory('For you');
    setSelected(null);
  };

  const brand = (
    <Block
      gap={0}
      onPress={goHome}
      accessibilityRole="button"
      accessibilityLabel="Explore ideas"
      w={44}
      h={44}
      radius={14}
      bg={C.red}
      align="center"
      justify="center"
    >
      <Icon name="masonry" color={C.white} size={24} />
    </Block>
  );
  const tabs = (
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
  );
  const search = (
    <Block direction="row" align="center" gap={10} radius={24} px={16} h={48} bg={C.pale} flex={wide ? 1 : undefined}>
      <Icon name="search" color={C.muted} size={20} />
      <Input
        variant="unstyled"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setSelected(null);
        }}
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
        <IconButton icon="x" onPress={() => setQuery('')} variant="ghost" iconColor={C.muted} radius="full" size={32} accessibilityLabel="Clear search" />
      )}
    </Block>
  );

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <SafeArea gap={0} flex={1} bg={C.white}>
          <StatusBar barStyle="dark-content" />
          <Block gap={0} bg={C.white} borderBottomWidth={pin ? 0 : 1} borderBottomColor={C.line}>
            <Block w="100%" maw={1400} alignSelf="center" px={16} pt={12} pb={pin ? 8 : 12} gap={12}>
              {wide ? (
                <Block direction="row" align="center" gap={14}>
                  {brand}
                  {tabs}
                  {search}
                </Block>
              ) : (
                <>
                  <Block direction="row" align="center" gap={12}>
                    {brand}
                    {tabs}
                  </Block>
                  {search}
                </>
              )}
              {!pin && (
                <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8 }}>
                  {CATEGORIES.map((item) => (
                    <Chip
                      key={item}
                      onPress={() => setCategory(item)}
                      pressed={category === item}
                      variant={category === item ? 'filled' : 'surface'}
                      color={C.ink}
                      radius="full"
                    >
                      {item}
                    </Chip>
                  ))}
                </ScrollArea>
              )}
            </Block>
          </Block>

          <Block gap={0} flex={1} w="100%" maw={1400} alignSelf="center">
            <Masonry
              key={pin ? `pin-${pin.id}` : 'feed'}
              data={items}
              numColumns={columns}
              gap={12}
              contentProps={{ px: 10, pt: pin ? 4 : 14, pb: 40 }}
              estimatedItemSize={280}
              ListHeaderComponent={
                pin ? (
                  <Closeup
                    pin={pin}
                    wide={wide}
                    saved={saved.includes(pin.id)}
                    liked={liked.includes(pin.id)}
                    following={following.includes(pin.creator)}
                    comments={comments[pin.id] ?? []}
                    onBack={() => setSelected(null)}
                    onSave={() => toggle(pin.id)}
                    onLike={() => setLiked((current) => flip(current, pin.id))}
                    onFollow={() => setFollowing((current) => flip(current, pin.creator))}
                    onComment={(text) => setComments((current) => ({ ...current, [pin.id]: [...(current[pin.id] ?? []), text] }))}
                    onCreator={() => {
                      setQuery(pin.creator);
                      goHome();
                    }}
                  />
                ) : undefined
              }
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
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
