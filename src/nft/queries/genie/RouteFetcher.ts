import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { GenieAsset, RouteResponse } from 'nft/types'

export const fetchRoute = async ({
  toSell,
  toBuy,
  senderAddress,
}: {
  toSell: any
  toBuy: any
  senderAddress: string
}): Promise<RouteResponse> => {
  const url = `${process.env.REACT_APP_TEMP_API_URL}/nft/route`
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
  tokenType?: NftStandard
  tokenId: string
  amount: number
  marketplace?: string
  collectionName?: string
}

const buildRouteItem = (item: GenieAsset): RouteItem => {
  return {
    id: item.id,
    symbol: item.priceInfo.baseAsset,
    name: item.name ?? '',
    decimals: parseFloat(item.priceInfo.baseDecimals),
    address: item.address,
    tokenType: item.tokenType,
    tokenId: item.tokenId,
    marketplace: item.marketplace,
    collectionName: item.collectionName,
    amount: 1,
    priceInfo: {
      basePrice: item.priceInfo.basePrice,
      baseAsset: item.priceInfo.baseAsset,
      ETHPrice: item.priceInfo.ETHPrice,
    },
  }
}
