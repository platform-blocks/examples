# plocks example apps

Standalone Expo example apps built with [plocks](https://github.com/platform-blocks/plocks). Each app lives in `apps/plocks-*-app`; shared example layout components live in `apps/example-common`.

## Run locally

The plocks packages have not yet been published to npm. Clone this repository beside the main `plocks` checkout, so the directory layout is:

```text
platform-blocks/
  plocks/
  plocks-example-apps/
```

Then install dependencies from this repository root and start an app:

```sh
npm install
npm run start -w @plocks/weather-app
```

The other app package names are in their respective `package.json` files. The native apps use Expo SDK 57. Once the plocks packages are published, the local `file:` dependencies can be replaced with npm versions.

## Expo Snack

Run `npm run snack:generate` to refresh `snacks/` and `snack-manifest.json`. This creates Snack-ready copies of all apps with an `App.tsx` entry: imports use `@plocks/ui-snack`, and local media files are included. After generating, copy `snack-manifest.json` to `plocks/apps/docs/config/appSnackManifest.json`. The docs site uses that manifest to build short Snack links that load these files from GitHub raw URLs. Snack runs on Expo SDK 54, so it uses the published plocks packages rather than the local checkout. The Snack links can be enabled after `@plocks/ui`, `@plocks/ui-snack`, and `@plocks/carousel` are published and this repository is public.

All 28 current apps have an `App.tsx` entry and a generated Snack source bundle.
