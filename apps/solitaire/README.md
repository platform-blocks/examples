# plocks Solitaire

A playable, mobile-first Klondike solitaire example for iOS, Android, and web. The felt table, cards, top stats bar, and bottom action bar are built from plocks Blocks, Gradients, MotionBlocks, Text, Buttons, Switches, and Dialogs. Cards are sized from the available screen so all seven columns fit a phone in portrait; on tablets and desktops they scale up to a maximum size and the table is centered, and landscape phones move the actions to a side rail.

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/solitaire
```

Use `npm run start -w @plocks/solitaire` for Expo Go. `npm run ios -w @plocks/solitaire` and `npm run android -w @plocks/solitaire` run local native builds.

## Play

This is draw-one Klondike. Build tableau columns down in alternating colors and foundations up by suit from aces. Only kings can fill empty columns. Tap the stock to draw; when it is empty, tap it again to recycle the waste (-100 points).

With **Tap to auto-move** on (the default), tapping a card sends it to the best legal spot: its foundation first, then a tableau column. Turn it off in the menu to tap a card and then its destination; green outlines show legal destinations. Undo reverses the last action, Hint outlines a suggested move, and New deals a fresh game. The menu also has a left-handed table option that swaps the stock and foundations. Once every card is face up and the stock is empty, Auto-finish plays the remaining cards home. Winning shows a summary with score, time, and moves. Scoring follows standard Klondike values (+10 to a foundation, +5 waste to tableau, +5 for turning a card, -15 from a foundation back to the tableau).

The pure rules and state transitions are in [`game.ts`](./game.ts). The plocks interface is in [`App.tsx`](./App.tsx).

```bash
npm run test -w @plocks/solitaire
npm run typecheck -w @plocks/solitaire
```
