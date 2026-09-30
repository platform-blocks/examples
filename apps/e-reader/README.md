# E-Reader

A modern reading and listening example built with `@plocks/ui`. It includes an
original three-chapter story, a chapter list, persistent bookmarks and reading
position, text size and theme controls, and a compact narration player.

Narration uses the device's text-to-speech voice through `expo-speech`. Word
boundary events move plocks `Highlight` through the text as it is spoken.
When a voice does not provide boundaries, the highlight advances at an
estimated pace. Tap a paragraph to listen from its beginning; the player can
pause, skip paragraphs, and change speed.

## Run

From the `examples` repository root:

```bash
npm install
npm run web -w @plocks/e-reader
```

Use `npm run start -w @plocks/e-reader` for Expo, or
`npm run typecheck -w @plocks/e-reader` to check TypeScript.
