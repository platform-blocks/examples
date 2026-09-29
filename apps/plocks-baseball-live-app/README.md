# plocks Baseball live visualizer

A simulated pitch-by-pitch baseball board with inning, count, bases, and score. No live league feed.

This standalone Expo example uses `@plocks/ui` components through the shared [`ExampleUI.tsx`](../example-common/ExampleUI.tsx) layout and a light or dark `PlocksProvider` theme. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/baseball-live-app
```

Use `npm run start -w @plocks/baseball-live-app` for Expo, or `npm run typecheck -w @plocks/baseball-live-app` to check TypeScript.
