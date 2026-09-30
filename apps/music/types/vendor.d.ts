// Expo 57's published TypeScript sources reference a few untyped React Native internals.
// These declarations keep the example's strict typecheck focused on application code.
declare module '@react-native/assets-registry/registry' {
  export type PackagerAsset = {
    __packager_asset: boolean;
    fileSystemLocation: string;
    httpServerLocation: string;
    width?: number | null;
    height?: number | null;
    scales: number[];
    hash: string;
    name: string;
    type: string;
  };
  export function getAssetByID(id: number | { uri: string; width: number; height: number }): PackagerAsset;
  export function registerAsset(asset: PackagerAsset): number;
}

declare module 'react-native/Libraries/Image/AssetSourceResolver' {
  export default class AssetSourceResolver {
    resourceIdentifierWithoutScale(): string;
  }
}

declare module 'invariant' {
  export default function invariant(condition: unknown, message?: string): asserts condition;
}

interface Window {
  $$EXPO_INITIAL_PROPS?: unknown;
}
