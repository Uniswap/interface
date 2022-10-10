import { BuyItem, GenieAsset, PriceInfo, RoutingItem, UpdatedGenieAsset } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils/currency'

const isTheSame = (item: GenieAsset, routeAsset: BuyItem | PriceInfo) => {
  // if route asset has id, match by id
  if ('id' in routeAsset && routeAsset.id) {
    return routeAsset.id === item.id
  } else {
    return (
      'address' in routeAsset &&
      routeAsset.address.toLowerCase() === item.address.toLowerCase() &&
      routeAsset.tokenId === item.tokenId
    )
  }
}

const isPriceDiff = (oldPrice: string, newPrice: string) => {
  return formatWeiToDecimal(oldPrice) !== formatWeiToDecimal(newPrice)
}

export const combineBuyItemsWithTxRoute = (
  items: UpdatedGenieAsset[],
  txRoute?: RoutingItem[]
): UpdatedGenieAsset[] => {
  return items.map((item) => {
    const route = txRoute && txRoute.find((r) => r.action === 'Buy' && isTheSame(item, r.assetOut))

    // if the item is not found in txRoute, it means it's no longer for sale
    if (txRoute && !route) {
      return {
        ...item,
        isUnavailable: true,
      }
    }

    const newPriceInfo = item.updatedPriceInfo ? item.updatedPriceInfo : item.priceInfo

    // if the price changed
    if (
      route &&
      'priceInfo' in route.assetOut &&
      isPriceDiff(newPriceInfo.basePrice, route.assetOut.priceInfo.basePrice)
    ) {
      return {
        ...item,
        updatedPriceInfo: route.assetOut.priceInfo,
      }
    }

    return {
      ...item,
      priceInfo: newPriceInfo,
      updatedPriceInfo: undefined,
      orderSource: route && 'orderSource' in route.assetOut ? route.assetOut.orderSource : undefined,
    }
  })
}
