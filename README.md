# Examples

Standalone Expo example apps built with [plocks](https://github.com/platform-blocks/plocks). Each app lives in `apps/<slug>`; shared example layout components live in `apps/example-common`.

## Run locally

These examples use local `file:` dependencies to exercise the current plocks source. Place this checkout beside the main `plocks` checkout, so the directory layout is:

```text
<workspace>/
  plocks/
  examples/
```

Then install dependencies from this repository root and start an app:

```sh
npm install
npm run start -w @plocks/weather
```

The other app package names are in their respective `package.json` files. The native apps use Expo SDK 57. Published npm packages are available for independent projects; these examples retain local dependencies to test the current source.

## Explore web demos

From the sibling `plocks` checkout, run `npm run site:build-with-demos` to build the docs gallery with all 28 live web demos and browsable source pages. Serve `plocks/apps/docs/dist` as a static site; the gallery is at `/examples/`, with each app at `/demos/<app>/` and its source at `/demos/<app>/source.html`.

To export the apps without building the docs, run `npm run web:export -- <output-directory>`. Pass an optional app slug as the second argument to export a single app.

## UI convention

App layouts and controls use plocks components with named props. For example:

```tsx
<ScrollArea contentProps={{ p: 20, gap: 12 }}>
  <Block direction="row" align="center" justify="space-between">
    <Text fw="bold" size={20}>Today</Text>
    <Button title="Add" onPress={addItem} />
  </Block>
</ScrollArea>
```

Run `npm run validate:ui` to check every app and generated Snack for direct native layout elements or inline style props. The same check runs during `npm run typecheck`.

## Expo Snack

Run `npm run snack:generate` to refresh `snacks/` and `snack-manifest.json`. This creates Snack-ready copies of all apps with an `App.tsx` entry: imports use `@plocks/ui-snack`, and local media files are included. After generating, copy `snack-manifest.json` to `plocks/apps/docs/config/appSnackManifest.json`. The docs site uses that manifest to build Snack links that load these files from GitHub raw URLs. Snack runs on Expo SDK 54, so it uses published plocks packages rather than the local checkout. The gallery exposes native Snack links only for apps verified on that SDK; generated source bundles for the others are not yet native previews.

All 28 current apps have an `App.tsx` entry and a generated Snack source bundle.
