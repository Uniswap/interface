import { PlainMessage } from '@bufbuild/protobuf'
import { skipToken, UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  FORQuoteResponse,
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
  useIsSessionInitialized,
  WidgetUrlRequest,
  WidgetUrlResponse,
} from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ForApiClient } from 'uniswap/src/data/apiClients/forApi/ForApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Returns whether sessions are ready for FOR API requests.
 * When both ForUrlMigration and ForSessionsEnabled are off (legacy mode),
 * session gating is skipped since sessions aren't required.
 */
function useForSessionReady(): boolean {
  const isSessionInitialized = useIsSessionInitialized()
  const isForUrlMigration = useFeatureFlag(FeatureFlags.ForUrlMigration)
  const isForSessionsEnabled = useFeatureFlag(FeatureFlags.ForSessionsEnabled)
  const requiresSessionGating = isForUrlMigration || isForSessionsEnabled
  return !requiresSessionGating || isSessionInitialized
}

/**
 * Query key factory for FOR API
 * Ensures consistent query keys across all FOR hooks
 */
export const forQueryKeys = {
  all: [ReactQueryCacheKey.FORApi] as const,
  supportedCountries: (params: PlainMessage<SupportedCountriesRequest>) =>
    [...forQueryKeys.all, 'supportedCountries', params] as const,
  country: () => [...forQueryKeys.all, 'country'] as const,
  quote: (params: PlainMessage<QuoteRequest>) => [...forQueryKeys.all, 'quote', params] as const,
  transferServiceProviders: () => [...forQueryKeys.all, 'transferServiceProviders'] as const,
  supportedTokens: (params: PlainMessage<SupportedTokensRequest>) =>
    [...forQueryKeys.all, 'supportedTokens', params] as const,
  supportedFiatCurrencies: (params: PlainMessage<SupportedFiatCurrenciesRequest>) =>
    [...forQueryKeys.all, 'supportedFiatCurrencies', params] as const,
  widgetUrl: (params: PlainMessage<WidgetUrlRequest>) => [...forQueryKeys.all, 'widgetUrl', params] as const,
  transferWidgetUrl: (params: PlainMessage<TransferWidgetUrlRequest>) =>
    [...forQueryKeys.all, 'transferWidgetUrl', params] as const,
  transaction: (params: PlainMessage<TransactionRequest> & { sessionId: string }) =>
    [...forQueryKeys.all, 'transaction', params] as const,
  offRampWidgetUrl: (params: PlainMessage<OffRampWidgetUrlRequest>) =>
    [...forQueryKeys.all, 'offRampWidgetUrl', params] as const,
  offRampTransferDetails: (params: PlainMessage<OffRampTransferDetailsRequest>) =>
    [...forQueryKeys.all, 'offRampTransferDetails', params] as const,
}

// Default cache times
const DEFAULT_STALE_TIME = ONE_MINUTE_MS
const DEFAULT_GC_TIME = 5 * ONE_MINUTE_MS

/**
 * Hook options that mirror RTK Query's options for easier migration
 */
type QueryHookOptions = {
  skip?: boolean
  refetchOnMountOrArgChange?: boolean
}

/**
 * Get supported countries for fiat on-ramp
 */
export function useFiatOnRampAggregatorCountryListQuery(
  params: PlainMessage<SupportedCountriesRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<SupportedCountriesResponse, Error> {
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams

  return useQuery<SupportedCountriesResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.supportedCountries(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip
        ? (): Promise<SupportedCountriesResponse> => ForApiClient.getSupportedCountries(validParams)
        : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get user's country based on IP
 */
export function useFiatOnRampAggregatorGetCountryQuery(
  params?: undefined,
  options?: QueryHookOptions,
): UseQueryResult<GetCountryResponse, Error> {
  const skip = options?.skip

  return useQuery<GetCountryResponse, Error>({
    queryKey: forQueryKeys.country(),
    queryFn: skip ? skipToken : (): Promise<GetCountryResponse> => ForApiClient.getCountry(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get crypto quote for fiat on-ramp purchase
 * Note: gcTime and staleTime are 0 to match RTK Query's keepUnusedDataFor: 0
 * Requires session initialization to complete before making request.
 */
export function useFiatOnRampAggregatorCryptoQuoteQuery(
  params: PlainMessage<QuoteRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<FORQuoteResponse, Error> {
  const isSessionReady = useForSessionReady()
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams || !isSessionReady

  return useQuery<FORQuoteResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.quote(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip ? (): Promise<FORQuoteResponse> => ForApiClient.getCryptoQuote(validParams) : skipToken,
    // Match RTK Query's keepUnusedDataFor: 0
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get list of transfer service providers
 * Note: 1 hour cache to match RTK Query's keepUnusedDataFor: 3600
 */
export function useFiatOnRampAggregatorTransferServiceProvidersQuery(
  params?: undefined,
  options?: QueryHookOptions,
): UseQueryResult<TransferServiceProvidersResponse, Error> {
  const skip = options?.skip

  return useQuery<TransferServiceProvidersResponse, Error>({
    queryKey: forQueryKeys.transferServiceProviders(),
    queryFn: skip
      ? skipToken
      : (): Promise<TransferServiceProvidersResponse> => ForApiClient.getTransferServiceProviders(),
    // Match RTK Query's keepUnusedDataFor: 3600 (1 hour)
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_HOUR_MS,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get supported tokens for a given fiat currency and country
 */
export function useFiatOnRampAggregatorSupportedTokensQuery(
  params: PlainMessage<SupportedTokensRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<SupportedTokensResponse, Error> {
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams

  return useQuery<SupportedTokensResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.supportedTokens(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip
        ? (): Promise<SupportedTokensResponse> => ForApiClient.getSupportedTokens(validParams)
        : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get supported fiat currencies for a country
 */
export function useFiatOnRampAggregatorSupportedFiatCurrenciesQuery(
  params: PlainMessage<SupportedFiatCurrenciesRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<SupportedFiatCurrenciesResponse, Error> {
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams

  return useQuery<SupportedFiatCurrenciesResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.supportedFiatCurrencies(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip
        ? (): Promise<SupportedFiatCurrenciesResponse> => ForApiClient.getSupportedFiatCurrencies(validParams)
        : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get widget URL for fiat on-ramp purchase flow
 * Requires session initialization to complete before making request.
 */
export function useFiatOnRampAggregatorWidgetQuery(
  params: PlainMessage<WidgetUrlRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<WidgetUrlResponse, Error> {
  const isSessionReady = useForSessionReady()
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams || !isSessionReady

  return useQuery<WidgetUrlResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.widgetUrl(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip ? (): Promise<WidgetUrlResponse> => ForApiClient.getWidgetUrl(validParams) : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get widget URL for transfer flow
 * Requires session initialization to complete before making request.
 */
export function useFiatOnRampAggregatorTransferWidgetQuery(
  params: PlainMessage<TransferWidgetUrlRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<WidgetUrlResponse, Error> {
  const isSessionReady = useForSessionReady()
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams || !isSessionReady

  return useQuery<WidgetUrlResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.transferWidgetUrl(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip
        ? (): Promise<WidgetUrlResponse> => ForApiClient.getTransferWidgetUrl(validParams)
        : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get transaction details by session ID
 * Requires session initialization to complete before making request.
 */
export function useFiatOnRampAggregatorTransactionQuery(
  params: (PlainMessage<TransactionRequest> & { sessionId: string }) | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<TransactionResponse, Error> {
  const isSessionReady = useForSessionReady()
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams || !isSessionReady

  return useQuery<TransactionResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.transaction(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip ? (): Promise<TransactionResponse> => ForApiClient.getTransaction(validParams) : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get widget URL for off-ramp (sell) flow
 * Requires session initialization to complete before making request.
 */
export function useFiatOnRampAggregatorOffRampWidgetQuery(
  params: PlainMessage<OffRampWidgetUrlRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<WidgetUrlResponse, Error> {
  const isSessionReady = useForSessionReady()
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams || !isSessionReady

  return useQuery<WidgetUrlResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.offRampWidgetUrl(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip
        ? (): Promise<WidgetUrlResponse> => ForApiClient.getOffRampWidgetUrl(validParams)
        : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}

/**
 * Get transfer details for off-ramp flow
 * Requires session initialization to complete before making request.
 */
export function useFiatOnRampAggregatorOffRampTransferDetailsQuery(
  params: PlainMessage<OffRampTransferDetailsRequest> | typeof skipToken,
  options?: QueryHookOptions,
): UseQueryResult<OffRampTransferDetailsResponse, Error> {
  const isSessionReady = useForSessionReady()
  const validParams = params !== skipToken ? params : undefined
  const skip = options?.skip || !validParams || !isSessionReady

  return useQuery<OffRampTransferDetailsResponse, Error>({
    queryKey: validParams && !skip ? forQueryKeys.offRampTransferDetails(validParams) : forQueryKeys.all,
    queryFn:
      validParams && !skip
        ? (): Promise<OffRampTransferDetailsResponse> => ForApiClient.getOffRampTransferDetails(validParams)
        : skipToken,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    refetchOnMount: options?.refetchOnMountOrArgChange ? 'always' : true,
  })
}
