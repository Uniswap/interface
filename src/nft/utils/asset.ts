import { DetailsOrigin, GenieAsset } from 'nft/types'

export const getAssetHref = (asset: GenieAsset, origin?: DetailsOrigin) => {
  return `/nfts/asset/${asset.address}/${asset.tokenId}${origin ? `?origin=${origin}` : ''}`
}
