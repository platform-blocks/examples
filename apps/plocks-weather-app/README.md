# plocks Weather

A minimal Expo weather app built with `@plocks/ui`. Choose Phoenix, Seattle, or New York to see current conditions and a three-day forecast. Data comes from [Open-Meteo](https://open-meteo.com/); no API key or location permission is needed.

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/weather-app
```

Use `npm run start -w @plocks/weather-app` for Expo Go, or the `ios` and `android` scripts for local native builds. The app needs an internet connection to fetch weather data.

The UI uses plocks `PlocksProvider`, `Card`, `Button`, `Text`, `Title`, and layout components. Start with [`App.tsx`](./App.tsx) to adapt the screen, or [`weather.ts`](./weather.ts) to change the cities and forecast request.
