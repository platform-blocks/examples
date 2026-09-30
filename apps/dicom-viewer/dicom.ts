/** Minimal local decoder for uncompressed, monochrome, little-endian DICOM images. */
export type DicomImage = {
  width: number; height: number; frames: number; values: Float32Array;
  window: number; level: number; inverted: boolean;
  modality?: string; seriesDescription?: string; instanceNumber?: number;
  seriesInstanceUid?: string; pixelSpacing?: string; sliceThickness?: string;
};

export function parseDicom(buffer: ArrayBuffer): DicomImage {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length)).replace(/\0/g, '').trim();
  let position = ascii(128, 4) === 'DICM' ? 132 : 0;
  let syntax = '1.2.840.10008.1.2.1';
  let explicit = true;
  let width = 0, height = 0, bits = 0, representation = 0, samples = 1, frames = 1;
  let slope = 1, intercept = 0, window = 0, level = 0, photo = 'MONOCHROME2';
  let modality: string | undefined, seriesDescription: string | undefined;
  let instanceNumber: number | undefined, seriesInstanceUid: string | undefined;
  let pixelSpacing: string | undefined, sliceThickness: string | undefined;
  let pixelOffset = -1, pixelLength = 0;
  const longVR = new Set(['OB', 'OD', 'OF', 'OL', 'OV', 'OW', 'SQ', 'UC', 'UN', 'UR', 'UT', 'UV', 'SV']);
  const skipUndefined = (start: number, closingElement: number, depth = 0): number => {
    if (depth > 16) throw new Error('The DICOM sequence nesting is too deep.');
    let cursor = start;
    while (cursor + 8 <= bytes.length) {
      const group = view.getUint16(cursor, true), element = view.getUint16(cursor + 2, true);
      if (group === 0xfffe) {
        const length = view.getUint32(cursor + 4, true);
        if (element === closingElement) return cursor + 8;
        if (element === 0xe000) {
          cursor = length === 0xffffffff ? skipUndefined(cursor + 8, 0xe00d, depth + 1) : cursor + 8 + length;
          continue;
        }
        throw new Error('The DICOM sequence delimiters are invalid.');
      }
      const vr = explicit ? ascii(cursor + 4, 2) : '';
      const long = explicit && longVR.has(vr);
      const header = explicit ? long ? 12 : 8 : 8;
      if (cursor + header > bytes.length) break;
      const length = explicit ? long ? view.getUint32(cursor + 8, true) : view.getUint16(cursor + 6, true) : view.getUint32(cursor + 4, true);
      cursor = length === 0xffffffff ? skipUndefined(cursor + header, 0xe0dd, depth + 1) : cursor + header + length;
    }
    throw new Error('The DICOM sequence is incomplete.');
  };
  let steps = 0;
  while (position + 8 <= bytes.length && steps++ < 100000) {
    const group = view.getUint16(position, true), element = view.getUint16(position + 2, true);
    if (group !== 2) explicit = syntax !== '1.2.840.10008.1.2';
    const vr = explicit ? ascii(position + 4, 2) : '';
    const long = explicit && longVR.has(vr);
    const header = explicit ? long ? 12 : 8 : 8;
    if (position + header > bytes.length) break;
    const length = explicit ? long ? view.getUint32(position + 8, true) : view.getUint16(position + 6, true) : view.getUint32(position + 4, true);
    const start = position + header;
    const tag = `${group.toString(16).padStart(4, '0')}${element.toString(16).padStart(4, '0')}`;
    if (length === 0xffffffff) {
      if (tag === '7fe00010') throw new Error('Compressed or encapsulated pixel data is not supported.');
      position = skipUndefined(start, 0xe0dd);
      continue;
    }
    if (start + length > bytes.length) throw new Error('The DICOM file is incomplete.');
    const text = () => ascii(start, length);
    const uint = () => length >= 2 ? view.getUint16(start, true) : 0;
    switch (tag) {
      case '00020010': syntax = text(); break;
      case '00080060': modality = text(); break;
      case '0008103e': seriesDescription = text(); break;
      case '00180050': sliceThickness = text(); break;
      case '0020000e': seriesInstanceUid = text(); break;
      case '00200013': instanceNumber = Number(text()) || undefined; break;
      case '00280002': samples = uint(); break;
      case '00280004': photo = text(); break;
      case '00280030': pixelSpacing = text(); break;
      case '00280008': frames = Math.max(1, Number(text()) || 1); break;
      case '00280010': height = uint(); break;
      case '00280011': width = uint(); break;
      case '00280100': bits = uint(); break;
      case '00280103': representation = uint(); break;
      case '00281052': intercept = Number(text()) || 0; break;
      case '00281053': slope = Number(text()) || 1; break;
      case '00281050': level = Number(text().split('\\')[0]) || 0; break;
      case '00281051': window = Number(text().split('\\')[0]) || 0; break;
      case '7fe00010': pixelOffset = start; pixelLength = length; break;
    }
    position = start + length;
    if (pixelOffset >= 0) break;
  }
  if (!['1.2.840.10008.1.2', '1.2.840.10008.1.2.1'].includes(syntax)) throw new Error('Only uncompressed little-endian DICOM is supported.');
  if (!width || !height || pixelOffset < 0 || ![8, 16].includes(bits) || samples !== 1 || !['MONOCHROME1', 'MONOCHROME2'].includes(photo))
    throw new Error('This demo supports only 8- or 16-bit grayscale DICOM images.');
  const count = width * height * frames;
  if (count > 40000000 || count * (bits / 8) > pixelLength) throw new Error('The image dimensions or pixel data are invalid.');
  const values = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const offset = pixelOffset + i * (bits / 8);
    const raw = bits === 8 ? representation ? view.getInt8(offset) : view.getUint8(offset)
      : representation ? view.getInt16(offset, true) : view.getUint16(offset, true);
    values[i] = raw * slope + intercept;
  }
  if (!window) {
    let min = Infinity, max = -Infinity;
    for (const value of values) { if (value < min) min = value; if (value > max) max = value; }
    window = Math.max(1, max - min); level = (max + min) / 2;
  }
  return { width, height, frames, values, window, level, inverted: photo === 'MONOCHROME1',
    modality, seriesDescription, instanceNumber, seriesInstanceUid, pixelSpacing, sliceThickness };
}

/** Quantize a frame into 64 SVG paths rather than thousands of individual rectangles. */
export function imagePaths(image: DicomImage, frame: number, window: number, level: number, invert = false, side = 128): { color: string; path: string }[] {
  const paths = Array.from({ length: 64 }, () => [] as string[]);
  const offset = frame * image.width * image.height;
  const low = level - Math.max(1, window) / 2;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const sourceX = Math.min(image.width - 1, Math.floor((x + .5) * image.width / side));
    const sourceY = Math.min(image.height - 1, Math.floor((y + .5) * image.height / side));
    const value = image.values[offset + sourceY * image.width + sourceX];
    const normalized = Math.max(0, Math.min(1, (value - low) / Math.max(1, window)));
    const shade = Math.round(((image.inverted !== invert) ? 1 - normalized : normalized) * 63);
    paths[shade].push(`M${x} ${y}h1v1h-1z`);
  }
  return paths.map((parts, shade) => {
    const grey = Math.round(shade * 255 / 63).toString(16).padStart(2, '0');
    return { color: `#${grey}${grey}${grey}`, path: parts.join('') };
  }).filter(item => item.path.length > 0);
}

export function imageCells(image: DicomImage, frame: number, window: number, level: number, side = 64): string[] {
  const cells: string[] = [];
  const offset = frame * image.width * image.height;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const sourceX = Math.min(image.width - 1, Math.floor((x + .5) * image.width / side));
    const sourceY = Math.min(image.height - 1, Math.floor((y + .5) * image.height / side));
    const value = image.values[offset + sourceY * image.width + sourceX];
    const normalized = Math.max(0, Math.min(1, (value - (level - window / 2)) / window));
    const grey = Math.round((image.inverted ? 1 - normalized : normalized) * 255);
    cells.push(`#${grey.toString(16).padStart(2, '0').repeat(3)}`);
  }
  return cells;
}
