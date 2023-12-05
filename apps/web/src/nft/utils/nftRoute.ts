import { NftRouteResponse, NftTrade } from 'graphql/data/__generated__/types-and-hooks'
import { Markets, RouteResponse, RoutingActions, RoutingItem, TokenType } from 'nft/types'

function buildRoutingItem(routingItem: NftTrade): RoutingItem {
  return {
    action: RoutingActions.Buy,
    marketplace: routingItem.marketplace.toLowerCase(),
    amountIn: routingItem.price.value,
    assetIn: {
      ETHPrice: routingItem.price.value,
      baseAsset: routingItem.price.currency,
      basePrice: routingItem.price.value,
      baseDecimals: '18',
    },
    amountOut: routingItem.amount.toString(),
    assetOut: {
      id: routingItem.id,
      decimals: 18,
      address: routingItem.contractAddress,
      priceInfo: {
        ETHPrice: routingItem.price.value,
        baseAsset: routingItem.price.currency,
        basePrice: routingItem.price.value,
        baseDecimals: '18',
      },
      tokenType: routingItem.tokenType as unknown as TokenType,
      tokenId: routingItem.tokenId,
      amount: routingItem.amount.toString(),
      marketplace: routingItem.marketplace.toLowerCase() as Markets,
      orderSource: 'api',
    },
  }
}

function buildRoutingItems(routingItems: readonly NftTrade[]): RoutingItem[] {
  return routingItems.map(buildRoutingItem)
}

export function buildRouteResponse(
  routeResponse: NftRouteResponse,
  useErc20Token: boolean
): { route: RoutingItem[]; routeResponse: RouteResponse } {
  const route = routeResponse.route ? buildRoutingItems(routeResponse.route) : []
  return {
    route,
    routeResponse: {
      route,
      valueToSend: useErc20Token ? undefined : routeResponse.sendAmount.value,
      data: routeResponse.calldata,
      to: routeResponse.toAddress,
    },
  }
}
