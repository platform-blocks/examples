import { useMemo, useState } from 'react';
import { Block, Button, Icon, Input, Text } from '@plocks/ui';
import { C } from '../theme';
import { SECTIONS, type Section } from '../data';
import { useStore } from '../store';
import { ListingRow, ListingTile, Screen, SectionLabel, useWide } from '../components';

/** Count of listings per "section/sub" key in the current area. */
export function useCounts() {
  const store = useStore();
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of store.search({ query: '' })) {
      counts[item.section] = (counts[item.section] ?? 0) + 1;
      counts[`${item.section}/${item.sub}`] = (counts[`${item.section}/${item.sub}`] ?? 0) + 1;
    }
    return counts;
  }, [store]);
}

export function CityButton() {
  const store = useStore();
  return (
    <Block
      onPress={() => store.push({ name: 'cities' })}
      accessibilityRole="button"
      accessibilityLabel={`Change area, currently ${store.city.name}`}
      direction="row"
      align="center"
      gap={4}
      px={10}
      py={6}
      radius={16}
      bg={C.tint}
      pressedStyle={{ opacity: 0.7 }}
    >
      <Icon name="map-pin" color={C.purple} size={15} />
      <Text c={C.purple} fw="semibold" size={13} numberOfLines={1}>
        {store.city.name}
        {store.radius > 0 ? ` +${store.radius}mi` : ''}
      </Text>
      <Icon name="chevron-down" color={C.purple} size={14} />
    </Block>
  );
}

export function SearchBar({ initial = '', onSubmit }: { initial?: string; onSubmit: (query: string) => void }) {
  const [query, setQuery] = useState(initial);
  return (
    <Block gap={8} direction="row" align="center">
      <Input
        variant="outline"
        value={query}
        onChangeText={setQuery}
        onEnter={() => onSubmit(query)}
        placeholder="search townlist"
        returnKeyType="search"
        startSection={<Icon name="search" color={C.muted} size={17} />}
        clearable
        mb={0}
        flex={1}
        radius={6}
        inputColor={C.ink}
      />
      <Button title="go" color={C.purple} onPress={() => onSubmit(query)} radius={6} />
    </Block>
  );
}

function SectionColumn({ section, counts }: { section: Section; counts: Record<string, number> }) {
  const store = useStore();
  return (
    <Block gap={1}>
      <Text
        c={C.purple}
        fw="bold"
        size={15}
        mb={4}
        onPress={() => store.push({ name: 'results', filter: { query: '', section: section.id } })}
      >
        {section.label}
        <Text c={C.faint} size={12} fw="normal">
          {'  '}
          {counts[section.id] ?? 0}
        </Text>
      </Text>
      {section.subs.map((item) => (
        <Text
          key={item.id}
          c={counts[`${section.id}/${item.id}`] ? C.link : C.visited}
          size={13}
          lh={20}
          onPress={() => store.push({ name: 'results', filter: { query: '', section: section.id, sub: item.id } })}
        >
          {item.label}
        </Text>
      ))}
    </Block>
  );
}

export function Home() {
  const store = useStore();
  const wide = useWide();
  const counts = useCounts();
  const fresh = store.search({ query: '' }).slice(0, wide ? 6 : 8);
  const open = (id: string) => store.push({ name: 'listing', id });

  return (
    <Screen
      title={
        wide ? (
          `${store.city.name} classifieds`
        ) : (
          <Text c={C.purple} fw="bold" size={22} lts={-0.5}>
            townlist
          </Text>
        )
      }
      right={<CityButton />}
      maw={1060}
    >
      <SearchBar onSubmit={(query) => store.push({ name: 'results', filter: { query } })} />
      <Block gap={8} direction="row" mt={10} wrap>
        <Button
          size="sm"
          variant="light"
          color={C.purple}
          title="post to classifieds"
          startSection={<Icon name="plus" size={15} color={C.purple} />}
          onPress={() => store.goTab('post', true)}
        />
        <Button
          size="sm"
          variant="subtle"
          color={C.purple}
          title="all categories"
          startSection={<Icon name="grid" size={15} color={C.purple} />}
          onPress={() => store.push({ name: 'categories' })}
        />
      </Block>

      {wide ? (
        <Block gap={28} direction="row" mt={20}>
          <Block flex={1} gap={0}>
            <SectionLabel mt={0}>categories in {store.city.name}</SectionLabel>
            <Block gap={0} direction="row" wrap borderTopWidth={1} borderTopColor={C.line} pt={12}>
              {SECTIONS.map((section) => (
                <Block key={section.id} gap={0} w="33.33%" pr={14} pb={20}>
                  <SectionColumn section={section} counts={counts} />
                </Block>
              ))}
            </Block>
          </Block>
          <Block w={340} gap={0}>
            <SectionLabel mt={0} right={<Text c={C.link} size={12} onPress={() => store.push({ name: 'results', filter: { query: '' } })}>see all</Text>}>
              new today
            </SectionLabel>
            <Block gap={12} direction="row" wrap pt={12} borderTopWidth={1} borderTopColor={C.line}>
              {fresh.map((item) => (
                <ListingTile key={item.id} listing={item} w={164} onPress={() => open(item.id)} />
              ))}
            </Block>
          </Block>
        </Block>
      ) : (
        <>
          <SectionLabel right={<Text c={C.link} size={12} onPress={() => store.push({ name: 'categories' })}>browse all</Text>}>
            categories
          </SectionLabel>
          <Block gap={0} direction="row" wrap borderWidth={1} borderColor={C.line} radius={6} overflow="hidden">
            {SECTIONS.map((section, index) => (
              <Block
                key={section.id}
                w="50%"
                gap={8}
                direction="row"
                align="center"
                p={12}
                bg={C.white}
                borderRightWidth={index % 2 === 0 ? 1 : 0}
                borderBottomWidth={index < SECTIONS.length - 2 ? 1 : 0}
                borderColor={C.line}
                borderRightColor={C.line}
                borderBottomColor={C.line}
                onPress={() => store.push({ name: 'categories', section: section.id })}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${section.label}`}
                pressedStyle={{ opacity: 0.6 }}
              >
                <Block gap={0} w={34} h={34} radius={17} bg={C.tint} align="center" justify="center">
                  <Icon name={section.icon} color={C.purple} size={17} />
                </Block>
                <Block flex={1} miw={0} gap={0}>
                  <Text c={C.ink} fw="semibold" size={14}>
                    {section.label}
                  </Text>
                  <Text c={C.muted} size={11} numberOfLines={1}>
                    {counts[section.id] ?? 0} posts
                  </Text>
                </Block>
              </Block>
            ))}
          </Block>
          <SectionLabel right={<Text c={C.link} size={12} onPress={() => store.push({ name: 'results', filter: { query: '' } })}>see all</Text>}>
            newest in {store.city.name}
          </SectionLabel>
          <Block gap={0} borderTopWidth={1} borderTopColor={C.line}>
            {fresh.map((item) => (
              <ListingRow key={item.id} listing={item} onPress={() => open(item.id)} />
            ))}
          </Block>
        </>
      )}
    </Screen>
  );
}
