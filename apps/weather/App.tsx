import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Block, Icon, Loader, PlocksProvider, SafeArea, ScrollArea, Text } from '@plocks/ui';

import { CITIES, dayLabel, describeWeather, getWeather, hourLabel, type City, type ForecastDay, type Weather } from './weather';

const PAGE = '#0B172A';
const PANEL = '#1A2A43';
const LINE = 'rgba(255,255,255,0.12)';
const MUTED = '#A9BBD4';
const SCENES: Record<City['name'], ImageSourcePropType> = {
  Phoenix: require('./assets/scene-desert.webp'),
  Seattle: require('./assets/scene-lake.webp'),
  'New York': require('./assets/scene-city.webp'),
};

function dateLabel(observedAt: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${observedAt.slice(0, 10)}T12:00:00Z`));
}

function Surface({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Block gap={0} p={18} bg={PANEL} radius={24} borderWidth={1} borderColor={LINE} style={style}>
      {children}
    </Block>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text c={MUTED} size={11} fw="bold" lts={1.6}>{children}</Text>;
}

function TemperatureRange({ day, min, max }: { day: ForecastDay; min: number; max: number }) {
  const span = Math.max(1, max - min);
  const left = ((day.low - min) / span) * 100;
  const width = Math.max(6, ((day.high - day.low) / span) * 100);
  return (
    <View style={{ flex: 1, height: 5, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.14)' }}>
      <LinearGradient
        colors={['#72C9F7', '#F6BC78']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: 0, height: 5, borderRadius: 5 }}
      />
    </View>
  );
}

function DetailTile({ symbol, label, value, hint }: { symbol: string; label: string; value: string; hint: string }) {
  return (
    <Block gap={5} flex={1} p={14} bg={PANEL} radius={20} borderWidth={1} borderColor={LINE} miw={0}>
      <Text size={22} accessibilityLabel={label}>{symbol}</Text>
      <Text c={MUTED} size={10} fw="bold" lts={1.1}>{label.toUpperCase()}</Text>
      <Text c="#FFFFFF" size={20} fw="bold" numberOfLines={1}>{value}</Text>
      <Text c={MUTED} size={10} numberOfLines={1}>{hint}</Text>
    </Block>
  );
}

function WeatherScreen() {
  const { height } = useWindowDimensions();
  const heroHeight = Math.max(450, Math.min(560, height * 0.66));
  const [city, setCity] = useState<City>(CITIES[0]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setWeather(null);

    getWeather(city, controller.signal)
      .then(setWeather)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Could not load weather. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [city, refreshKey]);

  const conditions = weather ? describeWeather(weather.code) : null;
  const range = weather
    ? {
        min: Math.min(weather.low, ...weather.forecast.map(day => day.low)),
        max: Math.max(weather.high, ...weather.forecast.map(day => day.high)),
      }
    : null;

  return (
    <SafeArea flex={1} gap={0} bg={PAGE}>
      <StatusBar barStyle="light-content" />
      <ScrollArea contentProps={{ w: '100%', maw: 560, alignSelf: 'center', pb: 36, gap: 0 }}>
        <ImageBackground source={SCENES[city.name]} resizeMode="cover" style={{ height: heroHeight, width: '100%' }}>
          <LinearGradient
            colors={['rgba(6,16,34,0.58)', 'rgba(7,18,36,0.28)', PAGE]}
            locations={[0, 0.49, 1]}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Block gap={0} px={22} pt={18} flex={1}>
            <Block gap={0} direction="row" align="center" justify="space-between">
              <Block gap={4} direction="row" align="center">
                <Icon name="location" color="#FFFFFF" size={17} />
                <Text c="#FFFFFF" size={12} fw="bold" lts={1.6}>LOCAL FORECAST</Text>
              </Block>
              <Pressable
                onPress={() => setRefreshKey(key => key + 1)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Refresh weather"
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.5 : 1 }}
              >
                <Icon name="refresh" color="#FFFFFF" size={18} />
              </Pressable>
            </Block>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 24, marginHorizontal: -2 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
              {CITIES.map(option => {
                const selected = option.name === city.name;
                return (
                  <Pressable
                    key={option.name}
                    onPress={() => setCity(option)}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.name}${selected ? ', selected' : ''}`}
                    style={{ paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.2)' }}
                  >
                    <Text c={selected ? PAGE : '#FFFFFF'} size={12} fw="bold">{option.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Block gap={0} align="center" pt={39}>
              <Text c="#FFFFFF" size={31} fw="bold" ta="center">{city.name}</Text>
              <Text c="rgba(255,255,255,0.82)" size={13} mt={5} ta="center">
                {weather ? dateLabel(weather.observedAt) : 'Your daily outlook'}
              </Text>
              {loading ? (
                <Block gap={16} align="center" pt={62}>
                  <Loader accessibilityLabel="Loading weather" color="#FFFFFF" />
                  <Text c="#FFFFFF" size={14}>Getting the latest forecast…</Text>
                </Block>
              ) : weather && conditions ? (
                <Block gap={0} align="center" pt={15}>
                  <Text c="#FFFFFF" size={108} lh={120} fw="300" ta="center">
                    {Math.round(weather.temperature)}°
                  </Text>
                  <Text c="#FFFFFF" size={19} fw="600" ta="center">{conditions.label}</Text>
                  <Text c="rgba(255,255,255,0.86)" size={14} mt={6} ta="center">
                    H:{Math.round(weather.high)}°  L:{Math.round(weather.low)}°
                  </Text>
                </Block>
              ) : (
                <Block gap={0} align="center" pt={36}>
                  <Text c="#FFFFFF" size={90} lh={108}>--°</Text>
                  <Text c="#FFFFFF" size={16}>Forecast unavailable</Text>
                </Block>
              )}
            </Block>
          </Block>
        </ImageBackground>

        <Block gap={14} px={16} style={{ marginTop: -46 }}>
          {error ? (
            <Surface>
              <Block gap={14}>
                <SectionTitle>WEATHER UNAVAILABLE</SectionTitle>
                <Text c="#FFFFFF" size={15}>{error}</Text>
                <Pressable onPress={() => setRefreshKey(key => key + 1)} accessibilityRole="button" accessibilityLabel="Try again" style={{ alignSelf: 'flex-start', paddingHorizontal: 17, paddingVertical: 10, borderRadius: 12, backgroundColor: '#D7E8FF' }}>
                  <Text c={PAGE} fw="bold" size={13}>Try again</Text>
                </Pressable>
              </Block>
            </Surface>
          ) : weather ? (
            <>
              <Surface>
                <Block gap={16}>
                  <Block direction="row" align="center" justify="space-between" gap={0}>
                    <SectionTitle>HOURLY FORECAST</SectionTitle>
                    <Text c={MUTED} size={11}>Next 10 hours</Text>
                  </Block>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 17 }}>
                    {weather.hourly.map((hour, index) => (
                      <Block key={hour.time} gap={7} align="center" w={49}>
                        <Text c={index === 0 ? '#FFFFFF' : MUTED} size={12} fw={index === 0 ? 'bold' : 'normal'}>
                          {index === 0 ? 'Now' : hourLabel(hour.time)}
                        </Text>
                        <Text size={27} accessibilityLabel={describeWeather(hour.code).label}>{describeWeather(hour.code).symbol}</Text>
                        <Text c="#FFFFFF" size={16} fw="bold">{Math.round(hour.temperature)}°</Text>
                        <Text c="#82CDF4" size={10}>{hour.rainChance > 10 ? `${Math.round(hour.rainChance)}%` : ' '}</Text>
                      </Block>
                    ))}
                  </ScrollView>
                </Block>
              </Surface>

              <Surface>
                <Block gap={10}>
                  <SectionTitle>3-DAY FORECAST</SectionTitle>
                  {weather.forecast.map((day, index) => (
                    <Block key={day.date} gap={0} direction="row" align="center" py={9} borderTopWidth={index ? 1 : 0} borderTopColor={LINE}>
                      <Text c="#FFFFFF" size={14} fw="600" w={53}>{dayLabel(day.date)}</Text>
                      <Text size={23} w={37} accessibilityLabel={describeWeather(day.code).label}>{describeWeather(day.code).symbol}</Text>
                      <Text c={MUTED} size={14} w={34}>{Math.round(day.low)}°</Text>
                      <TemperatureRange day={day} min={range?.min ?? day.low} max={range?.max ?? day.high} />
                      <Text c="#FFFFFF" size={14} fw="bold" w={40} ta="right">{Math.round(day.high)}°</Text>
                    </Block>
                  ))}
                </Block>
              </Surface>

              <Block direction="row" gap={10}>
                <DetailTile symbol="🌡️" label="Feels like" value={`${Math.round(weather.feelsLike)}°`} hint="Right now" />
                <DetailTile symbol="💧" label="Humidity" value={`${Math.round(weather.humidity)}%`} hint="In the air" />
                <DetailTile symbol="↗" label="Wind" value={`${Math.round(weather.windSpeed)}`} hint="mph" />
              </Block>
              <Text c={MUTED} size={11} ta="center" mt={9}>
                Updated {hourLabel(weather.observedAt)} · Weather by Open-Meteo · °F
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
