import { Trait } from '../../hooks/useCollectionFilters'
import { AssetPayload, GenieAsset } from '../../types'
import { formatTraits } from './AssetsFetcher'

export const fetchSweep = async ({
  contractAddress,
  markets,
  traits = [],
}: {
  contractAddress: string
  markets?: string[]
  traits?: Trait[]
}): Promise<GenieAsset[]> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/assets`
  const payload: AssetPayload = {
    filters: { address: contractAddress.toLowerCase(), traits: {}, notForSale: false },
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
    },
    limit: 99,
    offset: 0,
  }

  if (markets) {
    payload.markets = markets
  }

  if (traits) {
    payload.filters.traits = formatTraits(traits)
  }

  const numberOfTraits = traits.filter((trait) => trait.trait_type === 'Number of traits')
  if (numberOfTraits) {
    payload.filters.numTraits = numberOfTraits.map((el) => ({ traitCount: el.trait_value }))
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
