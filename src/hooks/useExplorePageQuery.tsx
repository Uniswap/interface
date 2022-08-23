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
}

export interface UseTopTokensResult {
  data: Record<string, TokenData> | null
  error: string | null
  loading: boolean
}

const useExplorePageQuery = (): UseTopTokensResult => {
  const [data, setData] = useState<Record<string, TokenData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const topTokens = useTopTokenQuery(1)

  useEffect(() => {
    try {
      setLoading(true)
      setError(null)
      if (topTokens) setData(topTokens)
    } catch (e) {
      setError('Error fetching top tokens')
    } finally {
      setLoading(false)
    }
  }, [topTokens])

  return { data, error, loading }
}

export default useExplorePageQuery
