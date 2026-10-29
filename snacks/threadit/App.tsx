import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BackHandler, Platform, Share, StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  IconArrowBigDown,
  IconArrowBigDownFilled,
  IconArrowBigUp,
  IconArrowBigUpFilled,
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBookmark,
  IconBookmarkFilled,
  IconCake,
  IconChevronDown,
  IconCirclePlus,
  IconDots,
  IconFlame,
  IconHome,
  IconMessageCircle,
  IconPlus,
  IconSearch,
  IconShare3,
  IconSparkles,
  IconTrendingUp,
  IconUserCircle,
  IconUsersGroup,
  IconX,
} from '@tabler/icons-react-native';
import {
  BottomAppBar,
  Block,
  Button,
  IconButton,
  Input,
  KeyboardAvoidingArea,
  Menu,
  MenuDropdown,
  MenuItem,
  PlocksProvider,
  SafeArea,
  ScrollArea,
  SegmentedControl,
  Text,
  TextArea,
} from '@plocks/ui-snack';
import { COMMENTS, COMMUNITIES, NOTICES, POSTS, type Comment, type Community, type Post } from './data';

const C = {
  orange: '#F65335',
  down: '#6A5CFF',
  ink: '#1A1A1B',
  muted: '#6F7477',
  line: '#E5E7E9',
  chip: '#EEF0F2',
  bg: '#F3F4F6',
  white: '#FFF',
  blue: '#2969B1',
  green: '#2DB357',
};
const RAILS = ['#D5D8DC', '#C9D7F2', '#F2D3C9', '#CFEBD6', '#E6D3F2', '#F2E8C4'];
const AVATARS = ['#F65335', '#2969B1', '#1F9E89', '#7A5AF8', '#D9473B', '#C2410C', '#3E9B4F', '#334FB4'];
const IMAGE_TILES = [
  { emoji: '📸', bg: '#E2E6EA' },
  { emoji: '🌄', bg: '#FAD7B5' },
  { emoji: '🍜', bg: '#F8DCCF' },
  { emoji: '🌱', bg: '#D6EFD9' },
  { emoji: '🎲', bg: '#FBE0CE' },
  { emoji: '🌌', bg: '#D9DFF7' },
  { emoji: '🧶', bg: '#F4E3D3' },
  { emoji: '🖌️', bg: '#D5F0EA' },
];
const STORAGE = 'plocks-threadit-example:v2';
type Vote = -1 | 0 | 1;
type Sort = 'Hot' | 'New' | 'Top';
type CommentSort = 'Best' | 'Top' | 'New';
type Tab = 'home' | 'communities' | 'inbox' | 'profile';
type Route =
  | { name: 'post'; id: string; focus?: string }
  | { name: 'community'; id: string }
  | { name: 'create'; community?: string }
  | { name: 'search' };

const compact = (value: number) =>
  Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(value);
const since = (ts: number) => {
  const minutes = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 43200) return `${Math.floor(minutes / 1440)}d`;
  return `${Math.floor(minutes / 43200)}mo`;
};
const communityOf = (id: string) => COMMUNITIES.find((item) => item.id === id) ?? COMMUNITIES[0];
const hue = (name: string) => AVATARS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATARS.length];
const stop = (event: { stopPropagation?: () => void }) => event.stopPropagation?.();

type AppState = ReturnType<typeof useThreadit>;
const AppContext = createContext<AppState | null>(null);
const useApp = () => useContext(AppContext)!;

function useThreadit() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [saved, setSaved] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>(['cozyspaces', 'askhere', 'plantparents', 'curiouscosmos']);
  const [hidden, setHidden] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [feed, setFeed] = useState<'home' | 'popular'>('home');
  const [stack, setStack] = useState<Route[]>([]);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const posts = useMemo(
    () => [...localPosts, ...POSTS].filter((post) => !hidden.includes(post.id)),
    [localPosts, hidden],
  );
  const comments = useMemo(() => [...COMMENTS, ...localComments], [localComments]);
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    comments.forEach((item) => (result[item.postId] = (result[item.postId] ?? 0) + 1));
    return result;
  }, [comments]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Array.isArray(data.posts)) setLocalPosts(data.posts);
        if (Array.isArray(data.comments)) setLocalComments(data.comments);
        if (data.votes && typeof data.votes === 'object') setVotes(data.votes);
        if (Array.isArray(data.saved)) setSaved(data.saved);
        if (Array.isArray(data.joined)) setJoined(data.joined);
        if (Array.isArray(data.hidden)) setHidden(data.hidden);
        if (Array.isArray(data.read)) setRead(data.read);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    const data = { posts: localPosts, comments: localComments, votes, saved, joined, hidden, read };
    AsyncStorage.setItem(STORAGE, JSON.stringify(data)).catch(() => {});
  }, [localPosts, localComments, votes, saved, joined, hidden, read, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub =BackHandler.addEventListener('hardwareBackPress', () => {
      if (!stack.length) return false;
      setStack((old) => old.slice(0, -1));
      return true;
    });
    return () => sub.remove();
  }, [stack.length]);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  return {
    wide,
    posts,
    comments,
    counts,
    votes,
    saved,
    joined,
    read,
    tab,
    feed,
    setFeed,
    route: stack[stack.length - 1] as Route | undefined,
    toast,
    flash: setToast,
    score: (id: string, base: number) => base + (votes[id] ?? 0),
    vote: (id: string, dir: 1 | -1) => setVotes((old) => ({ ...old, [id]: old[id] === dir ? 0 : dir })),
    toggleSave: (id: string) => {
      setToast(saved.includes(id) ? 'Removed from saved' : 'Saved');
      setSaved((old) => toggle(old, id));
    },
    toggleJoin: (id: string) => {
      setToast(joined.includes(id) ? `Left t/${id}` : `Joined t/${id}`);
      setJoined((old) => toggle(old, id));
    },
    hide: (id: string) => {
      setHidden((old) => [...old, id]);
      setStack((old) => old.filter((item) => !(item.name === 'post' && item.id === id)));
      setToast('Post hidden');
    },
    markRead: (ids: string[]) => setRead((old) => [...new Set([...old, ...ids])]),
    push: (route: Route) => setStack((old) => [...old, route]),
    replace: (route: Route) => setStack((old) => [...old.slice(0, -1), route]),
    pop: () => setStack((old) => old.slice(0, -1)),
    go: (next: Tab, nextFeed?: 'home' | 'popular') => {
      setStack([]);
      setTab(next);
      if (nextFeed) setFeed(nextFeed);
    },
    share: (post: Post) => {
      const link = `https://threadit.example/t/${post.community}/${post.id}`;
      if (Platform.OS === 'web') {
        Clipboard.setStringAsync(link)
          .then(() => setToast('Link copied'))
          .catch(() => setToast(link));
      } else Share.share({ message: `${post.title}\n${link}` }).catch(() => {});
    },
    addPost: (post: Omit<Post, 'id' | 'ts' | 'votes' | 'author'>) => {
      const created: Post = { ...post, id: `local-${Date.now()}`, ts: Date.now(), votes: 1, author: 'you' };
      setLocalPosts((old) => [created, ...old]);
      setVotes((old) => ({ ...old, [created.id]: 0 }));
      return created.id;
    },
    addComment: (postId: string, parentId: string | null, text: string) => {
      const created: Comment = { id: `c-${Date.now()}`, postId, parentId, text, author: 'you', ts: Date.now(), votes: 1 };
      setLocalComments((old) => [...old, created]);
      return created.id;
    },
  };
}

const hot = (post: Post, score: number) => score / Math.pow((Date.now() - post.ts) / 3600000 + 2, 1.5);
function sortPosts(list: Post[], sort: Sort, score: AppState['score']) {
  return [...list].sort((a, b) =>
    sort === 'New'
      ? b.ts - a.ts
      : sort === 'Top'
        ? score(b.id, b.votes) - score(a.id, a.votes)
        : hot(b, score(b.id, b.votes)) - hot(a, score(a.id, a.votes)),
  );
}

function CommunityIcon({ community, size = 24 }: { community: Community; size?: number }) {
  return (
    <Block gap={0} w={size} h={size} radius={size / 2} bg={community.color} align="center" justify="center">
      <Text size={size * 0.55}>{community.emoji}</Text>
    </Block>
  );
}

function UserAvatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <Block gap={0} w={size} h={size} radius={size / 2} bg={hue(name)} align="center" justify="center">
      <Text c={C.white} fw="bold" size={size * 0.45}>
        {name[0].toUpperCase()}
      </Text>
    </Block>
  );
}

function VotePill({ id, base, flat }: { id: string; base: number; flat?: boolean }) {
  const { votes, vote, score } = useApp();
  const value = votes[id] ?? 0;
  const tint = flat ? (value === 1 ? C.orange : value === -1 ? C.down : C.muted) : value ? C.white : C.ink;
  return (
    <Block
      direction="row"
      align="center"
      gap={2}
      radius={20}
      px={4}
      bg={flat ? undefined : value === 1 ? C.orange : value === -1 ? C.down : C.chip}
    >
      <Block
        gap={0}
        p={5}
        radius={16}
        onPress={(event) => {
          stop(event);
          vote(id, 1);
        }}
        accessibilityRole="button"
        accessibilityLabel="Upvote"
        accessibilityState={{ selected: value === 1 }}
      >
        {value === 1 ? <IconArrowBigUpFilled size={18} color={tint} /> : <IconArrowBigUp size={18} color={tint} />}
      </Block>
      <Text c={tint} fw="bold" size={12}>
        {compact(score(id, base))}
      </Text>
      <Block
        gap={0}
        p={5}
        radius={16}
        onPress={(event) => {
          stop(event);
          vote(id, -1);
        }}
        accessibilityRole="button"
        accessibilityLabel="Downvote"
        accessibilityState={{ selected: value === -1 }}
      >
        {value === -1 ? (
          <IconArrowBigDownFilled size={18} color={tint} />
        ) : (
          <IconArrowBigDown size={18} color={tint} />
        )}
      </Block>
    </Block>
  );
}

function Pill({ icon, label, onPress, active }: { icon: ReactNode; label?: string; onPress: () => void; active?: boolean }) {
  return (
    <Block
      direction="row"
      align="center"
      gap={6}
      radius={20}
      px={label ? 12 : 9}
      py={7}
      bg={active ? '#FFE6DF' : C.chip}
      onPress={(event) => {
        stop(event);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      {!!label && (
        <Text c={C.ink} fw="semibold" size={12}>
          {label}
        </Text>
      )}
    </Block>
  );
}

function Flair({ label, color }: { label: string; color: string }) {
  return (
    <Block gap={0} alignSelf="flex-start" bg={color + '22'} radius={10} px={8} py={2}>
      <Text c={color} fw="semibold" size={11}>
        {label}
      </Text>
    </Block>
  );
}

function SortMenu<T extends string>({ value, options, onChange, label }: { value: T; options: T[]; onChange: (v: T) => void; label?: string }) {
  return (
    <Menu position="bottom-start">
      <Block direction="row" align="center" gap={4} py={6} px={4} onPress={() => {}} accessibilityRole="button" accessibilityLabel={`Sort by ${value}`}>
        {value === 'Hot' || value === 'Best' ? (
          <IconFlame size={16} color={C.muted} />
        ) : value === 'New' ? (
          <IconSparkles size={16} color={C.muted} />
        ) : (
          <IconTrendingUp size={16} color={C.muted} />
        )}
        <Text c={C.muted} fw="bold" size={12}>
          {label ? `${label} ${value}` : value}
        </Text>
        <IconChevronDown size={14} color={C.muted} />
      </Block>
      <MenuDropdown>
        {options.map((option) => (
          <MenuItem key={option} onPress={() => onChange(option)}>
            {option === value ? `✓ ${option}` : option}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  );
}

function Header({ children, back, right }: { children?: ReactNode; back?: boolean; right?: ReactNode }) {
  const { pop } = useApp();
  return (
    <Block h={56} bg={C.white} borderBottomWidth={1} borderBottomColor={C.line} direction="row" align="center" px={8} gap={6}>
      {back && <IconButton icon={IconArrowLeft} variant="ghost" iconColor={C.ink} accessibilityLabel="Back" onPress={pop} />}
      <Block flex={1} direction="row" align="center" gap={8} miw={0}>
        {children}
      </Block>
      {right}
    </Block>
  );
}

function Page({ header, sidebar, footer, children }: { header: ReactNode; sidebar?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const { wide, route } = useApp();
  return (
    <Block flex={1} gap={0}>
      {header}
      <ScrollArea flex={1} keyboardShouldPersistTaps="handled" contentProps={{ pb: footer ? 24 : !wide && !route ? 96 : 32 }}>
        <Block direction="row" align="flex-start" gap={20} w="100%" maw={wide ? 1100 : 760} alignSelf="center" px={wide ? 20 : 0} pt={wide ? 16 : 0}>
          <Block flex={1} gap={0} miw={0}>
            {children}
          </Block>
          {wide && !!sidebar && (
            <Block w={312} gap={14}>
              {sidebar}
            </Block>
          )}
        </Block>
      </ScrollArea>
      {footer}
    </Block>
  );
}

function Panel({ children, title }: { children: ReactNode; title?: string }) {
  const { wide } = useApp();
  return (
    <Block bg={C.white} radius={wide ? 12 : 0} borderWidth={wide ? 1 : 0} borderColor={C.line} p={16} gap={10} mb={wide ? 0 : 6}>
      {!!title && (
        <Text c={C.muted} fw="bold" size={11} tt="uppercase" lts={0.6}>
          {title}
        </Text>
      )}
      {children}
    </Block>
  );
}

function JoinButton({ id, size = 'sm' }: { id: string; size?: 'xs' | 'sm' }) {
  const { joined, toggleJoin } = useApp();
  const on = joined.includes(id);
  return (
    <Button
      title={on ? 'Joined' : 'Join'}
      size={size}
      variant={on ? 'outline' : 'filled'}
      color={on ? C.muted : C.blue}
      onPress={() => toggleJoin(id)}
      accessibilityLabel={`${on ? 'Leave' : 'Join'} t/${id}`}
    />
  );
}

function PostCard({ post, inCommunity }: { post: Post; inCommunity?: boolean }) {
  const app = useApp();
  const group = communityOf(post.community);
  return (
    <Block
      onPress={() => app.push({ name: 'post', id: post.id })}
      accessibilityRole="button"
      accessibilityLabel={`Open ${post.title}`}
      bg={C.white}
      radius={app.wide ? 12 : 0}
      borderWidth={app.wide ? 1 : 0}
      borderColor={C.line}
      px={16}
      py={12}
      mb={app.wide ? 12 : 6}
      gap={9}
    >
      <Block direction="row" align="center" gap={7}>
        {inCommunity ? (
          <>
            <UserAvatar name={post.author} size={22} />
            <Text c={C.ink} fw="semibold" size={12}>
              u/{post.author}
            </Text>
          </>
        ) : (
          <Block
            direction="row"
            align="center"
            gap={7}
            onPress={(event) => {
              stop(event);
              app.push({ name: 'community', id: group.id });
            }}
            accessibilityRole="link"
            accessibilityLabel={`Open t/${group.id}`}
          >
            <CommunityIcon community={group} size={22} />
            <Text c={C.ink} fw="semibold" size={12}>
              t/{group.id}
            </Text>
          </Block>
        )}
        <Text c={C.muted} size={12}>
          · {since(post.ts)}
        </Text>
        <Block flex={1} />
        {!inCommunity && !app.joined.includes(group.id) && <JoinButton id={group.id} size="xs" />}
      </Block>
      <Text c={C.ink} fw="bold" size={17} lh={23}>
        {post.title}
      </Text>
      {!!post.flair && <Flair label={post.flair} color={group.color} />}
      {post.image ? (
        <Block gap={0} h={app.wide ? 300 : 210} radius={12} bg={post.image.bg} align="center" justify="center">
          <Text size={app.wide ? 110 : 84}>{post.image.emoji}</Text>
        </Block>
      ) : (
        <Text c={C.muted} size={14} lh={20} numberOfLines={3}>
          {post.body}
        </Text>
      )}
      <Block direction="row" align="center" gap={8}>
        <VotePill id={post.id} base={post.votes} />
        <Pill
          icon={<IconMessageCircle size={17} color={C.ink} />}
          label={compact(app.counts[post.id] ?? 0)}
          onPress={() => app.push({ name: 'post', id: post.id })}
        />
        <Block flex={1} />
        <Pill
          icon={
            app.saved.includes(post.id) ? (
              <IconBookmarkFilled size={17} color={C.orange} />
            ) : (
              <IconBookmark size={17} color={C.ink} />
            )
          }
          onPress={() => app.toggleSave(post.id)}
          active={app.saved.includes(post.id)}
        />
        <Pill icon={<IconShare3 size={17} color={C.ink} />} label="Share" onPress={() => app.share(post)} />
      </Block>
    </Block>
  );
}

function CommunityAbout({ community, banner }: { community: Community; banner?: boolean }) {
  const app = useApp();
  const count = app.posts.filter((post) => post.community === community.id).length;
  return (
    <>
      <Block bg={C.white} radius={app.wide ? 12 : 0} borderWidth={app.wide ? 1 : 0} borderColor={C.line} overflow="hidden" gap={0}>
        {banner && <Block gap={0} h={44} bg={community.banner} />}
        <Block p={16} gap={12}>
          {banner && (
            <Block
              direction="row"
              align="center"
              gap={10}
              onPress={() => app.push({ name: 'community', id: community.id })}
              accessibilityRole="link"
              accessibilityLabel={`Open t/${community.id}`}
            >
              <CommunityIcon community={community} size={36} />
              <Block gap={0} flex={1}>
                <Text c={C.ink} fw="bold" size={15}>
                  t/{community.id}
                </Text>
                <Text c={C.muted} size={12}>
                  {community.name}
                </Text>
              </Block>
              <JoinButton id={community.id} />
            </Block>
          )}
          <Text c={C.ink} size={14} lh={20}>
            {community.about}
          </Text>
          <Block direction="row" align="center" gap={6}>
            <IconCake size={16} color={C.muted} />
            <Text c={C.muted} size={12}>
              Created {community.created}
            </Text>
          </Block>
          <Block direction="row" gap={24} pt={4}>
            {[
              [compact(community.members), 'Members'],
              [compact(community.online), 'Online'],
              [String(count), 'Posts'],
            ].map(([value, label]) => (
              <Block key={label} gap={0}>
                <Text c={C.ink} fw="bold" size={15}>
                  {value}
                </Text>
                <Text c={C.muted} size={11}>
                  {label}
                </Text>
              </Block>
            ))}
          </Block>
          {banner && (
            <Button
              title="Create post"
              variant="outline"
              color={C.ink}
              fullWidth
              onPress={() => app.push({ name: 'create', community: community.id })}
            />
          )}
        </Block>
      </Block>
      <Panel title={`t/${community.id} rules`}>
        {community.rules.map((rule, index) => (
          <Block key={rule} direction="row" gap={10} py={4} borderTopWidth={index ? 1 : 0} borderTopColor={C.line} pt={index ? 10 : 0}>
            <Text c={C.muted} fw="bold" size={13}>
              {index + 1}
            </Text>
            <Text c={C.ink} size={13} flex={1}>
              {rule}
            </Text>
          </Block>
        ))}
      </Panel>
    </>
  );
}

function CommunityRow({ community }: { community: Community }) {
  const app = useApp();
  return (
    <Block
      direction="row"
      align="center"
      gap={12}
      py={10}
      onPress={() => app.push({ name: 'community', id: community.id })}
      accessibilityRole="link"
      accessibilityLabel={`Open t/${community.id}`}
    >
      <CommunityIcon community={community} size={40} />
      <Block gap={1} flex={1} miw={0}>
        <Text c={C.ink} fw="bold" size={14}>
          t/{community.id}
        </Text>
        <Text c={C.muted} size={12} numberOfLines={1}>
          {compact(community.members)} members · {community.about}
        </Text>
      </Block>
      <JoinButton id={community.id} />
    </Block>
  );
}

function YourCommunities() {
  const app = useApp();
  const list = COMMUNITIES.filter((item) => app.joined.includes(item.id));
  return (
    <Panel title="Your communities">
      {list.map((community) => (
        <Block
          key={community.id}
          direction="row"
          align="center"
          gap={10}
          onPress={() => app.push({ name: 'community', id: community.id })}
          accessibilityRole="link"
          accessibilityLabel={`Open t/${community.id}`}
        >
          <CommunityIcon community={community} size={28} />
          <Block gap={0} flex={1}>
            <Text c={C.ink} fw="semibold" size={13}>
              t/{community.id}
            </Text>
            <Text c={C.muted} size={11}>
              {compact(community.members)} members
            </Text>
          </Block>
        </Block>
      ))}
      {!list.length && (
        <Text c={C.muted} size={13}>
          Join communities to fill your home feed.
        </Text>
      )}
      <Button title="Explore communities" variant="light" color={C.blue} fullWidth onPress={() => app.go('communities')} />
    </Panel>
  );
}

function Logo() {
  return (
    <Block direction="row" align="center" gap={6}>
      <Block gap={0} w={30} h={30} radius={15} bg={C.orange} align="center" justify="center">
        <Text c={C.white} fw="bold" size={17}>
          t
        </Text>
      </Block>
      <Text c={C.ink} fw="bold" size={20} lts={-0.5}>
        threadit
      </Text>
    </Block>
  );
}

function HomeScreen() {
  const app = useApp();
  const [sort, setSort] = useState<Sort>('Hot');
  const list = sortPosts(
    app.feed === 'popular'
      ? app.posts
      : app.posts.filter((post) => app.joined.includes(post.community) || post.author === 'you'),
    sort,
    app.score,
  );
  return (
    <Page
      header={
        <Header
          right={
            <>
              <IconButton icon={IconSearch} variant="ghost" iconColor={C.ink} accessibilityLabel="Search" onPress={() => app.push({ name: 'search' })} />
              {app.wide && <Button title="Create" variant="filled" color={C.orange} startSection={<IconPlus size={16} color={C.white} />} onPress={() => app.push({ name: 'create' })} />}
            </>
          }
        >
          {!app.wide && <Logo />}
          <Block direction="row" gap={4} ml={app.wide ? 8 : 6}>
            {(['home', 'popular'] as const).map((key) => (
              <Block
                key={key}
                px={10}
                py={6}
                radius={16}
                bg={app.feed === key ? C.chip : undefined}
                onPress={() => app.setFeed(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: app.feed === key }}
              >
                <Text c={app.feed === key ? C.ink : C.muted} fw="bold" size={14}>
                  {key === 'home' ? 'Home' : 'Popular'}
                </Text>
              </Block>
            ))}
          </Block>
        </Header>
      }
      sidebar={
        <>
          <YourCommunities />
          <Panel title="About Threadit">
            <Text c={C.ink} size={13} lh={19}>
              Your home for local discussion. Everything you post, vote and save stays on this device.
            </Text>
            <Button title="Create post" color={C.orange} fullWidth onPress={() => app.push({ name: 'create' })} />
          </Panel>
        </>
      }
    >
      <Block direction="row" align="center" px={app.wide ? 0 : 12} py={4}>
        <SortMenu value={sort} options={['Hot', 'New', 'Top']} onChange={setSort} />
      </Block>
      {list.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {!list.length && (
        <Panel>
          <Text c={C.ink} fw="bold" size={16}>
            Your home feed is empty
          </Text>
          <Text c={C.muted} size={13}>
            Join a few communities and their posts will show up here.
          </Text>
          <Button title="Explore communities" color={C.blue} onPress={() => app.go('communities')} />
        </Panel>
      )}
    </Page>
  );
}

function CommunitiesScreen() {
  const app = useApp();
  const [query, setQuery] = useState('');
  const match = COMMUNITIES.filter((item) => `${item.id} ${item.name} ${item.about}`.toLowerCase().includes(query.toLowerCase()));
  const mine = match.filter((item) => app.joined.includes(item.id));
  const rest = match.filter((item) => !app.joined.includes(item.id)).sort((a, b) => b.members - a.members);
  return (
    <Page header={<Header><Text c={C.ink} fw="bold" size={20} ml={8}>Communities</Text></Header>} sidebar={<YourCommunities />}>
      <Panel>
        <Block direction="row" align="center" gap={6} bg={C.chip} radius={20} px={12}>
          <IconSearch size={17} color={C.muted} />
          <Input variant="unstyled" value={query} onChangeText={setQuery} placeholder="Search communities" mb={0} flex={1} inputColor={C.ink} />
        </Block>
      </Panel>
      {!!mine.length && (
        <Panel title="Joined">
          {mine.map((community) => (
            <CommunityRow key={community.id} community={community} />
          ))}
        </Panel>
      )}
      <Panel title="Discover">
        {rest.map((community) => (
          <CommunityRow key={community.id} community={community} />
        ))}
        {!rest.length && (
          <Text c={C.muted} size={13}>
            {query ? 'No communities match that search.' : 'You have joined every community.'}
          </Text>
        )}
      </Panel>
    </Page>
  );
}

function InboxScreen() {
  const app = useApp();
  const unread = NOTICES.filter((item) => !app.read.includes(item.id));
  return (
    <Page
      header={
        <Header
          right={
            !!unread.length && (
              <Button title="Mark all read" variant="subtle" color={C.blue} size="sm" onPress={() => app.markRead(NOTICES.map((item) => item.id))} />
            )
          }
        >
          <Text c={C.ink} fw="bold" size={20} ml={8}>
            Inbox
          </Text>
        </Header>
      }
      sidebar={<YourCommunities />}
    >
      <Panel title="Notifications">
        {[...NOTICES]
          .sort((a, b) => b.ts - a.ts)
          .map((notice) => {
            const post = POSTS.find((item) => item.id === notice.postId)!;
            const fresh = !app.read.includes(notice.id);
            return (
              <Block
                key={notice.id}
                direction="row"
                align="center"
                gap={12}
                py={10}
                onPress={() => {
                  app.markRead([notice.id]);
                  app.push({ name: 'post', id: notice.postId });
                }}
                accessibilityRole="button"
              >
                <Block gap={0}>
                  <CommunityIcon community={communityOf(post.community)} size={38} />
                  {fresh && <Block gap={0} position="absolute" right={-2} top={-2} w={11} h={11} radius={6} bg={C.orange} borderWidth={2} borderColor={C.white} />}
                </Block>
                <Block gap={2} flex={1}>
                  <Text c={C.ink} fw={fresh ? 'bold' : 'normal'} size={13} lh={18}>
                    {notice.text}
                  </Text>
                  <Text c={C.muted} size={11}>
                    {notice.kind === 'reply' ? 'Reply' : notice.kind === 'upvote' ? 'Milestone' : 'Trending'} · {since(notice.ts)}
                  </Text>
                </Block>
              </Block>
            );
          })}
      </Panel>
    </Page>
  );
}

function ProfileScreen() {
  const app = useApp();
  const [view, setView] = useState('posts');
  const mine = app.posts.filter((post) => post.author === 'you');
  const myComments = app.comments.filter((item) => item.author === 'you').sort((a, b) => b.ts - a.ts);
  const karma =
    mine.reduce((sum, post) => sum + app.score(post.id, post.votes), 0) +
    myComments.reduce((sum, item) => sum + app.score(item.id, item.votes), 0);
  const savedPosts = app.posts.filter((post) => app.saved.includes(post.id));
  return (
    <Page header={<Header><Text c={C.ink} fw="bold" size={20} ml={8}>Profile</Text></Header>} sidebar={<YourCommunities />}>
      <Block bg={C.white} radius={app.wide ? 12 : 0} borderWidth={app.wide ? 1 : 0} borderColor={C.line} overflow="hidden" gap={0} mb={app.wide ? 12 : 6}>
        <Block gap={0} h={80} bg="#FFD9CE" />
        <Block px={16} pb={16} gap={8}>
          <Block gap={0} mt={-32} w={72} h={72} radius={36} bg={C.white} align="center" justify="center">
            <UserAvatar name="you" size={64} />
          </Block>
          <Text c={C.ink} fw="bold" size={22}>
            u/you
          </Text>
          <Block direction="row" gap={24}>
            {[
              [compact(karma), 'Karma'],
              [String(mine.length), 'Posts'],
              [String(myComments.length), 'Comments'],
              [String(app.joined.length), 'Communities'],
            ].map(([value, label]) => (
              <Block key={label} gap={0}>
                <Text c={C.ink} fw="bold" size={15}>
                  {value}
                </Text>
                <Text c={C.muted} size={11}>
                  {label}
                </Text>
              </Block>
            ))}
          </Block>
        </Block>
      </Block>
      <Block px={app.wide ? 0 : 12} pb={10}>
        <SegmentedControl
          fullWidth
          color={C.ink}
          value={view}
          onChange={setView}
          data={[
            { value: 'posts', label: 'Posts' },
            { value: 'comments', label: 'Comments' },
            { value: 'saved', label: 'Saved' },
          ]}
        />
      </Block>
      {view === 'posts' && mine.map((post) => <PostCard key={post.id} post={post} />)}
      {view === 'saved' && savedPosts.map((post) => <PostCard key={post.id} post={post} />)}
      {view === 'comments' &&
        myComments.map((item) => {
          const post = app.posts.find((p) => p.id === item.postId);
          return (
            <Block
              key={item.id}
              bg={C.white}
              radius={app.wide ? 12 : 0}
              borderWidth={app.wide ? 1 : 0}
              borderColor={C.line}
              p={16}
              mb={app.wide ? 12 : 6}
              gap={6}
              onPress={() => post && app.push({ name: 'post', id: post.id, focus: item.id })}
              accessibilityRole="button"
            >
              <Text c={C.muted} size={12} numberOfLines={1}>
                t/{post?.community} · {post?.title ?? 'Removed post'} · {since(item.ts)}
              </Text>
              <Text c={C.ink} size={14} lh={20}>
                {item.text}
              </Text>
              <Text c={C.muted} fw="semibold" size={12}>
                {compact(app.score(item.id, item.votes))} points
              </Text>
            </Block>
          );
        })}
      {((view === 'posts' && !mine.length) || (view === 'saved' && !savedPosts.length) || (view === 'comments' && !myComments.length)) && (
        <Panel>
          <Text c={C.muted} size={13} ta="center">
            {view === 'posts' ? 'You have not posted yet.' : view === 'saved' ? 'Saved posts show up here.' : 'Your comments show up here.'}
          </Text>
          {view === 'posts' && <Button title="Create a post" color={C.orange} onPress={() => app.push({ name: 'create' })} />}
        </Panel>
      )}
    </Page>
  );
}

function CommunityScreen({ id }: { id: string }) {
  const app = useApp();
  const community = communityOf(id);
  const [sort, setSort] = useState<Sort>('Hot');
  const [view, setView] = useState('posts');
  const list = sortPosts(app.posts.filter((post) => post.community === id), sort, app.score);
  return (
    <Page
      header={
        <Header
          back
          right={<IconButton icon={IconPlus} variant="ghost" iconColor={C.ink} accessibilityLabel="Create post" onPress={() => app.push({ name: 'create', community: id })} />}
        >
          <Text c={C.ink} fw="bold" size={17} numberOfLines={1}>
            t/{id}
          </Text>
        </Header>
      }
      sidebar={<CommunityAbout community={community} />}
    >
      <Block bg={C.white} radius={app.wide ? 12 : 0} borderWidth={app.wide ? 1 : 0} borderColor={C.line} overflow="hidden" gap={0} mb={app.wide ? 12 : 6}>
        <Block gap={0} h={app.wide ? 120 : 86} bg={community.banner} align="flex-end" justify="center" pr={24} overflow="hidden">
          <Text size={app.wide ? 96 : 72} opacity={0.35}>
            {community.emoji}
          </Text>
        </Block>
        <Block px={16} pb={14} gap={6}>
          <Block direction="row" align="flex-end" gap={12} mt={-26}>
            <Block gap={0} p={3} radius={34} bg={C.white}>
              <CommunityIcon community={community} size={62} />
            </Block>
            <Block flex={1} />
            <JoinButton id={id} />
          </Block>
          <Text c={C.ink} fw="bold" size={22}>
            t/{id}
          </Text>
          <Block direction="row" align="center" gap={6}>
            <Text c={C.muted} size={12}>
              {compact(community.members)} members
            </Text>
            <Block gap={0} w={7} h={7} radius={4} bg={C.green} ml={6} />
            <Text c={C.muted} size={12}>
              {compact(community.online)} online
            </Text>
          </Block>
          <Text c={C.ink} size={13} lh={19} numberOfLines={app.wide ? undefined : 2}>
            {community.about}
          </Text>
        </Block>
      </Block>
      {!app.wide && (
        <Block px={12} pb={8}>
          <SegmentedControl
            fullWidth
            color={C.ink}
            value={view}
            onChange={setView}
            data={[
              { value: 'posts', label: 'Posts' },
              { value: 'about', label: 'About' },
            ]}
          />
        </Block>
      )}
      {!app.wide && view === 'about' ? (
        <CommunityAbout community={community} />
      ) : (
        <>
          <Block direction="row" align="center" px={app.wide ? 0 : 12} py={4}>
            <SortMenu value={sort} options={['Hot', 'New', 'Top']} onChange={setSort} />
          </Block>
          {list.map((post) => (
            <PostCard key={post.id} post={post} inCommunity />
          ))}
          {!list.length && (
            <Panel>
              <Text c={C.ink} fw="bold" size={16}>
                No posts yet
              </Text>
              <Button title="Be the first to post" color={C.orange} onPress={() => app.push({ name: 'create', community: id })} />
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}

function PostScreen({ id, focus }: { id: string; focus?: string }) {
  const app = useApp();
  const post = app.posts.find((item) => item.id === id);
  const [sort, setSort] = useState<CommentSort>('Best');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState('');
  const thread = useMemo(() => app.comments.filter((item) => item.postId === id), [app.comments, id]);
  const children = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    thread.forEach((item) => (map[item.parentId ?? 'root'] ??= []).push(item));
    const order = (a: Comment, b: Comment) =>
      sort === 'New'
        ? b.ts - a.ts
        : sort === 'Top'
          ? app.score(b.id, b.votes) - app.score(a.id, a.votes)
          : Number(b.author === 'you' && Date.now() - b.ts < 3600000) - Number(a.author === 'you' && Date.now() - a.ts < 3600000) ||
            app.score(b.id, b.votes) - app.score(a.id, a.votes);
    Object.values(map).forEach((list) => list.sort(order));
    return map;
  }, [thread, sort, app.score]);
  if (!post)
    return (
      <Page header={<Header back />}>
        <Panel>
          <Text c={C.muted}>This post is no longer available.</Text>
        </Panel>
      </Page>
    );
  const group = communityOf(post.community);
  const maxDepth = app.wide ? 6 : 4;
  const count = (cid: string): number => (children[cid] ?? []).reduce((sum, item) => sum + 1 + count(item.id), 0);
  const toggle = (cid: string) => setCollapsed((old) => (old.includes(cid) ? old.filter((item) => item !== cid) : [...old, cid]));
  const target = thread.find((item) => item.id === replyTo);
  const roots = focus ? thread.filter((item) => item.id === focus) : children.root ?? [];
  const submit = () => {
    if (!draft.trim() || replyTo === undefined) return;
    app.addComment(post.id, replyTo, draft.trim());
    if (replyTo) setCollapsed((old) => old.filter((item) => item !== replyTo));
    setDraft('');
    setReplyTo(undefined);
    app.flash(replyTo ? 'Reply posted' : 'Comment posted');
  };
  const renderComment = (item: Comment, depth: number): ReactNode => {
    const closed = collapsed.includes(item.id);
    const kids = children[item.id] ?? [];
    const rail = RAILS[depth % RAILS.length];
    return (
      <Block key={item.id} gap={0} pt={12} borderTopWidth={depth ? 0 : 1} borderTopColor={C.line} mt={depth ? 0 : 4}>
        <Block
          direction="row"
          align="center"
          gap={6}
          onPress={() => toggle(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`${closed ? 'Expand' : 'Collapse'} comment by ${item.author}`}
          accessibilityState={{ expanded: !closed }}
        >
          <UserAvatar name={item.author} size={22} />
          <Text c={item.author === 'you' ? C.blue : C.ink} fw="semibold" size={12}>
            {item.author}
          </Text>
          {item.author === post.author && (
            <Block gap={0} bg={C.blue} radius={4} px={4}>
              <Text c={C.white} fw="bold" size={10}>
                OP
              </Text>
            </Block>
          )}
          <Text c={C.muted} size={12}>
            · {since(item.ts)}
          </Text>
          {closed && (
            <Block gap={0} ml="auto" bg={C.chip} radius={10} px={8} py={1}>
              <Text c={C.muted} fw="bold" size={11}>
                +{count(item.id) + 1}
              </Text>
            </Block>
          )}
        </Block>
        {!closed && (
          <Block direction="row" gap={0}>
            <Block
              gap={0}
              w={22}
              align="center"
              onPress={() => toggle(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Collapse thread by ${item.author}`}
            >
              <Block gap={0} w={2} flex={1} bg={kids.length ? rail : 'transparent'} mt={4} radius={1} />
            </Block>
            <Block gap={0} flex={1} miw={0} pl={6}>
              <Text c={C.ink} size={14} lh={20} mt={2}>
                {item.text}
              </Text>
              <Block direction="row" align="center" justify="flex-end" gap={4}>
                <Menu position="bottom-end">
                  <IconButton icon={IconDots} variant="ghost" size="sm" iconColor={C.muted} accessibilityLabel="Comment options" />
                  <MenuDropdown>
                    <MenuItem onPress={() => app.push({ name: 'post', id: post.id, focus: item.id })}>Open single thread</MenuItem>
                    <MenuItem onPress={() => toggle(item.id)}>Collapse thread</MenuItem>
                    <MenuItem
                      onPress={() => {
                        Clipboard.setStringAsync(item.text).catch(() => {});
                        app.flash('Comment copied');
                      }}
                    >
                      Copy text
                    </MenuItem>
                  </MenuDropdown>
                </Menu>
                <Block
                  direction="row"
                  align="center"
                  gap={4}
                  px={8}
                  py={5}
                  radius={14}
                  onPress={() => {
                    setReplyTo(item.id);
                    setDraft('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Reply to ${item.author}`}
                >
                  <IconMessageCircle size={16} color={C.muted} />
                  <Text c={C.muted} fw="semibold" size={12}>
                    Reply
                  </Text>
                </Block>
                <VotePill id={item.id} base={item.votes} flat />
              </Block>
              {!!kids.length &&
                (depth + 1 >= maxDepth ? (
                  <Block
                    direction="row"
                    align="center"
                    gap={6}
                    py={8}
                    onPress={() => app.push({ name: 'post', id: post.id, focus: item.id })}
                    accessibilityRole="link"
                  >
                    <Text c={C.blue} fw="semibold" size={13}>
                      Continue this thread ({count(item.id)} more)
                    </Text>
                    <IconArrowRight size={14} color={C.blue} />
                  </Block>
                ) : (
                  kids.map((kid) => renderComment(kid, depth + 1))
                ))}
            </Block>
          </Block>
        )}
      </Block>
    );
  };
  return (
    <Page
      header={
        <Header
          back
          right={
            <Menu position="bottom-end">
              <IconButton icon={IconDots} variant="ghost" iconColor={C.ink} accessibilityLabel="Post options" />
              <MenuDropdown>
                <MenuItem onPress={() => app.toggleSave(post.id)}>{app.saved.includes(post.id) ? 'Unsave' : 'Save'}</MenuItem>
                <MenuItem onPress={() => app.share(post)}>Share</MenuItem>
                <MenuItem color="error" onPress={() => app.hide(post.id)}>
                  Hide post
                </MenuItem>
              </MenuDropdown>
            </Menu>
          }
        >
          <Block
            direction="row"
            align="center"
            gap={8}
            onPress={() => app.push({ name: 'community', id: group.id })}
            accessibilityRole="link"
            accessibilityLabel={`Open t/${group.id}`}
          >
            <CommunityIcon community={group} size={28} />
            <Text c={C.ink} fw="bold" size={15} numberOfLines={1}>
              t/{group.id}
            </Text>
          </Block>
        </Header>
      }
      sidebar={<CommunityAbout community={group} banner />}
      footer={
        <Block bg={C.white} borderTopWidth={1} borderTopColor={C.line} px={12} py={10} gap={8}>
          <Block gap={8} w="100%" maw={app.wide ? 760 : undefined} alignSelf="center">
            {replyTo === undefined ? (
              <Block bg={C.chip} radius={20} px={16} py={11} onPress={() => setReplyTo(null)} accessibilityRole="button" accessibilityLabel="Add a comment">
                <Text c={C.muted} size={14}>
                  Join the conversation
                </Text>
              </Block>
            ) : (
              <>
                <Block direction="row" align="center" gap={8}>
                  <Text c={C.muted} size={12} flex={1} numberOfLines={1}>
                    {target ? `Replying to u/${target.author}: “${target.text}”` : `Commenting on t/${group.id}`}
                  </Text>
                  <IconButton icon={IconX} variant="ghost" size="sm" iconColor={C.muted} accessibilityLabel="Cancel reply" onPress={() => setReplyTo(undefined)} />
                </Block>
                <TextArea
                  autoFocus
                  variant="outline"
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={target ? 'Your reply' : 'Add a comment'}
                  rows={3}
                  radius={10}
                  mb={0}
                />
                <Block direction="row" justify="flex-end" gap={8}>
                  <Button title="Cancel" variant="subtle" color={C.muted} onPress={() => setReplyTo(undefined)} />
                  <Button title={target ? 'Reply' : 'Comment'} color={C.blue} disabled={!draft.trim()} onPress={submit} />
                </Block>
              </>
            )}
          </Block>
        </Block>
      }
    >
      <Block bg={C.white} radius={app.wide ? 12 : 0} borderWidth={app.wide ? 1 : 0} borderColor={C.line} px={16} py={14} gap={10} mb={app.wide ? 12 : 6}>
        <Block direction="row" align="center" gap={8}>
          <Block
            direction="row"
            align="center"
            gap={8}
            onPress={() => app.push({ name: 'community', id: group.id })}
            accessibilityRole="link"
            accessibilityLabel={`Open t/${group.id}`}
          >
            <CommunityIcon community={group} size={32} />
            <Block gap={0}>
              <Text c={C.ink} fw="bold" size={13}>
                t/{group.id} <Text c={C.muted} size={12}>· {since(post.ts)}</Text>
              </Text>
              <Text c={C.muted} size={12}>
                u/{post.author}
              </Text>
            </Block>
          </Block>
          <Block flex={1} />
          {!app.joined.includes(group.id) && <JoinButton id={group.id} />}
        </Block>
        <Text c={C.ink} fw="bold" size={21} lh={28}>
          {post.title}
        </Text>
        {!!post.flair && <Flair label={post.flair} color={group.color} />}
        {!!post.image && (
          <Block gap={6}>
            <Block gap={0} h={app.wide ? 380 : 260} radius={12} bg={post.image.bg} align="center" justify="center">
              <Text size={app.wide ? 140 : 110}>{post.image.emoji}</Text>
            </Block>
            {!!post.image.caption && (
              <Text c={C.muted} size={12} fs="italic">
                {post.image.caption}
              </Text>
            )}
          </Block>
        )}
        {!!post.body && (
          <Text c={C.ink} size={15} lh={23}>
            {post.body}
          </Text>
        )}
        <Block direction="row" align="center" gap={8} pt={4}>
          <VotePill id={post.id} base={post.votes} />
          <Pill icon={<IconMessageCircle size={17} color={C.ink} />} label={compact(thread.length)} onPress={() => setReplyTo(null)} />
          <Block flex={1} />
          <Pill
            icon={app.saved.includes(post.id) ? <IconBookmarkFilled size={17} color={C.orange} /> : <IconBookmark size={17} color={C.ink} />}
            onPress={() => app.toggleSave(post.id)}
            active={app.saved.includes(post.id)}
          />
          <Pill icon={<IconShare3 size={17} color={C.ink} />} label="Share" onPress={() => app.share(post)} />
        </Block>
      </Block>
      <Block bg={C.white} radius={app.wide ? 12 : 0} borderWidth={app.wide ? 1 : 0} borderColor={C.line} px={12} pt={6} pb={14} gap={0}>
        {focus ? (
          <Block direction="row" align="center" gap={8} py={8} px={4}>
            <Text c={C.muted} size={12} flex={1}>
              Single comment thread
            </Text>
            <Button title="See full discussion" variant="subtle" color={C.blue} size="sm" onPress={() => app.replace({ name: 'post', id: post.id })} />
          </Block>
        ) : (
          <Block direction="row" align="center" px={4}>
            <SortMenu value={sort} options={['Best', 'Top', 'New']} onChange={setSort} label="Sort by" />
            <Block flex={1} />
            {!!collapsed.length && <Button title="Expand all" variant="subtle" color={C.blue} size="xs" onPress={() => setCollapsed([])} />}
          </Block>
        )}
        {roots.map((item) => renderComment(item, 0))}
        {!roots.length && (
          <Block align="center" gap={6} py={28}>
            <IconMessageCircle size={32} color={C.muted} />
            <Text c={C.ink} fw="bold" size={15}>
              No comments yet
            </Text>
            <Text c={C.muted} size={13}>
              Be the first to share what you think.
            </Text>
          </Block>
        )}
      </Block>
    </Page>
  );
}

function CreateScreen({ preset }: { preset?: string }) {
  const app = useApp();
  const [community, setCommunity] = useState<string | undefined>(preset ?? app.joined[0]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('text');
  const [tile, setTile] = useState(0);
  const group = community ? communityOf(community) : undefined;
  const valid = !!group && !!title.trim() && (kind === 'image' || !!body.trim());
  const submit = () => {
    if (!valid || !group) return;
    const id = app.addPost({
      community: group.id,
      title: title.trim(),
      body: body.trim(),
      image: kind === 'image' ? IMAGE_TILES[tile] : undefined,
    });
    app.replace({ name: 'post', id });
    app.flash(`Posted to t/${group.id}`);
  };
  return (
    <Page
      header={
        <Header right={<Button title="Post" color={C.blue} disabled={!valid} onPress={submit} />}>
          <IconButton icon={IconX} variant="ghost" iconColor={C.ink} accessibilityLabel="Discard post" onPress={app.pop} />
          <Text c={C.ink} fw="bold" size={17}>
            Create post
          </Text>
        </Header>
      }
      sidebar={group && <CommunityAbout community={group} banner />}
    >
      <Panel>
        <Menu position="bottom-start">
          <Block direction="row" align="center" gap={8} alignSelf="flex-start" bg={C.chip} radius={20} pl={6} pr={12} py={6} onPress={() => {}} accessibilityRole="button" accessibilityLabel="Choose a community">
            {group ? <CommunityIcon community={group} size={26} /> : <IconUsersGroup size={22} color={C.muted} />}
            <Text c={C.ink} fw="bold" size={13}>
              {group ? `t/${group.id}` : 'Choose a community'}
            </Text>
            <IconChevronDown size={15} color={C.ink} />
          </Block>
          <MenuDropdown>
            {COMMUNITIES.map((item) => (
              <MenuItem key={item.id} startSection={<CommunityIcon community={item} size={22} />} onPress={() => setCommunity(item.id)}>
                {`t/${item.id}`}
              </MenuItem>
            ))}
          </MenuDropdown>
        </Menu>
        <Input variant="unstyled" value={title} onChangeText={setTitle} placeholder="Title" mb={0} inputColor={C.ink} inputFontSize={22} maxLength={300} />
        <SegmentedControl
          color={C.ink}
          value={kind}
          onChange={setKind}
          data={[
            { value: 'text', label: 'Text' },
            { value: 'image', label: 'Image' },
          ]}
        />
        {kind === 'image' && (
          <Block gap={10}>
            <Block gap={0} h={200} radius={12} bg={IMAGE_TILES[tile].bg} align="center" justify="center">
              <Text size={90}>{IMAGE_TILES[tile].emoji}</Text>
            </Block>
            <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8 }}>
              {IMAGE_TILES.map((item, index) => (
                <Block
                  key={item.emoji}
                  gap={0}
                  w={52}
                  h={52}
                  radius={10}
                  bg={item.bg}
                  align="center"
                  justify="center"
                  borderWidth={2}
                  borderColor={index === tile ? C.blue : 'transparent'}
                  onPress={() => setTile(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Image ${index + 1}`}
                  accessibilityState={{ selected: index === tile }}
                >
                  <Text size={26}>{item.emoji}</Text>
                </Block>
              ))}
            </ScrollArea>
          </Block>
        )}
        <TextArea
          variant="unstyled"
          value={body}
          onChangeText={setBody}
          placeholder={kind === 'image' ? 'Add a caption (optional)' : 'Body text'}
          rows={6}
          mb={0}
        />
      </Panel>
      {group && !app.wide && (
        <Panel title={`Posting to t/${group.id}`}>
          {group.rules.map((rule, index) => (
            <Text key={rule} c={C.muted} size={12}>
              {index + 1}. {rule}
            </Text>
          ))}
        </Panel>
      )}
    </Page>
  );
}

function SearchScreen() {
  const app = useApp();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const groups = q ? COMMUNITIES.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(q)) : [];
  const results = q ? sortPosts(app.posts.filter((post) => `${post.title} ${post.body}`.toLowerCase().includes(q)), 'Top', app.score) : [];
  return (
    <Page
      header={
        <Header back>
          <Block flex={1} direction="row" align="center" gap={6} bg={C.chip} radius={20} px={12}>
            <IconSearch size={17} color={C.muted} />
            <Input autoFocus variant="unstyled" value={query} onChangeText={setQuery} placeholder="Search Threadit" mb={0} flex={1} inputColor={C.ink} />
          </Block>
        </Header>
      }
    >
      {!q && (
        <Panel title="Trending communities">
          {[...COMMUNITIES]
            .sort((a, b) => b.online - a.online)
            .slice(0, 5)
            .map((community) => (
              <CommunityRow key={community.id} community={community} />
            ))}
        </Panel>
      )}
      {!!groups.length && (
        <Panel title="Communities">
          {groups.map((community) => (
            <CommunityRow key={community.id} community={community} />
          ))}
        </Panel>
      )}
      {!!q && (
        <Block px={app.wide ? 0 : 16} py={8}>
          <Text c={C.muted} fw="bold" size={11} tt="uppercase" lts={0.6}>
            {results.length} posts
          </Text>
        </Block>
      )}
      {results.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </Page>
  );
}

function SideNav() {
  const app = useApp();
  const unread = NOTICES.filter((item) => !app.read.includes(item.id)).length;
  const items = [
    { key: 'home', label: 'Home', icon: IconHome, active: !app.route && app.tab === 'home' && app.feed === 'home', press: () => app.go('home', 'home') },
    { key: 'popular', label: 'Popular', icon: IconTrendingUp, active: !app.route && app.tab === 'home' && app.feed === 'popular', press: () => app.go('home', 'popular') },
    { key: 'communities', label: 'Communities', icon: IconUsersGroup, active: !app.route && app.tab === 'communities', press: () => app.go('communities') },
    { key: 'inbox', label: unread ? `Inbox (${unread})` : 'Inbox', icon: IconBell, active: !app.route && app.tab === 'inbox', press: () => app.go('inbox') },
    { key: 'profile', label: 'Profile', icon: IconUserCircle, active: !app.route && app.tab === 'profile', press: () => app.go('profile') },
  ];
  return (
    <Block w={248} bg={C.white} borderRightWidth={1} borderRightColor={C.line} gap={0}>
      <Block h={56} justify="center" px={16} borderBottomWidth={1} borderBottomColor={C.line}>
        <Logo />
      </Block>
      <ScrollArea flex={1} contentProps={{ p: 12, gap: 2 }}>
        {items.map((item) => (
          <Block
            key={item.key}
            direction="row"
            align="center"
            gap={12}
            px={12}
            py={10}
            radius={10}
            bg={item.active ? C.chip : undefined}
            onPress={item.press}
            accessibilityRole="link"
            accessibilityState={{ selected: item.active }}
          >
            <item.icon size={21} color={C.ink} />
            <Text c={C.ink} fw={item.active ? 'bold' : 'normal'} size={14}>
              {item.label}
            </Text>
          </Block>
        ))}
        <Block gap={0} h={1} bg={C.line} my={10} />
        <Text c={C.muted} fw="bold" size={11} tt="uppercase" lts={0.6} px={12} py={6}>
          Communities
        </Text>
        {COMMUNITIES.filter((item) => app.joined.includes(item.id)).map((community) => {
          const active = app.route?.name === 'community' && app.route.id === community.id;
          return (
            <Block
              key={community.id}
              direction="row"
              align="center"
              gap={10}
              px={12}
              py={7}
              radius={10}
              bg={active ? C.chip : undefined}
              onPress={() => (app.route?.name === 'community' ? app.replace : app.push)({ name: 'community', id: community.id })}
              accessibilityRole="link"
            >
              <CommunityIcon community={community} size={26} />
              <Text c={C.ink} size={13} fw={active ? 'bold' : 'normal'}>
                t/{community.id}
              </Text>
            </Block>
          );
        })}
        <Block direction="row" align="center" gap={10} px={12} py={7} onPress={() => app.go('communities')} accessibilityRole="link">
          <IconCirclePlus size={24} color={C.muted} />
          <Text c={C.muted} size={13}>
            Browse communities
          </Text>
        </Block>
      </ScrollArea>
    </Block>
  );
}

function Shell() {
  const app = useApp();
  const { route } = app;
  const unread = NOTICES.filter((item) => !app.read.includes(item.id)).length;
  const screen = route ? (
    route.name === 'post' ? (
      <PostScreen key={`${route.id}-${route.focus ?? ''}`} id={route.id} focus={route.focus} />
    ) : route.name === 'community' ? (
      <CommunityScreen key={route.id} id={route.id} />
    ) : route.name === 'create' ? (
      <CreateScreen preset={route.community} />
    ) : (
      <SearchScreen />
    )
  ) : app.tab === 'communities' ? (
    <CommunitiesScreen />
  ) : app.tab === 'inbox' ? (
    <InboxScreen />
  ) : app.tab === 'profile' ? (
    <ProfileScreen />
  ) : (
    <HomeScreen />
  );
  const icon = (Glyph: typeof IconHome) => ({ active, color }: { active: boolean; color: string }) => (
    <Glyph size={24} color={color} strokeWidth={active ? 2.3 : 1.7} />
  );
  return (
    <SafeArea gap={0} flex={1} bg={C.bg}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingArea behavior={Platform.OS === 'ios' ? 'padding' : undefined} flex={1} gap={0}>
        <Block flex={1} direction="row" gap={0}>
          {app.wide && <SideNav />}
          <Block flex={1} gap={0}>
            {screen}
          </Block>
        </Block>
      </KeyboardAvoidingArea>
      {!app.wide && !route && (
        <BottomAppBar
          accessibilityLabel="Main"
          activeKey={app.tab}
          onItemPress={(key) => (key === 'create' ? app.push({ name: 'create' }) : app.go(key as Tab))}
          bg={C.white}
          borderColor={C.line}
          activeColor={C.ink}
          inactiveColor={C.muted}
          indicator={false}
          badgeColor={C.orange}
          items={[
            { key: 'home', label: 'Home', icon: icon(IconHome) },
            { key: 'communities', label: 'Communities', icon: icon(IconUsersGroup) },
            { key: 'create', label: 'Create', icon: icon(IconPlus) },
            { key: 'inbox', label: 'Inbox', icon: icon(IconBell), badgeCount: unread },
            { key: 'profile', label: 'You', icon: icon(IconUserCircle) },
          ]}
        />
      )}
      {!!app.toast && (
        <Block position="absolute" left={0} right={0} bottom={!app.wide && !route ? 92 : route?.name === 'post' ? 96 : 24} align="center" pointerEvents="none" zIndex={20}>
          <Block bg={C.ink} radius={20} px={16} py={10} shadow="md">
            <Text c={C.white} fw="semibold" size={13}>
              {app.toast}
            </Text>
          </Block>
        </Block>
      )}
    </SafeArea>
  );
}

function Root() {
  const app = useThreadit();
  return (
    <AppContext.Provider value={app}>
      <Shell />
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <Root />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
