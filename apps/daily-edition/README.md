# The Daily Edition

An original editorial news reader example built with Plocks. It includes a lead story, section feeds, search, full article reading views, saved stories, read history, and clearly labeled fictional ad placements. The stories, bylines, sponsors, and artwork are sample content; no live news feed or ad network is connected.

The app uses `@plocks/ui` for typography and icons, React Native for layout, and AsyncStorage for saved and read state. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `examples` repository root:

```bash
npm install
npm run web -w @plocks/daily-edition
```

Use `npm run start -w @plocks/daily-edition` for Expo, or `npm run typecheck -w @plocks/daily-edition` to check TypeScript.
