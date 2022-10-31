import { parseEther } from '@ethersproject/units'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { AssetPayload, GenieAsset } from 'nft/types'

import { formatTraits } from './AssetsFetcher'

const formatPrice = (x: number | string) => parseEther(x.toString()).toString()

export const fetchSweep = async ({
  contractAddress,
  markets,
  price,
  rarityRange,
  traits,
}: {
  contractAddress: string
  markets?: string[]
  price?: { high?: number | string; low?: number | string; symbol: string }
  rarityRange?: Record<string, unknown>
  traits?: Trait[]
}): Promise<GenieAsset[]> => {
  const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/assets`
  const payload: AssetPayload = {
    filters: {
      address: contractAddress.toLowerCase(),
      traits: {},
      ...rarityRange,
    },
    fields: {
      address: 1,
      name: 1,
      id: 1,
      imageUrl: 1,
      currentPrice: 1,
      currentUsdPrice: 1,
      paymentToken: 1,
      animationUrl: 1,
      notForSale: 1,
      rarity: 1,
      tokenId: 1,
    },
    limit: 50,
    offset: 0,
  }

  if (markets) {
    payload.markets = markets
  }

  if (traits) {
    payload.filters.traits = formatTraits(traits)
  }

  const low = price?.low ? parseFloat(formatPrice(price.low)) : undefined
  const high = price?.high ? parseFloat(formatPrice(price.high)) : undefined

  if (low || high) {
    payload.filters.currentEthPrice = {}
  }

  if (low && payload.filters.currentEthPrice) {
    payload.filters.currentEthPrice.$gte = low
  }

  if (high && payload.filters.currentEthPrice) {
    payload.filters.currentEthPrice.$lte = high
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await r.json()

  return data.data
}
