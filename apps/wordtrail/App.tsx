import { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { MotionBlock, ScrollArea, SafeArea, Block, Icon, PlocksProvider, Text } from '@plocks/ui';

const C = {
  green: '#58CC02',
  greenDark: '#46A302',
  greenPale: '#E9F9DC',
  blue: '#1CB0F6',
  bluePale: '#E8F7FF',
  red: '#FF4B4B',
  redPale: '#FFE8E7',
  ink: '#303735',
  muted: '#79817D',
  border: '#E5E9E4',
  white: '#FFFFFF',
  disabled: '#E7E9E7',
  disabledText: '#A7ADA9',
};

const QUESTIONS = [
  {
    language: 'ENGLISH',
    word: 'the apple',
    prompt: 'Select the Spanish translation',
    options: ['manzana', 'perro', 'casa'],
    answer: 0,
    note: 'Manzana means apple.',
  },
  {
    language: 'SPANISH',
    word: 'hola',
    prompt: 'Select the English translation',
    options: ['goodbye', 'hello', 'please'],
    answer: 1,
    note: 'Hola is a friendly hello.',
  },
  {
    language: 'ENGLISH',
    word: 'water',
    prompt: 'Select the Spanish translation',
    options: ['libro', 'sol', 'agua'],
    answer: 2,
    note: 'Agua means water.',
  },
  {
    language: 'SPANISH',
    word: 'gracias',
    prompt: 'Select the English translation',
    options: ['thank you', 'morning', 'friend'],
    answer: 0,
    note: 'Gracias means thank you.',
  },
];

function Bird() {
  return (
    <Svg width={112} height={120} viewBox="0 0 112 120" accessibilityLabel="Friendly green bird">
      <Ellipse cx="56" cy="112" rx="42" ry="6" fill="#D9EFC9" />
      <Path d="M20 69C20 36 34 15 57 15c24 0 39 23 39 54 0 27-16 43-40 43S20 96 20 69Z" fill={C.green} />
      <Path d="M25 65c-11 5-15 15-10 24 3 6 9 8 15 6l4-25Z" fill={C.greenDark} />
      <Path d="M87 65c11 5 15 15 10 24-3 6-9 8-15 6l-4-25Z" fill={C.greenDark} />
      <Ellipse cx="55" cy="76" rx="28" ry="30" fill="#B9EE8B" />
      <Ellipse cx="42" cy="52" rx="16" ry="20" fill={C.white} />
      <Ellipse cx="70" cy="52" rx="16" ry="20" fill={C.white} />
      <Circle cx="46" cy="57" r="5" fill={C.ink} />
      <Circle cx="66" cy="57" r="5" fill={C.ink} />
      <Path d="M48 69q8-4 16 0l-8 9Z" fill="#FFB84D" />
      <Path d="M48 89q8 7 16 0" stroke={C.greenDark} strokeWidth="3" strokeLinecap="round" fill="none" />
      <Ellipse cx="41" cy="107" rx="9" ry="4" fill="#F6AD36" />
      <Ellipse cx="71" cy="107" rx="9" ry="4" fill="#F6AD36" />
    </Svg>
  );
}

function AnswerCard({
  label,
  number,
  selected,
  correct,
  revealed,
  onPress,
}: {
  label: string;
  number: number;
  selected: boolean;
  correct: boolean;
  revealed: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (selected)
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.025, friction: 5, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
  }, [selected, scale]);

  const isCorrect = revealed && correct;
  const isWrong = revealed && selected && !correct;
  const color = isCorrect ? C.greenDark : isWrong ? C.red : selected ? C.blue : C.border;
  const background = isCorrect ? C.greenPale : isWrong ? C.redPale : selected ? C.bluePale : C.white;
  return (
    <MotionBlock scale={scale}>
      <Block
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={revealed}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: revealed }}
        mih={68}
        borderWidth={2}
        borderBottomWidth={pressed && !revealed ? 2 : 4}
        borderColor={color}
        radius={17}
        bg={background}
        px={18}
        py={13}
        direction="row"
        align="center"
        gap={16}
        translateY={pressed && !revealed ? 2 : 0}
      >
        <Block
          gap={0}
          w={29}
          h={29}
          radius={8}
          borderWidth={1.5}
          borderColor={color}
          bg={isCorrect || isWrong || selected ? C.white : '#F8FAF7'}
          align="center"
          justify="center"
        >
          <Text c={isCorrect || isWrong || selected ? color : C.muted} size={14} fw="bold">
            {number}
          </Text>
        </Block>
        <Text c={C.ink} size={19} fw="semibold" flex={1}>
          {label}
        </Text>
        {(isCorrect || isWrong) && <Icon name={isCorrect ? 'check' : 'x'} color={color} size={22} />}
      </Block>
    </MotionBlock>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled = false,
  color = C.green,
  shadow = C.greenDark,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  shadow?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Block
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      h={58}
      radius={16}
      bg={disabled ? C.disabled : color}
      borderBottomWidth={disabled || pressed ? 0 : 4}
      borderBottomColor={shadow}
      align="center"
      justify="center"
      gap={0}
      translateY={pressed && !disabled ? 3 : 0}
    >
      <Text c={disabled ? C.disabledText : C.white} size={16} fw="bold" lts={0.7}>
        {title}
      </Text>
    </Block>
  );
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'selecting' | 'feedback'>('selecting');
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(5);
  const progress = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;
  const birdScale = useRef(new Animated.Value(0.84)).current;
  const feedbackRise = useRef(new Animated.Value(24)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const done = index >= QUESTIONS.length;
  const question = QUESTIONS[index];
  const correct = !done && selected === question.answer;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.min((index + (phase === 'feedback' ? 1 : 0)) / QUESTIONS.length, 1),
      duration: 430,
      useNativeDriver: false,
    }).start();
  }, [index, phase, progress]);

  useEffect(() => {
    entrance.setValue(0);
    rise.setValue(20);
    birdScale.setValue(0.84);
    Animated.parallel([
      Animated.timing(entrance, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(birdScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [index, entrance, rise, birdScale]);

  useEffect(() => {
    if (phase !== 'feedback') return;
    feedbackRise.setValue(24);
    feedbackOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(feedbackRise, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [phase, index, feedbackRise, feedbackOpacity]);

  const reset = () => {
    setIndex(0);
    setSelected(null);
    setPhase('selecting');
    setScore(0);
    setHearts(5);
  };
  const check = () => {
    if (selected === null || done) return;
    if (selected === question.answer) setScore((value) => value + 1);
    else setHearts((value) => Math.max(0, value - 1));
    setPhase('feedback');
  };
  const advance = () => {
    setIndex((value) => value + 1);
    setSelected(null);
    setPhase('selecting');
  };

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <SafeArea gap={0} flex={1} bg={C.white}>
          <StatusBar barStyle="dark-content" />
          <Block w="100%" maw={700} alignSelf="center" px={24} pt={18} pb={14} direction="row" align="center" gap={16}>
            <Block
              gap={0}
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="Restart lesson"
              w={36}
              h={36}
              align="center"
              justify="center"
            >
              <Icon name="x" size={24} color={C.muted} />
            </Block>
            <Block gap={0} flex={1} h={15} radius={20} bg={C.border} overflow="hidden">
              <MotionBlock
                h="full"
                radius={20}
                bg={C.green}
                motionWidth={progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })}
              />
            </Block>
            <Block direction="row" align="center" gap={5}>
              <Icon name="heart" variant="filled" size={24} color={C.red} />
              <Text c={C.red} size={19} fw="bold">
                {hearts}
              </Text>
            </Block>
          </Block>

          <ScrollArea
            contentProps={{
              grow: 1,
              w: '100%',
              maw: 640,
              alignSelf: 'center',
              justify: 'center',
              px: 24,
              pt: 26,
              pb: 30,
            }}
          >
            <MotionBlock motionOpacity={entrance} translateY={rise}>
              {done ? (
                <Block gap={0} align="center" py={32}>
                  <MotionBlock scale={birdScale}>
                    <Bird />
                  </MotionBlock>
                  <Block gap={0} mt={25} px={16} py={7} radius={99} bg={C.greenPale}>
                    <Text c={C.greenDark} size={12} fw="bold" lts={1.2}>
                      LESSON COMPLETE
                    </Text>
                  </Block>
                  <Text c={C.ink} size={34} fw="bold" ta="center" mt={16}>
                    Beautiful work!
                  </Text>
                  <Text c={C.muted} size={17} ta="center" mt={9}>
                    You made it through your first Spanish lesson.
                  </Text>
                  <Block direction="row" gap={12} mt={35} w="100%">
                    <Block gap={0} flex={1} radius={18} bg="#FFF7E5" p={20} align="center">
                      <Text c="#B8821D" size={12} fw="bold" lts={1}>
                        CORRECT
                      </Text>
                      <Text c="#B8821D" size={30} fw="bold">
                        {score}/{QUESTIONS.length}
                      </Text>
                    </Block>
                    <Block gap={0} flex={1} radius={18} bg={C.redPale} p={20} align="center">
                      <Text c={C.red} size={12} fw="bold" lts={1}>
                        HEARTS LEFT
                      </Text>
                      <Text c={C.red} size={30} fw="bold">
                        {hearts}
                      </Text>
                    </Block>
                  </Block>
                </Block>
              ) : (
                <>
                  <Text c={C.greenDark} size={12} fw="bold" lts={1.5}>
                    UNIT 1 · FIRST WORDS
                  </Text>
                  <Text c={C.ink} size={29} fw="bold" mt={12} lh={36}>
                    {question.prompt}
                  </Text>
                  <Block direction="row" align="center" gap={18} mt={35} mb={36}>
                    <MotionBlock scale={birdScale}>
                      <Bird />
                    </MotionBlock>
                    <Block
                      gap={0}
                      flex={1}
                      borderWidth={2}
                      borderColor={C.border}
                      radius={20}
                      px={20}
                      py={17}
                      bg={C.white}
                    >
                      <Text c={C.muted} size={11} fw="bold" lts={1.2}>
                        {question.language}
                      </Text>
                      <Text c={C.ink} size={25} fw="bold" mt={4}>
                        {question.word}
                      </Text>
                    </Block>
                  </Block>
                  <Block gap={12}>
                    {question.options.map((option, optionIndex) => (
                      <AnswerCard
                        key={option}
                        label={option}
                        number={optionIndex + 1}
                        selected={selected === optionIndex}
                        correct={question.answer === optionIndex}
                        revealed={phase === 'feedback'}
                        onPress={() => setSelected(optionIndex)}
                      />
                    ))}
                  </Block>
                </>
              )}
            </MotionBlock>
          </ScrollArea>

          <Block
            gap={0}
            borderTopWidth={1}
            borderTopColor={phase === 'feedback' && !done ? 'transparent' : C.border}
            bg={phase === 'feedback' && !done ? (correct ? C.greenPale : C.redPale) : C.white}
          >
            <Block gap={0} w="100%" maw={640} alignSelf="center" px={24} pt={18} pb={20}>
              {phase === 'feedback' && !done && (
                <MotionBlock
                  motionOpacity={feedbackOpacity}
                  translateY={feedbackRise}
                  mb={18}
                  direction="row"
                  align="center"
                  gap={14}
                >
                  <Block
                    gap={0}
                    w={42}
                    h={42}
                    radius={21}
                    bg={correct ? C.green : C.red}
                    align="center"
                    justify="center"
                  >
                    <Icon name={correct ? 'check' : 'x'} color={C.white} size={26} />
                  </Block>
                  <Block gap={0} flex={1}>
                    <Text c={correct ? C.greenDark : C.red} size={21} fw="bold">
                      {correct ? 'Amazing!' : 'Not quite'}
                    </Text>
                    <Text c={C.ink} size={14}>
                      {question.note}
                    </Text>
                  </Block>
                </MotionBlock>
              )}
              <PrimaryButton
                title={done ? 'PRACTICE AGAIN' : phase === 'feedback' ? 'CONTINUE' : 'CHECK'}
                onPress={done ? reset : phase === 'feedback' ? advance : check}
                disabled={!done && phase === 'selecting' && selected === null}
                color={phase === 'feedback' && !correct ? C.red : C.green}
                shadow={phase === 'feedback' && !correct ? '#D93636' : C.greenDark}
              />
            </Block>
          </Block>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
