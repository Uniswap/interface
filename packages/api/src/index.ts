/**
 * @universe/api - Unified data layer for Uniswap Universe
 *
 * This is the ONLY public entry point for the API package.
 * All exports must be explicitly listed here.
 * Deep imports are forbidden and will be blocked by lint.
 */

// Foundations
export { createFetchClient } from '@universe/api/src/clients/base/createFetchClient'
export { FetchError, is401Error, is404Error, isRateLimitFetchError } from '@universe/api/src/clients/base/errors'
export type { CustomOptions, FetchClient, StandardFetchOptions } from '@universe/api/src/clients/base/types'
export { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'

// Constants and URLs
export {
  createHelpArticleUrl,
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  DEV_ENTRY_GATEWAY_HOST,
  ENTRY_GATEWAY_API_BASE_URLS,
  ENTRY_GATEWAY_HOSTS,
  getCloudflareApiBaseUrl,
  getCloudflarePrefix,
  getServicePrefix,
  helpUrl,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_HOST,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_HOST,
  TrafficFlows,
} from '@universe/api/src/clients/base/urls'

// Auth
export type { AuthData, SignedRequestParams, SignMessageFunc } from '@universe/api/src/clients/base/auth'
export { createSignedRequestBody, createSignedRequestParams } from '@universe/api/src/clients/base/auth'

// GraphQL API
export * as GraphQLApi from '@universe/api/src/clients/graphql/generated'
export {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
  useTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment,
  useTokenProjectTokensTvlPartsFragment,
  useTokenProjectUrlsPartsFragment,
} from '@universe/api/src/clients/graphql/fragments'
export { GQLQueries } from '@universe/api/src/clients/graphql/queries'
export type { GqlResult } from '@universe/api/src/clients/graphql/types'
export {
  isError,
  isNonPollingRequestInFlight,
  mapGraphQLNetworkStatusToReactQueryStatus,
} from '@universe/api/src/clients/graphql/utils'

// Jupiter API
export { createJupiterApiClient, type JupiterApiClient } from '@universe/api/src/clients/jupiter/createJupiterApiClient'
export type {
  JupiterExecuteResponse,
  JupiterOrderResponse,
  JupiterExecuteUrlParams,
  JupiterOrderUrlParams,
} from '@universe/api/src/clients/jupiter/types'
export { jupiterExecuteResponseSchema, jupiterOrderResponseSchema } from '@universe/api/src/clients/jupiter/types'

// Blockaid API
export {
  createBlockaidApiClient,
  type BlockaidApiClient,
} from '@universe/api/src/clients/blockaid/createBlockaidApiClient'
export {
  getBlockaidScanSiteResponseSchema,
  getBlockaidScanTransactionRequestSchema,
  getBlockaidScanTransactionResponseSchema,
  getBlockaidScanJsonRpcRequestSchema,
  DappVerificationStatus,
  type BlockaidScanSiteRequest,
  type BlockaidScanSiteResponse,
  type BlockaidScanSiteHitResponse,
  type BlockaidScanSiteMissResponse,
  type BlockaidScanTransactionRequest,
  type BlockaidScanTransactionResponse,
  type BlockaidScanJsonRpcRequest,
  type BlockaidScanJsonRpcResponse,
} from '@universe/api/src/clients/blockaid/types'

// Trading API
export * as TradingApi from '@universe/api/src/clients/trading/__generated__'
export {
  createTradingApiClient,
  type PlanEndpoints,
  TRADING_API_PATHS,
  type TradingApiPaths,
  type TradingApiClient,
  type TradingClientContext,
  V1_TRADING_API_PATHS,
} from '@universe/api/src/clients/trading/createTradingApiClient'
export {
  createTradingApiFetchClient,
  type TradingApiFetchClientContext,
} from '@universe/api/src/clients/trading/createTradingApiFetchClient'
export {
  type BridgeQuoteResponse,
  type ChainedQuoteResponse,
  type ClassicQuoteResponse,
  type DiscriminatedQuoteResponse,
  type DutchQuoteResponse,
  type DutchV3QuoteResponse,
  type ExistingPlanRequest,
  type PriorityQuoteResponse,
  type SwappableTokensParams,
  type UnwrapQuoteResponse,
  type UpdatePlanRequestWithPlanId,
  type WrapQuoteResponse,
} from '@universe/api/src/clients/trading/tradeTypes'
export {
  FeeType,
  type FormattedUniswapXGasFeeInfo,
  type GasEstimate,
  type GasEstimateEip1559,
  type GasEstimateLegacy,
  type GasFeeResult,
  type GasFeeResultWithoutState,
  type GasStrategy,
  type TransactionEip1559FeeParams,
  type TransactionLegacyFeeParams,
} from '@universe/api/src/clients/trading/types'

// Liquidity Service API
export {
  createV1LiquidityServiceClient,
  createV2LiquidityServiceClient,
  type V1LiquidityServiceClient,
  type V2LiquidityServiceClient,
} from '@universe/api/src/clients/liquidity/createLiquidityServiceClient'
export {
  createAuctionMutationClient,
  type AuctionMutationClient,
} from '@universe/api/src/clients/liquidity/createAuctionMutationClient'
export {
  createAuctionQueryClient,
  type AuctionQueryClient,
} from '@universe/api/src/clients/liquidity/createAuctionQueryClient'

// Auction Service API
export {
  createAuctionServiceClient,
  type AuctionServiceClient,
} from '@universe/api/src/clients/auctions/createAuctionServiceClient'

// X Verification Service API
export {
  createXVerificationServiceClient,
  type XVerificationServiceClient,
} from '@universe/api/src/clients/x/createXVerificationServiceClient'

// Unitags Service
export {
  createUnitagServiceApiClient as createUnitagsServiceApiClient,
  type UnitagsServiceApiClient,
  type UnitagsServiceApiClientContext,
} from '@universe/api/src/clients/unitags/createUnitagsServiceApiClient'
export type { ProfileMetadata } from '@universe/api/src/clients/unitags/types'
export { UnitagService } from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_connect'
export { UnitagErrorCode } from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_pb'
export {
  GetUsernameRequest,
  GetUsernameResponse,
  GetAddressRequest,
  GetAddressResponse,
  GetAddressesRequest,
  GetAddressesResponse,
  CanClaimUsernameRequest,
  CanClaimUsernameResponse,
  AvatarUploadResponse,
} from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_pb'

// Gas Service API (ConnectRPC - estimateGasFee via UniRPC v2)
export {
  createGasServiceClient,
  type GasServiceClient,
  type GasServiceClientContext,
} from '@universe/api/src/clients/gasService/createGasServiceClient'
export type {
  EstimateGasFeeRequest as GasServiceEstimateRequest,
  EstimateGasFeeResponse as GasServiceEstimateResponse,
} from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'

// Data API Service (ConnectRPC - listTopTokens, listTopPools, getPortfolio, etc.)
export {
  createDataApiServiceClient,
  type DataApiServiceClient,
  type DataApiServiceClientContext,
} from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
export {
  getGetPortfolioQueryOptions,
  type GetPortfolioQueryParams,
} from '@universe/api/src/clients/dataApi/getGetPortfolioQueryOptions'
export {
  getGetWalletBalancesQueryOptions,
  type GetWalletBalancesQueryParams,
} from '@universe/api/src/clients/dataApi/getGetWalletBalancesQueryOptions'
export {
  fetchWalletsBalances,
  getGetWalletsBalancesQueryOptions,
  type GetWalletsBalancesQueryParams,
} from '@universe/api/src/clients/dataApi/getGetWalletsBalancesQueryOptions'
export {
  TopPoolsOrderBy,
  TokensOrderBy,
  type BalanceComponent,
  type GetPortfolioRequest,
  type GetPortfolioResponse,
  type GetWalletBalancesRequest,
  type GetWalletBalancesResponse,
  type ListTopPoolsResponse,
  type ListTokensResponse,
  type WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
export { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
export {
  type ChainToken as DataApiChainToken,
  type MultichainToken as DataApiMultichainToken,
  type Pool as DataApiPool,
  type Token as DataApiToken,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'

// Data Service API
export {
  createDataServiceApiClient,
  type DataServiceApiClient,
  type DataServiceApiClientContext,
  type DataReportType,
  type SubmitDataReportParams,
  TokenReportEventType,
  ReportAssetType,
} from '@universe/api/src/clients/data/createDataServiceApiClient'

// Data API Service V2
export {
  createDataApiServiceClientV2,
  type DataApiServiceClientV2,
} from '@universe/api/src/clients/dataApi/createDataApiServiceClientV2'

// Notifications API
export { createNotificationsApiClient } from '@universe/api/src/clients/notifications/createNotificationsApiClient'
export { BackgroundType, ContentStyle, OnClickAction } from '@universe/api/src/clients/notifications/types'
export type {
  AckNotificationRequest,
  AckNotificationResponse,
  GetNotificationsRequest,
  GetNotificationsResponse,
  InAppNotification,
  NotificationContent,
  NotificationsApiClient,
  NotificationsClientContext,
} from '@universe/api/src/clients/notifications/types'

// Config Service API (server-side only)
export { createConfigServerClient } from '@universe/api/src/clients/configService/createConfigServerClient'
export type {
  ApproveProposedParamReply,
  ConfigServerClientConfig,
  ConfigServerClient,
  CreateScopeResponse,
  GetParameterValueResponse,
  GetParameterValuesInScopeResponse,
  GetProposedParamResponse,
  GetProposedParamsInScopeResponse,
  ListParameterNamesResponse,
  ListScopesResponse,
  ParameterEntry,
  SetParameterReply,
} from '@universe/api/src/clients/configService/createConfigServerClient'
export { createSecretsServerClient } from '@universe/api/src/clients/configService/createSecretsServerClient'
export type {
  ApproveSecretChangeReply,
  GetProposedSecretChangeResponse,
  GetProposedSecretChangesInScopeResponse,
  GetSecretValueResponse,
  ListSecretsResponse,
  SecretChangeReply,
  SecretMetadataResponse,
  SecretsServerClientConfig,
  SecretsServerClient,
} from '@universe/api/src/clients/configService/createSecretsServerClient'

// FOR (Fiat On-Ramp) API
export { createForApiClient, type ForApiClient } from '@universe/api/src/clients/for/createForApiClient'
export { transformPaymentMethods } from '@universe/api/src/clients/for/utils'
export type {
  FORCountry,
  FORLogo,
  FORQuote,
  FORQuoteResponse,
  FORServiceProvider,
  FORSupportedFiatCurrency,
  FORSupportedToken,
  FORTransaction,
} from '@universe/api/src/clients/for/types'
// Re-export FOR protobuf types for consumer packages
export {
  RampDirection,
  TransactionStatus as FORTransactionStatus,
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

// ConnectRPC API
export {
  ALL_NETWORKS_ARG,
  createConnectTransportWithDefaults,
  type ConnectRpcContext,
} from '@universe/api/src/connectRpc/base'
export {
  parseProtectionInfo,
  parseRestProtocolVersion,
  parseSafetyLevel,
  transformInput,
  transformWalletsInput,
  type WithoutWalletAccount,
  type WithoutWalletAccounts,
} from '@universe/api/src/connectRpc/utils'

// Conversion Tracking API
export * as ConversionTrackingApi from '@universe/api/src/clients/conversionTracking'

// Embedded Wallet API
export {
  createEmbeddedWalletApiClient,
  type EmbeddedWalletApiClient,
  type EmbeddedWalletClientContext,
  type RecoveryMethod,
  type Sign7702AuthorizationResult,
  type SignAuth,
} from '@universe/api/src/clients/embeddedWallet/createEmbeddedWalletApiClient'

// Other Utilities
export { createFetcher, objectToQueryString } from '@universe/api/src/clients/base/utils'

// Session API
export { ApiInit, reinitializeSession } from '@universe/api/src/components/ApiInit'
export { provideDeviceIdService } from '@universe/api/src/provideDeviceIdService'
export { provideSessionService } from '@universe/api/src/provideSessionService'
export { provideSessionStorage } from '@universe/api/src/provideSessionStorage'
export { useIsSessionInitialized } from '@universe/api/src/hooks/useIsSessionInitialized'
// Storage (resolves platform-specifically: getStorageDriver.web.ts / getStorageDriver.native.ts)
export { getStorageDriver } from '@universe/api/src/storage/getStorageDriver'
export type { StorageDriver } from '@universe/api/src/storage/types'

// Session Transport (pure factory, no platform detection)
export {
  bootstrapSession,
  createSessionTransport,
  type CreateSessionTransportOptions,
  provideSession,
  tryProvideSession,
  useSession,
  useSessionReady,
} from '@universe/api/src/session'
export { createWithSessionRetry } from '@universe/api/src/session/createWithSessionRetry'

export type {
  UseQueryApiHelperHookArgs,
  UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
} from '@universe/api/src/hooks/shared/types'
export { useQueryWithImmediateGarbageCollection } from '@universe/api/src/hooks/shared/useQueryWithImmediateGarbageCollection'

// Other Types
export { CustomRankingType, RankingType, SpamCode } from '@universe/api/src/clients/content/types'

export { getTransport } from '@universe/api/src/transport'

export {
  ENTRY_GATEWAY_PROXY_ENV_SEGMENT,
  ENTRY_GATEWAY_PROXY_PATH,
  getEntryGatewayUrl,
  getForApiUrl,
} from '@universe/api/src/getEntryGatewayUrl'

export { getWebSocketUrl } from '@universe/api/src/getWebSocketUrl'

export { provideUniswapIdentifierService } from '@universe/api/src/provideUniswapIdentifierService'
