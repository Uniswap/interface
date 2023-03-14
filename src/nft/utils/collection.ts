import { GenieAsset } from 'nft/types'

export const isInSameSudoSwapPool = (assetA: GenieAsset, assetB: GenieAsset): boolean => {
  if (!assetA.sellorders || !assetB.sellorders) return false

  const assetASudoSwapPoolParameters = assetA.sellorders[0].protocolParameters
  const assetBSudoSwapPoolParameters = assetB.sellorders[0].protocolParameters

  const assetAPoolAddress = assetASudoSwapPoolParameters?.poolAddress
    ? (assetASudoSwapPoolParameters.poolAddress as string)
    : undefined
  const assetBPoolAddress = assetBSudoSwapPoolParameters?.poolAddress
    ? (assetBSudoSwapPoolParameters.poolAddress as string)
    : undefined

  if (!assetAPoolAddress || !assetBPoolAddress) return false
  if (assetAPoolAddress !== assetBPoolAddress) return false

  return true
}

export const isInSameMarketplaceCollection = (assetA: GenieAsset, assetB: GenieAsset): boolean => {
  return assetA.address === assetB.address && assetA.marketplace === assetB.marketplace
}

export const blocklistedCollections = [
  '0xd5eeac01b0d1d929d6cffaaf78020af137277293',
  '0x85c08fffa9510f87019efdcf986301873cbb10d6',
  '0x32d7e58933fceea6b73a13f8e30605d80915b616',
]
