import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  TextArea,
  Input,
  ScrollArea,
  SafeArea,
  Image,
  Lightbox,
  Block,
  Avatar,
  Button,
  Dialog,
  Icon,
  IconButton,
  PlocksProvider,
  Tabs,
  Text,
} from '@plocks/ui';
import type { LightboxItem } from '@plocks/ui';
import { Carousel } from '@plocks/carousel';

const C = { ink: '#171717', muted: '#777', line: '#E8E8E8', blue: '#0095F6', white: '#FFF', blush: '#FCEDF2' };
const PHOTOS = [
  require('./assets/scene-lake.webp'),
  require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'),
  require('./assets/scene-forest.webp'),
  require('./assets/scene-ocean.webp'),
];
const PEOPLE = [
  { name: 'mila.roams', initials: 'MR', color: '#D57F6A' },
  { name: 'the.weekend.edit', initials: 'WE', color: '#8B87B6' },
  { name: 'kai.and.co', initials: 'KC', color: '#4F9BA0' },
  { name: 'jo.studio', initials: 'JS', color: '#B88E5B' },
  { name: 'sara.outside', initials: 'SO', color: '#789C69' },
];
const INITIAL_POSTS = [
  {
    id: 'lake',
    person: 0,
    image: 0,
    place: 'Lake Crescent',
    caption: 'Some mornings deserve a little pause. 🌿',
    likes: 1248,
    time: '2 HOURS AGO',
  },
  {
    id: 'city',
    person: 1,
    image: 1,
    place: 'New York City',
    caption: 'A city that never runs out of stories.',
    likes: 842,
    time: '8 HOURS AGO',
  },
  {
    id: 'desert',
    person: 2,
    image: 2,
    place: 'Arizona',
    caption: 'Golden hour, every hour.',
    likes: 2315,
    time: 'YESTERDAY',
  },
  {
    id: 'forest',
    person: 3,
    image: 3,
    place: 'Somewhere green',
    caption: 'The long way home is the best way home.',
    likes: 651,
    time: '2 DAYS AGO',
  },
  {
    id: 'ocean',
    person: 4,
    image: 4,
    place: 'Pacific Coast',
    caption: 'Out of office for a moment. 🌊',
    likes: 1094,
    time: '3 DAYS AGO',
  },
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
type Tab = 'home' | 'explore' | 'profile';
const STORAGE = 'plocks-frameleaf-example:v1';

function Person({ index, size = 36, ring = false }: { index: number; size?: number; ring?: boolean }) {
  const person = PEOPLE[index];
  return (
    <Block gap={0} p={ring ? 3 : 0} radius={size} borderWidth={ring ? 2 : 0} borderColor="#CF407A">
      <Avatar
        size={size >= 55 ? 'lg' : 'md'}
        fallback={person.initials}
        bg={person.color}
        textColor="#fff"
        accessibilityLabel={person.name}
      />
    </Block>
  );
}

function AppScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>('home');
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [lightboxPostId, setLightboxPostId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [story, setStory] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);

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

  const toggle = (id: string, values: string[], setValues: (value: string[]) => void) =>
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
      person: 0,
      image: 0,
      place: 'From my gallery',
      caption: newCaption.trim(),
      likes: 0,
      time: 'JUST NOW',
    };
    setPosts((current) => [post, ...current]);
    setNewCaption('');
    setCreating(false);
    setTab('home');
  };
  const openLightbox = (post: Post, index: number) => {
    setLightboxPostId(post.id);
    setLightboxIndex(index);
  };
  const renderPostCard = (post: Post) => {
    const person = PEOPLE[post.person];
    const photos = postPhotos(post);
    return (
      <Block key={post.id} gap={0} bg={C.white} mb={26} borderBottomWidth={1} borderBottomColor={C.line}>
        <Block direction="row" align="center" gap={10} p={12}>
          <Person index={post.person} ring />
          <Block gap={0} flex={1}>
            <Text fw="bold" c={C.ink} size={13}>
              {person.name}
            </Text>
            <Text c={C.muted} size={11}>
              {post.place}
            </Text>
          </Block>
          <Icon name="dots" size={20} color={C.ink} />
        </Block>
        {photos.length > 1 ? (
          <Carousel
            h={Math.min(width, 560)}
            showArrows
            showDots
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
            aspectRatio={1}
            overflow="hidden"
          >
            <Image source={PHOTOS[photos[0]]} resizeMode="cover" w="100%" h="100%" alt="" />
          </Block>
        )}
        <Block direction="row" align="center" px={12} pt={12} gap={16}>
          <Block
            gap={0}
            accessibilityRole="button"
            accessibilityLabel={liked.includes(post.id) ? 'Unlike post' : 'Like post'}
            onPress={() => toggle(post.id, liked, setLiked)}
          >
            <Icon
              name="heart"
              variant={liked.includes(post.id) ? 'filled' : 'outlined'}
              color={liked.includes(post.id) ? '#E53559' : C.ink}
              size={27}
            />
          </Block>
          <Block
            gap={0}
            accessibilityRole="button"
            accessibilityLabel="View comments"
            onPress={() => setSelected(post.id)}
          >
            <Icon name="message" color={C.ink} size={27} />
          </Block>
          <Block gap={0} flex={1} />
          <Block
            gap={0}
            accessibilityRole="button"
            accessibilityLabel={saved.includes(post.id) ? 'Remove saved post' : 'Save post'}
            onPress={() => toggle(post.id, saved, setSaved)}
          >
            <Icon name="bookmark" variant={saved.includes(post.id) ? 'filled' : 'outlined'} color={C.ink} size={27} />
          </Block>
        </Block>
        <Block px={12} pt={10} pb={17} gap={5}>
          <Text fw="bold" c={C.ink} size={13}>
            {(post.likes + Number(liked.includes(post.id))).toLocaleString()} likes
          </Text>
          <Text c={C.ink} size={13}>
            <Text fw="bold" c={C.ink}>
              {person.name}{' '}
            </Text>
            {post.caption}
          </Text>
          <Block gap={0} onPress={() => setSelected(post.id)}>
            <Text c={C.muted} size={13}>
              View comments{(comments[post.id]?.length ?? 0) > 0 ? ` (${comments[post.id].length})` : ''}
            </Text>
          </Block>
          <Text c={C.muted} size={10}>
            {post.time}
          </Text>
        </Block>
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

  return (
    <SafeArea gap={0} flex={1} bg={C.white}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} maw={1260} w="100%" alignSelf="center">
        {wide && (
          <Block w={230} borderRightWidth={1} borderRightColor={C.line} p={22} gap={30}>
            <Text fw="bold" c={C.ink} size={29} fs="italic">
              frame
            </Text>
            <Tabs
              navigationOnly
              orientation="vertical"
              variant="chip"
              color={C.blue}
              value={tab}
              onChange={(item) => {
                setTab(item as Tab);
                setSelected(null);
              }}
              items={(['home', 'explore', 'profile'] as const).map((item) => ({
                key: item,
                label: item[0].toUpperCase() + item.slice(1),
                icon: (
                  <Icon
                    name={item === 'home' ? 'home' : item === 'explore' ? 'search' : 'avatar'}
                    size={25}
                    color={tab === item ? C.white : C.ink}
                  />
                ),
                content: null,
              }))}
            />
            <Button title="Create post" color={C.blue} onPress={() => setCreating(true)} />
          </Block>
        )}
        <Block gap={0} flex={1} miw={0}>
          {!wide && (
            <Block
              gap={0}
              h={57}
              borderBottomWidth={1}
              borderBottomColor={C.line}
              direction="row"
              align="center"
              justify="space-between"
              px={17}
            >
              <Text fw="bold" c={C.ink} size={27} fs="italic">
                frame
              </Text>
              <IconButton
                icon="plus"
                variant="ghost"
                iconColor={C.ink}
                accessibilityLabel="Create post"
                onPress={() => setCreating(true)}
              />
            </Block>
          )}
          <ScrollArea keyboardShouldPersistTaps="handled" flex={1} contentProps={{ align: 'center', pb: 30 }}>
            <Block gap={0} w="100%" maw={tab === 'explore' ? 800 : 560}>
              {tab === 'home' && (
                <>
                  <ScrollArea
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentProps={{ gap: 17, px: 16, py: 18 }}
                  >
                    {PEOPLE.map((person, index) => (
                      <Block key={person.name} onPress={() => setStory(index)} align="center" gap={5} w={70}>
                        <Person index={index} size={60} ring />
                        <Text c={C.ink} size={10} numberOfLines={1}>
                          {person.name}
                        </Text>
                      </Block>
                    ))}
                  </ScrollArea>
                  {posts.map(renderPostCard)}
                </>
              )}
              {tab === 'explore' && (
                <Block gap={0} p={12}>
                  <Block gap={0} bg="#F3F3F3" radius={10} px={14} h={42} justify="center">
                    <Input
                      variant="unstyled"
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Search people and places"
                      placeholderTextColor={C.muted}
                      mb={0}
                    />
                  </Block>
                  <Text fw="bold" c={C.ink} size={20} my={18}>
                    Explore
                  </Text>
                  <Block direction="row" wrap="wrap" gap={3}>
                    {posts
                      .filter((post) =>
                        `${PEOPLE[post.person].name} ${post.place} ${post.caption}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((post) => (
                        <Block
                          gap={0}
                          key={post.id}
                          onPress={() => {
                            setTab('home');
                            setSelected(post.id);
                          }}
                          w="32.8%"
                          aspectRatio={1}
                        >
                          <Image source={PHOTOS[post.image]} w="100%" h="100%" />
                        </Block>
                      ))}
                  </Block>
                </Block>
              )}
              {tab === 'profile' && (
                <Block gap={0} p={18}>
                  <Block direction="row" align="center" gap={22} my={16}>
                    <Person index={0} size={70} />
                    <Block gap={0} flex={1}>
                      <Text fw="bold" c={C.ink} size={21}>
                        mila.roams
                      </Text>
                      <Text c={C.muted} size={13}>
                        Collecting little moments.
                      </Text>
                    </Block>
                  </Block>
                  <Block
                    gap={0}
                    direction="row"
                    justify="space-around"
                    py={16}
                    borderTopWidth={1}
                    borderBottomWidth={1}
                    borderColor={C.line}
                  >
                    {[
                      ['5', 'posts'],
                      ['1.2k', 'followers'],
                      ['389', 'following'],
                    ].map(([value, label]) => (
                      <Block gap={0} key={label} align="center">
                        <Text fw="bold" c={C.ink}>
                          {value}
                        </Text>
                        <Text c={C.muted} size={12}>
                          {label}
                        </Text>
                      </Block>
                    ))}
                  </Block>
                  <Text fw="bold" c={C.ink} size={14} my={17}>
                    Saved & shared moments
                  </Text>
                  <Block direction="row" wrap="wrap" gap={3}>
                    {posts
                      .filter((post) => saved.includes(post.id) || post.person === 0)
                      .map((post) => (
                        <Block
                          gap={0}
                          key={post.id}
                          onPress={() => {
                            setTab('home');
                            setSelected(post.id);
                          }}
                          w="32.8%"
                          aspectRatio={1}
                        >
                          <Image source={PHOTOS[post.image]} w="100%" h="100%" />
                        </Block>
                      ))}
                  </Block>
                </Block>
              )}
            </Block>
          </ScrollArea>
          {!wide && (
            <Block
              gap={0}
              h={57}
              borderTopWidth={1}
              borderTopColor={C.line}
              direction="row"
              justify="space-around"
              align="center"
            >
              <Tabs
                navigationOnly
                value={tab}
                onChange={(item) => setTab(item as Tab)}
                color={C.ink}
                tabStyle={{ flex: 1 }}
                items={(['home', 'explore', 'profile'] as const).map((item) => ({
                  key: item,
                  label: '',
                  accessibilityLabel: item,
                  icon: <Icon name={item === 'home' ? 'home' : item === 'explore' ? 'search' : 'avatar'} size={26} color={C.ink} />,
                  content: null,
                }))}
              />
            </Block>
          )}
        </Block>
      </Block>
      {(activePost || story !== null || creating) && (
        <Dialog opened accessibilityLabel={creating ? 'New post' : story !== null ? `${PEOPLE[story].name} story` : 'Comments'} onClose={() => {
          setSelected(null);
          setStory(null);
          setCreating(false);
        }}>
          <Block gap={0}>
            <Block
              gap={0}
              direction="row"
              justify="space-between"
              align="center"
              px={16}
              py={10}
              borderBottomWidth={1}
              borderBottomColor={C.line}
            >
              <Text fw="bold" c={C.ink} size={16}>
                {creating ? 'New post' : story !== null ? PEOPLE[story].name : 'Comments'}
              </Text>
              <IconButton
                icon="x"
                variant="ghost"
                iconColor={C.ink}
                accessibilityLabel="Close"
                onPress={() => {
                  setSelected(null);
                  setStory(null);
                  setCreating(false);
                }}
              />
            </Block>
            {creating ? (
              <Block p={18} gap={14}>
                <Image source={PHOTOS[0]} w="100%" h={180} radius={8} />
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
                <Button title="Share post" color={C.blue} onPress={createPost} disabled={!newCaption.trim()} />
              </Block>
            ) : story !== null ? (
              <Block gap={0} bg={C.blush} p={24} mih={270} justify="center">
                <Text c={C.ink} fw="bold" size={30} ta="center">
                  A little moment from {PEOPLE[story].name} ✨
                </Text>
              </Block>
            ) : (
              activePost && (
                <>
                  <ScrollArea mah={300} contentProps={{ p: 16, gap: 15 }}>
                    <Text c={C.ink} size={14}>
                      <Text fw="bold" c={C.ink}>
                        {PEOPLE[activePost.person].name}{' '}
                      </Text>
                      {activePost.caption}
                    </Text>
                    {(comments[activePost.id] ?? []).map((comment, index) => (
                      <Text key={index} c={C.ink} size={14}>
                        <Text fw="bold" c={C.ink}>
                          you{' '}
                        </Text>
                        {comment}
                      </Text>
                    ))}
                  </ScrollArea>
                  <Block direction="row" p={12} borderTopWidth={1} borderTopColor={C.line} align="center" gap={10}>
                    <Input
                      variant="unstyled"
                      value={draft}
                      onChangeText={setDraft}
                      placeholder="Add a comment..."
                      onEnter={submitComment}
                      mb={0}
                      flex={1}
                      inputColor={C.ink}
                    />
                    <Block gap={0} onPress={submitComment}>
                      <Text fw="bold" c={C.blue}>
                        Post
                      </Text>
                    </Block>
                  </Block>
                </>
              )
            )}
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
    </SafeArea>
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
