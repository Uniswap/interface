import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { objectToQueryString } from 'uniswap/src/data/utils'
import { FOR_API_HEADERS } from 'uniswap/src/features/fiatOnRamp/constants'
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
  FORTransactionRequest,
  FORTransactionResponse,
  FORTransferWidgetUrlRequest,
  FORWidgetUrlRequest,
  FORWidgetUrlResponse,
} from 'uniswap/src/features/fiatOnRamp/types'
import { transformPaymentMethods } from 'uniswap/src/features/fiatOnRamp/utils'

export const fiatOnRampAggregatorApi = createApi({
  reducerPath: 'fiatOnRampAggregatorApi-uniswap',
  baseQuery: fetchBaseQuery({
    baseUrl: uniswapUrls.fiatOnRampApiUrl,
    headers: FOR_API_HEADERS,
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
      query: (request) => `/supported-tokens?${new URLSearchParams(request).toString()}`,
    }),
    fiatOnRampAggregatorSupportedFiatCurrencies: builder.query<
      FORSupportedFiatCurrenciesResponse,
      FORSupportedFiatCurrenciesRequest
    >({
      query: (request) => `/supported-fiat-currencies?${new URLSearchParams(request).toString()}`,
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
} = fiatOnRampAggregatorApi
