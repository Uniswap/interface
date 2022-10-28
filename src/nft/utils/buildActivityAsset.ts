import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { ActivityEvent, GenieAsset } from 'nft/types'

export const buildActivityAsset = (event: ActivityEvent, collectionName: string, ethPriceInUSD: number): GenieAsset => {
  const assetUsdPrice = event.price
    ? formatEther(
        BigNumber.from(event.price)
          .mul(BigNumber.from(Math.trunc(ethPriceInUSD * 100)))
          .div(100)
      )
    : '0'

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
      ETHPrice: event.price,
      basePrice: event.price,
      baseAsset: 'ETH',
    },
    tokenType: event.tokenMetadata?.standard,
  } as GenieAsset
}
