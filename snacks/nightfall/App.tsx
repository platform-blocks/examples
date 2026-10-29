import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Block, BottomAppBar, IconButton, PlocksProvider, SafeArea, Icon, Text } from '@plocks/ui-snack';

import { NightfallProvider, useNightfall, type Route, type Tab } from './store';
import { C, ProfileTile, useScreen } from './ui';
import { HomeScreen } from './screens/HomeScreen';
import { MyScreen, DownloadsScreen, NotificationsScreen } from './screens/MyScreen';
import { NewHotScreen } from './screens/NewHotScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { ProfilePicker } from './screens/ProfilePicker';
import { SearchScreen } from './screens/SearchScreen';
import { TitleScreen } from './screens/TitleScreen';

function Header() {
  const app = useNightfall();
  const { wide, gutter } = useScreen();
  const profileColor = app.profile?.color ?? C.red;

  if (wide) {
    const links: { label: string; active: boolean; onPress: () => void }[] = [
      { label: 'Home', active: app.tab === 'home' && app.filter === 'all', onPress: () => app.setFilter('all') },
      { label: 'TV Shows', active: app.tab === 'home' && app.filter === 'series', onPress: () => app.setFilter('series') },
      { label: 'Movies', active: app.tab === 'home' && app.filter === 'movie', onPress: () => app.setFilter('movie') },
      { label: 'New & Hot', active: app.tab === 'new', onPress: () => app.setTab('new') },
      { label: 'My Nightfall', active: app.tab === 'my', onPress: () => app.setTab('my') },
    ];
    return (
      <Block direction="row" align="center" gap={28} px={gutter} h={68} bg={C.black}>
        <Text c={C.red} fw="900" size={28} lts={1} onPress={() => app.setFilter('all')}>
          NIGHTFALL
        </Text>
        <Block direction="row" gap={22} flex={1} align="center">
          {links.map((link) => (
            <Text key={link.label} c={link.active ? C.white : C.soft} fw={link.active ? 'bold' : 'normal'} size={14} onPress={link.onPress}>
              {link.label}
            </Text>
          ))}
        </Block>
        <IconButton icon="search" variant="ghost" iconColor={C.white} accessibilityLabel="Search" onPress={() => app.push({ name: 'search' })} />
        <IconButton icon="bell" variant="ghost" iconColor={C.white} accessibilityLabel="Notifications" onPress={() => app.push({ name: 'notifications' })} />
        <Block gap={0} onPress={() => app.setTab('my')} accessibilityRole="button" accessibilityLabel="My Nightfall">
          <ProfileTile color={profileColor} size={32} />
        </Block>
      </Block>
    );
  }

  const heading = app.tab === 'home' ? `For ${app.profile?.name ?? 'You'}` : app.tab === 'new' ? 'New & Hot' : 'My Nightfall';
  return (
    <Block direction="row" align="center" gap={4} px={gutter} h={56} bg={C.black}>
      <Text c={C.white} fw="bold" size={22} flex={1} numberOfLines={1}>
        {heading}
      </Text>
      <IconButton icon="download" variant="ghost" iconColor={C.white} accessibilityLabel="Downloads" onPress={() => app.push({ name: 'downloads' })} />
      <IconButton icon="search" variant="ghost" iconColor={C.white} accessibilityLabel="Search" onPress={() => app.push({ name: 'search' })} />
    </Block>
  );
}

function RouteScreen({ route }: { route: Route }) {
  switch (route.name) {
    case 'title':
      return <TitleScreen id={route.id} />;
    case 'player':
      return <PlayerScreen route={route} />;
    case 'search':
      return <SearchScreen />;
    case 'downloads':
      return <DownloadsScreen />;
    case 'notifications':
      return <NotificationsScreen />;
  }
}

function Nightfall() {
  const app = useNightfall();
  const { wide } = useScreen();
  if (!app.profile) return <ProfilePicker />;

  return (
    <Block flex={1} gap={0} position="relative">
      {/* Tab screens stay mounted under pushed pages so Back returns to the same scroll position. */}
      <Block flex={1} gap={0}>
        <Header />
        <Block flex={1} gap={0} w="100%" maw={wide ? 1400 : undefined} alignSelf="center">
          {app.tab === 'home' && <HomeScreen />}
          {app.tab === 'new' && <NewHotScreen />}
          {app.tab === 'my' && <MyScreen />}
        </Block>
        {!wide && (
          <BottomAppBar
            accessibilityLabel="Main"
            activeKey={app.tab}
            onItemPress={(key) => app.setTab(key as Tab)}
            bg="#121212F2"
            withBorder={false}
            indicator={false}
            activeColor={C.white}
            inactiveColor={C.muted}
            items={[
              {
                key: 'home',
                label: 'Home',
                icon: ({ active, color }) => (active ? <Icon name="home" variant="filled" size={24} color={color} /> : <Icon name="home" size={24} color={color} />),
              },
              {
                key: 'new',
                label: 'New & Hot',
                icon: ({ active, color }) => <Icon name="flame" variant={active ? 'filled' : 'outlined'} size={24} color={color} />,
              },
              {
                key: 'my',
                label: 'My Nightfall',
                icon: () => <ProfileTile color={app.profile?.color ?? C.red} size={24} />,
              },
            ]}
          />
        )}
      </Block>
      {app.stack.map((route, index) => (
        <Block key={`${index}:${JSON.stringify(route)}`} position="absolute" inset={0} zIndex={10 + index} bg={C.black} gap={0}>
          <RouteScreen route={route} />
        </Block>
      ))}
    </Block>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
          <NightfallProvider>
            <SafeArea gap={0} flex={1} bg={C.black}>
              <StatusBar barStyle="light-content" />
              <Nightfall />
            </SafeArea>
          </NightfallProvider>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
