# plocks Solitaire

A playable, single-screen Klondike solitaire example for iOS, Android, and web. The game uses plocks Cards for the playing cards and slots, plus plocks Buttons, typography, and layouts for the rest of the interface.

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/solitaire
```

Use `npm run start -w @plocks/solitaire` for Expo Go. `npm run ios -w @plocks/solitaire` and `npm run android -w @plocks/solitaire` run local native builds.

## Play

This is draw-one Klondike. Tap a face-up card, or any card at the start of a descending alternating-color run, then tap a tableau column or foundation. Gold outlines show legal destinations. Build tableau columns down in alternating colors and foundations up by suit from aces. Only kings can fill empty tableau columns. Tap the stock to draw; when empty, tap it again to recycle the waste. Undo reverses the last action, Hint selects a suggested card, and New deal shuffles a fresh game. The game is won when all four foundations are complete.

The pure rules and state transitions are in [`game.ts`](./game.ts). The plocks interface is in [`App.tsx`](./App.tsx).

```bash
npm run test -w @plocks/solitaire
npm run typecheck -w @plocks/solitaire
```
