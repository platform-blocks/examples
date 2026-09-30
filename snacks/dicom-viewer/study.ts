import type { DicomImage } from './dicom';

export type Study = {
  name: string;
  images: DicomImage[];
  frames: { image: DicomImage; frame: number }[];
  isSample: boolean;
};

const SIZE = 160;
const SLICES = 36;

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;

const soft = (v: number, edge = 0.035) => Math.max(0, Math.min(1, (1 - v) / edge));

/** A deterministic, purely synthetic chest CT-style volume for exploring controls. */
export function createSampleStudy(): Study {
  const values = new Float32Array(SIZE * SIZE * SLICES);
  for (let z = 0; z < SLICES; z++) {
    const phase = (z - (SLICES - 1) / 2) / SLICES;
    const bodyWidth = 0.8 - Math.abs(phase) * 0.17;
    const lungSize = 1 - Math.abs(phase) * 0.35;
    for (let py = 0; py < SIZE; py++) for (let px = 0; px < SIZE; px++) {
      const x = (px + .5 - SIZE / 2) / (SIZE / 2);
      const y = (py + .5 - SIZE / 2) / (SIZE / 2);
      const grain = (Math.sin(px * 47.71 + py * 13.37 + z * 7.13) * Math.sin(py * 31.19 - px * 17.23)) * 13;
      const body = ellipse(x, y, 0, .035, bodyWidth, .68);
      let hu = -1000;
      if (body < 1) {
        hu = 38 + grain;
        if (body > .88) hu = -95 + grain * 2; // subcutaneous rim
        const leftLung = ellipse(x, y, -.32, -.05 + phase * .08, .235 * lungSize, .37 * lungSize);
        const rightLung = ellipse(x, y, .32, -.05 + phase * .08, .235 * lungSize, .37 * lungSize);
        if (leftLung < 1 || rightLung < 1) {
          const parenchyma = Math.sin(px * .48 + z * .19) * Math.cos(py * .51 - z * .11) * 40;
          hu = -780 + grain * 5 + parenchyma;
          for (const side of [-1, 1]) {
            const inside = side < 0 ? leftLung < 1 : rightLung < 1;
            if (!inside) continue;
            const hilumX = side * (.17 + .07 * Math.cos(y * 3 + phase));
            if (Math.abs(x - hilumX) < .018 && y > -.23 && y < .2) hu = -140 + grain;
            for (let branch = 0; branch < 4; branch++) {
              const originY = -.25 + branch * .135 + phase * .03;
              const offsetY = y - originY;
              const branchX = side * (.18 + (branch % 2 ? .32 : .43) * Math.abs(offsetY));
              if (offsetY > -.03 && offsetY < .22 && Math.abs(x - branchX) < .008 + offsetY * .014)
                hu = -300 + grain * 2;
            }
          }
        }
        const heart = ellipse(x, y, .075 + phase * .11, .19, .21, .21);
        if (heart < 1) hu = 65 + grain;
        const spine = ellipse(x, y, 0, .48, .105, .115);
        if (spine < 1) hu = 800 * soft(spine, .25) + 90;
        const canal = ellipse(x, y, 0, .43, .037, .038);
        if (canal < 1) hu = 45;
        const aorta = ellipse(x, y, -.105, .31 + phase * .04, .045, .05);
        if (aorta < 1) hu = 135;
        for (const side of [-1, 1]) {
          const ribBand = Math.abs(ellipse(x, y, side * .31, .02, .43, .52) - .96);
          if (ribBand < .045 && body < .88 && ((Math.atan2(y, x * side) + 4) * 5 + z * .13) % 2.5 < 1.65) hu = 650 + grain * 2;
          const vessel = ellipse(x, y, side * (.30 + phase * .035), -.02, .013, .17);
          if (vessel < 1 && (leftLung < 1 || rightLung < 1)) hu = -180;
        }
      }
      values[z * SIZE * SIZE + py * SIZE + px] = hu;
    }
  }
  const image: DicomImage = { width: SIZE, height: SIZE, frames: SLICES, values,
    window: 400, level: 40, inverted: false, modality: 'CT',
    seriesDescription: 'Synthetic chest · axial', pixelSpacing: '0.80\\0.80', sliceThickness: '2.5' };
  return { name: 'CHEST · SYNTHETIC STUDY', images: [image],
    frames: Array.from({ length: SLICES }, (_, frame) => ({ image, frame })), isSample: true };
}

/** Order individual DICOM instances and flatten any multi-frame images into one stack. */
export function createFileStudy(files: { name: string; image: DicomImage }[]): Study {
  if (!files.length) throw new Error('Choose at least one DICOM file.');
  const sorted = [...files].sort((a, b) =>
    (a.image.instanceNumber ?? Number.MAX_SAFE_INTEGER) - (b.image.instanceNumber ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, undefined, { numeric: true }));
  const first = sorted[0].image;
  if (sorted.some(({ image }) => image.width !== first.width || image.height !== first.height ||
    (first.seriesInstanceUid && image.seriesInstanceUid && image.seriesInstanceUid !== first.seriesInstanceUid)))
    throw new Error('Selected files must share the same image dimensions and DICOM series.');
  return { name: files.length === 1 ? files[0].name : (first.seriesDescription || `${files.length} DICOM instances`),
    images: sorted.map(item => item.image),
    frames: sorted.flatMap(({ image }) => Array.from({ length: image.frames }, (_, frame) => ({ image, frame }))),
    isSample: false };
}
