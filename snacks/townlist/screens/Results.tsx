import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Block, Chip, Icon, IconButton, Input, ScrollArea, SegmentedControl, Text, useToast } from '@plocks/ui-snack';
import { C } from '../theme';
import { sectionById, subLabel } from '../data';
import { useStore, type Filter, type Sort } from '../store';
import { EmptyNote, ListingRow, ListingTile, Screen, useWide } from '../components';
import { CityButton, SearchBar } from './Home';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'newest' },
  { value: 'price-asc', label: 'price ↑' },
  { value: 'price-desc', label: 'price ↓' },
];

export function filterTitle(filter: Filter) {
  if (filter.section && filter.sub) return subLabel(filter.section, filter.sub);
  if (filter.section) return `all ${sectionById(filter.section).label}`;
  return filter.query ? `“${filter.query}”` : 'all posts';
}

export function Results({ initial }: { initial: Filter }) {
  const store = useStore();
  const toast = useToast();
  const wide = useWide();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>(initial);
  const [view, setView] = useState<'list' | 'gallery'>('list');
  const [showPrice, setShowPrice] = useState(!!(initial.min || initial.max));
  const results = store.search(filter);
  const set = (patch: Partial<Filter>) => setFilter((old) => ({ ...old, ...patch }));
  const section = filter.section ? sectionById(filter.section) : undefined;
  const columns = wide ? 4 : width >= 560 ? 3 : 2;
  const contentW = Math.min(wide ? width - 220 - 48 : width - 28, 880);
  const tileW = Math.floor((contentW - (columns - 1) * 10) / columns);
  const open = (id: string) => store.push({ name: 'listing', id });

  return (
    <Screen
      back
      title={filterTitle(filter)}
      subtitle={`${results.length} result${results.length === 1 ? '' : 's'} · ${store.city.name}${store.radius ? ` +${store.radius}mi` : ''}`}
      right={
        <Block gap={4} direction="row" align="center">
          <IconButton
            icon="bookmark"
            variant="ghost"
            iconColor={C.purple}
            accessibilityLabel="Save this search"
            onPress={() => {
              store.saveSearch(filter);
              toast.show({ title: 'Search saved', message: 'Find it under saved.', autoHide: 2200 });
            }}
          />
          {wide && <CityButton />}
        </Block>
      }
    >
      <Block gap={6} direction="row" align="center" mb={8} wrap>
        <Text c={C.link} size={12} onPress={() => store.push({ name: 'cities' })}>
          {store.city.name}
        </Text>
        {section && (
          <>
            <Text c={C.faint} size={12}>›</Text>
            <Text c={C.link} size={12} onPress={() => set({ sub: undefined })}>
              {section.label}
            </Text>
          </>
        )}
        {filter.sub && filter.section && (
          <>
            <Text c={C.faint} size={12}>›</Text>
            <Text c={C.ink} size={12}>
              {subLabel(filter.section, filter.sub)}
            </Text>
          </>
        )}
      </Block>
      <SearchBar initial={filter.query} onSubmit={(query) => set({ query })} />

      {section && (
        <ScrollArea horizontal showsHorizontalScrollIndicator={false} mt={10} contentProps={{ gap: 6, direction: 'row' }}>
          <Chip size="xs" variant={!filter.sub ? 'filled' : 'outline'} color={C.purple} onPress={() => set({ sub: undefined })}>
            all
          </Chip>
          {section.subs.map((item) => (
            <Chip
              key={item.id}
              size="xs"
              variant={filter.sub === item.id ? 'filled' : 'outline'}
              color={C.purple}
              onPress={() => set({ sub: filter.sub === item.id ? undefined : item.id })}
            >
              {item.label}
            </Chip>
          ))}
        </ScrollArea>
      )}

      <Block gap={8} direction="row" align="center" justify="space-between" wrap mt={10} pb={10} borderBottomWidth={1} borderBottomColor={C.line}>
        <Block gap={6} direction="row" wrap align="center">
          <Chip size="xs" variant={filter.hasImage ? 'light' : 'outline'} color={C.purple} onPress={() => set({ hasImage: !filter.hasImage })} startSection={filter.hasImage ? <Icon name="check" size={12} color={C.purple} /> : undefined}>
            has image
          </Chip>
          <Chip size="xs" variant={filter.today ? 'light' : 'outline'} color={C.purple} onPress={() => set({ today: !filter.today })} startSection={filter.today ? <Icon name="check" size={12} color={C.purple} /> : undefined}>
            posted today
          </Chip>
          <Chip size="xs" variant={showPrice || filter.min || filter.max ? 'light' : 'outline'} color={C.purple} onPress={() => setShowPrice(!showPrice)} endSection={<Icon name={showPrice ? 'chevron-up' : 'chevron-down'} size={12} color={C.purple} />}>
            {filter.min || filter.max ? `$${filter.min || 0}–${filter.max ? '$' + filter.max : 'any'}` : 'price'}
          </Chip>
        </Block>
        <Block gap={8} direction="row" align="center">
          <SegmentedControl
            size="xs"
            data={SORTS}
            value={filter.sort ?? 'newest'}
            onChange={(value) => set({ sort: value as Sort })}
            color={C.purple}
            accessibilityLabel="Sort results"
          />
          <SegmentedControl
            size="xs"
            data={[
              { value: 'list', label: <Icon name="list" size={14} color={view === 'list' ? C.white : C.muted} /> },
              { value: 'gallery', label: <Icon name="grid" size={14} color={view === 'gallery' ? C.white : C.muted} /> },
            ]}
            value={view}
            onChange={(value) => setView(value as typeof view)}
            color={C.purple}
            accessibilityLabel="Results view"
          />
        </Block>
      </Block>
      {showPrice && (
        <Block gap={8} direction="row" align="center" py={10} borderBottomWidth={1} borderBottomColor={C.line}>
          <Input variant="outline" size="sm" value={filter.min ?? ''} onChangeText={(min) => set({ min: min.replace(/[^0-9]/g, '') })} placeholder="min $" keyboardType="number-pad" mb={0} flex={1} radius={6} accessibilityLabel="Minimum price" />
          <Text c={C.muted}>to</Text>
          <Input variant="outline" size="sm" value={filter.max ?? ''} onChangeText={(max) => set({ max: max.replace(/[^0-9]/g, '') })} placeholder="max $" keyboardType="number-pad" mb={0} flex={1} radius={6} accessibilityLabel="Maximum price" />
          <Text c={C.link} size={12} onPress={() => set({ min: undefined, max: undefined })}>
            reset
          </Text>
        </Block>
      )}

      {results.length === 0 ? (
        <EmptyNote icon="search" title="No posts found">
          Try another search, a wider radius, or fewer filters.
          {'\n'}
          <Text c={C.link} size={13} onPress={() => store.push({ name: 'cities' })}>
            change area or radius
          </Text>
        </EmptyNote>
      ) : view === 'list' ? (
        results.map((item) => <ListingRow key={item.id} listing={item} onPress={() => open(item.id)} />)
      ) : (
        <Block gap={10} direction="row" wrap pt={12}>
          {results.map((item) => (
            <ListingTile key={item.id} listing={item} w={tileW} onPress={() => open(item.id)} />
          ))}
        </Block>
      )}
      {store.hidden.length > 0 && results.length > 0 && (
        <Text c={C.faint} size={11} ta="center" mt={16}>
          {store.hidden.length} hidden post{store.hidden.length === 1 ? '' : 's'} not shown
        </Text>
      )}
    </Screen>
  );
}
