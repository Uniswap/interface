import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { MoonpayEventName } from '@uniswap/analytics-events'
import dayjs from 'dayjs'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { config } from 'wallet/src/config'
import {
  MeldCountryPaymentMethodsResponse,
  MeldCryptoCurrency,
  MeldCryptoQuoteResponse,
  MeldQuote,
  MeldServiceProvidersResponse,
  MeldSupportedTokensResponse,
  MeldWidgetResponse,
} from 'wallet/src/features/fiatOnRamp/meld'
import {
  FiatOnRampWidgetUrlQueryParameters,
  FiatOnRampWidgetUrlQueryResponse,
  MoonpayBuyQuoteResponse,
  MoonpayCurrency,
  MoonpayIPAddressesResponse,
  MoonpayLimitsResponse,
  MoonpayListCurrenciesResponse,
  MoonpayTransactionsResponse,
} from 'wallet/src/features/fiatOnRamp/types'
import { extractFiatOnRampTransactionDetails } from 'wallet/src/features/transactions/history/conversion/extractFiatPurchaseTransactionDetails'
import { serializeQueryParams } from 'wallet/src/features/transactions/swap/utils'
import { TransactionDetails, TransactionStatus } from 'wallet/src/features/transactions/types'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

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
    baseUrl: config.meldApiUrl,
    prepareHeaders: (headers) => {
      headers.set('Authorization', `BASIC ${config.meldApiKey}`)
      headers.set('Meld-Version', `${config.meldApiVersion}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    fiatOnRampAggregatorCountryList: builder.query<MeldCountryPaymentMethodsResponse, void>({
      query: () =>
        `/service-providers/properties/country-payment-methods?category=CRYPTO_ONRAMP&accountServiceProviders=true`,
    }),
    fiatOnRampAggregatorCryptoQuote: builder.query<
      MeldCryptoQuoteResponse['quotes'],
      {
        amount: number
        sourceCurrencyCode: string
        destinationCurrencyCode: string
        countryCode: string
      }
    >({
      query: ({ amount, sourceCurrencyCode, destinationCurrencyCode, countryCode }) => ({
        url: '/payments/crypto/quote',
        body: {
          sourceAmount: amount,
          sourceCurrencyCode,
          destinationCurrencyCode,
          countryCode,
        },
        method: 'POST',
      }),
      transformResponse: (response: MeldCryptoQuoteResponse): Maybe<MeldQuote[]> =>
        response?.quotes,
      keepUnusedDataFor: 0,
    }),
    fiatOnRampAggregatorServiceProviders: builder.query<MeldServiceProvidersResponse, void>({
      query: () => '/service-providers/details?statuses=LIVE%2CRECENTLY_ADDED',
    }),
    fiatOnRampAggregatorSupportedTokens: builder.query<
      MeldCryptoCurrency[],
      { fiatCurrency: string; countryCode: string }
    >({
      query: ({ fiatCurrency }) =>
        `/service-providers/properties?categories=CRYPTO_ONRAMP&accountServiceProviders=true&fiatCurrencies=${fiatCurrency}`,
      transformResponse: (response: MeldSupportedTokensResponse, _, { countryCode }) =>
        // get all crypto currencies from all service providers that support the given fiat currency in the given country
        Object.values(
          response.reduce((acc: Record<string, MeldCryptoCurrency>, serviceProvider) => {
            if (!serviceProvider.crypto?.onRamp) {
              return acc
            }
            const { countries, cryptoCurrencies } = serviceProvider.crypto.onRamp
            if (countries.find((c) => c.countryCode === countryCode)) {
              cryptoCurrencies.forEach((cryptoCurrency) => {
                acc[buildCurrencyId(parseInt(cryptoCurrency.chainId, 10), cryptoCurrency.address)] =
                  cryptoCurrency
              })
            }
            return acc
          }, {})
        ),
    }),
    fiatOnRampAggregatorWidget: builder.query<
      MeldWidgetResponse,
      {
        sourceAmount: number
        destinationCurrencyCode: string
        countryCode: string
        serviceProvider: string
        sourceCurrencyCode: string
        walletAddress: string
        externalCustomerId: string
        externalSessionId: string
      }
    >({
      query: ({
        sourceAmount,
        destinationCurrencyCode,
        countryCode,
        serviceProvider,
        sourceCurrencyCode,
        walletAddress,
        externalCustomerId,
        externalSessionId,
      }) => ({
        url: 'crypto/session/widget',
        body: {
          sessionData: {
            sourceAmount,
            destinationCurrencyCode,
            countryCode,
            serviceProvider,
            sourceCurrencyCode,
            walletAddress,
            lockFields: ['destinationCurrencyCode'],
          },
          externalCustomerId,
          externalSessionId,
        },
        method: 'POST',
      }),
      transformErrorResponse: (baseQueryReturnValue) => baseQueryReturnValue?.data,
    }),
  }),
})

export const {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorCryptoQuoteQuery,
  useFiatOnRampAggregatorServiceProvidersQuery,
  useFiatOnRampAggregatorSupportedTokensQuery,
  useFiatOnRampAggregatorWidgetQuery,
} = fiatOnRampAggregatorApi

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
      extractFiatOnRampTransactionDetails(
        // log while we have the full moonpay tx response
        transactions.sort((a, b) => (dayjs(a.createdAt).isAfter(dayjs(b.createdAt)) ? 1 : -1))?.[0]
      )
    )
  })
}
