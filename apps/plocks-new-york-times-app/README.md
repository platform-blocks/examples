# The Daily Edition

An original editorial news reader example built with Plocks. It includes a lead story, section feeds, search, full article reading views, saved stories, read history, and clearly labeled fictional ad placements. The stories, bylines, sponsors, and artwork are sample content; no live news feed or ad network is connected.

The app uses `@plocks/ui` for typography and icons, React Native for layout, and AsyncStorage for saved and read state. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `plocks-example-apps` repository root:

```bash
npm install
npm run web -w @plocks/new-york-times-app
```

Use `npm run start -w @plocks/new-york-times-app` for Expo, or `npm run typecheck -w @plocks/new-york-times-app` to check TypeScript.
