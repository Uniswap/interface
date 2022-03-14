import { useEffect, useMemo, useState } from 'react'
import { TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import useParsedQueryString from 'hooks/useParsedQueryString'

export default function useGetTokensForSearchBox(searchText: string, timeframe: TrueSightTimeframe) {
  const [data, setData] = useState<TrueSightTokenData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  const { tab } = useParsedQueryString()

  useEffect(() => {
    const fetchData = async () => {
      if (searchText && tab) {
        try {
          const timeframeStr = timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
          const url = `${process.env.REACT_APP_TRUESIGHT_API}/api/v1/${
            tab === TrueSightTabs.TRENDING_SOON ? 'trending-soon' : 'trending'
          }?timeframe=${timeframeStr}&page_number=${0}&page_size=${5}&search_token_name=${searchText}`
          setError(undefined)
          setIsLoading(true)
          const response = await fetch(url)
          if (response.ok) {
            const json = await response.json()
            const rawResult = json.data
            setData(rawResult.tokens ?? [])
          }
          setIsLoading(false)
        } catch (err) {
          console.error(err)
          setError(err)
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [searchText, tab, timeframe])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
