# plocks Weather

A city-focused Expo weather app built with `@plocks/ui`. Switch between Phoenix, Seattle, and New York to see live current conditions, the next ten hours, a four-day forecast, and feels-like, humidity, wind, and rain details. While a forecast loads, `Skeleton` placeholders hold the shape of each section; a refresh keeps the current forecast on screen, and a failed request shows a retry card. Each city has its own illustrated landscape. Forecasts come from [Open-Meteo](https://open-meteo.com/); no API key or location permission is needed.

## Run

From the `examples` repository root:

```bash
npm install
npm run web -w @plocks/weather
```

Use `npm run start -w @plocks/weather` for Expo Go, or the `ios` and `android` scripts for local native builds. The app needs an internet connection to fetch weather data.

The screen uses plocks layout, `Image`, `Gradient`, and `Skeleton` components with a scene-backed hero; each scene is a dimmed backdrop behind the text. Start with [`App.tsx`](./App.tsx) to adapt the design, or [`weather.ts`](./weather.ts) to change the cities and forecast request.
