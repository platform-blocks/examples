# Diamond Game Day

A standalone Expo baseball example built with plocks components. It shows a fictional league with three app views:

- **Scores** — a live demo matchup alongside sample final and upcoming games.
- **Gamecast** — a field visualizer, pitch-by-pitch play log, and inning box score. Tap **Next pitch** to advance the simulation; **Reset simulation** restores the seventh-inning starting point.
- **Standings** — sample Coast and Inland division tables.

The UI uses `PlocksProvider`, `AppShell`, `Block`, `Card`, `Row`, `Column`, `SegmentedControl`, `Scroller`, `Button`, `Badge`, `Divider`, `Text`, and `Title` from `@plocks/ui`. The app does not render React Native UI primitives directly.

The files are organized by responsibility: [`App.tsx`](./App.tsx) wires navigation and state, [`screens/`](./screens) contains the views, [`components/`](./components) holds reusable baseball UI, and [`game/engine.ts`](./game/engine.ts) handles the simulation rules. Teams and schedules in [`data.ts`](./data.ts) are fictional. There is no live sports feed.

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/baseball-live
```

Use `npm run start -w @plocks/baseball-live` for Expo. Run `npm run typecheck -w @plocks/baseball-live` and `npm run test -w @plocks/baseball-live` to verify the app and game rules.
