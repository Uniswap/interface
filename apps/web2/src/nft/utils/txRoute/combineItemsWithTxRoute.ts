import { formatEther } from '@ethersproject/units'
import { BuyItem, GenieAsset, isPooledMarket, Markets, PriceInfo, RoutingItem, UpdatedGenieAsset } from 'nft/types'
import { calcAvgGroupPoolPrice, isInSameMarketplaceCollection, isInSameSudoSwapPool } from 'nft/utils'

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

const getPriceDiff = (oldPrice: string, newPrice: string): { hasPriceDiff: boolean; hasVisiblePriceDiff: boolean } => {
  const hasPriceDiff = oldPrice !== newPrice
  const hasVisiblePriceDiff = formatEther(oldPrice) !== formatEther(newPrice)

  return { hasPriceDiff, hasVisiblePriceDiff }
}

const isAveragePriceOfPooledAssets = (
  asset: GenieAsset,
  numberOfAssetsInPool: number,
  expectedPrice: string
): boolean => {
  return !getPriceDiff(calcAvgGroupPoolPrice(asset, numberOfAssetsInPool), expectedPrice).hasVisiblePriceDiff
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

export const compareAssetsWithTransactionRoute = (
  items: UpdatedGenieAsset[],
  txRoute?: RoutingItem[]
): { hasPriceAdjustment: boolean; updatedAssets: UpdatedGenieAsset[] } => {
  let hasPriceAdjustment = false
  const updatedAssets = items.map((item) => {
    const route = getRouteForItem(item, txRoute)

    if (txRoute && !route) {
      return {
        ...item,
        isUnavailable: true,
      }
    }

    let newPriceInfo = item.updatedPriceInfo ? item.updatedPriceInfo : item.priceInfo

    if (route && 'priceInfo' in route.assetOut) {
      const { hasPriceDiff, hasVisiblePriceDiff } = getPriceDiff(
        newPriceInfo.basePrice,
        route.assetOut.priceInfo.basePrice
      )

      newPriceInfo = route.assetOut.priceInfo
      hasPriceAdjustment = hasPriceDiff
      if (hasVisiblePriceDiff) {
        if (!isAveragedPrice(item, items, route, txRoute)) {
          return {
            ...item,
            updatedPriceInfo: newPriceInfo,
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

  return { hasPriceAdjustment, updatedAssets }
}
