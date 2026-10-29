/** Shared Townlist building blocks. */
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Badge, Block, Icon, IconButton, Image, ScrollArea, Text } from '@plocks/ui-snack';
import { C, WIDE } from './theme';
import { ageText, cityById, photoSource, priceText, sectionById, type Listing } from './data';
import { useStore } from './store';

export const useWide = () => useWindowDimensions().width >= WIDE;

export function TopBar({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <Block
      gap={6}
      direction="row"
      align="center"
      mih={54}
      px={onBack ? 6 : 16}
      pr={10}
      bg={C.white}
      borderBottomWidth={1}
      borderBottomColor={C.line}
    >
      {onBack && (
        <IconButton icon="chevron-left" variant="ghost" iconColor={C.purple} accessibilityLabel="Back" onPress={onBack} />
      )}
      <Block flex={1} miw={0} gap={0}>
        {typeof title === 'string' ? (
          <Text c={C.ink} fw="bold" size={17} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        {!!subtitle && (
          <Text c={C.muted} size={12} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </Block>
      {right}
    </Block>
  );
}

/** A scrolling page with a top bar and a centered content column. */
export function Screen({
  title,
  subtitle,
  right,
  children,
  maw = 880,
  back,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  maw?: number;
  back?: boolean;
  footer?: ReactNode;
}) {
  const store = useStore();
  const wide = useWide();
  return (
    <Block gap={0} flex={1} bg={C.white}>
      <TopBar title={title} subtitle={subtitle} right={right} onBack={back && store.canGoBack ? store.back : undefined} />
      <ScrollArea flex={1} keyboardShouldPersistTaps="handled" contentProps={{ align: 'center', px: wide ? 24 : 14, pt: 14, pb: 40 }}>
        <Block gap={0} w="100%" maw={maw}>
          {children}
        </Block>
      </ScrollArea>
      {footer}
    </Block>
  );
}

export function SectionLabel({ children, right, mt = 18 }: { children: ReactNode; right?: ReactNode; mt?: number }) {
  return (
    <Block gap={0} direction="row" align="flex-end" justify="space-between" mt={mt} mb={6}>
      <Text c={C.muted} fw="bold" size={11} lts={0.8} tt="uppercase">
        {children}
      </Text>
      {right}
    </Block>
  );
}

export function Thumb({ listing, w, h, radius = 4 }: { listing: Listing; w: number | string; h: number; radius?: number }) {
  const first = listing.photos[0];
  if (first) return <Image src={photoSource(first)} w={w as number} h={h} radius={radius} resizeMode="cover" alt="" />;
  return (
    <Block gap={4} w={w as number} h={h} radius={radius} bg={C.pale} align="center" justify="center" borderWidth={1} borderColor={C.line}>
      <Icon name={sectionById(listing.section).icon} color={C.faint} size={Math.min(28, h / 3)} />
      {h > 70 && (
        <Text c={C.faint} size={10}>
          no image
        </Text>
      )}
    </Block>
  );
}

export function PriceTag({ listing, size = 13 }: { listing: Listing; size?: number }) {
  const text = priceText(listing);
  if (!text) return null;
  return (
    <Block gap={0} px={6} py={1} radius={3} bg={listing.price === 0 ? C.greenPale : C.pale} alignSelf="flex-start">
      <Text c={listing.price === 0 ? C.green : C.ink} fw="bold" size={size}>
        {text}
      </Text>
    </Block>
  );
}

export function FavoriteButton({ id, size = 20 }: { id: string; size?: number }) {
  const store = useStore();
  const on = store.favorites.includes(id);
  return (
    <IconButton
      icon="star"
      iconVariant={on ? 'filled' : 'outlined'}
      iconColor={on ? '#D49A00' : C.faint}
      iconSize={size}
      variant="ghost"
      size="sm"
      accessibilityLabel={on ? 'Remove from favorites' : 'Add to favorites'}
      onPress={() => store.toggleFavorite(id)}
    />
  );
}

/** Dense list row, like the classic "thumb" results view. */
export function ListingRow({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const store = useStore();
  const wide = useWide();
  const city = cityById(listing.cityId);
  const away = listing.cityId !== store.cityId;
  const size = wide ? 92 : 78;
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${listing.title}`}
      direction="row"
      gap={12}
      py={10}
      borderBottomWidth={1}
      borderBottomColor={C.line}
      pressedStyle={{ opacity: 0.7 }}
    >
      <Thumb listing={listing} w={size} h={size} />
      <Block flex={1} miw={0} gap={4}>
        <Text c={C.link} fw="semibold" size={15} lh={20} numberOfLines={2}>
          {listing.title}
        </Text>
        <Block gap={6} direction="row" align="center" wrap>
          <PriceTag listing={listing} />
          {listing.price === null && !!listing.attrs[0] && (
            <Text c={C.body} size={12} numberOfLines={1}>
              {listing.attrs[0].value}
            </Text>
          )}
        </Block>
        <Text c={C.muted} size={12} numberOfLines={1}>
          {listing.hood}
          {away ? ` · ${city.name}` : ''} · {ageText(listing.postedAt)}
          {listing.mine ? ' · your post' : ''}
        </Text>
      </Block>
      <Block gap={0} alignSelf="flex-start">
        <FavoriteButton id={listing.id} />
      </Block>
    </Block>
  );
}

/** Gallery tile for grid views. */
export function ListingTile({ listing, w, onPress }: { listing: Listing; w: number; onPress: () => void }) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${listing.title}`}
      w={w}
      gap={0}
      radius={6}
      overflow="hidden"
      borderWidth={1}
      borderColor={C.line}
      bg={C.white}
      pressedStyle={{ opacity: 0.7 }}
    >
      <Thumb listing={listing} w="100%" h={Math.round(w * 0.72)} radius={0} />
      <Block gap={3} p={8}>
        <Block gap={0} direction="row" align="center" justify="space-between" mih={22}>
          <PriceTag listing={listing} size={12} />
          <Text c={C.faint} size={11}>
            {ageText(listing.postedAt)}
          </Text>
        </Block>
        <Text c={C.link} fw="semibold" size={13} lh={17} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text c={C.muted} size={11} numberOfLines={1}>
          {listing.hood}
        </Text>
      </Block>
    </Block>
  );
}

/** A drawn, approximate-location map tile (no map service needed). */
export function MapBlock({ hood, cityId, h = 170 }: { hood: string; cityId: string; h?: number }) {
  const city = cityById(cityId);
  const seed = [...hood].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const pinX = 30 + (seed % 40);
  const pinY = 30 + ((seed * 7) % 35);
  return (
    <Block gap={0} h={h} radius={6} overflow="hidden" bg={C.map} borderWidth={1} borderColor={C.line} position="relative">
      <Block gap={0} position="absolute" left="-10%" top="62%" w="70%" h="60%" radius={200} bg={C.mapWater} />
      <Block gap={0} position="absolute" left="68%" top="8%" w="22%" h="34%" radius={10} bg={C.mapPark} />
      {[18, 46, 78].map((top) => (
        <Block key={`h${top}`} gap={0} position="absolute" left={0} right={0} top={`${top}%`} h={top === 46 ? 7 : 4} bg={C.mapRoad} />
      ))}
      {[22, 52, 84].map((left) => (
        <Block key={`v${left}`} gap={0} position="absolute" top={0} bottom={0} left={`${left}%`} w={left === 52 ? 7 : 4} bg={C.mapRoad} />
      ))}
      <Block gap={0} position="absolute" left={`${pinX}%`} top={`${pinY}%`} translateX={-43} translateY={-43} w={86} h={86} radius={43} bg="rgba(91,42,140,0.14)" borderWidth={1} borderColor="rgba(91,42,140,0.35)" align="center" justify="center">
        <Block gap={0} w={20} h={20} radius={10} bg={C.purple} borderWidth={3} borderColor={C.white} shadow="sm" />
      </Block>
      <Block gap={0} position="absolute" left={8} bottom={8} px={8} py={4} radius={4} bg="rgba(255,255,255,0.92)">
        <Text c={C.ink} fw="semibold" size={12}>
          {hood}, {city.name}
        </Text>
        <Text c={C.muted} size={10}>
          approximate location
        </Text>
      </Block>
    </Block>
  );
}

export function EmptyNote({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <Block gap={8} align="center" py={44} px={20}>
      <Block gap={0} w={52} h={52} radius={26} bg={C.pale} align="center" justify="center">
        <Icon name={icon} color={C.purple} size={24} />
      </Block>
      <Text c={C.ink} fw="semibold" size={15} ta="center">
        {title}
      </Text>
      {!!children && (
        <Text c={C.muted} size={13} ta="center" lh={19}>
          {children}
        </Text>
      )}
    </Block>
  );
}

export function SectionBadge({ listing }: { listing: Listing }) {
  return (
    <Badge size="xs" variant="light" color={C.purple}>
      {sectionById(listing.section).label}
    </Badge>
  );
}
