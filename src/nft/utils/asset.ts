import { GenieAsset, Origin } from 'nft/types'

export const getAssetHref = (asset: GenieAsset, origin?: Origin) => {
  return `#/nft/asset/${asset.address}/${asset.tokenId}${origin ? `?origin=${origin}` : ''}`
}
