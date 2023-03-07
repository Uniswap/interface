import { GenieAsset } from 'nft/types'

export const formatAssetEventProperties = (assets: GenieAsset[]) => ({
  collection_addresses: assets.map((asset) => asset.address),
  token_ids: assets.map((asset) => asset.tokenId),
  token_types: assets.map((asset) => asset.tokenType),
})
