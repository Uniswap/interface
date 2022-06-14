import { generatedApi } from 'src/features/dataApi/coingecko/generatedApi'
import {
  CoingeckoListCoin,
  GetCoinsListResponse,
  GetCoinsMarketsResponse,
  GetCoinsSearchResponse,
} from 'src/features/dataApi/coingecko/types'

// NOTE: Alternative to hardcoding: query `asset_platforms` endpoint and filter by chain_identifier
const supportedCoingeckoPlatforms = [
  'ethereum',
  'polygon-pos',
  'optimistic-ethereum',
  'arbitrum-one',
]

const enhancedApi = generatedApi.enhanceEndpoints({
  endpoints: {
    getCoinsMarkets: {
      transformResponse: (data: GetCoinsMarketsResponse): GetCoinsMarketsResponse =>
        // removes result without a market_cap which indicates low quality coins
        data?.filter((coin) => Boolean(coin.market_cap)),
    },
    getCoinsList: {
      transformResponse: (data: Nullable<CoingeckoListCoin[]>) =>
        data?.reduce<GetCoinsListResponse>((acc, coin) => {
          const isSupported = Object.keys(coin.platforms).some(
            (platform) =>
              // removes any non-ethereum coins
              Boolean(coin.platforms[platform]) && supportedCoingeckoPlatforms.includes(platform)
          )

          if (isSupported) {
            acc[coin.id] = coin
          }

          return acc
        }, {}),
    },
    getSearch: {
      // @ts-expect-error: cannot override generated types
      transformResponse: (data: GetCoinsSearchResponse) =>
        // extract `coins` property only to minimize size
        data ? (({ coins }: { coins: any[] }) => ({ coins }))(data) : undefined,
    },
  },
})

export { enhancedApi as coingeckoApi }
export const { useGetCoinsListQuery, useGetCoinsMarketsQuery, useGetSearchQuery } = enhancedApi
