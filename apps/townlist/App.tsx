import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Badge, Block, DEFAULT_THEME, Icon, PlocksProvider, SafeArea, Text } from '@plocks/ui';
import { C } from './theme';
import { SECTIONS } from './data';
import { StoreProvider, useStore, type Route, type Tab } from './store';
import { useWide } from './components';
import { Home } from './screens/Home';
import { Categories } from './screens/Categories';
import { Cities } from './screens/Cities';
import { Results } from './screens/Results';
import { ListingView } from './screens/ListingView';
import { Messages } from './screens/Messages';
import { Saved } from './screens/Saved';
import { Post } from './screens/Post';

/** Purple primary ramp so built-in controls (FileInput, focus rings, Select) match the brand. */
const THEME = {
  colorScheme: 'light' as const,
  primaryColor: C.purple,
  colors: {
    ...DEFAULT_THEME.colors,
    primary: ['#F6F1FB', '#EEE8F5', '#DCCDEB', '#C2A8DC', '#8E68B6', C.purple, '#4F2479', '#43206A', '#381A59', '#2C1446'],
  },
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'browse', label: 'browse', icon: 'search' },
  { key: 'saved', label: 'saved', icon: 'star' },
  { key: 'post', label: 'post', icon: 'plus' },
  { key: 'messages', label: 'messages', icon: 'message' },
];

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'categories':
      return <Categories section={route.section} />;
    case 'cities':
      return <Cities />;
    case 'results':
      return <Results initial={route.filter} />;
    case 'listing':
      return <ListingView id={route.id} />;
    case 'threads':
      return <Messages />;
    case 'thread':
      return <Messages openId={route.id} />;
    case 'saved':
      return <Saved />;
    case 'post':
      return <Post />;
  }
}

function routeKey(route: Route) {
  switch (route.name) {
    case 'listing':
    case 'thread':
      return `${route.name}:${route.id}`;
    case 'categories':
      return `categories:${route.section ?? ''}`;
    case 'results':
      return `results:${JSON.stringify(route.filter)}`;
    default:
      return route.name;
  }
}

function TabButton({ item, vertical }: { item: (typeof TABS)[number]; vertical?: boolean }) {
  const store = useStore();
  const active = store.tab === item.key;
  const count = item.key === 'messages' ? store.unread : 0;
  return (
    <Block
      onPress={() => store.goTab(item.key)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={count ? `${item.label}, ${count} unread` : item.label}
      flex={vertical ? undefined : 1}
      direction={vertical ? 'row' : 'column'}
      align="center"
      gap={vertical ? 10 : 2}
      py={vertical ? 9 : 7}
      px={vertical ? 12 : 0}
      radius={vertical ? 6 : 0}
      bg={vertical && active ? C.tint : undefined}
      pressedStyle={{ opacity: 0.6 }}
    >
      <Block gap={0} position="relative">
        <Icon name={item.icon} variant={active ? 'filled' : 'outlined'} color={active ? C.purple : C.muted} size={vertical ? 19 : 22} />
        {count > 0 && !vertical && (
          <Block gap={0} position="absolute" top={-5} right={-10}>
            <Badge size="xs" variant="filled" color={C.red}>
              {count}
            </Badge>
          </Block>
        )}
      </Block>
      <Text c={active ? C.purple : C.muted} fw={active ? 'bold' : 'semibold'} size={vertical ? 14 : 11} flex={vertical ? 1 : undefined}>
        {item.label}
      </Text>
      {count > 0 && vertical && (
        <Badge size="xs" variant="filled" color={C.red}>
          {count}
        </Badge>
      )}
    </Block>
  );
}

function Sidebar() {
  const store = useStore();
  return (
    <Block w={220} gap={4} p={16} borderRightWidth={1} borderRightColor={C.line} bg={C.paler}>
      <Text c={C.purple} fw="bold" size={26} lts={-0.6} mb={2} onPress={() => store.goTab('browse', true)}>
        townlist
      </Text>
      <Text c={C.link} size={12} mb={14} onPress={() => store.openIn('browse', { name: 'cities' })}>
        {store.city.name}
        {store.radius ? ` +${store.radius}mi` : ''} · change
      </Text>
      {TABS.map((item) => (
        <TabButton key={item.key} item={item} vertical />
      ))}
      <Block gap={0} h={1} bg={C.line} my={14} />
      <Text c={C.muted} fw="bold" size={11} lts={0.8} mb={4}>
        CATEGORIES
      </Text>
      {SECTIONS.map((section) => (
        <Text
          key={section.id}
          c={C.link}
          size={14}
          lh={24}
          onPress={() => store.openIn('browse', { name: 'categories', section: section.id })}
        >
          {section.label}
        </Text>
      ))}
      <Block gap={0} flex={1} />
      <Text c={C.faint} size={11} lh={16}>
        a fictional classifieds demo built with plocks. nothing leaves this device.
      </Text>
    </Block>
  );
}

function Shell() {
  const store = useStore();
  const wide = useWide();
  return (
    <SafeArea gap={0} flex={1} bg={wide ? C.pale : C.white}>
      <StatusBar barStyle="dark-content" />
      <Block gap={0} flex={1} direction={wide ? 'row' : 'column'} w="100%" maw={1320} alignSelf="center" bg={C.white}>
        {wide && <Sidebar />}
        <Block gap={0} flex={1} miw={0}>
          <RouteView key={`${store.tab}:${routeKey(store.route)}`} route={store.route} />
        </Block>
        {!wide && (
          <Block gap={0} direction="row" borderTopWidth={1} borderTopColor={C.line} bg={C.white} accessibilityRole="tablist">
            {TABS.map((item) => (
              <TabButton key={item.key} item={item} />
            ))}
          </Block>
        )}
      </Block>
    </SafeArea>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={THEME}>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
