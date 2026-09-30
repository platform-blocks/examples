import { useEffect, useState } from 'react';
import { Platform, Share, StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Carousel } from '@plocks/carousel';
import {
  Badge,
  Dialog,
  Gradient,
  Input,
  ScrollArea,
  SafeArea,
  Block,
  Button,
  Icon,
  IconButton,
  PlocksProvider,
  Tabs,
  Text,
  ToastProvider,
  useToast,
} from '@plocks/ui-snack';

const C = {
  black: '#090909',
  panel: '#181818',
  white: '#FFF',
  muted: '#B6B6B6',
  line: '#303030',
  pink: '#FF3B77',
  teal: '#20D3C5',
};
const PRODUCTS = [
  {
    id: 'lamp',
    name: 'Sunset Glow Lamp',
    creator: '@roomforjoy',
    price: 29.99,
    old: 42,
    emoji: '💡',
    category: 'Home',
    colors: ['#E84986', '#8F3B97'] as const,
    caption: 'The little light that changed my whole room ✨',
    likes: 12400,
    rating: '4.9',
    sold: '2.4k',
  },
  {
    id: 'headphones',
    name: 'Cloud Wireless Headphones',
    creator: '@listenwithlea',
    price: 48,
    old: 65,
    emoji: '🎧',
    category: 'Tech',
    colors: ['#3657B9', '#151B4B'] as const,
    caption: 'A whole new soundtrack for your commute 🎶',
    likes: 8700,
    rating: '4.8',
    sold: '1.8k',
  },
  {
    id: 'mug',
    name: 'Everyday Ceramic Mug',
    creator: '@slowmornings',
    price: 18.5,
    old: 25,
    emoji: '☕',
    category: 'Home',
    colors: ['#B88662', '#523B37'] as const,
    caption: 'A five minute coffee break that feels like a vacation.',
    likes: 4200,
    rating: '4.9',
    sold: '980',
  },
  {
    id: 'bag',
    name: 'Mini Weekend Tote',
    creator: '@stylewithsam',
    price: 34.95,
    old: 49,
    emoji: '👜',
    category: 'Style',
    colors: ['#D76B80', '#743750'] as const,
    caption: 'The bag that somehow fits everything I need 👜',
    likes: 19100,
    rating: '4.7',
    sold: '3.1k',
  },
  {
    id: 'plant',
    name: 'Desktop Plant Kit',
    creator: '@greenlittlethings',
    price: 22,
    old: 30,
    emoji: '🪴',
    category: 'Home',
    colors: ['#3A9B7A', '#164B43'] as const,
    caption: 'Your desk deserves a tiny garden 🌿',
    likes: 6300,
    rating: '4.8',
    sold: '1.2k',
  },
];
type Product = (typeof PRODUCTS)[number];
type Tab = 'feed' | 'shop' | 'cart';
type Cart = Record<string, number>;
const STORAGE = 'plocks-loopshop-example:v1';
const money = (value: number) => '$' + value.toFixed(2);

function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <Gradient
      colors={[product.colors[0], product.colors[1]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      flex={1}
      w="full"
      radius={compact ? 14 : 0}
      align="center"
      justify="center"
      overflow="hidden"
    >
      {!compact && (
        <Block
          gap={0}
          position="absolute"
          top="9%"
          left="9%"
          w={115}
          h={115}
          radius={58}
          borderWidth={1}
          borderColor="#FFFFFF40"
        />
      )}
      {!compact && (
        <Block gap={0} position="absolute" bottom="17%" right="-10%" w={220} h={220} radius={110} bg="#FFFFFF13" />
      )}
      <Text size={compact ? 67 : 150} lh={compact ? 90 : 195}>
        {product.emoji}
      </Text>
      {!compact && (
        <Block gap={0} position="absolute" top={22} left={20} radius={5} bg="#0008" px={9} py={6}>
          <Text c={C.white} fw="bold" size={11}>
            SHOP THE VIDEO
          </Text>
        </Block>
      )}
    </Gradient>
  );
}

function FeedSlide({
  product,
  liked,
  commentCount,
  onLike,
  onComment,
  onShare,
  onCart,
  onDetail,
}: {
  product: Product;
  liked: boolean;
  commentCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onCart: () => void;
  onDetail: () => void;
}) {
  return (
    <Block gap={0} w="100%" h="100%" position="relative" overflow="hidden">
      <ProductArt product={product} />
      <Block gap={0} pointerEvents="none" position="absolute" left={0} right={0} bottom={0} h={230} bg="#0006" />
      <Block position="absolute" left={17} bottom={22} right={75} gap={8}>
        <Text c={C.white} fw="bold" size={16}>{product.creator}</Text>
        <Text c={C.white} size={14} lh={20}>{product.caption}</Text>
        <Block
          onPress={onDetail}
          accessibilityRole="button"
          accessibilityLabel={`View ${product.name}`}
          alignSelf="flex-start"
          direction="row"
          align="center"
          gap={9}
          p={9}
          bg={C.white}
          radius={9}
          maw="100%"
        >
          <Text size={25}>{product.emoji}</Text>
          <Block gap={0} flex={1}>
            <Text c={C.black} fw="bold" size={12} numberOfLines={1}>{product.name}</Text>
            <Text c={C.pink} fw="bold" size={12}>
              {money(product.price)}{' '}
              <Text c="#888" size={11} td="line-through">{money(product.old)}</Text>
            </Text>
          </Block>
          <Icon name="chevronRight" size={16} color={C.black} />
        </Block>
      </Block>
      <Block position="absolute" right={11} bottom={96} align="center" gap={18}>
        <Block onPress={onLike} accessibilityRole="button" accessibilityLabel={liked ? 'Unlike product' : 'Like product'} align="center" gap={2}>
          <Icon name="heart" variant="filled" color={liked ? C.pink : C.white} size={31} />
          <Text c={C.white} fw="bold" size={11}>{((product.likes + Number(liked)) / 1000).toFixed(1)}k</Text>
        </Block>
        <Block onPress={onComment} accessibilityRole="button" accessibilityLabel="Comments" align="center" gap={2}>
          <Icon name="message" variant="filled" color={C.white} size={30} />
          <Text c={C.white} fw="bold" size={11}>{commentCount}</Text>
        </Block>
        <Block gap={0} onPress={onShare} accessibilityRole="button" accessibilityLabel="Share product" align="center">
          <Icon name="arrowRight" color={C.white} size={30} />
          <Text c={C.white} fw="bold" size={11}>Share</Text>
        </Block>
        <Block gap={0} onPress={onCart} accessibilityRole="button" accessibilityLabel="Add to cart" align="center">
          <Icon name="cart" color={C.white} size={30} />
          <Text c={C.white} fw="bold" size={11}>Add</Text>
        </Block>
      </Block>
    </Block>
  );
}

function LoopshopScreen() {
  const toast = useToast();
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const [tab, setTab] = useState<Tab>('feed');
  const [feedHeight, setFeedHeight] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [detail, setDetail] = useState<string | null>(null);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [ready, setReady] = useState(false);
  const detailProduct = PRODUCTS.find((item) => item.id === detail);
  const commentProduct = PRODUCTS.find((item) => item.id === commentFor);
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = PRODUCTS.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.price, 0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as { liked?: string[]; cart?: Cart; comments?: Record<string, string[]> };
        if (Array.isArray(data.liked)) setLiked(data.liked);
        if (data.cart && typeof data.cart === 'object') setCart(data.cart);
        if (data.comments && typeof data.comments === 'object') setComments(data.comments);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify({ liked, cart, comments })).catch(() => {});
  }, [liked, cart, comments, ready]);
  function addToCart(id: string) {
    setCart((old) => ({ ...old, [id]: (old[id] ?? 0) + 1 }));
    toast.success({ title: 'Added to cart', message: PRODUCTS.find((item) => item.id === id)?.name });
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
        toast.success('Product details copied');
      } else {
        await Share.share({ message: details });
      }
    } catch {
      toast.error('Unable to share product');
    }
  }
  const nav = (
    <Tabs
      navigationOnly
      orientation={wide ? 'vertical' : 'horizontal'}
      variant="chip"
      color={C.pink}
      value={tab}
      onChange={(item) => setTab(item as Tab)}
      textStyle={{ color: C.muted }}
      activeTabTextColor={C.white}
      items={(['feed', 'shop', 'cart'] as const).map((item) => ({
        key: item,
        label: item[0].toUpperCase() + item.slice(1),
        accessibilityLabel: item === 'cart' && cartCount ? `Cart, ${cartCount} items` : undefined,
        subLabel: item === 'cart' && cartCount > 0 ? <Badge size="sm" color={C.pink}>{cartCount}</Badge> : undefined,
        icon: (
          <Icon
            name={item === 'feed' ? 'home' : item === 'shop' ? 'grid' : 'cart'}
            color={tab === item ? C.white : C.muted}
            size={wide ? 21 : 20}
          />
        ),
        content: null,
      }))}
    />
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.black}>
      <StatusBar barStyle="light-content" />
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} maw={1250} w="100%" alignSelf="center">
        {wide && (
          <Block w={225} borderRightWidth={1} borderRightColor={C.line} p={18} gap={30}>
            <Text c={C.white} fw="bold" size={27}>
              loop
              <Text c={C.pink} fw="bold">
                shop
              </Text>
            </Text>
            {nav}
            <Block gap={0} flex={1} />
            <Text c={C.muted} size={11}>
              Demo storefront · no purchases
            </Text>
          </Block>
        )}
        <Block gap={0} flex={1}>
          {!wide && (
            <Block gap={0} h={54} justify="center" align="center" borderBottomWidth={1} borderBottomColor={C.line}>
              <Text c={C.white} fw="bold" size={20}>
                loop
                <Text c={C.pink} fw="bold">
                  shop
                </Text>
              </Text>
            </Block>
          )}
          {tab === 'feed' && (
            <Block gap={0} flex={1} align="center" justify="center" bg={C.black}>
              <Block
                gap={0}
                flex={1}
                w="100%"
                maw={wide ? 460 : 560}
                overflow="hidden"
                onLayout={({ nativeEvent: { layout } }) => setFeedHeight(layout.height)}
              >
                {feedHeight > 0 && (
                  <Carousel
                    orientation="vertical"
                    h={feedHeight}
                    w="100%"
                    itemGap={0}
                    loop
                    showArrows={wide}
                    showDots={false}
                    skipSnaps={false}
                    transitionDuration={350}
                    accessibilityLabel="Shop video feed"
                  >
                    {PRODUCTS.map((item) => (
                      <FeedSlide
                        key={item.id}
                        product={item}
                        liked={liked.includes(item.id)}
                        commentCount={comments[item.id]?.length ?? 0}
                        onLike={() => setLiked((old) =>
                          old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id],
                        )}
                        onComment={() => setCommentFor(item.id)}
                        onShare={() => shareProduct(item)}
                        onCart={() => addToCart(item.id)}
                        onDetail={() => setDetail(item.id)}
                      />
                    ))}
                  </Carousel>
                )}
              </Block>
            </Block>
          )}
          {tab === 'shop' && (
            <ScrollArea contentProps={{ maw: 960, alignSelf: 'center', w: '100%', p: 20, pb: 40 }}>
              <Text c={C.white} fw="bold" size={28}>
                Shop finds
              </Text>
              <Text c={C.muted} size={13} mt={5}>
                Everything you saw in the feed, all in one place.
              </Text>
              <Input
                variant="filled"
                value={query}
                onChangeText={setQuery}
                placeholder="Search products"
                placeholderTextColor="#888"
                mb={0}
                inputColor={C.white}
                radius={10}
                mt={22}
              />
              <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ gap: 8, my: 18 }}>
                {['All', 'Home', 'Tech', 'Style'].map((item) => (
                  <Block
                    gap={0}
                    key={item}
                    onPress={() => setCategory(item)}
                    px={15}
                    py={8}
                    radius={20}
                    bg={category === item ? C.white : C.panel}
                  >
                    <Text c={category === item ? C.black : C.muted} fw="bold" size={12}>
                      {item}
                    </Text>
                  </Block>
                ))}
              </ScrollArea>
              <Block direction="row" wrap="wrap" gap={12}>
                {PRODUCTS.filter(
                  (item) =>
                    (category === 'All' || item.category === category) &&
                    item.name.toLowerCase().includes(query.toLowerCase()),
                ).map((item) => (
                  <Block
                    gap={0}
                    key={item.id}
                    onPress={() => setDetail(item.id)}
                    w={wide ? '31%' : '48%'}
                    bg={C.panel}
                    radius={14}
                    overflow="hidden"
                  >
                    <Block gap={0} w="100%" aspectRatio={1}>
                      <ProductArt product={item} compact />
                    </Block>
                    <Block p={12} gap={4}>
                      <Text c={C.white} fw="bold" size={13} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text c={C.muted} size={11}>
                        ★ {item.rating} · {item.sold} sold
                      </Text>
                      <Text c={C.pink} fw="bold" size={15}>
                        {money(item.price)}
                      </Text>
                    </Block>
                  </Block>
                ))}
              </Block>
            </ScrollArea>
          )}
          {tab === 'cart' && (
            <ScrollArea contentProps={{ maw: 700, alignSelf: 'center', w: '100%', p: 20, gap: 14 }}>
              <Text c={C.white} fw="bold" size={28}>
                Your cart
              </Text>
              {cartCount === 0 && (
                <Block align="center" gap={12} p={50}>
                  <Text size={70}>🛒</Text>
                  <Text c={C.white} fw="bold" size={20}>
                    Your cart is empty
                  </Text>
                  <Button title="Explore the shop" color={C.pink} onPress={() => setTab('shop')} />
                </Block>
              )}
              {PRODUCTS.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => (
                <Block key={item.id} bg={C.panel} p={12} radius={14} direction="row" gap={12} align="center">
                  <Block gap={0} w={76} h={76}>
                    <ProductArt product={item} compact />
                  </Block>
                  <Block flex={1} gap={5}>
                    <Text c={C.white} fw="bold" size={14}>
                      {item.name}
                    </Text>
                    <Text c={C.pink} fw="bold">
                      {money(item.price)}
                    </Text>
                    <Block direction="row" align="center" gap={13}>
                      <Block
                        gap={0}
                        onPress={() => setCart((old) => ({ ...old, [item.id]: Math.max(0, (old[item.id] ?? 0) - 1) }))}
                        accessibilityLabel={`Remove one ${item.name}`}
                      >
                        <Icon name="minus" color={C.white} size={18} />
                      </Block>
                      <Text c={C.white}>{cart[item.id]}</Text>
                      <Block gap={0} onPress={() => addToCart(item.id)} accessibilityLabel={`Add one ${item.name}`}>
                        <Icon name="plus" color={C.white} size={18} />
                      </Block>
                    </Block>
                  </Block>
                </Block>
              ))}
              {cartCount > 0 && (
                <Block borderTopWidth={1} borderTopColor={C.line} pt={18} gap={12}>
                  <Block gap={0} direction="row" justify="space-between">
                    <Text c={C.white} fw="bold">
                      Subtotal
                    </Text>
                    <Text c={C.white} fw="bold">
                      {money(cartTotal)}
                    </Text>
                  </Block>
                  <Button
                    title="Demo checkout"
                    color={C.pink}
                    onPress={() => toast.info('This example does not process payments.')}
                  />
                  <Text c={C.muted} size={11}>
                    Demo cart only. No payment or order is placed.
                  </Text>
                </Block>
              )}
            </ScrollArea>
          )}
          {!wide && (
            <Block gap={0} bg={C.black} borderTopWidth={1} borderTopColor={C.line}>
              {nav}
            </Block>
          )}
        </Block>
      </Block>
      {(detailProduct || commentProduct) && (
        <Dialog
          opened
          variant="bottomsheet"
          accessibilityLabel={commentProduct ? 'Comments' : 'Product details'}
          onClose={() => {
            setDetail(null);
            setCommentFor(null);
          }}
          bottomSheetSwipeZone="handle"
        >
          <Block gap={0}>
            <Block gap={0} direction="row" justify="space-between" align="center" p={14}>
              <Text c={C.white} fw="bold" size={17}>
                {commentProduct ? 'Comments' : 'Product details'}
              </Text>
              <IconButton
                icon="x"
                variant="ghost"
                iconColor={C.white}
                accessibilityLabel="Close"
                onPress={() => {
                  setDetail(null);
                  setCommentFor(null);
                }}
              />
            </Block>
            {detailProduct && (
              <ScrollArea contentProps={{ px: 16, pb: 20, gap: 11 }}>
                <Block gap={0} h={210}>
                  <ProductArt product={detailProduct} compact />
                </Block>
                <Text c={C.white} fw="bold" size={22}>
                  {detailProduct.name}
                </Text>
                <Text c={C.muted} size={13}>
                  ★ {detailProduct.rating} · {detailProduct.sold} sold · {detailProduct.category}
                </Text>
                <Text c={C.pink} fw="bold" size={24}>
                  {money(detailProduct.price)}{' '}
                  <Text c={C.muted} size={13} td="line-through">
                    {money(detailProduct.old)}
                  </Text>
                </Text>
                <Text c={C.white} size={14}>
                  {detailProduct.caption}
                </Text>
                <Button
                  title="Add to cart"
                  color={C.pink}
                  onPress={() => {
                    addToCart(detailProduct.id);
                    setDetail(null);
                  }}
                />
              </ScrollArea>
            )}
            {commentProduct && (
              <>
                <ScrollArea mih={130} mah={290} contentProps={{ p: 17, gap: 12 }}>
                  <Text c={C.muted} size={13}>
                    What do you think of {commentProduct.name}?
                  </Text>
                  {(comments[commentProduct.id] ?? []).map((item, i) => (
                    <Text key={i} c={C.white} size={13}>
                      <Text c={C.teal} fw="bold">
                        you{' '}
                      </Text>
                      {item}
                    </Text>
                  ))}
                </ScrollArea>
                <Block p={13} direction="row" gap={10} borderTopWidth={1} borderTopColor={C.line}>
                  <Input
                    variant="filled"
                    value={draft}
                    onChangeText={setDraft}
                    onEnter={postComment}
                    placeholder="Add a comment"
                    placeholderTextColor="#888"
                    mb={0}
                    flex={1}
                    inputColor={C.white}
                    radius={18}
                  />
                  <Block gap={0} onPress={postComment} justify="center">
                    <Text c={C.pink} fw="bold">
                      Post
                    </Text>
                  </Block>
                </Block>
              </>
            )}
          </Block>
        </Dialog>
      )}
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
        <ToastProvider>
          <LoopshopScreen />
        </ToastProvider>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
