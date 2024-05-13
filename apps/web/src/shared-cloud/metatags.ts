export type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

export function formatTokenMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Get ' + symbol + ' on Uniswap'
  }
  if (name) {
    return 'Get ' + name + ' on Uniswap'
  }
  return 'View Token on Uniswap'
}

export function formatNFTAssetMetatagTitleName(
  name: string | undefined,
  collectionName: string | undefined,
  tokenId: string
) {
  if (name) {
    return name
  }
  if (collectionName && tokenId) {
    return collectionName + ' #' + tokenId
  }
  if (tokenId) {
    return 'Asset #' + tokenId
  }
  return 'View NFT on Uniswap'
}
