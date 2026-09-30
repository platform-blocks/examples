import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { DimensionValue } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Highlight, Icon, PlocksProvider, SafeArea, Text } from '@plocks/ui';

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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.smallButton,
        { backgroundColor: active ? colors.accentSoft : 'transparent', opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Icon name={icon} size={20} color={active ? colors.accent : colors.ink} decorative />
    </Pressable>
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
  const textStyle = {
    color: colors.ink,
    fontFamily: SERIF,
    fontSize,
    lineHeight: Math.round(fontSize * 1.72),
    letterSpacing: 0.05,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={'Listen from paragraph ' + (index + 1)}
      onLayout={event => onPosition(event.nativeEvent.layout.y)}
      style={styles.paragraph}
    >
      <Text style={textStyle}>
        {marked ? (
          <>
            {text.slice(0, marked.start)}
            <Highlight
              highlight={marked.text}
              highlightColor={colors.accentSoft}
              highlightStyles={{ color: colors.ink, borderRadius: 3 }}
              style={textStyle}
            >
              {marked.text}
            </Highlight>
            {text.slice(marked.end)}
          </>
        ) : text}
      </Text>
    </Pressable>
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

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: dark ? 'dark' : 'light' }}>
        <SafeArea flex={1} gap={0} bg={colors.canvas}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          <View style={styles.screen}>
            <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
              <View style={styles.topBarInner}>
                <Pressable
                  onPress={() => setShowContents(value => !value)}
                  accessibilityRole="button"
                  accessibilityLabel="Open chapter list"
                  style={styles.brand}
                >
                  <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
                    <Text style={styles.brandLetter}>e.</Text>
                  </View>
                  <View>
                    <Text c={colors.ink} size={15} fw="bold" lts={0.3}>E-READER</Text>
                    <Text c={colors.muted} size={10} lts={1.2}>READ · LISTEN · FOLLOW</Text>
                  </View>
                </Pressable>
                <View style={styles.topActions}>
                  <SmallButton icon="list" label="Chapters" onPress={() => setShowContents(value => !value)} colors={colors} active={showContents} />
                  <SmallButton icon="text" label="Change text size" onPress={() => setFontIndex(value => (value + 1) % FONT_SIZES.length)} colors={colors} />
                  <SmallButton icon={dark ? 'sun' : 'moon'} label={dark ? 'Light theme' : 'Dark theme'} onPress={() => setDark(value => !value)} colors={colors} />
                </View>
              </View>
            </View>

            <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {showContents ? (
                <View style={styles.readingWidth}>
                  <Text c={colors.accent} size={11} fw="bold" lts={2}>YOUR LIBRARY</Text>
                  <Text c={colors.ink} style={[styles.pageTitle, { fontFamily: SERIF }]}>The Quiet Atlas</Text>
                  <Text c={colors.muted} size={15}>A short story made for reading and listening.</Text>
                  <View style={[styles.bookFeature, { backgroundColor: colors.accent }]}>
                    <Text style={styles.featureKicker}>NOW READING</Text>
                    <Text style={[styles.featureTitle, { fontFamily: SERIF }]}>{chapter.title}</Text>
                    <Text style={styles.featureCopy}>{chapter.subtitle}</Text>
                    <Text style={styles.featureFooter}>{BOOK.chapters.length} CHAPTERS  ·  WORD-SYNCED AUDIO</Text>
                  </View>
                  <Text c={colors.ink} size={16} fw="bold" style={styles.sectionLabel}>Contents</Text>
                  {BOOK.chapters.map((item, index) => (
                    <Pressable
                      key={item.title}
                      onPress={() => selectChapter(index)}
                      accessibilityRole="button"
                      accessibilityLabel={'Read chapter ' + (index + 1) + ': ' + item.title}
                      style={[styles.chapterRow, { borderBottomColor: colors.border }]}
                    >
                      <Text c={colors.accent} size={13} fw="bold">{chapterNumber(index)}</Text>
                      <View style={styles.chapterCopy}>
                        <Text c={colors.ink} size={17} fw="bold">{item.title}</Text>
                        <Text c={colors.muted} size={13}>{item.subtitle}</Text>
                      </View>
                      {bookmarks.includes(index) && <Icon name="bookmark" variant="filled" size={16} color={colors.accent} decorative />}
                      <Icon name="chevron-right" size={18} color={colors.muted} decorative />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.readingWidth}>
                  <View style={styles.readerMeta}>
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
                  </View>
                  <Text c={colors.ink} style={[styles.pageTitle, { fontFamily: SERIF, fontSize: compact ? 40 : 48, lineHeight: compact ? 47 : 56 }]}>{chapter.title}</Text>
                  <Text c={colors.muted} style={[styles.subtitle, { fontFamily: SERIF }]}>{chapter.subtitle}</Text>
                  <View style={styles.readingStats}>
                    <Text c={colors.muted} size={12}>{minutes} MIN READ</Text>
                    <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                    <Text c={colors.muted} size={12}>{Math.round(progress * 100)}% COMPLETE</Text>
                    <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                    <Text c={colors.muted} size={12}>DEVICE NARRATION</Text>
                  </View>
                  <View
                    style={[styles.paper, { backgroundColor: colors.paper, borderColor: colors.border, paddingHorizontal: compact ? 24 : 34 }]}
                    onLayout={event => { paperYRef.current = event.nativeEvent.layout.y; }}
                  >
                    <View style={[styles.paperRule, { backgroundColor: colors.accent }]} />
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
                    <View style={[styles.endMark, { borderTopColor: colors.border }]}>
                      <Text c={colors.accent} size={13} fw="bold" lts={1.1}>END OF CHAPTER {chapterNumber(position.chapter)}</Text>
                    </View>
                  </View>
                  <View style={styles.readerFooter}>
                    <Pressable
                      onPress={() => selectChapter(Math.max(0, position.chapter - 1))}
                      disabled={position.chapter === 0}
                      accessibilityRole="button"
                      accessibilityLabel="Previous chapter"
                      style={[styles.chapterNav, { opacity: position.chapter === 0 ? 0.35 : 1 }]}
                    >
                      <Icon name="chevron-left" size={18} color={colors.accent} decorative />
                      <Text c={colors.accent} size={13} fw="bold">PREVIOUS</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => selectChapter(Math.min(BOOK.chapters.length - 1, position.chapter + 1))}
                      disabled={position.chapter === BOOK.chapters.length - 1}
                      accessibilityRole="button"
                      accessibilityLabel="Next chapter"
                      style={[styles.chapterNav, { opacity: position.chapter === BOOK.chapters.length - 1 ? 0.35 : 1 }]}
                    >
                      <Text c={colors.accent} size={13} fw="bold">NEXT CHAPTER</Text>
                      <Icon name="chevron-right" size={18} color={colors.accent} decorative />
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={[styles.player, { backgroundColor: colors.player, borderTopColor: colors.border }]}>
              <View style={styles.playerInner}>
                <View style={styles.playerInfo}>
                  <View style={[styles.audioBadge, { backgroundColor: colors.accentSoft }]}>
                    <Icon name="headphones" size={19} color={colors.accent} decorative />
                  </View>
                  <View style={styles.playerCopy}>
                    <Text c={colors.accent} size={10} fw="bold" lts={1.4}>{playing ? 'NOW NARRATING' : 'READY TO LISTEN'}</Text>
                    <Text c={colors.ink} size={14} fw="bold" numberOfLines={1}>{chapter.title}</Text>
                  </View>
                </View>
                <View style={styles.transport}>
                  <SmallButton icon="chevron-left" label="Previous paragraph" onPress={() => skipParagraph(-1)} colors={colors} />
                  <Pressable
                    onPress={togglePlayback}
                    accessibilityRole="button"
                    accessibilityLabel={playing ? 'Pause narration' : 'Play narration'}
                    style={[styles.playButton, { backgroundColor: colors.accent }]}
                  >
                    <Icon name={playing ? 'pause' : 'play'} variant="filled" size={22} color={dark ? colors.canvas : '#FFFFFF'} decorative />
                  </Pressable>
                  <SmallButton icon="chevron-right" label="Next paragraph" onPress={() => skipParagraph(1)} colors={colors} />
                </View>
                <Pressable
                  onPress={cycleSpeed}
                  accessibilityRole="button"
                  accessibilityLabel={'Narration speed ' + speed + ' times. Change speed'}
                  style={[styles.speedButton, { borderColor: colors.border }]}
                >
                  <Text c={colors.ink} size={12} fw="bold">{speed}×</Text>
                </Pressable>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
                <View style={[styles.progressFill, { backgroundColor: colors.accent, width: (Math.round(progress * 100) + '%') as DimensionValue }]} />
              </View>
              {!!speechError && <Text c={colors.accent} size={12} style={styles.playerError}>{speechError}</Text>}
            </View>
          </View>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { borderBottomWidth: 1 },
  topBarInner: { width: '100%', maxWidth: 1020, alignSelf: 'center', paddingHorizontal: 22, minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brandLetter: { color: '#FFFFFF', fontFamily: 'Georgia', fontSize: 25, lineHeight: 32, fontWeight: '700' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  smallButton: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 62, alignItems: 'center' },
  readingWidth: { width: '100%', maxWidth: 760 },
  readerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle: { fontSize: 48, lineHeight: 56, fontWeight: '600', letterSpacing: -1.8, marginTop: 12 },
  subtitle: { fontSize: 20, lineHeight: 30, fontStyle: 'italic', marginTop: 9 },
  readingStats: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 27, marginBottom: 26 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  paper: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 34, paddingTop: 36, paddingBottom: 26, ...Platform.select({ web: { boxShadow: '0 16px 55px rgba(25, 45, 40, 0.06)' }, default: {} }) },
  paperRule: { width: 32, height: 3, borderRadius: 3, marginBottom: 29 },
  paragraph: { marginBottom: 24 },
  endMark: { borderTopWidth: 1, paddingTop: 22, marginTop: 8 },
  readerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  chapterNav: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  sectionLabel: { marginTop: 35, marginBottom: 6 },
  bookFeature: { minHeight: 215, borderRadius: 20, padding: 27, marginTop: 28, justifyContent: 'space-between' },
  featureKicker: { color: '#D6ECE2', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  featureTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '600' },
  featureCopy: { color: '#E6F1EC', fontSize: 15 },
  featureFooter: { color: '#D6ECE2', fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginTop: 18 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 19, borderBottomWidth: 1 },
  chapterCopy: { flex: 1, gap: 3 },
  player: { borderTopWidth: 1, paddingTop: 13 },
  playerInner: { width: '100%', maxWidth: 1020, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  playerInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerCopy: { flex: 1, minWidth: 0, gap: 2 },
  audioBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  speedButton: { minWidth: 52, height: 36, paddingHorizontal: 8, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { width: '100%', height: 3 },
  progressFill: { height: 3 },
  playerError: { alignSelf: 'center', paddingVertical: 5 },
});
