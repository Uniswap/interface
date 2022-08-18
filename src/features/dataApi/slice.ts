import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import dayjs from 'dayjs'
import { REHYDRATE } from 'redux-persist'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { CovalentHistoricalPrices } from 'src/features/dataApi/covalentTypes'
import { SpotPrices } from 'src/features/dataApi/types'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { getChecksumAddress } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'
import { percentDifference } from 'src/utils/statistics'

const COVALENT_API = 'https://api.covalenthq.com/v1/'

const baseQueryOptions = {
  ['quote-currency']: 'USD',
  format: 'JSON',
  // TODO: move key to auth header
  key: config.covalentApiKey,
}

export const dataApi = createApi({
  reducerPath: 'dataApi',
  baseQuery: fetchBaseQuery({
    baseUrl: COVALENT_API,
  }),
  endpoints: (builder) => ({
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
          spotPrices[buildCurrencyId(args.chainId, getChecksumAddress(cur.contract_address))] = {
            price: today.price,
            relativeChange24: percentDifference(yesterday.price, today.price),
          }
          return spotPrices
        }, {}),
    }),
  }),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath]
    }
  },
})

export const { useSpotPricesQuery } = dataApi
