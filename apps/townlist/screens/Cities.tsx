import { useMemo, useState } from 'react';
import { Block, Icon, Input, Slider, Text } from '@plocks/ui';
import { C } from '../theme';
import { CITIES, REGIONS, distance, type City } from '../data';
import { useStore } from '../store';
import { Screen, SectionLabel } from '../components';

const RADII = [0, 5, 10, 25, 50, 100];

export function Cities() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (city: City) => !q || city.name.includes(q) || city.hoods.some((hood) => hood.includes(q));
  const nearby = useMemo(
    () =>
      CITIES.filter((city) => city.id !== store.cityId)
        .map((city) => ({ city, miles: distance(store.city, city) }))
        .filter((item) => item.miles <= 120)
        .sort((a, b) => a.miles - b.miles),
    [store.city, store.cityId],
  );
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of store.listings) result[item.cityId] = (result[item.cityId] ?? 0) + 1;
    return result;
  }, [store.listings]);
  const radiusIndex = Math.max(0, RADII.indexOf(store.radius));
  const inRadius = nearby.filter((item) => item.miles <= store.radius);

  const choose = (city: City) => {
    store.setCityId(city.id);
    store.back();
  };
  const cityRow = (city: City, miles?: number) => {
    const current = city.id === store.cityId;
    return (
      <Block
        key={city.id}
        onPress={() => choose(city)}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${city.name}`}
        direction="row"
        align="center"
        gap={10}
        py={10}
        px={4}
        borderBottomWidth={1}
        borderBottomColor={C.line}
        pressedStyle={{ opacity: 0.6 }}
      >
        <Block flex={1} miw={0} gap={1}>
          <Text c={current ? C.ink : C.link} fw={current ? 'bold' : 'semibold'} size={15}>
            {city.name}
          </Text>
          <Text c={C.muted} size={11} numberOfLines={1}>
            {city.hoods.slice(0, 3).join(', ')}
            {city.hoods.length > 3 ? '…' : ''}
          </Text>
        </Block>
        {miles !== undefined && (
          <Text c={C.muted} size={12}>
            {miles} mi
          </Text>
        )}
        <Text c={C.faint} size={11} miw={44} ta="right">
          {counts[city.id] ?? 0} posts
        </Text>
        {current && <Icon name="check" color={C.purple} size={17} />}
      </Block>
    );
  };

  return (
    <Screen back title="choose area" subtitle={`currently ${store.city.name}`} maw={680}>
      <Input
        variant="outline"
        value={query}
        onChangeText={setQuery}
        placeholder="search cities and neighborhoods"
        startSection={<Icon name="search" color={C.muted} size={17} />}
        clearable
        mb={0}
        radius={6}
        inputColor={C.ink}
        accessibilityLabel="Search cities"
      />

      {!q && (
        <>
          <SectionLabel>search radius</SectionLabel>
          <Block gap={10} p={14} radius={6} bg={C.paler} borderWidth={1} borderColor={C.line}>
            <Block gap={0} direction="row" align="center" justify="space-between">
              <Text c={C.ink} fw="semibold" size={14}>
                {store.radius === 0 ? `${store.city.name} only` : `within ${store.radius} miles of ${store.city.name}`}
              </Text>
              <Text c={C.muted} size={12}>
                {inRadius.length ? `+${inRadius.length} area${inRadius.length === 1 ? '' : 's'}` : ''}
              </Text>
            </Block>
            <Slider
              accessibilityLabel="Search radius"
              value={radiusIndex}
              min={0}
              max={RADII.length - 1}
              step={1}
              restrictToTicks
              ticks={RADII.map((miles, index) => ({ value: index, label: miles === 0 ? 'city' : `${miles}` }))}
              showTicks
              valueLabel={(index) => (RADII[index] === 0 ? 'city only' : `${RADII[index]} mi`)}
              color={C.purple}
              onChange={(index) => store.setRadius(RADII[Math.round(index)] ?? 0)}
              mb={14}
            />
            {inRadius.length > 0 && (
              <Text c={C.muted} size={12}>
                includes {inRadius.map((item) => item.city.name).join(', ')}
              </Text>
            )}
          </Block>

          <SectionLabel>nearby areas</SectionLabel>
          <Block gap={0} borderTopWidth={1} borderTopColor={C.line}>
            {nearby.map((item) => cityRow(item.city, item.miles))}
          </Block>
        </>
      )}

      {REGIONS.map((region) => {
        const list = CITIES.filter((city) => city.region === region.id && matches(city));
        if (!list.length) return null;
        return (
          <Block key={region.id} gap={0}>
            <SectionLabel>{region.label}</SectionLabel>
            <Block gap={0} borderTopWidth={1} borderTopColor={C.line}>
              {list.map((city) => cityRow(city, region.id === store.city.region ? distance(store.city, city) : undefined))}
            </Block>
          </Block>
        );
      })}
      {q && !CITIES.some(matches) && (
        <Text c={C.muted} ta="center" py={30}>
          No areas match “{query}”.
        </Text>
      )}
    </Screen>
  );
}
