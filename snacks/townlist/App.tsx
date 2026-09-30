import { useEffect, useState } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  TextArea,
  Input,
  ScrollArea,
  SafeArea,
  Block,
  Button,
  Chip,
  Dialog,
  Image,
  Icon,
  IconButton,
  Tabs,
  Lightbox,
  PlocksProvider,
  Text,
} from '@plocks/ui-snack';
import type { LightboxItem } from '@plocks/ui-snack';

const C = {
  purple: '#5D3291',
  link: '#315AA6',
  ink: '#202020',
  muted: '#6D6D6D',
  line: '#DADADA',
  pale: '#F5F3F8',
  white: '#FFF',
  green: '#24724C',
};
const CATEGORIES = ['All', 'For sale', 'Housing', 'Jobs', 'Services', 'Community'];
type Category = (typeof CATEGORIES)[number];
type Listing = {
  id: string;
  title: string;
  price: number;
  category: Category;
  location: string;
  posted: string;
  description: string;
  emoji: string;
  seller: string;
};
type Inquiry = { id: string; listingId: string; text: string; when: string };
const INITIAL: Listing[] = [
  {
    id: 'bike',
    title: 'Commuter bike, excellent condition',
    price: 220,
    category: 'For sale',
    location: 'Downtown',
    posted: 'today',
    description: 'Reliable city bike with a comfortable seat and new tires. Ready to ride. Pickup near the library.',
    emoji: '🚲',
    seller: 'Alex',
  },
  {
    id: 'chair',
    title: 'Mid century lounge chair',
    price: 145,
    category: 'For sale',
    location: 'Northside',
    posted: 'today',
    description: 'Solid wood lounge chair with fresh upholstery. A few small signs of use, otherwise lovely.',
    emoji: '🪑',
    seller: 'Morgan',
  },
  {
    id: 'apartment',
    title: 'Sunny 1 bedroom near the park',
    price: 1350,
    category: 'Housing',
    location: 'Midtown',
    posted: 'today',
    description: 'Bright one bedroom with balcony, in-unit laundry, and a short walk to the park. Monthly rent shown.',
    emoji: '🏡',
    seller: 'Dana',
  },
  {
    id: 'camera',
    title: 'Film camera and two lenses',
    price: 310,
    category: 'For sale',
    location: 'West End',
    posted: 'yesterday',
    description: 'Well cared for 35mm film camera. Includes a 50mm lens, wide lens, strap, and carrying case.',
    emoji: '📷',
    seller: 'Jamie',
  },
  {
    id: 'desk',
    title: 'Writing desk with drawers',
    price: 85,
    category: 'For sale',
    location: 'East Village',
    posted: 'yesterday',
    description: 'Compact wood desk with two smooth drawers. Perfect for a small workspace.',
    emoji: '🪵',
    seller: 'Riley',
  },
  {
    id: 'job',
    title: 'Part time café team member',
    price: 18,
    category: 'Jobs',
    location: 'Downtown',
    posted: 'yesterday',
    description: 'Neighborhood café looking for a friendly part time teammate. Pay shown per hour. Flexible mornings.',
    emoji: '☕',
    seller: 'Little Corner Café',
  },
  {
    id: 'plant',
    title: 'Large monstera with ceramic pot',
    price: 45,
    category: 'For sale',
    location: 'Northside',
    posted: '2 days ago',
    description: 'Healthy monstera with lots of new growth. Comes with the ceramic pot pictured in the demo.',
    emoji: '🪴',
    seller: 'Taylor',
  },
  {
    id: 'room',
    title: 'Room in friendly shared house',
    price: 790,
    category: 'Housing',
    location: 'Riverside',
    posted: '2 days ago',
    description: 'Private room in a bright shared home. Utilities included. Monthly rent shown.',
    emoji: '🛏️',
    seller: 'Casey',
  },
  {
    id: 'repair',
    title: 'Bike tune ups and repairs',
    price: 35,
    category: 'Services',
    location: 'Midtown',
    posted: '3 days ago',
    description: 'Local bicycle tune ups, tire replacements, and simple repairs. Starting price shown.',
    emoji: '🔧',
    seller: 'Sam',
  },
  {
    id: 'books',
    title: 'Weekend neighborhood book swap',
    price: 0,
    category: 'Community',
    location: 'Riverside',
    posted: '3 days ago',
    description: 'Bring a book, take a book, meet your neighbors. Saturday from 10 AM to noon at the community table.',
    emoji: '📚',
    seller: 'Neighborhood Library',
  },
  {
    id: 'speaker',
    title: 'Portable Bluetooth speaker',
    price: 38,
    category: 'For sale',
    location: 'Downtown',
    posted: '4 days ago',
    description: 'Compact speaker with a long battery life. Includes charging cable.',
    emoji: '🔊',
    seller: 'Chris',
  },
  {
    id: 'tutor',
    title: 'Friendly math tutoring',
    price: 30,
    category: 'Services',
    location: 'Online / local',
    posted: '4 days ago',
    description: 'Patient tutoring for middle and high school math. Hourly rate shown.',
    emoji: '✏️',
    seller: 'Pat',
  },
];
const STORAGE = 'plocks-townlist-example:v1';
const money = (value: number) => (value === 0 ? 'free' : '$' + value.toLocaleString());
const TINTS: Record<string, string> = {
  'For sale': '#ECE8E2',
  Housing: '#E1EAE6',
  Jobs: '#E6E6F0',
  Services: '#E7EBF3',
  Community: '#F2E9E7',
};
const PHOTOS = {
  bicycle: require('./assets/listings/bicycle.webp'),
  chairRoom: require('./assets/listings/chair-room.webp'),
  livingRoom: require('./assets/listings/living-room.webp'),
  apartment: require('./assets/listings/apartment.webp'),
  balcony: require('./assets/listings/balcony.webp'),
  desk: require('./assets/listings/desk.webp'),
  studio: require('./assets/listings/studio.webp'),
  cafe: require('./assets/listings/cafe.webp'),
};
const photo = (id: string, uri: LightboxItem['uri'], title: string): LightboxItem => ({ id, uri, title });
const GALLERIES: Record<string, LightboxItem[]> = {
  bike: [photo('bike', PHOTOS.bicycle, 'Commuter bike')],
  chair: [
    photo('chair-room', PHOTOS.chairRoom, 'Lounge chair in a reading nook'),
    photo('chair-living', PHOTOS.livingRoom, 'Lounge chair in a living room'),
  ],
  apartment: [
    photo('apartment-room', PHOTOS.apartment, 'Bright living room'),
    photo('apartment-balcony', PHOTOS.balcony, 'Balcony with greenery'),
    photo('apartment-living', PHOTOS.livingRoom, 'Living area'),
  ],
  camera: [photo('camera-studio', PHOTOS.studio, 'Camera on a studio desk')],
  desk: [photo('desk', PHOTOS.desk, 'Writing desk'), photo('desk-studio', PHOTOS.studio, 'Desk in a studio')],
  job: [photo('cafe', PHOTOS.cafe, 'Neighborhood café')],
  plant: [photo('plant', PHOTOS.balcony, 'Balcony plants')],
  room: [photo('room', PHOTOS.livingRoom, 'Shared living room'), photo('room-detail', PHOTOS.apartment, 'Interior')],
  repair: [photo('repair-bike', PHOTOS.bicycle, 'Bicycle')],
  books: [photo('books', PHOTOS.chairRoom, 'Reading corner')],
};

function TownlistScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 880;
  const [tab, setTab] = useState<'browse' | 'saved' | 'post' | 'inbox'>('browse');
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [listings, setListings] = useState<Listing[]>(INITIAL);
  const [saved, setSaved] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [postCategory, setPostCategory] = useState<Category>('For sale');
  const [postLocation, setPostLocation] = useState('');
  const [description, setDescription] = useState('');
  const [postEmoji, setPostEmoji] = useState('📦');
  const [ready, setReady] = useState(false);
  const listing = listings.find((item) => item.id === selected);
  const listingPhotos = listing ? GALLERIES[listing.id] ?? [] : [];
  const results = listings.filter(
    (item) =>
      (tab === 'saved' ? saved.includes(item.id) : category === 'All' || item.category === category) &&
      `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()) &&
      item.location.toLowerCase().includes(location.toLowerCase()),
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as { listings?: Listing[]; saved?: string[]; inquiries?: Inquiry[] };
        if (Array.isArray(data.listings)) setListings(data.listings);
        if (Array.isArray(data.saved)) setSaved(data.saved);
        if (Array.isArray(data.inquiries)) setInquiries(data.inquiries);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ listings, saved, inquiries })).catch(() => {});
  }, [listings, saved, inquiries, ready]);
  function createListing() {
    if (!title.trim() || !postLocation.trim() || !description.trim() || !price.trim()) return;
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) return;
    const next: Listing = {
      id: `local-${Date.now()}`,
      title: title.trim(),
      price: amount,
      category: postCategory,
      location: postLocation.trim(),
      description: description.trim(),
      emoji: postEmoji,
      seller: 'You',
      posted: 'just now',
    };
    setListings((old) => [next, ...old]);
    setTitle('');
    setPrice('');
    setPostLocation('');
    setDescription('');
    setCategory('All');
    setQuery('');
    setLocation('');
    setTab('browse');
    setSelected(next.id);
  }
  function sendInquiry() {
    if (!listing || !message.trim()) return;
    setInquiries((old) => [
      { id: `inquiry-${Date.now()}`, listingId: listing.id, text: message.trim(), when: 'just now' },
      ...old,
    ]);
    setMessage('');
    setSelected(null);
    setTab('inbox');
  }
  const listingRow = (item: Listing) => (
    <Block
      key={item.id}
      onPress={() => setSelected(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
      direction="row"
      gap={14}
      py={13}
      borderBottomWidth={1}
      borderBottomColor={C.line}
    >
      {GALLERIES[item.id]?.length ? (
        <Image
          src={GALLERIES[item.id][0].uri}
          w={wide ? 110 : 94}
          h={wide ? 88 : 77}
          radius={7}
          resizeMode="cover"
          alt=""
        />
      ) : (
        <Block
          gap={0}
          w={wide ? 110 : 94}
          h={wide ? 88 : 77}
          radius={7}
          bg={TINTS[item.category]}
          align="center"
          justify="center"
        >
          <Text size={wide ? 43 : 38}>{item.emoji}</Text>
        </Block>
      )}
      <Block flex={1} miw={0} gap={4}>
        <Text c={C.link} fw="semibold" size={15} numberOfLines={2}>
          {item.title}
        </Text>
        <Text c={C.ink} fw="bold" size={16}>
          {money(item.price)}
          {item.category === 'Housing' ? '/mo' : item.category === 'Jobs' || item.category === 'Services' ? '/hr' : ''}
        </Text>
        <Text c={C.muted} size={12}>
          {item.location} · {item.posted}
        </Text>
      </Block>
      <Block
        gap={0}
        onPress={(event) => {
          event.stopPropagation();
          setSaved((old) => (old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id]));
        }}
        accessibilityRole="button"
        accessibilityLabel={saved.includes(item.id) ? 'Remove saved listing' : 'Save listing'}
        p={7}
        alignSelf="flex-start"
      >
        <Icon
          name="heart"
          variant={saved.includes(item.id) ? 'filled' : 'outlined'}
          color={saved.includes(item.id) ? C.purple : C.muted}
          size={20}
        />
      </Block>
    </Block>
  );
  const nav = (
    <Tabs
      navigationOnly
      orientation={wide ? 'vertical' : 'horizontal'}
      variant="chip"
      color={C.purple}
      value={tab}
      onChange={(item) => {
        setTab(item as typeof tab);
        setSelected(null);
      }}
      items={(['browse', 'saved', 'post', 'inbox'] as const).map((item) => ({
        key: item,
        label: item[0].toUpperCase() + item.slice(1),
        subLabel: item === 'inbox' && inquiries.length ? String(inquiries.length) : undefined,
        icon: (
          <Icon
            name={item === 'browse' ? 'search' : item === 'saved' ? 'heart' : item === 'post' ? 'plus' : 'message'}
            color={tab === item ? C.white : C.muted}
            size={wide ? 20 : 19}
          />
        ),
        content: null,
      }))}
    />
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.white}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} w="100%" maw={1250} alignSelf="center">
        {wide && (
          <Block w={220} p={18} borderRightWidth={1} borderRightColor={C.line} gap={20}>
            <Text c={C.purple} fw="bold" size={27}>
              townlist
            </Text>
            {nav}
            <Block gap={0} h={1} bg={C.line} />
            <Text c={C.muted} fw="bold" size={11}>
              CATEGORIES
            </Text>
            {CATEGORIES.map((item) => (
              <Block key={item} gap={0} align="flex-start">
                <Chip
                  onPress={() => {
                    setCategory(item);
                    setTab('browse');
                  }}
                  pressed={category === item}
                  variant={category === item ? 'light' : 'subtle'}
                  color={C.purple}
                  size="sm"
                >
                  {item}
                </Chip>
              </Block>
            ))}
            <Block gap={0} flex={1} />
            <Text c={C.muted} size={11}>
              A local classifieds demo
            </Text>
          </Block>
        )}
        <Block gap={0} flex={1}>
          {!wide && (
            <Block
              gap={0}
              h={58}
              direction="row"
              align="center"
              justify="space-between"
              px={18}
              borderBottomWidth={1}
              borderBottomColor={C.line}
            >
              <Text c={C.purple} fw="bold" size={25}>
                townlist
              </Text>
              <Text c={C.muted} size={12}>
                Your neighborhood
              </Text>
            </Block>
          )}
          <ScrollArea flex={1} keyboardShouldPersistTaps="handled" contentProps={{ align: 'center', p: 20, pb: 40 }}>
            <Block gap={0} w="100%" maw={850}>
              {(tab === 'browse' || tab === 'saved') && (
                <>
                  <Text c={C.ink} fw="bold" size={27}>
                    {tab === 'saved' ? 'Saved listings' : category === 'All' ? 'Find it around the corner' : category}
                  </Text>
                  <Text c={C.muted} size={13} mt={3}>
                    {tab === 'saved' ? 'Listings you want to revisit.' : 'Local finds, people, and possibilities.'}
                  </Text>
                  <Block direction={wide ? 'row' : 'column'} gap={9} mt={19}>
                    <Input
                      variant="outline"
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Search listings"
                      mb={0}
                      flex={1}
                      mih={43}
                      radius={7}
                      inputColor={C.ink}
                    />
                    <Input
                      variant="outline"
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Location"
                      mb={0}
                      w={wide ? 180 : '100%'}
                      mih={43}
                      radius={7}
                      inputColor={C.ink}
                    />
                  </Block>
                  {!wide && tab === 'browse' && (
                    <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8, py: 17 }}>
                      {CATEGORIES.map((item) => (
                        <Chip
                          key={item}
                          onPress={() => setCategory(item)}
                          pressed={category === item}
                          variant={category === item ? 'filled' : 'surface'}
                          color={C.purple}
                          size="sm"
                        >
                          {item}
                        </Chip>
                      ))}
                    </ScrollArea>
                  )}
                  <Block
                    gap={0}
                    direction="row"
                    justify="space-between"
                    mt={wide ? 21 : 4}
                    pb={7}
                    borderBottomWidth={1}
                    borderBottomColor={C.line}
                  >
                    <Text c={C.muted} size={12}>
                      {results.length} {results.length === 1 ? 'result' : 'results'}
                    </Text>
                    <Text c={C.muted} size={12}>
                      newest first
                    </Text>
                  </Block>
                  {results.length ? (
                    results.map(listingRow)
                  ) : (
                    <Block p={50} align="center" gap={8}>
                      <Icon name="search" color={C.muted} size={29} />
                      <Text c={C.muted} ta="center">
                        No listings match. Try another search or category.
                      </Text>
                    </Block>
                  )}
                </>
              )}
              {tab === 'post' && (
                <Block gap={14}>
                  <Text c={C.ink} fw="bold" size={27}>
                    Create a listing
                  </Text>
                  <Text c={C.muted} size={13}>
                    Share something with your neighborhood.
                  </Text>
                  <Text c={C.ink} fw="semibold" size={13}>
                    Title
                  </Text>
                  <Input
                    variant="outline"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="What are you posting?"
                    mb={0}
                    radius={7}
                    inputColor={C.ink}
                  />
                  <Text c={C.ink} fw="semibold" size={13}>
                    Category
                  </Text>
                  <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8 }}>
                    {CATEGORIES.filter((item) => item !== 'All').map((item) => (
                      <Block
                        gap={0}
                        key={item}
                        onPress={() => setPostCategory(item)}
                        px={13}
                        py={8}
                        radius={16}
                        bg={postCategory === item ? C.purple : C.pale}
                      >
                        <Text c={postCategory === item ? C.white : C.purple} size={12} fw="semibold">
                          {item}
                        </Text>
                      </Block>
                    ))}
                  </ScrollArea>
                  <Block direction="row" gap={10}>
                    <Block flex={1} gap={7}>
                      <Text c={C.ink} fw="semibold" size={13}>
                        Price
                      </Text>
                      <Input
                        variant="outline"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        mb={0}
                        radius={7}
                        inputColor={C.ink}
                      />
                    </Block>
                    <Block flex={1} gap={7}>
                      <Text c={C.ink} fw="semibold" size={13}>
                        Location
                      </Text>
                      <Input
                        variant="outline"
                        value={postLocation}
                        onChangeText={setPostLocation}
                        placeholder="Neighborhood"
                        mb={0}
                        radius={7}
                        inputColor={C.ink}
                      />
                    </Block>
                  </Block>
                  <Text c={C.ink} fw="semibold" size={13}>
                    Choose an icon
                  </Text>
                  <Block direction="row" gap={11}>
                    {['📦', '🚲', '🪑', '🏡', '📚'].map((item) => (
                      <Block
                        gap={0}
                        key={item}
                        onPress={() => setPostEmoji(item)}
                        w={48}
                        h={48}
                        radius={8}
                        align="center"
                        justify="center"
                        bg={postEmoji === item ? '#E8DDF2' : C.pale}
                        borderWidth={postEmoji === item ? 2 : 0}
                        borderColor={C.purple}
                      >
                        <Text size={27}>{item}</Text>
                      </Block>
                    ))}
                  </Block>
                  <Text c={C.ink} fw="semibold" size={13}>
                    Description
                  </Text>
                  <TextArea
                    variant="outline"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the details..."
                    mb={0}
                    rows={4}
                    radius={7}
                  />
                  <Button
                    title="Publish listing"
                    color={C.purple}
                    onPress={createListing}
                    disabled={
                      !title.trim() ||
                      !price.trim() ||
                      !postLocation.trim() ||
                      !description.trim() ||
                      !Number.isFinite(Number(price)) ||
                      Number(price) < 0
                    }
                  />
                  <Text c={C.muted} size={11}>
                    Your listing stays on this device.
                  </Text>
                </Block>
              )}
              {tab === 'inbox' && (
                <Block gap={13}>
                  <Text c={C.ink} fw="bold" size={27}>
                    Inbox
                  </Text>
                  {inquiries.length === 0 && <Text c={C.muted}>Messages you send to sellers will appear here.</Text>}
                  {inquiries.map((inquiry) => {
                    const item = listings.find((entry) => entry.id === inquiry.listingId);
                    return (
                      <Block
                        key={inquiry.id}
                        onPress={() => setSelected(inquiry.listingId)}
                        p={15}
                        borderWidth={1}
                        borderColor={C.line}
                        radius={8}
                        gap={6}
                      >
                        <Text c={C.link} fw="semibold" size={14}>
                          {item?.title ?? 'Listing'}
                        </Text>
                        <Text c={C.ink} size={13}>
                          You: {inquiry.text}
                        </Text>
                        <Text c={C.muted} size={11}>
                          {inquiry.when} · Demo message stored locally
                        </Text>
                      </Block>
                    );
                  })}
                </Block>
              )}
            </Block>
          </ScrollArea>
          {!wide && (
            <Block gap={0} borderTopWidth={1} borderTopColor={C.line} bg={C.white}>
              {nav}
            </Block>
          )}
        </Block>
      </Block>
      {!!listing && (
        <Dialog opened accessibilityLabel={listing.title} onClose={() => {
          setSelected(null);
          setLightboxIndex(null);
        }}>
          <Block gap={0}>
            <ScrollArea contentProps={{ p: 18, gap: 12 }}>
              <Block gap={0} direction="row" justify="space-between" align="center">
                <Text c={C.muted} size={12}>
                  {listing.posted} · {listing.location}
                </Text>
                <IconButton
                  icon="x"
                  variant="ghost"
                  iconColor={C.ink}
                  accessibilityLabel="Close listing"
                  onPress={() => setSelected(null)}
                />
              </Block>
              {listingPhotos.length ? (
                <>
                  <Block
                    gap={0}
                    onPress={() => setLightboxIndex(0)}
                    accessibilityRole="button"
                    accessibilityLabel={`View photos of ${listing.title}`}
                  >
                    <Image src={listingPhotos[0].uri} w="100%" h={240} radius={7} resizeMode="cover" alt="" />
                  </Block>
                  {listingPhotos.length > 1 && (
                    <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8 }}>
                      {listingPhotos.map((item, index) => (
                        <Block
                          key={item.id}
                          gap={0}
                          onPress={() => setLightboxIndex(index)}
                          accessibilityRole="button"
                          accessibilityLabel={`Open photo ${index + 1} of ${listingPhotos.length}`}
                        >
                          <Image src={item.uri} w={84} h={68} radius={5} resizeMode="cover" alt="" />
                        </Block>
                      ))}
                    </ScrollArea>
                  )}
                </>
              ) : (
                <Block gap={0} h={170} bg={TINTS[listing.category]} radius={7} align="center" justify="center">
                  <Text size={86}>{listing.emoji}</Text>
                </Block>
              )}
              <Text c={C.link} fw="bold" size={23}>
                {listing.title}
              </Text>
              <Text c={C.ink} fw="bold" size={22}>
                {money(listing.price)}
                {listing.category === 'Housing'
                  ? '/mo'
                  : listing.category === 'Jobs' || listing.category === 'Services'
                    ? '/hr'
                    : ''}
              </Text>
              <Text c={C.muted} size={12}>
                {listing.category} · posted by {listing.seller}
              </Text>
              <Block gap={0} h={1} bg={C.line} />
              <Text c={C.ink} size={14} lh={22}>
                {listing.description}
              </Text>
              <Block
                onPress={() =>
                  setSaved((old) =>
                    old.includes(listing.id) ? old.filter((id) => id !== listing.id) : [...old, listing.id],
                  )
                }
                direction="row"
                align="center"
                gap={8}
                py={8}
              >
                <Icon
                  name="heart"
                  variant={saved.includes(listing.id) ? 'filled' : 'outlined'}
                  color={C.purple}
                  size={19}
                />
                <Text c={C.purple} fw="semibold">
                  {saved.includes(listing.id) ? 'Saved' : 'Save listing'}
                </Text>
              </Block>
              {listing.seller !== 'You' && (
                <Block gap={9} pt={8}>
                  <Text c={C.ink} fw="bold" size={15}>
                    Message {listing.seller}
                  </Text>
                  <TextArea
                    variant="outline"
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Hi, is this still available?"
                    mb={0}
                    rows={3}
                    radius={7}
                  />
                  <Button title="Send demo message" color={C.purple} disabled={!message.trim()} onPress={sendInquiry} />
                  <Text c={C.muted} size={11}>
                    Messages stay on this device and are not sent to sellers.
                  </Text>
                </Block>
              )}
            </ScrollArea>
          </Block>
          <Lightbox
            opened={lightboxIndex !== null && listingPhotos.length > 0}
            images={listingPhotos}
            initialIndex={lightboxIndex ?? 0}
            onClose={() => setLightboxIndex(null)}
            showDownloadButton={false}
            accessibilityLabel={`${listing.title} photos`}
          />
        </Dialog>
      )}
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <TownlistScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
