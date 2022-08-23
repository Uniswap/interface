import { Chain, Currency } from 'graphql/data/__generated__/TopTokenQuery.graphql'
import { useTopTokenQuery } from 'graphql/data/TopTokenQuery'
import { useEffect, useState } from 'react'

export enum TimePeriod {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  ALL,
}

interface IAmount {
  currency: Currency | null
  value: number | null
}

export type TokenData = {
  name: string | null | undefined
  chain: Chain | undefined
  symbol: string | null | undefined
  price: IAmount | null | undefined
  marketCap: IAmount | null | undefined
  volume: Record<TimePeriod, IAmount | null | undefined>
  isFavorite: boolean
}

export interface UseTopTokensResult {
  data: Record<string, TokenData> | null
  error: string | null
  loading: boolean
}

const useExplorePageQuery = (favoriteTokenAddresses: string[]): UseTopTokensResult => {
  const [data, setData] = useState<Record<string, TokenData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const topTokens = useTopTokenQuery(1)
  //console.log(topTokens)

  const fetchTopTokens = async (favoriteTokenAddresses: string[]): Promise<Record<string, TokenData> | void> => {
    try {
      setLoading(true)
      setError(null)
      favoriteTokenAddresses.forEach((address) => {
        topTokens[address].isFavorite = true
      })
      return topTokens
    } catch (e) {
      setError('Error fetching top tokens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchTopTokens(favoriteTokenAddresses)
      .then((data) => {
        if (data) setData(data)
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [favoriteTokenAddresses])

  return { data, error, loading }
}

export default useExplorePageQuery
