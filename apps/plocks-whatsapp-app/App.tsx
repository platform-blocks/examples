import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Column, Flex, Icon, IconButton, Input, PlocksProvider, Row, Text, Title } from '@plocks/ui';

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
const STORAGE_KEY = 'plocks-whatsapp-app:chats';
const THEME = { colorScheme: 'light' as const };

type Tab = 'chats' | 'updates' | 'calls';
type Filter = 'all' | 'unread' | 'groups';
type Detail = { kind: 'chat' | 'status' | 'call'; id: string } | null;

function isSavedChats(value: unknown): value is Chat[] {
  return Array.isArray(value) && value.length === SEED_CHATS.length && value.every((chat) =>
    chat && typeof chat === 'object' && typeof chat.id === 'string' && typeof chat.name === 'string' &&
    typeof chat.initials === 'string' && typeof chat.color === 'string' &&
    typeof chat.unread === 'number' && Array.isArray(chat.messages) &&
    chat.messages.every((message: Message) => message && typeof message.id === 'string' &&
      typeof message.text === 'string' && typeof message.time === 'string' && typeof message.outgoing === 'boolean')
  );
}

function ChatAvatar({ chat, size = 'lg' }: { chat: Chat; size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' }) {
  return <Avatar size={size} fallback={chat.initials} bg={chat.color} textColor={COLORS.white}
    accessibilityLabel={`${chat.name} avatar`} />;
}

function NavTab({ icon, label, active, badge, onPress }: {
  icon: string; label: string; active: boolean; badge?: number; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }}
      accessibilityLabel={label} style={{ flex: 1, alignItems: 'center', paddingVertical: 11 }}>
      <Flex direction="row" align="center" gap={4}>
        <Icon name={icon} size={21} variant={active ? 'filled' : 'outlined'} color={active ? COLORS.darkGreen : COLORS.muted} />
        {!!badge && <Flex style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green }} />}
      </Flex>
      <Text c={active ? COLORS.darkGreen : COLORS.muted} fw={active ? 'bold' : 'medium'} size={11}>{label}</Text>
    </Pressable>
  );
}

function ChatRow({ chat, active, onPress }: { chat: Chat; active: boolean; onPress: () => void }) {
  const last = chat.messages[chat.messages.length - 1];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open chat with ${chat.name}`}
      style={{ backgroundColor: active ? '#F0F4F2' : COLORS.white, paddingHorizontal: 18, paddingVertical: 13 }}>
      <Row align="center" gap="md" fullWidth>
        <ChatAvatar chat={chat} size="lg" />
        <Column gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Row align="center" justify="space-between" fullWidth gap="sm">
            <Text c={COLORS.ink} fw="semibold" size={16} numberOfLines={1} style={{ flex: 1 }}>{chat.name}</Text>
            <Text c={chat.unread ? COLORS.green : COLORS.faint} size={11}>{last?.time ?? ''}</Text>
          </Row>
          <Row align="center" justify="space-between" fullWidth gap="sm">
            <Text c={COLORS.muted} size={13} numberOfLines={1} style={{ flex: 1 }}>
              {last?.outgoing ? 'You: ' : ''}{last?.text ?? 'Start a conversation'}
            </Text>
            {chat.unread > 0 && (
              <Flex align="center" justify="center" style={{ minWidth: 21, height: 21, paddingHorizontal: 5,
                borderRadius: 11, backgroundColor: COLORS.brightGreen }}>
                <Text c={COLORS.white} fw="bold" size={11}>{chat.unread}</Text>
              </Flex>
            )}
          </Row>
        </Column>
      </Row>
    </Pressable>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <Flex fullWidth justify={message.outgoing ? 'flex-end' : 'flex-start'}>
      <Column gap={3} style={{ maxWidth: '78%', minWidth: 96, paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 12, backgroundColor: message.outgoing ? COLORS.outgoing : COLORS.white,
        borderTopRightRadius: message.outgoing ? 3 : 12, borderTopLeftRadius: message.outgoing ? 12 : 3 }}>
        <Text c={COLORS.ink} size={14} style={{ lineHeight: 21 }}>{message.text}</Text>
        <Row align="center" justify="flex-end" gap={4} fullWidth>
          <Text c={COLORS.muted} size={10}>{message.time}</Text>
          {message.outgoing && <Text c="#53A8C1" size={11}>✓✓</Text>}
        </Row>
      </Column>
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

  const selected = detail ?? (desktop && tab === 'chats' && !newChat ? { kind: 'chat' as const, id: chats[0].id } : null);
  const activeChat = selected?.kind === 'chat' ? chats.find((chat) => chat.id === selected.id) : null;
  const unreadTotal = chats.reduce((total, chat) => total + chat.unread, 0);
  const shownChats = chats.filter((chat) => {
    const matches = `${chat.name} ${chat.messages[chat.messages.length - 1]?.text ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
    return matches && (filter === 'all' || (filter === 'unread' && chat.unread > 0) || (filter === 'groups' && chat.isGroup));
  });

  function openChat(id: string) {
    setChats((current) => current.map((chat) => chat.id === id ? { ...chat, unread: 0 } : chat));
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
      return [{ ...updated, unread: 0, messages: [...updated.messages, message] },
        ...current.filter((chat) => chat.id !== updated.id)];
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
          <Row align="center" gap="sm" style={{ paddingHorizontal: 18, paddingVertical: 18 }}>
            <IconButton icon="arrow-left" variant="ghost" iconColor={COLORS.ink}
              accessibilityLabel="Back to chats" onPress={() => setNewChat(false)} />
            <Title order={2} style={{ color: COLORS.ink, fontSize: 22 }}>New chat</Title>
          </Row>
          <Text c={COLORS.muted} size={12} fw="bold" style={{ paddingHorizontal: 20, paddingBottom: 10 }}>CONTACTS</Text>
          {chats.filter((chat) => !chat.isGroup).map((chat) => <ChatRow key={chat.id} chat={chat} active={false}
            onPress={() => openChat(chat.id)} />)}
        </>
      );
    }

    if (tab === 'updates') {
      return (
        <Column gap="md" style={{ padding: 18 }}>
          <Text c={COLORS.ink} fw="bold" size={18}>Status</Text>
          <Row align="center" gap="md" style={{ paddingVertical: 8 }}>
            <Flex align="center" justify="center" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#DDECE7' }}>
              <Icon name="plus" color={COLORS.green} size={23} />
            </Flex>
            <Column gap={2}>
              <Text c={COLORS.ink} fw="semibold">My status</Text>
              <Text c={COLORS.muted} size={12}>Share a moment with friends</Text>
            </Column>
          </Row>
          <Text c={COLORS.muted} fw="bold" size={12}>RECENT UPDATES</Text>
          {STATUSES.map((status) => {
            const chat = chats.find((item) => item.id === status.chatId)!;
            return (
              <Pressable key={status.id} onPress={() => setDetail({ kind: 'status', id: status.id })}
                accessibilityRole="button" accessibilityLabel={`View ${chat.name}'s status`}>
                <Row align="center" gap="md" style={{ paddingVertical: 9 }}>
                  <Flex style={{ padding: 3, borderWidth: 2, borderRadius: 32, borderColor: COLORS.green }}>
                    <ChatAvatar chat={chat} size="lg" />
                  </Flex>
                  <Column gap={2}>
                    <Text c={COLORS.ink} fw="semibold">{chat.name}</Text>
                    <Text c={COLORS.muted} size={12}>{status.time}</Text>
                  </Column>
                </Row>
              </Pressable>
            );
          })}
        </Column>
      );
    }

    if (tab === 'calls') {
      return (
        <Column gap="sm" style={{ padding: 18 }}>
          <Text c={COLORS.ink} fw="bold" size={18}>Recent calls</Text>
          <Text c={COLORS.muted} size={12} style={{ marginBottom: 8 }}>Keep the conversation going.</Text>
          {RECENT_CALLS.map((call) => {
            const chat = chats.find((item) => item.id === call.chatId)!;
            return (
              <Pressable key={call.id} onPress={() => setDetail({ kind: 'call', id: call.id })}
                accessibilityRole="button" accessibilityLabel={`View ${chat.name} call`}>
                <Row align="center" gap="md" style={{ paddingVertical: 11 }}>
                  <ChatAvatar chat={chat} size="lg" />
                  <Column gap={2} style={{ flex: 1 }}>
                    <Text c={call.missed ? '#C74747' : COLORS.ink} fw="semibold">{chat.name}</Text>
                    <Text c={COLORS.muted} size={12}>{call.missed ? 'Missed' : 'Outgoing'} · {call.time}</Text>
                  </Column>
                  <Icon name={call.type === 'video' ? 'camera' : 'phone'} size={19} color={COLORS.green} />
                </Row>
              </Pressable>
            );
          })}
        </Column>
      );
    }

    return (
      <>
        <Flex style={{ paddingHorizontal: 18, paddingTop: 15, paddingBottom: 10 }}>
          <Input value={query} onChangeText={setQuery} placeholder="Search or start a new chat"
            startSection={<Icon name="search" size={18} color={COLORS.muted} />}
            variant="filled" accessibilityLabel="Search chats" />
        </Flex>
        <Row gap="xs" style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          {(['all', 'unread', 'groups'] as const).map((item) => (
            <Button key={item} title={item[0].toUpperCase() + item.slice(1)} size="sm" radius="full"
              variant={filter === item ? 'filled' : 'light'} color={filter === item ? COLORS.green : undefined}
              textColor={filter === item ? COLORS.white : COLORS.darkGreen} onPress={() => setFilter(item)} />
          ))}
        </Row>
        {shownChats.length ? shownChats.map((chat) => <ChatRow key={chat.id} chat={chat}
          active={desktop && selected?.kind === 'chat' && selected.id === chat.id}
          onPress={() => openChat(chat.id)} />) : (
          <Column align="center" gap="xs" style={{ padding: 30 }}>
            <Icon name="search" size={26} color={COLORS.faint} />
            <Text c={COLORS.muted} ta="center">No chats found. Try another search or filter.</Text>
          </Column>
        )}
      </>
    );
  }

  function renderDetail() {
    if (selected?.kind === 'status') {
      const status = STATUSES.find((item) => item.id === selected.id)!;
      const chat = chats.find((item) => item.id === status.chatId)!;
      return (
        <Column style={{ flex: 1, backgroundColor: status.color }}>
          <Row align="center" gap="sm" style={{ padding: 16 }}>
            <IconButton icon="arrow-left" variant="ghost" iconColor={COLORS.ink}
              accessibilityLabel="Close status" onPress={() => setDetail(null)} />
            <ChatAvatar chat={chat} size="md" />
            <Column gap={0}>
              <Text c={COLORS.ink} fw="bold">{chat.name}</Text>
              <Text c={COLORS.ink} size={11}>{status.time}</Text>
            </Column>
          </Row>
          <Flex align="center" justify="center" style={{ flex: 1, padding: 32 }}>
            <Text c={COLORS.ink} fw="bold" size={30} ta="center" style={{ lineHeight: 42 }}>{status.caption}</Text>
          </Flex>
          <Button title={`Message ${chat.name}`} variant="filled" color={COLORS.darkGreen}
            style={{ margin: 24 }} onPress={() => { setTab('chats'); openChat(chat.id); }} />
        </Column>
      );
    }

    if (selected?.kind === 'call') {
      const call = RECENT_CALLS.find((item) => item.id === selected.id);
      const chat = chats.find((item) => item.id === (call?.chatId ?? selected.id.replace('new:', '')))!;
      return (
        <Column align="center" justify="center" gap="lg" style={{ flex: 1, backgroundColor: COLORS.chrome, padding: 24 }}>
          <ChatAvatar chat={chat} size="3xl" />
          <Title order={2} style={{ color: COLORS.ink }}>{chat.name}</Title>
          <Text c={COLORS.muted}>{call?.type === 'video' ? 'Video' : 'Voice'} call · {call?.time ?? 'Now'}</Text>
          <Text c={COLORS.muted} size={13} ta="center">Calls are a preview in this example app.</Text>
          <Row gap="sm">
            <Button title="Back to calls" variant="outline" color={COLORS.darkGreen} onPress={() => setDetail(null)} />
            <Button title="Open chat" variant="filled" color={COLORS.darkGreen}
              onPress={() => { setTab('chats'); openChat(chat.id); }} />
          </Row>
        </Column>
      );
    }

    if (!activeChat) {
      return (
        <Column align="center" justify="center" gap="md" style={{ flex: 1, backgroundColor: COLORS.chrome, padding: 36 }}>
          <Flex align="center" justify="center" style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: '#DDECE7' }}>
            <Icon name="chat" size={40} color={COLORS.green} />
          </Flex>
          <Title order={2} style={{ color: COLORS.ink }}>A good conversation starts here.</Title>
          <Text c={COLORS.muted} ta="center">Pick a chat to catch up with someone.</Text>
        </Column>
      );
    }

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: COLORS.chat }}>
        <Row align="center" gap="sm" style={{ paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: COLORS.chrome, borderBottomWidth: 1, borderBottomColor: COLORS.line }}>
          {!desktop && <IconButton icon="arrow-left" variant="ghost" iconColor={COLORS.ink}
            accessibilityLabel="Back to chats" onPress={() => setDetail(null)} />}
          <ChatAvatar chat={activeChat} size="md" />
          <Column gap={1} style={{ flex: 1, minWidth: 0 }}>
            <Text c={COLORS.ink} fw="bold" size={16} numberOfLines={1}>{activeChat.name}</Text>
            <Text c={COLORS.muted} size={11}>{activeChat.isGroup ? 'Group chat' : activeChat.online ? 'online' : 'tap here for contact info'}</Text>
          </Column>
          <IconButton icon="phone" variant="ghost" iconColor={COLORS.darkGreen}
            accessibilityLabel={`Voice call ${activeChat.name}`}
            onPress={() => setDetail({ kind: 'call', id: `new:${activeChat.id}` })} />
        </Row>
        <ScrollView ref={messageScroll} style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 22, paddingVertical: 24, gap: 11, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => messageScroll.current?.scrollToEnd({ animated: false })}>
          <Flex align="center" justify="center" style={{ alignSelf: 'center', backgroundColor: '#E2F3FA',
            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 8 }}>
            <Text c={COLORS.muted} size={11}>TODAY</Text>
          </Flex>
          {activeChat.messages.map((message) => <MessageBubble key={message.id} message={message} />)}
        </ScrollView>
        <Row align="center" gap="sm" style={{ paddingHorizontal: 14, paddingVertical: 12,
          backgroundColor: COLORS.chrome, borderTopWidth: 1, borderTopColor: COLORS.line }}>
          <Icon name="emoji" color={COLORS.muted} size={24} />
          <Flex style={{ flex: 1 }}>
            <Input value={draft} onChangeText={setDraft} onEnter={sendMessage} placeholder="Type a message"
              variant="filled" radius="full" accessibilityLabel="Type a message" />
          </Flex>
          <IconButton icon="arrow-right" variant="filled" color={COLORS.green} radius="full"
            accessibilityLabel="Send message" disabled={!draft.trim()} onPress={sendMessage} />
        </Row>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.chrome }}>
      <StatusBar barStyle="dark-content" />
      <Row align="stretch" style={{ flex: 1, width: '100%', maxWidth: 1440, alignSelf: 'center',
        backgroundColor: COLORS.white, borderLeftWidth: desktop ? 1 : 0, borderRightWidth: desktop ? 1 : 0,
        borderColor: COLORS.line }}>
        {(desktop || !detail) && (
          <Column align="stretch" gap={0} style={{ width: desktop ? 390 : '100%', flexShrink: 0,
            backgroundColor: COLORS.white, borderRightWidth: desktop ? 1 : 0, borderRightColor: COLORS.line }}>
            <Row align="center" justify="space-between" style={{ paddingHorizontal: 18, paddingVertical: 17,
              backgroundColor: COLORS.chrome }}>
              <Row align="center" gap="sm">
                <Flex align="center" justify="center" style={{ width: 31, height: 31, borderRadius: 11,
                  backgroundColor: COLORS.green }}>
                  <Icon name="chat" variant="filled" size={19} color={COLORS.white} />
                </Flex>
                <Text c={COLORS.darkGreen} fw="bold" size={22}>chatline</Text>
              </Row>
              <IconButton icon="edit" variant="ghost" iconColor={COLORS.ink}
                accessibilityLabel="New chat" onPress={() => { setTab('chats'); setNewChat(true); setDetail(null); }} />
            </Row>
            {!newChat && (
              <Row align="center" justify="space-between" style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 }}>
                <Text c={COLORS.ink} fw="bold" size={29} style={{ flexShrink: 1 }}>
                  {tab === 'chats' ? 'Chats' : tab === 'updates' ? 'Updates' : 'Calls'}
                </Text>
                {tab === 'chats' && <Text c={COLORS.green} fw="bold" size={12}>{unreadTotal ? `${unreadTotal} unread` : 'All caught up'}</Text>}
              </Row>
            )}
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              {renderSidebarContent()}
            </ScrollView>
            <Row align="center" style={{ borderTopWidth: 1, borderTopColor: COLORS.line,
              backgroundColor: COLORS.white }}>
              <NavTab icon="chat" label="Chats" active={tab === 'chats'} badge={unreadTotal}
                onPress={() => selectTab('chats')} />
              <NavTab icon="circle" label="Updates" active={tab === 'updates'} onPress={() => selectTab('updates')} />
              <NavTab icon="phone" label="Calls" active={tab === 'calls'} onPress={() => selectTab('calls')} />
            </Row>
          </Column>
        )}
        {(desktop || detail) && <Flex align="stretch" style={{ flex: 1, minWidth: 0 }}>{renderDetail()}</Flex>}
      </Row>
    </SafeAreaView>
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
