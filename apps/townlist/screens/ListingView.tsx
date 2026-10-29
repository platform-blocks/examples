import { useState, type ReactNode } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Block,
  Button,
  Chip,
  Dialog,
  Icon,
  IconButton,
  Image,
  Lightbox,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  TextArea,
  Text,
  useToast,
} from '@plocks/ui';
import type { LightboxItem } from '@plocks/ui';
import { C } from '../theme';
import {
  ageText,
  cityById,
  dateText,
  photoSource,
  postTypeById,
  priceText,
  sectionById,
  subLabel,
  type Listing,
} from '../data';
import { useStore } from '../store';
import { EmptyNote, MapBlock, Screen, useWide } from '../components';

const QUICK = ['Hi, is this still available?', 'When could I come see it?', 'Would you consider a lower price?'];
const FLAGS = ['prohibited', 'spam / overpost', 'miscategorized', 'scam or fraud'];

function Gallery({ listing, h }: { listing: Listing; h: number }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = listing.photos;
  if (!photos.length) {
    return (
      <Block gap={6} h={Math.round(h * 0.55)} radius={6} bg={C.pale} align="center" justify="center" borderWidth={1} borderColor={C.line}>
        <Icon name="image-off" color={C.faint} size={30} />
        <Text c={C.faint} size={12}>
          no images
        </Text>
      </Block>
    );
  }
  const items: LightboxItem[] = photos.map((photo, i) => ({
    id: photo.id,
    uri: photoSource(photo),
    title: `${listing.title} (${i + 1} of ${photos.length})`,
  }));
  const current = Math.min(index, photos.length - 1);
  return (
    <Block gap={8}>
      <Block gap={0} position="relative" radius={6} overflow="hidden" bg={C.ink}>
        <Block gap={0} onPress={() => setLightbox(current)} accessibilityRole="button" accessibilityLabel="Open full screen photos">
          <Image src={photoSource(photos[current])} w="100%" h={h} resizeMode="cover" alt={`${listing.title}, photo ${current + 1}`} />
        </Block>
        {photos.length > 1 && (
          <>
            <Block gap={0} position="absolute" left={8} top={h / 2 - 20}>
              <IconButton icon="chevron-left" variant="filled" color="rgba(0,0,0,0.5)" iconColor={C.white} accessibilityLabel="Previous photo" onPress={() => setIndex((current - 1 + photos.length) % photos.length)} />
            </Block>
            <Block gap={0} position="absolute" right={8} top={h / 2 - 20}>
              <IconButton icon="chevron-right" variant="filled" color="rgba(0,0,0,0.5)" iconColor={C.white} accessibilityLabel="Next photo" onPress={() => setIndex((current + 1) % photos.length)} />
            </Block>
          </>
        )}
        <Block gap={0} position="absolute" right={8} bottom={8} px={8} py={3} radius={10} bg="rgba(0,0,0,0.6)">
          <Text c={C.white} size={11} fw="semibold">
            {current + 1} / {photos.length}
          </Text>
        </Block>
      </Block>
      {photos.length > 1 && (
        <Block gap={6} direction="row" wrap>
          {photos.map((photo, i) => (
            <Block
              key={photo.id}
              gap={0}
              onPress={() => setIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Show photo ${i + 1}`}
              radius={4}
              overflow="hidden"
              borderWidth={2}
              borderColor={i === current ? C.purple : 'transparent'}
            >
              <Image src={photoSource(photo)} w={62} h={50} resizeMode="cover" alt="" opacity={i === current ? 1 : 0.75} />
            </Block>
          ))}
        </Block>
      )}
      <Lightbox
        opened={lightbox !== null}
        images={items}
        initialIndex={lightbox ?? 0}
        onClose={() => setLightbox(null)}
        showDownloadButton={false}
        accessibilityLabel={`${listing.title} photos`}
      />
    </Block>
  );
}

function Action({ icon, label, active, onPress }: { icon: ReactNode; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      gap={3}
      align="center"
      px={8}
      py={6}
      miw={54}
      radius={6}
      bg={active ? C.tint : undefined}
      pressedStyle={{ opacity: 0.6 }}
    >
      {icon}
      <Text c={active ? C.purple : C.body} size={11} fw="semibold">
        {label}
      </Text>
    </Block>
  );
}

function Attributes({ listing }: { listing: Listing }) {
  const type = postTypeById(listing.postType);
  return (
    <Block gap={0} radius={6} borderWidth={1} borderColor={C.line} bg={C.paler}>
      <Block gap={2} p={12} borderBottomWidth={1} borderBottomColor={C.line}>
        <Text c={C.muted} size={11}>
          {type.label}
        </Text>
        <Text c={C.ink} fw="bold" size={14}>
          {subLabel(listing.section, listing.sub)}
        </Text>
      </Block>
      {listing.attrs.length > 0 && (
        <Block gap={6} p={12}>
          {listing.attrs.map((attr) => (
            <Text key={attr.label} c={C.muted} size={13} lh={18}>
              {attr.label}:{' '}
              <Text c={C.ink} fw="bold" size={13}>
                {attr.value}
              </Text>
            </Text>
          ))}
        </Block>
      )}
    </Block>
  );
}

export function ListingBody({ listing, preview, onReply }: { listing: Listing; preview?: boolean; onReply?: () => void }) {
  const store = useStore();
  const toast = useToast();
  const wide = useWide();
  const favorite = store.favorites.includes(listing.id);
  const hidden = store.hidden.includes(listing.id);
  const flagged = store.flagged.includes(listing.id);
  const city = cityById(listing.cityId);
  const price = priceText(listing);
  const section = sectionById(listing.section);
  const share = async () => {
    const url = `https://townlist.example/${city.id}/${listing.section}/${listing.id}`;
    try {
      await Clipboard.setStringAsync(url);
      toast.show({ title: 'Link copied', message: url, autoHide: 2400 });
    } catch {
      toast.show({ title: 'Share link', message: url, autoHide: 2400 });
    }
  };

  const actions = (
    <Block gap={4} direction="row" align="center" wrap>
      {!listing.mine && !preview && (
        <Button title="reply" color={C.purple} startSection={<Icon name="message" color={C.white} size={16} />} onPress={onReply} radius={6} mr={6} />
      )}
      <Action
        label={favorite ? 'favorited' : 'favorite'}
        active={favorite}
        icon={<Icon name="star" variant={favorite ? 'filled' : 'outlined'} color={favorite ? '#D49A00' : C.body} size={18} />}
        onPress={preview ? undefined : () => store.toggleFavorite(listing.id)}
      />
      <Action
        label={hidden ? 'unhide' : 'hide'}
        active={hidden}
        icon={hidden ? <Icon name="eye" color={C.purple} size={18} /> : <Icon name="eye-off" color={C.body} size={18} />}
        onPress={
          preview
            ? undefined
            : () => {
                store.toggleHidden(listing.id);
                toast.show({ title: hidden ? 'Post unhidden' : 'Post hidden', message: hidden ? undefined : 'It won’t show in your results.', autoHide: 2000 });
              }
        }
      />
      {preview ? (
        <Action label="flag" icon={<Icon name="flag" color={C.body} size={18} />} />
      ) : (
        <Menu position="bottom-end">
          <Action label={flagged ? 'flagged' : 'flag'} active={flagged} icon={<Icon name="flag" variant={flagged ? 'filled' : 'outlined'} color={flagged ? C.red : C.body} size={18} />} />
          <MenuDropdown>
            {FLAGS.map((reason) => (
              <MenuItem
                key={reason}
                onPress={() => {
                  store.flag(listing.id);
                  toast.show({ title: 'Thanks for flagging', message: `Reported as ${reason}.`, autoHide: 2200 });
                }}
              >
                {reason}
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem disabled>best of townlist (soon)</MenuItem>
          </MenuDropdown>
        </Menu>
      )}
      <Action label="share" icon={<Icon name="share" color={C.body} size={18} />} onPress={preview ? undefined : share} />
    </Block>
  );

  const heading = (
    <Block gap={6}>
      <Text c={C.ink} fw="bold" size={wide ? 24 : 20} lh={wide ? 30 : 26}>
        {listing.title}
        {price ? (
          <Text c={listing.price === 0 ? C.green : C.ink} fw="bold" size={wide ? 24 : 20}>
            {' '}
            – {price}
          </Text>
        ) : null}
        <Text c={C.muted} fw="normal" size={wide ? 18 : 16}>
          {' '}
          ({listing.hood})
        </Text>
      </Text>
      <Block gap={6} direction="row" align="center" wrap>
        <Icon name="clock" color={C.muted} size={13} />
        <Text c={C.muted} size={12}>
          posted {ageText(listing.postedAt)}
          {listing.updatedAt ? ` · updated ${ageText(listing.updatedAt)}` : ''}
        </Text>
        <Text c={C.faint} size={12}>
          ·
        </Text>
        <Icon name="map-pin" color={C.muted} size={13} />
        <Text c={C.muted} size={12}>
          {listing.hood}, {city.name}
        </Text>
      </Block>
    </Block>
  );

  const body = (
    <Block gap={12}>
      {listing.body.split('\n\n').map((paragraph, index) => (
        <Text key={index} c={C.body} size={15} lh={23}>
          {paragraph}
        </Text>
      ))}
      <Block gap={4} mt={4} p={10} radius={4} bg={C.pale}>
        <Text c={C.muted} size={12}>
          • do NOT contact me with unsolicited services or offers
        </Text>
        {listing.section === 'sale' && (
          <Text c={C.muted} size={12}>
            • meet in a public place and inspect before paying
          </Text>
        )}
      </Block>
    </Block>
  );

  const meta = (
    <Block gap={3} pt={10} borderTopWidth={1} borderTopColor={C.line}>
      <Text c={C.faint} size={11}>
        post id: {listing.id}
      </Text>
      <Text c={C.faint} size={11}>
        posted: {dateText(listing.postedAt)}
      </Text>
      {listing.updatedAt && (
        <Text c={C.faint} size={11}>
          updated: {dateText(listing.updatedAt)}
        </Text>
      )}
      <Text c={C.faint} size={11}>
        posted by: {listing.seller}
      </Text>
    </Block>
  );

  return (
    <Block gap={14}>
      {hidden && !preview && (
        <Block gap={8} direction="row" align="center" p={10} radius={6} bg={C.amberPale}>
          <Icon name="eye-off" color={C.amber} size={16} />
          <Text c={C.amber} size={13} flex={1}>
            You hid this post. It won’t appear in results.
          </Text>
          <Text c={C.purple} size={13} fw="semibold" onPress={() => store.toggleHidden(listing.id)}>
            unhide
          </Text>
        </Block>
      )}
      <Block gap={6} direction="row" align="center" wrap>
        <Text c={C.link} size={12}>
          {city.name}
        </Text>
        <Text c={C.faint} size={12}>›</Text>
        <Text c={C.link} size={12}>
          {section.label}
        </Text>
        <Text c={C.faint} size={12}>›</Text>
        <Text c={C.link} size={12}>
          {subLabel(listing.section, listing.sub)}
        </Text>
        <Text c={C.faint} size={12}>
          - {postTypeById(listing.postType).label.replace(/^for sale /, '')}
        </Text>
      </Block>
      {heading}
      {actions}
      {wide ? (
        <Block gap={24} direction="row" align="flex-start">
          <Block flex={1} miw={0} gap={18}>
            <Gallery listing={listing} h={400} />
            {body}
          </Block>
          <Block w={290} gap={14}>
            <Attributes listing={listing} />
            <MapBlock hood={listing.hood} cityId={listing.cityId} h={190} />
            {meta}
          </Block>
        </Block>
      ) : (
        <>
          <Gallery listing={listing} h={260} />
          <Attributes listing={listing} />
          {body}
          <MapBlock hood={listing.hood} cityId={listing.cityId} />
          {meta}
        </>
      )}
    </Block>
  );
}

export function ListingView({ id }: { id: string }) {
  const store = useStore();
  const toast = useToast();
  const listing = store.listingById(id);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  if (!listing) {
    return (
      <Screen back title="post">
        <EmptyNote icon="search" title="This posting has been deleted by its author." />
      </Screen>
    );
  }
  const send = () => {
    if (!text.trim()) return;
    const threadId = store.reply(listing, text.trim());
    setText('');
    setReplying(false);
    toast.show({ title: 'Message sent', message: `${listing.seller} will reply in messages.`, autoHide: 2200 });
    store.openIn('messages', { name: 'thread', id: threadId });
  };

  return (
    <Screen
      back
      title={subLabel(listing.section, listing.sub)}
      subtitle={`${sectionById(listing.section).label} · ${cityById(listing.cityId).name}`}
      right={
        listing.mine ? (
          <Button
            size="xs"
            variant="outline"
            color={C.red}
            title="delete"
            onPress={() => {
              store.removePost(listing.id);
              store.back();
              toast.show({ title: 'Post deleted', autoHide: 2000 });
            }}
          />
        ) : undefined
      }
      maw={1000}
    >
      <ListingBody listing={listing} onReply={() => setReplying(true)} />
      <Dialog opened={replying} onClose={() => setReplying(false)} title={`reply to ${listing.seller}`} w={460}>
        <Block gap={12}>
          <Text c={C.muted} size={12}>
            re: {listing.title}
          </Text>
          <Block gap={6} direction="row" wrap>
            {QUICK.map((item) => (
              <Chip key={item} size="xs" variant="outline" color={C.purple} onPress={() => setText(item)}>
                {item}
              </Chip>
            ))}
          </Block>
          <TextArea
            variant="outline"
            value={text}
            onChangeText={setText}
            placeholder="Write a message…"
            rows={4}
            radius={6}
            mb={0}
            accessibilityLabel="Message"
          />
          <Button title="send message" color={C.purple} disabled={!text.trim()} onPress={send} radius={6} />
          <Block gap={6} p={10} radius={6} bg={C.pale}>
            <Text c={C.ink} fw="semibold" size={13}>
              other ways to reply
            </Text>
            {showEmail ? (
              <Text c={C.link} size={13} selectable>
                {listing.id}-{listing.seller.toLowerCase().replace(/[^a-z]/g, '')}@relay.townlist.example
              </Text>
            ) : (
              <Text c={C.link} size={13} onPress={() => setShowEmail(true)}>
                show anonymous relay email
              </Text>
            )}
            <Text c={C.muted} size={11}>
              Demo only: nothing leaves this device.
            </Text>
          </Block>
        </Block>
      </Dialog>
    </Screen>
  );
}
