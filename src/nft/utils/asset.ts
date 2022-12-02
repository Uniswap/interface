import { DetailsOrigin, GenieAsset, UpdatedGenieAsset, WalletAsset } from 'nft/types'

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
  return `/nft/svgs/marketplaces/${marketplace.toLowerCase()}.svg`
}

export const generateTweetForAsset = (asset: GenieAsset): string => {
  return `https://twitter.com/intent/tweet?text=Check%20out%20${
    asset.name ? encodeURIComponent(asset.name) : `${asset.collectionName}%20%23${asset.tokenId}`
  }%20(${asset.collectionName})%20https://app.uniswap.org/%23/nfts/asset/${asset.address}/${
    asset.tokenId
  }%20via%20@uniswap`
}

export const generateTweetForPurchase = (assets: UpdatedGenieAsset[], txHashUrl: string): string => {
  const multipleCollections = assets.length > 0 && assets.some((asset) => asset.address !== assets[0].address)
  const tweetText = `I just purchased ${
    multipleCollections ? `${assets.length} NFTs` : `${assets.length} ${assets[0].collectionName ?? 'NFT'}`
  } with Uniswap 🦄\n\nhttps://app.uniswap.org/#/nfts/collection/0x60bb1e2aa1c9acafb4d34f71585d7e959f387769\n${txHashUrl}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
}
