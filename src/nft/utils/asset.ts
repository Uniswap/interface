import { DetailsOrigin, GenieAsset, WalletAsset } from 'nft/types'

export function getRarityStatus(
  rarityStatusCache: Map<string, boolean>,
  id: string,
  assets?: (GenieAsset | undefined)[]
) {
  if (rarityStatusCache.has(id)) {
    return rarityStatusCache.get(id)
  }
  const hasRarity = assets && Array.from(assets).reduce((reducer, asset) => !!(reducer || asset?.rarity), false)

  if (hasRarity) {
    rarityStatusCache.set(id, hasRarity)
  }

  return hasRarity
}

export const getAssetHref = (asset: GenieAsset | WalletAsset, origin?: DetailsOrigin) => {
  const address =
    (asset as GenieAsset).address !== undefined
      ? (asset as GenieAsset).address
      : (asset as WalletAsset).asset_contract.address
  return `/nfts/asset/${address}/${asset.tokenId}${origin ? `?origin=${origin}` : ''}`
}

export const getMarketplaceIcon = (marketplace: string) => {
  return `/nft/svgs/marketplaces/${marketplace}.svg`
}
