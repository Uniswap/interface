import { useEffect, useMemo, useState } from 'react'
import { TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'
import { TrueSightTokenResponse } from 'pages/TrueSight/hooks/useGetTrendingSoonData'

export default function useGetTrendingData(filter: TrueSightFilter, currentPage: number, itemPerPage: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [data, setData] = useState<TrueSightTokenResponse>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeframe = filter.timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
        const url = `${process.env.REACT_APP_TRUESIGHT_API}/api/v1/trending?timeframe=${timeframe}&page_number=${
          filter.isShowTrueSightOnly ? 0 : currentPage - 1
        }&page_size=${filter.isShowTrueSightOnly ? 9999 : itemPerPage}&search_token_name=${filter.selectedTokenData
          ?.name ?? ''}&search_token_tag=${filter.selectedTag ?? ''}`
        setError(undefined)
        setIsLoading(true)
        const response = await fetch(url)
        if (response.ok) {
          const json = await response.json()
          const rawResult: TrueSightTokenResponse = json.data
          let result: TrueSightTokenResponse = {
            // eslint-disable-next-line @typescript-eslint/camelcase
            total_number_tokens: 0,
            tokens: [],
          }
          if (filter.isShowTrueSightOnly) {
            const trueSightTokens = rawResult.tokens.filter(token => token.discovered_on > 0)
            const start = (currentPage - 1) * itemPerPage
            const end = currentPage * itemPerPage
            result = {
              // eslint-disable-next-line @typescript-eslint/camelcase
              total_number_tokens: trueSightTokens.length,
              tokens: trueSightTokens.slice(start, end),
            }
          } else {
            result = rawResult
          }

          setData(result)
        }
        setIsLoading(false)
      } catch (err) {
        console.error(err)
        setError(err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, filter, itemPerPage])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
