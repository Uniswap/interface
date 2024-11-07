import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { objectToQueryString } from 'uniswap/src/data/utils'
import { FOR_API_HEADERS } from 'uniswap/src/features/fiatOnRamp/constants'
import {
  FORGetCountryResponse,
  FORQuoteRequest,
  FORQuoteResponse,
  FORServiceProvidersResponse,
  FORSupportedCountriesRequest,
  FORSupportedCountriesResponse,
  FORSupportedFiatCurrenciesRequest,
  FORSupportedFiatCurrenciesResponse,
  FORSupportedTokensRequest,
  FORSupportedTokensResponse,
  FORTransactionRequest,
  FORTransactionResponse,
  FORTransferWidgetUrlRequest,
  FORWidgetUrlRequest,
  FORWidgetUrlResponse,
  OffRampTransferDetailsRequest,
  OffRampTransferDetailsResponse,
  OffRampWidgetUrlRequest,
} from 'uniswap/src/features/fiatOnRamp/types'
import { transformPaymentMethods } from 'uniswap/src/features/fiatOnRamp/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isMobileApp } from 'utilities/src/platform'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getFiatOnRampAggregatorApi() {
  if (!isMobileApp) {
    return fiatOnRampAggregatorApi
  }

  let isForMigrationEnabled = false
  try {
    isForMigrationEnabled = getFeatureFlag(FeatureFlags.ForMonorepoMigration)
  } catch {}

  return isForMigrationEnabled ? fiatOnRampAggregatorApiV2 : fiatOnRampAggregatorApi
}

export const fiatOnRampAggregatorApiV2 = createApi({
  reducerPath: 'fiatOnRampAggregatorApi-uniswap',
  baseQuery: fetchBaseQuery({
    baseUrl: uniswapUrls.forApiUrl,
    headers: FOR_API_HEADERS,
  }),
  endpoints: (builder) => ({
    fiatOnRampAggregatorCountryList: builder.query<FORSupportedCountriesResponse, FORSupportedCountriesRequest>({
      query: (request) => ({ url: '/SupportedCountries', body: request, method: 'POST' }),
    }),
    fiatOnRampAggregatorGetCountry: builder.query<FORGetCountryResponse, void>({
      query: () => ({ url: '/GetCountry', body: {}, method: 'POST' }),
    }),
    fiatOnRampAggregatorCryptoQuote: builder.query<FORQuoteResponse, FORQuoteRequest>({
      query: (request) => ({
        url: '/Quote',
        body: request,
        method: 'POST',
      }),
      keepUnusedDataFor: 0,
      transformResponse: (response: FORQuoteResponse) => ({
        ...response,
        quotes: response.quotes?.map((quote) => ({
          ...quote,
          serviceProviderDetails: {
            ...quote.serviceProviderDetails,
            paymentMethods: transformPaymentMethods(quote.serviceProviderDetails.paymentMethods),
          },
        })),
      }),
    }),
    fiatOnRampAggregatorTransferServiceProviders: builder.query<FORServiceProvidersResponse, void>({
      query: () => ({ url: '/TransferServiceProviders', body: {}, method: 'POST' }),
      keepUnusedDataFor: 60 * 60, // 1 hour
    }),
    fiatOnRampAggregatorSupportedTokens: builder.query<FORSupportedTokensResponse, FORSupportedTokensRequest>({
      query: (request) => ({
        url: '/SupportedTokens',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorSupportedFiatCurrencies: builder.query<
      FORSupportedFiatCurrenciesResponse,
      FORSupportedFiatCurrenciesRequest
    >({
      query: (request) => ({
        url: '/SupportedFiatCurrencies',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorWidget: builder.query<FORWidgetUrlResponse, FORWidgetUrlRequest>({
      query: (request) => ({
        url: '/WidgetUrl',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorTransferWidget: builder.query<FORWidgetUrlResponse, FORTransferWidgetUrlRequest>({
      query: (request) => ({
        url: '/TransferWidgetUrl',
        body: request,
        method: 'POST',
      }),
    }),
    /**
     * Fetches a fiat onramp transaction by its ID, with no signature authentication.
     */
    fiatOnRampAggregatorTransaction: builder.query<
      FORTransactionResponse,
      // TODO: make sessionId required in FORTransactionRequest after backend is updated
      Omit<FORTransactionRequest, 'sessionId'> & { sessionId: string }
    >({
      query: (request) => ({ url: '/Transaction', body: request, method: 'POST' }),
    }),
    fiatOnRampAggregatorOffRampWidget: builder.query<FORWidgetUrlResponse, OffRampWidgetUrlRequest>({
      query: (request) => ({
        url: '/OffRampWidgetUrl',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorOffRampTransferDetails: builder.query<
      OffRampTransferDetailsResponse,
      OffRampTransferDetailsRequest
    >({
      query: (request) => ({
        url: '/OffRampTransferDetails',
        body: request,
        method: 'POST',
      }),
    }),
  }),
})

// TODO: WALL-5189 - remove this once we finish migrating away from original FOR endpoint service
export const fiatOnRampAggregatorApi = createApi({
  reducerPath: 'fiatOnRampAggregatorApi-uniswap',
  baseQuery: fetchBaseQuery({
    baseUrl: uniswapUrls.fiatOnRampApiUrl,
    headers: FOR_API_HEADERS,
  }),
  endpoints: (builder) => ({
    fiatOnRampAggregatorCountryList: builder.query<FORSupportedCountriesResponse, FORSupportedCountriesRequest>({
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
      transformResponse: (response: FORQuoteResponse) => ({
        ...response,
        quotes: response.quotes?.map((quote) => ({
          ...quote,
          serviceProviderDetails: {
            ...quote.serviceProviderDetails,
            paymentMethods: transformPaymentMethods(quote.serviceProviderDetails.paymentMethods),
          },
        })),
      }),
    }),
    fiatOnRampAggregatorTransferServiceProviders: builder.query<FORServiceProvidersResponse, void>({
      query: () => '/transfer-service-providers',
      keepUnusedDataFor: 60 * 60, // 1 hour
    }),
    fiatOnRampAggregatorSupportedTokens: builder.query<FORSupportedTokensResponse, FORSupportedTokensRequest>({
      query: (request) => ({
        url: `/supported-tokens`,
        params: request,
      }),
    }),
    fiatOnRampAggregatorSupportedFiatCurrencies: builder.query<
      FORSupportedFiatCurrenciesResponse,
      FORSupportedFiatCurrenciesRequest
    >({
      query: (request) => ({
        url: '/supported-fiat-currencies',
        params: request,
      }),
    }),
    fiatOnRampAggregatorWidget: builder.query<FORWidgetUrlResponse, FORWidgetUrlRequest>({
      query: (request) => ({
        url: '/widget-url',
        body: request,
        method: 'POST',
      }),
    }),
    fiatOnRampAggregatorTransferWidget: builder.query<FORWidgetUrlResponse, FORTransferWidgetUrlRequest>({
      query: (request) => ({
        url: '/transfer-widget-url',
        body: request,
        method: 'POST',
      }),
    }),
    /**
     * Fetches a fiat onramp transaction by its ID, with no signature authentication.
     */
    fiatOnRampAggregatorTransaction: builder.query<
      FORTransactionResponse,
      // TODO: make sessionId required in FORTransactionRequest after backend is updated
      Omit<FORTransactionRequest, 'sessionId'> & { sessionId: string }
    >({
      query: (request) => `/transaction?${objectToQueryString(request)}`,
    }),
    // stubbing out these endpoints so that v2 works
    fiatOnRampAggregatorOffRampWidget: builder.query<FORWidgetUrlResponse, OffRampWidgetUrlRequest>({
      query: () => '',
    }),
    fiatOnRampAggregatorOffRampTransferDetails: builder.query<
      OffRampTransferDetailsResponse,
      OffRampTransferDetailsRequest
    >({ query: () => '' }),
  }),
})

export const {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorGetCountryQuery,
  useFiatOnRampAggregatorCryptoQuoteQuery,
  useFiatOnRampAggregatorTransferServiceProvidersQuery,
  useFiatOnRampAggregatorSupportedTokensQuery,
  useFiatOnRampAggregatorSupportedFiatCurrenciesQuery,
  useFiatOnRampAggregatorWidgetQuery,
  useFiatOnRampAggregatorTransferWidgetQuery,
} = getFiatOnRampAggregatorApi()
