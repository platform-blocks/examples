import { useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, useWindowDimensions, type ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingArea,
  SafeArea,
  ScrollArea,
  Block,
  Avatar,
  Button,
  Column,
  Flex,
  Icon,
  IconButton,
  Input,
  PlocksProvider,
  Row,
  SegmentedControl,
  Tabs,
  Text,
  Title,
} from '@plocks/ui';

import { RECENT_CALLS, SEED_CHATS, STATUSES, timeNow, type Chat, type Message } from './data';

const COLORS = {
  green: '#00A884',
  darkGreen: '#075E54',
  brightGreen: '#25D366',
  ink: '#111B21',
  muted: '#667781',
  faint: '#8696A0',
  line: '#E9EDEF',
  chrome: '#F0F2F5',
  white: '#FFFFFF',
  chat: '#F1EEE8',
  outgoing: '#D9FDD3',
};
const STORAGE_KEY = 'plocks-chatline-app:chats';
const THEME = { colorScheme: 'light' as const };

type Tab = 'chats' | 'updates' | 'calls';
type Filter = 'all' | 'unread' | 'groups';
type Detail = { kind: 'chat' | 'status' | 'call'; id: string } | null;

function isSavedChats(value: unknown): value is Chat[] {
  return (
    Array.isArray(value) &&
    value.length === SEED_CHATS.length &&
    value.every(
      (chat) =>
        chat &&
        typeof chat === 'object' &&
        typeof chat.id === 'string' &&
        typeof chat.name === 'string' &&
        typeof chat.initials === 'string' &&
        typeof chat.color === 'string' &&
        typeof chat.unread === 'number' &&
        Array.isArray(chat.messages) &&
        chat.messages.every(
          (message: Message) =>
            message &&
            typeof message.id === 'string' &&
            typeof message.text === 'string' &&
            typeof message.time === 'string' &&
            typeof message.outgoing === 'boolean',
        ),
    )
  );
}

function ChatAvatar({ chat, size = 'lg' }: { chat: Chat; size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' }) {
  return (
    <Avatar
      size={size}
      fallback={chat.initials}
      bg={chat.color}
      textColor={COLORS.white}
      accessibilityLabel={`${chat.name} avatar`}
    />
  );
}

function ChatRow({ chat, active, onPress }: { chat: Chat; active: boolean; onPress: () => void }) {
  const last = chat.messages[chat.messages.length - 1];
  return (
    <Block
      gap={0}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${chat.name}`}
      bg={active ? '#F0F4F2' : COLORS.white}
      px={18}
      py={13}
    >
      <Row align="center" gap="md" fullWidth>
        <ChatAvatar chat={chat} size="lg" />
        <Block gap={4} direction="column" flex={1} miw={0}>
          <Row align="center" justify="space-between" fullWidth gap="sm">
            <Text c={COLORS.ink} fw="semibold" size={16} numberOfLines={1} flex={1}>
              {chat.name}
            </Text>
            <Text c={chat.unread ? COLORS.green : COLORS.faint} size={11}>
              {last?.time ?? ''}
            </Text>
          </Row>
          <Row align="center" justify="space-between" fullWidth gap="sm">
            <Text c={COLORS.muted} size={13} numberOfLines={1} flex={1}>
              {last?.outgoing ? 'You: ' : ''}
              {last?.text ?? 'Start a conversation'}
            </Text>
            {chat.unread > 0 && (
              <Block
                align="center"
                justify="center"
                direction="row"
                miw={21}
                h={21}
                px={5}
                radius={11}
                bg={COLORS.brightGreen}
              >
                <Text c={COLORS.white} fw="bold" size={11}>
                  {chat.unread}
                </Text>
              </Block>
            )}
          </Row>
        </Block>
      </Row>
    </Block>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <Flex fullWidth justify={message.outgoing ? 'flex-end' : 'flex-start'}>
      <Block
        gap={3}
        direction="column"
        maw="78%"
        miw={96}
        px={12}
        py={8}
        radius={12}
        bg={message.outgoing ? COLORS.outgoing : COLORS.white}
        borderTopRightRadius={message.outgoing ? 3 : 12}
        borderTopLeftRadius={message.outgoing ? 12 : 3}
      >
        <Text c={COLORS.ink} size={14} lh={21}>
          {message.text}
        </Text>
        <Row align="center" justify="flex-end" gap={4} fullWidth>
          <Text c={COLORS.muted} size={10}>
            {message.time}
          </Text>
          {message.outgoing && (
            <Text c="#53A8C1" size={11}>
              ✓✓
            </Text>
          )}
        </Row>
      </Block>
    </Flex>
  );
}

function ChatlineScreen() {
  const { width } = useWindowDimensions();
  const desktop = width >= 820;
  const messageScroll = useRef<ScrollView>(null);
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('chats');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [detail, setDetail] = useState<Detail>(null);
  const [newChat, setNewChat] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const parsed: unknown = JSON.parse(saved);
        if (isSavedChats(parsed)) setChats(parsed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats)).catch(() => {});
  }, [chats, ready]);

  const selected =
    detail ?? (desktop && tab === 'chats' && !newChat ? { kind: 'chat' as const, id: chats[0].id } : null);
  const activeChat = selected?.kind === 'chat' ? chats.find((chat) => chat.id === selected.id) : null;
  const unreadTotal = chats.reduce((total, chat) => total + chat.unread, 0);
  const shownChats = chats.filter((chat) => {
    const matches = `${chat.name} ${chat.messages[chat.messages.length - 1]?.text ?? ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    return (
      matches && (filter === 'all' || (filter === 'unread' && chat.unread > 0) || (filter === 'groups' && chat.isGroup))
    );
  });

  function openChat(id: string) {
    setChats((current) => current.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)));
    setDetail({ kind: 'chat', id });
    setNewChat(false);
    setDraft('');
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || !activeChat) return;
    const message: Message = { id: `local-${Date.now()}`, text, time: timeNow(), outgoing: true };
    setChats((current) => {
      const updated = current.find((chat) => chat.id === activeChat.id);
      if (!updated) return current;
      return [
        { ...updated, unread: 0, messages: [...updated.messages, message] },
        ...current.filter((chat) => chat.id !== updated.id),
      ];
    });
    setDetail({ kind: 'chat', id: activeChat.id });
    setDraft('');
  }

  function selectTab(next: Tab) {
    setTab(next);
    setDetail(null);
    setNewChat(false);
    setQuery('');
  }

  function renderSidebarContent() {
    if (newChat) {
      return (
        <>
          <Block align="center" gap="sm" direction="row" px={18} py={18}>
            <IconButton
              icon="arrow-left"
              variant="ghost"
              iconColor={COLORS.ink}
              accessibilityLabel="Back to chats"
              onPress={() => setNewChat(false)}
            />
            <Title order={2} c={COLORS.ink} size={22}>
              New chat
            </Title>
          </Block>
          <Text c={COLORS.muted} size={12} fw="bold" px={20} pb={10}>
            CONTACTS
          </Text>
          {chats
            .filter((chat) => !chat.isGroup)
            .map((chat) => (
              <ChatRow key={chat.id} chat={chat} active={false} onPress={() => openChat(chat.id)} />
            ))}
        </>
      );
    }

    if (tab === 'updates') {
      return (
        <Block gap="md" direction="column" p={18}>
          <Text c={COLORS.ink} fw="bold" size={18}>
            Status
          </Text>
          <Block align="center" gap="md" direction="row" py={8}>
            <Block align="center" justify="center" direction="row" w={48} h={48} radius={24} bg="#DDECE7">
              <Icon name="plus" color={COLORS.green} size={23} />
            </Block>
            <Column gap={2}>
              <Text c={COLORS.ink} fw="semibold">
                My status
              </Text>
              <Text c={COLORS.muted} size={12}>
                Share a moment with friends
              </Text>
            </Column>
          </Block>
          <Text c={COLORS.muted} fw="bold" size={12}>
            RECENT UPDATES
          </Text>
          {STATUSES.map((status) => {
            const chat = chats.find((item) => item.id === status.chatId)!;
            return (
              <Block
                gap={0}
                key={status.id}
                onPress={() => setDetail({ kind: 'status', id: status.id })}
                accessibilityRole="button"
                accessibilityLabel={`View ${chat.name}'s status`}
              >
                <Block align="center" gap="md" direction="row" py={9}>
                  <Block direction="row" p={3} borderWidth={2} radius={32} borderColor={COLORS.green}>
                    <ChatAvatar chat={chat} size="lg" />
                  </Block>
                  <Column gap={2}>
                    <Text c={COLORS.ink} fw="semibold">
                      {chat.name}
                    </Text>
                    <Text c={COLORS.muted} size={12}>
                      {status.time}
                    </Text>
                  </Column>
                </Block>
              </Block>
            );
          })}
        </Block>
      );
    }

    if (tab === 'calls') {
      return (
        <Block gap="sm" direction="column" p={18}>
          <Text c={COLORS.ink} fw="bold" size={18}>
            Recent calls
          </Text>
          <Text c={COLORS.muted} size={12} mb={8}>
            Keep the conversation going.
          </Text>
          {RECENT_CALLS.map((call) => {
            const chat = chats.find((item) => item.id === call.chatId)!;
            return (
              <Block
                gap={0}
                key={call.id}
                onPress={() => setDetail({ kind: 'call', id: call.id })}
                accessibilityRole="button"
                accessibilityLabel={`View ${chat.name} call`}
              >
                <Block align="center" gap="md" direction="row" py={11}>
                  <ChatAvatar chat={chat} size="lg" />
                  <Block gap={2} direction="column" flex={1}>
                    <Text c={call.missed ? '#C74747' : COLORS.ink} fw="semibold">
                      {chat.name}
                    </Text>
                    <Text c={COLORS.muted} size={12}>
                      {call.missed ? 'Missed' : 'Outgoing'} · {call.time}
                    </Text>
                  </Block>
                  <Icon name={call.type === 'video' ? 'camera' : 'phone'} size={19} color={COLORS.green} />
                </Block>
              </Block>
            );
          })}
        </Block>
      );
    }

    return (
      <>
        <Block direction="row" px={18} pt={15} pb={10}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search or start a new chat"
            startSection={<Icon name="search" size={18} color={COLORS.muted} />}
            variant="filled"
            accessibilityLabel="Search chats"
          />
        </Block>
        <SegmentedControl
          data={['all', 'unread', 'groups'].map((item) => ({
            value: item,
            label: item[0].toUpperCase() + item.slice(1),
          }))}
          value={filter}
          onChange={(item) => setFilter(item as Filter)}
          color={COLORS.green}
          size="sm"
          mx={18}
          mb={10}
          accessibilityLabel="Filter chats"
        />
        {shownChats.length ? (
          shownChats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              active={desktop && selected?.kind === 'chat' && selected.id === chat.id}
              onPress={() => openChat(chat.id)}
            />
          ))
        ) : (
          <Block align="center" gap="xs" direction="column" p={30}>
            <Icon name="search" size={26} color={COLORS.faint} />
            <Text c={COLORS.muted} ta="center">
              No chats found. Try another search or filter.
            </Text>
          </Block>
        )}
      </>
    );
  }

  function renderDetail() {
    if (selected?.kind === 'status') {
      const status = STATUSES.find((item) => item.id === selected.id)!;
      const chat = chats.find((item) => item.id === status.chatId)!;
      return (
        <Block direction="column" flex={1} bg={status.color}>
          <Block align="center" gap="sm" direction="row" p={16}>
            <IconButton
              icon="arrow-left"
              variant="ghost"
              iconColor={COLORS.ink}
              accessibilityLabel="Close status"
              onPress={() => setDetail(null)}
            />
            <ChatAvatar chat={chat} size="md" />
            <Column gap={0}>
              <Text c={COLORS.ink} fw="bold">
                {chat.name}
              </Text>
              <Text c={COLORS.ink} size={11}>
                {status.time}
              </Text>
            </Column>
          </Block>
          <Block align="center" justify="center" direction="row" flex={1} p={32}>
            <Text c={COLORS.ink} fw="bold" size={30} ta="center" lh={42}>
              {status.caption}
            </Text>
          </Block>
          <Button
            title={`Message ${chat.name}`}
            variant="filled"
            color={COLORS.darkGreen}
            m={24}
            onPress={() => {
              setTab('chats');
              openChat(chat.id);
            }}
          />
        </Block>
      );
    }

    if (selected?.kind === 'call') {
      const call = RECENT_CALLS.find((item) => item.id === selected.id);
      const chat = chats.find((item) => item.id === (call?.chatId ?? selected.id.replace('new:', '')))!;
      return (
        <Block align="center" justify="center" gap="lg" direction="column" flex={1} bg={COLORS.chrome} p={24}>
          <ChatAvatar chat={chat} size="3xl" />
          <Title order={2} c={COLORS.ink}>
            {chat.name}
          </Title>
          <Text c={COLORS.muted}>
            {call?.type === 'video' ? 'Video' : 'Voice'} call · {call?.time ?? 'Now'}
          </Text>
          <Text c={COLORS.muted} size={13} ta="center">
            Calls are a preview in this example app.
          </Text>
          <Row gap="sm">
            <Button title="Back to calls" variant="outline" color={COLORS.darkGreen} onPress={() => setDetail(null)} />
            <Button
              title="Open chat"
              variant="filled"
              color={COLORS.darkGreen}
              onPress={() => {
                setTab('chats');
                openChat(chat.id);
              }}
            />
          </Row>
        </Block>
      );
    }

    if (!activeChat) {
      return (
        <Block align="center" justify="center" gap="md" direction="column" flex={1} bg={COLORS.chrome} p={36}>
          <Block align="center" justify="center" direction="row" w={86} h={86} radius={43} bg="#DDECE7">
            <Icon name="chat" size={40} color={COLORS.green} />
          </Block>
          <Title order={2} c={COLORS.ink}>
            A good conversation starts here.
          </Title>
          <Text c={COLORS.muted} ta="center">
            Pick a chat to catch up with someone.
          </Text>
        </Block>
      );
    }

    return (
      <KeyboardAvoidingArea behavior={Platform.OS === 'ios' ? 'padding' : undefined} flex={1} bg={COLORS.chat} gap={0}>
        <Block
          align="center"
          gap="sm"
          direction="row"
          px={16}
          py={12}
          bg={COLORS.chrome}
          borderBottomWidth={1}
          borderBottomColor={COLORS.line}
        >
          {!desktop && (
            <IconButton
              icon="arrow-left"
              variant="ghost"
              iconColor={COLORS.ink}
              accessibilityLabel="Back to chats"
              onPress={() => setDetail(null)}
            />
          )}
          <ChatAvatar chat={activeChat} size="md" />
          <Block gap={1} direction="column" flex={1} miw={0}>
            <Text c={COLORS.ink} fw="bold" size={16} numberOfLines={1}>
              {activeChat.name}
            </Text>
            <Text c={COLORS.muted} size={11}>
              {activeChat.isGroup ? 'Group chat' : activeChat.online ? 'online' : 'tap here for contact info'}
            </Text>
          </Block>
          <IconButton
            icon="phone"
            variant="ghost"
            iconColor={COLORS.darkGreen}
            accessibilityLabel={`Voice call ${activeChat.name}`}
            onPress={() => setDetail({ kind: 'call', id: `new:${activeChat.id}` })}
          />
        </Block>
        <ScrollArea
          ref={messageScroll}
          flex={1}
          contentProps={{ px: 22, py: 24, gap: 11, grow: 1, justify: 'flex-end' }}
          onContentSizeChange={() => messageScroll.current?.scrollToEnd({ animated: false })}
        >
          <Block
            align="center"
            justify="center"
            direction="row"
            alignSelf="center"
            bg="#E2F3FA"
            px={12}
            py={5}
            radius={8}
            mb={8}
          >
            <Text c={COLORS.muted} size={11}>
              TODAY
            </Text>
          </Block>
          {activeChat.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ScrollArea>
        <Block
          align="center"
          gap="sm"
          direction="row"
          px={14}
          py={12}
          bg={COLORS.chrome}
          borderTopWidth={1}
          borderTopColor={COLORS.line}
        >
          <Icon name="emoji" color={COLORS.muted} size={24} />
          <Block direction="row" flex={1}>
            <Input
              value={draft}
              onChangeText={setDraft}
              onEnter={sendMessage}
              placeholder="Type a message"
              variant="filled"
              radius="full"
              accessibilityLabel="Type a message"
            />
          </Block>
          <IconButton
            icon="arrow-right"
            variant="filled"
            color={COLORS.green}
            radius="full"
            accessibilityLabel="Send message"
            disabled={!draft.trim()}
            onPress={sendMessage}
          />
        </Block>
      </KeyboardAvoidingArea>
    );
  }

  return (
    <SafeArea gap={0} flex={1} bg={COLORS.chrome}>
      <StatusBar barStyle="dark-content" />
      <Block
        align="stretch"
        direction="row"
        flex={1}
        w="100%"
        maw={1440}
        alignSelf="center"
        bg={COLORS.white}
        borderLeftWidth={desktop ? 1 : 0}
        borderRightWidth={desktop ? 1 : 0}
        borderColor={COLORS.line}
      >
        {(desktop || !detail) && (
          <Block
            align="stretch"
            gap={0}
            direction="column"
            w={desktop ? 390 : '100%'}
            shrink={0}
            bg={COLORS.white}
            borderRightWidth={desktop ? 1 : 0}
            borderRightColor={COLORS.line}
          >
            <Block align="center" justify="space-between" direction="row" px={18} py={17} bg={COLORS.chrome}>
              <Row align="center" gap="sm">
                <Block align="center" justify="center" direction="row" w={31} h={31} radius={11} bg={COLORS.green}>
                  <Icon name="chat" variant="filled" size={19} color={COLORS.white} />
                </Block>
                <Text c={COLORS.darkGreen} fw="bold" size={22}>
                  chatline
                </Text>
              </Row>
              <IconButton
                icon="edit"
                variant="ghost"
                iconColor={COLORS.ink}
                accessibilityLabel="New chat"
                onPress={() => {
                  setTab('chats');
                  setNewChat(true);
                  setDetail(null);
                }}
              />
            </Block>
            {!newChat && (
              <Block align="center" justify="space-between" direction="row" px={18} pt={16} pb={8}>
                <Text c={COLORS.ink} fw="bold" size={29} shrink={1}>
                  {tab === 'chats' ? 'Chats' : tab === 'updates' ? 'Updates' : 'Calls'}
                </Text>
                {tab === 'chats' && (
                  <Text c={COLORS.green} fw="bold" size={12}>
                    {unreadTotal ? `${unreadTotal} unread` : 'All caught up'}
                  </Text>
                )}
              </Block>
            )}
            <ScrollArea flex={1} keyboardShouldPersistTaps="handled">
              {renderSidebarContent()}
            </ScrollArea>
            <Tabs
              navigationOnly
              value={tab}
              onChange={(item) => selectTab(item as Tab)}
              color={COLORS.darkGreen}
              tabStyle={{ flex: 1 }}
              items={([
                ['chats', 'Chats', 'chat'],
                ['updates', 'Updates', 'circle'],
                ['calls', 'Calls', 'phone'],
              ] as const).map(([key, label, icon]) => ({
                key,
                label,
                subLabel: key === 'chats' && unreadTotal ? String(unreadTotal) : undefined,
                icon: <Icon name={icon} size={20} color={tab === key ? COLORS.darkGreen : COLORS.muted} />,
                content: null,
              }))}
            />
          </Block>
        )}
        {(desktop || detail) && (
          <Block align="stretch" direction="row" flex={1} miw={0}>
            {renderDetail()}
          </Block>
        )}
      </Block>
    </SafeArea>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={THEME}>
        <ChatlineScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
