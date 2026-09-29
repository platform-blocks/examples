# plocks NPR-style news

An audio-news-inspired reading screen with search, saved stories, and a sample playback timer. Headlines and summaries are original sample content; no live feed or audio.

This standalone Expo example uses `@plocks/ui` components through the shared [`ExampleUI.tsx`](../example-common/ExampleUI.tsx) layout and a light or dark `PlocksProvider` theme. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/npr-app
```

Use `npm run start -w @plocks/npr-app` for Expo, or `npm run typecheck -w @plocks/npr-app` to check TypeScript.
