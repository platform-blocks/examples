import { useEffect, useState } from 'react';
import { PanResponder, Platform, Pressable, ScrollView, Share, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, PlocksProvider, Text } from '@plocks/ui';

const C = { black: '#090909', panel: '#181818', white: '#FFF', muted: '#B6B6B6', line: '#303030', pink: '#FF3B77', teal: '#20D3C5' };
const PRODUCTS = [
  { id: 'lamp', name: 'Sunset Glow Lamp', creator: '@roomforjoy', price: 29.99, old: 42, emoji: '💡', category: 'Home', colors: ['#E84986', '#8F3B97'] as const, caption: 'The little light that changed my whole room ✨', likes: 12400, rating: '4.9', sold: '2.4k' },
  { id: 'headphones', name: 'Cloud Wireless Headphones', creator: '@listenwithlea', price: 48, old: 65, emoji: '🎧', category: 'Tech', colors: ['#3657B9', '#151B4B'] as const, caption: 'A whole new soundtrack for your commute 🎶', likes: 8700, rating: '4.8', sold: '1.8k' },
  { id: 'mug', name: 'Everyday Ceramic Mug', creator: '@slowmornings', price: 18.5, old: 25, emoji: '☕', category: 'Home', colors: ['#B88662', '#523B37'] as const, caption: 'A five minute coffee break that feels like a vacation.', likes: 4200, rating: '4.9', sold: '980' },
  { id: 'bag', name: 'Mini Weekend Tote', creator: '@stylewithsam', price: 34.95, old: 49, emoji: '👜', category: 'Style', colors: ['#D76B80', '#743750'] as const, caption: 'The bag that somehow fits everything I need 👜', likes: 19100, rating: '4.7', sold: '3.1k' },
  { id: 'plant', name: 'Desktop Plant Kit', creator: '@greenlittlethings', price: 22, old: 30, emoji: '🪴', category: 'Home', colors: ['#3A9B7A', '#164B43'] as const, caption: 'Your desk deserves a tiny garden 🌿', likes: 6300, rating: '4.8', sold: '1.2k' },
];
type Product = typeof PRODUCTS[number];
type Tab = 'feed' | 'shop' | 'cart';
type Cart = Record<string, number>;
const STORAGE = 'plocks-tiktok-shop-example:v1';
const money = (value: number) => '$' + value.toFixed(2);

function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  return <LinearGradient colors={[product.colors[0], product.colors[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={{ flex: 1, width: '100%', borderRadius: compact ? 14 : 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {!compact && <View style={{ position: 'absolute', top: '9%', left: '9%', width: 115, height: 115, borderRadius: 58, borderWidth: 1, borderColor: '#FFFFFF40' }} />}
    {!compact && <View style={{ position: 'absolute', bottom: '17%', right: '-10%', width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFFFFF13' }} />}
    <Text size={compact ? 67 : 150} style={{ lineHeight: compact ? 90 : 195 }}>{product.emoji}</Text>
    {!compact && <View style={{ position: 'absolute', top: 22, left: 20, borderRadius: 5, backgroundColor: '#0008', paddingHorizontal: 9, paddingVertical: 6 }}>
      <Text c={C.white} fw="bold" size={11}>SHOP THE VIDEO</Text></View>}
  </LinearGradient>;
}

function LoopshopScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const [tab, setTab] = useState<Tab>('feed');
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [detail, setDetail] = useState<string | null>(null);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const product = PRODUCTS[index];
  const detailProduct = PRODUCTS.find((item) => item.id === detail);
  const commentProduct = PRODUCTS.find((item) => item.id === commentFor);
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = PRODUCTS.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.price, 0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE).then((raw) => {
      if (!raw) return;
      const data = JSON.parse(raw) as { liked?: string[]; cart?: Cart; comments?: Record<string, string[]> };
      if (Array.isArray(data.liked)) setLiked(data.liked);
      if (data.cart && typeof data.cart === 'object') setCart(data.cart);
      if (data.comments && typeof data.comments === 'object') setComments(data.comments);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ liked, cart, comments })).catch(() => {});
  }, [liked, cart, comments, ready]);
  const swipe = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 15,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -70) setIndex((old) => (old + 1) % PRODUCTS.length);
      if (gesture.dy > 70) setIndex((old) => (old - 1 + PRODUCTS.length) % PRODUCTS.length);
    },
  });
  function addToCart(id: string) {
    setCart((old) => ({ ...old, [id]: (old[id] ?? 0) + 1 }));
    setToast('Added to cart');
  }
  function postComment() {
    if (!commentFor || !draft.trim()) return;
    setComments((old) => ({ ...old, [commentFor]: [...(old[commentFor] ?? []), draft.trim()] }));
    setDraft('');
  }
  async function shareProduct(item: Product) {
    const details = `${item.name} — ${money(item.price)}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(details);
        setToast('Product details copied');
      } else {
        await Share.share({ message: details });
      }
    } catch {
      setToast('Unable to share product');
    }
  }
  const nav = <View style={{ flexDirection: wide ? 'column' : 'row', justifyContent: 'space-around', gap: wide ? 8 : 0 }}>
    {(['feed', 'shop', 'cart'] as const).map((item) => <Pressable key={item} onPress={() => { setTab(item); setToast(''); }}
      accessibilityRole="tab" accessibilityState={{ selected: tab === item }}
      style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', gap: wide ? 13 : 4,
        paddingVertical: 11, paddingHorizontal: wide ? 14 : 8, borderRadius: 11,
        backgroundColor: wide && tab === item ? '#2C2C2C' : 'transparent' }}>
      <Icon name={item === 'feed' ? 'home' : item === 'shop' ? 'grid' : 'cart'} variant={tab === item ? 'filled' : 'outlined'}
        color={tab === item ? C.white : C.muted} size={wide ? 21 : 23} />
      <Text c={tab === item ? C.white : C.muted} fw={tab === item ? 'bold' : 'normal'} size={wide ? 15 : 11}>
        {item === 'cart' && cartCount ? `Cart (${cartCount})` : item[0].toUpperCase() + item.slice(1)}</Text>
    </Pressable>)}
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.black }}><StatusBar barStyle="light-content" />
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', maxWidth: 1250, width: '100%', alignSelf: 'center' }}>
      {wide && <View style={{ width: 225, borderRightWidth: 1, borderRightColor: C.line, padding: 18, gap: 30 }}>
        <Text c={C.white} fw="bold" size={27}>loop<Text c={C.pink} fw="bold">shop</Text></Text>{nav}
        <View style={{ flex: 1 }} /><Text c={C.muted} size={11}>Demo storefront · no purchases</Text>
      </View>}
      <View style={{ flex: 1 }}>
        {!wide && <View style={{ height: 54, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text c={C.white} fw="bold" size={20}>loop<Text c={C.pink} fw="bold">shop</Text></Text>
        </View>}
        {tab === 'feed' && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.black }}>
          <View style={{ flex: 1, width: '100%', maxWidth: wide ? 460 : 560, position: 'relative', overflow: 'hidden' }}>
            <View {...swipe.panHandlers} accessibilityLabel={`${product.name} video card. Swipe up for next product.`} style={{ flex: 1 }}>
              <ProductArt product={product} />
            </View>
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, backgroundColor: '#0006' }} />
            <View style={{ position: 'absolute', left: 17, bottom: 22, right: 75, gap: 8 }}>
              <Text c={C.white} fw="bold" size={16}>{product.creator}</Text>
              <Text c={C.white} size={14} style={{ lineHeight: 20 }}>{product.caption}</Text>
              <Pressable onPress={() => setDetail(product.id)} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}
                style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9,
                  backgroundColor: '#FFF', borderRadius: 9, maxWidth: '100%' }}>
                <Text size={25}>{product.emoji}</Text><View style={{ flex: 1 }}>
                  <Text c={C.black} fw="bold" size={12} numberOfLines={1}>{product.name}</Text>
                  <Text c={C.pink} fw="bold" size={12}>{money(product.price)}  <Text c="#888" size={11} style={{ textDecorationLine: 'line-through' }}>{money(product.old)}</Text></Text>
                </View><Icon name="chevronRight" size={16} color={C.black} />
              </Pressable>
            </View>
            <View style={{ position: 'absolute', right: 11, bottom: 96, alignItems: 'center', gap: 18 }}>
              <Pressable onPress={() => setLiked((old) => old.includes(product.id) ? old.filter((id) => id !== product.id) : [...old, product.id])}
                accessibilityRole="button" accessibilityLabel={liked.includes(product.id) ? 'Unlike product' : 'Like product'} style={{ alignItems: 'center', gap: 2 }}>
                <Icon name="heart" variant="filled" color={liked.includes(product.id) ? C.pink : C.white} size={31} />
                <Text c={C.white} fw="bold" size={11}>{((product.likes + Number(liked.includes(product.id))) / 1000).toFixed(1)}k</Text>
              </Pressable>
              <Pressable onPress={() => setCommentFor(product.id)} accessibilityRole="button" accessibilityLabel="Comments" style={{ alignItems: 'center', gap: 2 }}>
                <Icon name="message" variant="filled" color={C.white} size={30} />
                <Text c={C.white} fw="bold" size={11}>{comments[product.id]?.length ?? 0}</Text></Pressable>
              <Pressable onPress={() => shareProduct(product)}
                accessibilityRole="button" accessibilityLabel="Share product"
                style={{ alignItems: 'center' }}><Icon name="arrowRight" color={C.white} size={30} /><Text c={C.white} fw="bold" size={11}>Share</Text></Pressable>
              <Pressable onPress={() => addToCart(product.id)} accessibilityRole="button" accessibilityLabel="Add to cart"
                style={{ alignItems: 'center' }}><Icon name="cart" color={C.white} size={30} /><Text c={C.white} fw="bold" size={11}>Add</Text></Pressable>
            </View>
            {wide && <View style={{ position: 'absolute', right: -1, top: 16, gap: 7 }}>
              <IconButton icon="chevronUp" variant="filled" color="#0008" iconColor={C.white} accessibilityLabel="Previous product"
                onPress={() => setIndex((old) => (old - 1 + PRODUCTS.length) % PRODUCTS.length)} />
              <IconButton icon="chevronDown" variant="filled" color="#0008" iconColor={C.white} accessibilityLabel="Next product"
                onPress={() => setIndex((old) => (old + 1) % PRODUCTS.length)} />
            </View>}
            {!wide && <Pressable onPress={() => setIndex((old) => (old + 1) % PRODUCTS.length)}
              style={{ position: 'absolute', top: 16, right: 15, backgroundColor: '#0007', borderRadius: 20, padding: 8 }}>
              <Text c={C.white} fw="bold" size={11}>Next ↓</Text></Pressable>}
          </View>
        </View>}
        {tab === 'shop' && <ScrollView contentContainerStyle={{ maxWidth: 960, alignSelf: 'center', width: '100%', padding: 20, paddingBottom: 40 }}>
          <Text c={C.white} fw="bold" size={28}>Shop finds</Text><Text c={C.muted} size={13} style={{ marginTop: 5 }}>Everything you saw in the feed, all in one place.</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search products" placeholderTextColor="#888"
            style={{ backgroundColor: C.panel, color: C.white, borderRadius: 10, padding: 13, marginTop: 22 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 18 }}>
            {['All', 'Home', 'Tech', 'Style'].map((item) => <Pressable key={item} onPress={() => setCategory(item)}
              style={{ paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: category === item ? C.white : C.panel }}>
              <Text c={category === item ? C.black : C.muted} fw="bold" size={12}>{item}</Text></Pressable>)}
          </ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {PRODUCTS.filter((item) => (category === 'All' || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase()))
              .map((item) => <Pressable key={item.id} onPress={() => setDetail(item.id)} style={{ width: wide ? '31%' : '48%', backgroundColor: C.panel, borderRadius: 14, overflow: 'hidden' }}>
                <View style={{ width: '100%', aspectRatio: 1 }}><ProductArt product={item} compact /></View>
                <View style={{ padding: 12, gap: 4 }}><Text c={C.white} fw="bold" size={13} numberOfLines={1}>{item.name}</Text>
                  <Text c={C.muted} size={11}>★ {item.rating} · {item.sold} sold</Text>
                  <Text c={C.pink} fw="bold" size={15}>{money(item.price)}</Text></View>
              </Pressable>)}
          </View>
        </ScrollView>}
        {tab === 'cart' && <ScrollView contentContainerStyle={{ maxWidth: 700, alignSelf: 'center', width: '100%', padding: 20, gap: 14 }}>
          <Text c={C.white} fw="bold" size={28}>Your cart</Text>
          {cartCount === 0 && <View style={{ alignItems: 'center', gap: 12, padding: 50 }}>
            <Text size={70}>🛒</Text><Text c={C.white} fw="bold" size={20}>Your cart is empty</Text>
            <Button title="Explore the shop" color={C.pink} onPress={() => setTab('shop')} /></View>}
          {PRODUCTS.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => <View key={item.id}
            style={{ backgroundColor: C.panel, padding: 12, borderRadius: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 76, height: 76 }}><ProductArt product={item} compact /></View>
            <View style={{ flex: 1, gap: 5 }}><Text c={C.white} fw="bold" size={14}>{item.name}</Text><Text c={C.pink} fw="bold">{money(item.price)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                <Pressable onPress={() => setCart((old) => ({ ...old, [item.id]: Math.max(0, (old[item.id] ?? 0) - 1) }))} accessibilityLabel={`Remove one ${item.name}`}>
                  <Icon name="minus" color={C.white} size={18} /></Pressable>
                <Text c={C.white}>{cart[item.id]}</Text>
                <Pressable onPress={() => addToCart(item.id)} accessibilityLabel={`Add one ${item.name}`}><Icon name="plus" color={C.white} size={18} /></Pressable>
              </View>
            </View>
          </View>)}
          {cartCount > 0 && <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text c={C.white} fw="bold">Subtotal</Text><Text c={C.white} fw="bold">{money(cartTotal)}</Text></View>
            <Button title="Demo checkout" color={C.pink} onPress={() => setToast('This example does not process payments.')} />
            <Text c={C.muted} size={11}>Demo cart only. No payment or order is placed.</Text>
          </View>}
        </ScrollView>}
        {!wide && <View style={{ backgroundColor: C.black, borderTopWidth: 1, borderTopColor: C.line }}>{nav}</View>}
      </View>
    </View>
    {!!toast && <Pressable onPress={() => setToast('')} style={{ position: 'absolute', top: 70, alignSelf: 'center', backgroundColor: C.white,
      borderRadius: 20, paddingHorizontal: 17, paddingVertical: 10 }}><Text c={C.black} fw="semibold" size={12}>{toast} · Dismiss</Text></Pressable>}
    {(detailProduct || commentProduct) && <View style={{ position: 'absolute', inset: 0, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#000B', padding: 12 }}>
      <View style={{ width: '100%', maxWidth: 550, maxHeight: '86%', backgroundColor: C.panel, borderRadius: 18, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
          <Text c={C.white} fw="bold" size={17}>{commentProduct ? 'Comments' : 'Product details'}</Text>
          <IconButton icon="x" variant="ghost" iconColor={C.white} accessibilityLabel="Close" onPress={() => { setDetail(null); setCommentFor(null); }} />
        </View>
        {detailProduct && <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 11 }}>
          <View style={{ height: 210 }}><ProductArt product={detailProduct} compact /></View>
          <Text c={C.white} fw="bold" size={22}>{detailProduct.name}</Text>
          <Text c={C.muted} size={13}>★ {detailProduct.rating} · {detailProduct.sold} sold · {detailProduct.category}</Text>
          <Text c={C.pink} fw="bold" size={24}>{money(detailProduct.price)}  <Text c={C.muted} size={13} style={{ textDecorationLine: 'line-through' }}>{money(detailProduct.old)}</Text></Text>
          <Text c={C.white} size={14}>{detailProduct.caption}</Text>
          <Button title="Add to cart" color={C.pink} onPress={() => { addToCart(detailProduct.id); setDetail(null); }} />
        </ScrollView>}
        {commentProduct && <>
          <ScrollView style={{ minHeight: 130, maxHeight: 290 }} contentContainerStyle={{ padding: 17, gap: 12 }}>
            <Text c={C.muted} size={13}>What do you think of {commentProduct.name}?</Text>
            {(comments[commentProduct.id] ?? []).map((item, i) => <Text key={i} c={C.white} size={13}><Text c={C.teal} fw="bold">you  </Text>{item}</Text>)}
          </ScrollView>
          <View style={{ padding: 13, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.line }}>
            <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={postComment} placeholder="Add a comment" placeholderTextColor="#888"
              style={{ flex: 1, color: C.white, backgroundColor: '#292929', borderRadius: 18, paddingHorizontal: 13 }} />
            <Pressable onPress={postComment} style={{ justifyContent: 'center' }}><Text c={C.pink} fw="bold">Post</Text></Pressable>
          </View>
        </>}
      </View>
    </View>}
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><PlocksProvider theme={{ colorScheme: 'dark' }}><LoopshopScreen /></PlocksProvider></SafeAreaProvider>;
}
