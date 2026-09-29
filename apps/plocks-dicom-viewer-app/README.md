# plocks DICOM viewer

A local viewer for uncompressed 8/16-bit grayscale little-endian DICOM files, with frame navigation, zoom, and window/level presets. It opens on a synthetic study for easy exploration. Compressed, color, and advanced studies are unsupported; do not use it for clinical decisions.

This standalone Expo example uses `@plocks/ui` components through the shared [`ExampleUI.tsx`](../example-common/ExampleUI.tsx) layout and a light or dark `PlocksProvider` theme. Its main interaction lives in [`App.tsx`](./App.tsx).

## Run

From the `plocks` repository root:

```bash
npm install
npm run web -w @plocks/dicom-viewer-app
```

Use `npm run start -w @plocks/dicom-viewer-app` for Expo, or `npm run typecheck -w @plocks/dicom-viewer-app` to check TypeScript.
