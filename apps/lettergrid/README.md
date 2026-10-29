# plocks Lettergrid

A five-letter word game with six guesses and position-aware color clues.

The board sizes itself to fill the screen above an on-screen keyboard whose keys take the best clue found for each letter. On web, the physical keyboard works too. Tiles pop as you type and flip in turn to reveal their colors; a short message reports short guesses, a win or the answer. Use the header buttons to start a new puzzle or switch between light and dark themes.

This standalone Expo example uses `@plocks/ui` components with a `PlocksProvider` theme. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/lettergrid
```

Use `npm run start -w @plocks/lettergrid` for Expo, or `npm run typecheck -w @plocks/lettergrid` to check TypeScript.
