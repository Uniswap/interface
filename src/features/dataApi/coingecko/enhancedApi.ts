import { NATIVE_ADDRESS } from 'src/constants/addresses'
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

// Coingecko platforms are similar to our concept of chains but have their own unique ids
// NOTE: Alternative to hardcoding: query `asset_platforms` endpoint and filter by chain_identifier
const supportedCoingeckoPlatforms: { [coingeckoPlatform: string]: ChainId } = {
  ethereum: ChainId.Mainnet,
  'polygon-pos': ChainId.Polygon,
  'optimistic-ethereum': ChainId.Optimism,
  'arbitrum-one': ChainId.ArbitrumOne,
}

// We need to manually insert mappings to link our native addresses to the associated CG id.
// Note: for now, we only care about one version of ETH, as same native address for all chains.
const CHAIN_ID_TO_ADDRESS_TO_COIN_ID_MAP: Partial<Record<ChainId, Record<Address, string>>> = {
  [ChainId.Mainnet]: {
    [NATIVE_ADDRESS]: 'ethereum',
  },
}

const enhancedApi = generatedApi.enhanceEndpoints({
  endpoints: {
    getCoinsMarkets: {
      transformResponse: (data: GetCoinsMarketsResponse): GetCoinsMarketsResponse =>
        // removes result without a market_cap which indicates low quality coins
        data?.filter((coin) => Boolean(coin.market_cap)),
    },
    getCoinsList: {
      transformResponse: (data: NullUndefined<CoingeckoListCoin[]>) => {
        const formattedData = data?.reduce<CoinIdAndCurrencyIdMappings>(
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
          {
            coinIdToCurrencyIds: {},
            currencyIdToCoinId: {},
          }
        )

        // Manually insert items for our native address representation
        if (formattedData) {
          for (const _chainId of getKeys(CHAIN_ID_TO_ADDRESS_TO_COIN_ID_MAP)) {
            for (const _address of getKeys(CHAIN_ID_TO_ADDRESS_TO_COIN_ID_MAP[_chainId])) {
              const coinId = CHAIN_ID_TO_ADDRESS_TO_COIN_ID_MAP[_chainId]?.[_address]
              const currencyId = buildCurrencyId(_chainId, _address)
              if (coinId && currencyId) {
                formattedData.currencyIdToCoinId[currencyId.toLocaleLowerCase()] = coinId // mimic CG lowercase address
                formattedData.coinIdToCurrencyIds[coinId] = {}
                formattedData.coinIdToCurrencyIds[coinId][_chainId] = currencyId
              }
            }
          }
        }

        return formattedData
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
