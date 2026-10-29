import { useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { Avatar, Badge, Block, Icon, IconButton, Input, ScrollArea, SegmentedControl, Text } from '@plocks/ui-snack';
import { C } from '../theme';
import { clockText, dateText, priceText, type Thread } from '../data';
import { useStore } from '../store';
import { EmptyNote, Thumb, TopBar, useWide } from '../components';

const AVATAR_COLORS = ['#5B2A8C', '#1F6B45', '#8A5A00', '#2F5D8C', '#A3283B', '#4C5A67'];
const avatarColor = (name: string) => AVATAR_COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

function ThreadRow({ thread, active, onPress }: { thread: Thread; active?: boolean; onPress: () => void }) {
  const store = useStore();
  const listing = store.listingById(thread.listingId);
  const last = thread.messages[thread.messages.length - 1];
  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${thread.name}${thread.unread ? `, ${thread.unread} unread` : ''}`}
      direction="row"
      gap={12}
      py={11}
      px={12}
      bg={active ? C.tint : thread.unread ? C.paler : C.white}
      borderBottomWidth={1}
      borderBottomColor={C.line}
      pressedStyle={{ opacity: 0.7 }}
    >
      <Block gap={0} position="relative">
        {listing ? <Thumb listing={listing} w={52} h={52} /> : <Block gap={0} w={52} h={52} radius={4} bg={C.pale} />}
        <Block gap={0} position="absolute" right={-6} bottom={-6}>
          <Avatar size={24} bg={avatarColor(thread.name)} textColor={C.white} fallback={initials(thread.name)} accessibilityLabel={thread.name} />
        </Block>
      </Block>
      <Block flex={1} miw={0} gap={2}>
        <Block gap={6} direction="row" align="center">
          <Text c={C.ink} fw={thread.unread ? 'bold' : 'semibold'} size={14} numberOfLines={1} flex={1}>
            {thread.name}
          </Text>
          <Text c={thread.unread ? C.purple : C.faint} size={11} fw={thread.unread ? 'bold' : 'normal'}>
            {last ? clockText(last.at) : ''}
          </Text>
        </Block>
        <Text c={C.link} size={12} numberOfLines={1}>
          {listing?.title ?? 'deleted post'}
        </Text>
        <Block gap={6} direction="row" align="center">
          <Text c={thread.unread ? C.ink : C.muted} size={13} numberOfLines={1} flex={1}>
            {last?.from === 'me' ? 'You: ' : ''}
            {last?.text}
          </Text>
          {thread.unread > 0 && (
            <Badge size="xs" variant="filled" color={C.purple}>
              {thread.unread}
            </Badge>
          )}
        </Block>
      </Block>
    </Block>
  );
}

export function ThreadView({ id, embedded }: { id: string; embedded?: boolean }) {
  const store = useStore();
  const thread = store.threads.find((item) => item.id === id);
  const listing = thread ? store.listingById(thread.listingId) : undefined;
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);
  const count = thread?.messages.length ?? 0;
  const unread = thread?.unread ?? 0;
  const { markRead } = store;

  useEffect(() => {
    if (unread) markRead(id);
  }, [id, unread, markRead]);
  useEffect(() => {
    const timer = setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 30);
    return () => clearTimeout(timer);
  }, [count, id]);

  if (!thread) return <EmptyNote icon="message" title="Conversation not found" />;
  const send = () => {
    if (!text.trim()) return;
    store.send(thread.id, text.trim());
    setText('');
  };

  return (
    <Block gap={0} flex={1} bg={C.white}>
      <TopBar
        onBack={!embedded && store.canGoBack ? store.back : undefined}
        title={thread.name}
        subtitle={thread.role === 'selling' ? 'interested in your post' : 'seller'}
      />
      {listing && (
        <Block
          onPress={() => store.push({ name: 'listing', id: listing.id })}
          accessibilityRole="button"
          accessibilityLabel={`Open ${listing.title}`}
          direction="row"
          align="center"
          gap={10}
          px={14}
          py={8}
          bg={C.paler}
          borderBottomWidth={1}
          borderBottomColor={C.line}
          pressedStyle={{ opacity: 0.7 }}
        >
          <Thumb listing={listing} w={40} h={40} />
          <Block flex={1} miw={0} gap={0}>
            <Text c={C.link} fw="semibold" size={13} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text c={C.muted} size={12}>
              {priceText(listing) || listing.attrs[0]?.value} · {listing.hood}
            </Text>
          </Block>
          <Badge size="xs" variant="light" color={thread.role === 'selling' ? C.green : C.purple}>
            {thread.role}
          </Badge>
          <Icon name="chevron-right" color={C.faint} size={16} />
        </Block>
      )}
      <ScrollArea ref={scroll} flex={1} bg={C.white} contentProps={{ p: 14, gap: 6 }}>
        {thread.messages.map((message, index) => {
          const mine = message.from === 'me';
          const prev = thread.messages[index - 1];
          const gap = !prev || message.at - prev.at > 45 * 60_000;
          return (
            <Block key={message.id} gap={4}>
              {gap && (
                <Text c={C.faint} size={11} ta="center" mt={index ? 10 : 0} mb={2}>
                  {dateText(message.at)}
                </Text>
              )}
              <Block gap={0} direction="row" justify={mine ? 'flex-end' : 'flex-start'}>
                <Block
                  gap={0}
                  maw="78%"
                  px={12}
                  py={8}
                  radius={14}
                  bg={mine ? C.bubbleMe : C.bubbleThem}
                  borderTopRightRadius={mine ? 4 : 14}
                  borderTopLeftRadius={mine ? 14 : 4}
                >
                  <Text c={mine ? C.white : C.ink} size={14} lh={20}>
                    {message.text}
                  </Text>
                </Block>
              </Block>
            </Block>
          );
        })}
      </ScrollArea>
      <Block gap={8} direction="row" align="center" p={10} borderTopWidth={1} borderTopColor={C.line} bg={C.white}>
        <Input
          variant="outline"
          value={text}
          onChangeText={setText}
          onEnter={send}
          placeholder={`Message ${thread.name}`}
          mb={0}
          flex={1}
          radius={20}
          inputColor={C.ink}
          accessibilityLabel="Message"
        />
        <IconButton icon="send" variant="filled" color={C.purple} iconColor={C.white} accessibilityLabel="Send" disabled={!text.trim()} onPress={send} />
      </Block>
    </Block>
  );
}

export function Messages({ openId }: { openId?: string }) {
  const store = useStore();
  const wide = useWide();
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');
  const [selected, setSelected] = useState<string | undefined>(openId ?? (wide ? store.threads[0]?.id : undefined));
  const threads = [...store.threads]
    .filter((item) => filter === 'all' || item.role === filter)
    .sort((a, b) => (b.messages[b.messages.length - 1]?.at ?? 0) - (a.messages[a.messages.length - 1]?.at ?? 0));

  if (!wide && openId) return <ThreadView id={openId} />;

  const list = (
    <Block gap={0} flex={1} bg={C.white}>
      <TopBar
        title="messages"
        subtitle={store.unread ? `${store.unread} unread` : `${store.threads.length} conversations`}
      />
      <Block gap={0} p={10} borderBottomWidth={1} borderBottomColor={C.line}>
        <SegmentedControl
          fullWidth
          size="sm"
          color={C.purple}
          value={filter}
          onChange={(value) => setFilter(value as typeof filter)}
          data={[
            { value: 'all', label: 'all' },
            { value: 'buying', label: 'buying' },
            { value: 'selling', label: 'selling' },
          ]}
          accessibilityLabel="Filter conversations"
        />
      </Block>
      <ScrollArea flex={1}>
        {threads.length === 0 ? (
          <EmptyNote icon="message" title="No conversations">
            Reply to a post to start one.
          </EmptyNote>
        ) : (
          threads.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              active={wide && selected === thread.id}
              onPress={() => (wide ? setSelected(thread.id) : store.push({ name: 'thread', id: thread.id }))}
            />
          ))
        )}
        <Block gap={4} direction="row" align="center" justify="center" p={16}>
          <Icon name="lock" color={C.faint} size={12} />
          <Text c={C.faint} size={11}>
            replies go through an anonymous relay
          </Text>
        </Block>
      </ScrollArea>
    </Block>
  );
  if (!wide) return list;
  return (
    <Block gap={0} flex={1} direction="row">
      <Block gap={0} w={360} borderRightWidth={1} borderRightColor={C.line}>
        {list}
      </Block>
      <Block gap={0} flex={1}>
        {selected ? <ThreadView key={selected} id={selected} embedded /> : <EmptyNote icon="message" title="Pick a conversation" />}
      </Block>
    </Block>
  );
}
