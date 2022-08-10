import { GenieAsset, RouteResponse, TokenType } from '../../types'

export const fetchRoute = async ({
  toSell,
  toBuy,
  senderAddress,
}: {
  toSell: any
  toBuy: any
  senderAddress: string
}): Promise<RouteResponse> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/route`
  const payload = {
    sell: [...toSell].map((x) => buildRouteItem(x)),
    buy: [...toBuy].filter((x) => x.tokenType !== 'Dust').map((x) => buildRouteItem(x)),
    sender: senderAddress,
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await r.json()

  return data
}

type ApiPriceInfo = {
  basePrice: string
  baseAsset: string
  ETHPrice: string
}

type RouteItem = {
  id?: string
  symbol?: string
  name: string
  decimals: number
  address: string
  priceInfo: ApiPriceInfo
  tokenType: TokenType
  tokenId: string
  amount: number
  marketplace?: string
  collectionName?: string
}

const buildRouteItem = (item: GenieAsset): RouteItem => {
  return {
    id: item.id,
    symbol: item.priceInfo.baseAsset,
    name: item.name,
    decimals: item.decimals || 0, // 0 for fungible items
    address: item.address,
    tokenType: item.tokenType,
    tokenId: item.tokenId,
    marketplace: item.marketplace,
    collectionName: item.collectionName,
    amount: item.amount || 1, // default 1 for a single asset
    priceInfo: {
      basePrice: item.priceInfo.basePrice,
      baseAsset: item.priceInfo.baseAsset,
      ETHPrice: item.priceInfo.ETHPrice,
    },
  }
}
