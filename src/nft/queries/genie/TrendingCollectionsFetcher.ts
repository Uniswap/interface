import { blocklistedCollections } from 'nft/utils'

import { TimePeriod, TrendingCollection } from '../../types'

const NFT_API_URL = process.env.REACT_APP_TEMP_API_URL
export const fetchTrendingCollections = async (payload: {
  volumeType: 'eth' | 'nft'
  timePeriod: TimePeriod
  size: number
}): Promise<TrendingCollection[]> => {
  if (!NFT_API_URL) return Promise.resolve([])
  const url = `${NFT_API_URL}/nft/collections/trending`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await r.json()

  return data.filter((collection: { address: string }) => !blocklistedCollections.includes(collection.address)) ?? []
}
