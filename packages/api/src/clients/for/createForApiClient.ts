import { PlainMessage } from '@bufbuild/protobuf'
import {
  GetCountryResponse,
  OffRampTransferDetailsRequest,
  OffRampTransferDetailsResponse,
  OffRampWidgetUrlRequest,
  QuoteRequest,
  SupportedCountriesRequest,
  SupportedCountriesResponse,
  SupportedFiatCurrenciesRequest,
  SupportedFiatCurrenciesResponse,
  SupportedTokensRequest,
  SupportedTokensResponse,
  TransactionRequest,
  TransactionResponse,
  TransferServiceProvidersResponse,
  TransferWidgetUrlRequest,
  WidgetUrlRequest,
  WidgetUrlResponse,
} from '@uniswap/client-for/dist/for/v1/api_pb'
import { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'
import { FORQuoteResponse } from '@universe/api/src/clients/for/types'
import { transformPaymentMethods } from '@universe/api/src/clients/for/utils'

type ForApiClientContext = {
  fetchClient: FetchClient
}

export type ForApiClient = {
  getSupportedCountries: (request: PlainMessage<SupportedCountriesRequest>) => Promise<SupportedCountriesResponse>
  getCountry: () => Promise<GetCountryResponse>
  getCryptoQuote: (request: PlainMessage<QuoteRequest>) => Promise<FORQuoteResponse>
  getTransferServiceProviders: () => Promise<TransferServiceProvidersResponse>
  getSupportedTokens: (request: PlainMessage<SupportedTokensRequest>) => Promise<SupportedTokensResponse>
  getSupportedFiatCurrencies: (
    request: PlainMessage<SupportedFiatCurrenciesRequest>,
  ) => Promise<SupportedFiatCurrenciesResponse>
  getWidgetUrl: (request: PlainMessage<WidgetUrlRequest>) => Promise<WidgetUrlResponse>
  getTransferWidgetUrl: (request: PlainMessage<TransferWidgetUrlRequest>) => Promise<WidgetUrlResponse>
  getTransaction: (request: PlainMessage<TransactionRequest> & { sessionId: string }) => Promise<TransactionResponse>
  getOffRampWidgetUrl: (request: PlainMessage<OffRampWidgetUrlRequest>) => Promise<WidgetUrlResponse>
  getOffRampTransferDetails: (
    request: PlainMessage<OffRampTransferDetailsRequest>,
  ) => Promise<OffRampTransferDetailsResponse>
}

/**
 * Factory function to create a FOR (Fiat On-Ramp) API client
 *
 * @example
 * ```typescript
 * const forClient = createForApiClient({
 *   fetchClient: myFetchClient,
 * })
 *
 * const quote = await forClient.getCryptoQuote({
 *   countryCode: 'US',
 *   sourceCurrencyCode: 'USD',
 *   destinationCurrencyCode: 'ETH',
 *   sourceAmount: 100,
 * })
 * ```
 *
 * @param ctx - Context containing the FetchClient instance
 * @returns ForApiClient instance with all FOR API methods
 */
export function createForApiClient(ctx: ForApiClientContext): ForApiClient {
  const client = ctx.fetchClient

  // POST /SupportedCountries
  const getSupportedCountries = createFetcher<PlainMessage<SupportedCountriesRequest>, SupportedCountriesResponse>({
    client,
    method: 'post',
    url: '/SupportedCountries',
  })

  // POST /GetCountry
  const getCountryFetcher = createFetcher<Record<string, never>, GetCountryResponse>({
    client,
    method: 'post',
    url: '/GetCountry',
  })
  const getCountry = (): Promise<GetCountryResponse> => getCountryFetcher({})

  // POST /Quote - with response transformation for payment methods
  const getCryptoQuoteRaw = createFetcher<PlainMessage<QuoteRequest>, FORQuoteResponse>({
    client,
    method: 'post',
    url: '/Quote',
  })

  const getCryptoQuote = async (request: PlainMessage<QuoteRequest>): Promise<FORQuoteResponse> => {
    const response = await getCryptoQuoteRaw(request)
    // Apply payment method transformation (filters Apple Pay on Android, Google Pay on iOS)
    return {
      ...response,
      quotes: response.quotes.map((quote) => ({
        ...quote,
        serviceProviderDetails: quote.serviceProviderDetails
          ? {
              ...quote.serviceProviderDetails,
              paymentMethods: transformPaymentMethods(quote.serviceProviderDetails.paymentMethods),
            }
          : undefined,
      })),
    }
  }

  // POST /TransferServiceProviders
  const getTransferServiceProvidersFetcher = createFetcher<Record<string, never>, TransferServiceProvidersResponse>({
    client,
    method: 'post',
    url: '/TransferServiceProviders',
  })
  const getTransferServiceProviders = (): Promise<TransferServiceProvidersResponse> =>
    getTransferServiceProvidersFetcher({})

  // POST /SupportedTokens
  const getSupportedTokens = createFetcher<PlainMessage<SupportedTokensRequest>, SupportedTokensResponse>({
    client,
    method: 'post',
    url: '/SupportedTokens',
  })

  // POST /SupportedFiatCurrencies
  const getSupportedFiatCurrencies = createFetcher<
    PlainMessage<SupportedFiatCurrenciesRequest>,
    SupportedFiatCurrenciesResponse
  >({
    client,
    method: 'post',
    url: '/SupportedFiatCurrencies',
  })

  // POST /WidgetUrl
  const getWidgetUrl = createFetcher<PlainMessage<WidgetUrlRequest>, WidgetUrlResponse>({
    client,
    method: 'post',
    url: '/WidgetUrl',
  })

  // POST /TransferWidgetUrl
  const getTransferWidgetUrl = createFetcher<PlainMessage<TransferWidgetUrlRequest>, WidgetUrlResponse>({
    client,
    method: 'post',
    url: '/TransferWidgetUrl',
  })

  // POST /Transaction
  const getTransaction = createFetcher<PlainMessage<TransactionRequest> & { sessionId: string }, TransactionResponse>({
    client,
    method: 'post',
    url: '/Transaction',
  })

  // POST /OffRampWidgetUrl
  const getOffRampWidgetUrl = createFetcher<PlainMessage<OffRampWidgetUrlRequest>, WidgetUrlResponse>({
    client,
    method: 'post',
    url: '/OffRampWidgetUrl',
  })

  // POST /OffRampTransferDetails
  const getOffRampTransferDetails = createFetcher<
    PlainMessage<OffRampTransferDetailsRequest>,
    OffRampTransferDetailsResponse
  >({
    client,
    method: 'post',
    url: '/OffRampTransferDetails',
  })

  return {
    getSupportedCountries,
    getCountry,
    getCryptoQuote,
    getTransferServiceProviders,
    getSupportedTokens,
    getSupportedFiatCurrencies,
    getWidgetUrl,
    getTransferWidgetUrl,
    getTransaction,
    getOffRampWidgetUrl,
    getOffRampTransferDetails,
  }
}
