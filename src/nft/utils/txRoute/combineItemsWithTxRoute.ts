import { BigNumber } from '@ethersproject/bignumber'
import {
  BuyItem,
  GenieAsset,
  isPooledMarket,
  Markets,
  PriceInfo,
  RoutingItem,
  TokenType,
  UpdatedGenieAsset,
} from 'nft/types'
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

const isErc1155TokenCorrectSum = (item: UpdatedGenieAsset, items: UpdatedGenieAsset[], txRoute?: RoutingItem[]) => {
  if (!txRoute) return false

  const wishItems = items.filter(
    (wishItem) =>
      item.address === wishItem.address && item.tokenId === wishItem.tokenId && itemHasRoute(wishItem, txRoute)
  )
  const wishPrice = wishItems.reduce((acc, cur) => {
    const newPriceInfo = cur.updatedPriceInfo ?? cur.priceInfo
    const sum = acc.add(BigNumber.from(newPriceInfo.basePrice))
    return sum
  }, BigNumber.from(0))

  const routeItems = wishItems.map((wishItem) => getRouteForItem(wishItem, txRoute))
  const routePrice = routeItems.reduce((acc, cur) => {
    if (cur && 'priceInfo' in cur.assetOut) {
      const sum = acc.add(BigNumber.from(cur.assetOut.priceInfo.basePrice))
      return sum
    } else {
      return acc
    }
  }, BigNumber.from(0))

  return wishPrice.eq(routePrice)
}

const isCorrectCalculatedPrice = (
  item: UpdatedGenieAsset,
  items: UpdatedGenieAsset[],
  route: RoutingItem,
  txRoute?: RoutingItem[]
): boolean => {
  if (!(route && 'priceInfo' in route.assetOut)) return false

  if (item.tokenType === TokenType.ERC1155) {
    return isErc1155TokenCorrectSum(item, items, txRoute)
  }

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
        if (!isCorrectCalculatedPrice(item, items, route, txRoute)) {
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
