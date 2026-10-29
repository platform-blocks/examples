import type { ReactNode } from 'react';
import { Block, Icon, Text } from '@plocks/ui';
import { C } from '../theme';
import { SECTIONS, sectionById, type SectionId } from '../data';
import { useStore } from '../store';
import { Screen, SectionLabel } from '../components';
import { CityButton, useCounts } from './Home';

function Row({
  label,
  hint,
  count,
  icon,
  strong,
  onPress,
}: {
  label: string;
  hint?: string;
  count: number;
  icon?: ReactNode;
  strong?: boolean;
  onPress: () => void;
}) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count} posts`}
      direction="row"
      align="center"
      gap={12}
      py={hint ? 11 : 12}
      px={4}
      borderBottomWidth={1}
      borderBottomColor={C.line}
      pressedStyle={{ opacity: 0.6 }}
    >
      {icon}
      <Block flex={1} miw={0} gap={1}>
        <Text c={count || strong ? C.link : C.visited} fw={strong ? 'bold' : 'semibold'} size={15}>
          {label}
        </Text>
        {!!hint && (
          <Text c={C.muted} size={12} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </Block>
      <Text c={count ? C.muted : C.faint} size={12}>
        {count}
      </Text>
      <Icon name="chevron-right" color={C.faint} size={16} />
    </Block>
  );
}

export function Categories({ section }: { section?: SectionId }) {
  const store = useStore();
  const counts = useCounts();

  if (section) {
    const current = sectionById(section);
    return (
      <Screen back title={current.label} subtitle={`${store.city.name} · ${counts[section] ?? 0} posts`} right={<CityButton />} maw={680}>
        <Row
          strong
          label={`all ${current.label}`}
          count={counts[section] ?? 0}
          onPress={() => store.push({ name: 'results', filter: { query: '', section } })}
        />
        <SectionLabel>subcategories</SectionLabel>
        <Block gap={0} borderTopWidth={1} borderTopColor={C.line}>
          {current.subs.map((item) => (
            <Row
              key={item.id}
              label={item.label}
              count={counts[`${section}/${item.id}`] ?? 0}
              onPress={() => store.push({ name: 'results', filter: { query: '', section, sub: item.id } })}
            />
          ))}
        </Block>
      </Screen>
    );
  }

  return (
    <Screen back title="categories" subtitle={store.city.name} right={<CityButton />} maw={680}>
      <Block gap={0} borderTopWidth={1} borderTopColor={C.line}>
        {SECTIONS.map((item) => (
          <Row
            key={item.id}
            label={item.label}
            hint={item.blurb}
            count={counts[item.id] ?? 0}
            icon={
              <Block gap={0} w={36} h={36} radius={18} bg={C.tint} align="center" justify="center">
                <Icon name={item.icon} color={C.purple} size={18} />
              </Block>
            }
            onPress={() => store.push({ name: 'categories', section: item.id })}
          />
        ))}
      </Block>
    </Screen>
  );
}
