import { parseEther } from 'ethers/lib/utils'
import { ActivityEvent, GenieAsset } from 'nft/types'

export const buildActivityAsset = (event: ActivityEvent, collectionName: string, ethPriceInUSD: number): GenieAsset => {
  const assetUsdPrice = event.price ? parseFloat(event.price) * ethPriceInUSD : '0'

  const weiPrice = event.price ? parseEther(event.price) : ''

  return {
    address: event.collectionAddress,
    collectionName,
    imageUrl: event.tokenMetadata?.imageUrl,
    marketplace: event.marketplace,
    name: event.tokenMetadata?.name,
    tokenId: event.tokenId,
    susFlag: event.tokenMetadata?.suspiciousFlag,
    smallImageUrl: event.tokenMetadata?.smallImageUrl,
    collectionSymbol: event.symbol,
    priceInfo: {
      USDPrice: assetUsdPrice,
      ETHPrice: weiPrice,
      basePrice: weiPrice,
      baseAsset: 'ETH',
    },
    tokenType: event.tokenMetadata?.standard,
  } as GenieAsset
}
