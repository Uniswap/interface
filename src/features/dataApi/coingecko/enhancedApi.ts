import { ChainId, ChainIdTo } from 'src/constants/chains'
import { generatedApi } from 'src/features/dataApi/coingecko/generatedApi'
import {
  CoingeckoListCoin,
  CoinIdAndCurrencyIdMappings,
  GetCoinsMarketsResponse,
  GetCoinsSearchResponse,
} from 'src/features/dataApi/coingecko/types'
import { buildCurrencyId, CurrencyId } from 'src/utils/currencyId'
import { getKeys } from 'src/utils/objects'

// Close to "infinite" to avoid redownloading the large list and keep in cache while app is running
// https://github.com/reduxjs/redux-toolkit/discussions/2347#discussioncomment-2805964
const KEEP_COINGECKO_LIST_DATA_FOR = 100000000 // about 3 years

// Coingecko platforms are similar to our oconcept of chains but have their own unique ids
// NOTE: Alternative to hardcoding: query `asset_platforms` endpoint and filter by chain_identifier
const supportedCoingeckoPlatforms: { [coingeckoPlatform: string]: ChainId } = {
  ethereum: ChainId.Mainnet,
  'polygon-pos': ChainId.Polygon,
  'optimistic-ethereum': ChainId.Optimism,
  'arbitrum-one': ChainId.ArbitrumOne,
}

const enhancedApi = generatedApi.enhanceEndpoints({
  endpoints: {
    getCoinsMarkets: {
      transformResponse: (data: GetCoinsMarketsResponse): GetCoinsMarketsResponse =>
        // removes result without a market_cap which indicates low quality coins
        data?.filter((coin) => Boolean(coin.market_cap)),
    },
    getCoinsList: {
      transformResponse: (data: Nullable<CoingeckoListCoin[]>) => {
        return data?.reduce<CoinIdAndCurrencyIdMappings>(
          (acc, coin) => {
            // Coingecko lists platforms/chains on which the coin is deployed
            // For each of those platforms, we extract the token address of the coin
            //  and build a map of token_address<->coin id

            // build coin id -> currency id[]
            const chainIdToCurrencyId = getKeys(coin.platforms).reduce<ChainIdTo<CurrencyId>>(
              (coinAcc, platform) => {
                // Coingecko platforms map to token contract addresses on that platform/chain
                const tokenAddress = coin.platforms[platform]
                const chainId = supportedCoingeckoPlatforms[platform]

                // ignores any chains we do not support
                if (!tokenAddress || !chainId) return coinAcc

                coinAcc[chainId] = buildCurrencyId(chainId, tokenAddress)
                return coinAcc
              },
              {}
            )
            acc.coinIdToCurrencyIds[coin.id] = chainIdToCurrencyId

            // build currency ids -> coin id
            for (const _currencyId of Object.values(chainIdToCurrencyId)) {
              acc.currencyIdToCoinId[_currencyId] = coin.id
            }

            return acc
          },
          { coinIdToCurrencyIds: {}, currencyIdToCoinId: {} }
        )
      },
      keepUnusedDataFor: KEEP_COINGECKO_LIST_DATA_FOR,
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
