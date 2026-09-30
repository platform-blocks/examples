export const CITIES = [
  { name: 'Phoenix', latitude: 33.45, longitude: -112.07 },
  { name: 'Seattle', latitude: 47.61, longitude: -122.33 },
  { name: 'New York', latitude: 40.71, longitude: -74.01 },
] as const;

export type City = (typeof CITIES)[number];

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  code: number;
}

export interface ForecastHour {
  time: string;
  temperature: number;
  code: number;
  rainChance: number;
}

export interface Weather {
  observedAt: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  code: number;
  high: number;
  low: number;
  forecast: ForecastDay[];
  hourly: ForecastHour[];
}

export function describeWeather(code: number): { label: string; symbol: string } {
  if (code === 0) return { label: 'Clear sky', symbol: '☀️' };
  if (code <= 2) return { label: 'Partly cloudy', symbol: '🌤️' };
  if (code === 3) return { label: 'Cloudy', symbol: '☁️' };
  if (code <= 48) return { label: 'Foggy', symbol: '🌫️' };
  if (code <= 67) return { label: 'Rainy', symbol: '🌧️' };
  if (code <= 77) return { label: 'Snowy', symbol: '❄️' };
  if (code <= 82) return { label: 'Showers', symbol: '🌦️' };
  if (code <= 86) return { label: 'Snow showers', symbol: '🌨️' };
  if (code <= 99) return { label: 'Thunderstorms', symbol: '⛈️' };
  return { label: 'Conditions unavailable', symbol: '🌡️' };
}

export function dayLabel(date: string): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function hourLabel(time: string): string {
  const hour = Number(time.slice(11, 13));
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function getWeather(city: City, signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '4',
    forecast_hours: '12',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error('Weather service is unavailable. Please try again.');

  const data = await response.json();
  const current = data?.current;
  const daily = data?.daily;
  const hourly = data?.hourly;
  if (
    typeof current?.time !== 'string' ||
    !isNumber(current?.temperature_2m) ||
    !isNumber(current?.apparent_temperature) ||
    !isNumber(current?.relative_humidity_2m) ||
    !isNumber(current?.wind_speed_10m) ||
    !isNumber(current?.weather_code) ||
    !Array.isArray(daily?.time) ||
    !Array.isArray(daily?.weather_code) ||
    !Array.isArray(daily?.temperature_2m_max) ||
    !Array.isArray(daily?.temperature_2m_min) ||
    !Array.isArray(hourly?.time) ||
    !Array.isArray(hourly?.temperature_2m) ||
    !Array.isArray(hourly?.weather_code) ||
    !Array.isArray(hourly?.precipitation_probability) ||
    hourly.time.length < 10 ||
    hourly.temperature_2m.length < 10 ||
    hourly.weather_code.length < 10 ||
    hourly.precipitation_probability.length < 10 ||
    !hourly.time.slice(0, 10).every((time: unknown) => typeof time === 'string') ||
    !hourly.temperature_2m.slice(0, 10).every(isNumber) ||
    !hourly.weather_code.slice(0, 10).every(isNumber) ||
    !hourly.precipitation_probability.slice(0, 10).every(isNumber) ||
    daily.time.length < 4 ||
    daily.weather_code.length < 4 ||
    daily.temperature_2m_max.length < 4 ||
    daily.temperature_2m_min.length < 4 ||
    !daily.time.slice(0, 4).every((date: unknown) => typeof date === 'string') ||
    !daily.weather_code.slice(0, 4).every(isNumber) ||
    !daily.temperature_2m_max.slice(0, 4).every(isNumber) ||
    !daily.temperature_2m_min.slice(0, 4).every(isNumber)
  ) {
    throw new Error('Weather data is incomplete. Please try again.');
  }

  const forecast: ForecastDay[] = daily.time.slice(1, 4).map((date: string, index: number) => ({
    date,
    code: daily.weather_code[index + 1],
    high: daily.temperature_2m_max[index + 1],
    low: daily.temperature_2m_min[index + 1],
  }));

  const hours: ForecastHour[] = hourly.time.slice(0, 10).map((time: string, index: number) => ({
    time,
    temperature: hourly.temperature_2m[index],
    code: hourly.weather_code[index],
    rainChance: hourly.precipitation_probability[index],
  }));

  return {
    observedAt: current.time,
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    code: current.weather_code,
    high: daily.temperature_2m_max[0],
    low: daily.temperature_2m_min[0],
    forecast,
    hourly: hours,
  };
}
