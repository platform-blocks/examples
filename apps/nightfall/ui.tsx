import { useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { BackgroundImage, Block, Gradient, Icon, Progress, ScrollArea, Text } from '@plocks/ui';

import { ART, topRank, type Title } from './data';

export const C = {
  black: '#0D0D0D',
  panel: '#181818',
  raised: '#262626',
  white: '#FFFFFF',
  muted: '#A3A3A3',
  soft: '#D4D4D4',
  red: '#E50914',
  green: '#46D369',
  line: '#2A2A2A',
};

/** Breakpoints used across screens. `wide` switches to the desktop layout with a top nav. */
export function useScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return { width, wide, gutter: wide ? 40 : 16, poster: wide ? 168 : 112 };
}

/** The red "N" mark used on originals and in the header. */
export function Mark({ size = 14 }: { size?: number }) {
  return (
    <Text c={C.red} fw="900" size={size} lh={size}>
      N
    </Text>
  );
}

/** Poster: 2:3 art, originals mark, Top 10 flag and an optional ribbon. */
export function Poster({ title, w, onPress }: { title: Title; w: number; onPress: () => void }) {
  const rank = topRank(title);
  return (
    <BackgroundImage
      source={ART[title.art]}
      w={w}
      h={Math.round(w * 1.5)}
      radius={6}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title.title}
    >
      <Gradient colors={[title.tint, '#0000', '#000E']} flex={1} justify="space-between">
        <Block direction="row" justify="space-between" align="flex-start" gap={0}>
          <Block gap={0} p={7}>
            {title.original && <Mark size={w > 140 ? 18 : 14} />}
          </Block>
          {rank !== null && rank <= 3 && !title.coming && <TopTenFlag />}
        </Block>
        <Block gap={6}>
          <Text c={C.white} fw="900" size={w > 140 ? 18 : 14} lh={w > 140 ? 21 : 16} ta="center" px={6} numberOfLines={3} tt="uppercase">
            {title.title}
          </Text>
          {title.label ? (
            <Block bg={C.red} py={3} align="center" gap={0}>
              <Text c={C.white} fw="bold" size={w > 140 ? 11 : 9}>
                {title.label}
              </Text>
            </Block>
          ) : (
            <Block h={4} gap={0} />
          )}
        </Block>
      </Gradient>
    </BackgroundImage>
  );
}

export function TopTenFlag() {
  return (
    <Block bg={C.red} w={22} pt={2} pb={3} align="center" gap={0} borderTopRightRadius={6}>
      <Text c={C.white} fw="bold" size={7} lh={8}>
        TOP
      </Text>
      <Text c={C.white} fw="900" size={11} lh={12}>
        10
      </Text>
    </Block>
  );
}

/** A titled horizontal shelf. */
export function Shelf({ heading, children }: { heading: string; children: ReactNode }) {
  const { wide, gutter } = useScreen();
  return (
    <Block gap={wide ? 12 : 9} mt={wide ? 30 : 22}>
      <Text c={C.white} fw="bold" size={wide ? 21 : 17} px={gutter}>
        {heading}
      </Text>
      <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ px: gutter, gap: wide ? 10 : 8, direction: 'row' }}>
        {children}
      </ScrollArea>
    </Block>
  );
}

/**
 * Even poster grid. Measures its own width, then picks the column count that keeps
 * posters near `min` wide, so gutters are identical and every poster shares one 2:3 size.
 */
export function PosterGrid({ titles, onPress, min, gap = 8 }: { titles: Title[]; onPress: (id: string) => void; min?: number; gap?: number }) {
  const { poster } = useScreen();
  const [width, setWidth] = useState(0);
  const target = min ?? poster;
  const columns = Math.max(3, Math.floor((width + gap) / (target + gap)));
  const itemW = Math.floor((width - gap * (columns - 1)) / columns);
  return (
    <Block direction="row" wrap="wrap" gap={gap} w="100%" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && titles.map((item) => <Poster key={item.id} title={item} w={itemW} onPress={() => onPress(item.id)} />)}
    </Block>
  );
}

/** 16:9 still with the title tint and an optional centred play glyph. */
export function Still({
  title,
  w,
  radius = 6,
  play = false,
  progress,
  children,
}: {
  title: Title;
  w: number | string;
  radius?: number;
  play?: boolean;
  progress?: number;
  children?: ReactNode;
}) {
  return (
    <BackgroundImage source={ART[title.art]} w={w} aspectRatio={16 / 9} radius={radius}>
      <Gradient colors={[title.tint, '#0003']} flex={1} justify="center" align="center">
        {play && <PlayGlyph />}
        {children}
      </Gradient>
      {progress !== undefined && progress > 0 && (
        <Block position="absolute" left={0} right={0} bottom={0} gap={0}>
          <Progress value={progress * 100} size={3} radius={0} color={C.red} trackColor="#FFFFFF44" />
        </Block>
      )}
    </BackgroundImage>
  );
}

export function PlayGlyph({ size = 38 }: { size?: number }) {
  return (
    <Block w={size} h={size} radius="full" borderWidth={1.5} borderColor={C.white} bg="#0008" align="center" justify="center" gap={0}>
      <Icon name="play" variant="filled" size={size * 0.45} color={C.white} />
    </Block>
  );
}

/** Icon-over-label action (My List, Rate, Share, Remind Me). */
export function Action({ icon, label, onPress, accessibilityLabel }: { icon: ReactNode; label: string; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Block gap={5} align="center" miw={64} py={4} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      {icon}
      <Text c={C.muted} size={11}>
        {label}
      </Text>
    </Block>
  );
}

/** Bold meta line: match %, year, rating box, length, HD. */
export function Meta({ title, size = 13 }: { title: Title; size?: number }) {
  return (
    <Block direction="row" align="center" gap={8} wrap="wrap">
      {!title.coming && (
        <Text c={C.green} fw="bold" size={size}>
          {title.match}% Match
        </Text>
      )}
      <Text c={C.soft} size={size}>
        {title.year}
      </Text>
      <Block bg="#4D4D4D" px={5} radius={2} gap={0}>
        <Text c={C.white} size={size - 2} fw="600">
          {title.rating}
        </Text>
      </Block>
      <Text c={C.soft} size={size}>
        {title.length}
      </Text>
      <Block borderWidth={1} borderColor="#8C8C8C" px={4} radius={3} gap={0}>
        <Text c={C.soft} size={size - 3} fw="bold">
          HD
        </Text>
      </Block>
    </Block>
  );
}

/** Square profile avatar. */
export function ProfileTile({ color, size }: { color: string; size: number }) {
  return (
    <Block w={size} h={size} radius={size / 10} bg={color} align="center" justify="center" gap={size * 0.06}>
      <Block direction="row" gap={size * 0.22}>
        <Block w={size * 0.09} h={size * 0.14} radius="full" bg="#FFFFFFE6" gap={0} />
        <Block w={size * 0.09} h={size * 0.14} radius="full" bg="#FFFFFFE6" gap={0} />
      </Block>
      <Block w={size * 0.42} h={size * 0.16} borderBottomWidth={size * 0.06} borderLeftWidth={size * 0.06} borderRightWidth={size * 0.06} borderColor="#FFFFFFE6" gap={0} borderBottomLeftRadius={size * 0.21} borderBottomRightRadius={size * 0.21} mt={size * 0.04} />
    </Block>
  );
}

/** Dot-separated genres / moods line. */
export function Dots({ items, c = C.soft, size = 13, ta = 'center' }: { items: string[]; c?: string; size?: number; ta?: 'left' | 'center' }) {
  return (
    <Text c={c} size={size} ta={ta}>
      {items.join('  ·  ')}
    </Text>
  );
}
