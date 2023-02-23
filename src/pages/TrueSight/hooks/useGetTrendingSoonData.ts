import useSWR from 'swr'

import { TRUESIGHT_API } from 'constants/env'
import { TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/networks'
import { TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'

export interface TrueSightTokenData {
  token_id: number
  id_of_sources: {
    CoinGecko: string
    CoinMarketCap: string
  }
  order: number
  name: string
  symbol: string
  rank: number | undefined // Trending soon only

  // a Map keeps the order of keys as we add them
  // a regular object doesn't
  platforms: Map<string, string>
  present_on_chains: string[]
  predicted_date: number | undefined // Trending soon only
  market_cap: number
  number_holders: number
  trading_volume: number
  price: number
  social_urls: {
    [p: string]: string
  }
  tags: string[] | null
  discovered_on: number
  logo_url: string
  official_web: string
  price_change_percentage_24h: number
  discovered_details:
    | {
        price_discovered: number
        trading_volume_discovered: number
        market_cap_discovered: number
        number_holders_discovered: number
      }
    | undefined // Trending only
}

export interface TrueSightTokenResponse {
  total_number_tokens: number
  tokens: TrueSightTokenData[]
}

export default function useGetTrendingSoonData(filter: TrueSightFilter, maxItems: number) {
  const { data, error } = useSWR(
    `${TRUESIGHT_API}/api/v1/trending-soon?timeframe=${
      filter.timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
    }&page_number=0&page_size=${maxItems}&search_token_id=${
      filter.selectedTokenData?.token_id ?? ''
    }&search_token_tag=${filter.selectedTag ?? ''}`,
    async (url: string) => {
      const response = await fetch(url)
      if (response.ok) {
        const json = await response.json()
        let result: TrueSightTokenResponse = json.data

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
        return result
      } else {
        throw Error(response.statusText)
      }
    },
  )

  return { isLoading: !data && !error, data, error }
}
