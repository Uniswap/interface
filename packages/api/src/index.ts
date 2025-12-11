/** biome-ignore-all assist/source/organizeImports: we want to manually group exports by category */

/**
 * @universe/api - Unified data layer for Uniswap Universe
 *
 * This is the ONLY public entry point for the API package.
 * All exports must be explicitly listed here.
 * Deep imports are forbidden and will be blocked by ESLint.
 */

// Foundations
export { createFetchClient } from '@universe/api/src/clients/base/createFetchClient'
export {
  FetchError,
  is404Error,
  isRateLimitFetchError,
} from '@universe/api/src/clients/base/errors'
export type {
  CustomOptions,
  FetchClient,
  StandardFetchOptions,
} from '@universe/api/src/clients/base/types'
export { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'

// Constants and URLs
export {
  createHelpArticleUrl,
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  getCloudflareApiBaseUrl,
  getCloudflarePrefix,
  getServicePrefix,
  helpUrl,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
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
  useTokenProjectUrlsPartsFragment,
} from '@universe/api/src/clients/graphql/fragments'
export { GQLQueries } from '@universe/api/src/clients/graphql/queries'
export type { GqlResult } from '@universe/api/src/clients/graphql/types'
export { isError, isNonPollingRequestInFlight, isWarmLoadingStatus } from '@universe/api/src/clients/graphql/utils'

// Jupiter API
export {
  createJupiterApiClient,
  type JupiterApiClient,
} from '@universe/api/src/clients/jupiter/createJupiterApiClient'
export type {
  JupiterExecuteResponse,
  JupiterOrderResponse,
  JupiterExecuteUrlParams,
  JupiterOrderUrlParams,
} from '@universe/api/src/clients/jupiter/types'
export {
  jupiterExecuteResponseSchema,
  jupiterOrderResponseSchema,
} from '@universe/api/src/clients/jupiter/types'

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
  type TradingApiClient,
  type TradingClientContext,
} from '@universe/api/src/clients/trading/createTradingApiClient'
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
  type GasEstimate,
  type GasEstimateEip1559,
  type GasEstimateLegacy,
  type GasStrategy,
} from '@universe/api/src/clients/trading/types'

// Liquidity Service API
export {
  createLiquidityServiceClient,
  LIQUIDITY_PATHS,
  type LiquidityServiceClient,
  type LiquidityServiceClientContext,
} from '@universe/api/src/clients/liquidity/createLiquidityServiceClient'

// Unitags API
export {
  type ProfileMetadata,
  type UnitagAddressesRequest,
  type UnitagAddressesResponse,
  type UnitagAddressRequest,
  type UnitagAddressResponse,
  type UnitagAvatarUploadCredentials,
  type UnitagChangeUsernameRequestBody,
  type UnitagClaim,
  type UnitagClaimContext,
  type UnitagClaimEligibilityRequest,
  type UnitagClaimEligibilityResponse,
  type UnitagClaimSource,
  type UnitagClaimUsernameRequestBody,
  type UnitagDeleteUsernameRequestBody,
  UnitagErrorCodes,
  type UnitagGetAvatarUploadUrlResponse,
  type UnitagResponse,
  type UnitagUpdateMetadataRequestBody,
  type UnitagUpdateMetadataResponse,
  type UnitagUsernameRequest,
  type UnitagUsernameResponse,
} from '@universe/api/src/clients/unitags/types'
export { createUnitagsApiClient } from '@universe/api/src/clients/unitags/createUnitagsApiClient'

// Data Service API
export {
  createDataServiceApiClient,
  type DataServiceApiClient,
  type DataServiceApiClientContext,
  TokenReportEventType,
  ReportAssetType,
} from '@universe/api/src/clients/data/createDataServiceApiClient'

// Notifications API
export { createNotificationsApiClient } from '@universe/api/src/clients/notifications/createNotificationsApiClient'
export { BackgroundType, ContentStyle, OnClickAction } from '@universe/api/src/clients/notifications/types'
export type {
  AckNotificationRequest,
  AckNotificationResponse,
  GetNotificationsRequest,
  GetNotificationsResponse,
  InAppNotification,
  NotificationsApiClient,
  NotificationsClientContext,
} from '@universe/api/src/clients/notifications/types'

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
  type WithoutWalletAccount,
} from '@universe/api/src/connectRpc/utils'

// Conversion Tracking API
export * as ConversionTrackingApi from '@universe/api/src/clients/conversionTracking'

// Embedded Wallet API
export {
  createEmbeddedWalletApiClient,
  type EmbeddedWalletApiClient,
  type EmbeddedWalletClientContext,
} from '@universe/api/src/clients/embeddedWallet/createEmbeddedWalletApiClient'

// Other Utilities
export {
  createFetcher,
  objectToQueryString,
} from '@universe/api/src/clients/base/utils'

// Session API
export { ApiInit, SESSION_INIT_QUERY_KEY } from '@universe/api/src/components/ApiInit'
export { provideSessionService } from '@universe/api/src/provideSessionService'

export type {
  UseQueryApiHelperHookArgs,
  UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
} from '@universe/api/src/hooks/shared/types'
export { useQueryWithImmediateGarbageCollection } from '@universe/api/src/hooks/shared/useQueryWithImmediateGarbageCollection'

// Other Types
export {
  CustomRankingType,
  RankingType,
  SpamCode,
} from '@universe/api/src/clients/content/types'

export { getTransport } from '@universe/api/src/transport'

export { getEntryGatewayUrl } from '@universe/api/src/getEntryGatewayUrl'

export { provideUniswapIdentifierService } from '@universe/api/src/provideUniswapIdentifierService'
