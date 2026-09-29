import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui-snack';

const C = { purple: '#5D3291', link: '#315AA6', ink: '#202020', muted: '#6D6D6D', line: '#DADADA', pale: '#F5F3F8', white: '#FFF', green: '#24724C' };
const CATEGORIES = ['All', 'For sale', 'Housing', 'Jobs', 'Services', 'Community'];
type Category = typeof CATEGORIES[number];
type Listing = { id: string; title: string; price: number; category: Category; location: string; posted: string; description: string; emoji: string; seller: string };
type Inquiry = { id: string; listingId: string; text: string; when: string };
const INITIAL: Listing[] = [
  { id: 'bike', title: 'Commuter bike, excellent condition', price: 220, category: 'For sale', location: 'Downtown', posted: 'today', description: 'Reliable city bike with a comfortable seat and new tires. Ready to ride. Pickup near the library.', emoji: '🚲', seller: 'Alex' },
  { id: 'chair', title: 'Mid century lounge chair', price: 145, category: 'For sale', location: 'Northside', posted: 'today', description: 'Solid wood lounge chair with fresh upholstery. A few small signs of use, otherwise lovely.', emoji: '🪑', seller: 'Morgan' },
  { id: 'apartment', title: 'Sunny 1 bedroom near the park', price: 1350, category: 'Housing', location: 'Midtown', posted: 'today', description: 'Bright one bedroom with balcony, in-unit laundry, and a short walk to the park. Monthly rent shown.', emoji: '🏡', seller: 'Dana' },
  { id: 'camera', title: 'Film camera and two lenses', price: 310, category: 'For sale', location: 'West End', posted: 'yesterday', description: 'Well cared for 35mm film camera. Includes a 50mm lens, wide lens, strap, and carrying case.', emoji: '📷', seller: 'Jamie' },
  { id: 'desk', title: 'Writing desk with drawers', price: 85, category: 'For sale', location: 'East Village', posted: 'yesterday', description: 'Compact wood desk with two smooth drawers. Perfect for a small workspace.', emoji: '🪵', seller: 'Riley' },
  { id: 'job', title: 'Part time café team member', price: 18, category: 'Jobs', location: 'Downtown', posted: 'yesterday', description: 'Neighborhood café looking for a friendly part time teammate. Pay shown per hour. Flexible mornings.', emoji: '☕', seller: 'Little Corner Café' },
  { id: 'plant', title: 'Large monstera with ceramic pot', price: 45, category: 'For sale', location: 'Northside', posted: '2 days ago', description: 'Healthy monstera with lots of new growth. Comes with the ceramic pot pictured in the demo.', emoji: '🪴', seller: 'Taylor' },
  { id: 'room', title: 'Room in friendly shared house', price: 790, category: 'Housing', location: 'Riverside', posted: '2 days ago', description: 'Private room in a bright shared home. Utilities included. Monthly rent shown.', emoji: '🛏️', seller: 'Casey' },
  { id: 'repair', title: 'Bike tune ups and repairs', price: 35, category: 'Services', location: 'Midtown', posted: '3 days ago', description: 'Local bicycle tune ups, tire replacements, and simple repairs. Starting price shown.', emoji: '🔧', seller: 'Sam' },
  { id: 'books', title: 'Weekend neighborhood book swap', price: 0, category: 'Community', location: 'Riverside', posted: '3 days ago', description: 'Bring a book, take a book, meet your neighbors. Saturday from 10 AM to noon at the community table.', emoji: '📚', seller: 'Neighborhood Library' },
  { id: 'speaker', title: 'Portable Bluetooth speaker', price: 38, category: 'For sale', location: 'Downtown', posted: '4 days ago', description: 'Compact speaker with a long battery life. Includes charging cable.', emoji: '🔊', seller: 'Chris' },
  { id: 'tutor', title: 'Friendly math tutoring', price: 30, category: 'Services', location: 'Online / local', posted: '4 days ago', description: 'Patient tutoring for middle and high school math. Hourly rate shown.', emoji: '✏️', seller: 'Pat' },
];
const STORAGE = 'plocks-craigslist-example:v1';
const money = (value: number) => value === 0 ? 'free' : '$' + value.toLocaleString();
const TINTS: Record<string, string> = { 'For sale': '#ECE8E2', Housing: '#E1EAE6', Jobs: '#E6E6F0', Services: '#E7EBF3', Community: '#F2E9E7' };

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
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [postCategory, setPostCategory] = useState<Category>('For sale');
  const [postLocation, setPostLocation] = useState('');
  const [description, setDescription] = useState('');
  const [postEmoji, setPostEmoji] = useState('📦');
  const [ready, setReady] = useState(false);
  const listing = listings.find((item) => item.id === selected);
  const results = listings.filter((item) =>
    (tab === 'saved' ? saved.includes(item.id) : category === 'All' || item.category === category) &&
    `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()) &&
    item.location.toLowerCase().includes(location.toLowerCase()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { listings?: Listing[]; saved?: string[]; inquiries?: Inquiry[] };
      if (Array.isArray(data.listings)) setListings(data.listings);
      if (Array.isArray(data.saved)) setSaved(data.saved);
      if (Array.isArray(data.inquiries)) setInquiries(data.inquiries);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ listings, saved, inquiries })).catch(() => {});
  }, [listings, saved, inquiries, ready]);
  function createListing() {
    if (!title.trim() || !postLocation.trim() || !description.trim() || !price.trim()) return;
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) return;
    const next: Listing = { id: `local-${Date.now()}`, title: title.trim(), price: amount, category: postCategory,
      location: postLocation.trim(), description: description.trim(), emoji: postEmoji, seller: 'You', posted: 'just now' };
    setListings((old) => [next, ...old]);
    setTitle(''); setPrice(''); setPostLocation(''); setDescription('');
    setCategory('All'); setQuery(''); setLocation(''); setTab('browse'); setSelected(next.id);
  }
  function sendInquiry() {
    if (!listing || !message.trim()) return;
    setInquiries((old) => [{ id: `inquiry-${Date.now()}`, listingId: listing.id, text: message.trim(), when: 'just now' }, ...old]);
    setMessage('');
    setSelected(null);
    setTab('inbox');
  }
  const listingRow = (item: Listing) => <Pressable key={item.id} onPress={() => setSelected(item.id)}
    accessibilityRole="button" accessibilityLabel={`View ${item.title}`}
    style={{ flexDirection: 'row', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line }}>
    <View style={{ width: wide ? 110 : 94, height: wide ? 88 : 77, borderRadius: 7, backgroundColor: TINTS[item.category],
      alignItems: 'center', justifyContent: 'center' }}><Text size={wide ? 43 : 38}>{item.emoji}</Text></View>
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <Text c={C.link} fw="semibold" size={15} numberOfLines={2}>{item.title}</Text>
      <Text c={C.ink} fw="bold" size={16}>{money(item.price)}{item.category === 'Housing' ? '/mo' : item.category === 'Jobs' || item.category === 'Services' ? '/hr' : ''}</Text>
      <Text c={C.muted} size={12}>{item.location} · {item.posted}</Text>
    </View>
    <Pressable onPress={(event) => { event.stopPropagation(); setSaved((old) => old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id]); }}
      accessibilityRole="button" accessibilityLabel={saved.includes(item.id) ? 'Remove saved listing' : 'Save listing'}
      style={{ padding: 7, alignSelf: 'flex-start' }}><Icon name="heart" variant={saved.includes(item.id) ? 'filled' : 'outlined'}
        color={saved.includes(item.id) ? C.purple : C.muted} size={20} /></Pressable>
  </Pressable>;
  const nav = <View style={{ flexDirection: wide ? 'column' : 'row', justifyContent: 'space-around', gap: wide ? 7 : 0 }}>
    {(['browse', 'saved', 'post', 'inbox'] as const).map((item) => <Pressable key={item} onPress={() => { setTab(item); setSelected(null); }}
      accessibilityRole="tab" accessibilityState={{ selected: tab === item }} style={{ flexDirection: wide ? 'row' : 'column',
        alignItems: 'center', gap: wide ? 12 : 4, paddingHorizontal: wide ? 11 : 5, paddingVertical: 10,
        backgroundColor: wide && tab === item ? '#EDE7F4' : 'transparent', borderRadius: 9 }}>
      <Icon name={item === 'browse' ? 'search' : item === 'saved' ? 'heart' : item === 'post' ? 'plus' : 'message'}
        variant={tab === item ? 'filled' : 'outlined'} color={tab === item ? C.purple : C.muted} size={wide ? 20 : 22} />
      <Text c={tab === item ? C.purple : C.muted} fw={tab === item ? 'bold' : 'normal'} size={wide ? 14 : 10}>
        {item === 'inbox' && inquiries.length ? `Inbox (${inquiries.length})` : item[0].toUpperCase() + item.slice(1)}</Text>
    </Pressable>)}
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}><StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', width: '100%', maxWidth: 1250, alignSelf: 'center' }}>
      {wide && <View style={{ width: 220, padding: 18, borderRightWidth: 1, borderRightColor: C.line, gap: 20 }}>
        <Text c={C.purple} fw="bold" size={27}>townlist</Text>{nav}
        <View style={{ height: 1, backgroundColor: C.line }} />
        <Text c={C.muted} fw="bold" size={11}>CATEGORIES</Text>
        {CATEGORIES.map((item) => <Pressable key={item} onPress={() => { setCategory(item); setTab('browse'); }}
          style={{ paddingVertical: 5 }}><Text c={category === item ? C.purple : C.link} fw={category === item ? 'bold' : 'normal'} size={13}>{item}</Text></Pressable>)}
        <View style={{ flex: 1 }} /><Text c={C.muted} size={11}>A local classifieds demo</Text>
      </View>}
      <View style={{ flex: 1 }}>
        {!wide && <View style={{ height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text c={C.purple} fw="bold" size={25}>townlist</Text><Text c={C.muted} size={12}>Your neighborhood</Text>
        </View>}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center', padding: 20, paddingBottom: 40 }}>
          <View style={{ width: '100%', maxWidth: 850 }}>
            {(tab === 'browse' || tab === 'saved') && <>
              <Text c={C.ink} fw="bold" size={27}>{tab === 'saved' ? 'Saved listings' : category === 'All' ? 'Find it around the corner' : category}</Text>
              <Text c={C.muted} size={13} style={{ marginTop: 3 }}>{tab === 'saved' ? 'Listings you want to revisit.' : 'Local finds, people, and possibilities.'}</Text>
              <View style={{ flexDirection: wide ? 'row' : 'column', gap: 9, marginTop: 19 }}>
                <TextInput value={query} onChangeText={setQuery} placeholder="Search listings" style={{ flex: 1, minHeight: 43,
                  borderWidth: 1, borderColor: C.line, borderRadius: 7, paddingHorizontal: 12, color: C.ink }} />
                <TextInput value={location} onChangeText={setLocation} placeholder="Location" style={{ width: wide ? 180 : '100%', minHeight: 43,
                  borderWidth: 1, borderColor: C.line, borderRadius: 7, paddingHorizontal: 12, color: C.ink }} />
              </View>
              {!wide && tab === 'browse' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 17 }}>
                {CATEGORIES.map((item) => <Pressable key={item} onPress={() => setCategory(item)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: category === item ? C.purple : C.pale }}>
                  <Text c={category === item ? C.white : C.purple} fw="semibold" size={12}>{item}</Text></Pressable>)}
              </ScrollView>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: wide ? 21 : 4, paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: C.line }}>
                <Text c={C.muted} size={12}>{results.length} {results.length === 1 ? 'result' : 'results'}</Text>
                <Text c={C.muted} size={12}>newest first</Text>
              </View>
              {results.length ? results.map(listingRow) : <View style={{ padding: 50, alignItems: 'center', gap: 8 }}>
                <Icon name="search" color={C.muted} size={29} /><Text c={C.muted} ta="center">No listings match. Try another search or category.</Text></View>}
            </>}
            {tab === 'post' && <View style={{ gap: 14 }}>
              <Text c={C.ink} fw="bold" size={27}>Create a listing</Text>
              <Text c={C.muted} size={13}>Share something with your neighborhood.</Text>
              <Text c={C.ink} fw="semibold" size={13}>Title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="What are you posting?" style={{ borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 12, color: C.ink }} />
              <Text c={C.ink} fw="semibold" size={13}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.filter((item) => item !== 'All').map((item) => <Pressable key={item} onPress={() => setPostCategory(item)}
                  style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 16, backgroundColor: postCategory === item ? C.purple : C.pale }}>
                  <Text c={postCategory === item ? C.white : C.purple} size={12} fw="semibold">{item}</Text></Pressable>)}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 7 }}><Text c={C.ink} fw="semibold" size={13}>Price</Text>
                  <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" style={{ borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 12, color: C.ink }} /></View>
                <View style={{ flex: 1, gap: 7 }}><Text c={C.ink} fw="semibold" size={13}>Location</Text>
                  <TextInput value={postLocation} onChangeText={setPostLocation} placeholder="Neighborhood" style={{ borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 12, color: C.ink }} /></View>
              </View>
              <Text c={C.ink} fw="semibold" size={13}>Choose an icon</Text>
              <View style={{ flexDirection: 'row', gap: 11 }}>{['📦', '🚲', '🪑', '🏡', '📚'].map((item) => <Pressable key={item} onPress={() => setPostEmoji(item)}
                style={{ width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: postEmoji === item ? '#E8DDF2' : C.pale, borderWidth: postEmoji === item ? 2 : 0, borderColor: C.purple }}>
                <Text size={27}>{item}</Text></Pressable>)}</View>
              <Text c={C.ink} fw="semibold" size={13}>Description</Text>
              <TextInput value={description} onChangeText={setDescription} multiline placeholder="Describe the details..."
                style={{ minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 12, color: C.ink }} />
              <Button title="Publish listing" color={C.purple} onPress={createListing}
                disabled={!title.trim() || !price.trim() || !postLocation.trim() || !description.trim() || !Number.isFinite(Number(price)) || Number(price) < 0} />
              <Text c={C.muted} size={11}>Your listing stays on this device.</Text>
            </View>}
            {tab === 'inbox' && <View style={{ gap: 13 }}><Text c={C.ink} fw="bold" size={27}>Inbox</Text>
              {inquiries.length === 0 && <Text c={C.muted}>Messages you send to sellers will appear here.</Text>}
              {inquiries.map((inquiry) => { const item = listings.find((entry) => entry.id === inquiry.listingId); return <Pressable key={inquiry.id}
                onPress={() => setSelected(inquiry.listingId)} style={{ padding: 15, borderWidth: 1, borderColor: C.line, borderRadius: 8, gap: 6 }}>
                <Text c={C.link} fw="semibold" size={14}>{item?.title ?? 'Listing'}</Text>
                <Text c={C.ink} size={13}>You: {inquiry.text}</Text>
                <Text c={C.muted} size={11}>{inquiry.when} · Demo message stored locally</Text>
              </Pressable>; })}
            </View>}
          </View>
        </ScrollView>
        {!wide && <View style={{ borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white }}>{nav}</View>}
      </View>
    </View>
    {!!listing && <View style={{ position: 'absolute', inset: 0, backgroundColor: '#17101D99', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
      <View style={{ width: '100%', maxWidth: 600, maxHeight: '93%', backgroundColor: C.white, borderRadius: 12, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text c={C.muted} size={12}>{listing.posted} · {listing.location}</Text>
            <IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Close listing" onPress={() => setSelected(null)} />
          </View>
          <View style={{ height: 170, backgroundColor: TINTS[listing.category], borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
            <Text size={86}>{listing.emoji}</Text></View>
          <Text c={C.link} fw="bold" size={23}>{listing.title}</Text>
          <Text c={C.ink} fw="bold" size={22}>{money(listing.price)}{listing.category === 'Housing' ? '/mo' : listing.category === 'Jobs' || listing.category === 'Services' ? '/hr' : ''}</Text>
          <Text c={C.muted} size={12}>{listing.category} · posted by {listing.seller}</Text>
          <View style={{ height: 1, backgroundColor: C.line }} />
          <Text c={C.ink} size={14} style={{ lineHeight: 22 }}>{listing.description}</Text>
          <Pressable onPress={() => setSaved((old) => old.includes(listing.id) ? old.filter((id) => id !== listing.id) : [...old, listing.id])}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <Icon name="heart" variant={saved.includes(listing.id) ? 'filled' : 'outlined'} color={C.purple} size={19} />
            <Text c={C.purple} fw="semibold">{saved.includes(listing.id) ? 'Saved' : 'Save listing'}</Text></Pressable>
          {listing.seller !== 'You' && <View style={{ gap: 9, paddingTop: 8 }}>
            <Text c={C.ink} fw="bold" size={15}>Message {listing.seller}</Text>
            <TextInput value={message} onChangeText={setMessage} multiline placeholder="Hi, is this still available?"
              style={{ minHeight: 70, borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 10, color: C.ink, textAlignVertical: 'top' }} />
            <Button title="Send demo message" color={C.purple} disabled={!message.trim()} onPress={sendInquiry} />
            <Text c={C.muted} size={11}>Messages stay on this device and are not sent to sellers.</Text>
          </View>}
        </ScrollView>
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'light' }}><TownlistScreen /></PlocksProvider></SafeAreaProvider>;
}
