import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui-snack';

const C = { ink: '#171717', muted: '#777', line: '#E8E8E8', blue: '#0095F6', white: '#FFF', blush: '#FCEDF2' };
const PHOTOS = [
  require('./assets/scene-lake.webp'), require('./assets/scene-city.webp'),
  require('./assets/scene-desert.webp'), require('./assets/scene-forest.webp'),
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
  { id: 'lake', person: 0, image: 0, place: 'Lake Crescent', caption: 'Some mornings deserve a little pause. 🌿', likes: 1248, time: '2 HOURS AGO' },
  { id: 'city', person: 1, image: 1, place: 'New York City', caption: 'A city that never runs out of stories.', likes: 842, time: '8 HOURS AGO' },
  { id: 'desert', person: 2, image: 2, place: 'Arizona', caption: 'Golden hour, every hour.', likes: 2315, time: 'YESTERDAY' },
  { id: 'forest', person: 3, image: 3, place: 'Somewhere green', caption: 'The long way home is the best way home.', likes: 651, time: '2 DAYS AGO' },
  { id: 'ocean', person: 4, image: 4, place: 'Pacific Coast', caption: 'Out of office for a moment. 🌊', likes: 1094, time: '3 DAYS AGO' },
];
type Post = typeof INITIAL_POSTS[number];
type Tab = 'home' | 'explore' | 'profile';
const STORAGE = 'plocks-instagram-example:v1';

function Person({ index, size = 36, ring = false }: { index: number; size?: number; ring?: boolean }) {
  const person = PEOPLE[index];
  return <View style={{ padding: ring ? 3 : 0, borderRadius: size, borderWidth: ring ? 2 : 0, borderColor: '#CF407A' }}>
    <Avatar size={size >= 55 ? 'lg' : 'md'} fallback={person.initials} bg={person.color} textColor="#fff"
      accessibilityLabel={person.name} />
  </View>;
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
  const [story, setStory] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { liked?: string[]; saved?: string[]; comments?: Record<string, string[]>; posts?: Post[] };
      if (Array.isArray(data.liked)) setLiked(data.liked);
      if (Array.isArray(data.saved)) setSaved(data.saved);
      if (data.comments && typeof data.comments === 'object') setComments(data.comments);
      if (Array.isArray(data.posts)) setPosts(data.posts);
    }).catch(() => {}).finally(() => setReady(true));
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
    const post: Post = { id: `mine-${Date.now()}`, person: 0, image: 0, place: 'From my gallery', caption: newCaption.trim(), likes: 0, time: 'JUST NOW' };
    setPosts((current) => [post, ...current]);
    setNewCaption('');
    setCreating(false);
    setTab('home');
  };
  const PostCard = ({ post }: { post: Post }) => {
    const person = PEOPLE[post.person];
    return <View style={{ backgroundColor: C.white, marginBottom: 26, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
        <Person index={post.person} ring />
        <View style={{ flex: 1 }}><Text fw="bold" c={C.ink} size={13}>{person.name}</Text><Text c={C.muted} size={11}>{post.place}</Text></View>
        <Icon name="dots" size={20} color={C.ink} />
      </View>
      <Image source={PHOTOS[post.image]} resizeMode="cover" style={{ width: '100%', aspectRatio: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, gap: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={liked.includes(post.id) ? 'Unlike post' : 'Like post'}
          onPress={() => toggle(post.id, liked, setLiked)}><Icon name="heart" variant={liked.includes(post.id) ? 'filled' : 'outlined'}
            color={liked.includes(post.id) ? '#E53559' : C.ink} size={27} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="View comments" onPress={() => setSelected(post.id)}>
          <Icon name="message" color={C.ink} size={27} /></Pressable>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel={saved.includes(post.id) ? 'Remove saved post' : 'Save post'}
          onPress={() => toggle(post.id, saved, setSaved)}><Icon name="bookmark" variant={saved.includes(post.id) ? 'filled' : 'outlined'}
            color={C.ink} size={27} /></Pressable>
      </View>
      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 17, gap: 5 }}>
        <Text fw="bold" c={C.ink} size={13}>{(post.likes + Number(liked.includes(post.id))).toLocaleString()} likes</Text>
        <Text c={C.ink} size={13}><Text fw="bold" c={C.ink}>{person.name} </Text>{post.caption}</Text>
        <Pressable onPress={() => setSelected(post.id)}><Text c={C.muted} size={13}>View comments{(comments[post.id]?.length ?? 0) > 0 ? ` (${comments[post.id].length})` : ''}</Text></Pressable>
        <Text c={C.muted} size={10}>{post.time}</Text>
      </View>
    </View>;
  };
  const activePost = posts.find((post) => post.id === selected);

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}><StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', maxWidth: 1260, width: '100%', alignSelf: 'center' }}>
      {wide && <View style={{ width: 230, borderRightWidth: 1, borderRightColor: C.line, padding: 22, gap: 30 }}>
        <Text fw="bold" c={C.ink} size={29} style={{ fontStyle: 'italic' }}>frame</Text>
        {(['home', 'explore', 'profile'] as const).map((item) => <Pressable key={item} onPress={() => { setTab(item); setSelected(null); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 17, paddingVertical: 8 }}>
          <Icon name={item === 'home' ? 'home' : item === 'explore' ? 'search' : 'avatar'} size={25}
            variant={tab === item ? 'filled' : 'outlined'} color={C.ink} />
          <Text c={C.ink} fw={tab === item ? 'bold' : 'normal'} size={16}>{item[0].toUpperCase() + item.slice(1)}</Text>
        </Pressable>)}
        <Button title="Create post" color={C.blue} onPress={() => setCreating(true)} />
      </View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        {!wide && <View style={{ height: 57, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 }}>
          <Text fw="bold" c={C.ink} size={27} style={{ fontStyle: 'italic' }}>frame</Text>
          <IconButton icon="plus" variant="ghost" iconColor={C.ink} accessibilityLabel="Create post" onPress={() => setCreating(true)} />
        </View>}
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 30 }}>
          <View style={{ width: '100%', maxWidth: tab === 'explore' ? 800 : 560 }}>
            {tab === 'home' && <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 17, paddingHorizontal: 16, paddingVertical: 18 }}>
                {PEOPLE.map((person, index) => <Pressable key={person.name} onPress={() => setStory(index)} style={{ alignItems: 'center', gap: 5, width: 70 }}>
                  <Person index={index} size={60} ring /><Text c={C.ink} size={10} numberOfLines={1}>{person.name}</Text>
                </Pressable>)}
              </ScrollView>
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </>}
            {tab === 'explore' && <View style={{ padding: 12 }}>
              <View style={{ backgroundColor: '#F3F3F3', borderRadius: 10, paddingHorizontal: 14, height: 42, justifyContent: 'center' }}>
                <TextInput value={query} onChangeText={setQuery} placeholder="Search people and places" placeholderTextColor={C.muted} style={{ color: C.ink, fontSize: 14, outlineStyle: 'none' } as never} />
              </View>
              <Text fw="bold" c={C.ink} size={20} style={{ marginVertical: 18 }}>Explore</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                {posts.filter((post) => `${PEOPLE[post.person].name} ${post.place} ${post.caption}`.toLowerCase().includes(query.toLowerCase()))
                  .map((post) => <Pressable key={post.id} onPress={() => { setTab('home'); setSelected(post.id); }}
                    style={{ width: '32.8%', aspectRatio: 1 }}><Image source={PHOTOS[post.image]} style={{ width: '100%', height: '100%' }} /></Pressable>)}
              </View>
            </View>}
            {tab === 'profile' && <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22, marginVertical: 16 }}>
                <Person index={0} size={70} /><View style={{ flex: 1 }}>
                  <Text fw="bold" c={C.ink} size={21}>mila.roams</Text><Text c={C.muted} size={13}>Collecting little moments.</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }}>
                {[['5', 'posts'], ['1.2k', 'followers'], ['389', 'following']].map(([value, label]) => <View key={label} style={{ alignItems: 'center' }}>
                  <Text fw="bold" c={C.ink}>{value}</Text><Text c={C.muted} size={12}>{label}</Text>
                </View>)}
              </View>
              <Text fw="bold" c={C.ink} size={14} style={{ marginVertical: 17 }}>Saved & shared moments</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                {posts.filter((post) => saved.includes(post.id) || post.person === 0).map((post) => <Pressable key={post.id}
                  onPress={() => { setTab('home'); setSelected(post.id); }} style={{ width: '32.8%', aspectRatio: 1 }}>
                  <Image source={PHOTOS[post.image]} style={{ width: '100%', height: '100%' }} />
                </Pressable>)}
              </View>
            </View>}
          </View>
        </ScrollView>
        {!wide && <View style={{ height: 57, borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          {(['home', 'explore', 'profile'] as const).map((item) => <Pressable key={item} onPress={() => setTab(item)}
            accessibilityRole="tab" accessibilityState={{ selected: tab === item }} accessibilityLabel={item}>
            <Icon name={item === 'home' ? 'home' : item === 'explore' ? 'search' : 'avatar'} size={26}
              variant={tab === item ? 'filled' : 'outlined'} color={C.ink} />
          </Pressable>)}
        </View>}
      </View>
    </View>
    {(activePost || story !== null || creating) && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#0009', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
      <View style={{ width: '100%', maxWidth: 520, maxHeight: '90%', backgroundColor: C.white, borderRadius: 15, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text fw="bold" c={C.ink} size={16}>{creating ? 'New post' : story !== null ? PEOPLE[story].name : 'Comments'}</Text>
          <IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Close" onPress={() => { setSelected(null); setStory(null); setCreating(false); }} />
        </View>
        {creating ? <View style={{ padding: 18, gap: 14 }}>
          <Image source={PHOTOS[0]} style={{ width: '100%', height: 180, borderRadius: 8 }} />
          <Text c={C.muted} size={12}>Using a demo gallery photo</Text>
          <TextInput value={newCaption} onChangeText={setNewCaption} placeholder="Write a caption..." multiline
            style={{ minHeight: 80, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 12, color: C.ink }} />
          <Button title="Share post" color={C.blue} onPress={createPost} disabled={!newCaption.trim()} />
        </View> : story !== null ? <View style={{ backgroundColor: C.blush, padding: 24, minHeight: 270, justifyContent: 'center' }}>
          <Text c={C.ink} fw="bold" size={30} ta="center">A little moment from {PEOPLE[story].name} ✨</Text>
        </View> : activePost && <>
          <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ padding: 16, gap: 15 }}>
            <Text c={C.ink} size={14}><Text fw="bold" c={C.ink}>{PEOPLE[activePost.person].name} </Text>{activePost.caption}</Text>
            {(comments[activePost.id] ?? []).map((comment, index) => <Text key={index} c={C.ink} size={14}><Text fw="bold" c={C.ink}>you </Text>{comment}</Text>)}
          </ScrollView>
          <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: C.line, alignItems: 'center', gap: 10 }}>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Add a comment..." onSubmitEditing={submitComment}
              style={{ flex: 1, color: C.ink, padding: 8 }} />
            <Pressable onPress={submitComment}><Text fw="bold" c={C.blue}>Post</Text></Pressable>
          </View>
        </>}
      </View>
    </View>}
  </SafeAreaView>;
}

export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><AppScreen /></PlocksProvider></SafeAreaProvider>;
}
