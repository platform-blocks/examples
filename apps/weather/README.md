# plocks Weather

A city-focused Expo weather app built with `@plocks/ui`. Switch between Phoenix, Seattle, and New York to see live current conditions, the next ten hours, a three-day forecast, and humidity, wind, and feels-like details. Each city has its own illustrated landscape. Forecasts come from [Open-Meteo](https://open-meteo.com/); no API key or location permission is needed.

## Run

From the `examples` repository root:

```bash
npm install
npm run web -w @plocks/weather
```

Use `npm run start -w @plocks/weather` for Expo Go, or the `ios` and `android` scripts for local native builds. The app needs an internet connection to fetch weather data.

The screen uses plocks layout and text primitives with a scene-backed hero. Start with [`App.tsx`](./App.tsx) to adapt the design, or [`weather.ts`](./weather.ts) to change the cities and forecast request.
