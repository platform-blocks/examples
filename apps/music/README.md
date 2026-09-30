# Frequency

A small music streaming app example built with plocks and Expo. It includes a home feed with a plocks Carousel, five playlists, search, a persistent liked-songs library, and a queue-based player with skip and seek controls. The six bundled MP3 loops were generated for this example, so playback works without an account or API key.

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/music
```

Use `npm run start -w @plocks/music` for Expo Go, or `npm run ios -w @plocks/music` and `npm run android -w @plocks/music` for local native builds.

## Structure

- `App.tsx` contains the plocks interface and player interactions.
- `catalog.ts` defines the songs, artwork colors, and playlists.
- `assets/audio/` contains the bundled demo tracks; `scripts/generate_demo_audio.py` recreates them with NumPy and FFmpeg.

Run `npm run typecheck -w @plocks/music` to check the app. The local declarations in `types/vendor.d.ts` cover React Native internals referenced by Expo 57's published TypeScript source.
