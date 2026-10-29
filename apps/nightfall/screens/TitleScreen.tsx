import { useState } from 'react';
import { Avatar, BackgroundImage, Block, Button, Gradient, Icon, IconButton, Menu, MenuDropdown, MenuItem, Progress, ScrollArea, Tabs, Text, useToast } from '@plocks/ui';

import { ART, CAST_COLORS, byId, initials, similarTo, topRank, trailersFor } from '../data';
import { progressKey, useNightfall, type Rating } from '../store';
import { Action, C, Mark, Meta, PlayGlyph, PosterGrid, Still, useScreen } from '../ui';

export function TitleScreen({ id }: { id: string }) {
  const app = useNightfall();
  const toast = useToast();
  const { wide, gutter } = useScreen();
  const title = byId(id);
  const rank = topRank(title);
  const series = title.kind === 'series';
  const [section, setSection] = useState(series ? 'episodes' : 'more');
  const [season, setSeason] = useState(app.lastEp[id]?.[0] ?? 1);
  const [rating, setRating] = useState(false);
  const resume = app.resume(title);
  const inList = app.myList.includes(id);
  const download = app.downloads[id];
  const rated = app.ratings[id];
  const episodes = title.seasons?.[season - 1] ?? [];
  const thumb = { down: 'thumb-down', up: 'thumb-up', love: 'heart' };
  const reminded = app.reminders.includes(id);

  const share = () =>
    toast.show({ title: 'Link copied', message: `nightfall.example/title/${title.id}`, autoHide: 2500 });
  const rate = (value: Rating) => {
    app.rate(id, value);
    setRating(false);
  };

  return (
    <ScrollArea flex={1} contentProps={{ pb: 48 }}>
      <Block gap={0} w="100%" maw={1100} alignSelf="center">
        <BackgroundImage source={ART[title.art]} w="100%" h={wide ? 460 : 250} justify="space-between">
          <Gradient colors={[title.tint, '#0000', C.black]} flex={1} justify="space-between" p={gutter}>
            <Block direction="row" justify="space-between" gap={0}>
              <IconButton icon="arrowLeft" variant="filled" color="#000A" iconColor={C.white} accessibilityLabel="Back" onPress={app.back} />
            </Block>
            {!title.coming && (
              <Block alignSelf="center" gap={0} onPress={() => app.play(id)} accessibilityRole="button" accessibilityLabel={`Play ${title.title}`}>
                <PlayGlyph size={wide ? 68 : 52} />
              </Block>
            )}
            <Block h={20} gap={0} />
          </Gradient>
        </BackgroundImage>

        <Block px={gutter} gap={12} mt={wide ? -40 : 0}>
          {title.original && (
            <Block direction="row" align="center" gap={6}>
              <Mark size={16} />
              <Text c={C.soft} fw="bold" size={11} lts={3}>
                {series ? 'SERIES' : 'FILM'}
              </Text>
            </Block>
          )}
          <Text c={C.white} fw="900" size={wide ? 44 : 28} lh={wide ? 48 : 32}>
            {title.title}
          </Text>
          <Meta title={title} />
          {rank && !title.coming && (
            <Block direction="row" align="center" gap={8}>
              <Block bg={C.red} px={4} py={1} radius={2} gap={0}>
                <Text c={C.white} fw="900" size={10}>
                  TOP 10
                </Text>
              </Block>
              <Text c={C.white} fw="bold" size={14}>
                #{rank} in {series ? 'TV Shows' : 'Movies'} Today
              </Text>
            </Block>
          )}

          {title.coming ? (
            <Block gap={8} maw={wide ? 420 : undefined}>
              <Text c={C.white} fw="bold" size={14}>
                {title.coming.note}
              </Text>
              <Button
                title={reminded ? 'Reminder set' : 'Remind Me'}
                startSection={<Icon name={reminded ? 'bell-ringing' : 'bell'} size={20} color={C.black} />}
                color={C.white}
                textColor={C.black}
                fullWidth
                onPress={() => app.toggleReminder(id)}
              />
            </Block>
          ) : (
            <Block gap={8} maw={wide ? 420 : undefined}>
              <Button
                title={resume.value > 0 && resume.value < 1 ? `Resume${resume.label ? ` ${resume.label}` : ''}` : series ? 'Play S1:E1' : 'Play'}
                startSection={<Icon name="play" variant="filled" size={20} color={C.black} />}
                color={C.white}
                textColor={C.black}
                fullWidth
                onPress={() => app.play(id)}
              />
              {resume.value > 0 && resume.value < 1 && <Progress value={resume.value * 100} size={3} color={C.red} trackColor="#555" />}
              <Button
                title={download === undefined ? 'Download' : download < 1 ? `Downloading ${Math.round(download * 100)}%` : 'Downloaded'}
                startSection={
                  download === 1 ? <Icon name="circle-check" variant="filled" size={20} color={C.white} /> : <Icon name="download" size={20} color={C.white} />
                }
                color="#333333"
                textColor={C.white}
                fullWidth
                onPress={() => (download === undefined ? app.download(id) : app.push({ name: 'downloads' }))}
              />
            </Block>
          )}

          <Text c={C.white} size={wide ? 16 : 14} lh={wide ? 24 : 21} maw={720}>
            {title.synopsis}
          </Text>
          <Text c={C.muted} size={12} lh={18}>
            Cast: <Text c={C.soft} size={12}>{title.cast.join(', ')}</Text>
          </Text>
          <Text c={C.muted} size={12}>
            {series ? 'Creator' : 'Director'}: <Text c={C.soft} size={12}>{title.creator}</Text>
          </Text>

          <Block direction="row" gap={wide ? 20 : 4} mt={4} align="flex-start">
            <Action
              icon={inList ? <Icon name="check" size={26} color={C.white} /> : <Icon name="plus" size={26} color={C.white} />}
              label="My List"
              accessibilityLabel={inList ? 'Remove from My List' : 'Add to My List'}
              onPress={() => app.toggleList(id)}
            />
            {!title.coming && (
              <Action
                icon={<Icon name={rated ? thumb[rated] : 'thumb-up'} variant={rated ? 'filled' : 'outlined'} size={26} color={C.white} />}
                label={rated === 'love' ? 'Love this!' : rated === 'up' ? 'I like this' : rated === 'down' ? 'Not for me' : 'Rate'}
                onPress={() => setRating((open) => !open)}
              />
            )}
            {title.coming && (
              <Action
                icon={<Icon name={reminded ? 'bell-ringing' : 'bell'} size={26} color={C.white} />}
                label="Remind Me"
                onPress={() => app.toggleReminder(id)}
              />
            )}
            <Action icon={<Icon name="share" size={26} color={C.white} />} label="Share" onPress={share} />
          </Block>
          {rating && (
            <Block direction="row" gap={6} bg={C.raised} radius="full" p={6} alignSelf="flex-start">
              {(['down', 'up', 'love'] as Rating[]).map((value) => {
                return (
                  <Block
                    key={value}
                    gap={2}
                    align="center"
                    px={14}
                    py={6}
                    radius="full"
                    bg={rated === value ? '#FFFFFF22' : undefined}
                    onPress={() => rate(value)}
                    accessibilityRole="button"
                    accessibilityLabel={value === 'down' ? 'Not for me' : value === 'up' ? 'I like this' : 'Love this'}
                  >
                    <Icon name={thumb[value]} variant={rated === value ? 'filled' : 'outlined'} size={24} color={C.white} />
                    <Text c={C.soft} size={10}>
                      {value === 'down' ? 'Not for me' : value === 'up' ? 'I like this' : 'Love this!'}
                    </Text>
                  </Block>
                );
              })}
            </Block>
          )}

          <Block gap={6} mt={4}>
            <Text c={C.muted} size={12}>
              Genres: <Text c={C.soft} size={12}>{title.genres.join(', ')}</Text>
            </Text>
            <Text c={C.muted} size={12}>
              This {series ? 'show' : 'movie'} is: <Text c={C.soft} size={12}>{title.moods.join(', ')}</Text>
            </Text>
          </Block>

          <Block gap={10} mt={8}>
            <Text c={C.white} fw="bold" size={16}>
              Cast
            </Text>
            <ScrollArea horizontal showsHorizontalScrollIndicator={false} contentProps={{ direction: 'row', gap: 14 }}>
              {title.cast.map((actor, index) => (
                <Block key={actor} w={76} align="center" gap={6}>
                  <Avatar
                    size={52}
                    fallback={initials(actor)}
                    bg={CAST_COLORS[index % CAST_COLORS.length]}
                    textColor={C.white}
                    showText={false}
                    accessibilityLabel={actor}
                  />
                  <Text c={C.soft} size={11} ta="center" numberOfLines={2}>
                    {actor}
                  </Text>
                </Block>
              ))}
            </ScrollArea>
          </Block>

          <Block mt={10} gap={0} borderTopWidth={1} borderTopColor={C.line}>
            <Tabs
              navigationOnly
              variant="line"
              value={section}
              onChange={setSection}
              color={C.red}
              activeTabTextColor={C.white}
              labelProps={{ size: 14, fw: 'bold', c: C.muted }}
              items={[
                ...(series ? [{ key: 'episodes', label: 'Episodes', content: null }] : []),
                { key: 'more', label: 'More Like This', content: null },
                { key: 'trailers', label: 'Trailers & More', content: null },
              ]}
            />
          </Block>

          {section === 'episodes' && series && (
            <Block gap={14}>
              {title.seasons && title.seasons.length > 1 ? (
                <Menu position="bottom-start">
                  <Button
                    title={`Season ${season}`}
                    endSection={<Icon name="chevron-down" size={16} color={C.white} />}
                    color={C.raised}
                    textColor={C.white}
                    size="sm"
                    accessibilityLabel="Choose season"
                  />
                  <MenuDropdown>
                    {title.seasons.map((_, index) => (
                      <MenuItem key={index} onPress={() => setSeason(index + 1)}>
                        {`Season ${index + 1}${index + 1 === season ? '  ✓' : ''}`}
                      </MenuItem>
                    ))}
                  </MenuDropdown>
                </Menu>
              ) : (
                <Text c={C.soft} fw="bold" size={14}>
                  Season 1
                </Text>
              )}
              {episodes.map((episode) => {
                const watched = app.progress[progressKey(id, season, episode.n)] ?? 0;
                return (
                  <Block key={episode.n} gap={8}>
                    <Block direction="row" align="center" gap={12}>
                      <Block
                        gap={0}
                        w={wide ? 200 : 128}
                        onPress={title.coming ? undefined : () => app.play(id, season, episode.n)}
                        accessibilityRole="button"
                        accessibilityLabel={`Play episode ${episode.n}, ${episode.title}`}
                      >
                        <Still title={title} w="100%" play={!title.coming} progress={watched} />
                      </Block>
                      <Block flex={1} gap={2}>
                        <Text c={C.white} fw="bold" size={14} numberOfLines={2}>
                          {episode.n}. {episode.title}
                        </Text>
                        <Text c={C.muted} size={12}>
                          {episode.length}
                        </Text>
                      </Block>
                      {!title.coming && (
                        <IconButton
                          icon={app.downloads[id] === 1 ? 'circle-check' : 'download'} iconVariant={app.downloads[id] === 1 ? 'filled' : 'outlined'}
                          variant="ghost"
                          iconColor={C.white}
                          accessibilityLabel={`Download episode ${episode.n}`}
                          onPress={() => app.download(id)}
                        />
                      )}
                    </Block>
                    <Text c={C.muted} size={13} lh={19}>
                      {episode.synopsis}
                    </Text>
                  </Block>
                );
              })}
            </Block>
          )}

          {section === 'more' && <PosterGrid titles={similarTo(title).slice(0, wide ? 12 : 9)} onPress={app.openTitle} />}

          {section === 'trailers' && (
            <Block gap={18} direction={wide ? 'row' : 'column'} wrap="wrap">
              {trailersFor(title).map((trailer) => (
                <Block
                  key={trailer.id}
                  gap={8}
                  w={wide ? 320 : '100%'}
                  onPress={() => app.playTrailer(id, trailer.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${trailer.label}`}
                >
                  <Still title={title} w="100%" play />
                  <Text c={C.white} fw="bold" size={14}>
                    {trailer.label}: {title.title}{' '}
                    <Text c={C.muted} size={12}>
                      {trailer.length}
                    </Text>
                  </Text>
                </Block>
              ))}
            </Block>
          )}
        </Block>
      </Block>
    </ScrollArea>
  );
}
