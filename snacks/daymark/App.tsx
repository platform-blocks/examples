import { useEffect, useState, type ReactNode } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarChart, LineChart } from '@plocks/charts';
import { Gradient, Input, Progress, Ring, ScrollArea, SafeArea, Block, Icon, PlocksProvider, Text, type BlockProps } from '@plocks/ui-snack';

const C = {
  background: '#F5F8F8',
  surface: '#FFFFFF',
  ink: '#17353A',
  muted: '#72878A',
  teal: '#00A9A6',
  tealDark: '#087B83',
  tealPale: '#E5F7F5',
  line: '#E6EEEE',
  purple: '#7566DA',
  purplePale: '#F1EEFF',
  coral: '#E96972',
  coralPale: '#FFF0F1',
  blue: '#4296CE',
  bluePale: '#EAF5FC',
  orange: '#F5A557',
  white: '#FFFFFF',
};
const STORAGE = 'plocks-daymark-demo:v2';
const GOAL = 10000;
const WEEK = [
  { steps: 8120, zone: 31, calories: 2185, distance: 3.7, sleep: 438, resting: 63 },
  { steps: 5305, zone: 18, calories: 1970, distance: 2.4, sleep: 416, resting: 65 },
  { steps: 10420, zone: 42, calories: 2375, distance: 4.8, sleep: 486, resting: 61 },
  { steps: 7040, zone: 24, calories: 2108, distance: 3.2, sleep: 462, resting: 62 },
  { steps: 9340, zone: 35, calories: 2280, distance: 4.3, sleep: 453, resting: 62 },
  { steps: 6150, zone: 21, calories: 2015, distance: 2.8, sleep: 429, resting: 64 },
  { steps: 6420, zone: 24, calories: 2140, distance: 2.9, sleep: 462, resting: 62 },
];
const HEART = [62, 59, 57, 56, 57, 61, 69, 82, 76, 70, 74, 98, 112, 87, 78, 74, 91, 107, 83, 75, 71, 67, 64, 62];
const INITIAL_WEIGHTS = [171.2, 170.8, 170.5, 170.6, 170.1, 169.7, 169.8, 169.3, 169.1, 168.9, 168.6, 168.8, 168.4];
const SLEEP_STAGES = [
  { label: 'Deep', value: 19, color: '#4B4BA8' },
  { label: 'Light', value: 28, color: '#A89CF0' },
  { label: 'REM', value: 21, color: '#7566DA' },
  { label: 'Awake', value: 6, color: '#E5E5FA' },
  { label: 'Light', value: 19, color: '#A89CF0' },
  { label: 'REM', value: 7, color: '#7566DA' },
];

const minutesLabel = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
const shortDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

function Surface({ children, ...props }: { children: ReactNode } & Omit<BlockProps, 'children'>) {
  return (
    <Block bg={C.surface} radius={24} borderWidth={1} borderColor={C.line} p={20} gap={0} shadow="xs" {...props}>
      {children}
    </Block>
  );
}

function SectionTitle({
  icon,
  color,
  background,
  title,
  action,
  onAction,
}: {
  icon: string;
  color: string;
  background: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Block direction="row" align="center" gap={11} mb={17}>
      <Block gap={0} w={37} h={37} radius={12} bg={background} align="center" justify="center">
        <Icon name={icon} color={color} size={21} />
      </Block>
      <Text c={C.ink} fw="bold" size={18} flex={1}>
        {title}
      </Text>
      {action && onAction && (
        <Block gap={0} onPress={onAction} accessibilityRole="button" py={7} pl={8}>
          <Text c={color} fw="bold" size={13}>
            {action}
          </Text>
        </Block>
      )}
    </Block>
  );
}

function TrendChart({
  values,
  color,
  label,
  height = 150,
}: {
  values: number[];
  color: string;
  label: string;
  height?: number;
}) {
  return (
    <LineChart
      h={height}
      series={[{ data: values.map((value, index) => ({ x: index, y: value })), color }]}
      lineThickness={3.5}
      fill
      fillColor={color}
      showPoints={false}
      xAxis={{ show: false }}
      yAxis={{ show: false }}
      grid={{ show: true, style: 'dashed' }}
      accessibilityLabel={label}
    />
  );
}

function MiniStat({
  icon,
  value,
  label,
  color,
  background,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
  background: string;
}) {
  return (
    <Surface flex={1} miw={102} p={15}>
      <Block gap={0} w={33} h={33} radius={11} bg={background} align="center" justify="center" mb={12}>
        <Icon name={icon} color={color} size={19} />
      </Block>
      <Text c={C.ink} size={22} fw="bold" numberOfLines={1}>
        {value}
      </Text>
      <Text c={C.muted} size={12} mt={3}>
        {label}
      </Text>
    </Surface>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const [dayIndex, setDayIndex] = useState(6);
  const [stepsAdded, setStepsAdded] = useState(0);
  const [water, setWater] = useState(5);
  const [sleepLogged, setSleepLogged] = useState<number | null>(null);
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [weightRange, setWeightRange] = useState<'4W' | '12W'>('4W');
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [weightDraft, setWeightDraft] = useState('');
  const [showSleepLog, setShowSleepLog] = useState(false);
  const [sleepDraft, setSleepDraft] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as {
          stepsAdded?: number;
          water?: number;
          sleepLogged?: number;
          weights?: number[];
        };
        if (Number.isFinite(saved.stepsAdded) && saved.stepsAdded! >= 0) setStepsAdded(saved.stepsAdded!);
        if (Number.isFinite(saved.water) && saved.water! >= 0) setWater(saved.water!);
        if (Number.isFinite(saved.sleepLogged) && saved.sleepLogged! >= 180 && saved.sleepLogged! <= 900)
          setSleepLogged(saved.sleepLogged!);
        if (Array.isArray(saved.weights)) {
          const valid = saved.weights.filter((value) => Number.isFinite(value) && value >= 60 && value <= 600);
          if (valid.length >= 2) setWeights(valid.slice(-30));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready)
      AsyncStorage.setItem(STORAGE, JSON.stringify({ stepsAdded, water, sleepLogged, weights })).catch(() => {});
  }, [ready, stepsAdded, water, sleepLogged, weights]);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  const selectedDate = dates[dayIndex];
  const data = WEEK[dayIndex];
  const steps = data.steps + (dayIndex === 6 ? stepsAdded : 0);
  const sleep = dayIndex === 6 && sleepLogged !== null ? sleepLogged : data.sleep;
  const sleepScore = Math.min(98, Math.max(62, Math.round((sleep / 60) * 11.2)));
  const heartValues = HEART.map((value, index) => value + (6 - dayIndex) * (index % 3 === 0 ? 1 : -1));
  const chartWeights = weights.slice(weightRange === '4W' ? -5 : -13);
  const latestWeight = weights[weights.length - 1];
  const weightChange = latestWeight - chartWeights[0];
  const weightValid = Number.isFinite(Number(weightDraft)) && Number(weightDraft) >= 60 && Number(weightDraft) <= 600;
  const sleepHours = Number(sleepDraft);
  const sleepValid = Number.isFinite(sleepHours) && sleepHours >= 3 && sleepHours <= 15;

  const saveWeight = () => {
    if (!weightValid) return;
    setWeights((current) => [...current, Number(Number(weightDraft).toFixed(1))].slice(-30));
    setWeightDraft('');
    setShowWeightLog(false);
  };
  const saveSleep = () => {
    if (!sleepValid) return;
    setSleepLogged(Math.round(sleepHours * 60));
    setDayIndex(6);
    setSleepDraft('');
    setShowSleepLog(false);
  };

  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'light' }}>
        <SafeArea gap={0} flex={1} bg={C.background}>
          <StatusBar barStyle="dark-content" />
          <ScrollArea contentProps={{ w: '100%', maw: 880, alignSelf: 'center', px: 18, pt: 22, pb: 48, gap: 18 }}>
            <Block gap={0} direction="row" justify="space-between" align="center">
              <Block gap={0}>
                <Text c={C.tealDark} fw="bold" size={18} lts={-0.5}>
                  daymark
                </Text>
                <Text c={C.ink} fw="bold" size={31} mt={5}>
                  {dayIndex === 6 ? 'Today' : 'Daily overview'}
                </Text>
                <Text c={C.muted} size={14} mt={2}>
                  {shortDate(selectedDate)}
                </Text>
              </Block>
              <Block gap={0} w={44} h={44} radius={22} bg={C.tealPale} align="center" justify="center">
                <Text c={C.tealDark} fw="bold" size={15}>
                  JS
                </Text>
              </Block>
            </Block>

            <Block direction="row" gap={8} justify="space-between">
              {dates.map((date, i) => (
                <Block
                  gap={0}
                  key={i}
                  onPress={() => setDayIndex(i)}
                  accessibilityRole="button"
                  accessibilityLabel={shortDate(date)}
                  accessibilityState={{ selected: dayIndex === i }}
                  flex={1}
                  miw={0}
                  py={11}
                  radius={15}
                  align="center"
                  bg={dayIndex === i ? C.tealDark : C.surface}
                  borderWidth={1}
                  borderColor={dayIndex === i ? C.tealDark : C.line}
                >
                  <Text c={dayIndex === i ? C.white : C.muted} size={11} fw="semibold">
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text c={dayIndex === i ? C.white : C.ink} size={17} fw="bold" mt={3}>
                    {date.getDate()}
                  </Text>
                </Block>
              ))}
            </Block>

            <Gradient
              colors={[C.tealDark, '#0DB9B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              radius={28}
              p={21}
              overflow="hidden"
            >
              <Block gap={0} direction="row" align="center">
                <Ring
                  value={steps}
                  max={GOAL}
                  size={142}
                  thickness={12}
                  trackColor="#FFFFFF55"
                  progressColor={C.white}
                  labelColor={C.white}
                  subLabel="of goal"
                  subLabelColor="#D9FBF7"
                  accessibilityLabel="Step goal progress"
                />
                <Block gap={0} flex={1} pl={13}>
                  <Text c="#D5F7F4" size={12} fw="bold" lts={1.2}>
                    STEPS
                  </Text>
                  <Text c={C.white} size={37} fw="bold" numberOfLines={1} mt={3}>
                    {steps.toLocaleString()}
                  </Text>
                  <Text c="#D8F7F5" size={14}>
                    of {GOAL.toLocaleString()} daily goal
                  </Text>
                </Block>
              </Block>
              <Block gap={0} h={1} bg="#FFFFFF44" my={15} />
              <Block gap={0} direction="row" align="center" justify="space-between">
                <Text c={C.white} size={13} fw="semibold">
                  {steps >= GOAL
                    ? 'Goal reached — nice work!'
                    : `${Math.max(0, GOAL - steps).toLocaleString()} steps to go`}
                </Text>
                {dayIndex === 6 && (
                  <Block
                    gap={0}
                    onPress={() => setStepsAdded((value) => value + 500)}
                    accessibilityRole="button"
                    px={12}
                    py={8}
                    bg="#FFFFFF27"
                    radius={11}
                  >
                    <Text c={C.white} size={12} fw="bold">
                      + 500 steps
                    </Text>
                  </Block>
                )}
              </Block>
            </Gradient>

            <Block direction="row" gap={10}>
              <MiniStat
                icon="bolt"
                value={`${data.zone} min`}
                label="Zone minutes"
                color={C.orange}
                background="#FFF4E8"
              />
              <MiniStat
                icon="chart-line"
                value={data.distance.toFixed(1)}
                label="Miles"
                color={C.blue}
                background={C.bluePale}
              />
              <MiniStat
                icon="heart"
                value={data.calories.toLocaleString()}
                label="Calories"
                color={C.coral}
                background={C.coralPale}
              />
            </Block>

            <Block direction={wide ? 'row' : 'column'} gap={16} align="stretch">
              <Surface flex={1}>
                <SectionTitle
                  icon="moon"
                  color={C.purple}
                  background={C.purplePale}
                  title="Sleep"
                  action={dayIndex === 6 ? '+ Log' : undefined}
                  onAction={() => {
                    setSleepDraft((sleep / 60).toFixed(1));
                    setShowSleepLog(true);
                  }}
                />
                <Block gap={0} direction="row" align="flex-end" justify="space-between">
                  <Block gap={0}>
                    <Text c={C.ink} size={31} fw="bold">
                      {minutesLabel(sleep)}
                    </Text>
                    <Text c={C.muted} size={13}>
                      Time asleep
                    </Text>
                  </Block>
                  <Block gap={0} align="flex-end">
                    <Text c={C.purple} size={24} fw="bold">
                      {sleepScore}
                    </Text>
                    <Text c={C.muted} size={12}>
                      Sleep score · Good
                    </Text>
                  </Block>
                </Block>
                <Text c={C.muted} size={12} fw="bold" mt={23} mb={9}>
                  SLEEP STAGES
                </Text>
                <Progress.Root size={18} radius={10} aria-label="Sleep stages">
                  {SLEEP_STAGES.map((stage, index) => (
                    <Progress.Section
                      key={index}
                      value={stage.value}
                      color={stage.color}
                      tooltip={`${stage.label} · ${stage.value}%`}
                    />
                  ))}
                </Progress.Root>
                <Block gap={0} direction="row" justify="space-between" mt={11}>
                  {[
                    ['Deep', '#4B4BA8'],
                    ['Light', '#A89CF0'],
                    ['REM', '#7566DA'],
                    ['Awake', '#D9D9F3'],
                  ].map(([label, color]) => (
                    <Block key={label} direction="row" align="center" gap={4}>
                      <Block gap={0} w={7} h={7} radius={4} bg={color} />
                      <Text c={C.muted} size={11}>
                        {label}
                      </Text>
                    </Block>
                  ))}
                </Block>
                <Block gap={0} h={1} bg={C.line} my={19} />
                <Text c={C.ink} size={13} fw="semibold">
                  Past 7 nights
                </Text>
                <BarChart
                  h={120}
                  mt={10}
                  data={WEEK.map((item, index) => ({
                    id: index,
                    category: dates[index].toLocaleDateString('en-US', { weekday: 'short' }),
                    value: index === 6 && sleepLogged !== null ? sleepLogged : item.sleep,
                    color: dayIndex === index ? C.purple : '#DCD7F7',
                  }))}
                  barSpacing={0.65}
                  barBorderRadius={7}
                  xAxis={{ show: true, labelColor: C.muted, labelFontSize: 10 }}
                  yAxis={{ show: false }}
                  grid={{ show: false }}
                  legend={{ show: false }}
                  tooltip={{ show: true, formatter: (point) => `${minutesLabel(point.value)} sleep` }}
                  onDataPointPress={(point) => setDayIndex(Number(point.id))}
                  accessibilityLabel="Sleep duration over the past seven nights"
                />
                {showSleepLog && (
                  <Block gap={0} mt={19} pt={16} borderTopWidth={1} borderTopColor={C.line}>
                    <Text c={C.ink} fw="semibold" size={13}>
                      Hours slept last night
                    </Text>
                    <Block direction="row" gap={8} mt={9}>
                      <Input
                        variant="outline"
                        value={sleepDraft}
                        onChangeText={setSleepDraft}
                        keyboardType="decimal-pad"
                        placeholder="7.7"
                        accessibilityLabel="Hours slept"
                        mb={0}
                        flex={1}
                        miw={0}
                        h={44}
                        radius={11}
                        inputColor={C.ink}
                      />
                      <Block
                        gap={0}
                        onPress={saveSleep}
                        disabled={!sleepValid}
                        accessibilityRole="button"
                        px={17}
                        justify="center"
                        radius={11}
                        bg={sleepValid ? C.purple : C.line}
                      >
                        <Text c={C.white} fw="bold" size={13}>
                          Save
                        </Text>
                      </Block>
                      <Block
                        gap={0}
                        onPress={() => setShowSleepLog(false)}
                        accessibilityRole="button"
                        justify="center"
                        px={6}
                      >
                        <Text c={C.muted} size={13}>
                          Cancel
                        </Text>
                      </Block>
                    </Block>
                  </Block>
                )}
              </Surface>

              <Surface flex={1}>
                <SectionTitle icon="heart" color={C.coral} background={C.coralPale} title="Heart rate" />
                <Block gap={0} direction="row" align="flex-end" justify="space-between">
                  <Block gap={0}>
                    <Text c={C.ink} size={31} fw="bold">
                      {data.resting}{' '}
                      <Text c={C.muted} size={16}>
                        bpm
                      </Text>
                    </Text>
                    <Text c={C.muted} size={13}>
                      Resting heart rate
                    </Text>
                  </Block>
                  <Block gap={0} px={11} py={6} radius={10} bg={C.coralPale}>
                    <Text c={C.coral} size={12} fw="bold">
                      In your range
                    </Text>
                  </Block>
                </Block>
                <Block gap={0} mt={20}>
                  <TrendChart values={heartValues} color={C.coral} label="Heart rate trend" height={180} />
                </Block>
                <Block gap={0} direction="row" justify="space-between" mt={3}>
                  <Text c={C.muted} size={11}>
                    12 AM
                  </Text>
                  <Text c={C.muted} size={11}>
                    6 AM
                  </Text>
                  <Text c={C.muted} size={11}>
                    12 PM
                  </Text>
                  <Text c={C.muted} size={11}>
                    6 PM
                  </Text>
                  <Text c={C.muted} size={11}>
                    NOW
                  </Text>
                </Block>
                <Block gap={0} h={1} bg={C.line} my={21} />
                <Block gap={0} direction="row" justify="space-between">
                  <Block gap={0}>
                    <Text c={C.muted} size={12}>
                      Lowest today
                    </Text>
                    <Text c={C.ink} fw="bold" size={18}>
                      {Math.min(...heartValues)} bpm
                    </Text>
                  </Block>
                  <Block gap={0} align="flex-end">
                    <Text c={C.muted} size={12}>
                      Peak today
                    </Text>
                    <Text c={C.ink} fw="bold" size={18}>
                      {Math.max(...heartValues)} bpm
                    </Text>
                  </Block>
                </Block>
              </Surface>
            </Block>

            <Surface>
              <SectionTitle
                icon="chart-line"
                color={C.blue}
                background={C.bluePale}
                title="Weight"
                action="+ Log weight"
                onAction={() => {
                  setWeightDraft(latestWeight.toFixed(1));
                  setShowWeightLog(true);
                }}
              />
              <Block gap={0} direction="row" justify="space-between" align="flex-end">
                <Block gap={0}>
                  <Text c={C.ink} size={31} fw="bold">
                    {latestWeight.toFixed(1)}{' '}
                    <Text c={C.muted} size={16}>
                      lb
                    </Text>
                  </Text>
                  <Text c={weightChange <= 0 ? C.tealDark : C.coral} size={13} fw="semibold">
                    {weightChange > 0 ? '+' : ''}
                    {weightChange.toFixed(1)} lb over {weightRange === '4W' ? '4 weeks' : '12 weeks'}
                  </Text>
                </Block>
                <Block gap={0} direction="row" radius={12} bg={C.background} p={3}>
                  {(['4W', '12W'] as const).map((range) => (
                    <Block
                      gap={0}
                      key={range}
                      onPress={() => setWeightRange(range)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: weightRange === range }}
                      px={11}
                      py={7}
                      radius={9}
                      bg={weightRange === range ? C.white : 'transparent'}
                    >
                      <Text c={weightRange === range ? C.ink : C.muted} fw="bold" size={12}>
                        {range}
                      </Text>
                    </Block>
                  ))}
                </Block>
              </Block>
              <Block gap={0} mt={13}>
                <TrendChart values={chartWeights} color={C.blue} label="Weight trend" height={180} />
              </Block>
              <Block gap={0} direction="row" justify="space-between" mt={2}>
                <Text c={C.muted} size={11}>
                  {weightRange === '4W' ? '4 weeks ago' : '12 weeks ago'}
                </Text>
                <Text c={C.muted} size={11}>
                  Latest
                </Text>
              </Block>
              {showWeightLog && (
                <Block gap={0} mt={19} pt={16} borderTopWidth={1} borderTopColor={C.line}>
                  <Text c={C.ink} fw="semibold" size={13}>
                    Log a new weight (lb)
                  </Text>
                  <Block direction="row" gap={8} mt={9}>
                    <Input
                      variant="outline"
                      value={weightDraft}
                      onChangeText={setWeightDraft}
                      keyboardType="decimal-pad"
                      placeholder="168.4"
                      accessibilityLabel="Weight in pounds"
                      mb={0}
                      flex={1}
                      miw={0}
                      h={44}
                      radius={11}
                      inputColor={C.ink}
                    />
                    <Block
                      gap={0}
                      onPress={saveWeight}
                      disabled={!weightValid}
                      accessibilityRole="button"
                      px={17}
                      justify="center"
                      radius={11}
                      bg={weightValid ? C.blue : C.line}
                    >
                      <Text c={C.white} fw="bold" size={13}>
                        Save
                      </Text>
                    </Block>
                    <Block
                      gap={0}
                      onPress={() => setShowWeightLog(false)}
                      accessibilityRole="button"
                      justify="center"
                      px={6}
                    >
                      <Text c={C.muted} size={13}>
                        Cancel
                      </Text>
                    </Block>
                  </Block>
                </Block>
              )}
            </Surface>

            <Surface direction="row" align="center" gap={15}>
              <Block gap={0} w={46} h={46} radius={15} bg={C.bluePale} align="center" justify="center">
                <Text c={C.blue} size={25}>
                  💧
                </Text>
              </Block>
              <Block gap={0} flex={1}>
                <Text c={C.ink} size={17} fw="bold">
                  Water
                </Text>
                <Text c={C.muted} size={13}>
                  {water} of 8 cups today
                </Text>
              </Block>
              <Block
                gap={0}
                onPress={() => setWater((value) => Math.min(value + 1, 20))}
                accessibilityRole="button"
                accessibilityLabel="Log a cup of water"
                w={37}
                h={37}
                radius={12}
                bg={C.bluePale}
                align="center"
                justify="center"
              >
                <Icon name="plus" color={C.blue} size={21} />
              </Block>
            </Surface>
            <Text c={C.muted} size={11} ta="center">
              Illustrative health data for this demo. Logged values stay on this device; no wearable is connected.
            </Text>
          </ScrollArea>
        </SafeArea>
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
