import { useEffect, useMemo, useState } from 'react'

import useParsedQueryString from 'hooks/useParsedQueryString'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'

export default function useGetTokensForSearchBox(
  searchText: string,
  timeframe: TrueSightTimeframe,
  isShowTrueSightOnly: boolean,
) {
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
            rawResult.tokens = isShowTrueSightOnly
              ? rawResult.tokens.filter((token: TrueSightTokenData) => token.discovered_on > 0)
              : rawResult.tokens
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
  }, [isShowTrueSightOnly, searchText, tab, timeframe])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
