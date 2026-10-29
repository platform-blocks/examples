import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  TextArea,
  AppShell,
  Input,
  ScrollArea,
  SafeArea,
  Block,
  Avatar,
  Button,
  Chip,
  Dialog,
  Icon,
  IconButton,
  KeyboardAvoidingArea,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  PlocksProvider,
  Text,
  useAppShellApi,
  useToast,
} from '@plocks/ui-snack';

function NavbarControls({ children }: { children: (actions: ReturnType<typeof useAppShellApi>) => ReactNode }) {
  return <>{children(useAppShellApi())}</>;
}

const C = {
  bg: '#F7F8FC',
  white: '#FFF',
  ink: '#202124',
  muted: '#697279',
  line: '#E6E9EF',
  blue: '#0B57D0',
  pale: '#DDE9FF',
  red: '#EA4335',
};
type Folder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive' | 'trash';
type Attachment = { name: string; size?: number };
type Mail = {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  attachments?: Attachment[];
  subject: string;
  body: string;
  time: string;
  folder: Folder;
  starred: boolean;
  read: boolean;
};
const INITIAL: Mail[] = [
  {
    id: 'm1',
    from: 'Maya Chen',
    to: 'you@example.com',
    subject: 'Coffee this weekend?',
    body: 'Hey! I found a new little café near the park. Want to catch up on Saturday morning? I can bring that book I was telling you about.',
    time: '10:42 AM',
    folder: 'inbox',
    starred: true,
    read: false,
  },
  {
    id: 'm2',
    from: 'The Weekly Edit',
    to: 'you@example.com',
    subject: 'Five things worth your time this week',
    body: 'Hello! This week we are sharing a thoughtful article, a beautiful photo essay, and a recipe for a very slow Sunday.',
    time: '9:18 AM',
    folder: 'inbox',
    starred: false,
    read: false,
  },
  {
    id: 'm3',
    from: 'Alex Rivera',
    to: 'you@example.com',
    subject: 'Re: project notes',
    body: 'These notes look great. I added a couple of comments to the layout section. Let us review them together tomorrow.',
    time: 'Yesterday',
    folder: 'inbox',
    starred: false,
    read: true,
  },
  {
    id: 'm4',
    from: 'Studio North',
    to: 'you@example.com',
    subject: 'Your workshop is confirmed',
    body: 'Thanks for signing up! We look forward to seeing you at the illustration workshop next Tuesday at 6 PM.',
    time: 'Yesterday',
    folder: 'inbox',
    starred: true,
    read: true,
  },
  {
    id: 'm5',
    from: 'Jordan Lee',
    to: 'you@example.com',
    subject: 'Photos from the coast',
    body: 'Finally sorted the pictures from our weekend trip. The sunset ones came out especially well. I will send over a folder soon!',
    time: 'Mon',
    folder: 'inbox',
    starred: false,
    read: true,
  },
  {
    id: 'm6',
    from: 'you@example.com',
    to: 'sam@example.com',
    subject: 'Thanks for your help',
    body: 'Hi Sam, thank you for walking me through the setup. Everything is working smoothly now.',
    time: 'Sun',
    folder: 'sent',
    starred: false,
    read: true,
  },
  {
    id: 'm7',
    from: 'Local Library',
    to: 'you@example.com',
    subject: 'A book is ready for pickup',
    body: 'The title you requested is now available at the front desk. We will hold it for one week.',
    time: 'Sat',
    folder: 'archive',
    starred: false,
    read: true,
  },
];
const STORAGE = 'plocks-postbox-example:v1';
const FOLDERS: { id: Folder; label: string; icon: string }[] = [
  { id: 'inbox', label: 'Inbox', icon: 'mail' },
  { id: 'starred', label: 'Starred', icon: 'star' },
  { id: 'sent', label: 'Sent', icon: 'arrowRight' },
  { id: 'drafts', label: 'Drafts', icon: 'edit' },
  { id: 'archive', label: 'Archive', icon: 'folder' },
  { id: 'trash', label: 'Trash', icon: 'trash' },
];
const avatarColor = (name: string) => ['#9874BD', '#6C9CA5', '#CA8C70', '#7DA371'][name.length % 4];

const ME = 'you@example.com';
const CONTACTS = [
  { name: 'Maya Chen', email: 'maya@example.com' },
  { name: 'Alex Rivera', email: 'alex@example.com' },
  { name: 'Jordan Lee', email: 'jordan@example.com' },
  { name: 'Sam Patel', email: 'sam@example.com' },
  { name: 'Studio North', email: 'hello@studionorth.example' },
  { name: 'Local Library', email: 'desk@library.example' },
];
type Field = 'to' | 'cc' | 'bcc';
// The plocks TextInput type (the app and the library resolve separate react-native copies).
type InputRef = ComponentProps<typeof Input>['inputRef'];
type TextInput = NonNullable<InputRef> extends infer R ? (R extends { current: infer T } ? NonNullable<T> : never) : never;
type Draft = {
  id?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: Attachment[];
};
const EMPTY_DRAFT: Draft = { to: [], cc: [], bcc: [], subject: '', body: '', attachments: [] };
const splitList = (value?: string) => (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const contactFor = (value: string) =>
  CONTACTS.find((item) => item.email === value.toLowerCase() || item.name.toLowerCase() === value.toLowerCase());
const labelFor = (value: string) => contactFor(value)?.name ?? value;
const isAddress = (value: string) => !!contactFor(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const hasContent = (draft: Draft) =>
  draft.to.length + draft.cc.length + draft.bcc.length + draft.attachments.length > 0 ||
  !!draft.subject.trim() ||
  !!draft.body.trim();
const fileSize = (size?: number) =>
  size == null ? '' : size < 1024 * 1024 ? ` · ${Math.max(1, Math.round(size / 1024))} KB` : ` · ${(size / 1048576).toFixed(1)} MB`;

function RecipientRow({
  label,
  values,
  text,
  onValues,
  onText,
  inputRef,
  children,
}: {
  label: string;
  values: string[];
  text: string;
  onValues: (change: (old: string[]) => string[]) => void;
  onText: (next: string) => void;
  inputRef?: InputRef;
  children?: ReactNode;
}) {
  const query = text.trim().toLowerCase();
  const suggestions = query
    ? CONTACTS.filter(
        (item) =>
          !values.includes(item.name) &&
          (item.name.toLowerCase().includes(query) || item.email.includes(query)),
      ).slice(0, 5)
    : [];
  const add = (value: string) => {
    const next = value.trim();
    if (next) onValues((old) => (old.includes(next) ? old : [...old, next]));
    onText('');
  };
  return (
    <Block gap={0} zIndex={suggestions.length ? 10 : 0}>
      <Block
        direction="row"
        align="flex-start"
        gap={12}
        px={16}
        mih={52}
        borderBottomWidth={1}
        borderBottomColor={C.line}
      >
        <Text c={C.muted} size={15} w={44} mt={16}>
          {label}
        </Text>
        <Block flex={1} miw={0} direction="row" wrap="wrap" align="center" gap={6} py={8}>
          {values.map((value) => (
            <Chip
              key={value}
              size="md"
              variant={isAddress(value) ? 'surface' : 'light'}
              color={isAddress(value) ? undefined : 'error'}
              startSection={
                <Avatar size="xs" fallback={labelFor(value).slice(0, 1).toUpperCase()} bg={avatarColor(labelFor(value))} textColor={C.white} />
              }
              labelProps={{ c: isAddress(value) ? C.ink : C.red }}
              onRemove={() => onValues((old) => old.filter((item) => item !== value))}
              removeButtonLabel={`Remove ${labelFor(value)}`}
            >
              {labelFor(value)}
            </Chip>
          ))}
          <Input
            variant="unstyled"
            inputRef={inputRef}
            value={text}
            onChangeText={(next) => (/[,;]$/.test(next) ? add(next.slice(0, -1)) : onText(next))}
            onEnter={() => add(suggestions[0]?.name ?? text)}
            textInputProps={{
              onKeyPress: (event) => {
                if (event.nativeEvent.key === 'Backspace' && !text) onValues((old) => old.slice(0, -1));
              },
            }}
            accessibilityLabel={label}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            mb={0}
            flex={1}
            miw={80}
            inputColor={C.ink}
            inputFontSize={15}
          />
        </Block>
        {children}
      </Block>
      {suggestions.length > 0 && (
        <Block gap={0} position="absolute" top="100%" left={0} right={0} bg={C.white} shadow="md" py={6}>
          {suggestions.map((item) => (
            <Block
              key={item.email}
              onPress={() => add(item.name)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name}`}
              direction="row"
              align="center"
              gap={14}
              px={16}
              py={9}
            >
              <Avatar size="md" fallback={item.name.slice(0, 2).toUpperCase()} bg={avatarColor(item.name)} textColor={C.white} />
              <Block gap={1} flex={1} miw={0}>
                <Text c={C.ink} size={14} fw="medium" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text c={C.muted} size={12} numberOfLines={1}>
                  {item.email}
                </Text>
              </Block>
            </Block>
          ))}
        </Block>
      )}
    </Block>
  );
}

function ComposeScreen({
  initial,
  onClose,
  onSend,
  onDiscard,
}: {
  initial: Draft;
  onClose: (draft: Draft) => void;
  onSend: (draft: Draft) => void;
  onDiscard: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;
  const [draft, setDraft] = useState<Draft>(initial);
  const [typed, setTyped] = useState<Record<Field, string>>({ to: '', cc: '', bcc: '' });
  const [showCc, setShowCc] = useState(initial.cc.length + initial.bcc.length > 0);
  const toRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);
  // Text still in a recipient field counts as a recipient, as in Gmail.
  const current = (): Draft => ({
    ...draft,
    to: typed.to.trim() ? [...draft.to, typed.to.trim()] : draft.to,
    cc: typed.cc.trim() ? [...draft.cc, typed.cc.trim()] : draft.cc,
    bcc: typed.bcc.trim() ? [...draft.bcc, typed.bcc.trim()] : draft.bcc,
  });
  const canSend = current().to.length > 0 && !!draft.body.trim();
  const update = (patch: Partial<Draft>) => setDraft((old) => ({ ...old, ...patch }));
  const close = () => onClose(current());
  const send = () => canSend && onSend(current());
  async function attach() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: false });
    if (result.canceled) return;
    setDraft((old) => ({
      ...old,
      attachments: [...old.attachments, ...result.assets.map((item) => ({ name: item.name, size: item.size }))],
    }));
  }
  const recipientRow = (field: Field, label: string, children?: ReactNode) => (
    <RecipientRow
      label={label}
      values={draft[field]}
      text={typed[field]}
      onValues={(change) => setDraft((old) => ({ ...old, [field]: change(old[field]) }))}
      onText={(next) => setTyped((old) => ({ ...old, [field]: next }))}
      inputRef={field === 'to' ? toRef : undefined}
    >
      {children}
    </RecipientRow>
  );
  const overflow = (
    <Menu position="bottom-end">
      <IconButton icon="dots-vertical" variant="ghost" iconColor={C.muted} accessibilityLabel="More options" />
      <MenuDropdown>
        <MenuItem onPress={() => setShowCc((old) => !old)}>{showCc ? 'Hide Cc/Bcc' : 'Add Cc/Bcc'}</MenuItem>
        <MenuItem onPress={close}>Save draft</MenuItem>
        <MenuDivider />
        <MenuItem color="error" onPress={onDiscard}>
          Discard
        </MenuItem>
      </MenuDropdown>
    </Menu>
  );

  const form = (
    <>
      <Block direction="row" align="center" gap={12} px={16} h={52} borderBottomWidth={1} borderBottomColor={C.line}>
        <Text c={C.muted} size={15} w={44}>
          From
        </Text>
        <Text c={C.ink} size={15} flex={1} numberOfLines={1}>
          {ME}
        </Text>
      </Block>
      {recipientRow(
        'to',
        'To',
        wide ? (
          !showCc && (
            <Block gap={0} onPress={() => setShowCc(true)} accessibilityRole="button" accessibilityLabel="Add Cc and Bcc" mt={16}>
              <Text c={C.muted} size={14}>
                Cc  Bcc
              </Text>
            </Block>
          )
        ) : (
          <IconButton
            icon={showCc ? 'chevronUp' : 'chevronDown'}
            variant="ghost"
            iconColor={C.muted}
            accessibilityLabel={showCc ? 'Hide Cc and Bcc' : 'Show Cc and Bcc'}
            onPress={() => setShowCc((old) => !old)}
            mt={8}
          />
        ),
      )}
      {showCc && recipientRow('cc', 'Cc')}
      {showCc && recipientRow('bcc', 'Bcc')}
      <Block direction="row" align="center" px={16} h={52} borderBottomWidth={1} borderBottomColor={C.line}>
        <Input
          variant="unstyled"
          value={draft.subject}
          onChangeText={(subject) => update({ subject })}
          onEnter={() => bodyRef.current?.focus()}
          placeholder="Subject"
          placeholderTextColor={C.muted}
          accessibilityLabel="Subject"
          returnKeyType="next"
          mb={0}
          flex={1}
          inputColor={C.ink}
          inputFontSize={15}
        />
      </Block>
      <Block gap={0} flex={1} px={16} pt={14} pb={8}>
        <TextArea
          ref={bodyRef}
          variant="unstyled"
          value={draft.body}
          onChangeText={(body) => update({ body })}
          placeholder="Compose email"
          placeholderTextColor={C.muted}
          accessibilityLabel="Message body"
          flex={1}
          size="lg"
          mb={0}
        />
      </Block>
      {draft.attachments.length > 0 && (
        <Block direction="row" wrap="wrap" gap={8} px={16} py={10}>
          {draft.attachments.map((item, index) => (
            <Chip
              key={`${item.name}-${index}`}
              size="md"
              variant="surface"
              startSection={<Icon name="file" color={C.red} size={16} />}
              labelProps={{ c: C.ink }}
              onRemove={() => update({ attachments: draft.attachments.filter((_, other) => other !== index) })}
              removeButtonLabel={`Remove ${item.name}`}
            >
              {`${item.name}${fileSize(item.size)}`}
            </Chip>
          ))}
        </Block>
      )}
    </>
  );

  return (
    <Dialog
      opened
      variant={wide ? 'modal' : 'fullscreen'}
      w={wide ? Math.min(width - 64, 1120) : undefined}
      radius={wide ? 16 : undefined}
      p={0}
      accessibilityLabel={draft.subject.trim() || 'New message'}
      autoFocus={initial.to.length ? bodyRef : toRef}
      onClose={close}
    >
      {wide ? (
        <Block gap={0} h={height - 64} bg={C.white}>
          <Block direction="row" align="center" gap={4} bg="#F2F6FC" pl={18} pr={6} h={44}>
            <Text c={C.ink} fw="medium" size={14} flex={1} numberOfLines={1}>
              {draft.subject.trim() || 'New message'}
            </Text>
            <IconButton icon="x" variant="ghost" iconColor={C.ink} accessibilityLabel="Save draft and close" onPress={close} />
          </Block>
          {form}
          <Block direction="row" align="center" gap={6} px={16} py={12}>
            <Button title="Send" color={C.blue} radius="xl" disabled={!canSend} onPress={send} mr={6} />
            <IconButton icon="paperclip" variant="ghost" iconColor={C.muted} accessibilityLabel="Attach files" onPress={attach} />
            <Block gap={0} flex={1} />
            {overflow}
            <IconButton icon="trash" variant="ghost" iconColor={C.muted} accessibilityLabel="Discard draft" onPress={onDiscard} />
          </Block>
        </Block>
      ) : (
        <KeyboardAvoidingArea gap={0} flex={1} bg={C.white}>
          <Block direction="row" align="center" gap={2} px={4} h={56}>
            <IconButton icon="arrowLeft" variant="ghost" iconColor={C.ink} accessibilityLabel="Save draft and close" onPress={close} />
            <Block gap={0} flex={1} />
            <IconButton icon="paperclip" variant="ghost" iconColor={C.ink} accessibilityLabel="Attach files" onPress={attach} />
            <IconButton
              icon="send"
              variant="ghost"
              iconColor={canSend ? C.blue : '#B4BAC2'}
              accessibilityLabel="Send"
              disabled={!canSend}
              onPress={send}
            />
            {overflow}
          </Block>
          {form}
        </KeyboardAvoidingArea>
      )}
    </Dialog>
  );
}

function PostboxScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const [folder, setFolder] = useState<Folder>('inbox');
  const [messages, setMessages] = useState<Mail[]>(INITIAL);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [compose, setCompose] = useState<Draft | null>(null);
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const active = messages.find((item) => item.id === selected);
  const unread = messages.filter((item) => item.folder === 'inbox' && !item.read).length;
  const shown = messages.filter(
    (item) =>
      (query.trim()
        ? item.folder !== 'trash'
        : folder === 'starred'
          ? item.starred && item.folder !== 'trash'
          : item.folder === folder) &&
      `${item.from} ${item.to} ${item.subject} ${item.body}`.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as Mail[];
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(messages)).catch(() => {});
  }, [messages, ready]);
  const changeFolder = (next: Folder) => {
    setFolder(next);
    setQuery('');
    setSelected(null);
  };
  const openMessage = (id: string) => {
    const mail = messages.find((item) => item.id === id);
    if (mail?.folder === 'drafts') return openDraft(mail);
    setSelected(id);
    setMessages((old) => old.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };
  const toggleStar = (id: string) =>
    setMessages((old) => old.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item)));
  const moveMessage = (id: string, next: Folder) => {
    setMessages((old) => old.map((item) => (item.id === id ? { ...item, folder: next } : item)));
    setSelected(null);
  };
  const notify = (message: string) =>
    toast.show({ message, variant: 'filled', color: '#303134', position: wide ? 'bottom-left' : 'bottom-center', autoHide: 3500 });
  function startCompose(reply?: Mail) {
    setCompose({
      ...EMPTY_DRAFT,
      to: reply ? [reply.from] : [],
      subject: reply ? `Re: ${reply.subject.replace(/^Re: /, '')}` : '',
    });
  }
  function openDraft(mail: Mail) {
    setCompose({
      id: mail.id,
      to: splitList(mail.to),
      cc: splitList(mail.cc),
      bcc: splitList(mail.bcc),
      subject: mail.subject === '(no subject)' ? '' : mail.subject,
      body: mail.body,
      attachments: mail.attachments ?? [],
    });
  }
  const toMail = (draft: Draft, id: string, folder: Folder, time: string): Mail => ({
    id,
    from: ME,
    to: draft.to.join(', '),
    cc: draft.cc.join(', '),
    bcc: draft.bcc.join(', '),
    attachments: draft.attachments,
    subject: draft.subject.trim() || '(no subject)',
    body: draft.body.trim(),
    time,
    folder,
    starred: false,
    read: true,
  });
  // Closing keeps whatever was written as a draft, as Gmail does.
  function saveDraft(draft: Draft) {
    if (hasContent(draft)) {
      const mail = toMail(draft, draft.id ?? `draft-${Date.now()}`, 'drafts', 'Draft');
      setMessages((old) => [mail, ...old.filter((item) => item.id !== mail.id)]);
      notify('Draft saved');
    } else if (draft.id) {
      setMessages((old) => old.filter((item) => item.id !== draft.id));
    }
    setCompose(null);
  }
  function discardDraft() {
    const id = compose?.id;
    if (id) setMessages((old) => old.filter((item) => item.id !== id));
    setCompose(null);
    notify('Draft discarded');
  }
  function send(draft: Draft) {
    setMessages((old) => [
      toMail(draft, `sent-${Date.now()}`, 'sent', 'Just now'),
      ...old.filter((item) => item.id !== draft.id),
    ]);
    setCompose(null);
    setFolder('sent');
    setSelected(null);
    notify('Message sent');
  }
  const sidebar = (closeNavbar: () => void) => (
    <Block flex={1} bg={C.bg} p={12} gap={8}>
      <Button
        title="✎  Compose"
        color={C.pale}
        textColor={C.ink}
        radius="lg"
        onPress={() => {
          if (!wide) closeNavbar();
          startCompose();
        }}
      />
      <Block gap={0} h={8} />
      {FOLDERS.map((item) => (
        <Block
          key={item.id}
          onPress={() => {
            changeFolder(item.id);
            if (!wide) closeNavbar();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.label}`}
          direction="row"
          align="center"
          gap={15}
          px={14}
          py={10}
          radius={19}
          bg={folder === item.id ? C.pale : 'transparent'}
        >
          <Icon
            name={item.icon}
            variant={folder === item.id ? 'filled' : 'outlined'}
            color={folder === item.id ? C.ink : C.muted}
            size={19}
          />
          <Text c={C.ink} fw={folder === item.id ? 'bold' : 'normal'} flex={1}>
            {item.label}
          </Text>
          {item.id === 'inbox' && unread > 0 && (
            <Text c={C.ink} fw="bold" size={12}>
              {unread}
            </Text>
          )}
        </Block>
      ))}
      <Block gap={0} flex={1} />
      <Text c={C.muted} size={11} p={12}>
        Local mail demo · no delivery
      </Text>
    </Block>
  );

  return (
    <SafeArea gap={0} flex={1} bg={C.white}>
      <StatusBar barStyle="dark-content" />
      <AppShell
        withSafeArea={false}
        withBorder={false}
        header={{ height: 65 }}
        navbar={{ width: 230, breakpoint: 'md', expandOnHover: false }}
      >
        <AppShell.Header withBorder={false}>
          <Block h={65} direction="row" align="center" px={17} gap={14} borderBottomWidth={1} borderBottomColor={C.line}>
            {!wide && (
              <NavbarControls>
                {({ openNavbar }) => (
                  <IconButton icon="menu" variant="ghost" iconColor={C.muted} accessibilityLabel="Show folders" onPress={openNavbar} />
                )}
              </NavbarControls>
            )}
            <Icon name="mail" variant="filled" color={C.red} size={27} />
            <Text c={C.ink} fw="bold" size={wide ? 24 : 19}>
              Postbox
            </Text>
            <Block
              gap={0}
              flex={1}
              maw={650}
              ml={wide ? 40 : 0}
              direction="row"
              bg="#F0F4F9"
              radius={22}
              align="center"
              px={13}
            >
              <Icon name="search" color={C.muted} size={19} />
              <Input
                variant="unstyled"
                value={query}
                onChangeText={setQuery}
                placeholder="Search mail"
                mb={0}
                flex={1}
                inputColor={C.ink}
                inputFontSize={14}
              />
            </Block>
          </Block>
        </AppShell.Header>
        <AppShell.Navbar accessibilityLabel="Mail folders" withBorder={false}>
          <NavbarControls>{({ closeNavbar }) => sidebar(closeNavbar)}</NavbarControls>
        </AppShell.Navbar>
        <AppShell.Main centerContent={false}>
          <Block gap={0} flex={1} direction="row">
            {(!selected || wide) && (
              <Block
                gap={0}
                w={wide ? 390 : '100%'}
                bg={C.white}
                borderRightWidth={wide ? 1 : 0}
                borderRightColor={C.line}
              >
                <Block
                  gap={0}
                  px={18}
                  py={15}
                  borderBottomWidth={1}
                  borderBottomColor={C.line}
                  direction="row"
                  justify="space-between"
                >
                  <Text c={C.ink} fw="bold" size={20}>
                    {query ? 'Search results' : FOLDERS.find((item) => item.id === folder)?.label}
                  </Text>
                  <Text c={C.muted} size={11}>
                    {shown.length} messages
                  </Text>
                </Block>
                <ScrollArea flex={1}>
                  {shown.length === 0 && (
                    <Text c={C.muted} p={24}>
                      No messages here.
                    </Text>
                  )}
                  {shown.map((item) => (
                    <Block
                      key={item.id}
                      onPress={() => openMessage(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${item.subject}`}
                      direction="row"
                      gap={10}
                      px={14}
                      py={13}
                      bg={selected === item.id ? '#EAF1FB' : item.read ? C.white : '#F4F7FC'}
                      borderBottomWidth={1}
                      borderBottomColor={C.line}
                    >
                      <Avatar
                        size="md"
                        fallback={item.from.slice(0, 2).toUpperCase()}
                        bg={avatarColor(item.from)}
                        textColor={C.white}
                      />
                      <Block flex={1} miw={0} gap={3}>
                        <Block direction="row" justify="space-between" gap={5}>
                          <Text c={C.ink} fw={item.read ? 'medium' : 'bold'} size={13} numberOfLines={1} flex={1}>
                            {item.from}
                          </Text>
                          <Text c={C.muted} size={10}>
                            {item.time}
                          </Text>
                        </Block>
                        <Text c={C.ink} fw={item.read ? 'normal' : 'bold'} size={12} numberOfLines={1}>
                          {item.subject}
                        </Text>
                        <Text c={C.muted} size={12} numberOfLines={1}>
                          {item.body}
                        </Text>
                      </Block>
                      <Block
                        gap={0}
                        onPress={(event) => {
                          event.stopPropagation();
                          toggleStar(item.id);
                        }}
                        accessibilityLabel={item.starred ? 'Unstar message' : 'Star message'}
                        alignSelf="center"
                        p={4}
                      >
                        <Icon
                          name="star"
                          variant={item.starred ? 'filled' : 'outlined'}
                          color={item.starred ? '#F2B632' : C.muted}
                          size={19}
                        />
                      </Block>
                    </Block>
                  ))}
                </ScrollArea>
                {!wide && (
                  <Block
                    gap={0}
                    onPress={() => startCompose()}
                    accessibilityRole="button"
                    accessibilityLabel="Compose message"
                    position="absolute"
                    right={18}
                    bottom={18}
                    bg={C.pale}
                    radius={17}
                    px={17}
                    py={13}
                  >
                    <Text c={C.ink} fw="bold">
                      ✎ Compose
                    </Text>
                  </Block>
                )}
              </Block>
            )}
            {(wide || selected) && (
              <Block gap={0} flex={1} bg={C.white}>
                {active ? (
                  <>
                    <Block direction="row" align="center" gap={4} p={10} borderBottomWidth={1} borderBottomColor={C.line}>
                      {!wide && (
                        <IconButton
                          icon="arrowLeft"
                          variant="ghost"
                          iconColor={C.ink}
                          accessibilityLabel="Back to messages"
                          onPress={() => setSelected(null)}
                        />
                      )}
                      <IconButton
                        icon="folder"
                        variant="ghost"
                        iconColor={C.muted}
                        accessibilityLabel="Archive message"
                        onPress={() => moveMessage(active.id, 'archive')}
                      />
                      <IconButton
                        icon="trash"
                        variant="ghost"
                        iconColor={C.muted}
                        accessibilityLabel="Delete message"
                        onPress={() => moveMessage(active.id, 'trash')}
                      />
                      <IconButton
                        icon="mail"
                        variant="ghost"
                        iconColor={C.muted}
                        accessibilityLabel="Mark unread"
                        onPress={() => {
                          setMessages((old) =>
                            old.map((item) => (item.id === active.id ? { ...item, read: false } : item)),
                          );
                          setSelected(null);
                        }}
                      />
                    </Block>
                    <ScrollArea contentProps={{ p: wide ? 32 : 20, maw: 850, w: '100%' }}>
                      <Text c={C.ink} fw="bold" size={27}>
                        {active.subject}
                      </Text>
                      <Block direction="row" align="center" gap={12} mt={27}>
                        <Avatar
                          size="lg"
                          fallback={active.from.slice(0, 2).toUpperCase()}
                          bg={avatarColor(active.from)}
                          textColor={C.white}
                        />
                        <Block gap={0} flex={1}>
                          <Text c={C.ink} fw="bold" size={14}>
                            {active.from}
                          </Text>
                          <Text c={C.muted} size={11}>
                            to {active.to}
                            {active.cc ? `, cc ${active.cc}` : ''} · {active.time}
                          </Text>
                        </Block>
                        <IconButton
                          icon="star"
                          variant="ghost"
                          iconColor={active.starred ? '#F2B632' : C.muted}
                          accessibilityLabel="Toggle star"
                          onPress={() => toggleStar(active.id)}
                        />
                      </Block>
                      <Text c={C.ink} size={15} lh={25} mt={30} mb={30}>
                        {active.body}
                      </Text>
                      {!!active.attachments?.length && (
                        <Block direction="row" wrap="wrap" gap={8} mt={-10} mb={30}>
                          {active.attachments.map((item, index) => (
                            <Chip
                              key={`${item.name}-${index}`}
                              size="md"
                              variant="surface"
                              startSection={<Icon name="file" color={C.red} size={16} />}
                              labelProps={{ c: C.ink }}
                            >
                              {`${item.name}${fileSize(item.size)}`}
                            </Chip>
                          ))}
                        </Block>
                      )}
                      {active.folder !== 'sent' && (
                        <Block gap={0} alignSelf="flex-start">
                          <Button
                            title="↩  Reply"
                            variant="outline"
                            color={C.muted}
                            onPress={() => startCompose(active)}
                          />
                        </Block>
                      )}
                      <Text c={C.muted} size={11} mt={20}>
                        Demo inbox. Replies stay on this device.
                      </Text>
                    </ScrollArea>
                  </>
                ) : (
                  <Block flex={1} align="center" justify="center" gap={12}>
                    <Icon name="mail" color="#C8CED7" size={55} />
                    <Text c={C.muted}>Select a message to read it.</Text>
                  </Block>
                )}
              </Block>
            )}
          </Block>
        </AppShell.Main>
      </AppShell>
      {compose && <ComposeScreen initial={compose} onClose={saveDraft} onSend={send} onDiscard={discardDraft} />}
    </SafeArea>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <PostboxScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
