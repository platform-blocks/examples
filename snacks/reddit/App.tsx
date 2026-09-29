import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui-snack';

const C = { orange: '#F65335', ink: '#1A1A1B', muted: '#74787A', line: '#E5E7E9', bg: '#F6F7F8', white: '#FFF', blue: '#2969B1' };
const COMMUNITIES = [
  { id: 'cozyspaces', label: 'Cozy Spaces', emoji: '🛋️', members: '42k', description: 'Small corners, big comfort.' },
  { id: 'askhere', label: 'Ask Here', emoji: '💬', members: '87k', description: 'Curious questions and kind answers.' },
  { id: 'photography', label: 'Photography', emoji: '📷', members: '61k', description: 'The world through your lens.' },
  { id: 'cooking', label: 'Home Cooking', emoji: '🍳', members: '53k', description: 'Everyday food worth sharing.' },
  { id: 'design', label: 'Design', emoji: '✦', members: '35k', description: 'Make, share, and discuss.' },
];
type Post = { id: string; community: string; author: string; title: string; body: string; time: string; votes: number; comments: number; emoji?: string };
type Comment = { id: string; author: string; text: string; time: string };
const INITIAL: Post[] = [
  { id: 'p1', community: 'cozyspaces', author: 'softcorner', title: 'I finally made my tiny reading nook feel like home', body: 'A thrifted chair, a warm lamp, and a stack of books. Sometimes the small changes do the most.', time: '2 hr. ago', votes: 842, comments: 48, emoji: '📚' },
  { id: 'p2', community: 'askhere', author: 'curiousbird', title: 'What is one small habit that made your days better?', body: 'Looking for little ideas that are easy to actually stick with.', time: '3 hr. ago', votes: 526, comments: 132 },
  { id: 'p3', community: 'photography', author: 'bluehour', title: 'Caught the last light on my walk home', body: 'No special camera, just good timing and a little luck.', time: '5 hr. ago', votes: 1204, comments: 73, emoji: '🌅' },
  { id: 'p4', community: 'cooking', author: 'panandspoon', title: 'A one pot dinner I keep coming back to', body: 'Tomatoes, beans, greens, and a lot of lemon. It is flexible, affordable, and even better the next day.', time: '7 hr. ago', votes: 379, comments: 29, emoji: '🍲' },
  { id: 'p5', community: 'design', author: 'marlowmakes', title: 'Sharing a few icons from my latest project', body: 'I wanted them to feel friendly at very small sizes. Feedback welcome!', time: '10 hr. ago', votes: 689, comments: 61, emoji: '🎨' },
  { id: 'p6', community: 'askhere', author: 'justwondering', title: 'What movie do you wish you could watch for the first time again?', body: 'I need something good for a rainy weekend.', time: 'Yesterday', votes: 912, comments: 204 },
];
const STORAGE = 'plocks-reddit-example:v1';
const compact = (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + 'k' : String(value);

function ThreaditScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 950;
  const [posts, setPosts] = useState<Post[]>(INITIAL);
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [saved, setSaved] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>(['cozyspaces', 'design']);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [community, setCommunity] = useState<string | null>(null);
  const [sort, setSort] = useState<'Best' | 'New' | 'Top'>('Best');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCommunity, setNewCommunity] = useState('cozyspaces');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [ready, setReady] = useState(false);
  const active = posts.find((item) => item.id === selected);
  const filtered = posts.filter((item) => (community === '__saved__' ? saved.includes(item.id) : !community || item.community === community) &&
    `${item.title} ${item.body} ${item.community}`.toLowerCase().includes(query.toLowerCase()));
  const shown = [...filtered].sort((a, b) => sort === 'Top' ? (b.votes + (votes[b.id] ?? 0)) - (a.votes + (votes[a.id] ?? 0))
    : sort === 'New' ? posts.indexOf(a) - posts.indexOf(b) : 0);
  const selectedCommunity = COMMUNITIES.find((item) => item.id === community);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { posts?: Post[]; votes?: Record<string, -1 | 0 | 1>; saved?: string[]; joined?: string[]; comments?: Record<string, Comment[]> };
      if (Array.isArray(data.posts)) setPosts(data.posts);
      if (data.votes && typeof data.votes === 'object') setVotes(data.votes);
      if (Array.isArray(data.saved)) setSaved(data.saved);
      if (Array.isArray(data.joined)) setJoined(data.joined);
      if (data.comments && typeof data.comments === 'object') setComments(data.comments);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ posts, votes, saved, joined, comments })).catch(() => {});
  }, [posts, votes, saved, joined, comments, ready]);
  function vote(id: string, direction: -1 | 1) {
    setVotes((old) => ({ ...old, [id]: old[id] === direction ? 0 : direction }));
  }
  function createPost() {
    if (!newTitle.trim() || !newBody.trim()) return;
    const post: Post = { id: `local-${Date.now()}`, community: newCommunity, author: 'you',
      title: newTitle.trim(), body: newBody.trim(), time: 'Just now', votes: 1, comments: 0 };
    setPosts((old) => [post, ...old]); setNewTitle(''); setNewBody(''); setCreating(false); setCommunity(null); setSelected(post.id);
  }
  function addComment() {
    if (!selected || !commentDraft.trim()) return;
    const item: Comment = { id: `comment-${Date.now()}`, author: 'you', text: commentDraft.trim(), time: 'Just now' };
    setComments((old) => ({ ...old, [selected]: [...(old[selected] ?? []), item] }));
    setCommentDraft('');
  }
  const voteBar = (post: Post) => <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F3F5', borderRadius: 18, gap: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
    <Pressable onPress={(event) => { event.stopPropagation(); vote(post.id, 1); }} accessibilityLabel="Upvote"><Icon name="arrowUp" color={votes[post.id] === 1 ? C.orange : C.muted} size={19} /></Pressable>
    <Text c={votes[post.id] ? C.orange : C.ink} fw="bold" size={12}>{compact(post.votes + (votes[post.id] ?? 0))}</Text>
    <Pressable onPress={(event) => { event.stopPropagation(); vote(post.id, -1); }} accessibilityLabel="Downvote"><Icon name="arrowDown" color={votes[post.id] === -1 ? C.blue : C.muted} size={19} /></Pressable>
  </View>;
  const postCard = (post: Post) => {
    const group = COMMUNITIES.find((item) => item.id === post.community)!;
    return <Pressable key={post.id} onPress={() => setSelected(post.id)} accessibilityRole="button" accessibilityLabel={`Open ${post.title}`}
      style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 13, padding: 16, marginBottom: 11, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFE6DF', alignItems: 'center', justifyContent: 'center' }}><Text size={15}>{group.emoji}</Text></View>
        <Text c={C.ink} fw="bold" size={12}>r/{post.community}</Text><Text c={C.muted} size={11}>· u/{post.author} · {post.time}</Text>
      </View>
      <Text c={C.ink} fw="bold" size={19}>{post.title}</Text>
      <Text c={C.ink} size={13} numberOfLines={3} style={{ lineHeight: 20 }}>{post.body}</Text>
      {!!post.emoji && <View style={{ height: 145, borderRadius: 9, backgroundColor: '#F4EEE9', alignItems: 'center', justifyContent: 'center' }}><Text size={72}>{post.emoji}</Text></View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {voteBar(post)}
        <Pressable onPress={(event) => { event.stopPropagation(); setSelected(post.id); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="message" color={C.muted} size={17} /><Text c={C.muted} fw="semibold" size={11}>{post.comments + (comments[post.id]?.length ?? 0)}</Text></Pressable>
        <Pressable onPress={(event) => { event.stopPropagation(); setSaved((old) => old.includes(post.id) ? old.filter((id) => id !== post.id) : [...old, post.id]); }}
          accessibilityLabel={saved.includes(post.id) ? 'Remove saved post' : 'Save post'} style={{ marginLeft: 'auto' }}>
          <Icon name="bookmark" variant={saved.includes(post.id) ? 'filled' : 'outlined'} color={saved.includes(post.id) ? C.orange : C.muted} size={18} /></Pressable>
      </View>
    </Pressable>;
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><StatusBar barStyle="dark-content" />
    <View style={{ height: 60, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row',
      alignItems: 'center', paddingHorizontal: wide ? 25 : 13, gap: 16 }}>
      <Text c={C.orange} fw="bold" size={wide ? 26 : 21}>● threadit</Text>
      <View style={{ flex: 1, maxWidth: 700, backgroundColor: C.bg, borderRadius: 19, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <Icon name="search" color={C.muted} size={18} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search posts" style={{ flex: 1, padding: 10, color: C.ink }} />
      </View>
      {wide && <Button title="Create post" color={C.orange} onPress={() => setCreating(true)} />}
      {!wide && <IconButton icon="plus" variant="filled" color={C.orange} iconColor={C.white} accessibilityLabel="Create post" onPress={() => setCreating(true)} />}
    </View>
    <View style={{ flex: 1, flexDirection: 'row', maxWidth: 1350, alignSelf: 'center', width: '100%' }}>
      {wide && <View style={{ width: 230, padding: 17, borderRightWidth: 1, borderRightColor: C.line, backgroundColor: C.white }}>
        <Pressable onPress={() => setCommunity(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 }}>
          <Icon name="home" color={C.orange} size={20} /><Text c={C.ink} fw={!community ? 'bold' : 'normal'}>Home</Text></Pressable>
        <View style={{ height: 1, backgroundColor: C.line, marginVertical: 12 }} />
        <Text c={C.muted} fw="bold" size={11}>COMMUNITIES</Text>
        {COMMUNITIES.map((item) => <Pressable key={item.id} onPress={() => setCommunity(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
          <Text size={19}>{item.emoji}</Text><Text c={community === item.id ? C.orange : C.ink} fw={community === item.id ? 'bold' : 'normal'} size={13}>r/{item.id}</Text>
        </Pressable>)}
        <View style={{ height: 1, backgroundColor: C.line, marginVertical: 12 }} />
        <Pressable onPress={() => setCommunity('__saved__')}><Text c={C.ink} fw={community === '__saved__' ? 'bold' : 'normal'}>🔖  Saved posts</Text></Pressable>
      </View>}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: wide ? 20 : 12, paddingBottom: 40 }}>
        <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          {!wide && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, marginBottom: 12 }}>
            {[{ id: null, label: 'Home', emoji: '⌂' }, ...COMMUNITIES, { id: '__saved__', label: 'Saved', emoji: '🔖' }].map((item) => <Pressable key={item.id ?? 'home'} onPress={() => setCommunity(item.id)}
              style={{ flexDirection: 'row', gap: 5, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: community === item.id ? '#FFE9E2' : C.white }}>
              <Text c={C.ink} size={12}>{item.emoji} {item.id && item.id !== '__saved__' ? `r/${item.id}` : item.label}</Text></Pressable>)}
          </ScrollView>}
          <Text c={C.ink} fw="bold" size={25} style={{ marginBottom: 13 }}>{community === '__saved__' ? 'Saved posts' : selectedCommunity ? `r/${selectedCommunity.id}` : 'Your feed'}</Text>
          {selectedCommunity && <View style={{ backgroundColor: C.white, borderRadius: 11, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Text size={31}>{selectedCommunity.emoji}</Text><View style={{ flex: 1 }}><Text c={C.ink} fw="bold">{selectedCommunity.label}</Text>
              <Text c={C.muted} size={11}>{selectedCommunity.description} · {selectedCommunity.members} members</Text></View>
            <Button title={joined.includes(selectedCommunity.id) ? 'Joined' : 'Join'} variant={joined.includes(selectedCommunity.id) ? 'outline' : 'filled'}
              color={C.orange} size="sm" onPress={() => setJoined((old) => old.includes(selectedCommunity.id) ? old.filter((id) => id !== selectedCommunity.id) : [...old, selectedCommunity.id])} />
          </View>}
          <View style={{ backgroundColor: C.white, borderRadius: 11, borderWidth: 1, borderColor: C.line, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8C7B8', alignItems: 'center', justifyContent: 'center' }}><Text c={C.white} fw="bold">Y</Text></View>
            <Pressable onPress={() => setCreating(true)} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 16, padding: 9 }}><Text c={C.muted} size={12}>Create a post</Text></Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {(['Best', 'New', 'Top'] as const).map((item) => <Pressable key={item} onPress={() => setSort(item)}
              style={{ backgroundColor: sort === item ? '#FFE9E2' : C.white, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 17 }}>
              <Text c={sort === item ? C.orange : C.muted} fw="bold" size={12}>{item}</Text></Pressable>)}
          </View>
          {shown.map(postCard)}
          {community === '__saved__' && saved.length === 0 && <Text c={C.muted}>Saved posts will show up here.</Text>}
          {!shown.length && community !== '__saved__' && <Text c={C.muted}>No posts found.</Text>}
        </View>
      </ScrollView>
      {wide && <View style={{ width: 275, padding: 17 }}>
        <View style={{ backgroundColor: C.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.line }}>
          <View style={{ backgroundColor: C.orange, padding: 15 }}><Text c={C.white} fw="bold">Home</Text></View>
          <View style={{ padding: 15, gap: 12 }}><Text c={C.ink} size={13}>A place to catch up with communities and find good conversations.</Text>
            <Button title="Create post" color={C.orange} fullWidth onPress={() => setCreating(true)} /></View>
        </View>
        <Text c={C.muted} size={11} style={{ padding: 10 }}>Local discussion demo · no public posts</Text>
      </View>}
    </View>
    {(!!active || creating) && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#171717AA', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
      <View style={{ width: '100%', maxWidth: 700, maxHeight: '92%', backgroundColor: C.white, borderRadius: 14, overflow: 'hidden' }}>
        <View style={{ padding: 13, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text c={C.ink} fw="bold" size={17}>{creating ? 'Create a post' : `r/${active?.community}`}</Text>
          <IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Close" onPress={() => { setSelected(null); setCreating(false); }} />
        </View>
        {creating ? <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
          <Text c={C.muted} size={12}>Choose a community</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
            {COMMUNITIES.map((item) => <Pressable key={item.id} onPress={() => setNewCommunity(item.id)}
              style={{ backgroundColor: newCommunity === item.id ? '#FFE8DF' : C.bg, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text c={newCommunity === item.id ? C.orange : C.ink} size={12}>{item.emoji} r/{item.id}</Text></Pressable>)}
          </ScrollView>
          <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="An interesting title" style={{ borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 12, color: C.ink }} />
          <TextInput value={newBody} onChangeText={setNewBody} multiline placeholder="What is on your mind?"
            style={{ minHeight: 130, textAlignVertical: 'top', borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 12, color: C.ink }} />
          <Button title="Post locally" color={C.orange} disabled={!newTitle.trim() || !newBody.trim()} onPress={createPost} />
          <Text c={C.muted} size={11}>This example saves posts on your device only.</Text>
        </ScrollView> : active && <ScrollView contentContainerStyle={{ padding: 20, gap: 15 }}>
          <Text c={C.muted} size={12}>u/{active.author} · {active.time}</Text>
          <Text c={C.ink} fw="bold" size={24}>{active.title}</Text>
          <Text c={C.ink} size={15} style={{ lineHeight: 23 }}>{active.body}</Text>
          {!!active.emoji && <View style={{ height: 150, borderRadius: 8, backgroundColor: '#F4EEE9', alignItems: 'center', justifyContent: 'center' }}><Text size={85}>{active.emoji}</Text></View>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{voteBar(active)}
            <Text c={C.muted} size={12}>{active.comments + (comments[active.id]?.length ?? 0)} comments</Text></View>
          <View style={{ height: 1, backgroundColor: C.line }} />
          <Text c={C.ink} fw="bold" size={16}>Join the conversation</Text>
          <TextInput value={commentDraft} onChangeText={setCommentDraft} multiline placeholder="Write a comment"
            style={{ minHeight: 68, textAlignVertical: 'top', borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 10, color: C.ink }} />
          <View style={{ alignSelf: 'flex-end' }}><Button title="Comment" color={C.orange} disabled={!commentDraft.trim()} onPress={addComment} /></View>
          {(comments[active.id] ?? []).map((item) => <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 13, gap: 5 }}>
            <Text c={C.muted} fw="bold" size={11}>u/{item.author} · {item.time}</Text><Text c={C.ink} size={13}>{item.text}</Text></View>)}
          {!comments[active.id]?.length && <Text c={C.muted} size={12}>Be the first to add a local comment.</Text>}
        </ScrollView>}
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><ThreaditScreen /></PlocksProvider></SafeAreaProvider>;
}
