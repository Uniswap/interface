import { parseEther } from '@ethersproject/units'

import { Trait } from '../../hooks/useCollectionFilters'
import { AssetPayload, CollectionSort, GenieAsset } from '../../types'

export const formatTraits = (traits: Trait[]) => {
  const traitObj: Record<string, string[]> = {}
  const nonMetaTraits = traits.filter((el) => el.trait_type !== 'Number of traits')
  for (const trait of nonMetaTraits) {
    if (!traitObj[trait.trait_type]) traitObj[trait.trait_type] = [trait.trait_value]
    else traitObj[trait.trait_type].push(trait.trait_value)
  }

  return traitObj
}

const formatPrice = (x: number | string) => parseEther(x.toString()).toString()

export const AssetsFetcher = async ({
  contractAddress,
  tokenId,
  sort,
  markets,
  price,
  rarityRange,
  traits,
  searchText,
  notForSale,
  pageParam,
}: {
  contractAddress: string
  tokenId?: string
  offset?: number
  sort?: CollectionSort
  markets?: string[]
  price?: { high?: number | string; low?: number | string; symbol: string }
  rarityRange?: Record<string, unknown>
  traits?: Trait[]
  searchText?: string
  notForSale?: boolean
  pageParam: number
}): Promise<GenieAsset[] | undefined> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/assets`
  const payload: AssetPayload = {
    filters: {
      address: contractAddress.toLowerCase(),
      traits: {},
      searchText,
      notForSale,
      tokenId,
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
    limit: 25,
    offset: pageParam * 25,
  }
  if (sort) {
    payload.sort = sort
  }
  if (markets) {
    payload.markets = markets
  }
  const numberOfTraits = traits?.filter((trait) => trait.trait_type === 'Number of traits')
  if (numberOfTraits) {
    payload.filters.numTraits = numberOfTraits.map((el) => ({ traitCount: el.trait_value }))
  }
  if (traits) {
    payload.filters.traits = formatTraits(traits)
  }

  const low = price?.low ? parseFloat(formatPrice(price.low)) : undefined
  const high = price?.high ? parseFloat(formatPrice(price.high)) : undefined

  // Only consider sending eth price filters when searching
  // across listed assets
  if (!notForSale) {
    if (low || high) {
      payload.filters.currentEthPrice = {}
    }

    if (low && payload.filters.currentEthPrice) {
      payload.filters.currentEthPrice.$gte = low
    }

    if (high && payload.filters.currentEthPrice) {
      payload.filters.currentEthPrice.$lte = high
    }
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    // Unfortunately have to include totalCount into each element. The fetcher
    // for swr infinite must return an array.
    for (const x of data.data) {
      x.totalCount = data.totalCount
      x.numTraitsByAmount = data.numTraitsByAmount
    }

    // Uncomment the lines belo if you want to simulate a delay
    // await (async () => await new Promise((resolve) => setTimeout(resolve, 50000)))();

    return data.data
  } catch (e) {
    console.log(e)
    return
  }
}
