import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Carousel } from '@plocks/carousel';
import { useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Column, Flex, Icon, IconButton, Input, PlocksProvider, Row, Slider, Text, Title } from '@plocks/ui-snack';

import { COLLECTIONS, TRACKS, formatTime, type ArtworkStyle, type Collection, type Track } from './catalog';

const COLORS = {
  background: '#000000',
  sidebar: '#000000',
  surface: '#181818',
  surfaceHover: '#282828',
  line: '#292929',
  green: '#1ED760',
  white: '#FFFFFF',
  muted: '#B3B3B3',
};
const THEME = { colorScheme: 'dark' as const };
const ALL_INDICES = TRACKS.map((_, index) => index);
const SOURCES = TRACKS.map((track) => track.source);
const LIKES_KEY = 'plocks-music-app:likes';

type Section = 'home' | 'search' | 'library';

function Artwork({ art, size, label }: { art: ArtworkStyle; size: number; label: string }) {
  return (
    <Card
      padding={0}
      bg={art.background}
      radius="md"
      accessibilityLabel={`${label} artwork`}
      style={{ width: size, height: size, overflow: 'hidden', flexShrink: 0 }}
    >
      <Flex style={{ position: 'absolute', width: size * 0.86, height: size * 0.86, borderRadius: size,
        backgroundColor: art.accent, top: -size * 0.28, right: -size * 0.24, opacity: 0.86 }} />
      <Flex style={{ position: 'absolute', width: size * 0.7, height: size * 0.7, borderRadius: size,
        borderWidth: Math.max(2, size * 0.025), borderColor: art.detail,
        bottom: -size * 0.18, left: -size * 0.14, opacity: 0.75 }} />
      <Text c={art.detail} size={Math.max(24, size * 0.38)} fw="bold"
        style={{ position: 'absolute', bottom: size * 0.1, right: size * 0.13, lineHeight: size * 0.48 }}>
        {art.glyph}
      </Text>
    </Card>
  );
}

function NavItem({ icon, label, active, onPress, compact = false }: {
  icon: string; label: string; active: boolean; onPress: () => void; compact?: boolean;
}) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={label}
      padding={compact ? 6 : 'sm'}
      bg={active ? COLORS.surfaceHover : 'transparent'}
      radius="md"
      style={{ flex: compact ? 1 : undefined }}
    >
      <Flex direction={compact ? 'column' : 'row'} align="center" justify={compact ? 'center' : 'flex-start'} gap={compact ? 2 : 'sm'}>
        <Icon name={icon} size={compact ? 22 : 20} color={active ? COLORS.green : COLORS.muted} />
        <Text c={active ? COLORS.white : COLORS.muted} fw={active ? 'bold' : 'medium'} size={compact ? 11 : 14}>
          {label}
        </Text>
      </Flex>
    </Card>
  );
}

function TrackRow({ track, index, active, liked, onPlay, onLike }: {
  track: Track; index: number; active: boolean; liked: boolean; onPlay: () => void; onLike: () => void;
}) {
  return (
    <Flex direction="row" align="center" gap="xs" style={{ width: '100%' }}>
      <Card
        onPress={onPlay}
        accessibilityLabel={`Play ${track.title} by ${track.artist}`}
        padding="sm"
        bg={active ? COLORS.surfaceHover : 'transparent'}
        radius="md"
        style={{ flex: 1, minWidth: 0 }}
      >
        <Row align="center" gap="sm" style={{ width: '100%' }}>
          <Text c={active ? COLORS.green : COLORS.muted} size={13} ta="center" style={{ width: 18 }}>
            {active ? '♪' : String(index + 1)}
          </Text>
          <Artwork art={track.art} size={45} label={track.title} />
          <Column gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Text c={active ? COLORS.green : COLORS.white} fw="semibold" size={14} numberOfLines={1}>{track.title}</Text>
            <Text c={COLORS.muted} size={12} numberOfLines={1}>{track.artist} · {track.album}</Text>
          </Column>
          <Text c={COLORS.muted} size={12}>{formatTime(track.seconds)}</Text>
        </Row>
      </Card>
      <IconButton
        icon="heart"
        iconVariant={liked ? 'filled' : 'outlined'}
        iconColor={liked ? COLORS.green : COLORS.muted}
        variant="ghost"
        size="sm"
        accessibilityLabel={liked ? `Remove ${track.title} from liked songs` : `Like ${track.title}`}
        onPress={onLike}
      />
    </Flex>
  );
}

function CollectionTile({ collection, onPress, artSize }: { collection: Collection; onPress: () => void; artSize: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${collection.title} playlist`}
      style={{ width: artSize }}
    >
      <Column gap="xs">
        <Artwork art={collection.art} size={artSize} label={collection.title} />
        <Column gap={2}>
          <Text c={COLORS.white} fw="bold" size={15} numberOfLines={1}>{collection.title}</Text>
          <Text c={COLORS.muted} size={12} numberOfLines={2}>{collection.subtitle}</Text>
        </Column>
      </Column>
    </Pressable>
  );
}

function MusicScreen() {
  const { width } = useWindowDimensions();
  const desktop = width >= 800;
  const compact = width < 560;
  const carouselItemsPerPage = width >= 1080 ? 4 : compact ? 2 : 3;
  const contentWidth = desktop ? Math.min(width - 235 - 68, 1040) : width - (compact ? 36 : 68);
  const carouselArtSize = Math.min(220, Math.floor((contentWidth - 16 * (carouselItemsPerPage - 1)) / carouselItemsPerPage));
  const playlist = useAudioPlaylist({ sources: SOURCES, updateInterval: 350, loop: 'all' });
  const status = useAudioPlaylistStatus(playlist);
  const [queue, setQueue] = useState<number[]>(ALL_INDICES);
  const [section, setSection] = useState<Section>('home');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [liked, setLiked] = useState<Set<string>>(() => new Set(['golden-hour', 'blue-apartment']));
  const [likesReady, setLikesReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY)
      .then((saved) => {
        if (saved) {
          const ids: unknown = JSON.parse(saved);
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
  const collection = COLLECTIONS.find((item) => item.id === collectionId) ?? null;
  const duration = status.duration > 0 ? status.duration : activeTrack.seconds;
  const currentTime = Math.min(status.currentTime, duration);
  const progress = Math.max(0, Math.min(100, (currentTime / Math.max(duration, 1)) * 100));

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? TRACKS.filter((track) => [track.title, track.artist, track.album, track.genre]
          .some((value) => value.toLowerCase().includes(term)))
      : TRACKS;
  }, [query]);

  function selectSection(next: Section) {
    setSection(next);
    setCollectionId(null);
    setExpanded(false);
  }

  function playTrack(index: number, context: number[] = ALL_INDICES) {
    const sameQueue = context.length === queue.length && context.every((item, position) => item === queue[position]);
    if (!sameQueue) {
      playlist.clear();
      context.forEach((item) => playlist.add(TRACKS[item].source));
      setQueue(context);
    }
    const nextIndex = context.indexOf(index);
    if (nextIndex >= 0) {
      if (sameQueue && nextIndex === status.currentIndex) void playlist.seekTo(0);
      else playlist.skipTo(nextIndex);
      playlist.play();
      setSeekPreview(null);
    }
  }

  function togglePlay() {
    if (status.playing) playlist.pause();
    else playlist.play();
  }

  function nextTrack() {
    playlist.next();
    playlist.play();
    setSeekPreview(null);
  }

  function previousTrack() {
    if (status.currentTime > 3) void playlist.seekTo(0);
    else playlist.previous();
    playlist.play();
    setSeekPreview(null);
  }

  function toggleLike(id: string) {
    setLiked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderTracks(tracks: Track[], context: number[] = ALL_INDICES) {
    return tracks.map((track, index) => {
      const globalIndex = TRACKS.findIndex((item) => item.id === track.id);
      return (
        <TrackRow
          key={track.id}
          track={track}
          index={index}
          active={activeIndex === globalIndex && status.playing}
          liked={liked.has(track.id)}
          onPlay={() => playTrack(globalIndex, context)}
          onLike={() => toggleLike(track.id)}
        />
      );
    });
  }

  function renderContent() {
    if (collection) {
      const tracks = collection.trackIds.map((id) => TRACKS.find((track) => track.id === id)!);
      const indices = tracks.map((track) => TRACKS.indexOf(track));
      return (
        <Column gap="xl">
          <Button title="←  Back" variant="ghost" color={COLORS.muted} size="sm" onPress={() => setCollectionId(null)} />
          <Flex direction="row" wrap="wrap" align="flex-end" gap="xl">
            <Artwork art={collection.art} size={compact ? 180 : 222} label={collection.title} />
            <Column gap="sm" style={{ flex: 1, minWidth: 220 }}>
              <Text c={COLORS.green} fw="bold" size={11} lts={2}>FREQUENCY PLAYLIST</Text>
              <Title order={1} style={{ color: COLORS.white, fontSize: compact ? 34 : 54 }}>{collection.title}</Title>
              <Text c={COLORS.muted}>{collection.description}</Text>
              <Text c={COLORS.muted} size={12}>{tracks.length} songs · original demo loops</Text>
              <Button title="Play playlist" variant="filled" color={COLORS.green} textColor={COLORS.background}
                onPress={() => playTrack(indices[0], indices)} />
            </Column>
          </Flex>
          <Column gap="xs">{renderTracks(tracks, indices)}</Column>
        </Column>
      );
    }

    if (section === 'search') {
      return (
        <Column gap="xl">
          <Column gap="xs">
            <Text c={COLORS.green} fw="bold" size={11} lts={2}>EXPLORE</Text>
            <Title order={1} style={{ color: COLORS.white }}>Search</Title>
            <Text c={COLORS.muted}>Find a song, artist, album, or mood.</Text>
          </Column>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="What do you want to hear?"
            startSection={<Icon name="search" size={18} color={COLORS.muted} />}
            variant="filled"
            accessibilityLabel="Search songs and artists"
          />
          {!query.trim() && (
            <Column gap="md">
              <Text c={COLORS.white} fw="bold" size={19}>Browse moods</Text>
              <Flex direction="row" wrap="wrap" gap="md">
                {COLLECTIONS.map((item) => (
                  <CollectionTile key={item.id} collection={item} artSize={carouselArtSize} onPress={() => setCollectionId(item.id)} />
                ))}
              </Flex>
            </Column>
          )}
          <Column gap="sm">
            <Text c={COLORS.white} fw="bold" size={19}>{query.trim() ? 'Results' : 'All songs'}</Text>
            {searchResults.length ? renderTracks(searchResults) : (
              <Card bg={COLORS.surface} padding="xl">
                <Text c={COLORS.muted}>No matches yet. Try another title or mood.</Text>
              </Card>
            )}
          </Column>
        </Column>
      );
    }

    if (section === 'library') {
      const tracks = TRACKS.filter((track) => liked.has(track.id));
      const indices = tracks.map((track) => TRACKS.indexOf(track));
      return (
        <Column gap="xl">
          <Column gap="xs">
            <Text c={COLORS.green} fw="bold" size={11} lts={2}>YOUR COLLECTION</Text>
            <Title order={1} style={{ color: COLORS.white }}>Your Library</Title>
            <Text c={COLORS.muted}>The tracks you want to keep close.</Text>
          </Column>
          <Card bg={COLORS.surfaceHover} padding="lg" radius="lg">
            <Row align="center" gap="lg">
              <Artwork art={{ background: '#7767AB', accent: '#C5B9F4', detail: '#343057', glyph: '♥' }} size={compact ? 78 : 110} label="Liked Songs" />
              <Column gap="xs" style={{ flex: 1 }}>
                <Text c={COLORS.white} fw="bold" size={compact ? 19 : 26}>Liked Songs</Text>
                <Text c={COLORS.muted} size={13}>{tracks.length} saved {tracks.length === 1 ? 'track' : 'tracks'}</Text>
              </Column>
              {tracks.length > 0 && <IconButton icon="play" iconVariant="filled" variant="filled" color={COLORS.green} radius="full"
                accessibilityLabel="Play liked songs" onPress={() => playTrack(indices[0], indices)} />}
            </Row>
          </Card>
          {tracks.length ? <Column gap="xs">{renderTracks(tracks, indices)}</Column> : (
            <Card bg={COLORS.surface} padding="xl">
              <Column gap="sm">
                <Text c={COLORS.white} fw="bold">Start your collection</Text>
                <Text c={COLORS.muted}>Tap a heart beside any song to save it here.</Text>
                <Button title="Explore music" variant="outline" color={COLORS.green} onPress={() => selectSection('search')} />
              </Column>
            </Card>
          )}
        </Column>
      );
    }

    const featured = COLLECTIONS[0];
    return (
      <Column gap="xl">
        <Column gap="xs">
          <Text c={COLORS.green} fw="bold" size={11} lts={2}>GOOD TO HAVE YOU HERE</Text>
          <Title order={1} style={{ color: COLORS.white, fontSize: compact ? 32 : 43 }}>Find your frequency.</Title>
          <Text c={COLORS.muted}>A little music for wherever you are.</Text>
        </Column>
        <Card bg={COLORS.surface} padding={compact ? 'md' : 'xl'} radius="xl" style={{ overflow: 'hidden' }}>
          <Flex direction="row" wrap="wrap" align="center" justify="space-between" gap="lg">
            <Column gap="md" style={{ flex: 1, minWidth: 210 }}>
              <Text c={COLORS.green} fw="bold" size={11} lts={2}>FEATURED PLAYLIST</Text>
              <Title order={2} style={{ color: COLORS.white, fontSize: compact ? 28 : 38 }}>Slow Mornings</Title>
              <Text c={COLORS.muted} size={14}>Warm chords, open windows, and nowhere else to be.</Text>
              <Flex direction="row" wrap="wrap" gap="sm">
                <Button title="Play now" variant="filled" color={COLORS.green} textColor={COLORS.background}
                  onPress={() => playTrack(0, featured.trackIds.map((id) => TRACKS.findIndex((track) => track.id === id)))} />
                <Button title="View playlist" variant="outline" color={COLORS.green} onPress={() => setCollectionId(featured.id)} />
              </Flex>
            </Column>
            <Artwork art={featured.art} size={compact ? 130 : 226} label={featured.title} />
          </Flex>
        </Card>
        <Column gap="md">
          <Text c={COLORS.white} fw="bold" size={20}>Made for this moment</Text>
          <Carousel
            h={carouselArtSize + 72}
            itemsPerPage={carouselItemsPerPage}
            slidesToScroll={1}
            slideGap={16}
            loop={false}
            showArrows={!compact}
            showDots={compact}
            accessibilityLabel="Made for this moment playlists"
          >
            {COLLECTIONS.map((item) => (
              <CollectionTile key={item.id} collection={item} artSize={carouselArtSize} onPress={() => setCollectionId(item.id)} />
            ))}
          </Carousel>
        </Column>
        <Column gap="sm">
          <Text c={COLORS.white} fw="bold" size={20}>Fresh on rotation</Text>
          {renderTracks(TRACKS)}
        </Column>
      </Column>
    );
  }

  if (expanded) {
    const artSize = Math.min(width - 80, 360);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, paddingBottom: 54 }}>
          <Column gap="xl" style={{ width: '100%', maxWidth: 480 }}>
            <Row align="center" justify="space-between">
              <IconButton icon="chevron-down" variant="ghost" iconColor={COLORS.white}
                accessibilityLabel="Close now playing" onPress={() => setExpanded(false)} />
              <Text c={COLORS.white} fw="bold" size={12} lts={2}>NOW PLAYING</Text>
              <Flex style={{ width: 40 }} />
            </Row>
            <Flex justify="center"><Artwork art={activeTrack.art} size={artSize} label={activeTrack.title} /></Flex>
            <Row align="center" justify="space-between" gap="sm">
              <Column gap={2} style={{ flex: 1 }}>
                <Text c={COLORS.white} fw="bold" size={28} numberOfLines={1}>{activeTrack.title}</Text>
                <Text c={COLORS.muted} size={16}>{activeTrack.artist}</Text>
              </Column>
              <IconButton icon="heart" iconVariant={liked.has(activeTrack.id) ? 'filled' : 'outlined'}
                iconColor={liked.has(activeTrack.id) ? COLORS.green : COLORS.white} variant="ghost"
                accessibilityLabel={liked.has(activeTrack.id) ? 'Unlike current song' : 'Like current song'}
                onPress={() => toggleLike(activeTrack.id)} />
            </Row>
            <Column gap="xs">
              <Slider min={0} max={duration} step={0.1} value={seekPreview ?? currentTime}
                onChange={setSeekPreview} onChangeEnd={(value) => { void playlist.seekTo(value); setSeekPreview(null); }}
                color={COLORS.green} tooltip="never" valueLabel={null} accessibilityLabel="Playback position" />
              <Row fullWidth justify="space-between">
                <Text c={COLORS.white} size={12}>{formatTime(seekPreview ?? currentTime)}</Text>
                <Text c={COLORS.white} size={12}>{formatTime(duration)}</Text>
              </Row>
            </Column>
            <Row fullWidth align="center" justify="center" gap="xl">
              <IconButton icon="chevron-left" iconColor={COLORS.white} variant="ghost" size="lg"
                accessibilityLabel="Previous track" onPress={previousTrack} />
              <IconButton icon={status.playing ? 'pause' : 'play'} iconVariant="filled" variant="filled"
                color={COLORS.green} radius="full" size={72} iconSize={34}
                accessibilityLabel={status.playing ? 'Pause' : 'Play'} onPress={togglePlay} />
              <IconButton icon="chevron-right" iconColor={COLORS.white} variant="ghost" size="lg"
                accessibilityLabel="Next track" onPress={nextTrack} />
            </Row>
          </Column>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />
      <Flex direction="row" style={{ flex: 1, minHeight: 0 }}>
        {desktop && (
          <Column gap="xl" style={{ width: 235, padding: 18, backgroundColor: COLORS.sidebar, borderRightWidth: 1, borderRightColor: COLORS.line }}>
            <Row align="center" gap="sm">
              <Card bg={COLORS.green} padding={6} radius="md"><Icon name="music" size={21} color={COLORS.background} /></Card>
              <Text c={COLORS.white} fw="bold" size={22}>frequency</Text>
            </Row>
            <Column gap="xs">
              <NavItem icon="home" label="Home" active={section === 'home'} onPress={() => selectSection('home')} />
              <NavItem icon="search" label="Search" active={section === 'search'} onPress={() => selectSection('search')} />
              <NavItem icon="music" label="Your Library" active={section === 'library'} onPress={() => selectSection('library')} />
            </Column>
            <Card bg={COLORS.surface} padding="md" radius="lg">
              <Column gap="sm">
                <Text c={COLORS.white} fw="bold" size={14}>Made for listening</Text>
                <Text c={COLORS.muted} size={12}>Six original little loops, ready whenever you are.</Text>
                <Text c={COLORS.green} size={12}>NO ACCOUNT NEEDED ↗</Text>
              </Column>
            </Card>
          </Column>
        )}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: compact ? 18 : 34, paddingBottom: 44, alignItems: 'center' }}>
          <Column gap="xl" style={{ width: '100%', maxWidth: 1040 }}>
            {!desktop && (
              <Row align="center" gap="sm">
                <Card bg={COLORS.green} padding={5} radius="md"><Icon name="music" size={18} color={COLORS.background} /></Card>
                <Text c={COLORS.white} fw="bold" size={19}>frequency</Text>
              </Row>
            )}
            {renderContent()}
          </Column>
        </ScrollView>
      </Flex>

      <Card bg={COLORS.surface} padding={compact ? 'sm' : 'md'} radius="sm"
        style={{ borderTopWidth: 1, borderTopColor: COLORS.line, width: '100%' }}>
        <Column gap="xs">
          <Row align="center" gap="md" style={{ width: '100%' }}>
            <Pressable onPress={() => setExpanded(true)} style={{ flex: 1, minWidth: 0 }}
              accessibilityRole="button" accessibilityLabel={`Open now playing: ${activeTrack.title} by ${activeTrack.artist}`}>
              <Row align="center" gap="sm">
                <Artwork art={activeTrack.art} size={compact ? 43 : 52} label={activeTrack.title} />
                <Column gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text c={COLORS.white} fw="bold" size={13} numberOfLines={1}>{activeTrack.title}</Text>
                  <Text c={COLORS.muted} size={11} numberOfLines={1}>{activeTrack.artist}</Text>
                </Column>
              </Row>
            </Pressable>
            {!compact && (
              <IconButton icon="chevron-left" variant="ghost" iconColor={COLORS.white}
                accessibilityLabel="Previous track" onPress={previousTrack} />
            )}
            <IconButton icon={status.playing ? 'pause' : 'play'} iconVariant="filled" variant="filled"
              color={COLORS.green} radius="full"
              accessibilityLabel={status.playing ? 'Pause' : 'Play'} onPress={togglePlay} />
            <IconButton icon="chevron-right" variant="ghost" iconColor={COLORS.white}
              accessibilityLabel="Next track" onPress={nextTrack} />
            {!compact && (
              <Text c={COLORS.muted} size={12}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
            )}
          </Row>
          <Flex style={{ height: 2, width: '100%', backgroundColor: COLORS.line, borderRadius: 2 }}>
            <Flex style={{ height: 2, width: `${progress}%` as `${number}%`, backgroundColor: COLORS.green, borderRadius: 2 }} />
          </Flex>
        </Column>
      </Card>

      {!desktop && (
        <Flex direction="row" style={{ backgroundColor: COLORS.sidebar, borderTopWidth: 1, borderTopColor: COLORS.line, paddingHorizontal: 8, paddingVertical: 3 }}>
          <NavItem icon="home" label="Home" active={section === 'home'} compact onPress={() => selectSection('home')} />
          <NavItem icon="search" label="Search" active={section === 'search'} compact onPress={() => selectSection('search')} />
          <NavItem icon="music" label="Library" active={section === 'library'} compact onPress={() => selectSection('library')} />
        </Flex>
      )}
    </SafeAreaView>
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
