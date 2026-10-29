import { BackgroundImage, Block, Button, Chip, Gradient, Icon, Menu, MenuDropdown, MenuItem, Progress, ScrollArea, Text } from '@plocks/ui';

import { ART, GENRES, TOP_MOVIES, TOP_SHOWS, byId, released, type Title } from '../data';
import { useNightfall, type Filter } from '../store';
import { C, Dots, Mark, Poster, PosterGrid, Shelf, useScreen } from '../ui';

const FEATURED: Record<Filter, string> = { all: 'dust', series: 'tidekeepers', movie: 'evergreen' };

export function HomeScreen() {
  const app = useNightfall();
  const { wide, gutter, poster } = useScreen();
  const pool = released.filter((item) => app.filter === 'all' || item.kind === app.filter);
  const hero = byId(FEATURED[app.filter]);
  const inList = app.myList.includes(hero.id);
  const continuing = pool.filter((item) => {
    const value = app.resume(item).value;
    return value > 0 && value < 1;
  });
  const showTopMovies = app.filter === 'movie';
  const top = (showTopMovies ? TOP_MOVIES : TOP_SHOWS).map(byId);
  const kindLabel = app.filter === 'series' ? 'TV Shows' : app.filter === 'movie' ? 'Movies' : '';
  const genreTitles = app.genre ? pool.filter((item) => item.genres.includes(app.genre!)) : [];
  const shelf = (heading: string, titles: Title[]) =>
    titles.length > 0 && (
      <Shelf heading={heading}>
        {titles.map((item) => (
          <Poster key={item.id} title={item} w={poster} onPress={() => app.openTitle(item.id)} />
        ))}
      </Shelf>
    );

  return (
    <ScrollArea flex={1} contentProps={{ pb: 40 }}>
      <Block direction="row" gap={8} px={gutter} py={10} align="center" wrap="wrap">
        {app.filter !== 'all' && (
          <Chip
            variant="outline"
            color={C.soft}
            onPress={() => app.setFilter('all')}
            accessibilityLabel="Clear filters"
            labelProps={{ c: C.white }}
          >
            <Icon name="x" size={14} color={C.white} />
          </Chip>
        )}
        {(app.filter === 'all' || app.filter === 'series') && (
          <Chip
            variant={app.filter === 'series' ? 'filled' : 'outline'}
            color={app.filter === 'series' ? C.raised : C.soft}
            labelProps={{ c: C.white, fw: '600' }}
            onPress={() => app.setFilter('series')}
          >
            TV Shows
          </Chip>
        )}
        {(app.filter === 'all' || app.filter === 'movie') && (
          <Chip
            variant={app.filter === 'movie' ? 'filled' : 'outline'}
            color={app.filter === 'movie' ? C.raised : C.soft}
            labelProps={{ c: C.white, fw: '600' }}
            onPress={() => app.setFilter('movie')}
          >
            Movies
          </Chip>
        )}
        <Menu position="bottom-start" mah={360}>
          <Chip
            variant={app.genre ? 'filled' : 'outline'}
            color={app.genre ? C.raised : C.soft}
            labelProps={{ c: C.white, fw: '600' }}
            endSection={<Icon name="chevron-down" size={14} color={C.white} />}
          >
            {app.genre ?? (kindLabel ? 'All Categories' : 'Categories')}
          </Chip>
          <MenuDropdown>
            <MenuItem onPress={() => app.setFilter(app.filter, null)}>{`All ${kindLabel || 'Categories'}`}</MenuItem>
            {GENRES.map((item) => (
              <MenuItem key={item} onPress={() => app.setFilter(app.filter, item)}>
                {item}
              </MenuItem>
            ))}
          </MenuDropdown>
        </Menu>
      </Block>

      {app.genre ? (
        <Block px={gutter} gap={14} mt={10}>
          <Text c={C.white} fw="bold" size={wide ? 28 : 22}>
            {app.genre} {kindLabel}
          </Text>
          {genreTitles.length ? (
            <PosterGrid titles={genreTitles} onPress={app.openTitle} />
          ) : (
            <Text c={C.muted}>Nothing in {app.genre} yet. Try another category.</Text>
          )}
        </Block>
      ) : (
        <>
          <Block px={wide ? 0 : gutter} gap={0}>
            <BackgroundImage source={ART[hero.art]} w="100%" h={wide ? 520 : 470} radius={wide ? 0 : 10} justify="flex-end">
              <Gradient colors={[hero.tint, '#0000', '#000C', wide ? C.black : '#000E']} flex={1} justify="flex-end" align={wide ? 'flex-start' : 'center'} px={wide ? 48 : 18} pb={wide ? 60 : 18} gap={12}>
                <Block direction="row" align="center" gap={6}>
                  <Mark size={18} />
                  <Text c={C.soft} fw="bold" size={11} lts={3}>
                    {hero.kind === 'series' ? 'SERIES' : 'FILM'}
                  </Text>
                </Block>
                <Text c={C.white} fw="900" size={wide ? 60 : 40} lh={wide ? 62 : 42} tt="uppercase" ta={wide ? 'left' : 'center'}>
                  {hero.title}
                </Text>
                {wide ? (
                  <Text c={C.white} size={17} lh={25} maw={520}>
                    {hero.synopsis}
                  </Text>
                ) : (
                  <Dots items={hero.moods.concat(hero.genres[0])} />
                )}
                <Block direction="row" gap={10} w={wide ? undefined : '100%'}>
                                      <Button
                      title="Play"
                      startSection={<Icon name="play" variant="filled" size={20} color={C.black} />}
                      color={C.white}
                      textColor={C.black}
                      flex={wide ? undefined : 1}
                      onPress={() => app.play(hero.id)}
                    />
                                      <Button
                      title="My List"
                      startSection={inList ? <Icon name="check" size={20} color={C.white} /> : <Icon name="plus" size={20} color={C.white} />}
                      color="#6D6D6EB3"
                      textColor={C.white}
                      flex={wide ? undefined : 1}
                      onPress={() => app.toggleList(hero.id)}
                    />
                  {wide && (
                    <Button
                      title="More Info"
                      startSection={<Icon name="info" size={20} color={C.white} />}
                      color="#6D6D6EB3"
                      textColor={C.white}
                      onPress={() => app.openTitle(hero.id)}
                    />
                  )}
                </Block>
              </Gradient>
            </BackgroundImage>
          </Block>

          {continuing.length > 0 && (
            <Shelf heading={`Continue Watching for ${app.profile?.name ?? 'you'}`}>
              {continuing.map((item) => (
                <ContinueCard key={item.id} title={item} w={poster} />
              ))}
            </Shelf>
          )}

          <Shelf heading={`Top 10 ${showTopMovies ? 'Movies' : 'TV Shows'} Today`}>
            {top.map((item, index) => (
              <Block
                key={item.id}
                direction="row"
                align="flex-end"
                gap={0}
                onPress={() => app.openTitle(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Number ${index + 1}, ${item.title}`}
              >
                <Text c="transparent" stroke={{ c: "#8C8C8C", w: 2 }} fw="900" size={wide ? 150 : 104} lh={wide ? 140 : 96} lts={-8} mr={-10}>
                  {index + 1}
                </Text>
                <Poster title={item} w={poster} onPress={() => app.openTitle(item.id)} />
              </Block>
            ))}
          </Shelf>

          {shelf('Trending Now', pool.slice().sort((a, b) => b.match - a.match))}
          {shelf('My List', pool.filter((item) => app.myList.includes(item.id)))}
          {shelf('New Releases', pool.filter((item) => item.label || item.year === '2026'))}
          {shelf('Only on Nightfall', pool.filter((item) => item.original))}
          {shelf('Edge-of-Your-Seat Thrillers', pool.filter((item) => item.genres.some((genre) => ['Thriller', 'Mystery', 'Horror'].includes(genre))))}
          {shelf('Feel-Good Favourites', pool.filter((item) => item.moods.some((mood) => ['Feel-Good', 'Heartfelt', 'Witty', 'Charming'].includes(mood))))}
        </>
      )}
    </ScrollArea>
  );
}

function ContinueCard({ title, w }: { title: Title; w: number }) {
  const app = useNightfall();
  const resume = app.resume(title);
  return (
    <Block w={w} gap={0} radius={6} overflow="hidden" bg={C.panel}>
      <Block gap={0} onPress={() => app.play(title.id)} accessibilityRole="button" accessibilityLabel={`Resume ${title.title}`}>
        <Poster title={title} w={w} onPress={() => app.play(title.id)} />
      </Block>
      <Progress value={resume.value * 100} size={3} radius={0} color={C.red} trackColor="#4D4D4D" />
      <Block direction="row" align="center" justify="space-between" px={8} py={6} gap={4}>
        <Text c={C.soft} size={11} fw="600">
          {resume.label || `${Math.round((1 - resume.value) * 100)}% left`}
        </Text>
        <Block gap={0} onPress={() => app.openTitle(title.id)} accessibilityRole="button" accessibilityLabel={`${title.title} details`}>
          <Icon name="info" size={20} color={C.soft} />
        </Block>
      </Block>
    </Block>
  );
}
