import { Block, Button, Icon, IconButton, Menu, MenuDivider, MenuDropdown, MenuItem, Progress, ScrollArea, Text } from '@plocks/ui';

import { NOTIFICATIONS, PROFILES, TITLES, byId, trailersFor } from '../data';
import { useNightfall } from '../store';
import { C, Poster, ProfileTile, Shelf, Still, useScreen } from '../ui';

/** "My Nightfall": profile, notifications, downloads and personal shelves. */
export function MyScreen() {
  const app = useNightfall();
  const { wide, gutter, poster } = useScreen();
  const profile = app.profile ?? PROFILES[0];
  const liked = TITLES.filter((item) => app.ratings[item.id] === 'up' || app.ratings[item.id] === 'love');
  const list = TITLES.filter((item) => app.myList.includes(item.id));
  const downloads = Object.keys(app.downloads);

  return (
    <ScrollArea flex={1} contentProps={{ pb: 40 }}>
      <Block gap={0} w="100%" maw={1100} alignSelf="center">
        <Block align="center" gap={10} pt={20}>
          <ProfileTile color={profile.color} size={wide ? 96 : 72} />
          <Menu position="bottom">
            <Block direction="row" align="center" gap={4} accessibilityRole="button" accessibilityLabel="Switch profile">
              <Text c={C.white} fw="bold" size={22}>
                {profile.name}
              </Text>
              <Icon name="chevron-down" size={18} color={C.white} />
            </Block>
            <MenuDropdown>
              {PROFILES.filter((item) => item.id !== profile.id).map((item) => (
                <MenuItem key={item.id} startSection={<ProfileTile color={item.color} size={22} />} onPress={() => app.selectProfile(item.id)}>
                  {item.name}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem startSection={<Icon name="edit" size={16} color={C.soft} />} onPress={() => app.selectProfile(null)}>
                Manage Profiles
              </MenuItem>
            </MenuDropdown>
          </Menu>
        </Block>

        <Block px={gutter} mt={20} gap={4}>
          <MenuRow
            icon={
              <Block bg={C.red} w={36} h={36} radius="full" align="center" justify="center" gap={0}>
                <Icon name="bell" size={20} color={C.white} />
              </Block>
            }
            label="Notifications"
            detail={`${NOTIFICATIONS.length} new`}
            onPress={() => app.push({ name: 'notifications' })}
          />
          <MenuRow
            icon={
              <Block bg="#0071EB" w={36} h={36} radius="full" align="center" justify="center" gap={0}>
                <Icon name="download" size={20} color={C.white} />
              </Block>
            }
            label="Downloads"
            detail={downloads.length ? `${downloads.length} title${downloads.length === 1 ? '' : 's'}` : 'None yet'}
            onPress={() => app.push({ name: 'downloads' })}
          />
        </Block>

        {liked.length > 0 && (
          <Shelf heading="TV Shows & Movies You Liked">
            {liked.map((item) => (
              <Poster key={item.id} title={item} w={poster} onPress={() => app.openTitle(item.id)} />
            ))}
          </Shelf>
        )}
        <Shelf heading="My List">
          {list.length ? (
            list.map((item) => <Poster key={item.id} title={item} w={poster} onPress={() => app.openTitle(item.id)} />)
          ) : (
            <Text c={C.muted}>Add shows and movies to keep track of what you want to watch.</Text>
          )}
        </Shelf>
        {app.trailers.length > 0 && (
          <Shelf heading="Trailers You've Watched">
            {app.trailers.map(byId).map((item) => (
              <Block
                key={item.id}
                w={wide ? 300 : 220}
                gap={6}
                onPress={() => app.playTrailer(item.id, trailersFor(item)[0].id)}
                accessibilityRole="button"
                accessibilityLabel={`Play ${item.title} trailer`}
              >
                <Still title={item} w="100%" play />
                <Text c={C.soft} size={12} numberOfLines={1}>
                  {trailersFor(item)[0].label}: {item.title}
                </Text>
              </Block>
            ))}
          </Shelf>
        )}
      </Block>
    </ScrollArea>
  );
}

function MenuRow({ icon, label, detail, onPress }: { icon: React.ReactNode; label: string; detail: string; onPress: () => void }) {
  return (
    <Block direction="row" align="center" gap={14} py={10} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <Block flex={1} gap={0}>
        <Text c={C.white} fw="bold" size={16}>
          {label}
        </Text>
        <Text c={C.muted} size={12}>
          {detail}
        </Text>
      </Block>
      <Icon name="chevron-right" size={20} color={C.muted} />
    </Block>
  );
}

function PageHeader({ heading }: { heading: string }) {
  const app = useNightfall();
  const { gutter } = useScreen();
  return (
    <Block direction="row" align="center" gap={8} px={gutter} py={10}>
      <IconButton icon="arrowLeft" variant="ghost" iconColor={C.white} accessibilityLabel="Back" onPress={app.back} />
      <Text c={C.white} fw="bold" size={20}>
        {heading}
      </Text>
    </Block>
  );
}

export function DownloadsScreen() {
  const app = useNightfall();
  const { gutter, wide } = useScreen();
  const ids = Object.keys(app.downloads);
  return (
    <Block flex={1} gap={0}>
      <PageHeader heading="Downloads" />
      <ScrollArea flex={1} contentProps={{ px: gutter, pb: 40, gap: 16 }}>
        <Block gap={0} w="100%" maw={900} alignSelf="center">
          <Block direction="row" align="center" gap={8} mb={16}>
            <Icon name="circle-check" variant="filled" size={16} color="#0071EB" />
            <Text c={C.soft} size={13}>
              Smart Downloads · <Text c="#0071EB" size={13} fw="bold">ON</Text>
            </Text>
          </Block>
          {ids.length === 0 ? (
            <Block align="center" gap={14} py={40}>
              <Block w={120} h={120} radius="full" bg={C.raised} align="center" justify="center" gap={0}>
                <Icon name="download" size={56} color={C.muted} />
              </Block>
              <Text c={C.white} fw="bold" size={18} ta="center">
                Movies and TV shows that you download appear here.
              </Text>
              <Button title="Find Something to Download" color={C.white} textColor={C.black} onPress={() => app.setTab('home')} />
            </Block>
          ) : (
            ids.map((id) => {
              const title = byId(id);
              const value = app.downloads[id];
              return (
                <Block key={id} direction="row" align="center" gap={12} mb={16}>
                  <Block gap={0} w={wide ? 180 : 130} onPress={() => app.play(id)} accessibilityRole="button" accessibilityLabel={`Play ${title.title}`}>
                    <Still title={title} w="100%" play={value === 1} />
                  </Block>
                  <Block flex={1} gap={4}>
                    <Text c={C.white} fw="bold" size={15} numberOfLines={1}>
                      {title.title}
                    </Text>
                    {value < 1 ? (
                      <>
                        <Text c={C.muted} size={12}>
                          Downloading… {Math.round(value * 100)}%
                        </Text>
                        <Progress value={value * 100} size={3} color="#0071EB" trackColor="#444" />
                      </>
                    ) : (
                      <Text c={C.muted} size={12}>
                        {title.kind === 'series' ? '1 Episode' : title.length} | {title.kind === 'series' ? '312' : '1.1'} {title.kind === 'series' ? 'MB' : 'GB'}
                      </Text>
                    )}
                  </Block>
                  <IconButton
                    icon="trash"
                    variant="ghost"
                    iconColor={C.muted}
                    accessibilityLabel={`Delete ${title.title} download`}
                    onPress={() => app.removeDownload(id)}
                  />
                </Block>
              );
            })
          )}
        </Block>
      </ScrollArea>
    </Block>
  );
}

export function NotificationsScreen() {
  const app = useNightfall();
  const { gutter, wide } = useScreen();
  return (
    <Block flex={1} gap={0}>
      <PageHeader heading="Notifications" />
      <ScrollArea flex={1} contentProps={{ px: gutter, pb: 40 }}>
        <Block gap={18} w="100%" maw={900} alignSelf="center">
          {NOTIFICATIONS.map((item) => {
            const title = byId(item.titleId);
            return (
              <Block key={item.id} direction="row" align="center" gap={12} onPress={() => app.openTitle(title.id)} accessibilityRole="button" accessibilityLabel={item.text}>
                <Block gap={0} w={wide ? 160 : 120}>
                  <Still title={title} w="100%" />
                </Block>
                <Block flex={1} gap={2}>
                  <Text c={C.white} fw="bold" size={14}>
                    {item.kicker}
                  </Text>
                  <Text c={C.soft} size={13}>
                    {item.text}
                  </Text>
                  <Text c={C.muted} size={11}>
                    {item.date}
                  </Text>
                </Block>
              </Block>
            );
          })}
        </Block>
      </ScrollArea>
    </Block>
  );
}
