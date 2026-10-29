import { useState } from 'react';
import { Asset } from 'expo-asset';
import { Block, Button, Icon, IconButton, Text } from '@plocks/ui-snack';
import { Video, type VideoState } from '@plocks/media';

import { byId, trailersFor } from '../data';
import { progressKey, useNightfall, type Route } from '../store';
import { C, useScreen } from '../ui';

const SAMPLE_CLIP = Asset.fromModule(require('../assets/demo-clip.mp4')).uri;

/** Full-screen player. Every title plays the bundled sample clip; progress feeds Continue Watching. */
export function PlayerScreen({ route }: { route: Extract<Route, { name: 'player' }> }) {
  const app = useNightfall();
  const { gutter } = useScreen();
  const [error, setError] = useState<string | null>(null);
  const title = byId(route.id);
  const { s, e, trailer } = route;
  const episode = s && e ? title.seasons?.[s - 1]?.[e - 1] : undefined;
  const nextEpisode = s && e ? (title.seasons?.[s - 1]?.[e] ? [s, e + 1] : title.seasons?.[s]?.[0] ? [s + 1, 1] : null) : null;
  const trailerLabel = trailer ? trailersFor(title).find((item) => item.id === trailer)?.label : undefined;
  const key = progressKey(title.id, s, e);

  return (
    <Block flex={1} bg="#000" gap={0}>
      <Block direction="row" align="center" gap={10} px={gutter} py={10}>
        <IconButton icon="arrowLeft" variant="ghost" iconColor={C.white} accessibilityLabel="Exit player" onPress={app.back} />
        <Block flex={1} gap={0}>
          <Text c={C.white} fw="bold" size={17} numberOfLines={1}>
            {title.title}
          </Text>
          <Text c={C.muted} size={12} numberOfLines={1}>
            {trailerLabel ?? (episode ? `S${s}:E${e} “${episode.title}”` : title.length)}
          </Text>
        </Block>
      </Block>
      <Block flex={1} w="100%" maw={1100} alignSelf="center" justify="center" gap={0}>
        <Video
          key={`${key}:${trailer ?? ''}`}
          source={{ url: SAMPLE_CLIP }}
          w="100%"
          aspectRatio={16 / 9}
          autoPlay
          controls
          accessibilityLabel={`Sample clip for ${title.title}`}
          onTimeUpdate={(state: VideoState) => {
            if (trailer || !state.duration) return;
            app.setProgress(key, Math.min(1, state.currentTime / state.duration), title.id, s, e);
          }}
          onError={setError}
        />
        <Block direction="row" align="center" justify="space-between" px={gutter} py={14} gap={10} wrap="wrap">
          <Text c={C.muted} size={12}>
            {error ? 'This clip could not play here.' : 'Every title plays the same bundled preview footage.'}
          </Text>
          {nextEpisode && !trailer && (
            <Button
              title="Next Episode"
              startSection={<Icon name="player-skip-forward" variant="filled" size={18} color={C.black} />}
              color={C.white}
              textColor={C.black}
              size="sm"
              onPress={() => {
                app.back();
                app.play(title.id, nextEpisode[0], nextEpisode[1]);
              }}
            />
          )}
        </Block>
      </Block>
    </Block>
  );
}
