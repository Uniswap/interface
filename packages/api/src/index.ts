/**
 * @universe/api - Unified data layer for Uniswap Universe
 *
 * The package root entry point. All exports must be explicitly listed here.
 * Apps that must not load this barrel's full dependency graph import a subpath entry
 * instead (`src/entries/`, mapped in package.json `exports`).
 * Deep imports are forbidden and will be blocked by lint.
 */

// Foundations
export { createFetchClient } from './clients/base/createFetchClient'
export { setFirstPartyFetchOverride } from './clients/base/fetchImplProvider'
export {
  FetchError,
  is401Error,
  is403Error,
  is404Error,
  isBlockedAccountFetchError,
  isRateLimitFetchError,
} from './clients/base/errors'
export type { CustomOptions, FetchClient, StandardFetchOptions } from './clients/base/types'
export { SharedQueryClient } from './clients/base/SharedQueryClient'

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
} from './clients/base/urls'

// Auth
export type { AuthData, SignedRequestParams, SignMessageFunc } from './clients/base/auth'
export { createSignedRequestBody, createSignedRequestParams } from './clients/base/auth'

// Jupiter API
export { createJupiterApiClient, type JupiterApiClient } from './clients/jupiter/createJupiterApiClient'
export type {
  JupiterExecuteResponse,
  JupiterOrderResponse,
  JupiterExecuteUrlParams,
  JupiterOrderUrlParams,
} from './clients/jupiter/types'
export { jupiterExecuteResponseSchema, jupiterOrderResponseSchema } from './clients/jupiter/types'

// Blockaid API
export { createBlockaidApiClient, type BlockaidApiClient } from './clients/blockaid/createBlockaidApiClient'
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
} from './clients/blockaid/types'

// Trading API
export * as TradingApi from './clients/trading/__generated__'
export { UNCONNECTED_ADDRESS } from './clients/trading/constants'
export {
  createTradingApiClient,
  type PlanEndpoints,
  TRADING_API_PATHS,
  type GetFeatureFlagHeadersOptions,
  type TradingApiPaths,
  type TradingApiClient,
  type TradingClientContext,
  type WithSwapPermissionContext,
  V1_TRADING_API_PATHS,
} from './clients/trading/createTradingApiClient'
export {
  createTradingApiFetchClient,
  type TradingApiFetchClientContext,
} from './clients/trading/createTradingApiFetchClient'
export {
  type BridgeQuoteResponse,
  type ChainedQuoteResponse,
  type CheckPermissionsRequest,
  type CheckPermissionsResponse,
  type CheckPermissionsResult,
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
} from './clients/trading/tradeTypes'
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
} from './clients/trading/types'

// Liquidity Service API
export {
  createV1LiquidityServiceClient,
  createV2LiquidityServiceClient,
  type V1LiquidityServiceClient,
  type V2LiquidityServiceClient,
} from './clients/liquidity/createLiquidityServiceClient'
export {
  createAuctionMutationClient,
  type AuctionMutationClient,
} from './clients/liquidity/createAuctionMutationClient'
export { createAuctionQueryClient, type AuctionQueryClient } from './clients/liquidity/createAuctionQueryClient'

// Auction Service API
export { createAuctionServiceClient, type AuctionServiceClient } from './clients/auctions/createAuctionServiceClient'

// X Verification Service API
export {
  createXVerificationServiceClient,
  type XVerificationServiceClient,
} from './clients/x/createXVerificationServiceClient'

// Unitags Service
export {
  createUnitagServiceApiClient as createUnitagsServiceApiClient,
  type UnitagsServiceApiClient,
  type UnitagsServiceApiClientContext,
} from './clients/unitags/createUnitagsServiceApiClient'
export type { ProfileMetadata } from './clients/unitags/types'
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
} from './clients/gasService/createGasServiceClient'
export type {
  EstimateGasFeeRequest as GasServiceEstimateRequest,
  EstimateGasFeeResponse as GasServiceEstimateResponse,
} from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'

// Data API Service
export {
  createDataApiServiceClient,
  type DataApiServiceClient,
  type DataApiServiceClientContext,
} from './clients/dataApi/createDataApiServiceClient'
export {
  getGetPortfolioQueryOptions,
  type GetPortfolioQueryParams,
} from './clients/dataApi/getGetPortfolioQueryOptions'
export {
  getGetWalletBalancesQueryOptions,
  type GetWalletBalancesQueryParams,
} from './clients/dataApi/getGetWalletBalancesQueryOptions'
export {
  fetchWalletsBalances,
  getGetWalletsBalancesQueryOptions,
  type GetWalletsBalancesQueryParams,
} from './clients/dataApi/getGetWalletsBalancesQueryOptions'
export {
  getGetWalletProfitLossQueryOptions,
  type GetWalletProfitLossQueryParams,
} from './clients/dataApi/getGetWalletProfitLossQueryOptions'
export {
  getGetWalletTokenProfitLossQueryOptions,
  type GetWalletTokenProfitLossQueryParams,
} from './clients/dataApi/getGetWalletTokenProfitLossQueryOptions'
export {
  getGetWalletTokensProfitLossQueryOptions,
  type GetWalletTokensProfitLossQueryParams,
} from './clients/dataApi/getGetWalletTokensProfitLossQueryOptions'
export { type WalletAddressKey } from './clients/dataApi/walletAddressKey'
export {
  type BalanceComponent,
  type GetPortfolioRequest,
  type GetPortfolioResponse,
  type GetWalletBalancesRequest,
  type GetWalletBalancesResponse,
  type WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
export { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
export { type Token as DataApiToken, TokenReportEventType } from '@uniswap/client-data-api/dist/data/v1/types_pb'

// Data API Service V2
export {
  createDataApiServiceClientV2,
  type DataApiServiceClientV2,
} from './clients/dataApi/createDataApiServiceClientV2'

// Launch Service (launches.v1)
export { createLaunchServiceClient, type LaunchServiceClient } from './clients/launches/createLaunchServiceClient'

// Notifications API
export { createNotificationsApiClient } from './clients/notifications/createNotificationsApiClient'
export {
  parseNotificationExtra,
  serializeNotificationExtra,
  type NotificationExtra,
} from './clients/notifications/notificationExtra'
export { BackgroundType, ContentStyle, OnClickAction } from './clients/notifications/types'
export type {
  AckNotificationRequest,
  AckNotificationResponse,
  GetNotificationsRequest,
  GetNotificationsResponse,
  InAppNotification,
  NotificationContent,
  NotificationsApiClient,
  NotificationsClientContext,
} from './clients/notifications/types'

// Config Service API (server-side only)
export { RpcHttpError, isRpcNotFound, rpcConnectCode, rpcHttpStatus } from './clients/configService/connectrpcClient'
export { createConfigServerClient } from './clients/configService/createConfigServerClient'
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
} from './clients/configService/createConfigServerClient'
export { createSecretsServerClient } from './clients/configService/createSecretsServerClient'
export type {
  ApproveProposedSecretChangeByIdReply,
  ApproveSecretChangeReply,
  GetProposedSecretChangeByIdResponse,
  GetProposedSecretChangeResponse,
  GetProposedSecretChangesInScopeResponse,
  GetSecretValueResponse,
  ListProposedSecretChangesInScopeResponse,
  ListSecretsResponse,
  ProposeSecretChangeReply,
  RejectProposedSecretChangeByIdReply,
  SecretChangeProposalSummary,
  SecretChangeReply,
  SecretKeyChange,
  SecretMetadataResponse,
  SecretsServerClientConfig,
  SecretsServerClient,
} from './clients/configService/createSecretsServerClient'

// FOR (Fiat On-Ramp) API
export { createForApiClient, type ForApiClient } from './clients/for/createForApiClient'
export { transformPaymentMethods } from './clients/for/utils'
export type {
  FORCountry,
  FORLogo,
  FORQuote,
  FORQuoteResponse,
  FORServiceProvider,
  FORSupportedFiatCurrency,
  FORSupportedToken,
  FORTransaction,
} from './clients/for/types'
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
export { ALL_NETWORKS_ARG, createConnectTransportWithDefaults, type ConnectRpcContext } from './connectRpc/base'
export {
  parseRestProtocolVersion,
  transformInput,
  transformWalletsInput,
  type WithoutWalletAccount,
  type WithoutWalletAccounts,
} from './connectRpc/utils'
export { getConnectQueryRetryDelay, isConnectUnavailableError, shouldRetryConnectQuery } from './connectRpc/retry'

// Conversion Tracking API
export * as ConversionTrackingApi from './clients/conversionTracking'

// Embedded Wallet API
export {
  createEmbeddedWalletApiClient,
  type EmbeddedWalletApiClient,
  type EmbeddedWalletClientContext,
  type RecoveryMethod,
  type Sign7702AuthorizationResult,
  type SignAuth,
} from './clients/embeddedWallet/createEmbeddedWalletApiClient'

// Other Utilities
export { createFetcher, objectToQueryString } from './clients/base/utils'

// Session API
export { ApiInit, reinitializeSession } from './components/ApiInit'
export { provideDeviceIdService } from './provideDeviceIdService'
export { provideSessionService } from './provideSessionService'
export { provideSessionStorage } from './provideSessionStorage'
export { useIsSessionInitialized } from './hooks/useIsSessionInitialized'
// Storage (resolves platform-specifically: getStorageDriver.web.ts / getStorageDriver.native.ts)
export { getStorageDriver } from './storage/getStorageDriver'
export type { StorageDriver } from './storage/types'

// Session Transport (pure factory, no platform detection)
export {
  bootstrapSession,
  createSessionTransport,
  type CreateSessionTransportOptions,
  provideSession,
  tryProvideSession,
  useSession,
  useSessionReady,
} from './session'
export { createWithSessionRetry } from './session/createWithSessionRetry'

export type {
  UseQueryApiHelperHookArgs,
  UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
} from './hooks/shared/types'
export { useQueryWithImmediateGarbageCollection } from './hooks/shared/useQueryWithImmediateGarbageCollection'

// Other Types
export { CustomRankingType, RankingType, SpamCode } from './clients/content/types'

export { getTransport } from './transport'

export {
  ENTRY_GATEWAY_PROXY_ENV_SEGMENT,
  ENTRY_GATEWAY_PROXY_PATH,
  getEntryGatewayUrl,
  getForApiUrl,
} from './getEntryGatewayUrl'

export { getWebSocketUrl } from './getWebSocketUrl'

export { provideUniswapIdentifierService } from './provideUniswapIdentifierService'
