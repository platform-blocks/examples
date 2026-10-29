import { useState } from 'react';
import { Block, Chip, Icon, ScrollArea, Text, useToast } from '@plocks/ui';

import { TOP_MOVIES, TOP_SHOWS, byId, comingSoon, released, type Title } from '../data';
import { useNightfall } from '../store';
import { Action, C, Dots, Mark, Still, useScreen } from '../ui';

type Section = 'coming' | 'everyone' | 'shows' | 'movies';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'coming', label: '🍿 Coming Soon' },
  { key: 'everyone', label: "🔥 Everyone's Watching" },
  { key: 'shows', label: '🔟 Top 10 TV Shows' },
  { key: 'movies', label: '🔟 Top 10 Movies' },
];

export function NewHotScreen() {
  const { gutter } = useScreen();
  const [section, setSection] = useState<Section>('coming');
  const items =
    section === 'coming'
      ? comingSoon
      : section === 'everyone'
        ? released.filter((item) => item.label || item.match >= 93)
        : (section === 'shows' ? TOP_SHOWS : TOP_MOVIES).map(byId);

  return (
    <Block flex={1} gap={0}>
      <Block gap={0}>
      <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ px: gutter, py: 10, gap: 8, direction: 'row' }}>
        {SECTIONS.map((item) => (
          <Chip
            key={item.key}
            variant="filled"
            color={section === item.key ? C.white : C.raised}
            labelProps={{ c: section === item.key ? C.black : C.white, fw: 'bold' }}
            pressed={section === item.key}
            onPress={() => setSection(item.key)}
          >
            {item.label}
          </Chip>
        ))}
      </ScrollArea>
      </Block>
      <ScrollArea flex={1} contentProps={{ px: gutter, pb: 40, pt: 8 }}>
        <Block gap={0} w="100%" maw={760} alignSelf="center">
          {items.map((item, index) => (
            <Entry key={item.id} title={item} lead={section === 'coming' ? 'date' : section === 'everyone' ? 'none' : 'rank'} rank={index + 1} />
          ))}
        </Block>
      </ScrollArea>
    </Block>
  );
}

function Entry({ title, lead, rank }: { title: Title; lead: 'date' | 'rank' | 'none'; rank: number }) {
  const app = useNightfall();
  const toast = useToast();
  const { wide } = useScreen();
  const reminded = app.reminders.includes(title.id);
  const inList = app.myList.includes(title.id);
  const share = () => toast.show({ title: 'Link copied', message: `nightfall.example/title/${title.id}`, autoHide: 2500 });
  return (
    <Block direction="row" gap={wide ? 18 : 10} mb={wide ? 40 : 30}>
      {lead !== 'none' && (
        <Block w={wide ? 64 : 44} align="center" gap={0}>
          {lead === 'date' ? (
            <>
              <Text c={C.muted} fw="bold" size={wide ? 14 : 12}>
                {title.coming?.month}
              </Text>
              <Text c={C.white} fw="900" size={wide ? 38 : 30} lh={wide ? 40 : 32}>
                {title.coming?.day}
              </Text>
            </>
          ) : (
            <Text c={C.white} fw="900" size={wide ? 52 : 38} lh={wide ? 54 : 40}>
              {rank}
            </Text>
          )}
        </Block>
      )}
      <Block flex={1} gap={10}>
        <Block gap={0} onPress={() => (title.coming ? app.playTrailer(title.id, `${title.id}:trailer`) : app.openTitle(title.id))} accessibilityRole="button" accessibilityLabel={title.coming ? `Play ${title.title} teaser` : title.title}>
          <Still title={title} w="100%" play radius={8}>
            <Block position="absolute" left={10} bottom={8} gap={0}>
              <Text c={C.white} fw="900" size={wide ? 30 : 20} tt="uppercase">
                {title.title}
              </Text>
            </Block>
          </Still>
        </Block>
        <Block direction="row" align="center" justify="space-between" gap={8}>
          <Block flex={1} gap={0}>
            {title.coming && (
              <Text c={C.white} fw="bold" size={13}>
                {title.coming.note}
              </Text>
            )}
          </Block>
          {title.coming ? (
            <>
              <Action
                icon={<Icon name={reminded ? 'bell-ringing' : 'bell'} size={22} color={C.white} />}
                label={reminded ? 'Reminder Set' : 'Remind Me'}
                onPress={() => app.toggleReminder(title.id)}
              />
              <Action icon={<Icon name="info" size={22} color={C.white} />} label="Info" onPress={() => app.openTitle(title.id)} />
            </>
          ) : (
            <>
              <Action icon={<Icon name="share" size={22} color={C.white} />} label="Share" onPress={share} />
              <Action
                icon={inList ? <Icon name="check" size={22} color={C.white} /> : <Icon name="plus" size={22} color={C.white} />}
                label="My List"
                onPress={() => app.toggleList(title.id)}
              />
              <Action icon={<Icon name="play" variant="filled" size={22} color={C.white} />} label="Play" onPress={() => app.play(title.id)} />
            </>
          )}
        </Block>
        {title.original && (
          <Block direction="row" align="center" gap={6}>
            <Mark size={14} />
            <Text c={C.soft} fw="bold" size={10} lts={3}>
              {title.kind === 'series' ? 'SERIES' : 'FILM'}
            </Text>
          </Block>
        )}
        <Text c={C.white} fw="bold" size={wide ? 20 : 17}>
          {title.title}
        </Text>
        <Text c={C.muted} size={13} lh={19}>
          {title.synopsis}
        </Text>
        <Block gap={0} align="flex-start">
          <Dots items={title.moods.concat(title.genres)} c={C.white} size={12} ta="left" />
        </Block>
      </Block>
    </Block>
  );
}
