import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IconArrowLeft,
  IconArrowsShuffle,
  IconArrowsSort,
  IconBooks,
  IconChevronDown,
  IconCircleCheckFilled,
  IconCirclePlus,
  IconDevicesPc,
  IconDots,
  IconDownload,
  IconHeartFilled,
  IconHome,
  IconHomeFilled,
  IconLayoutGrid,
  IconList,
  IconListDetails,
  IconPinFilled,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlus,
  IconRepeat,
  IconRepeatOnce,
  IconSearch,
  IconShare,
  IconVolume,
  IconX,
} from '@tabler/icons-react-native';
import { useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Block,
  BottomAppBar,
  Gradient,
  IconButton,
  Input,
  PlocksProvider,
  Row,
  ScrollArea,
  Slider,
  Text,
} from '@plocks/ui-snack';

import {
  ALL_COLLECTIONS,
  ARTISTS,
  COLLECTIONS,
  LIBRARY,
  TRACKS,
  USER_PLAYLISTS,
  formatTime,
  type ArtworkStyle,
  type Collection,
  type CollectionKind,
  type Track,
} from './catalog';

const C = {
  background: '#121212',
  black: '#000000',
  elevated: '#1F1F1F',
  tile: '#2A2A2A',
  highlight: '#3E3E3E',
  green: '#1ED760',
  white: '#FFFFFF',
  muted: '#B3B3B3',
  subdued: '#7C7C7C',
};
const THEME = { colorScheme: 'dark' as const };
const ALL_INDICES = TRACKS.map((_, index) => index);
const SOURCES = TRACKS.map((track) => track.source);
const LIKES_KEY = 'plocks-music-app:likes';
// BottomAppBar's rendered height with labels: 6px item padding ×2 + 26px icon in a 6px pill ×2 + label.
const NAV_HEIGHT = 64;
const MINI_GAP = 6;
const MINI_HEIGHT = 56;
const LIKED_ID = 'liked';
const LIKED_ART: ArtworkStyle = { background: '#5038A0', accent: '#8C7FE0', detail: '#FFFFFF', glyph: '♥' };
const KIND_LABEL: Record<CollectionKind, string> = { playlist: 'Playlist', album: 'Album', artist: 'Artist' };
const FILTERS = [
  { key: 'playlist', label: 'Playlists' },
  { key: 'artist', label: 'Artists' },
  { key: 'album', label: 'Albums' },
  { key: 'downloaded', label: 'Downloaded' },
] as const;
const HOME_CHIPS = ['All', 'Music', 'Artists'] as const;

type Section = 'home' | 'search' | 'library';
type LibraryFilter = (typeof FILTERS)[number]['key'] | null;
type RepeatMode = 'none' | 'all' | 'single';

/** Darken a #RRGGBB color toward black by `amount` (0–1). */
function shade(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * (1 - amount));
  return `#${((1 << 24) | (channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).slice(1)}`;
}

function subtitleFor(item: Collection) {
  if (item.kind === 'artist') return 'Artist';
  return `${KIND_LABEL[item.kind]} · ${item.owner}`;
}

function tracksOf(item: Collection) {
  return item.trackIds.map((id) => TRACKS.find((track) => track.id === id)!);
}

function Artwork({
  art,
  size,
  label,
  round = false,
  radius = 4,
}: {
  art: ArtworkStyle;
  size: number;
  label: string;
  round?: boolean;
  radius?: number;
}) {
  return (
    <Block
      p={0}
      bg={art.background}
      radius={round ? size : radius}
      accessibilityLabel={`${label} artwork`}
      w={size}
      h={size}
      overflow="hidden"
      shrink={0}
    >
      <Block
        direction="row"
        position="absolute"
        w={size * 0.86}
        h={size * 0.86}
        radius={size}
        bg={art.accent}
        top={-size * 0.28}
        right={-size * 0.24}
        opacity={0.86}
      />
      <Block
        direction="row"
        position="absolute"
        w={size * 0.7}
        h={size * 0.7}
        radius={size}
        borderWidth={Math.max(2, size * 0.025)}
        borderColor={art.detail}
        bottom={-size * 0.18}
        left={-size * 0.14}
        opacity={0.75}
      />
      <Text
        c={art.detail}
        size={Math.max(14, size * 0.38)}
        fw="bold"
        position="absolute"
        bottom={size * 0.1}
        right={size * 0.13}
        lh={size * 0.48}
      >
        {art.glyph}
      </Text>
    </Block>
  );
}

function LikedArt({ size }: { size: number }) {
  return (
    <Gradient
      colors={['#450AF5', '#8E8EE5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      w={size}
      h={size}
      radius={4}
      align="center"
      justify="center"
      accessibilityLabel="Liked Songs artwork"
    >
      <IconHeartFilled size={size * 0.38} color={C.white} />
    </Gradient>
  );
}

function Avatar({ size = 32 }: { size?: number }) {
  return (
    <Block bg="#F59B23" radius={size} w={size} h={size} p={0} align="center" justify="center" shrink={0}>
      <Text c={C.black} fw="bold" size={size * 0.45}>
        A
      </Text>
    </Block>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      bg={active ? C.green : C.tile}
      radius={16}
      px={14}
      h={32}
      justify="center"
      p={0}
      shrink={0}
    >
      <Text c={active ? C.black : C.white} size={13} fw="medium">
        {label}
      </Text>
    </Block>
  );
}

function PlayButton({
  playing,
  label,
  onPress,
  size = 48,
}: {
  playing: boolean;
  label: string;
  onPress: () => void;
  size?: number;
}) {
  return (
    <IconButton
      icon={playing ? IconPlayerPauseFilled : IconPlayerPlayFilled}
      variant="filled"
      color={C.green}
      iconColor={C.black}
      radius="full"
      size={size}
      iconSize={Math.round(size * 0.45)}
      accessibilityLabel={`${playing ? 'Pause' : 'Play'} ${label}`}
      onPress={onPress}
    />
  );
}

function Ghost({
  icon,
  label,
  onPress,
  color = C.muted,
  size = 24,
}: {
  icon: Parameters<typeof IconButton>[0]['icon'];
  label: string;
  onPress?: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <IconButton
      icon={icon}
      variant="ghost"
      iconColor={color}
      iconSize={size}
      accessibilityLabel={label}
      onPress={onPress ?? (() => {})}
    />
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text c={C.white} fw="bold" size={22} px={16}>
      {children}
    </Text>
  );
}

function TrackRow({
  track,
  index,
  active,
  liked,
  showArt,
  numbered,
  onPlay,
  onLike,
}: {
  track: Track;
  index: number;
  active: boolean;
  liked: boolean;
  showArt: boolean;
  numbered: boolean;
  onPlay: () => void;
  onLike: () => void;
}) {
  return (
    <Block direction="row" align="center" gap={4} pl={16} pr={4} h={64}>
      <Block
        onPress={onPlay}
        accessibilityRole="button"
        accessibilityLabel={`Play ${track.title} by ${track.artist}`}
        direction="row"
        align="center"
        gap={12}
        flex={1}
        miw={0}
        h="100%"
      >
        {numbered && (
          <Text c={active ? C.green : C.muted} size={15} w={20} ta="center">
            {String(index + 1)}
          </Text>
        )}
        {showArt && <Artwork art={track.art} size={48} label={track.title} radius={2} />}
        <Block direction="column" gap={2} flex={1} miw={0}>
          <Text c={active ? C.green : C.white} size={16} numberOfLines={1}>
            {track.title}
          </Text>
          <Row align="center" gap={6}>
            {active && <IconVolume size={14} color={C.green} />}
            <Text c={C.muted} size={13} numberOfLines={1}>
              {track.artist}
            </Text>
          </Row>
        </Block>
      </Block>
      <Ghost
        icon={liked ? IconCircleCheckFilled : IconCirclePlus}
        color={liked ? C.green : C.muted}
        label={liked ? `Remove ${track.title} from Liked Songs` : `Save ${track.title} to Liked Songs`}
        onPress={onLike}
      />
      <Ghost icon={IconDots} label={`More options for ${track.title}`} size={20} />
    </Block>
  );
}

function CollectionTile({
  item,
  size,
  onPress,
}: {
  item: Collection;
  size: number;
  onPress: () => void;
}) {
  const round = item.kind === 'artist';
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      w={size}
      gap={8}
      direction="column"
    >
      <Artwork art={item.art} size={size} label={item.title} round={round} />
      <Text c={round ? C.white : C.muted} fw={round ? 'semibold' : 'normal'} size={13} numberOfLines={2} ta={round ? 'center' : 'left'}>
        {round ? item.title : `${item.subtitle}`}
      </Text>
    </Block>
  );
}

function Shelf({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Block direction="column" gap={12}>
      <SectionTitle>{title}</SectionTitle>
      <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ direction: 'row', gap: 16, px: 16 }}>
        {children}
      </ScrollArea>
    </Block>
  );
}

function MusicScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= 800;
  const pageWidth = desktop ? Math.min(width - 260 - 16, 1040) : width;
  const playlist = useAudioPlaylist({ sources: SOURCES, updateInterval: 350, loop: 'all' });
  const status = useAudioPlaylistStatus(playlist);
  const [queue, setQueue] = useState<number[]>(ALL_INDICES);
  const [contextId, setContextId] = useState<string>(COLLECTIONS[0].id);
  const [section, setSection] = useState<Section>('home');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [homeChip, setHomeChip] = useState<(typeof HOME_CHIPS)[number]>('All');
  const [filter, setFilter] = useState<LibraryFilter>(null);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [grid, setGrid] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set(['road-trip']));
  const [liked, setLiked] = useState<Set<string>>(() => new Set(['golden-hour', 'blue-apartment']));
  const [likesReady, setLikesReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('all');

  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY)
      .then((stored) => {
        if (stored) {
          const ids: unknown = JSON.parse(stored);
          if (Array.isArray(ids)) setLiked(new Set(ids.filter((id): id is string => typeof id === 'string')));
        }
      })
      .catch(() => {})
      .finally(() => setLikesReady(true));
  }, []);
  useEffect(() => {
    if (likesReady) AsyncStorage.setItem(LIKES_KEY, JSON.stringify([...liked])).catch(() => {});
  }, [liked, likesReady]);

  const activeIndex = queue[status.currentIndex] ?? 0;
  const activeTrack = TRACKS[activeIndex];
  const likedTracks = TRACKS.filter((track) => liked.has(track.id));
  const likedCollection: Collection = {
    id: LIKED_ID,
    kind: 'playlist',
    title: 'Liked Songs',
    owner: 'You',
    subtitle: `${likedTracks.length} songs`,
    description: 'Songs you saved.',
    trackIds: likedTracks.map((track) => track.id),
    art: LIKED_ART,
  };
  const collection =
    collectionId === LIKED_ID ? likedCollection : ALL_COLLECTIONS.find((item) => item.id === collectionId) ?? null;
  const contextTitle =
    contextId === LIKED_ID ? 'Liked Songs' : ALL_COLLECTIONS.find((item) => item.id === contextId)?.title ?? 'Your music';
  const duration = status.duration > 0 ? status.duration : activeTrack.seconds;
  const currentTime = Math.min(status.currentTime, duration);
  const progress = Math.max(0, Math.min(100, (currentTime / Math.max(duration, 1)) * 100));

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? TRACKS.filter((track) =>
          [track.title, track.artist, track.album, track.genre].some((value) => value.toLowerCase().includes(term)),
        )
      : [];
  }, [query]);

  const libraryItems = useMemo(() => {
    const items = LIBRARY.filter((item) =>
      !filter ? true : filter === 'downloaded' ? item.downloaded : item.kind === filter,
    );
    return sortAlpha ? [...items].sort((a, b) => a.title.localeCompare(b.title)) : items;
  }, [filter, sortAlpha]);

  function selectSection(next: string) {
    setSection(next as Section);
    setCollectionId(null);
    setExpanded(false);
  }

  function playTrack(index: number, context: number[] = ALL_INDICES, id = 'all') {
    const sameQueue = context.length === queue.length && context.every((item, position) => item === queue[position]);
    if (!sameQueue) {
      playlist.clear();
      context.forEach((item) => playlist.add(TRACKS[item].source));
      setQueue(context);
    }
    setContextId(id);
    const nextIndex = context.indexOf(index);
    if (nextIndex >= 0) {
      if (sameQueue && nextIndex === status.currentIndex) void playlist.seekTo(0);
      else playlist.skipTo(nextIndex);
      playlist.play();
      setSeekPreview(null);
    }
  }

  function isPlaying(id: string) {
    return contextId === id && status.playing;
  }

  /** Play a collection from the top (or a random track when shuffling), or pause/resume it if it's current. */
  function playCollection(item: Collection) {
    if (contextId === item.id) return togglePlay();
    const indices = tracksOf(item).map((track) => TRACKS.indexOf(track));
    if (!indices.length) return;
    const start = shuffle ? indices[Math.floor(Math.random() * indices.length)] : indices[0];
    playTrack(start, indices, item.id);
  }

  function togglePlay() {
    if (status.playing) playlist.pause();
    else playlist.play();
  }

  function nextTrack() {
    if (shuffle && queue.length > 1) {
      const options = queue.map((_, position) => position).filter((position) => position !== status.currentIndex);
      playlist.skipTo(options[Math.floor(Math.random() * options.length)]);
    } else playlist.next();
    playlist.play();
    setSeekPreview(null);
  }

  function previousTrack() {
    if (status.currentTime > 3) void playlist.seekTo(0);
    else playlist.previous();
    playlist.play();
    setSeekPreview(null);
  }

  function cycleRepeat() {
    const next: RepeatMode = repeat === 'none' ? 'all' : repeat === 'all' ? 'single' : 'none';
    playlist.loop = next;
    setRepeat(next);
  }

  function toggleIn(setter: typeof setLiked, id: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderTracks(tracks: Track[], contextKey: string, options: { showArt?: boolean; numbered?: boolean } = {}) {
    const indices = tracks.map((track) => TRACKS.indexOf(track));
    return tracks.map((track, index) => (
      <TrackRow
        key={track.id}
        track={track}
        index={index}
        active={activeIndex === indices[index] && contextId === contextKey}
        liked={liked.has(track.id)}
        showArt={options.showArt ?? true}
        numbered={options.numbered ?? false}
        onPlay={() => playTrack(indices[index], indices, contextKey)}
        onLike={() => toggleIn(setLiked, track.id)}
      />
    ));
  }

  function renderCollection(item: Collection) {
    const tracks = tracksOf(item);
    const artist = item.kind === 'artist';
    const seconds = tracks.reduce((total, track) => total + track.seconds, 0);
    const artSize = Math.min(pageWidth - 140, 260);
    return (
      <Block direction="column" gap={0}>
        <Gradient colors={[shade(item.art.background, 0.25), C.background]} pt={8} pb={16} px={16} gap={16}>
          <Row>
            <Ghost icon={IconArrowLeft} color={C.white} label="Back" onPress={() => setCollectionId(null)} />
          </Row>
          <Row justify="center">
            {item.id === LIKED_ID ? (
              <LikedArt size={artSize} />
            ) : (
              <Artwork art={item.art} size={artSize} label={item.title} round={artist} />
            )}
          </Row>
          <Block direction="column" gap={8}>
            <Text c={C.white} fw="bold" size={artist ? 32 : 24} ta={artist ? 'center' : 'left'}>
              {item.title}
            </Text>
            {artist ? (
              <Text c={C.muted} size={13} ta="center">
                {(12_400 + item.title.length * 3_115).toLocaleString('en-US')} monthly listeners
              </Text>
            ) : (
              <>
                {item.kind === 'playlist' && item.id !== LIKED_ID && (
                  <Text c={C.muted} size={13}>
                    {item.description}
                  </Text>
                )}
                <Row align="center" gap={8}>
                  {item.owner === 'You' ? <Avatar size={22} /> : <Artwork art={item.art} size={22} label={item.owner} round />}
                  <Text c={C.white} fw="bold" size={13}>
                    {item.owner}
                  </Text>
                </Row>
                <Text c={C.muted} size={13}>
                  {KIND_LABEL[item.kind]} · {tracks.length} {tracks.length === 1 ? 'song' : 'songs'} · {formatTime(seconds)}
                </Text>
              </>
            )}
          </Block>
          <Row fullWidth align="center" justify="space-between">
            <Row align="center" gap={4} ml={-8}>
              {artist ? (
                <Block
                  onPress={() => toggleIn(setSaved, item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={saved.has(item.id) ? `Unfollow ${item.title}` : `Follow ${item.title}`}
                  radius={16}
                  px={16}
                  h={32}
                  p={0}
                  justify="center"
                  ml={8}
                  bg="transparent"
                  borderWidth={1}
                  borderColor={C.subdued}
                >
                  <Text c={C.white} fw="bold" size={13}>
                    {saved.has(item.id) ? 'Following' : 'Follow'}
                  </Text>
                </Block>
              ) : (
                <>
                  <Ghost
                    icon={saved.has(item.id) || item.id === LIKED_ID ? IconCircleCheckFilled : IconCirclePlus}
                    color={saved.has(item.id) || item.id === LIKED_ID ? C.green : C.muted}
                    label={saved.has(item.id) ? 'Remove from Your Library' : 'Save to Your Library'}
                    onPress={() => toggleIn(setSaved, item.id)}
                  />
                  <Ghost
                    icon={IconDownload}
                    color={item.downloaded ? C.green : C.muted}
                    label={item.downloaded ? 'Downloaded' : 'Download'}
                  />
                </>
              )}
              <Ghost icon={IconDots} label={`More options for ${item.title}`} />
            </Row>
            <Row align="center" gap={12}>
              <Ghost
                icon={IconArrowsShuffle}
                color={shuffle ? C.green : C.muted}
                size={26}
                label={shuffle ? 'Turn off shuffle' : 'Turn on shuffle'}
                onPress={() => setShuffle((value) => !value)}
              />
              <PlayButton playing={isPlaying(item.id)} label={item.title} size={56} onPress={() => playCollection(item)} />
            </Row>
          </Row>
        </Gradient>
        {artist && (
          <Text c={C.white} fw="bold" size={20} px={16} pb={4}>
            Popular
          </Text>
        )}
        {tracks.length ? (
          renderTracks(tracks, item.id, { showArt: item.kind !== 'album', numbered: artist })
        ) : (
          <Block direction="column" gap={6} p={32} align="center">
            <Text c={C.white} fw="bold" size={18}>
              Songs you like will appear here
            </Text>
            <Text c={C.muted} size={13} ta="center">
              Save songs by tapping the plus icon.
            </Text>
          </Block>
        )}
      </Block>
    );
  }

  function renderHome() {
    const shortcuts = [likedCollection, ...LIBRARY.slice(0, 7)];
    const tileWidth = Math.floor((pageWidth - 32 - 8) / 2);
    const featured = COLLECTIONS[0];
    const showMusic = homeChip !== 'Artists';
    const showArtists = homeChip !== 'Music';
    return (
      <Block direction="column" gap={28}>
        <Row align="center" gap={8} px={16}>
          {!desktop && <Avatar />}
          {HOME_CHIPS.map((chip) => (
            <Pill key={chip} label={chip} active={homeChip === chip} onPress={() => setHomeChip(chip)} />
          ))}
        </Row>
        <Block direction="row" wrap="wrap" gap={8} px={16}>
          {shortcuts.map((item) => (
            <Block
              key={item.id}
              onPress={() => setCollectionId(item.id)}
              accessibilityLabel={`Open ${item.title}`}
              w={tileWidth}
              h={56}
              p={0}
              radius={4}
              bg={C.tile}
              overflow="hidden"
              direction="row"
              align="center"
              gap={8}
            >
              {item.id === LIKED_ID ? (
                <LikedArt size={56} />
              ) : (
                <Artwork art={item.art} size={56} label={item.title} radius={0} />
              )}
              <Text c={C.white} fw="bold" size={12} numberOfLines={2} flex={1}>
                {item.title}
              </Text>
              {isPlaying(item.id) && (
                <Block pr={8}>
                  <IconVolume size={16} color={C.green} />
                </Block>
              )}
            </Block>
          ))}
        </Block>
        {showMusic && (
          <Block direction="column" gap={12} px={16}>
            <Text c={C.muted} size={13}>
              Picked for your morning
            </Text>
            <Block bg={C.tile} radius={8} p={0} overflow="hidden">
              <Row gap={0}>
                <Artwork art={featured.art} size={136} label={featured.title} radius={0} />
                <Block direction="column" flex={1} p={12} gap={4} justify="space-between">
                  <Block direction="column" gap={4}>
                    <Text c={C.white} fw="bold" size={16} numberOfLines={1}>
                      {featured.title}
                    </Text>
                    <Text c={C.muted} size={12} numberOfLines={2}>
                      {featured.description}
                    </Text>
                  </Block>
                  <Row fullWidth align="center" justify="space-between">
                    <Ghost
                      icon={saved.has(featured.id) ? IconCircleCheckFilled : IconCirclePlus}
                      color={saved.has(featured.id) ? C.green : C.muted}
                      label={saved.has(featured.id) ? 'Remove from Your Library' : 'Save to Your Library'}
                      onPress={() => toggleIn(setSaved, featured.id)}
                    />
                    <PlayButton
                      playing={isPlaying(featured.id)}
                      label={featured.title}
                      size={40}
                      onPress={() => playCollection(featured)}
                    />
                  </Row>
                </Block>
              </Row>
            </Block>
          </Block>
        )}
        {showMusic && (
          <Shelf title="Made for you">
            {COLLECTIONS.map((item) => (
              <CollectionTile key={item.id} item={item} size={150} onPress={() => setCollectionId(item.id)} />
            ))}
          </Shelf>
        )}
        {showArtists && (
          <Shelf title="Your favorite artists">
            {ARTISTS.map((item) => (
              <CollectionTile key={item.id} item={item} size={130} onPress={() => setCollectionId(item.id)} />
            ))}
          </Shelf>
        )}
        {showMusic && (
          <Shelf title="Your playlists">
            {USER_PLAYLISTS.map((item) => (
              <CollectionTile key={item.id} item={item} size={150} onPress={() => setCollectionId(item.id)} />
            ))}
          </Shelf>
        )}
      </Block>
    );
  }

  function renderSearch() {
    const categories = [...COLLECTIONS, ...USER_PLAYLISTS];
    const tileWidth = Math.floor((pageWidth - 32 - 12) / 2);
    const term = query.trim().toLowerCase();
    const matches = term ? ALL_COLLECTIONS.filter((item) => item.title.toLowerCase().includes(term)) : [];
    return (
      <Block direction="column" gap={20}>
        <Row fullWidth align="center" gap={12} px={16}>
          {!desktop && <Avatar />}
          <Text c={C.white} fw="bold" size={24}>
            Search
          </Text>
        </Row>
        <Block direction="row" align="center" gap={10} mx={16} px={12} h={48} radius={6} bg={C.white}>
          <IconSearch size={22} color={C.black} />
          <Block flex={1}>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="What do you want to listen to?"
              variant="unstyled"
              inputColor={C.black}
              inputFontSize={15}
              accessibilityLabel="Search songs, artists, and playlists"
            />
          </Block>
        </Block>
        {term ? (
          <Block direction="column" gap={0}>
            {matches.map(renderLibraryRow)}
            {renderTracks(searchResults, 'search')}
            {!matches.length && !searchResults.length && (
              <Block direction="column" gap={6} p={32} align="center">
                <Text c={C.white} fw="bold" size={18} ta="center">
                  {`Couldn't find "${query.trim()}"`}
                </Text>
                <Text c={C.muted} size={13} ta="center">
                  Try searching again using a different spelling or keyword.
                </Text>
              </Block>
            )}
          </Block>
        ) : (
          <Block direction="column" gap={12} px={16}>
            <Text c={C.white} fw="bold" size={16}>
              Browse all
            </Text>
            <Block direction="row" wrap="wrap" gap={12}>
              {categories.map((item) => (
                <Block
                  key={item.id}
                  onPress={() => setCollectionId(item.id)}
                  accessibilityLabel={`Browse ${item.title}`}
                  w={tileWidth}
                  h={96}
                  radius={6}
                  bg={shade(item.art.background, 0.15)}
                  p={12}
                  overflow="hidden"
                >
                  <Text c={C.white} fw="bold" size={16} maw={tileWidth - 70}>
                    {item.title}
                  </Text>
                  <Block position="absolute" right={-14} bottom={-8}>
                    <Artwork art={item.art} size={68} label={item.title} />
                  </Block>
                </Block>
              ))}
            </Block>
          </Block>
        )}
      </Block>
    );
  }

  function renderLibraryRow(item: Collection) {
    const playingHere = contextId === item.id;
    return (
      <Block
        key={item.id}
        onPress={() => setCollectionId(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        direction="row"
        align="center"
        gap={12}
        px={16}
        py={8}
      >
        {item.id === LIKED_ID ? (
          <LikedArt size={64} />
        ) : (
          <Artwork art={item.art} size={64} label={item.title} round={item.kind === 'artist'} />
        )}
        <Block direction="column" gap={4} flex={1} miw={0}>
          <Text c={playingHere ? C.green : C.white} size={16} numberOfLines={1}>
            {item.title}
          </Text>
          <Row align="center" gap={6}>
            {item.id === LIKED_ID && <IconPinFilled size={14} color={C.green} />}
            {item.downloaded && <IconDownload size={14} color={C.green} />}
            <Text c={C.muted} size={13} numberOfLines={1}>
              {item.id === LIKED_ID ? `Playlist · ${likedTracks.length} songs` : subtitleFor(item)}
            </Text>
          </Row>
        </Block>
        {playingHere && status.playing && <IconVolume size={18} color={C.green} />}
      </Block>
    );
  }

  function renderLibrary() {
    const items = filter && filter !== 'playlist' ? libraryItems : [likedCollection, ...libraryItems];
    const tileWidth = Math.floor((pageWidth - 32 - 32) / 3);
    return (
      <Block direction="column" gap={12}>
        <Row fullWidth align="center" gap={12} px={16}>
          {!desktop && <Avatar />}
          <Text c={C.white} fw="bold" size={24} flex={1}>
            Your Library
          </Text>
          <Ghost icon={IconSearch} color={C.white} label="Search in Your Library" onPress={() => selectSection('search')} />
          <Ghost icon={IconPlus} color={C.white} label="Create playlist" />
        </Row>
        <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ direction: 'row', gap: 8, px: 16 }}>
          {filter && (
            <Block
              onPress={() => setFilter(null)}
              accessibilityRole="button"
              accessibilityLabel="Clear filter"
              bg={C.tile}
              radius={16}
              w={32}
              h={32}
              p={0}
              align="center"
              justify="center"
            >
              <IconX size={16} color={C.white} />
            </Block>
          )}
          {FILTERS.filter((item) => !filter || item.key === filter).map((item) => (
            <Pill
              key={item.key}
              label={item.label}
              active={filter === item.key}
              onPress={() => setFilter(filter === item.key ? null : item.key)}
            />
          ))}
        </ScrollArea>
        <Row fullWidth align="center" justify="space-between" pl={8} pr={4}>
          <Block
            onPress={() => setSortAlpha((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sortAlpha ? 'recents' : 'alphabetical'}`}
            bg="transparent"
            p={8}
            direction="row"
            align="center"
            gap={8}
          >
            <IconArrowsSort size={16} color={C.white} />
            <Text c={C.white} size={13} fw="medium">
              {sortAlpha ? 'Alphabetical' : 'Recents'}
            </Text>
          </Block>
          <Ghost
            icon={grid ? IconList : IconLayoutGrid}
            color={C.white}
            size={18}
            label={grid ? 'Show as list' : 'Show as grid'}
            onPress={() => setGrid((value) => !value)}
          />
        </Row>
        {grid ? (
          <Block direction="row" wrap="wrap" gap={16} px={16}>
            {items.map((item) => (
              <Block
                key={item.id}
                onPress={() => setCollectionId(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}`}
                w={tileWidth}
                direction="column"
                gap={6}
              >
                {item.id === LIKED_ID ? (
                  <LikedArt size={tileWidth} />
                ) : (
                  <Artwork art={item.art} size={tileWidth} label={item.title} round={item.kind === 'artist'} />
                )}
                <Block direction="column" gap={2}>
                  <Text c={contextId === item.id ? C.green : C.white} size={13} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text c={C.muted} size={12} numberOfLines={1}>
                    {item.id === LIKED_ID ? `${likedTracks.length} songs` : subtitleFor(item)}
                  </Text>
                </Block>
              </Block>
            ))}
          </Block>
        ) : (
          <Block direction="column" gap={0}>
            {items.map(renderLibraryRow)}
          </Block>
        )}
      </Block>
    );
  }

  function renderContent() {
    if (collection) return renderCollection(collection);
    if (section === 'search') return renderSearch();
    if (section === 'library') return renderLibrary();
    return renderHome();
  }

  if (expanded) {
    const artSize = Math.min(width - 48, 420);
    const isLiked = liked.has(activeTrack.id);
    return (
      <Gradient
        colors={[shade(activeTrack.art.background, 0.3), shade(activeTrack.art.background, 0.75), C.background]}
        locations={[0, 0.55, 1]}
        flex={1}
        pt={insets.top + 8}
        pb={insets.bottom + 20}
        px={24}
        align="center"
      >
        <StatusBar barStyle="light-content" />
        <Block direction="column" flex={1} w="100%" maw={480} gap={0}>
          <Row fullWidth align="center" justify="space-between" ml={-8} mr={-8}>
            <Ghost icon={IconChevronDown} color={C.white} label="Close now playing" onPress={() => setExpanded(false)} />
            <Block direction="column" align="center" gap={0} flex={1} miw={0}>
              <Text c={C.white} size={10} lts={1} tt="uppercase">
                Playing from {contextId === 'search' ? 'search' : contextId === LIKED_ID ? 'your library' : 'playlist'}
              </Text>
              <Text c={C.white} fw="bold" size={13} numberOfLines={1}>
                {contextId === 'search' ? 'Search results' : contextTitle}
              </Text>
            </Block>
            <Ghost icon={IconDots} color={C.white} label="More options" />
          </Row>
          <Block flex={1} align="center" justify="center" py={16}>
            <Artwork art={activeTrack.art} size={artSize} label={activeTrack.title} radius={8} />
          </Block>
          <Block direction="column" gap={16}>
            <Row fullWidth align="center" gap={12}>
              <Block direction="column" gap={2} flex={1} miw={0}>
                <Text c={C.white} fw="bold" size={22} numberOfLines={1}>
                  {activeTrack.title}
                </Text>
                <Text c={C.muted} size={16} numberOfLines={1}>
                  {activeTrack.artist}
                </Text>
              </Block>
              <Ghost
                icon={isLiked ? IconCircleCheckFilled : IconCirclePlus}
                color={isLiked ? C.green : C.white}
                size={28}
                label={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                onPress={() => toggleIn(setLiked, activeTrack.id)}
              />
            </Row>
            <Block direction="column" gap={2}>
              <Slider
                min={0}
                max={duration}
                step={0.1}
                value={seekPreview ?? currentTime}
                onChange={setSeekPreview}
                onChangeEnd={(value) => {
                  void playlist.seekTo(value);
                  setSeekPreview(null);
                }}
                activeTrackColor={C.white}
                trackColor="rgba(255,255,255,0.3)"
                thumbColor={C.white}
                trackSize={4}
                thumbSize={12}
                tooltip="never"
                valueLabel={null}
                accessibilityLabel="Playback position"
              />
              <Row fullWidth justify="space-between">
                <Text c={C.muted} size={11}>
                  {formatTime(seekPreview ?? currentTime)}
                </Text>
                <Text c={C.muted} size={11}>
                  -{formatTime(duration - (seekPreview ?? currentTime))}
                </Text>
              </Row>
            </Block>
            <Row fullWidth align="center" justify="space-between" ml={-8} mr={-8}>
              <Ghost
                icon={IconArrowsShuffle}
                color={shuffle ? C.green : C.white}
                size={26}
                label={shuffle ? 'Turn off shuffle' : 'Turn on shuffle'}
                onPress={() => setShuffle((value) => !value)}
              />
              <Ghost icon={IconPlayerSkipBackFilled} color={C.white} size={34} label="Previous track" onPress={previousTrack} />
              <IconButton
                icon={status.playing ? IconPlayerPauseFilled : IconPlayerPlayFilled}
                variant="filled"
                color={C.white}
                iconColor={C.black}
                radius="full"
                size={68}
                iconSize={30}
                accessibilityLabel={status.playing ? 'Pause' : 'Play'}
                onPress={togglePlay}
              />
              <Ghost icon={IconPlayerSkipForwardFilled} color={C.white} size={34} label="Next track" onPress={nextTrack} />
              <Ghost
                icon={repeat === 'single' ? IconRepeatOnce : IconRepeat}
                color={repeat === 'none' ? C.white : C.green}
                size={26}
                label={`Repeat: ${repeat === 'none' ? 'off' : repeat === 'all' ? 'all' : 'one'}`}
                onPress={cycleRepeat}
              />
            </Row>
            <Row fullWidth align="center" justify="space-between" ml={-8} mr={-8}>
              <Ghost icon={IconDevicesPc} size={20} label="Connect to a device" />
              <Row gap={8}>
                <Ghost icon={IconShare} size={20} label="Share" />
                <Ghost icon={IconListDetails} size={20} label="Queue" />
              </Row>
            </Row>
          </Block>
        </Block>
      </Gradient>
    );
  }

  const navBottom = desktop ? 0 : NAV_HEIGHT + insets.bottom;
  const miniPlayer = (
    <Block position="absolute" left={desktop ? 268 : 8} right={8} bottom={navBottom + (desktop ? 8 : MINI_GAP)} align="center">
      <Block
        bg={shade(activeTrack.art.background, 0.55)}
        radius={6}
        p={0}
        h={MINI_HEIGHT}
        w="100%"
        maw={desktop ? 720 : undefined}
        overflow="hidden"
      >
        <Block direction="row" align="center" gap={8} flex={1} pl={8} pr={4}>
          <Block
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`Open now playing: ${activeTrack.title} by ${activeTrack.artist}`}
            direction="row"
            align="center"
            gap={10}
            flex={1}
            miw={0}
          >
            <Artwork art={activeTrack.art} size={40} label={activeTrack.title} />
            <Block direction="column" gap={0} flex={1} miw={0}>
              <Text c={C.white} fw="bold" size={13} numberOfLines={1}>
                {activeTrack.title}
              </Text>
              <Text c={C.muted} size={12} numberOfLines={1}>
                {activeTrack.artist}
              </Text>
            </Block>
          </Block>
          <Ghost icon={IconDevicesPc} color={C.muted} size={22} label="Connect to a device" />
          {desktop && (
            <Ghost icon={IconPlayerSkipBackFilled} color={C.white} size={22} label="Previous track" onPress={previousTrack} />
          )}
          <Ghost
            icon={status.playing ? IconPlayerPauseFilled : IconPlayerPlayFilled}
            color={C.white}
            size={26}
            label={status.playing ? 'Pause' : 'Play'}
            onPress={togglePlay}
          />
          {desktop && (
            <Ghost icon={IconPlayerSkipForwardFilled} color={C.white} size={22} label="Next track" onPress={nextTrack} />
          )}
        </Block>
        <Block h={2} mx={8} bg="rgba(255,255,255,0.25)" radius={2}>
          <Block h={2} w={`${progress}%` as `${number}%`} bg={C.white} radius={2} />
        </Block>
      </Block>
    </Block>
  );

  return (
    <Block flex={1} bg={C.background} pt={insets.top} gap={0}>
      <StatusBar barStyle="light-content" />
      <Block direction="row" flex={1} mih={0}>
        {desktop && (
          <Block direction="column" w={260} p={8} gap={8} bg={C.black}>
            <Block bg={C.background} radius={8} p={8} gap={4}>
              {(
                [
                  ['home', 'Home', IconHomeFilled],
                  ['search', 'Search', IconSearch],
                  ['library', 'Your Library', IconBooks],
                ] as const
              ).map(([key, label, Glyph]) => (
                <Block
                  key={key}
                  onPress={() => selectSection(key)}
                  accessibilityLabel={label}
                  bg="transparent"
                  p={10}
                  direction="row"
                  align="center"
                  gap={16}
                >
                  <Glyph size={24} color={section === key ? C.white : C.muted} />
                  <Text c={section === key ? C.white : C.muted} fw="bold" size={15}>
                    {label}
                  </Text>
                </Block>
              ))}
            </Block>
            <Block bg={C.background} radius={8} p={0} flex={1} overflow="hidden">
              <ScrollArea contentProps={{ py: 8 }}>
                {[likedCollection, ...LIBRARY].map(renderLibraryRow)}
              </ScrollArea>
            </Block>
          </Block>
        )}
        <ScrollArea
          flex={1}
          contentProps={{ pt: collection ? 0 : 12, pb: MINI_HEIGHT + navBottom + MINI_GAP + 24, align: 'center' }}
        >
          <Block direction="column" w="100%" maw={1040} gap={0}>
            {renderContent()}
          </Block>
        </ScrollArea>
      </Block>
      {miniPlayer}
      {!desktop && (
        <BottomAppBar
          accessibilityLabel="Main"
          activeKey={section}
          onItemPress={selectSection}
          bg="rgba(0,0,0,0.92)"
          withBorder={false}
          indicator={false}
          activeColor={C.white}
          inactiveColor={C.muted}
          items={[
            {
              key: 'home',
              label: 'Home',
              icon: ({ active, color }) =>
                active ? <IconHomeFilled size={26} color={color} /> : <IconHome size={26} color={color} />,
            },
            {
              key: 'search',
              label: 'Search',
              icon: ({ active, color }) => <IconSearch size={26} color={color} strokeWidth={active ? 2.75 : 2} />,
            },
            {
              key: 'library',
              label: 'Your Library',
              icon: ({ active, color }) => <IconBooks size={26} color={color} strokeWidth={active ? 2.75 : 2} />,
            },
          ]}
        />
      )}
    </Block>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={THEME}>
        <MusicScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
