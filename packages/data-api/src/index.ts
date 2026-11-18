// Clients
export {
  createDataApiServiceClient,
  type DataApiServiceClient,
  type DataApiServiceClientContext,
} from './clients/createDataApiServiceClient'
export { createDataApiServiceClientV2, type DataApiServiceClientV2 } from './clients/createDataApiServiceClientV2'
export {
  createLaunchServiceClient,
  type LaunchServiceClient,
  type LaunchServiceClientContext,
} from './clients/createLaunchServiceClient'
export {
  createSearchServiceClient,
  type SearchServiceClient,
  type SearchServiceClientContext,
} from './clients/createSearchServiceClient'

// Query options
export { getGetPortfolioQueryOptions, type GetPortfolioQueryParams } from './queries/balances/getGetPortfolio'
export {
  getGetWalletBalancesQueryOptions,
  type GetWalletBalancesQueryParams,
} from './queries/balances/getGetWalletBalances'
export {
  fetchWalletsBalances,
  getGetWalletsBalancesQueryOptions,
  type GetWalletsBalancesQueryParams,
} from './queries/balances/getGetWalletsBalances'
export {
  getGetWalletProfitLossQueryOptions,
  type GetWalletProfitLossQueryParams,
} from './queries/pnl/getGetWalletProfitLoss'
export {
  getGetWalletTokenProfitLossQueryOptions,
  type GetWalletTokenProfitLossQueryParams,
} from './queries/pnl/getGetWalletTokenProfitLoss'
export {
  getGetWalletTokensProfitLossQueryOptions,
  type GetWalletTokensProfitLossQueryParams,
} from './queries/pnl/getGetWalletTokensProfitLoss'
export { type WalletAddressKey } from './utils/walletAddressKey'

export {
  getEarnPositionQueryOptions,
  getListEarnPositionsQueryOptions,
  getListEarnVaultsQueryOptions,
  type GetEarnPositionInput,
  type ListEarnPositionsInput,
  type ListEarnVaultsInput,
} from './queries/earn/earn'
export {
  getListLaunchesQueryOptions,
  getListLaunchpadsQueryOptions,
  type ListLaunchesInput,
  type ListLaunchesParams,
  type ListLaunchpadsInput,
} from './queries/launches/launches'
export { getGetWalletNftsQueryOptions, NFT_QUERY_KEY_PREFIX, type GetWalletNftsInput } from './queries/nfts/nfts'
export { getGetRewardsQueryOptions, type GetRewardsInput } from './queries/pools/rewards'
export {
  getListPoolsInfiniteQueryOptions,
  getListPoolsQueryOptions,
  type ListPoolsInfiniteInput,
  type ListPoolsInput,
} from './queries/pools/pools'
export { getPortfolioChartQueryOptions, type GetPortfolioChartInput } from './queries/balances/portfolioChart'
export { getSearchQueryOptions, type SearchInput } from './queries/search/search'
export {
  getGetTokenBuySellStatsQueryOptions,
  getGetTokenHistoryOHLCQueryOptions,
  getGetTokenHistoryPriceQueryOptions,
  getGetTokenHistoryTVLQueryOptions,
  getGetTokenHistoryVolumeQueryOptions,
  getGetTokenMarketsMultiChainQueryOptions,
  getGetTokenMarketsQueryOptions,
  getGetTokenMultiChainQueryOptions,
  getGetTokenQueryOptions,
  getGetTokensMultiChainQueryOptions,
  getGetTokensQueryOptions,
  getListTokensQueryOptions,
  type GetTokenBuySellStatsInput,
  type GetTokenHistoryOHLCInput,
  type GetTokenHistoryPriceInput,
  type GetTokenHistoryTVLInput,
  type GetTokenHistoryVolumeInput,
  type GetTokenInput,
  type GetTokenMarketsInput,
  type GetTokenMarketsMultiChainInput,
  type GetTokenMultiChainInput,
  type GetTokensInput,
  type GetTokensMultiChainInput,
  type ListTokensInput,
} from './queries/tokens/tokens'
export {
  DEFAULT_TRANSACTIONS_PAGE_SIZE,
  getListTransactionsQueryOptions,
  type ListTransactionsInput,
  type ListTransactionsTokenScope,
} from './queries/transactions/transactions'

export {
  getListWalletTransactionsInfiniteQueryOptions,
  getListWalletTransactionsQueryOptions,
  type ListWalletTransactionsQueryParams,
} from './queries/activity/activity'
export { getConvertFiatQueryOptions, type ConvertFiatInput } from './queries/convert/convert'
export {
  GET_PROTOCOL_STATS_QUERY_KEY_PREFIX,
  getExploreListTokensInfiniteQueryOptions,
  getGetProtocolStatsQueryOptions,
  type ExploreListTokensInput,
  type GetProtocolStatsInput,
} from './queries/explore/explore'
export {
  getRelatedTokensQueryOptions,
  RELATED_TOKENS_MAX_COUNT,
  type RelatedTokensInput,
} from './queries/relatedTokens/relatedTokens'
export {
  getGetTokenGroupQueryOptions,
  getListTokenGroupsInfiniteQueryOptions,
  type GetTokenGroupInput,
  type ListTokenGroupsInput,
  type TokenGroupMember,
} from './queries/tokenGroups/tokenGroups'

// Query key matchers
export { doesGetPortfolioQueryMatchAddress } from './queries/balances/doesGetPortfolioQueryMatchAddress'
export { doesProfitLossQueryMatchAddress } from './queries/pnl/doesProfitLossQueryMatchAddress'

// Response mappers
export { getRwaTagCategory } from './queries/tokens/getRwaTagCategory'
export { multichainTokenKey } from './queries/tokens/multichainTokenKey'
export { getVolumeForOrderBy, type VolumeOrderBy } from './queries/tokens/tokenRankStatsVolume'
export {
  shouldTransformToMultichain,
  transformPortfolioToMultichain,
} from './queries/balances/transformPortfolioToMultichain'

// Request input helpers
export {
  buildAccountAddressesByPlatform,
  isAccountAddressesByPlatform,
  type AccountAddressesByPlatform,
} from './utils/buildAccountAddressesByPlatform'
export {
  parseRestProtocolVersion,
  transformInput,
  transformWalletsInput,
  type WithoutWalletAccount,
  type WithoutWalletAccounts,
} from './utils/input'

// Proto types
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
