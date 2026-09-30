import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingArea,
  TextArea,
  Input,
  SafeArea,
  ScrollArea,
  AppShell,
  Block,
  Icon,
  IconButton,
  PlocksProvider,
  Text,
  useAppShellApi,
} from '@plocks/ui-snack';

function NavbarControls({ children }: { children: (actions: ReturnType<typeof useAppShellApi>) => ReactNode }) {
  return <>{children(useAppShellApi())}</>;
}

const C = {
  bg: '#FFFFFF',
  sidebar: '#F8F7F5',
  ink: '#262626',
  muted: '#777674',
  line: '#E7E6E3',
  accent: '#2A6B59',
  pale: '#EAF3EE',
  white: '#FFF',
};
type Message = { id: string; role: 'user' | 'assistant'; text: string };
type Chat = { id: string; title: string; messages: Message[] };
const STORAGE = 'plocks-mosaic-chat-example:v1';
const SUGGESTIONS = [
  {
    title: 'Plan a calm weekend',
    subtitle: 'with room to recharge',
    prompt: 'Plan a calm weekend with room to recharge',
  },
  {
    title: 'Brainstorm a name',
    subtitle: 'for a neighborhood café',
    prompt: 'Brainstorm a name for a neighborhood café',
  },
  {
    title: 'Write a friendly email',
    subtitle: 'to reschedule a meeting',
    prompt: 'Write a friendly email to reschedule a meeting',
  },
  { title: 'Explain a concept', subtitle: 'like I am new to it', prompt: 'Explain how a rainbow forms' },
];
function demoReply(prompt: string) {
  const input = prompt.toLowerCase();
  if (input.includes('weekend') || input.includes('plan'))
    return 'Here is a gentle weekend plan:\n\nSaturday morning: take a slow walk and get a favorite drink.\nSaturday afternoon: spend one focused hour on something creative, then leave the rest open.\nSunday: make an easy meal, call someone you miss, and prepare one small thing for Monday.\n\nKeep the plan light enough to change when you feel like it.';
  if (input.includes('name') || input.includes('brainstorm') || input.includes('idea'))
    return 'A few starting ideas:\n\n• Corner & Co.\n• Little Window\n• Daybreak House\n• Common Ground\n• The Warm Cup\n\nTell me the mood and neighborhood, and I can make the list more specific.';
  if (input.includes('email') || input.includes('write'))
    return 'Subject: Could we find another time?\n\nHi there,\n\nI hope you are doing well. Something has come up, and I need to reschedule our meeting. Would you be available later this week? I am happy to work around your schedule.\n\nThanks for understanding,\n[Your name]';
  if (input.includes('rainbow') || input.includes('explain'))
    return 'A rainbow appears when sunlight passes through raindrops. The light bends as it enters, reflects inside the drop, then bends again as it leaves. Different colors bend by different amounts, so the white light spreads into a colorful arc.\n\nThe sun is usually behind you and the rain is in front of you when you see one.';
  if (input.includes('hello') || input.includes('hi'))
    return 'Hello! I am a scripted local demo of a chat interface. Try asking me for a weekend plan, a café name, a friendly email, or a simple explanation.';
  return 'I am a local demo, so my replies come from a small set of scripted examples. I can show how this chat UI handles messages and history. Try asking for a weekend plan, a café name, a friendly email, or an explanation of a rainbow.';
}

function MosaicChatScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingChat, setLoadingChat] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useRef<ScrollView>(null);
  const active = chats.find((chat) => chat.id === activeId);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as Chat[];
        if (Array.isArray(data)) setChats(data);
      })
      .catch(() => {})
      .finally(() => setReady(true));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(chats)).catch(() => {});
  }, [chats, ready]);
  function newChat() {
    setActiveId(null);
    setDraft('');
  }
  function sendPrompt(value = draft) {
    const text = value.trim();
    if (!text || loadingChat) return;
    const id = activeId ?? `chat-${Date.now()}`;
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text };
    setChats((old) => {
      const existing = old.find((chat) => chat.id === id);
      if (existing)
        return old.map((chat) => (chat.id === id ? { ...chat, messages: [...chat.messages, userMessage] } : chat));
      return [{ id, title: text.slice(0, 34) + (text.length > 34 ? '…' : ''), messages: [userMessage] }, ...old];
    });
    setActiveId(id);
    setDraft('');
    setLoadingChat(id);
    timer.current = setTimeout(() => {
      const reply: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: demoReply(text) };
      setChats((old) => old.map((chat) => (chat.id === id ? { ...chat, messages: [...chat.messages, reply] } : chat)));
      setLoadingChat(null);
    }, 650);
  }
  const sidebar = (closeNavbar: () => void) => (
    <Block gap={0} flex={1} bg={C.sidebar} p={13}>
      <Block
        onPress={() => {
          newChat();
          closeNavbar();
        }}
        accessibilityRole="button"
        accessibilityLabel="New chat"
        direction="row"
        align="center"
        gap={9}
        p={11}
        radius={10}
        bg={C.white}
        borderWidth={1}
        borderColor={C.line}
      >
        <Icon name="edit" color={C.ink} size={18} />
        <Text c={C.ink} fw="semibold" size={13}>
          New chat
        </Text>
      </Block>
      <Block direction="row" align="center" gap={6} px={10} mt={18} mb={10} bg="#EEEDEB" radius={8}>
        <Icon name="search" color={C.muted} size={16} />
        <Input
          variant="unstyled"
          value={search}
          onChangeText={setSearch}
          placeholder="Search chats"
          mb={0}
          flex={1}
          inputColor={C.ink}
          inputFontSize={12}
        />
      </Block>
      <Text c={C.muted} fw="bold" size={11} ml={9} mb={8}>
        RECENT
      </Text>
      <ScrollArea flex={1}>
        {chats
          .filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase()))
          .map((chat) => (
            <Block
              key={chat.id}
              onPress={() => {
                setActiveId(chat.id);
                closeNavbar();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${chat.title}`}
              direction="row"
              align="center"
              gap={8}
              radius={9}
              p={10}
              bg={activeId === chat.id ? '#EAE9E6' : 'transparent'}
            >
              <Icon name="message" color={C.muted} size={15} />
              <Text c={C.ink} size={12} numberOfLines={1} flex={1}>
                {chat.title}
              </Text>
              <Block
                gap={0}
                onPress={(event) => {
                  event.stopPropagation();
                  setChats((old) => old.filter((item) => item.id !== chat.id));
                  if (activeId === chat.id) setActiveId(null);
                }}
                accessibilityLabel={`Delete ${chat.title}`}
              >
                <Icon name="trash" color={C.muted} size={15} />
              </Block>
            </Block>
          ))}
      </ScrollArea>
      <Block borderTopWidth={1} borderTopColor={C.line} p={11} gap={4}>
        <Text c={C.ink} fw="semibold" size={12}>
          Mosaic Chat demo
        </Text>
        <Text c={C.muted} size={10}>
          Scripted replies · saved on device
        </Text>
      </Block>
    </Block>
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.bg}>
      <StatusBar barStyle="dark-content" />
      <AppShell
        withSafeArea={false}
        withBorder={false}
        navbar={{ width: 255, breakpoint: 'md', expandOnHover: false }}
      >
        <AppShell.Navbar accessibilityLabel="Chats" withBorder={false}>
          <NavbarControls>{({ closeNavbar }) => sidebar(closeNavbar)}</NavbarControls>
        </AppShell.Navbar>
        <AppShell.Main centerContent={false}>
          <KeyboardAvoidingArea behavior={Platform.OS === 'ios' ? 'padding' : undefined} flex={1} gap={0}>
            <Block
              h={58}
              borderBottomWidth={1}
              borderBottomColor={C.line}
              direction="row"
              align="center"
              gap={10}
              px={14}
            >
              {!wide && (
                <NavbarControls>
                  {({ openNavbar }) => (
                    <IconButton icon="menu" variant="ghost" iconColor={C.ink} accessibilityLabel="Show chats" onPress={openNavbar} />
                  )}
                </NavbarControls>
              )}
              <Block gap={0} w={30} h={30} radius={10} bg={C.accent} align="center" justify="center">
                <Text c={C.white} fw="bold" size={18}>
                  ✦
                </Text>
              </Block>
              <Text c={C.ink} fw="bold" size={17} numberOfLines={1} flex={1}>
                {active?.title ?? 'Mosaic Chat'}
              </Text>
              <Text c={C.muted} size={11}>
                Demo mode
              </Text>
              {!wide && (
                <IconButton
                  icon="edit"
                  variant="ghost"
                  iconColor={C.ink}
                  accessibilityLabel="New chat"
                  onPress={newChat}
                />
              )}
            </Block>
            {active ? (
              <ScrollArea
                ref={scroll}
                flex={1}
                contentProps={{ p: wide ? 26 : 16, pb: 30 }}
                onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
              >
                <Block w="100%" maw={760} alignSelf="center" gap={22}>
                  {active.messages.map((message) => (
                    <Block
                      key={message.id}
                      direction="row"
                      gap={12}
                      alignSelf={message.role === 'user' ? 'flex-end' : 'stretch'}
                      maw={message.role === 'user' ? '84%' : '100%'}
                    >
                      {message.role === 'assistant' && (
                        <Block gap={0} w={28} h={28} radius={10} bg={C.accent} align="center" justify="center">
                          <Text c={C.white} fw="bold" size={16}>
                            ✦
                          </Text>
                        </Block>
                      )}
                      <Block
                        gap={0}
                        flex={1}
                        bg={message.role === 'user' ? '#F2F2F0' : C.white}
                        p={message.role === 'user' ? 13 : 0}
                        radius={18}
                      >
                        <Text c={C.ink} size={14} lh={23}>
                          {message.text}
                        </Text>
                      </Block>
                    </Block>
                  ))}
                  {loadingChat === active.id && (
                    <Block direction="row" align="center" gap={10}>
                      <Block gap={0} w={28} h={28} radius={10} bg={C.accent} align="center" justify="center">
                        <Text c={C.white}>✦</Text>
                      </Block>
                      <Text c={C.muted} size={13}>
                        Thinking through a demo reply…
                      </Text>
                    </Block>
                  )}
                </Block>
              </ScrollArea>
            ) : (
              <Block gap={0} flex={1} align="center" justify="center" p={20}>
                <Block gap={0} w="100%" maw={670} align="center">
                  <Block gap={0} w={51} h={51} radius={17} bg={C.accent} align="center" justify="center">
                    <Text c={C.white} fw="bold" size={27}>
                      ✦
                    </Text>
                  </Block>
                  <Text c={C.ink} fw="bold" size={wide ? 31 : 26} mt={17}>
                    What can we explore?
                  </Text>
                  <Text c={C.muted} ta="center" size={13} mt={8}>
                    This is a local scripted chat demo. Pick a prompt to try it.
                  </Text>
                  <Block direction="row" wrap="wrap" gap={9} mt={35} w="100%">
                    {SUGGESTIONS.map((item) => (
                      <Block
                        key={item.title}
                        onPress={() => sendPrompt(item.prompt)}
                        w="48%"
                        mih={80}
                        borderWidth={1}
                        borderColor={C.line}
                        radius={12}
                        p={12}
                        justify="center"
                        gap={4}
                      >
                        <Text c={C.ink} fw="semibold" size={12}>
                          {item.title}
                        </Text>
                        <Text c={C.muted} size={11}>
                          {item.subtitle}
                        </Text>
                      </Block>
                    ))}
                  </Block>
                </Block>
              </Block>
            )}
            <Block gap={0} px={wide ? 28 : 12} pb={12} pt={9} align="center">
              <Block
                gap={0}
                w="100%"
                maw={760}
                borderWidth={1}
                borderColor={C.line}
                radius={20}
                direction="row"
                align="flex-end"
                p={10}
                bg={C.white}
              >
                <Block gap={0} flex={1} miw={0}>
                  <TextArea
                    variant="outline"
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Message Mosaic Chat"
                    placeholderTextColor={C.muted}
                    mb={0}
                    mah={110}
                    rows={2}
                  />
                </Block>
                <IconButton
                  icon="arrowUp"
                  variant="filled"
                  color={C.accent}
                  iconColor={C.white}
                  radius="full"
                  accessibilityLabel="Send message"
                  disabled={!draft.trim() || !!loadingChat}
                  onPress={() => sendPrompt()}
                />
              </Block>
              <Text c={C.muted} size={10} ta="center" mt={7}>
                Mosaic Chat uses scripted responses in this example. No request is sent to an AI service.
              </Text>
            </Block>
          </KeyboardAvoidingArea>
        </AppShell.Main>
      </AppShell>
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <MosaicChatScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
