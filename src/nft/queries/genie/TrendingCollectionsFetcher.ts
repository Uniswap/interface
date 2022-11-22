import { TimePeriod, TrendingCollection } from '../../types'
import { getNftUrl } from '../url'

export const fetchTrendingCollections = async (payload: {
  volumeType: 'eth' | 'nft'
  timePeriod: TimePeriod
  size: number
}): Promise<TrendingCollection[]> => {
  const url = `${getNftUrl()}/collections/trending`
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
