import { useState } from 'react';
import { Block, Button, Icon, IconButton, SegmentedControl, Text } from '@plocks/ui-snack';
import { C } from '../theme';
import { cityById, type Listing } from '../data';
import { useStore } from '../store';
import { EmptyNote, ListingRow, Screen } from '../components';
import { filterTitle } from './Results';

type View = 'favorites' | 'searches' | 'posts' | 'hidden';

export function Saved() {
  const store = useStore();
  const [view, setView] = useState<View>('favorites');
  const pick = (ids: string[]) => ids.map(store.listingById).filter((item): item is Listing => !!item);
  const favorites = pick(store.favorites);
  const hidden = pick(store.hidden);
  const open = (id: string) => store.push({ name: 'listing', id });

  return (
    <Screen title="saved" subtitle="favorites, searches, and your posts" maw={760}>
      <SegmentedControl
        fullWidth
        size="sm"
        color={C.purple}
        value={view}
        onChange={(value) => setView(value as View)}
        data={[
          { value: 'favorites', label: `favorites ${favorites.length}` },
          { value: 'searches', label: `searches ${store.searches.length}` },
          { value: 'posts', label: `my posts ${store.posts.length}` },
          { value: 'hidden', label: `hidden ${hidden.length}` },
        ]}
        accessibilityLabel="Saved items"
      />
      <Block gap={0} mt={8}>
        {view === 'favorites' &&
          (favorites.length ? (
            favorites.map((item) => <ListingRow key={item.id} listing={item} onPress={() => open(item.id)} />)
          ) : (
            <EmptyNote icon="star" title="No favorites yet">
              Tap the star on any post to keep it here.
            </EmptyNote>
          ))}
        {view === 'searches' &&
          (store.searches.length ? (
            store.searches.map((saved) => (
              <Block
                key={saved.id}
                onPress={() => store.runSearch(saved)}
                accessibilityRole="button"
                accessibilityLabel={`Run search ${filterTitle(saved.filter)}`}
                direction="row"
                align="center"
                gap={12}
                py={12}
                borderBottomWidth={1}
                borderBottomColor={C.line}
                pressedStyle={{ opacity: 0.6 }}
              >
                <Icon name="bookmark" color={C.purple} size={18} />
                <Block flex={1} miw={0} gap={1}>
                  <Text c={C.link} fw="semibold" size={15}>
                    {filterTitle(saved.filter)}
                    {saved.filter.query && saved.filter.section ? ` · “${saved.filter.query}”` : ''}
                  </Text>
                  <Text c={C.muted} size={12}>
                    {cityById(saved.cityId).name}
                    {saved.radius ? ` +${saved.radius}mi` : ''}
                    {saved.filter.hasImage ? ' · has image' : ''}
                    {saved.filter.today ? ' · today' : ''}
                  </Text>
                </Block>
                <IconButton icon="trash" variant="ghost" iconColor={C.muted} accessibilityLabel="Delete saved search" onPress={() => store.removeSearch(saved.id)} />
              </Block>
            ))
          ) : (
            <EmptyNote icon="bookmark" title="No saved searches">
              Use the bookmark on a results page to save a search.
            </EmptyNote>
          ))}
        {view === 'posts' && (
          <>
            {store.posts.map((item) => (
              <ListingRow key={item.id} listing={item} onPress={() => open(item.id)} />
            ))}
            <Block gap={0} align="center" mt={18}>
              <Button title="create a new post" variant="light" color={C.purple} startSection={<Icon name="plus" size={15} color={C.purple} />} onPress={() => store.goTab('post', true)} />
            </Block>
          </>
        )}
        {view === 'hidden' &&
          (hidden.length ? (
            hidden.map((item) => <ListingRow key={item.id} listing={item} onPress={() => open(item.id)} />)
          ) : (
            <EmptyNote icon="eye" title="No hidden posts">
              Posts you hide are kept out of your results.
            </EmptyNote>
          ))}
      </Block>
    </Screen>
  );
}
