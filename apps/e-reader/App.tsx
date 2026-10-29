import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Platform, StatusBar, useWindowDimensions } from 'react-native';
import type { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Block, Highlight, Icon, PlocksProvider, SafeArea, ScrollArea, Text } from '@plocks/ui';

import { BOOK } from './book';

type Position = { chapter: number; paragraph: number };
type ResumePosition = Position & { char: number };
type Word = { start: number; end: number; text: string };
type Colors = {
  canvas: string;
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  player: string;
};

const STORAGE_KEY = '@plocks/e-reader/v1';
const SPEEDS = [0.85, 1, 1.2, 1.4];
const FONT_SIZES = [19, 22, 25];
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const PRESSED = { opacity: 0.6 };

const LIGHT: Colors = {
  canvas: '#F2F0EA',
  paper: '#FFFEFB',
  ink: '#242A28',
  muted: '#6D7672',
  accent: '#315F58',
  accentSoft: '#D9E9E3',
  border: '#E3E7E1',
  player: '#FFFFFF',
};
const DARK: Colors = {
  canvas: '#171E1D',
  paper: '#222B29',
  ink: '#F4F3EA',
  muted: '#A9B7B2',
  accent: '#A6D3C4',
  accentSoft: '#3B554D',
  border: '#34403C',
  player: '#25302D',
};

const wordsIn = (text: string): Word[] =>
  Array.from(text.matchAll(/\S+/g), match => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    text: match[0],
  }));

const wordAt = (words: Word[], char: number): number => {
  const index = words.findIndex(word => word.end > char);
  return index < 0 ? Math.max(0, words.length - 1) : index;
};

const chapterNumber = (index: number) => String(index + 1).padStart(2, '0');

function SmallButton({
  icon,
  label,
  onPress,
  colors,
  active = false,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  colors: Colors;
  active?: boolean;
}) {
  return (
    <Block
      onPress={onPress}
      pressedStyle={PRESSED}
      accessibilityRole="button"
      accessibilityLabel={label}
      w={39}
      h={39}
      radius={12}
      align="center"
      justify="center"
      gap={0}
      bg={active ? colors.accentSoft : 'transparent'}
    >
      <Icon name={icon} size={20} color={active ? colors.accent : colors.ink} decorative />
    </Block>
  );
}

function ReaderParagraph({
  text,
  index,
  current,
  activeWord,
  fontSize,
  colors,
  onPress,
  onPosition,
}: {
  text: string;
  index: number;
  current: boolean;
  activeWord: number | null;
  fontSize: number;
  colors: Colors;
  onPress: () => void;
  onPosition: (y: number) => void;
}) {
  const words = useMemo(() => wordsIn(text), [text]);
  const marked = current && activeWord !== null ? words[activeWord] : undefined;
  const type = { c: colors.ink, ff: SERIF, size: fontSize, lh: Math.round(fontSize * 1.72), lts: 0.05 };

  return (
    <Block
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={'Listen from paragraph ' + (index + 1)}
      onLayout={event => onPosition(event.nativeEvent.layout.y)}
      mb={24}
      gap={0}
    >
      <Text {...type}>
        {marked ? (
          <>
            {text.slice(0, marked.start)}
            <Highlight
              {...type}
              highlight={marked.text}
              highlightColor={colors.accentSoft}
              highlightStyles={{ color: colors.ink, borderRadius: 3, paddingHorizontal: 0, paddingVertical: 0 }}
            >
              {marked.text}
            </Highlight>
            {text.slice(marked.end)}
          </>
        ) : text}
      </Text>
    </Block>
  );
}

export default function App() {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 600;
  const [position, setPosition] = useState<Position>({ chapter: 0, paragraph: 0 });
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showContents, setShowContents] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [dark, setDark] = useState(false);
  const [fontIndex, setFontIndex] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [speechError, setSpeechError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const runRef = useRef(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const paperYRef = useRef(0);
  const paragraphYRef = useRef<number[]>([]);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ResumePosition>({ chapter: 0, paragraph: 0, char: 0 });
  const wordRef = useRef(0);
  const lastBoundaryRef = useRef(0);
  const startRef = useRef<(chapter: number, paragraph: number, char: number, rate: number) => Promise<void>>(
    async () => {},
  );

  const colors = dark ? DARK : LIGHT;
  const chapter = BOOK.chapters[position.chapter];
  const fontSize = FONT_SIZES[fontIndex];
  const totalWords = useMemo(
    () => chapter.paragraphs.reduce((count, paragraph) => count + wordsIn(paragraph).length, 0),
    [chapter],
  );
  const completedWords = chapter.paragraphs
    .slice(0, position.paragraph)
    .reduce((count, paragraph) => count + wordsIn(paragraph).length, 0);
  const progress = Math.min(1, (completedWords + (activeWord ?? 0)) / Math.max(totalWords, 1));
  const minutes = Math.max(1, Math.ceil(totalWords / 170));

  const clearFallback = useCallback(() => {
    if (fallbackRef.current) clearInterval(fallbackRef.current);
    fallbackRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    runRef.current += 1;
    clearFallback();
    void Speech.stop();
    setPlaying(false);
  }, [clearFallback]);

  const startParagraph = useCallback(async (chapterIndex: number, paragraphIndex: number, char = 0, rate = speed) => {
    const run = ++runRef.current;
    clearFallback();
    await Speech.stop().catch(() => {});
    if (runRef.current !== run) return;

    const paragraph = BOOK.chapters[chapterIndex].paragraphs[paragraphIndex];
    const words = wordsIn(paragraph);
    const safeChar = Math.max(0, Math.min(char, paragraph.length - 1));
    const firstWord = wordAt(words, safeChar);
    resumeRef.current = { chapter: chapterIndex, paragraph: paragraphIndex, char: words[firstWord]?.start ?? 0 };
    wordRef.current = firstWord;
    lastBoundaryRef.current = Date.now();
    setPosition({ chapter: chapterIndex, paragraph: paragraphIndex });
    setActiveWord(firstWord);
    setSpeechError('');
    setPlaying(true);
    setShowContents(false);
    const spokenAt = Date.now();

    try {
      Speech.speak(paragraph.slice(safeChar), {
        language: 'en-US',
        rate,
        onBoundary: (event: { charIndex: number }) => {
          if (runRef.current !== run) return;
          const nextWord = wordAt(words, safeChar + event.charIndex);
          wordRef.current = nextWord;
          resumeRef.current.char = words[nextWord]?.start ?? 0;
          lastBoundaryRef.current = Date.now();
          setActiveWord(nextWord);
        },
        onDone: () => {
          if (runRef.current !== run) return;
          clearFallback();
          if (Date.now() - spokenAt < 500 && words.length > 3) {
            setPlaying(false);
            setActiveWord(null);
            setSpeechError('No speech voice is available in this browser or device.');
            return;
          }
          const next = paragraphIndex + 1;
          if (next < BOOK.chapters[chapterIndex].paragraphs.length) {
            void startRef.current(chapterIndex, next, 0, rate);
          } else if (chapterIndex < BOOK.chapters.length - 1) {
            void startRef.current(chapterIndex + 1, 0, 0, rate);
          } else {
            resumeRef.current.char = 0;
            setPlaying(false);
            setActiveWord(words.length);
          }
        },
        onError: () => {
          if (runRef.current !== run) return;
          clearFallback();
          setPlaying(false);
          setSpeechError('Narration is unavailable on this device.');
        },
      });
    } catch {
      setPlaying(false);
      setSpeechError('Narration is unavailable on this device.');
      return;
    }

    // Some voices do not report word boundaries. Keep an approximate reading
    // cue moving until the voice starts reporting its actual position.
    fallbackRef.current = setInterval(() => {
      if (runRef.current !== run || Date.now() - lastBoundaryRef.current < 1100) return;
      const nextWord = Math.min(wordRef.current + 1, words.length - 1);
      if (nextWord === wordRef.current) return;
      wordRef.current = nextWord;
      resumeRef.current.char = words[nextWord].start;
      setActiveWord(nextWord);
    }, Math.round(380 / rate));
  }, [clearFallback, speed]);
  startRef.current = startParagraph;

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!mounted || !raw) return;
      const saved = JSON.parse(raw) as {
        position?: Position;
        bookmarks?: number[];
        dark?: boolean;
        fontIndex?: number;
        speed?: number;
      };
      if (saved.position && BOOK.chapters[saved.position.chapter]?.paragraphs[saved.position.paragraph]) {
        setPosition(saved.position);
        resumeRef.current = { ...saved.position, char: 0 };
      }
      if (Array.isArray(saved.bookmarks)) setBookmarks(saved.bookmarks.filter(item => BOOK.chapters[item]));
      if (typeof saved.dark === 'boolean') setDark(saved.dark);
      if (typeof saved.fontIndex === 'number' && FONT_SIZES[saved.fontIndex]) setFontIndex(saved.fontIndex);
      if (typeof saved.speed === 'number' && SPEEDS.includes(saved.speed)) setSpeed(saved.speed);
    }).catch(() => {}).finally(() => {
      if (mounted) setHydrated(true);
    });
    return () => {
      mounted = false;
      runRef.current += 1;
      clearFallback();
      void Speech.stop();
    };
  }, [clearFallback]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ position, bookmarks, dark, fontIndex, speed }));
  }, [position, bookmarks, dark, fontIndex, speed, hydrated]);

  useEffect(() => {
    if (!playing || showContents) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, paperYRef.current + (paragraphYRef.current[position.paragraph] ?? 0) - 28),
        animated: true,
      });
    }, 140);
    return () => clearTimeout(timer);
  }, [position.chapter, position.paragraph, playing, showContents]);

  const selectChapter = (index: number) => {
    stopPlayback();
    resumeRef.current = { chapter: index, paragraph: 0, char: 0 };
    setPosition({ chapter: index, paragraph: 0 });
    setActiveWord(null);
    setSpeechError('');
    setShowContents(false);
  };

  const togglePlayback = () => {
    if (playing) {
      stopPlayback();
    } else {
      const resume = resumeRef.current;
      const char = resume.chapter === position.chapter && resume.paragraph === position.paragraph ? resume.char : 0;
      void startParagraph(position.chapter, position.paragraph, char);
    }
  };

  const skipParagraph = (direction: number) => {
    let nextChapter = position.chapter;
    let nextParagraph = position.paragraph + direction;
    if (nextParagraph < 0 && nextChapter > 0) {
      nextChapter -= 1;
      nextParagraph = BOOK.chapters[nextChapter].paragraphs.length - 1;
    } else if (nextParagraph >= chapter.paragraphs.length && nextChapter < BOOK.chapters.length - 1) {
      nextChapter += 1;
      nextParagraph = 0;
    }
    if (!BOOK.chapters[nextChapter].paragraphs[nextParagraph]) return;
    if (playing) void startParagraph(nextChapter, nextParagraph, 0);
    else {
      stopPlayback();
      resumeRef.current = { chapter: nextChapter, paragraph: nextParagraph, char: 0 };
      setPosition({ chapter: nextChapter, paragraph: nextParagraph });
      setActiveWord(null);
      setSpeechError('');
    }
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (playing) void startParagraph(position.chapter, position.paragraph, resumeRef.current.char, next);
  };

  const toggleBookmark = () => {
    setBookmarks(items => items.includes(position.chapter)
      ? items.filter(item => item !== position.chapter)
      : [...items, position.chapter]);
  };

  const percent = Math.round(progress * 100);
  const firstChapter = position.chapter === 0;
  const lastChapter = position.chapter === BOOK.chapters.length - 1;

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: dark ? 'dark' : 'light' }}>
        <SafeArea flex={1} gap={0} bg={colors.canvas}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          <Block flex={1} gap={0}>
            <Block borderBottomWidth={1} borderBottomColor={colors.border} gap={0}>
              <Block direction="row" align="center" justify="space-between" w="100%" maw={1020} alignSelf="center" px={22} mih={72} gap={0}>
                <Block
                  onPress={() => setShowContents(value => !value)}
                  accessibilityRole="button"
                  accessibilityLabel="Open chapter list"
                  direction="row"
                  align="center"
                  gap={10}
                >
                  <Block w={38} h={38} radius={11} align="center" justify="center" bg={colors.accent} gap={0}>
                    <Text c="#FFFFFF" ff="Georgia" size={25} lh={32} fw="700">e.</Text>
                  </Block>
                  <Block gap={0}>
                    <Text c={colors.ink} size={15} fw="bold" lts={0.3}>E-READER</Text>
                    <Text c={colors.muted} size={10} lts={1.2}>READ · LISTEN · FOLLOW</Text>
                  </Block>
                </Block>
                <Block direction="row" align="center" gap={3}>
                  <SmallButton icon="list" label="Chapters" onPress={() => setShowContents(value => !value)} colors={colors} active={showContents} />
                  <SmallButton icon="text" label="Change text size" onPress={() => setFontIndex(value => (value + 1) % FONT_SIZES.length)} colors={colors} />
                  <SmallButton icon={dark ? 'sun' : 'moon'} label={dark ? 'Light theme' : 'Dark theme'} onPress={() => setDark(value => !value)} colors={colors} />
                </Block>
              </Block>
            </Block>

            <ScrollArea ref={scrollRef} flex={1} contentProps={{ px: 20, pt: 46, pb: 62, align: 'center' }}>
              {showContents ? (
                <Block w="100%" maw={760} gap={0}>
                  <Text c={colors.accent} size={11} fw="bold" lts={2}>YOUR LIBRARY</Text>
                  <Text c={colors.ink} ff={SERIF} size={48} lh={56} fw="600" lts={-1.8} mt={12}>The Quiet Atlas</Text>
                  <Text c={colors.muted} size={15}>A short story made for reading and listening.</Text>
                  <Block mih={215} radius={20} p={27} mt={28} justify="space-between" bg={colors.accent} gap={0}>
                    <Text c="#D6ECE2" size={11} lts={2} fw="700">NOW READING</Text>
                    <Text c="#FFFFFF" ff={SERIF} size={34} lh={40} fw="600">{chapter.title}</Text>
                    <Text c="#E6F1EC" size={15}>{chapter.subtitle}</Text>
                    <Text c="#D6ECE2" size={10} lts={1.4} fw="700" mt={18}>{BOOK.chapters.length} CHAPTERS  ·  WORD-SYNCED AUDIO</Text>
                  </Block>
                  <Text c={colors.ink} size={16} fw="bold" mt={35} mb={6}>Contents</Text>
                  {BOOK.chapters.map((item, index) => (
                    <Block
                      key={item.title}
                      onPress={() => selectChapter(index)}
                      accessibilityRole="button"
                      accessibilityLabel={'Read chapter ' + (index + 1) + ': ' + item.title}
                      direction="row"
                      align="center"
                      gap={16}
                      py={19}
                      borderBottomWidth={1}
                      borderBottomColor={colors.border}
                    >
                      <Text c={colors.accent} size={13} fw="bold">{chapterNumber(index)}</Text>
                      <Block flex={1} gap={3}>
                        <Text c={colors.ink} size={17} fw="bold">{item.title}</Text>
                        <Text c={colors.muted} size={13}>{item.subtitle}</Text>
                      </Block>
                      {bookmarks.includes(index) && <Icon name="bookmark" variant="filled" size={16} color={colors.accent} decorative />}
                      <Icon name="chevron-right" size={18} color={colors.muted} decorative />
                    </Block>
                  ))}
                </Block>
              ) : (
                <Block w="100%" maw={760} gap={0}>
                  <Block direction="row" align="center" justify="space-between" mb={12} gap={0}>
                    <Text c={colors.accent} size={11} fw="bold" lts={1.8}>
                      THE QUIET ATLAS  /  CHAPTER {chapterNumber(position.chapter)}
                    </Text>
                    <SmallButton
                      icon="bookmark"
                      label={bookmarks.includes(position.chapter) ? 'Remove bookmark' : 'Bookmark chapter'}
                      onPress={toggleBookmark}
                      colors={colors}
                      active={bookmarks.includes(position.chapter)}
                    />
                  </Block>
                  <Text c={colors.ink} ff={SERIF} size={compact ? 40 : 48} lh={compact ? 47 : 56} fw="600" lts={-1.8} mt={12}>{chapter.title}</Text>
                  <Text c={colors.muted} ff={SERIF} size={20} lh={30} fs="italic" mt={9}>{chapter.subtitle}</Text>
                  <Block direction="row" align="center" wrap="wrap" gap={10} mt={27} mb={26}>
                    <Text c={colors.muted} size={12}>{minutes} MIN READ</Text>
                    <Block w={3} h={3} radius={2} bg={colors.muted} gap={0} />
                    <Text c={colors.muted} size={12}>{percent}% COMPLETE</Text>
                    <Block w={3} h={3} radius={2} bg={colors.muted} gap={0} />
                    <Text c={colors.muted} size={12}>DEVICE NARRATION</Text>
                  </Block>
                  <Block
                    borderWidth={1}
                    borderColor={colors.border}
                    radius={20}
                    bg={colors.paper}
                    px={compact ? 24 : 34}
                    pt={36}
                    pb={26}
                    shadow="sm"
                    gap={0}
                    onLayout={event => { paperYRef.current = event.nativeEvent.layout.y; }}
                  >
                    <Block w={32} h={3} radius={3} mb={29} bg={colors.accent} gap={0} />
                    {chapter.paragraphs.map((paragraph, index) => (
                      <ReaderParagraph
                        key={chapter.title + index}
                        text={paragraph}
                        index={index}
                        current={position.paragraph === index}
                        activeWord={activeWord}
                        fontSize={fontSize}
                        colors={colors}
                        onPress={() => { void startParagraph(position.chapter, index, 0); }}
                        onPosition={y => { paragraphYRef.current[index] = y; }}
                      />
                    ))}
                    <Block borderTopWidth={1} borderTopColor={colors.border} pt={22} mt={8} gap={0}>
                      <Text c={colors.accent} size={13} fw="bold" lts={1.1}>END OF CHAPTER {chapterNumber(position.chapter)}</Text>
                    </Block>
                  </Block>
                  <Block direction="row" align="center" justify="space-between" mt={24} gap={0}>
                    <Block
                      onPress={() => selectChapter(Math.max(0, position.chapter - 1))}
                      disabled={firstChapter}
                      accessibilityRole="button"
                      accessibilityLabel="Previous chapter"
                      direction="row"
                      align="center"
                      gap={4}
                      mih={44}
                      opacity={firstChapter ? 0.35 : 1}
                    >
                      <Icon name="chevron-left" size={18} color={colors.accent} decorative />
                      <Text c={colors.accent} size={13} fw="bold">PREVIOUS</Text>
                    </Block>
                    <Block
                      onPress={() => selectChapter(Math.min(BOOK.chapters.length - 1, position.chapter + 1))}
                      disabled={lastChapter}
                      accessibilityRole="button"
                      accessibilityLabel="Next chapter"
                      direction="row"
                      align="center"
                      gap={4}
                      mih={44}
                      opacity={lastChapter ? 0.35 : 1}
                    >
                      <Text c={colors.accent} size={13} fw="bold">NEXT CHAPTER</Text>
                      <Icon name="chevron-right" size={18} color={colors.accent} decorative />
                    </Block>
                  </Block>
                </Block>
              )}
            </ScrollArea>

            <Block bg={colors.player} borderTopWidth={1} borderTopColor={colors.border} pt={13} gap={0}>
              <Block direction="row" align="center" justify="space-between" gap={8} w="100%" maw={1020} alignSelf="center" px={20} pb={13}>
                <Block flex={1} miw={0} direction="row" align="center" gap={10}>
                  <Block w={40} h={40} radius={12} align="center" justify="center" bg={colors.accentSoft} gap={0}>
                    <Icon name="headphones" size={19} color={colors.accent} decorative />
                  </Block>
                  <Block flex={1} miw={0} gap={2}>
                    <Text c={colors.accent} size={10} fw="bold" lts={1.4}>{playing ? 'NOW NARRATING' : 'READY TO LISTEN'}</Text>
                    <Text c={colors.ink} size={14} fw="bold" numberOfLines={1}>{chapter.title}</Text>
                  </Block>
                </Block>
                <Block direction="row" align="center" gap={4}>
                  <SmallButton icon="chevron-left" label="Previous paragraph" onPress={() => skipParagraph(-1)} colors={colors} />
                  <Block
                    onPress={togglePlayback}
                    pressedStyle={PRESSED}
                    accessibilityRole="button"
                    accessibilityLabel={playing ? 'Pause narration' : 'Play narration'}
                    w={48}
                    h={48}
                    radius={24}
                    align="center"
                    justify="center"
                    bg={colors.accent}
                    gap={0}
                  >
                    <Icon name={playing ? 'pause' : 'play'} variant="filled" size={22} color={dark ? colors.canvas : '#FFFFFF'} decorative />
                  </Block>
                  <SmallButton icon="chevron-right" label="Next paragraph" onPress={() => skipParagraph(1)} colors={colors} />
                </Block>
                <Block
                  onPress={cycleSpeed}
                  pressedStyle={PRESSED}
                  accessibilityRole="button"
                  accessibilityLabel={'Narration speed ' + speed + ' times. Change speed'}
                  miw={52}
                  h={36}
                  px={8}
                  borderWidth={1}
                  borderColor={colors.border}
                  radius={18}
                  align="center"
                  justify="center"
                  gap={0}
                >
                  <Text c={colors.ink} size={12} fw="bold">{speed}×</Text>
                </Block>
              </Block>
              <Block
                w="100%"
                h={3}
                bg={colors.border}
                gap={0}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: percent }}
              >
                <Block h={3} w={`${percent}%`} bg={colors.accent} gap={0} />
              </Block>
              {!!speechError && <Text c={colors.accent} size={12} ta="center" py={5}>{speechError}</Text>}
            </Block>
          </Block>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
