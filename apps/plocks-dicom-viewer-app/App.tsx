import { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import Svg, { Rect } from 'react-native-svg';
import { Text } from '@plocks/ui';
import { Action, Actions, ExampleApp, Label, Panel, Stat, type Palette } from '../example-common/ExampleUI';
import { imageCells, parseDicom, type DicomImage } from './dicom';

const P: Palette = { background: '#0C151D', surface: '#18232E', ink: '#EDF6FC', muted: '#9EB0BD', accent: '#59C7DA', border: '#314958' };
const PRESETS = [{ name: 'Soft tissue', window: 220, level: 45 }, { name: 'Lung', window: 1400, level: -500 }, { name: 'Bone', window: 1800, level: 450 }];
export default function App() {
  const [image, setImage] = useState<DicomImage | null>(null);
  const [filename, setFilename] = useState('Synthetic demo study');
  const [error, setError] = useState('');
  const [slice, setSlice] = useState(1);
  const [preset, setPreset] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const tone = preset === 1 ? 98 : preset === 2 ? 195 : 145;
  const window = preset < 0 ? image?.window ?? 220 : PRESETS[preset].window;
  const level = preset < 0 ? image?.level ?? 45 : PRESETS[preset].level;
  const cells = useMemo(() => image ? imageCells(image, slice - 1, window, level) : [], [image, slice, window, level]);
  async function openFile() {
    try {
      setError('');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const buffer = Platform.OS === 'web' && asset.file ? await asset.file.arrayBuffer() : await new File(asset.uri).arrayBuffer();
      const parsed = parseDicom(buffer);
      setImage(parsed); setFilename(asset.name); setSlice(1); setPreset(-1); setZoom(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open this file.');
    }
  }
  function sample() { setImage(null); setFilename('Synthetic demo study'); setSlice(1); setPreset(-1); setZoom(1); setError(''); }
  return <ExampleApp name="DICOM Viewer" subtitle="Explore a study with slice, zoom, and window controls." palette={P} dark>
    <Panel palette={P}><Actions><Action title="Open DICOM file" palette={P} onPress={openFile} /><Action title="Sample study" palette={P} outline onPress={sample} /></Actions>
      <Text c={P.ink} fw="bold">{filename}</Text><Text c={P.muted} size={12}>{image ? `${image.width} × ${image.height} · ${image.frames} frame${image.frames > 1 ? 's' : ''} · local file` : 'Synthetic axial illustration · no patient data'}</Text>
      {!!error && <Text c="#FFB3A8">{error}</Text>}</Panel>
    <Panel palette={P}><Actions><Stat label="SLICE" value={`${slice} / ${image?.frames ?? 24}`} palette={P} /><Stat label="ZOOM" value={`${Math.round(zoom * 100)}%`} palette={P} /></Actions></Panel>
    <View style={{ height: 360, backgroundColor: '#05090D', borderRadius: 16, borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {image ? <Svg width={300 * zoom} height={300 * zoom} viewBox="0 0 64 64" accessibilityLabel={`DICOM image, frame ${slice}`}>
        {cells.map((color, index) => <Rect key={index} x={index % 64} y={Math.floor(index / 64)} width={1} height={1} fill={color} />)}
      </Svg> : <View style={{ width: 250 * zoom, height: 250 * zoom, borderRadius: 125 * zoom, backgroundColor: `rgb(${tone},${tone},${tone})`, alignItems: 'center', justifyContent: 'center', borderWidth: 12, borderColor: '#4C5962' }}>
        <View style={{ width: 182 * zoom, height: 190 * zoom, borderRadius: 90 * zoom, backgroundColor: `rgb(${Math.max(20,tone-48)},${Math.max(20,tone-48)},${Math.max(20,tone-48)})`, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <View style={{ width: 58 * zoom, height: 85 * zoom, borderRadius: 30, backgroundColor: '#28343E' }} />
          <View style={{ width: 28 * zoom, height: 34 * zoom, borderRadius: 15, backgroundColor: '#DCE0DC' }} />
          <View style={{ width: 58 * zoom, height: 85 * zoom, borderRadius: 30, backgroundColor: '#28343E' }} />
        </View>
      </View>}
      <View style={{ position: 'absolute', top: 12, left: 12 }}><Text c={P.accent} size={11}>AXIAL · {String(slice).padStart(3, '0')}</Text></View>
      <View style={{ position: 'absolute', bottom: 12, right: 12 }}><Text c={P.accent} size={11}>W {Math.round(window)} / L {Math.round(level)}</Text></View>
    </View>
    <Panel palette={P}><Label palette={P}>SLICES / FRAMES</Label><Actions><Action title="Previous" palette={P} outline onPress={() => setSlice(n => Math.max(1, n - 1))} /><Action title="Next" palette={P} onPress={() => setSlice(n => Math.min(image?.frames ?? 24, n + 1))} /></Actions>
      <Label palette={P}>WINDOW / LEVEL</Label><Actions>{image && <Action title="File default" palette={P} outline={preset !== -1} onPress={() => setPreset(-1)} />}{PRESETS.map((item, i) => <Action key={item.name} title={item.name} palette={P} outline={i !== preset} onPress={() => setPreset(i)} />)}</Actions>
      <Label palette={P}>ZOOM</Label><Actions><Action title="−" palette={P} outline onPress={() => setZoom(n => Math.max(0.7, +(n - 0.1).toFixed(1)))} /><Action title="+" palette={P} outline onPress={() => setZoom(n => Math.min(1.3, +(n + 0.1).toFixed(1)))} /></Actions></Panel>
    <Text c={P.muted} size={12}>Local demo viewer for uncompressed 8/16-bit monochrome little-endian DICOM. Compressed, color, and advanced studies are unsupported. Do not use for clinical decisions.</Text>
  </ExampleApp>;
}
