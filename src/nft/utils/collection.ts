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
