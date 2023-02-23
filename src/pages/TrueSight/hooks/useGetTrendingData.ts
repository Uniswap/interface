import { useEffect, useMemo, useState } from 'react'

import { TRUESIGHT_API } from 'constants/env'
import { TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/networks'
import { TrueSightTokenResponse } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'

export default function useGetTrendingData(filter: TrueSightFilter, currentPage: number, itemPerPage: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [data, setData] = useState<TrueSightTokenResponse>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeframe = filter.timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
        const url = `${TRUESIGHT_API}/api/v1/trending?timeframe=${timeframe}&page_number=${
          filter.isShowTrueSightOnly ? 0 : currentPage - 1
        }&page_size=${filter.isShowTrueSightOnly ? 9999 : itemPerPage}&search_token_id=${
          filter.selectedTokenData?.token_id ?? ''
        }&search_token_tag=${filter.selectedTag ?? ''}`
        setError(undefined)
        setIsLoading(true)
        const response = await fetch(url)
        if (response.ok) {
          const json = await response.json()
          const rawResult: TrueSightTokenResponse = json.data

          let result: TrueSightTokenResponse
          if (filter.isShowTrueSightOnly) {
            const trueSightTokens = rawResult.tokens.filter(token => token.discovered_on > 0)
            const start = (currentPage - 1) * itemPerPage
            const end = currentPage * itemPerPage
            result = {
              total_number_tokens: trueSightTokens.length,
              tokens: trueSightTokens.slice(start, end),
            }
          } else {
            result = rawResult
          }

          // Sort platforms
          result.tokens = result.tokens.map(token => {
            const priorityNetworks = Object.keys(TRENDING_SOON_SUPPORTED_NETWORKS)
            const platforms = new Map<string, string>()
            for (let i = 0; i < priorityNetworks.length; i++) {
              const network = priorityNetworks[i]
              const address = (token.platforms as unknown as { [p: string]: string })[network]
              if (address) {
                platforms.set(network, address)
              }
            }
            return {
              ...token,
              platforms,
            }
          })

          // Filter network in frontend
          if (filter.selectedNetwork) {
            const selectedNetworkKey = Object.keys(TRENDING_SOON_SUPPORTED_NETWORKS).find(
              (key: string) => TRENDING_SOON_SUPPORTED_NETWORKS[key] === filter.selectedNetwork,
            )
            const filteredTokens = result.tokens.filter(tokenData =>
              tokenData.present_on_chains.includes(selectedNetworkKey as string),
            )
            result = {
              total_number_tokens: filteredTokens.length,
              tokens: filteredTokens,
            }
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
