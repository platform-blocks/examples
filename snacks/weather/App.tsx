import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Column, PlocksProvider, Text, Title, useTheme } from '@plocks/ui-snack';

import { CITIES, dayLabel, describeWeather, getWeather, type City, type Weather } from './weather';

function WeatherScreen() {
  const theme = useTheme();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.backgrounds.base }}>
      <ScrollView
        contentContainerStyle={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, gap: 20 }}
      >
        <Column gap="xs">
          <Text variant="small" c="secondary">PLOCKS EXAMPLE</Text>
          <Title order={1}>Weather</Title>
          <Text c="secondary">A quick look at the sky.</Text>
        </Column>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CITIES.map((option) => (
            <Button
              key={option.name}
              title={option.name}
              size="sm"
              variant={option.name === city.name ? 'filled' : 'outline'}
              accessibilityLabel={`${option.name}${option.name === city.name ? ', selected' : ''}`}
              onPress={() => setCity(option)}
            />
          ))}
        </View>

        {loading ? (
          <Card variant="elevated" p="xl">
            <View style={{ alignItems: 'center', paddingVertical: 56, gap: 16 }}>
              <ActivityIndicator accessibilityLabel="Loading weather" />
              <Text c="secondary">Loading weather for {city.name}…</Text>
            </View>
          </Card>
        ) : error ? (
          <Card variant="elevated" p="xl">
            <Column gap="md">
              <Title order={3}>Weather unavailable</Title>
              <Text c="secondary">{error}</Text>
              <Button title="Try again" onPress={() => setRefreshKey((key) => key + 1)} />
            </Column>
          </Card>
        ) : weather && conditions ? (
          <>
            <Card variant="elevated" p="xl">
              <Column gap="lg">
                <Column gap="xs">
                  <Text variant="small" c="secondary">CURRENT CONDITIONS · {city.name.toUpperCase()}</Text>
                  <Text style={{ fontSize: 64, lineHeight: 78 }} accessibilityLabel={conditions.label}>
                    {conditions.symbol}
                  </Text>
                  <Title order={1}>{Math.round(weather.temperature)}°F</Title>
                  <Text>{conditions.label}</Text>
                  <Text c="secondary">
                    High {Math.round(weather.high)}° · Low {Math.round(weather.low)}°
                  </Text>
                </Column>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <Metric label="Feels like" value={`${Math.round(weather.feelsLike)}°F`} />
                  <Metric label="Humidity" value={`${Math.round(weather.humidity)}%`} />
                  <Metric label="Wind" value={`${Math.round(weather.windSpeed)} mph`} />
                </View>
              </Column>
            </Card>

            <Column gap="sm">
              <Title order={3}>Next three days</Title>
              {weather.forecast.map((day) => {
                const forecast = describeWeather(day.code);
                return (
                  <Card key={day.date} p="md" style={{ width: '100%' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 26 }} accessibilityLabel={forecast.label}>
                        {forecast.symbol}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text fw="bold">{dayLabel(day.date)}</Text>
                        <Text variant="small" c="secondary">{forecast.label}</Text>
                      </View>
                      <Text>{Math.round(day.high)}° / {Math.round(day.low)}°</Text>
                    </View>
                  </Card>
                );
              })}
            </Column>
          </>
        ) : null}

        <Button
          title="Refresh weather"
          variant="outline"
          disabled={loading}
          onPress={() => setRefreshKey((key) => key + 1)}
        />
        <Text variant="small" c="secondary" ta="center">
          Weather data by Open-Meteo · Temperatures in °F
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Column gap="xs" fullWidth={false} style={{ flexGrow: 1, minWidth: 105 }}>
      <Text variant="small" c="secondary">{label}</Text>
      <Text fw="bold">{value}</Text>
    </Column>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlocksProvider>
        <StatusBar barStyle="default" />
        <WeatherScreen />
      </PlocksProvider>
    </SafeAreaProvider>
  );
}
