import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { MoonpayEventName } from '@uniswap/analytics-events'
import dayjs from 'dayjs'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { createSignedRequestParams, objectToQueryString } from 'wallet/src/data/utils'
import { walletContextValue } from 'wallet/src/features/wallet/context'

import {
  FORGetCountryResponse,
  FORQuoteRequest,
  FORQuoteResponse,
  FORServiceProvidersResponse,
  FORSupportedCountriesResponse,
  FORSupportedFiatCurrenciesRequest,
  FORSupportedFiatCurrenciesResponse,
  FORSupportedTokensRequest,
  FORSupportedTokensResponse,
  FORTransactionsRequest,
  FORTransactionsResponse,
  FORTransferInstitutionsRequest,
  FORTransferInstitutionsResponse,
  FORTransferWidgetUrlRequest,
  FORWidgetUrlRequest,
  FORWidgetUrlResponse,
  FiatOnRampTransactionDetails,
  FiatOnRampWidgetUrlQueryParameters,
  FiatOnRampWidgetUrlQueryResponse,
  MoonpayBuyQuoteResponse,
  MoonpayCurrency,
  MoonpayIPAddressesResponse,
  MoonpayLimitsResponse,
  MoonpayListCurrenciesResponse,
  MoonpayTransactionsResponse,
} from 'wallet/src/features/fiatOnRamp/types'
import { extractFiatOnRampTransactionDetails } from 'wallet/src/features/transactions/history/conversion/extractFiatOnRampTransactionDetails'
import { extractMoonpayTransactionDetails } from 'wallet/src/features/transactions/history/conversion/extractMoonpayTransactionDetails'
import { serializeQueryParams } from 'wallet/src/features/transactions/swap/utils'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { RootState } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'

const COMMON_QUERY_PARAMS = serializeQueryParams({ apiKey: config.moonpayApiKey })
const TRANSACTION_NOT_FOUND = 404
const FIAT_ONRAMP_STALE_TX_TIMEOUT = ONE_MINUTE_MS * 20

// List of currency codes that our Moonpay account supports
// Manually maintained for now
const supportedCurrencyCodes = [
  'eth',
  'eth_arbitrum',
  'eth_base',
  'eth_optimism',
  'eth_polygon',
  'weth',
  'wbtc',
  'matic_polygon',
  'polygon',
  'usdc_arbitrum',
  'usdc_base',
  'usdc_optimism',
  'usdc_polygon',
]

export const fiatOnRampApi = createApi({
  reducerPath: 'fiatOnRampApi',
  baseQuery: fetchBaseQuery({ baseUrl: config.moonpayApiUrl }),
  endpoints: (builder) => ({
    fiatOnRampIpAddress: builder.query<MoonpayIPAddressesResponse, void>({
      queryFn: () =>
        // TODO: [MOB-223] consider a reverse proxy for privacy reasons
        fetch(`${config.moonpayApiUrl}/v4/ip_address?${COMMON_QUERY_PARAMS}`)
          .then((response) => response.json())
          .then((response: MoonpayIPAddressesResponse) => {
            sendWalletAnalyticsEvent(MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED, {
              success: response.isBuyAllowed ?? false,
              networkError: false,
            })
            return { data: response }
          })
          .catch((e) => {
            sendWalletAnalyticsEvent(MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED, {
              success: false,
              networkError: true,
            })

            return { data: undefined, error: e }
          }),
    }),
    fiatOnRampSupportedTokens: builder.query<
      MoonpayCurrency[],
      {
        isUserInUS: boolean
        stateInUS?: string
      }
    >({
      queryFn: ({ isUserInUS, stateInUS }) =>
        // TODO: [MOB-223] consider a reverse proxy for privacy reasons
        fetch(`${config.moonpayApiUrl}/v3/currencies?${COMMON_QUERY_PARAMS}`)
          .then((response) => response.json())
          .then((response: MoonpayListCurrenciesResponse) => {
            const moonpaySupportField = __DEV__ ? 'supportsTestMode' : 'supportsLiveMode'
            return {
              data: response.filter(
                (c) =>
                  c.type === 'crypto' &&
                  c[moonpaySupportField] &&
                  (!isUserInUS ||
                    (c.isSupportedInUS &&
                      (!stateInUS || c.notAllowedUSStates.indexOf(stateInUS) === -1)))
              ),
            }
          })
          .catch((e) => {
            return { data: undefined, error: e }
          }),
    }),
    fiatOnRampBuyQuote: builder.query<
      MoonpayBuyQuoteResponse,
      {
        quoteCurrencyCode: string
        baseCurrencyCode: string
        baseCurrencyAmount: string
        areFeesIncluded: boolean
      }
    >({
      queryFn: ({ quoteCurrencyCode, baseCurrencyCode, baseCurrencyAmount, areFeesIncluded }) =>
        // TODO: [MOB-223] consider a reverse proxy for privacy reasons
        fetch(
          `${
            config.moonpayApiUrl
          }/v3/currencies/${quoteCurrencyCode}/buy_quote?${serializeQueryParams({
            baseCurrencyCode,
            baseCurrencyAmount,
            areFeesIncluded,
            apiKey: config.moonpayApiKey,
          })}`
        )
          .then((response) => response.json())
          .then((response: MoonpayBuyQuoteResponse) => {
            return { data: response }
          })
          .catch((e) => {
            return { data: undefined, error: e }
          }),
    }),
    fiatOnRampLimits: builder.query<
      MoonpayLimitsResponse,
      {
        quoteCurrencyCode: string
        baseCurrencyCode: string
        areFeesIncluded: boolean
      }
    >({
      queryFn: ({ quoteCurrencyCode, baseCurrencyCode, areFeesIncluded }) =>
        // TODO: [MOB-223] consider a reverse proxy for privacy reasons
        fetch(
          `${config.moonpayApiUrl}/v3/currencies/${quoteCurrencyCode}/limits?${serializeQueryParams(
            {
              baseCurrencyCode,
              areFeesIncluded,
              apiKey: config.moonpayApiKey,
            }
          )}`
        )
          .then((response) => response.json())
          .then((response: MoonpayLimitsResponse) => {
            return { data: response }
          })
          .catch((e) => {
            return { data: undefined, error: e }
          }),
    }),

    fiatOnRampWidgetUrl: builder.query<
      string,
      FiatOnRampWidgetUrlQueryParameters & {
        ownerAddress: Address
        amount: string
        currencyCode: string
        baseCurrencyCode: string
        redirectUrl?: string
      }
    >({
      query: ({ ownerAddress, amount, currencyCode, baseCurrencyCode, redirectUrl, ...rest }) => ({
        url: config.moonpayWidgetApiUrl,
        body: {
          ...rest,
          defaultCurrencyCode: 'eth',
          currencyCode,
          baseCurrencyCode,
          baseCurrencyAmount: amount,
          redirectURL: redirectUrl,
          walletAddresses: JSON.stringify(
            supportedCurrencyCodes.reduce<Record<string, Address>>((acc, code: string) => {
              acc[code] = ownerAddress
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

export const {
  useFiatOnRampIpAddressQuery,
  useFiatOnRampWidgetUrlQuery,
  useFiatOnRampSupportedTokensQuery,
  useFiatOnRampBuyQuoteQuery,
  useFiatOnRampLimitsQuery,
} = fiatOnRampApi

export const fiatOnRampAggregatorApi = createApi({
  reducerPath: 'fiatOnRampAggregatorApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.fiatOnRampApiUrl,
  }),
  endpoints: (builder) => ({
    fiatOnRampAggregatorCountryList: builder.query<FORSupportedCountriesResponse, void>({
      query: () => `/supported-countries`,
    }),
    fiatOnRampAggregatorGetCountry: builder.query<FORGetCountryResponse, void>({
      query: () => `/get-country`,
    }),
    fiatOnRampAggregatorCryptoQuote: builder.query<FORQuoteResponse, FORQuoteRequest>({
      query: (request) => ({
        url: '/quote',
        body: request,
        method: 'POST',
      }),
      keepUnusedDataFor: 0,
    }),
    fiatOnRampAggregatorServiceProviders: builder.query<FORServiceProvidersResponse, void>({
      query: () => '/service-providers',
    }),
    fiatOnRampAggregatorSupportedTokens: builder.query<
      FORSupportedTokensResponse,
      FORSupportedTokensRequest
    >({
      query: (request) => `/supported-tokens?${new URLSearchParams(request).toString()}`,
    }),
    fiatOnRampAggregatorSupportedFiatCurrencies: builder.query<
      FORSupportedFiatCurrenciesResponse,
      FORSupportedFiatCurrenciesRequest
    >({
      query: (request) => `/supported-fiat-currencies?${new URLSearchParams(request).toString()}`,
    }),
    fiatOnRampAggregatorTransferInstitutions: builder.query<
      FORTransferInstitutionsResponse,
      FORTransferInstitutionsRequest
    >({
      query: (request) => `/transfer-institutions?${new URLSearchParams(request).toString()}`,
    }),
    fiatOnRampAggregatorWidget: builder.query<FORWidgetUrlResponse, FORWidgetUrlRequest>({
      query: (request) => ({
        url: '/widget-url',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorTransferWidget: builder.query<
      FORWidgetUrlResponse,
      FORTransferWidgetUrlRequest
    >({
      query: (request) => ({
        url: '/transfer-widget-url',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorTransactions: builder.query<
      FORTransactionsResponse,
      FORTransactionsRequest
    >({
      async queryFn(args, { getState }, _extraOptions, baseQuery) {
        try {
          const account = selectActiveAccount(getState() as RootState)
          const signerManager = walletContextValue.signers

          if (!account) {
            throw new Error('No active account')
          }
          const { requestParams, signature } = await createSignedRequestParams(
            args,
            account,
            signerManager
          )
          const result = await baseQuery({
            url: `/transactions?${objectToQueryString(requestParams)}`,
            method: 'GET',
            headers: {
              'x-uni-sig': signature,
            },
          })
          if (result.error) {
            return { error: result.error }
          }
          return { data: result.data as FORTransactionsResponse }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } }
        }
      },
    }),
  }),
})

export const {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorCryptoQuoteQuery,
  useFiatOnRampAggregatorServiceProvidersQuery,
  useFiatOnRampAggregatorSupportedTokensQuery,
  useFiatOnRampAggregatorSupportedFiatCurrenciesQuery,
  useFiatOnRampAggregatorTransferInstitutionsQuery,
  useFiatOnRampAggregatorWidgetQuery,
  useFiatOnRampAggregatorTransferWidgetQuery,
  useFiatOnRampAggregatorTransactionsQuery,
  useFiatOnRampAggregatorGetCountryQuery,
} = fiatOnRampAggregatorApi

/**
 * Utility to fetch fiat onramp transactions from moonpay
 */
export function fetchMoonpayTransaction(
  previousTransactionDetails: FiatOnRampTransactionDetails
): Promise<FiatOnRampTransactionDetails | undefined> {
  return fetch(
    `${config.moonpayApiUrl}/v1/transactions/ext/${previousTransactionDetails.id}?${COMMON_QUERY_PARAMS}`
  ).then((res) => {
    if (res.status === TRANSACTION_NOT_FOUND) {
      // If Moonpay API returned 404 for the given external transaction id
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
      extractMoonpayTransactionDetails(
        // log while we have the full moonpay tx response
        transactions.sort((a, b) => (dayjs(a.createdAt).isAfter(dayjs(b.createdAt)) ? 1 : -1))?.[0]
      )
    )
  })
}

/**
 * Utility to fetch fiat onramp transactions
 */
export async function fetchFiatOnRampTransaction(
  previousTransactionDetails: FiatOnRampTransactionDetails,
  account: Account,
  signerManager: SignerManager
): Promise<FiatOnRampTransactionDetails | undefined> {
  const { requestParams, signature } = await createSignedRequestParams(
    { externalSessionId: previousTransactionDetails.id },
    account,
    signerManager
  )
  const res = await fetch(
    `${config.fiatOnRampApiUrl}/transactions?${objectToQueryString(requestParams)}`,
    {
      headers: { 'x-uni-sig': signature },
    }
  )
  const { transactions }: FORTransactionsResponse = await res.json()
  const transaction = transactions.sort((a, b) =>
    dayjs(a.createdAt).isAfter(dayjs(b.createdAt)) ? 1 : -1
  )?.[0]
  if (!transaction) {
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

  return extractFiatOnRampTransactionDetails(transaction)
}
