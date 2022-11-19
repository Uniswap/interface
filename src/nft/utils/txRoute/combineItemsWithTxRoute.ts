import { BuyItem, GenieAsset, isPooledMarket, Markets, PriceInfo, RoutingItem, UpdatedGenieAsset } from 'nft/types'
import {
  calcAvgGroupPoolPrice,
  formatWeiToDecimal,
  isInSameMarketplaceCollection,
  isInSameSudoSwapPool,
} from 'nft/utils'

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

const isAveragePriceOfPooledAssets = (
  asset: GenieAsset,
  numberOfAssetsInPool: number,
  expectedPrice: string
): boolean => {
  return !isPriceDiff(calcAvgGroupPoolPrice(asset, numberOfAssetsInPool), expectedPrice)
}

const isAveragedPrice = (
  item: UpdatedGenieAsset,
  items: UpdatedGenieAsset[],
  route: RoutingItem,
  txRoute?: RoutingItem[]
): boolean => {
  if (!(route && 'priceInfo' in route.assetOut)) return false

  return (
    !!item.marketplace &&
    isPooledMarket(item.marketplace) &&
    isAveragePriceOfPooledAssets(
      item,
      items.filter((routeItem) => itemInRouteAndSamePool(item, routeItem, txRoute)).length,
      route.assetOut.priceInfo.basePrice
    )
  )
}

const getRouteForItem = (item: UpdatedGenieAsset, txRoute?: RoutingItem[]): RoutingItem | undefined => {
  return txRoute && txRoute.find((r) => r.action === 'Buy' && isTheSame(item, r.assetOut))
}

const itemHasRoute = (item: UpdatedGenieAsset, txRoute?: RoutingItem[]): boolean => {
  return !!getRouteForItem(item, txRoute)
}

const itemInRouteAndSamePool = (
  item: UpdatedGenieAsset,
  routeItem: UpdatedGenieAsset,
  txRoute?: RoutingItem[]
): boolean => {
  return (
    itemHasRoute(routeItem, txRoute) &&
    (item.marketplace === Markets.Sudoswap
      ? isInSameSudoSwapPool(item, routeItem)
      : isInSameMarketplaceCollection(item, routeItem))
  )
}

export const combineBuyItemsWithTxRoute = (
  items: UpdatedGenieAsset[],
  txRoute?: RoutingItem[]
): UpdatedGenieAsset[] => {
  return items.map((item) => {
    const route = getRouteForItem(item, txRoute)

    // if the item is not found in txRoute, it means it's no longer for sale
    if (txRoute && !route) {
      return {
        ...item,
        isUnavailable: true,
      }
    }

    const newPriceInfo = item.updatedPriceInfo ? item.updatedPriceInfo : item.priceInfo

    // if the price changed
    if (route && 'priceInfo' in route.assetOut) {
      if (isPriceDiff(newPriceInfo.basePrice, route.assetOut.priceInfo.basePrice)) {
        if (!isAveragedPrice(item, items, route, txRoute)) {
          return {
            ...item,
            updatedPriceInfo: route.assetOut.priceInfo,
          }
        }
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
