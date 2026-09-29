# plocks Fitbit-style activity

A wellness dashboard with sample steps, activity, sleep, daily history, and quick logging. No wearable connection.

This standalone Expo example uses `@plocks/ui` components through the shared [`ExampleUI.tsx`](../example-common/ExampleUI.tsx) layout and a light or dark `PlocksProvider` theme. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/fitbit-app
```

Use `npm run start -w @plocks/fitbit-app` for Expo, or `npm run typecheck -w @plocks/fitbit-app` to check TypeScript.
