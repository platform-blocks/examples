# plocks DICOM viewer

A local, educational DICOM workstation example built with `@plocks/ui` components. The opening study is a synthetic 36-slice chest-style stack with no patient data. Use the slice slider or previous/next buttons to scrub, or play the stack with Cine. Window/level presets, manual window and level sliders, zoom, and image inversion update the rendered pixels.

**Open DICOM files** accepts one multi-frame image or multiple single-frame instances from the same series. It sorts instances by DICOM Instance Number (then filename) and shows matrix, pixel spacing, and slice thickness when available. Files are decoded locally. The example supports uncompressed 8/16-bit monochrome little-endian DICOM; compressed, color, big-endian, and advanced transfer syntaxes are unsupported. This is not for clinical decisions.

The interface uses plocks `AppShell`, layout, card, button, badge, segmented control, text, and slider components. The image pixels are drawn with `react-native-svg` paths.

## Run

From the `examples` repository root:

```bash
npm install
npm run web -w @plocks/dicom-viewer
```

Run `npm run typecheck -w @plocks/dicom-viewer` and `npm run test -w @plocks/dicom-viewer` to check the example.
