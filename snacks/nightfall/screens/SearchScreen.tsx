import { useState } from 'react';
import { Block, Icon, IconButton, Input, ScrollArea, Text } from '@plocks/ui-snack';

import { TOP_SEARCHES, byId, released, TITLES } from '../data';
import { useNightfall } from '../store';
import { C, PlayGlyph, PosterGrid, Still, useScreen } from '../ui';

export function SearchScreen() {
  const app = useNightfall();
  const { wide, gutter } = useScreen();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = TITLES.filter((item) =>
    [item.title, item.kind === 'series' ? 'tv show series' : 'movie film', ...item.genres, ...item.moods, ...item.cast, item.creator]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
  const suggestions = released.filter((item) => !results.includes(item)).slice(0, wide ? 12 : 9);

  return (
    <Block flex={1} gap={0}>
      <Block direction="row" align="center" gap={8} px={gutter} py={10}>
        <IconButton icon="arrowLeft" variant="ghost" iconColor={C.white} accessibilityLabel="Back" onPress={app.back} />
        <Input
          variant="filled"
          size="lg"
          radius={6}
          value={query}
          onChangeText={setQuery}
          placeholder="Search shows, movies, genres, people"
          placeholderTextColor="#8C8C8C"
          startSection={<Icon name="search" size={20} color={C.muted} />}
          clearable
          clearButtonLabel="Clear search"
          autoFocus
          mb={0}
          flex={1}
          inputColor={C.white}
          inputFontSize={15}
          accessibilityLabel="Search"
        />
      </Block>

      <ScrollArea flex={1} contentProps={{ px: gutter, pb: 40, gap: 12 }}>
        {!q ? (
          <>
            <Text c={C.white} fw="bold" size={wide ? 22 : 18} mt={8}>
              Top Searches
            </Text>
            <Block gap={wide ? 10 : 6} direction={wide ? 'row' : 'column'} wrap="wrap">
              {TOP_SEARCHES.map(byId).map((item) => (
                <Block
                  key={item.id}
                  direction="row"
                  align="center"
                  gap={12}
                  bg={C.panel}
                  radius={4}
                  overflow="hidden"
                  w={wide ? '49%' : '100%'}
                  onPress={() => app.openTitle(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                >
                  <Still title={item} w={wide ? 168 : 136} radius={0} />
                  <Block flex={1} gap={2}>
                    <Text c={C.white} fw="600" size={15} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text c={C.muted} size={12}>
                      {item.kind === 'series' ? 'TV Show' : 'Movie'} · {item.genres[0]}
                    </Text>
                  </Block>
                  <Block gap={0} pr={14} onPress={() => app.play(item.id)} accessibilityRole="button" accessibilityLabel={`Play ${item.title}`}>
                    <PlayGlyph size={34} />
                  </Block>
                </Block>
              ))}
            </Block>
          </>
        ) : results.length ? (
          <>
            <Text c={C.white} fw="bold" size={wide ? 22 : 18} mt={8}>
              Movies & TV
            </Text>
            <PosterGrid titles={results} onPress={app.openTitle} />
          </>
        ) : (
          <>
            <Block align="center" gap={8} py={36}>
              <Text c={C.white} fw="bold" size={20} ta="center">
                Oh darn. We don't have that.
              </Text>
              <Text c={C.muted} size={14} ta="center" maw={360}>
                Try searching for another movie, show, actor, director or genre.
              </Text>
            </Block>
            <Text c={C.white} fw="bold" size={wide ? 22 : 18}>
              You might like
            </Text>
            <PosterGrid titles={suggestions} onPress={app.openTitle} />
          </>
        )}
      </ScrollArea>
    </Block>
  );
}
