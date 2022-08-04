import { TimePeriod, TrendingCollection } from '../../types'

export const fetchTrendingCollections = async (payload: {
  volumeType: 'eth' | 'nft'
  timePeriod: TimePeriod
  size: number
}): Promise<TrendingCollection[]> => {
  const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/collections/trending`
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
