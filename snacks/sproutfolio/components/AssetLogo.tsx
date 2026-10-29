import { BrandIcon } from '@plocks/brands';
import { Block, Text } from '@plocks/ui-snack';
import type { Asset } from '../data';
import { C } from '../theme';

/**
 * Company logo from @plocks/brands on a neutral disc. Coins have no registry
 * logo, so they get their own color with the currency glyph instead.
 */
export function AssetLogo({ asset, size = 42 }: { asset: Asset; size?: number }) {
  if (asset.brand) {
    return (
      <Block
        gap={0}
        w={size}
        h={size}
        radius={size / 2}
        bg={C.white}
        borderWidth={1}
        borderColor={C.line}
        align="center"
        justify="center"
      >
        <BrandIcon brand={asset.brand} size={Math.round(size * 0.56)} />
      </Block>
    );
  }
  return (
    <Block gap={0} w={size} h={size} radius={size / 2} bg={asset.color} align="center" justify="center">
      <Text c={C.white} fw="bold" size={Math.round(size * 0.5)} lh={Math.round(size * 0.6)}>
        {asset.glyph ?? asset.ticker[0]}
      </Text>
    </Block>
  );
}
