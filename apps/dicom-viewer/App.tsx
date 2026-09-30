import { useEffect, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import {
  AppShell,
  Badge,
  Block,
  Button,
  Card,
  Column,
  PlocksProvider,
  Row,
  SegmentedControl,
  Slider,
  Text,
} from '@plocks/ui';
import { ScanViewport } from './components/ScanViewport';
import { parseDicom } from './dicom';
import { createFileStudy, createSampleStudy, type Study } from './study';
import { C, VIEWER_THEME } from './theme';

const PRESETS = {
  original: { label: 'Original' },
  soft: { label: 'Soft tissue', window: 400, level: 40 },
  lung: { label: 'Lung', window: 1400, level: -500 },
  bone: { label: 'Bone', window: 1800, level: 450 },
} as const;
type Preset = keyof typeof PRESETS | 'custom';

function SectionLabel({ children, value }: { children: string; value?: string }) {
  return (
    <Block align="center" justify="space-between" gap="sm" direction="row" flex={1}>
      <Text c={C.muted} size={10} fw="bold" lts={1.5}>
        {children.toUpperCase()}
      </Text>
      {!!value && (
        <Text c={C.ink} size={12} fw="bold">
          {value}
        </Text>
      )}
    </Block>
  );
}

function ViewerApp() {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 800;
  const scanSize = Math.max(245, Math.min(compact ? screenWidth - 76 : 500, 500));
  const [study, setStudy] = useState<Study>(createSampleStudy);
  const [index, setIndex] = useState(17);
  const [preset, setPreset] = useState<Preset>('original');
  const [customWindow, setCustomWindow] = useState(400);
  const [customLevel, setCustomLevel] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [invert, setInvert] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const active = study.frames[index];
  const image = active.image;
  const total = study.frames.length;
  const presetSettings = preset === 'custom' ? null : PRESETS[preset];
  const window =
    preset === 'original'
      ? image.window
      : presetSettings && 'window' in presetSettings
        ? presetSettings.window
        : customWindow;
  const level =
    preset === 'original'
      ? image.level
      : presetSettings && 'level' in presetSettings
        ? presetSettings.level
        : customLevel;
  const modality = image.modality || 'DICOM';
  const spacing = image.pixelSpacing
    ?.split('\\')
    .map((value) => Number(value).toFixed(2))
    .join(' × ');

  useEffect(() => {
    if (!playing || total < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % total), 140);
    return () => clearInterval(timer);
  }, [playing, total]);

  function loadStudy(next: Study) {
    setPlaying(false);
    setStudy(next);
    setIndex(next.isSample ? Math.floor(next.frames.length / 2) : 0);
    setPreset('original');
    setCustomWindow(next.frames[0].image.window);
    setCustomLevel(next.frames[0].image.level);
    setZoom(1);
    setInvert(false);
    setError('');
  }

  async function openFiles() {
    try {
      setLoading(true);
      setPlaying(false);
      setError('');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      if (result.assets.length > 120) throw new Error('Select 120 or fewer files at a time.');
      const files = [];
      let totalPixels = 0;
      for (const asset of result.assets) {
        const buffer =
          Platform.OS === 'web' && asset.file
            ? await asset.file.arrayBuffer()
            : await new File(asset.uri).arrayBuffer();
        const image = parseDicom(buffer);
        totalPixels += image.values.length;
        if (totalPixels > 80000000) throw new Error('This image stack is too large for the example viewer.');
        files.push({ name: asset.name, image });
      }
      loadStudy(createFileStudy(files));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open these files.');
    } finally {
      setLoading(false);
    }
  }

  function choosePreset(value: string) {
    if (value === 'original' || value === 'soft' || value === 'lung' || value === 'bone') setPreset(value);
  }
  function changeWindow(value: number) {
    setCustomWindow(value);
    setCustomLevel(level);
    setPreset('custom');
  }
  function changeLevel(value: number) {
    setCustomWindow(window);
    setCustomLevel(value);
    setPreset('custom');
  }
  function step(delta: number) {
    setPlaying(false);
    setIndex((current) => Math.max(0, Math.min(total - 1, current + delta)));
  }

  const presetData = useMemo(() => Object.entries(PRESETS).map(([value, item]) => ({ value, label: item.label })), []);
  return (
    <AppShell
      header={{ height: 72 }}
      autoLayout
      maxContentWidth={1260}
      centerContent
      padding={0}
      headerContent={
        <Block align="center" justify="space-between" direction="row" flex={1} px={22}>
          <Row gap="sm" align="center">
            <Block
              w={32}
              h={32}
              radius="md"
              bg={C.accentSoft}
              align="center"
              justify="center"
              borderWidth={1}
              borderColor={C.accent}
            >
              <Text c={C.accent} fw="bold" size={19}>
                ✳
              </Text>
            </Block>
            <Column gap={0} fullWidth={false}>
              <Text c={C.accent} size={9} fw="bold" lts={2}>
                NORTHSTAR
              </Text>
              <Text c={C.ink} size={17} fw="bold">
                IMAGING STUDIO
              </Text>
            </Column>
          </Row>
          <Badge color={C.accent} variant="light">
            LOCAL VIEWER
          </Badge>
        </Block>
      }
    >
      <AppShell.Section grow withScrollArea>
        <Block gap="lg" direction="column" w="100%" p={compact ? 16 : 24} pb={44}>
          <Row align="center" justify="space-between" wrap="wrap" gap="md">
            <Block gap={4} fullWidth={false} direction="column" shrink={1}>
              <Text c={C.accent} size={10} fw="bold" lts={2}>
                STUDY WORKSPACE / 01
              </Text>
              <Text c={C.ink} size={compact ? 25 : 30} fw="bold">
                DICOM Viewer
              </Text>
              <Text c={C.muted} size={13}>
                Explore an image stack with clinical style viewing controls.
              </Text>
            </Block>
            <Row gap="sm" wrap="wrap">
              <Button
                title="Open DICOM files"
                onPress={openFiles}
                loading={loading}
                color={C.accent}
                variant="filled"
              />
              <Button
                title="Sample study"
                onPress={() => loadStudy(createSampleStudy())}
                color={C.accent}
                variant="outline"
              />
            </Row>
          </Row>

          {!!error && (
            <Card bg="#452B30" borderColor={C.error} padding="md">
              <Text c={C.error} size={13}>
                {error}
              </Text>
            </Card>
          )}

          <Block gap="lg" align="flex-start" wrap={compact ? 'wrap' : 'nowrap'} direction="row" w="100%">
            <Block gap="md" direction="column" flex={1} miw={compact ? '100%' : 500}>
              <Card bg={C.panel} borderColor={C.border} borderWidth={1} radius="lg" padding="md" w="100%">
                <Row align="center" justify="space-between" wrap="wrap" gap="sm">
                  <Block gap={3} fullWidth={false} direction="column" shrink={1}>
                    <Text c={C.accent} size={10} fw="bold" lts={1.5}>
                      CURRENT SERIES
                    </Text>
                    <Text c={C.ink} size={18} fw="bold" numberOfLines={1}>
                      {study.name}
                    </Text>
                  </Block>
                  <Row gap="xs" align="center">
                    <Badge color={C.accent} variant="light">
                      {modality}
                    </Badge>
                    <Badge color={C.warning} variant="light">
                      {total} IMAGES
                    </Badge>
                  </Row>
                </Row>
              </Card>
              <ScanViewport
                image={image}
                frame={active.frame}
                index={index}
                total={total}
                window={window}
                level={level}
                zoom={zoom}
                invert={invert}
                size={scanSize}
                isSample={study.isSample}
              />
              <Card bg={C.panel} borderColor={C.border} borderWidth={1} radius="lg" padding="lg" w="100%">
                <Column gap="md">
                  <SectionLabel value={`${index + 1} / ${total}`}>Slice position</SectionLabel>
                  <Slider
                    min={1}
                    max={total}
                    step={1}
                    value={index + 1}
                    onChange={(value) => {
                      setPlaying(false);
                      setIndex(value - 1);
                    }}
                    color={C.accent}
                    accessibilityLabel="Scrub through scan slices"
                    valueLabel={(value) => `Slice ${value} of ${total}`}
                  />
                  <Row gap="sm" align="center" justify="space-between" wrap="wrap">
                    <Row gap="xs">
                      <Button
                        title="−  Previous"
                        size="sm"
                        variant="outline"
                        color={C.accent}
                        disabled={index === 0}
                        onPress={() => step(-1)}
                      />
                      <Button
                        title="Next  +"
                        size="sm"
                        variant="outline"
                        color={C.accent}
                        disabled={index === total - 1}
                        onPress={() => step(1)}
                      />
                    </Row>
                    <Button
                      title={playing ? 'Ⅱ  Pause' : '▶  Cine'}
                      size="sm"
                      variant={playing ? 'filled' : 'light'}
                      color={C.accent}
                      disabled={total < 2}
                      onPress={() => setPlaying((current) => !current)}
                    />
                  </Row>
                </Column>
              </Card>
            </Block>

            <Block gap="md" direction="column" w={compact ? '100%' : 344}>
              <Card bg={C.panel} borderColor={C.border} borderWidth={1} radius="lg" padding="lg" w="100%">
                <Column gap="lg">
                  <Column gap={3}>
                    <Text c={C.accent} size={10} fw="bold" lts={1.5}>
                      DISPLAY CONTROLS
                    </Text>
                    <Text c={C.ink} size={19} fw="bold">
                      Window &amp; level
                    </Text>
                  </Column>
                  <SegmentedControl
                    data={presetData}
                    value={preset === 'custom' ? '' : preset}
                    onChange={choosePreset}
                    color={C.accent}
                    size="xs"
                    fullWidth
                    accessibilityLabel="Window presets"
                  />
                  {preset === 'custom' && (
                    <Text c={C.accent} size={11}>
                      Custom adjustment
                    </Text>
                  )}
                  <Column gap="sm">
                    <SectionLabel value={`${Math.round(window)} HU`}>Window width</SectionLabel>
                    <Slider
                      min={1}
                      max={3000}
                      step={1}
                      value={window}
                      onChange={changeWindow}
                      color={C.accent}
                      accessibilityLabel="Window width"
                      valueLabel={(value) => `${Math.round(value)} HU`}
                    />
                  </Column>
                  <Column gap="sm">
                    <SectionLabel value={`${Math.round(level)} HU`}>Window level</SectionLabel>
                    <Slider
                      min={-1200}
                      max={1800}
                      step={1}
                      value={level}
                      onChange={changeLevel}
                      color={C.accent}
                      accessibilityLabel="Window level"
                      valueLabel={(value) => `${Math.round(value)} HU`}
                    />
                  </Column>
                </Column>
              </Card>
              <Card bg={C.panel} borderColor={C.border} borderWidth={1} radius="lg" padding="lg" w="100%">
                <Column gap="lg">
                  <Column gap={3}>
                    <Text c={C.accent} size={10} fw="bold" lts={1.5}>
                      VIEW OPTIONS
                    </Text>
                    <Text c={C.ink} size={19} fw="bold">
                      Image tools
                    </Text>
                  </Column>
                  <Column gap="sm">
                    <SectionLabel value={`${Math.round(zoom * 100)}%`}>Zoom</SectionLabel>
                    <Slider
                      min={0.75}
                      max={2}
                      step={0.05}
                      value={zoom}
                      onChange={setZoom}
                      color={C.accent}
                      accessibilityLabel="Image zoom"
                      valueLabel={(value) => `${Math.round(value * 100)}%`}
                    />
                  </Column>
                  <Row gap="sm" wrap="wrap">
                    <Button
                      title={invert ? 'Restore polarity' : 'Invert image'}
                      size="sm"
                      variant="outline"
                      color={C.accent}
                      onPress={() => setInvert((current) => !current)}
                    />
                    <Button
                      title="Reset view"
                      size="sm"
                      variant="outline"
                      color={C.accent}
                      onPress={() => {
                        setZoom(1);
                        setInvert(false);
                        setPreset('original');
                      }}
                    />
                  </Row>
                </Column>
              </Card>
              <Card bg={C.panel} borderColor={C.border} borderWidth={1} radius="lg" padding="lg" w="100%">
                <Column gap="md">
                  <Column gap={3}>
                    <Text c={C.accent} size={10} fw="bold" lts={1.5}>
                      SERIES INFORMATION
                    </Text>
                    <Text c={C.ink} size={19} fw="bold">
                      Acquisition
                    </Text>
                  </Column>
                  <Row justify="space-between">
                    <Text c={C.muted} size={12}>
                      Matrix
                    </Text>
                    <Text c={C.ink} size={12}>
                      {image.width} × {image.height}
                    </Text>
                  </Row>
                  <Row justify="space-between">
                    <Text c={C.muted} size={12}>
                      Pixel spacing
                    </Text>
                    <Text c={C.ink} size={12}>
                      {spacing ? `${spacing} mm` : '—'}
                    </Text>
                  </Row>
                  <Row justify="space-between">
                    <Text c={C.muted} size={12}>
                      Slice thickness
                    </Text>
                    <Text c={C.ink} size={12}>
                      {image.sliceThickness ? `${image.sliceThickness} mm` : '—'}
                    </Text>
                  </Row>
                  <Row justify="space-between">
                    <Text c={C.muted} size={12}>
                      Instances
                    </Text>
                    <Text c={C.ink} size={12}>
                      {study.images.length}
                    </Text>
                  </Row>
                </Column>
              </Card>
            </Block>
          </Block>
          <Block bg={C.accentSoft} radius="md" p={12} w="full">
            <Text c={C.muted} size={11}>
              Educational viewer. Synthetic sample contains no patient data. Local DICOM files stay on this device.
              Supports uncompressed 8/16-bit monochrome little-endian images; not for clinical decisions.
            </Text>
          </Block>
        </Block>
      </AppShell.Section>
    </AppShell>
  );
}

export default function App() {
  return (
    <PlocksProvider theme={VIEWER_THEME}>
      <ViewerApp />
    </PlocksProvider>
  );
}
