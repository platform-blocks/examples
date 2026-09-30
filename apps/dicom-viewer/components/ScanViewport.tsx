import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { Block, Column, Row, Text } from '@plocks/ui';
import { imagePaths, type DicomImage } from '../dicom';
import { C } from '../theme';

type Props = {
  image: DicomImage; frame: number; index: number; total: number;
  window: number; level: number; zoom: number; invert: boolean;
  size: number; isSample: boolean;
};

export function ScanViewport({ image, frame, index, total, window, level, zoom, invert, size, isSample }: Props) {
  const paths = useMemo(() => imagePaths(image, frame, window, level, invert), [image, frame, window, level, invert]);
  return <Block bg={C.viewer} h={size + 64} radius="lg" borderWidth={1} borderColor={C.border}
    position="relative" align="center" justify="center" overflow="hidden" w="full"
    accessibilityLabel={`Axial scan image, slice ${index + 1} of ${total}`}>
    <Block position="absolute" top={15} left={16}>
      <Text c={C.accent} size={10} fw="bold" lts={1.5}>AXIAL  /  {image.modality || 'DICOM'}</Text>
    </Block>
    <Block position="absolute" top={15} right={16}>
      <Text c={C.muted} size={10} fw="bold" lts={1}>IM {String(index + 1).padStart(3, '0')} / {String(total).padStart(3, '0')}</Text>
    </Block>
    <Block w={size * zoom} h={size * zoom} align="center" justify="center">
      <Svg width="100%" height="100%" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet" accessibilityLabel="Rendered DICOM pixels">
        {paths.map(({ color, path }) => <Path key={color} d={path} fill={color} />)}
      </Svg>
    </Block>
    <Block position="absolute" left={16} top="50%"><Text c={C.accent} size={13} fw="bold">R</Text></Block>
    <Block position="absolute" right={16} top="50%"><Text c={C.accent} size={13} fw="bold">L</Text></Block>
    <Block position="absolute" bottom={14} left={16}>
      <Column gap={2} fullWidth={false}>
        <Text c={C.muted} size={10} fw="bold" lts={1}>W {Math.round(window)}   L {Math.round(level)}</Text>
        <Text c={C.dim} size={9}>{isSample ? 'SYNTHETIC IMAGE · NO PATIENT DATA' : `${image.width} × ${image.height} PX · LOCAL FILE`}</Text>
      </Column>
    </Block>
    <Block position="absolute" bottom={14} right={16}>
      <Row gap={5} align="center"><Block w={5} h={5} radius="full" bg={C.accent} /><Text c={C.muted} size={10}>{Math.round(zoom * 100)}%</Text></Row>
    </Block>
  </Block>;
}
