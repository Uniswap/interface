import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { utils } from 'ethers/lib/ethers'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { CovalentBalances, CovalentSpotPrices } from 'src/features/dataApi/covalentTypes'
import { SerializablePortfolioBalance, SpotPrices } from 'src/features/dataApi/types'
import { serializeQueryParams } from 'src/features/swap/utils'
import { buildCurrencyId, CurrencyId } from 'src/utils/currencyId'
import { percentDifference } from 'src/utils/statistics'

const COVALENT_API = 'https://api.covalenthq.com/v1/'

const baseQueryOptions = {
  ['quote-currency']: 'USD',
  format: 'JSON',
  // TODO: move key to auth header
  key: config.covalentApiKey,
}
const serializedBaseQueryOptions = serializeQueryParams(baseQueryOptions)

export const dataApi = createApi({
  reducerPath: 'dataApi',
  baseQuery: fetchBaseQuery({
    baseUrl: COVALENT_API,
  }),
  endpoints: (builder) => ({
    balances: builder.query<
      { [currencyId: CurrencyId]: SerializablePortfolioBalance },
      { chainId: ChainId; address: Address }
    >({
      query: ({ chainId, address }) =>
        `${chainId}/address/${address}/balances_v2/?${serializedBaseQueryOptions}`,
      transformResponse: (response: { data: CovalentBalances }, _, args) =>
        response.data.items.reduce<{ [currencyId: CurrencyId]: SerializablePortfolioBalance }>(
          (memo, item) => {
            // skips address validation for performance
            const contract_address = utils.getAddress(item.contract_address)
            memo[buildCurrencyId(args.chainId, contract_address)] = {
              balance: item.balance,
              balanceUSD: item.quote,
              relativeChange24: percentDifference(item.quote_rate, item.quote_rate_24h),
              contract_address,
              contract_ticker_symbol: item.contract_ticker_symbol,
            }
            return memo
          },
          {}
        ),
    }),

    spotPrices: builder.query<SpotPrices, { tickers: string[] }>({
      query: ({ tickers }) => {
        const q = serializeQueryParams({
          ...baseQueryOptions,
          ['page-size']: tickers.length,
          // TODO: send a body to avoid url char limit
          tickers: tickers.slice(0, 50).join(','),
        })
        return `pricing/tickers/?${q}`
      },
      transformResponse: (response: { data: CovalentSpotPrices }) =>
        response.data.items?.reduce<SpotPrices>((memo, item) => {
          // TODO: ensure app never has duplicate symbols?
          memo[item.contract_ticker_symbol] = item.quote_rate
          return memo
        }, {}),
    }),

    historicalTokenPrices: builder.query<unknown, { address: string; chainId: ChainId }>({
      query: ({ address, chainId }) => {
        const q = serializeQueryParams({
          ...baseQueryOptions,
          // TODO: revisit range
          from: '2022-01-01',
          to: '2022-03-01',
        })
        return `pricing/historical_by_address_v2/${chainId}/${baseQueryOptions['quote-currency']}/${address}/?${q}`
      },
      // TODO: transform response
      // transformResponse: () => {}
    }),

    historicalTickerPrices: builder.query<unknown, { ticker: string }>({
      query: ({ ticker }) => {
        const q = serializeQueryParams({
          ...baseQueryOptions,
          from: '2022-01-01',
          to: '2022-03-01',
        })
        return `pricing/historical/${baseQueryOptions['quote-currency']}/${ticker}/?${q}`
      },
      // TODO: transform response
      // transformResponse: () => {}
    }),
  }),
})

export const {
  useBalancesQuery,
  useHistoricalTickerPricesQuery,
  useHistoricalTokenPricesQuery,
  useSpotPricesQuery,
} = dataApi
