import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import dayjs from 'dayjs'
import { config } from 'src/config'
import { uniswapUrls } from 'src/constants/urls'
import {
  FiatOnRampWidgetUrlQueryParameters,
  FiatOnRampWidgetUrlQueryResponse,
  MoonpayIPAddressesResponse,
  MoonpayTransactionResponseItem,
  MoonpayTransactionsResponse,
} from 'src/features/fiatOnRamp/types'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName } from 'src/features/telemetry/constants'
import { MoonpayTransactionEventProperties } from 'src/features/telemetry/types'
import { extractFiatOnRampTransactionDetails } from 'src/features/transactions/history/conversion/extractFiatPurchaseTransactionDetails'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'
import { unnestObject } from 'src/utils/objects'
import { ONE_MINUTE_MS } from 'src/utils/time'

const COMMON_QUERY_PARAMS = serializeQueryParams({ apiKey: config.moonpayApiKey })
const TRANSACTION_NOT_FOUND = 404
const FIAT_ONRAMP_STALE_TX_TIMEOUT = ONE_MINUTE_MS * 20

// List of currency codes that our Moonpay account supports
// Manually maintained for now
const supportedCurrencyCodes = [
  'eth',
  'eth_arbitrum',
  'eth_optimism',
  'eth_polygon',
  'weth',
  'wbtc',
  'matic_polygon',
  'polygon',
  'usdc_arbitrum',
  'usdc_optimism',
  'usdc_polygon',
]

export const fiatOnRampApi = createApi({
  reducerPath: 'fiatOnRampApi',
  baseQuery: fetchBaseQuery({ baseUrl: config.moonpayApiUrl }),
  endpoints: (builder) => ({
    isFiatOnRampBuyAllowed: builder.query<boolean, void>({
      queryFn: () =>
        // TODO: [MOB-3888] consider a reverse proxy for privacy reasons
        fetch(`${config.moonpayApiUrl}/v4/ip_address?${COMMON_QUERY_PARAMS}`)
          .then((response) => response.json())
          .then((response: MoonpayIPAddressesResponse) => {
            sendAnalyticsEvent(EventName.FiatOnRampRegionCheck, {
              alpha3: response.alpha3,
              isAllowed: response.isAllowed,
              isBuyAllowed: response.isBuyAllowed,
              isSellAllowed: response.isSellAllowed,
              networkStatus: 'success',
            })
            return { data: response.isBuyAllowed ?? false }
          })
          .catch((e) => {
            logger.error('fiatOnRamp/api', 'isFiatOnRampBuyAllowed', e)
            sendAnalyticsEvent(EventName.FiatOnRampRegionCheck, { networkStatus: 'failed' })

            return { data: undefined, error: e }
          }),
    }),
    fiatOnRampWidgetUrl: builder.query<
      string,
      FiatOnRampWidgetUrlQueryParameters & { ownerAddress: Address }
    >({
      query: ({ ownerAddress, ...rest }) => ({
        url: config.moonpayWidgetApiUrl,
        body: {
          ...rest,
          defaultCurrencyCode: 'eth',
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
    `${config.moonpayApiUrl}/v1/transactions/ext/${previousTransactionDetails.id}?${COMMON_QUERY_PARAMS}`
  ).then((res) => {
    if (res.status === TRANSACTION_NOT_FOUND) {
      // If Moonpay API returned 404 for the given external trasnsaction id
      // (meaning it was not /yet/ found on their end, e.g. user has not finished flow)
      // we opt to put a dummy placeholder transaction in the user's activity feed.
      // to avoid leaving placeholders as "pending" for too long, we mark them
      // as "unknown" after some time
      const isStale = dayjs(previousTransactionDetails.addedTime).isBefore(
        dayjs().subtract(FIAT_ONRAMP_STALE_TX_TIMEOUT, 'ms')
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
          `Transaction with id ${
            previousTransactionDetails.id
          } not found, but not stale yet (${dayjs()
            .subtract(previousTransactionDetails.addedTime, 'ms')
            .unix()}s old).`
        )

        return previousTransactionDetails
      }
    }

    return res.json().then((transactions: MoonpayTransactionsResponse) =>
      extractFiatOnRampTransactionDetails(
        // log while we have the full moonpay tx response
        logMoonpayEvent(
          // take the most recent transaction
          transactions.sort((a, b) =>
            dayjs(a.createdAt).isAfter(dayjs(b.createdAt)) ? 1 : -1
          )?.[0]
        )
      )
    )
  })
}

// Logs an Amplitude event whenever we process a tx update from Moonpay
// NOTE: this will not attempt to dedupe by externalTxId
// TODO: Add ESLint ignore rule here when enabling explicit return types rule
function logMoonpayEvent(
  moonpayTransactionResponse?: MoonpayTransactionsResponse[0]
): MoonpayTransactionResponseItem | undefined {
  const extractProperties: (
    response: MoonpayTransactionsResponse[0]
  ) => MoonpayTransactionEventProperties = ({
    id,
    externalCustomerId,
    status,
    createdAt,
    updatedAt,
    baseCurrencyAmount,
    quoteCurrencyAmount,
    baseCurrency,
    currency,
    feeAmount,
    extraFeeAmount,
    networkFeeAmount,
    paymentMethod,
    failureReason,
    stages,
  }: MoonpayTransactionsResponse[0]) =>
    unnestObject({
      id,
      externalCustomerId,
      status,
      createdAt,
      updatedAt,
      baseCurrencyAmount,
      quoteCurrencyAmount,
      baseCurrency,
      currency,
      feeAmount,
      extraFeeAmount,
      networkFeeAmount,
      paymentMethod,
      failureReason,
      stages,
    })

  if (!moonpayTransactionResponse) return

  sendAnalyticsEvent(EventName.Moonpay, extractProperties(moonpayTransactionResponse))

  return moonpayTransactionResponse
}
