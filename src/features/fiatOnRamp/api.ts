import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { config } from 'src/config'
import {
  FiatOnRampWidgetUrlQueryParameters,
  FiatOnRampWidgetUrlQueryResponse,
  MoonpayIPAddressesResponse,
  MoonpayTransactionsResponse,
} from 'src/features/fiatOnRamp/types'
import { extractFiatOnRampTransactionDetails } from 'src/features/transactions/history/conversion/extractFiatPurchaseTransactionDetails'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { TransactionDetails } from 'src/features/transactions/types'

const COMMON_PARAMS = serializeQueryParams({ apiKey: config.moonpayApiKey })

export const fiatOnRampApi = createApi({
  reducerPath: 'fiatOnRampApi',
  baseQuery: fetchBaseQuery({ baseUrl: config.moonpayApiUrl }),
  endpoints: (builder) => ({
    isFiatOnRampBuyAllowed: builder.query<boolean | null, void>({
      // TODO: consider a reverse proxy for privacy reasons
      query: () => `/v4/ip_address?${COMMON_PARAMS}`,
      transformResponse: (response: MoonpayIPAddressesResponse) => response.isBuyAllowed ?? null,
    }),
    fiatOnRampWidgetUrl: builder.query<string, FiatOnRampWidgetUrlQueryParameters>({
      query: ({ walletAddresses, ...rest }) => ({
        url: config.moonpayWidgetApiUrl,
        body: {
          // default external tx id to wallet address for easy retrieval
          externalTransactionId: walletAddresses.eth,
          redirectURL: `https://uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=${walletAddresses.eth}`,
          ...rest,
          // overrides provided `walletAddresses`
          walletAddresses: JSON.stringify(walletAddresses),
        },
        method: 'POST',
      }),
      transformResponse: (response: FiatOnRampWidgetUrlQueryResponse) => response.url,
    }),
    // returns all transactions associated with an `externalTransactionId`
    fiatOnRampTransactions: builder.query<TransactionDetails[], string>({
      query: (externalTransactionId: string) =>
        `/v1/transactions/ext/${externalTransactionId}?${COMMON_PARAMS}`,
      transformResponse: (response: MoonpayTransactionsResponse): TransactionDetails[] =>
        // reduce cache size by filtering early
        // TransactionDetails should be fully serializable without `providers.request`
        response
          .filter((tx) => tx.status !== 'completed')
          .map(extractFiatOnRampTransactionDetails)
          .filter((tx): tx is TransactionDetails => Boolean(tx)),
    }),
  }),
})

export const {
  useIsFiatOnRampBuyAllowedQuery,
  useFiatOnRampWidgetUrlQuery,
  useFiatOnRampTransactionsQuery,
} = fiatOnRampApi
