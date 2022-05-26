import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import dayjs from 'dayjs'
import { utils } from 'ethers/lib/ethers'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { START_OF_TIME } from 'src/features/dataApi/constants'
import {
  CovalentBalances,
  CovalentHistoricalPriceItem,
  CovalentHistoricalPrices,
  CovalentWalletBalanceItem,
} from 'src/features/dataApi/covalentTypes'
import {
  DailyPrice,
  DailyPrices,
  SerializablePortfolioBalance,
  SpotPrices,
} from 'src/features/dataApi/types'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { buildCurrencyId, CurrencyId } from 'src/utils/currencyId'
import { percentDifference } from 'src/utils/statistics'

const COVALENT_API = 'https://api.covalenthq.com/v1/'

// Extracted to be used in multiple response transformations.
function reduceItemResponse(items: CovalentWalletBalanceItem[], chainId: ChainId) {
  return items.reduce<{
    [currencyId: CurrencyId]: SerializablePortfolioBalance
  }>((memo, item) => {
    if (item.quote === 0) return memo
    const contract_address = utils.getAddress(item.contract_address)
    memo[buildCurrencyId(chainId, contract_address)] = {
      balance: item.balance,
      balanceUSD: item.quote,
      contract_address,
      contract_ticker_symbol: item.contract_ticker_symbol,
      quote_rate: item.quote_rate,
      quote_rate_24h: item.quote_rate_24h,
    }
    return memo
  }, {})
}

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
    /**
     * Fetches portfolio balances for a given account address.
     * https://www.covalenthq.com/docs/api/#/0/Get%20token%20balances%20for%20address/USD/1
     */
    balances: builder.query<
      { [currencyId: CurrencyId]: SerializablePortfolioBalance },
      { chainId: ChainId; address: Address }
    >({
      query: ({ chainId, address }) =>
        `${chainId}/address/${address}/balances_v2/?${serializedBaseQueryOptions}`,
      transformResponse: (response: { data: CovalentBalances }, _, args) => {
        return reduceItemResponse(response.data.items, args.chainId)
      },
    }),

    /**
     * Fetches spot prices for the given chainId and addresses.
     * Note: leverages the historical token prices endpoint instead of spot prices
     *       to get 24h change, and chain disambiguation.
     * https://www.covalenthq.com/docs/api/#/0/Get%20historical%20prices%20by%20ticker%20symbol/USD/1
     */
    spotPrices: builder.query<SpotPrices, { chainId: ChainId; addresses: Address[] }>({
      query: ({ addresses, chainId }) => {
        const yesterday = dayjs().subtract(1, 'day').startOf('day').format('YYYY-MM-DD')
        const q = serializeQueryParams({
          ...baseQueryOptions,
          ['prices-at-asc']: false, // prices in chronological descending order
          from: yesterday,
        })
        // TODO: send a body to avoid url char limit
        const serializedAddresses = addresses.join(',')
        return `pricing/historical_by_addresses_v2/${chainId}/${baseQueryOptions['quote-currency']}/${serializedAddresses}/?${q}`
      },
      transformResponse: (response: { data: CovalentHistoricalPrices }, _, args) =>
        response.data.reduce<SpotPrices>((spotPrices, cur) => {
          if (cur.prices.length < 2) return spotPrices

          // first will always be today as result is in chronological descending order
          const [today, yesterday] = cur.prices
          spotPrices[buildCurrencyId(args.chainId, utils.getAddress(cur.contract_address))] = {
            price: today.price,
            relativeChange24: percentDifference(yesterday.price, today.price),
          }
          return spotPrices
        }, {}),
    }),

    /**
     * Fetches daily prices given a chain and contract address.
     * https://www.covalenthq.com/docs/api/#/0/Get%20historical%20prices%20by%20ticker%20symbol/USD/1
     *
     * PERF: consider batching addresses
     */
    dailyTokenPrices: builder.query<
      DailyPrices,
      { address: string; chainId: ChainId; from?: string; to?: string }
    >({
      query: ({ address, chainId, from = START_OF_TIME, to = '' }) => {
        const q = serializeQueryParams({
          ...baseQueryOptions,
          ['prices-at-asc']: false, // prices in chronological descending order
          from,
          to,
        })
        return `pricing/historical_by_addresses_v2/${chainId}/${baseQueryOptions['quote-currency']}/${address}/?${q}`
      },
      transformResponse: (response: { data: CovalentHistoricalPrices }) =>
        response.data?.[0]?.prices.map(
          (p: CovalentHistoricalPriceItem): DailyPrice => ({
            timestamp: dayjs(p.date).unix(),
            close: p.price,
          })
        ) ?? [],
    }),
  }),
})

export const { useBalancesQuery, useDailyTokenPricesQuery, useSpotPricesQuery } = dataApi
