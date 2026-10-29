import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  IconBookmark,
  IconBookmarkFilled,
  IconCompass,
  IconCompassFilled,
  IconHeart,
  IconHeartFilled,
  IconHome,
  IconHomeFilled,
  IconLink,
  IconSend,
  IconSquarePlus,
  IconUserSquare,
} from '@tabler/icons-react-native';
import {
  TextArea,
  Input,
  ScrollArea,
  SafeArea,
  Image,
  Lightbox,
  Block,
  Avatar,
  BottomAppBar,
  Button,
  Dialog,
  Gradient,
  Icon,
  IconButton,
  PlocksProvider,
  Tabs,
  Text,
} from '@plocks/ui';
import type { BottomAppBarItem, LightboxItem } from '@plocks/ui';
import { Carousel } from '@plocks/carousel';

const C = {
  ink: '#0F0F0F',
  muted: '#737373',
  line: '#EFEFEF',
  blue: '#0095F6',
  white: '#FFF',
  soft: '#EFEFEF',
  danger: '#ED4956',
  like: '#FF3040',
};
const RING = '#D62976';
const PHOTOS = [
  require('./assets/scene-lake.webp'),
  require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'),
  require('./assets/scene-forest.webp'),
  require('./assets/scene-ocean.webp'),
];
const PEOPLE = [
  { name: 'mila.roams', full: 'Mila Romero', bio: ['Collecting little moments.', 'Slow travel · film · lakes'], initials: 'MR', color: '#D57F6A' },
  { name: 'the.weekend.edit', full: 'The Weekend Edit', bio: ['Two days, one city.', 'New guide every Friday.'], initials: 'WE', color: '#8B87B6' },
  { name: 'kai.and.co', full: 'Kai & Co', bio: ['Road trips with a dog named Toast.'], initials: 'KC', color: '#4F9BA0' },
  { name: 'jo.studio', full: 'Jo Park', bio: ['Designer. Mostly trees.'], initials: 'JS', color: '#B88E5B' },
  { name: 'sara.outside', full: 'Sara Lind', bio: ['Outside is the best room.'], initials: 'SO', color: '#789C69' },
];
const ME = 0;
const STATS = [
  ['48', '1,204', '389'],
  ['212', '18.4K', '96'],
  ['87', '3,021', '410'],
  ['154', '6,780', '512'],
  ['63', '940', '201'],
];
const STORY_TIMES = ['2h', '5h', '9h', '14h', '20h'];
// Top and bottom edge colors of each scene, so landscape art letterboxes seamlessly in portrait stories.
const PHOTO_EDGES: [string, string][] = [
  ['#2DD4BF', '#0F766E'],
  ['#5046E5', '#251E52'],
  ['#FDBB75', '#A8603A'],
  ['#BAE6FD', '#0C3C32'],
  ['#FB923C', '#1E406E'],
];
const HIGHLIGHTS = [
  { label: 'Lakes', image: 0 },
  { label: 'City', image: 1 },
  { label: 'Desert', image: 2 },
  { label: 'Forest', image: 3 },
  { label: 'Coast', image: 4 },
];
const INITIAL_POSTS = [
  { id: 'lake', person: 0, image: 0, place: 'Lake Crescent', caption: 'Some mornings deserve a little pause. 🌿', likes: 1248, time: '2 hours ago' },
  { id: 'city', person: 1, image: 1, place: 'New York City', caption: 'A city that never runs out of stories.', likes: 842, time: '8 hours ago' },
  { id: 'desert', person: 2, image: 2, place: 'Arizona', caption: 'Golden hour, every hour.', likes: 2315, time: 'Yesterday' },
  { id: 'forest', person: 3, image: 3, place: 'Somewhere green', caption: 'The long way home is the best way home.', likes: 651, time: '2 days ago' },
  { id: 'ocean', person: 4, image: 4, place: 'Pacific Coast', caption: 'Out of office for a moment. 🌊', likes: 1094, time: '3 days ago' },
];
const ACTIVITY = [
  { person: 2, text: 'liked your photo.', time: '2h', image: 0 },
  { person: 3, text: 'started following you.', time: '5h', follow: true },
  { person: 1, text: 'commented: "This light! 😍"', time: '1d', image: 0 },
  { person: 4, text: 'liked your photo.', time: '2d', image: 3 },
  { person: 2, text: 'started following you.', time: '4d', follow: true },
];
type Post = {
  id: string;
  person: number;
  image: number;
  images?: number[];
  place: string;
  caption: string;
  likes: number;
  time: string;
};
const DEMO_CAROUSELS: Record<string, number[]> = { lake: [0, 3, 4], city: [1, 2] };
const postPhotos = (post: Post) => post.images?.length ? post.images : DEMO_CAROUSELS[post.id] ?? [post.image];
type Tab = 'home' | 'explore' | 'activity' | 'profile';
type Sheet = { kind: 'post'; post: Post } | { kind: 'story'; person: number } | { kind: 'profile'; person: number };
const STORAGE = 'plocks-frameleaf-example:v1';
const STORY_MS = 5000;
const TICK_MS = 50;

function Person({ index, size = 32, ring = false, seen = false }: { index: number; size?: number; ring?: boolean; seen?: boolean }) {
  const person = PEOPLE[index];
  const pad = ring ? Math.max(2, Math.round(size / 24)) : 0;
  return (
    <Block gap={0} p={pad} radius={size} borderWidth={ring ? 2 : 0} borderColor={seen ? '#DBDBDB' : RING}>
      <Avatar
        size={size}
        fallback={person.initials}
        bg={person.color}
        textColor="#fff"
        accessibilityLabel={person.name}
      />
    </Block>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Block gap={0} align="center" flex={1}>
      <Text fw="bold" c={C.ink} size={17}>
        {value}
      </Text>
      <Text c={C.ink} size={13}>
        {label}
      </Text>
    </Block>
  );
}

function SheetRow({ label, icon, danger, onPress }: { label: string; icon?: ReactNode; danger?: boolean; onPress: () => void }) {
  return (
    <Block direction="row" align="center" gap={14} px={20} py={14} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <Text c={danger ? C.danger : C.ink} size={15} fw={danger ? 'bold' : undefined}>
        {label}
      </Text>
    </Block>
  );
}

function SheetTile({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  return (
    <Block
      flex={1}
      align="center"
      gap={6}
      py={14}
      radius={12}
      bg={C.soft}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text c={C.ink} size={12}>
        {label}
      </Text>
    </Block>
  );
}

function AppScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>('home');
  const [viewing, setViewing] = useState<number | null>(null);
  const [profileTab, setProfileTab] = useState<'grid' | 'tagged'>('grid');
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<number[]>([1, 2]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [slides, setSlides] = useState<Record<string, number>>({});
  const [lightboxPostId, setLightboxPostId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [story, setStory] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [seenStories, setSeenStories] = useState<number[]>([]);
  const [likedStories, setLikedStories] = useState<number[]>([]);
  const [reply, setReply] = useState('');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as {
          liked?: string[];
          saved?: string[];
          comments?: Record<string, string[]>;
          posts?: Post[];
        };
        if (Array.isArray(data.liked)) setLiked(data.liked);
        if (Array.isArray(data.saved)) setSaved(data.saved);
        if (data.comments && typeof data.comments === 'object') setComments(data.comments);
        if (Array.isArray(data.posts)) setPosts(data.posts);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ liked, saved, comments, posts })).catch(() => {});
  }, [liked, saved, comments, posts, ready]);

  // Stories auto-advance; the timer pauses while a sheet or reply is in progress.
  const paused = story === null || sheet !== null || reply.length > 0;
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setStoryProgress((value) => value + TICK_MS / STORY_MS), TICK_MS);
    return () => clearInterval(timer);
  }, [paused]);
  useEffect(() => {
    if (story !== null && storyProgress >= 1) goStory(1);
  });

  const openStory = (index: number) => {
    setStory(index);
    setStoryProgress(0);
    setSeenStories((current) => (current.includes(index) ? current : [...current, index]));
  };
  const closeStory = () => {
    setStory(null);
    setReply('');
  };
  const goStory = (step: number) => {
    if (story === null) return;
    const next = story + step;
    if (next < 0) setStoryProgress(0);
    else if (next >= PEOPLE.length) closeStory();
    else openStory(next);
  };
  const flash = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  };
  const toggle = <T,>(id: T, values: T[], setValues: (value: T[]) => void) =>
    setValues(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
  const submitComment = () => {
    if (!selected || !draft.trim()) return;
    setComments((current) => ({ ...current, [selected]: [...(current[selected] ?? []), draft.trim()] }));
    setDraft('');
  };
  const createPost = () => {
    if (!newCaption.trim()) return;
    const post: Post = {
      id: `mine-${Date.now()}`,
      person: ME,
      image: 0,
      place: 'From my gallery',
      caption: newCaption.trim(),
      likes: 0,
      time: 'Just now',
    };
    setPosts((current) => [post, ...current]);
    setNewCaption('');
    setCreating(false);
    goTab('home');
  };
  const goTab = (next: Tab) => {
    setTab(next);
    setViewing(null);
    setSelected(null);
  };
  const openProfile = (person: number) => {
    closeStory();
    setProfileTab('grid');
    if (person === ME) goTab('profile');
    else setViewing(person);
  };
  const openLightbox = (post: Post, index: number) => {
    setLightboxPostId(post.id);
    setLightboxIndex(index);
  };
  const copyLink = (path: string) => {
    Clipboard.setStringAsync(`https://frameleaf.example/${path}`).catch(() => {});
    setSheet(null);
    flash('Link copied');
  };
  const closeSheet = () => setSheet(null);

  const renderPostCard = (post: Post) => {
    const person = PEOPLE[post.person];
    const photos = postPhotos(post);
    const isLiked = liked.includes(post.id);
    const isSaved = saved.includes(post.id);
    const commentCount = comments[post.id]?.length ?? 0;
    return (
      <Block key={post.id} gap={0} bg={C.white} mb={14}>
        <Block direction="row" align="center" gap={10} pl={12} pr={4} py={8}>
          <Block gap={0} onPress={() => openStory(post.person)} accessibilityRole="button" accessibilityLabel={`${person.name} story`}>
            <Person index={post.person} ring seen={seenStories.includes(post.person)} />
          </Block>
          <Block gap={0} flex={1} onPress={() => openProfile(post.person)} accessibilityRole="button" accessibilityLabel={`${person.name} profile`}>
            <Text fw="bold" c={C.ink} size={13}>
              {person.name}
            </Text>
            <Text c={C.ink} size={11}>
              {post.place}
            </Text>
          </Block>
          <IconButton
            icon="dots"
            variant="ghost"
            iconColor={C.ink}
            accessibilityLabel={`More options for ${person.name}'s post`}
            onPress={() => setSheet({ kind: 'post', post })}
          />
        </Block>
        {photos.length > 1 ? (
          <Carousel
            h={Math.min(width, 560) * 1.25}
            showArrows={wide}
            showDots={false}
            onSlideChange={(index: number) => setSlides((current) => ({ ...current, [post.id]: index }))}
            arrowSize="sm"
            dotSize="xs"
            accessibilityLabel={`${person.name} post photos`}
          >
            {photos.map((image, index) => (
              <Block
                key={`${post.id}-${index}`}
                gap={0}
                onPress={() => openLightbox(post, index)}
                accessibilityRole="button"
                accessibilityLabel={`Open photo ${index + 1} of ${photos.length} from ${person.name}`}
                w="100%"
                h="100%"
              >
                <Image source={PHOTOS[image]} resizeMode="cover" w="100%" h="100%" alt="" />
              </Block>
            ))}
          </Carousel>
        ) : (
          <Block
            gap={0}
            onPress={() => openLightbox(post, 0)}
            accessibilityRole="button"
            accessibilityLabel={`Open photo from ${person.name}`}
            w="100%"
            aspectRatio={4 / 5}
            overflow="hidden"
          >
            <Image source={PHOTOS[photos[0]]} resizeMode="cover" w="100%" h="100%" alt="" />
          </Block>
        )}
        <Block direction="row" align="center" px={14} pt={10} gap={16}>
          {photos.length > 1 && (
            <Block position="absolute" left={0} right={0} top={20} direction="row" justify="center" gap={4}>
              {photos.map((_, index) => (
                <Block key={index} gap={0} w={6} h={6} radius={3} bg={index === (slides[post.id] ?? 0) ? C.blue : '#C7C7C7'} />
              ))}
            </Block>
          )}
          <Block gap={0} accessibilityRole="button" accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'} onPress={() => toggle(post.id, liked, setLiked)}>
            {isLiked ? <IconHeartFilled size={26} color={C.like} /> : <IconHeart size={26} color={C.ink} strokeWidth={1.8} />}
          </Block>
          <Block gap={0} accessibilityRole="button" accessibilityLabel="View comments" onPress={() => setSelected(post.id)}>
            <Icon name="message" color={C.ink} size={25} />
          </Block>
          <Block gap={0} accessibilityRole="button" accessibilityLabel="Share post" onPress={() => copyLink(`p/${post.id}`)}>
            <IconSend size={25} color={C.ink} strokeWidth={1.8} />
          </Block>
          <Block gap={0} flex={1} />
          <Block gap={0} accessibilityRole="button" accessibilityLabel={isSaved ? 'Remove saved post' : 'Save post'} onPress={() => toggle(post.id, saved, setSaved)}>
            {isSaved ? <IconBookmarkFilled size={26} color={C.ink} /> : <IconBookmark size={26} color={C.ink} strokeWidth={1.8} />}
          </Block>
        </Block>
        <Block px={14} pt={8} pb={10} gap={4}>
          <Text fw="bold" c={C.ink} size={14}>
            {(post.likes + Number(isLiked)).toLocaleString()} likes
          </Text>
          <Text c={C.ink} size={14} lh={19}>
            <Text fw="bold" c={C.ink} size={14}>
              {person.name}{' '}
            </Text>
            {post.caption}
          </Text>
          {commentCount > 0 && (
            <Block gap={0} onPress={() => setSelected(post.id)}>
              <Text c={C.muted} size={14}>
                View {commentCount === 1 ? '1 comment' : `all ${commentCount} comments`}
              </Text>
            </Block>
          )}
          <Block direction="row" align="center" gap={8} onPress={() => setSelected(post.id)} accessibilityRole="button" accessibilityLabel="Add a comment">
            <Person index={ME} size={22} />
            <Text c={C.muted} size={13}>
              Add a comment…
            </Text>
          </Block>
          <Text c={C.muted} size={11}>
            {post.time}
          </Text>
        </Block>
      </Block>
    );
  };

  const renderGrid = (images: { key: string; image: number; onPress?: () => void }[]) => (
    <Block direction="row" wrap="wrap" gap={0}>
      {images.map((item) => (
        <Block key={item.key} gap={0} w="33.333%" aspectRatio={1} p={1} onPress={item.onPress}>
          <Image source={PHOTOS[item.image]} w="100%" h="100%" resizeMode="cover" alt="" />
        </Block>
      ))}
    </Block>
  );

  const renderProfile = (index: number) => {
    const person = PEOPLE[index];
    const mine = index === ME;
    const [postCount, followers, followingCount] = STATS[index];
    const own = posts.filter((post) => post.person === index);
    // Pad the demo grid with sample photos to full rows of three.
    const extras = Math.ceil((own.length + 12) / 3) * 3 - own.length;
    const gridItems = [
      ...own.map((post) => ({ key: post.id, image: post.image, onPress: () => setSelected(post.id) })),
      ...Array.from({ length: extras }, (_, i) => ({ key: `extra-${i}`, image: (index + i * 3 + 1) % PHOTOS.length })),
    ];
    const tagged = Array.from({ length: 6 }, (_, i) => ({ key: `tag-${i}`, image: (index + i + 3) % PHOTOS.length }));
    const isFollowing = following.includes(index);
    return (
      <Block gap={0}>
        <Block direction="row" align="center" px={16} h={48} gap={8}>
          {!mine && (
            <IconButton icon="chevron-left" variant="ghost" iconColor={C.ink} accessibilityLabel="Back" onPress={() => setViewing(null)} />
          )}
          {mine && <Icon name="lock" size={16} color={C.ink} />}
          <Text fw="bold" c={C.ink} size={mine ? 20 : 17} flex={1}>
            {person.name}
          </Text>
          <IconButton icon="dots" variant="ghost" iconColor={C.ink} accessibilityLabel="Profile options" onPress={() => setSheet({ kind: 'profile', person: index })} />
        </Block>
        <Block direction="row" align="center" px={16} pt={8} gap={12}>
          <Block gap={0} onPress={() => openStory(index)} accessibilityRole="button" accessibilityLabel={`${person.name} story`}>
            <Person index={index} size={80} ring seen={seenStories.includes(index)} />
          </Block>
          <Block direction="row" flex={1}>
            <Stat value={postCount} label="posts" />
            <Stat value={followers} label="followers" />
            <Stat value={followingCount} label="following" />
          </Block>
        </Block>
        <Block px={16} pt={12} gap={2}>
          <Text fw="bold" c={C.ink} size={14}>
            {person.full}
          </Text>
          {person.bio.map((line) => (
            <Text key={line} c={C.ink} size={14} lh={19}>
              {line}
            </Text>
          ))}
        </Block>
        <Block direction="row" px={16} pt={14} gap={8}>
          {mine ? (
            <>
              <Block flex={1}>
                <Button variant="filled" title="Edit profile" size="sm" color={C.soft} textColor={C.ink} fullWidth onPress={() => flash('Profile editing is not part of this demo')} />
              </Block>
              <Block flex={1}>
                <Button variant="filled" title="Share profile" size="sm" color={C.soft} textColor={C.ink} fullWidth onPress={() => copyLink(person.name)} />
              </Block>
            </>
          ) : (
            <>
              <Block flex={1}>
                <Button
                  variant="filled"
                  title={isFollowing ? 'Following' : 'Follow'}
                  size="sm"
                  color={isFollowing ? C.soft : C.blue}
                  textColor={isFollowing ? C.ink : C.white}
                  fullWidth
                  onPress={() => toggle(index, following, setFollowing)}
                />
              </Block>
              <Block flex={1}>
                <Button variant="filled" title="Message" size="sm" color={C.soft} textColor={C.ink} fullWidth onPress={() => flash('Messages are not part of this demo')} />
              </Block>
            </>
          )}
        </Block>
        <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 16, px: 16, py: 16 }}>
          {HIGHLIGHTS.map((highlight) => (
            <Block key={highlight.label} align="center" gap={6} onPress={() => openStory((index + highlight.image) % PEOPLE.length)} accessibilityRole="button" accessibilityLabel={`${highlight.label} highlight`}>
              <Block gap={0} p={3} radius={40} borderWidth={1} borderColor="#DBDBDB">
                <Block gap={0} w={60} h={60} radius={30} overflow="hidden">
                  <Image source={PHOTOS[highlight.image]} w="100%" h="100%" resizeMode="cover" alt="" />
                </Block>
              </Block>
              <Text c={C.ink} size={12}>
                {highlight.label}
              </Text>
            </Block>
          ))}
          {mine && (
            <Block align="center" gap={6}>
              <Block gap={0} w={68} h={68} radius={34} borderWidth={1} borderColor="#DBDBDB" align="center" justify="center">
                <Icon name="plus" size={28} color={C.ink} />
              </Block>
              <Text c={C.ink} size={12}>
                New
              </Text>
            </Block>
          )}
        </ScrollArea>
        <Block direction="row" borderTopWidth={1} borderTopColor={C.line} gap={0}>
          {(['grid', 'tagged'] as const).map((key) => (
            <Block
              key={key}
              flex={1}
              align="center"
              py={11}
              gap={0}
              borderBottomWidth={1}
              borderBottomColor={profileTab === key ? C.ink : 'transparent'}
              onPress={() => setProfileTab(key)}
              accessibilityRole="tab"
              accessibilityLabel={key === 'grid' ? 'Posts' : 'Tagged'}
            >
              {key === 'grid' ? (
                <Icon name="grid" size={24} color={profileTab === key ? C.ink : C.muted} />
              ) : (
                <IconUserSquare size={24} color={profileTab === key ? C.ink : C.muted} strokeWidth={1.8} />
              )}
            </Block>
          ))}
        </Block>
        {renderGrid(profileTab === 'grid' ? gridItems : tagged)}
      </Block>
    );
  };

  const activePost = posts.find((post) => post.id === selected);
  const lightboxPost = posts.find((post) => post.id === lightboxPostId);
  const lightboxImages: LightboxItem[] = lightboxPost
    ? postPhotos(lightboxPost).map((image, index) => ({
        id: `${lightboxPost.id}-${index}`,
        uri: PHOTOS[image],
        title: `${PEOPLE[lightboxPost.person].name} · ${lightboxPost.place}`,
      }))
    : [];
  const showProfile = viewing !== null || tab === 'profile';
  const navItems: BottomAppBarItem[] = [
    { key: 'home', label: 'Home', icon: ({ active, color }) => (active ? <IconHomeFilled size={27} color={color} /> : <IconHome size={27} color={color} strokeWidth={1.8} />) },
    { key: 'explore', label: 'Search', icon: ({ active, color }) => (active ? <IconCompassFilled size={27} color={color} /> : <IconCompass size={27} color={color} strokeWidth={1.8} />) },
    { key: 'create', label: 'New post', icon: ({ color }) => <IconSquarePlus size={27} color={color} strokeWidth={1.8} />, onPress: () => setCreating(true) },
    { key: 'activity', label: 'Activity', icon: ({ active, color }) => (active ? <IconHeartFilled size={27} color={color} /> : <IconHeart size={27} color={color} strokeWidth={1.8} />) },
    {
      key: 'profile',
      label: 'Profile',
      icon: ({ active }) => (
        <Block gap={0} p={1} radius={16} borderWidth={active ? 2 : 0} borderColor={C.ink} m={active ? 0 : 2}>
          <Avatar size={24} fallback={PEOPLE[ME].initials} bg={PEOPLE[ME].color} textColor="#fff" />
        </Block>
      ),
    },
  ];
  const visiblePosts = posts.filter((post) => !hidden.includes(post.id));

  const sheetPerson = sheet ? (sheet.kind === 'post' ? sheet.post.person : sheet.person) : ME;
  const sheetMine = sheetPerson === ME;

  return (
    <Block gap={0} flex={1} bg={C.white}>
      <SafeArea gap={0} flex={1} bg={C.white}>
        <StatusBar barStyle={story !== null ? 'light-content' : 'dark-content'} />
        <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} maw={1260} w="100%" alignSelf="center">
          {wide && (
            <Block w={240} borderRightWidth={1} borderRightColor={C.line} p={22} gap={30}>
              <Text fw="bold" c={C.ink} size={29} fs="italic">
                frame
              </Text>
              <Tabs
                navigationOnly
                orientation="vertical"
                variant="chip"
                color={C.ink}
                value={tab}
                onChange={(item) => goTab(item as Tab)}
                items={(['home', 'explore', 'activity', 'profile'] as const).map((item) => ({
                  key: item,
                  label: item === 'explore' ? 'Search' : item[0].toUpperCase() + item.slice(1),
                  icon: (
                    <Icon
                      name={item === 'home' ? 'home' : item === 'explore' ? 'search' : item === 'activity' ? 'heart' : 'avatar'}
                      size={24}
                      color={tab === item ? C.white : C.ink}
                    />
                  ),
                  content: null,
                }))}
              />
              <Button variant="filled" title="Create post" color={C.blue} onPress={() => setCreating(true)} />
            </Block>
          )}
          <Block gap={0} flex={1} miw={0}>
            {!wide && tab === 'home' && viewing === null && (
              <Block gap={0} h={50} direction="row" align="center" justify="space-between" pl={16} pr={8}>
                <Text fw="bold" c={C.ink} size={27} fs="italic">
                  frame
                </Text>
                <Block direction="row" gap={0}>
                  <IconButton
                    icon={<IconHeart size={26} color={C.ink} strokeWidth={1.8} />}
                    variant="ghost"
                    accessibilityLabel="Activity"
                    onPress={() => goTab('activity')}
                  />
                  <IconButton
                    icon={<IconSend size={25} color={C.ink} strokeWidth={1.8} />}
                    variant="ghost"
                    accessibilityLabel="Messages"
                    onPress={() => flash('Messages are not part of this demo')}
                  />
                </Block>
              </Block>
            )}
            <ScrollArea key={showProfile ? `profile-${viewing ?? ME}` : tab} keyboardShouldPersistTaps="handled" flex={1} contentProps={{ align: 'center', pb: wide ? 30 : 90 }}>
              <Block gap={0} w="100%" maw={tab === 'explore' && !showProfile ? 800 : 560}>
                {showProfile ? (
                  renderProfile(viewing ?? ME)
                ) : (
                  <>
                    {tab === 'home' && (
                      <>
                        <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 14, px: 12, pt: 6, pb: 12 }}>
                          {PEOPLE.map((person, index) => (
                            <Block
                              key={person.name}
                              onPress={() => openStory(index)}
                              align="center"
                              gap={5}
                              w={78}
                              accessibilityRole="button"
                              accessibilityLabel={`${index === ME ? 'Your' : `${person.name}'s`} story`}
                            >
                              <Person index={index} size={66} ring seen={seenStories.includes(index)} />
                              <Text c={C.ink} size={12} numberOfLines={1}>
                                {index === ME ? 'Your story' : person.name}
                              </Text>
                            </Block>
                          ))}
                        </ScrollArea>
                        <Block gap={0} h={1} bg={C.line} mb={4} />
                        {visiblePosts.map(renderPostCard)}
                      </>
                    )}
                    {tab === 'explore' && (
                      <Block gap={0}>
                        <Block gap={0} p={12}>
                          <Block direction="row" align="center" gap={8} bg={C.soft} radius={10} px={12} h={38}>
                            <Icon name="search" size={16} color={C.muted} />
                            <Input
                              variant="unstyled"
                              value={query}
                              onChangeText={setQuery}
                              placeholder="Search"
                              placeholderTextColor={C.muted}
                              mb={0}
                              flex={1}
                            />
                          </Block>
                        </Block>
                        {query.trim() ? (
                          <Block gap={0}>
                            {PEOPLE.map((person, index) => ({ person, index }))
                              .filter(({ person }) => `${person.name} ${person.full}`.toLowerCase().includes(query.toLowerCase()))
                              .map(({ person, index }) => (
                                <Block key={person.name} direction="row" align="center" gap={12} px={16} py={8} onPress={() => openProfile(index)}>
                                  <Person index={index} size={44} />
                                  <Block gap={0}>
                                    <Text fw="bold" c={C.ink} size={14}>
                                      {person.name}
                                    </Text>
                                    <Text c={C.muted} size={13}>
                                      {person.full}
                                    </Text>
                                  </Block>
                                </Block>
                              ))}
                          </Block>
                        ) : (
                          renderGrid(
                            Array.from({ length: 15 }, (_, i) => {
                              const post = posts[i % posts.length];
                              return { key: `explore-${i}`, image: (post.image + Math.floor(i / posts.length)) % PHOTOS.length, onPress: () => setSelected(post.id) };
                            }),
                          )
                        )}
                      </Block>
                    )}
                    {tab === 'activity' && (
                      <Block gap={0}>
                        <Text fw="bold" c={C.ink} size={22} px={16} pt={10} pb={6}>
                          Notifications
                        </Text>
                        <Text fw="bold" c={C.ink} size={15} px={16} py={10}>
                          This week
                        </Text>
                        {ACTIVITY.map((item, index) => (
                          <Block key={index} direction="row" align="center" gap={12} px={16} py={8}>
                            <Block gap={0} onPress={() => openProfile(item.person)}>
                              <Person index={item.person} size={44} />
                            </Block>
                            <Text c={C.ink} size={14} flex={1} lh={19}>
                              <Text fw="bold" c={C.ink} size={14}>
                                {PEOPLE[item.person].name}
                              </Text>{' '}
                              {item.text}{' '}
                              <Text c={C.muted} size={14}>
                                {item.time}
                              </Text>
                            </Text>
                            {item.follow ? (
                              <Button
                                variant="filled"
                                title={following.includes(item.person) ? 'Following' : 'Follow'}
                                size="xs"
                                color={following.includes(item.person) ? C.soft : C.blue}
                                textColor={following.includes(item.person) ? C.ink : C.white}
                                onPress={() => toggle(item.person, following, setFollowing)}
                              />
                            ) : (
                              <Block gap={0} w={44} h={44} radius={4} overflow="hidden">
                                <Image source={PHOTOS[item.image ?? 0]} w="100%" h="100%" resizeMode="cover" alt="" />
                              </Block>
                            )}
                          </Block>
                        ))}
                      </Block>
                    )}
                  </>
                )}
              </Block>
            </ScrollArea>
            {!wide && (
              <BottomAppBar
                items={navItems}
                activeKey={showProfile ? 'profile' : tab}
                onItemPress={(key) => key !== 'create' && goTab(key as Tab)}
                showLabels={false}
                indicator={false}
                activeColor={C.ink}
                inactiveColor={C.ink}
                borderColor={C.line}
                bg={C.white}
                accessibilityLabel="Main"
              />
            )}
          </Block>
        </Block>
        {notice && (
          <Block position="absolute" left={16} right={16} bottom={wide ? 24 : 80} zIndex={2000} align="center" gap={0}>
            <Block gap={0} bg="#262626" radius={10} px={16} py={12} shadow="md">
              <Text c={C.white} size={14}>
                {notice}
              </Text>
            </Block>
          </Block>
        )}
      </SafeArea>

      {story !== null && (
        <Block position="absolute" inset={0} zIndex={1000} bg="#000" gap={0}>
          <SafeArea gap={0} flex={1} bg="#000">
            <Block gap={0} flex={1} w="100%" maw={wide ? 440 : undefined} alignSelf="center">
            <Block gap={0} flex={1} radius={10} overflow="hidden">
              <Gradient
                position="absolute"
                inset={0}
                colors={[PHOTO_EDGES[story][0], PHOTO_EDGES[story][0], PHOTO_EDGES[story][1], PHOTO_EDGES[story][1]]}
                locations={[0, 0.5, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                justify="center"
                gap={0}
              >
                <Block gap={0} w="100%" aspectRatio={3 / 2}>
                  <Image source={PHOTOS[story]} w="100%" h="100%" resizeMode="cover" alt={`${PEOPLE[story].name} story`} />
                </Block>
              </Gradient>
              <Gradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} gap={10} px={8} pt={8} pb={28}>
                <Block direction="row" gap={4}>
                  {PEOPLE.map((person, index) => (
                    <Block key={person.name} flex={1} h={2.5} radius={2} bg="rgba(255,255,255,0.35)" overflow="hidden" gap={0}>
                      <Block
                        gap={0}
                        h="100%"
                        bg={C.white}
                        w={`${index < story ? 100 : index === story ? Math.min(100, storyProgress * 100) : 0}%`}
                      />
                    </Block>
                  ))}
                </Block>
                <Block direction="row" align="center" gap={8} pl={4}>
                  <Block direction="row" align="center" gap={8} flex={1} onPress={() => openProfile(story)} accessibilityRole="button" accessibilityLabel={`${PEOPLE[story].name} profile`}>
                    <Person index={story} size={32} />
                    <Text fw="bold" c={C.white} size={14}>
                      {PEOPLE[story].name}
                    </Text>
                    <Text c="rgba(255,255,255,0.75)" size={14}>
                      {STORY_TIMES[story]}
                    </Text>
                  </Block>
                  <IconButton icon="dots" variant="ghost" iconColor={C.white} accessibilityLabel="Story options" onPress={() => setSheet({ kind: 'story', person: story })} />
                  <IconButton icon="x" variant="ghost" iconColor={C.white} accessibilityLabel="Close story" onPress={closeStory} />
                </Block>
              </Gradient>
              <Block direction="row" flex={1} gap={0}>
                <Block flex={1} gap={0} onPress={() => goStory(-1)} accessibilityRole="button" accessibilityLabel="Previous story" />
                <Block flex={2} gap={0} onPress={() => goStory(1)} accessibilityRole="button" accessibilityLabel="Next story" />
              </Block>
            </Block>
              <Block direction="row" align="center" gap={14} px={12} py={10}>
                <Block flex={1} h={44} radius={22} borderWidth={1} borderColor="rgba(255,255,255,0.7)" px={16} justify="center" gap={0}>
                  <Input
                    variant="unstyled"
                    value={reply}
                    onChangeText={setReply}
                    placeholder="Send message"
                    placeholderTextColor="rgba(255,255,255,0.85)"
                    inputColor={C.white}
                    onEnter={() => {
                      setReply('');
                      flash('Message sent');
                    }}
                    mb={0}
                  />
                </Block>
                <Block gap={0} onPress={() => toggle(story, likedStories, setLikedStories)} accessibilityRole="button" accessibilityLabel={likedStories.includes(story) ? 'Unlike story' : 'Like story'}>
                  {likedStories.includes(story) ? <IconHeartFilled size={28} color={C.like} /> : <IconHeart size={28} color={C.white} strokeWidth={1.8} />}
                </Block>
                <Block gap={0} onPress={() => copyLink(`stories/${PEOPLE[story].name}`)} accessibilityRole="button" accessibilityLabel="Share story">
                  <IconSend size={27} color={C.white} strokeWidth={1.8} />
                </Block>
              </Block>
            </Block>
          </SafeArea>
        </Block>
      )}

      {(activePost || creating) && (
        <Dialog
          opened
          variant={creating ? 'modal' : 'bottomsheet'}
          title={creating ? 'New post' : 'Comments'}
          titleProps={{ fw: 'bold', size: 16, ta: 'center' }}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
        >
          {creating ? (
            <Block p={18} gap={14}>
              <Image source={PHOTOS[0]} w="100%" h={220} radius={8} />
              <Text c={C.muted} size={12}>
                Using a demo gallery photo
              </Text>
              <TextArea
                variant="outline"
                value={newCaption}
                onChangeText={setNewCaption}
                placeholder="Write a caption..."
                mb={0}
                rows={3}
                radius={8}
              />
              <Button variant="filled" title="Share" color={C.blue} fullWidth onPress={createPost} disabled={!newCaption.trim()} />
            </Block>
          ) : (
            activePost && (
              <Block gap={0}>
                <ScrollArea mah={360} contentProps={{ py: 12, gap: 18 }}>
                  <Block direction="row" gap={12}>
                    <Person index={activePost.person} size={32} />
                    <Text c={C.ink} size={14} flex={1} lh={19}>
                      <Text fw="bold" c={C.ink} size={14}>
                        {PEOPLE[activePost.person].name}{' '}
                      </Text>
                      {activePost.caption}
                    </Text>
                  </Block>
                  {(comments[activePost.id] ?? []).map((comment, index) => (
                    <Block key={index} direction="row" gap={12}>
                      <Person index={ME} size={32} />
                      <Text c={C.ink} size={14} flex={1} lh={19}>
                        <Text fw="bold" c={C.ink} size={14}>
                          {PEOPLE[ME].name}{' '}
                        </Text>
                        {comment}
                      </Text>
                    </Block>
                  ))}
                  {(comments[activePost.id] ?? []).length === 0 && (
                    <Text c={C.muted} size={13} ta="center" py={12}>
                      No comments yet. Start the conversation.
                    </Text>
                  )}
                </ScrollArea>
                <Block direction="row" pt={10} borderTopWidth={1} borderTopColor={C.line} align="center" gap={10}>
                  <Person index={ME} size={32} />
                  <Block flex={1} h={40} radius={20} borderWidth={1} borderColor="#DBDBDB" px={14} justify="center" gap={0}>
                    <Input
                      variant="unstyled"
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={`Add a comment for ${PEOPLE[activePost.person].name}…`}
                      onEnter={submitComment}
                      mb={0}
                      inputColor={C.ink}
                    />
                  </Block>
                  <Block gap={0} onPress={submitComment} opacity={draft.trim() ? 1 : 0.4} accessibilityRole="button" accessibilityLabel="Post comment">
                    <Text fw="bold" c={C.blue}>
                      Post
                    </Text>
                  </Block>
                </Block>
              </Block>
            )
          )}
        </Dialog>
      )}

      {sheet && (
        <Dialog opened variant="bottomsheet" title={null} accessibilityLabel="Options" onClose={closeSheet}>
          <Block gap={0} pb={16}>
            {sheet.kind === 'post' && (
              <Block direction="row" gap={10} pt={4} pb={12}>
                <SheetTile
                  label={saved.includes(sheet.post.id) ? 'Unsave' : 'Save'}
                  icon={saved.includes(sheet.post.id) ? <IconBookmarkFilled size={24} color={C.ink} /> : <IconBookmark size={24} color={C.ink} strokeWidth={1.8} />}
                  onPress={() => {
                    toggle(sheet.post.id, saved, setSaved);
                    closeSheet();
                    flash(saved.includes(sheet.post.id) ? 'Removed from saved' : 'Saved');
                  }}
                />
                <SheetTile label="Share" icon={<IconSend size={24} color={C.ink} strokeWidth={1.8} />} onPress={() => copyLink(`p/${sheet.post.id}`)} />
                <SheetTile label="Copy link" icon={<IconLink size={24} color={C.ink} strokeWidth={1.8} />} onPress={() => copyLink(`p/${sheet.post.id}`)} />
              </Block>
            )}
            <Block gap={0} radius={12} bg={C.soft} overflow="hidden">
              {sheet.kind === 'story' && (
                <>
                  <SheetRow label="Copy link" icon={<IconLink size={22} color={C.ink} strokeWidth={1.8} />} onPress={() => copyLink(`stories/${PEOPLE[sheet.person].name}`)} />
                  <SheetRow label={`Mute ${PEOPLE[sheet.person].name}`} icon={<Icon name="volume-off" size={22} color={C.ink} />} onPress={() => { closeSheet(); flash('Stories muted'); }} />
                </>
              )}
              {sheet.kind === 'profile' && (
                <>
                  <SheetRow label="Share this profile" icon={<IconSend size={22} color={C.ink} strokeWidth={1.8} />} onPress={() => copyLink(PEOPLE[sheet.person].name)} />
                  <SheetRow label="Copy profile URL" icon={<IconLink size={22} color={C.ink} strokeWidth={1.8} />} onPress={() => copyLink(PEOPLE[sheet.person].name)} />
                </>
              )}
              {!sheetMine && sheet.kind !== 'profile' && (
                <SheetRow label="About this account" icon={<Icon name="avatar" size={22} color={C.ink} />} onPress={() => { closeSheet(); openProfile(sheetPerson); }} />
              )}
              {sheet.kind === 'post' && !sheetMine && (
                <>
                  <SheetRow
                    label="Not interested"
                    icon={<Icon name="eyeOff" size={22} color={C.ink} />}
                    onPress={() => {
                      setHidden((current) => [...current, sheet.post.id]);
                      closeSheet();
                      flash('Post hidden');
                    }}
                  />
                  {following.includes(sheetPerson) && (
                    <SheetRow
                      label="Unfollow"
                      icon={<Icon name="user" size={22} color={C.ink} />}
                      onPress={() => {
                        toggle(sheetPerson, following, setFollowing);
                        closeSheet();
                        flash(`Unfollowed ${PEOPLE[sheetPerson].name}`);
                      }}
                    />
                  )}
                </>
              )}
              {sheetMine && sheet.kind === 'post' && (
                <SheetRow
                  label="Delete"
                  danger
                  icon={<Icon name="trash" size={22} color={C.danger} />}
                  onPress={() => {
                    setPosts((current) => current.filter((post) => post.id !== sheet.post.id));
                    closeSheet();
                    flash('Post deleted');
                  }}
                />
              )}
              {!sheetMine && (
                <SheetRow label="Report" danger icon={<Icon name="flag" size={22} color={C.danger} />} onPress={() => { closeSheet(); flash('Thanks for letting us know'); }} />
              )}
            </Block>
          </Block>
        </Dialog>
      )}

      <Lightbox
        opened={lightboxPostId !== null}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxPostId(null)}
        showDownloadButton={false}
        accessibilityLabel={lightboxPost ? `${PEOPLE[lightboxPost.person].name} post photos` : 'Post photos'}
      />
    </Block>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <AppScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
