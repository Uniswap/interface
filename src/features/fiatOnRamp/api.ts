import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import dayjs from 'dayjs'
import { config } from 'src/config'
import { uniswapUrls } from 'src/constants/urls'
import {
  FiatOnRampWidgetUrlQueryParameters,
  FiatOnRampWidgetUrlQueryResponse,
  MoonpayIPAddressesResponse,
  MoonpayTransactionsResponse,
} from 'src/features/fiatOnRamp/types'
import { extractFiatOnRampTransactionDetails } from 'src/features/transactions/history/conversion/extractFiatPurchaseTransactionDetails'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'
import { ONE_MINUTE_MS } from 'src/utils/time'

const COMMON_PARAMS = serializeQueryParams({ apiKey: config.moonpayApiKey })
const TRANSACTION_NOT_FOUND = 404
const FIAT_ONRAMP_STALE_TX_TIMEOUT = ONE_MINUTE_MS * 20

// List of currency codes that our Moonpay account supports
// Manually maintained for now
const supportedCurrencyCodes = [
  'eth',
  'eth_arbitrum',
  'eth_optimism',
  'eth_polygon',
  'polygon',
  'usdc_arbitrum',
  'usdc_optimism',
  'usdc_polygon',
]

export const fiatOnRampApi = createApi({
  reducerPath: 'fiatOnRampApi',
  baseQuery: fetchBaseQuery({ baseUrl: config.moonpayApiUrl }),
  endpoints: (builder) => ({
    isFiatOnRampBuyAllowed: builder.query<boolean | null, void>({
      // TODO: consider a reverse proxy for privacy reasons
      query: () => `/v4/ip_address?${COMMON_PARAMS}`,
      transformResponse: (response: MoonpayIPAddressesResponse) => response.isBuyAllowed ?? null,
    }),
    fiatOnRampWidgetUrl: builder.query<
      string,
      FiatOnRampWidgetUrlQueryParameters & { ownerAddress: Address }
    >({
      query: ({ ownerAddress, ...rest }) => ({
        url: config.moonpayWidgetApiUrl,
        body: {
          ...rest,
          redirectURL: `${uniswapUrls.appBaseUrl}/?screen=transaction&fiatOnRamp=true&userAddress=${ownerAddress}`,
          walletAddresses: JSON.stringify(
            supportedCurrencyCodes.reduce<Record<string, Address>>((acc, currencyCode: string) => {
              acc[currencyCode] = ownerAddress
              return acc
            }, {})
          ),
        },
        method: 'POST',
      }),
      transformResponse: (response: FiatOnRampWidgetUrlQueryResponse) => response.url,
    }),
  }),
})

export const { useIsFiatOnRampBuyAllowedQuery, useFiatOnRampWidgetUrlQuery } = fiatOnRampApi

/**
 * Utility to fetch fiat onramp transactions from moonpay
 */
export function fetchFiatOnRampTransaction(
  previousTransactionDetails: TransactionDetails
): Promise<TransactionDetails | undefined> {
  return fetch(
    `${config.moonpayApiUrl}/v1/transactions/ext/${previousTransactionDetails.id}?apiKey=${config.moonpayApiKey}`
  ).then((res) => {
    if (res.status === TRANSACTION_NOT_FOUND) {
      // If Moonpay API returned 404 for the given external trasnsaction id
      // (meaning it was not /yet/ found on their end, e.g. user has not finished flow)
      // we opt to put a dummy placeholder transaction in the user's activity feed.
      // to avoid leaving placeholders as "pending" for too long, we mark them
      // as "unknown" after some time
      const isStale = dayjs(previousTransactionDetails.addedTime).isBefore(
        dayjs().subtract(FIAT_ONRAMP_STALE_TX_TIMEOUT)
      )

      if (isStale) {
        logger.debug(
          'fiatOnRamp/api',
          'fetchFiatOnRampTransaction',
          `Transaction with id ${previousTransactionDetails.id} not found.`
        )

        return {
          ...previousTransactionDetails,
          // use `Unknown` status to denote a transaction missing from backend
          // this transaction will later get deleted
          status: TransactionStatus.Unknown,
        }
      } else {
        logger.debug(
          'fiatOnRamp/api',
          'fetchFiatOnRampTransaction',
          `Transaction with id ${previousTransactionDetails.id} not found, but not stale yet.`
        )

        return previousTransactionDetails
      }
    }

    return res.json().then((transactions: MoonpayTransactionsResponse) =>
      transactions
        .map(extractFiatOnRampTransactionDetails)
        .filter((tx): tx is TransactionDetails => Boolean(tx))
        // take the most recent transaction
        .sort((a, b) => a.addedTime - b.addedTime)
        .at(0)
    )
  })
}
