import {
  MORPHO_ASSET_ADAPTERS,
  type MorphoAddress,
  type MorphoAssetAdapterConfig,
  type MorphoTokenKey,
} from 'pages/Markets/protocol/morpho/config'

export interface ResolvedMorphoAssetAdapter extends MorphoAssetAdapterConfig {
  key: MorphoTokenKey
  isWrapped: boolean
}

function sameAddress(a: MorphoAddress, b: MorphoAddress) {
  return a.toLowerCase() === b.toLowerCase()
}

function resolveAdapter(key: MorphoTokenKey, config: MorphoAssetAdapterConfig): ResolvedMorphoAssetAdapter {
  return {
    ...config,
    key,
    isWrapped: Boolean(config.wrapper) || !sameAddress(config.underlying.address, config.protocol.address),
  }
}

export function getMorphoAssetAdapter(key: MorphoTokenKey): ResolvedMorphoAssetAdapter {
  return resolveAdapter(key, MORPHO_ASSET_ADAPTERS[key])
}
