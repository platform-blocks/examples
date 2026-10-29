import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IconCloudOff, IconDroplet, IconRefresh, IconTemperature, IconUmbrella, IconWind } from '@tabler/icons-react-native';
import { Block, Gradient, Image, Loader, PlocksProvider, SafeArea, ScrollArea, Skeleton, Text } from '@plocks/ui';

import { CITIES, dayLabel, describeWeather, getWeather, hourLabel, type City, type Weather } from './weather';

const PAGE = '#0B172A';
const PANEL = '#15243B';
const LINE = 'rgba(255,255,255,0.09)';
const MUTED = '#9DB0CB';
const RAIN = '#7CC8F2';
const HERO_BONE: [string, string] = ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.3)'];
const BONE: [string, string] = ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.13)'];
// Keep the skeleton on screen long enough to read as a loading state, not a flash.
const MIN_LOADING_MS = 700;
const SCENES: Record<City['name'], ImageSourcePropType> = {
  Phoenix: require('./assets/scene-desert.webp'),
  Seattle: require('./assets/scene-lake.webp'),
  'New York': require('./assets/scene-city.webp'),
};

type Range = { min: number; max: number };

function dateLabel(observedAt: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${observedAt.slice(0, 10)}T12:00:00Z`));
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => clearTimeout(timer));
  });
}

function Panel({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <Block gap={14} p={18} bg={PANEL} radius={22} borderWidth={1} borderColor={LINE}>
      <Block direction="row" align="center" justify="space-between" gap={0}>
        <Text c={MUTED} size={11} fw="bold" lts={1.4}>{title}</Text>
        {aside ? <Text c={MUTED} size={11}>{aside}</Text> : null}
      </Block>
      {children}
    </Block>
  );
}

/** Scene art as a dimmed backdrop: it sets the mood without competing with the text. */
// Only the lower part of each 3:2 scene is shown, so its sun or moon stays above the frame.
const SCENE_VISIBLE = 0.45;

function SceneArt({ source, height }: { source: ImageSourcePropType; height: number }) {
  const artHeight = height / SCENE_VISIBLE;
  const artWidth = artHeight * 1.5;
  return (
    <>
      <Block
        gap={0}
        position="absolute"
        bottom={0}
        left="50%"
        ml={-artWidth / 2}
        w={artWidth}
        h={artHeight}
        opacity={0.55}
        pointerEvents="none"
      >
        <Image source={source} resizeMode="cover" w="full" h="full" alt="" />
      </Block>
      {/* Lighter at the top, strongest behind the title block and where the cards begin. */}
      <Gradient
        colors={['rgba(8,18,36,0.2)', 'rgba(8,18,36,0.5)', 'rgba(8,18,36,0.55)', PAGE]}
        locations={[0, 0.3, 0.7, 1]}
        position="absolute"
        inset={0}
      />
    </>
  );
}

function TemperatureBar({ low, high, range }: { low: number; high: number; range: Range }) {
  const span = Math.max(1, range.max - range.min);
  const left = ((low - range.min) / span) * 100;
  const width = Math.max(8, ((high - low) / span) * 100);
  return (
    <Block gap={0} flex={1} h={5} radius={5} bg="rgba(255,255,255,0.1)" overflow="hidden">
      <Gradient
        colors={['#72C9F7', '#F6BC78']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        position="absolute"
        top={0}
        left={`${left}%`}
        w={`${Math.min(width, 100 - left)}%`}
        h={5}
        radius={5}
      />
    </Block>
  );
}

function DetailTile({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <Block gap={6} basis="47%" grow p={16} bg={PANEL} radius={22} borderWidth={1} borderColor={LINE} mih={128}>
      <Block direction="row" align="center" gap={6}>
        {icon}
        <Text c={MUTED} size={11} fw="bold" lts={1.2}>{label.toUpperCase()}</Text>
      </Block>
      <Text c="#FFFFFF" size={30} fw="600" mt={4}>{value}</Text>
      <Text c={MUTED} size={12} numberOfLines={2}>{hint}</Text>
    </Block>
  );
}

function feelsHint(weather: Weather) {
  const delta = Math.round(weather.feelsLike - weather.temperature);
  if (Math.abs(delta) < 3) return 'Similar to the actual temperature.';
  return delta > 0 ? 'Feels warmer than it is.' : 'Feels cooler than it is.';
}

function humidityHint(humidity: number) {
  if (humidity < 30) return 'Dry air today.';
  if (humidity < 60) return 'Comfortable levels.';
  return 'Muggy and humid.';
}

function windHint(mph: number) {
  if (mph < 4) return 'Calm conditions.';
  if (mph < 13) return 'A light breeze.';
  if (mph < 25) return 'Breezy at times.';
  return 'Strong gusts possible.';
}

function HeroSkeleton() {
  return (
    // Each bone matches the line it stands in for, so the hero doesn't shift when data lands.
    <Block gap={0} align="center" accessibilityLabel="Loading weather">
      <Skeleton w={150} h={14} radius={7} mt={8} colors={HERO_BONE} />
      <Skeleton w={150} h={100} radius={24} mt={14} mb={10} colors={HERO_BONE} />
      <Skeleton w={110} h={20} radius={10} mt={2} colors={HERO_BONE} />
      <Skeleton w={96} h={14} radius={7} mt={10} colors={HERO_BONE} />
    </Block>
  );
}

function CardsSkeleton() {
  return (
    <>
      <Panel title="HOURLY FORECAST" aside="Next 10 hours">
        <Block direction="row" gap={14} overflow="hidden">
          {Array.from({ length: 6 }, (_, index) => (
            <Block key={index} gap={10} align="center" w={46}>
              <Skeleton w={34} h={12} radius={6} colors={BONE} />
              <Skeleton shape="circle" w={30} h={30} colors={BONE} />
              <Skeleton w={30} h={16} radius={6} colors={BONE} />
              <Block gap={0} h={12} />
            </Block>
          ))}
        </Block>
      </Panel>
      <Panel title="4-DAY FORECAST">
        <Block gap={0}>
          {Array.from({ length: 4 }, (_, index) => (
            <Block key={index} direction="row" align="center" gap={12} h={48} borderTopWidth={index ? 1 : 0} borderTopColor={LINE}>
              <Skeleton w={44} h={14} radius={7} colors={BONE} />
              <Skeleton shape="circle" w={26} h={26} colors={BONE} />
              <Block gap={0} flex={1}>
                <Skeleton h={5} radius={5} colors={BONE} />
              </Block>
              <Skeleton w={30} h={14} radius={7} colors={BONE} />
            </Block>
          ))}
        </Block>
      </Panel>
      <Block direction="row" wrap="wrap" gap={12}>
        {Array.from({ length: 4 }, (_, index) => (
          <Block key={index} gap={12} basis="47%" grow p={16} bg={PANEL} radius={22} borderWidth={1} borderColor={LINE} mih={128}>
            <Skeleton w={80} h={11} radius={6} colors={BONE} />
            <Skeleton w={64} h={28} radius={8} colors={BONE} />
            <Skeleton w="85%" h={11} radius={6} colors={BONE} />
          </Block>
        ))}
      </Block>
    </>
  );
}

function WeatherScreen() {
  const { height } = useWindowDimensions();
  const heroHeight = Math.max(440, Math.min(520, height * 0.6));
  const [city, setCity] = useState<City>(CITIES[0]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadedCity = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // A refresh keeps the current forecast on screen; a new city starts from the skeleton.
    const refreshing = loadedCity.current === city.name;
    setLoading(true);
    setError(null);
    if (!refreshing) setWeather(null);

    Promise.all([getWeather(city, controller.signal), wait(MIN_LOADING_MS, controller.signal)])
      .then(([next]) => {
        loadedCity.current = city.name;
        setWeather(next);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (!refreshing) loadedCity.current = null;
        setError(cause instanceof Error ? cause.message : 'Could not load weather. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [city, refreshKey]);

  const refresh = () => setRefreshKey(key => key + 1);
  const initialLoad = loading && !weather;
  const conditions = weather ? describeWeather(weather.code) : null;
  const days = weather
    ? [{ date: weather.observedAt.slice(0, 10), code: weather.code, high: weather.high, low: weather.low }, ...weather.forecast]
    : [];
  const range: Range | null = weather
    ? { min: Math.min(...days.map(day => day.low)), max: Math.max(...days.map(day => day.high)) }
    : null;
  const rainChance = weather ? Math.max(...weather.hourly.map(hour => hour.rainChance)) : 0;

  return (
    <SafeArea flex={1} gap={0} bg={PAGE}>
      <StatusBar barStyle="light-content" />
      <ScrollArea flex={1} contentProps={{ w: '100%', maw: 560, alignSelf: 'center', pb: 40, gap: 0 }}>
        <Block gap={0} h={heroHeight} w="100%" overflow="hidden" bg={PAGE}>
          <SceneArt source={SCENES[city.name]} height={heroHeight} />
          <Block gap={0} px={20} pt={14} flex={1}>
            <Block gap={0} direction="row" align="center" justify="space-between">
              <Block direction="row" gap={8}>
                {CITIES.map(option => {
                  const selected = option.name === city.name;
                  return (
                    <Block
                      key={option.name}
                      gap={0}
                      px={15}
                      py={8}
                      radius={20}
                      bg={selected ? '#FFFFFF' : 'rgba(255,255,255,0.16)'}
                      borderWidth={1}
                      borderColor={selected ? '#FFFFFF' : 'rgba(255,255,255,0.22)'}
                      onPress={() => setCity(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.name}
                    >
                      <Text c={selected ? PAGE : '#FFFFFF'} size={13} fw="600">{option.name}</Text>
                    </Block>
                  );
                })}
              </Block>
              <Block
                gap={0}
                w={38}
                h={38}
                radius={19}
                bg="rgba(255,255,255,0.18)"
                align="center"
                justify="center"
                opacity={initialLoad ? 0.45 : 1}
                disabled={loading}
                onPress={refresh}
                accessibilityRole="button"
                accessibilityLabel="Refresh weather"
              >
                {loading && weather ? (
                  <Loader size="xs" color="#FFFFFF" accessibilityLabel="Updating weather" />
                ) : (
                  <IconRefresh color="#FFFFFF" size={18} />
                )}
              </Block>
            </Block>

            <Block gap={0} align="center" pt={92}>
              <Text c="#FFFFFF" size={30} fw="bold" ta="center">{city.name}</Text>
              {initialLoad ? (
                <HeroSkeleton />
              ) : weather && conditions ? (
                <Block gap={0} align="center">
                  <Text c="rgba(255,255,255,0.82)" size={13} mt={4} ta="center">{dateLabel(weather.observedAt)}</Text>
                  <Text c="#FFFFFF" size={96} lh={124} fw="200" ta="center" ml={10}>
                    {Math.round(weather.temperature)}°
                  </Text>
                  <Text c="#FFFFFF" size={19} fw="600" ta="center">{conditions.label}</Text>
                  <Text c="rgba(255,255,255,0.86)" size={14} mt={6} ta="center">
                    H:{Math.round(weather.high)}°  L:{Math.round(weather.low)}°
                  </Text>
                </Block>
              ) : (
                <Block gap={0} align="center">
                  <Text c="rgba(255,255,255,0.82)" size={13} mt={4} ta="center">Forecast unavailable</Text>
                  <Block gap={0} h={124} justify="center">
                    <IconCloudOff color="rgba(255,255,255,0.75)" size={72} strokeWidth={1.25} />
                  </Block>
                </Block>
              )}
            </Block>
          </Block>
        </Block>

        <Block gap={12} px={16} mt={-40}>
          {error ? (
            <Block gap={12} p={18} bg="#2A1F2E" radius={22} borderWidth={1} borderColor="rgba(255,140,140,0.25)">
              <Text c="#FFB4B4" size={11} fw="bold" lts={1.4}>
                {weather ? 'COULDN’T REFRESH' : 'WEATHER UNAVAILABLE'}
              </Text>
              <Text c="#FFFFFF" size={15}>
                {weather ? `${error} Showing the forecast from ${hourLabel(weather.observedAt)}.` : error}
              </Text>
              <Block
                gap={0}
                alignSelf="flex-start"
                px={18}
                py={10}
                radius={12}
                bg="#FFFFFF"
                onPress={refresh}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text c={PAGE} fw="bold" size={13}>Try again</Text>
              </Block>
            </Block>
          ) : null}

          {initialLoad ? (
            <CardsSkeleton />
          ) : weather && range ? (
            <>
              <Panel title="HOURLY FORECAST" aside="Next 10 hours">
                <ScrollArea horizontal showsHorizontalScrollIndicator={false} mx={-18} contentProps={{ direction: 'row', gap: 14, px: 18 }}>
                  {weather.hourly.map((hour, index) => {
                    const hourConditions = describeWeather(hour.code);
                    return (
                      <Block key={hour.time} gap={8} align="center" w={46}>
                        <Text c={index === 0 ? '#FFFFFF' : MUTED} size={12} fw={index === 0 ? 'bold' : '500'}>
                          {index === 0 ? 'Now' : hourLabel(hour.time)}
                        </Text>
                        <Block gap={0} h={30} justify="center">
                          <Text size={24} accessibilityLabel={hourConditions.label}>{hourConditions.symbol}</Text>
                        </Block>
                        <Text c="#FFFFFF" size={16} fw="600">{Math.round(hour.temperature)}°</Text>
                        <Text c={RAIN} size={10} fw="600">{hour.rainChance >= 20 ? `${Math.round(hour.rainChance)}%` : ' '}</Text>
                      </Block>
                    );
                  })}
                </ScrollArea>
              </Panel>

              <Panel title="4-DAY FORECAST">
                <Block gap={0}>
                  {days.map((day, index) => {
                    const dayConditions = describeWeather(day.code);
                    return (
                      <Block key={day.date} gap={12} direction="row" align="center" h={48} borderTopWidth={index ? 1 : 0} borderTopColor={LINE}>
                        <Text c="#FFFFFF" size={15} fw="600" w={52}>{index === 0 ? 'Today' : dayLabel(day.date)}</Text>
                        <Text size={22} w={28} ta="center" accessibilityLabel={dayConditions.label}>{dayConditions.symbol}</Text>
                        <Text c={MUTED} size={15} w={34} ta="right">{Math.round(day.low)}°</Text>
                        <TemperatureBar low={day.low} high={day.high} range={range} />
                        <Text c="#FFFFFF" size={15} fw="600" w={34}>{Math.round(day.high)}°</Text>
                      </Block>
                    );
                  })}
                </Block>
              </Panel>

              <Block direction="row" wrap="wrap" gap={12}>
                <DetailTile icon={<IconTemperature color={MUTED} size={15} />} label="Feels like" value={`${Math.round(weather.feelsLike)}°`} hint={feelsHint(weather)} />
                <DetailTile icon={<IconDroplet color={MUTED} size={15} />} label="Humidity" value={`${Math.round(weather.humidity)}%`} hint={humidityHint(weather.humidity)} />
                <DetailTile icon={<IconWind color={MUTED} size={15} />} label="Wind" value={`${Math.round(weather.windSpeed)} mph`} hint={windHint(weather.windSpeed)} />
                <DetailTile icon={<IconUmbrella color={MUTED} size={15} />} label="Rain" value={`${Math.round(rainChance)}%`} hint="Highest chance in the next 10 hours." />
              </Block>

              <Text c={MUTED} size={11} ta="center" mt={8}>
                {loading ? 'Updating…' : `Updated ${hourLabel(weather.observedAt)}`} · Weather by Open-Meteo · °F
              </Text>
            </>
          ) : null}
        </Block>
      </ScrollArea>
    </SafeArea>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider theme={{ colorScheme: 'dark' }}>
        <WeatherScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
