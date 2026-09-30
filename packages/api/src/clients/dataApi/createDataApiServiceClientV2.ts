import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type DataApiService } from '@uniswap/client-data-api/dist/data/v2/api_connect'
import type {
  ConvertFiatRequest,
  ConvertFiatResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  GetEarnPositionRequest,
  GetEarnPositionResponse,
  GetTokenGroupRequest,
  GetTokenGroupResponse,
  GetTokenHistoryOHLCRequest,
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceRequest,
  GetTokenHistoryPriceResponse,
  GetTokenHistoryTVLRequest,
  GetTokenHistoryTVLResponse,
  GetTokenHistoryVolumeRequest,
  GetTokenHistoryVolumeResponse,
  GetTokenMarketsMultiChainRequest,
  GetTokenMarketsMultiChainResponse,
  GetTokenMarketsRequest,
  GetTokenMarketsResponse,
  GetTokenMultiChainRequest,
  GetTokenMultiChainResponse,
  GetTokenRequest,
  GetTokenResponse,
  GetTokensMultiChainRequest,
  GetTokensMultiChainResponse,
  GetTokensRequest,
  GetTokensResponse,
  GetWalletNftsRequest,
  GetWalletNftsResponse,
  ListCategoriesRequest,
  ListCategoriesResponse,
  ListEarnPositionsRequest,
  ListEarnPositionsResponse,
  ListEarnVaultsRequest,
  ListEarnVaultsResponse,
  ListPoolsRequest,
  ListPoolsResponse,
  ListTokenGroupsRequest,
  ListTokenGroupsResponse,
  ListTokensRequest,
  ListTokensResponse,
  ListTransactionsRequest,
  ListTransactionsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'

export interface DataApiServiceClientContext {
  rpcClient: PromiseClient<typeof DataApiService>
}

export interface DataApiServiceClientV2 {
  getWalletNfts: (params: PartialMessage<GetWalletNftsRequest>) => Promise<GetWalletNftsResponse>
  convertFiat: (params: PartialMessage<ConvertFiatRequest>) => Promise<ConvertFiatResponse>
  listEarnVaults: (params: PartialMessage<ListEarnVaultsRequest>) => Promise<ListEarnVaultsResponse>
  listEarnPositions: (params: PartialMessage<ListEarnPositionsRequest>) => Promise<ListEarnPositionsResponse>
  getEarnPosition: (params: PartialMessage<GetEarnPositionRequest>) => Promise<GetEarnPositionResponse>
  getCategory: (params: PartialMessage<GetCategoryRequest>) => Promise<GetCategoryResponse>
  listCategories: (params: PartialMessage<ListCategoriesRequest>) => Promise<ListCategoriesResponse>
  listPools: (params: PartialMessage<ListPoolsRequest>) => Promise<ListPoolsResponse>
  listTokens: (params: PartialMessage<ListTokensRequest>) => Promise<ListTokensResponse>
  listTokenGroups: (params: PartialMessage<ListTokenGroupsRequest>) => Promise<ListTokenGroupsResponse>
  getTokenGroup: (params: PartialMessage<GetTokenGroupRequest>) => Promise<GetTokenGroupResponse>
  listTransactions: (params: PartialMessage<ListTransactionsRequest>) => Promise<ListTransactionsResponse>
  getToken: (params: PartialMessage<GetTokenRequest>) => Promise<GetTokenResponse>
  getTokens: (params: PartialMessage<GetTokensRequest>) => Promise<GetTokensResponse>
  getTokenMultiChain: (params: PartialMessage<GetTokenMultiChainRequest>) => Promise<GetTokenMultiChainResponse>
  getTokensMultiChain: (params: PartialMessage<GetTokensMultiChainRequest>) => Promise<GetTokensMultiChainResponse>
  getTokenMarkets: (params: PartialMessage<GetTokenMarketsRequest>) => Promise<GetTokenMarketsResponse>
  getTokenMarketsMultiChain: (
    params: PartialMessage<GetTokenMarketsMultiChainRequest>,
  ) => Promise<GetTokenMarketsMultiChainResponse>
  getTokenHistoryPrice: (params: PartialMessage<GetTokenHistoryPriceRequest>) => Promise<GetTokenHistoryPriceResponse>
  getTokenHistoryOHLC: (params: PartialMessage<GetTokenHistoryOHLCRequest>) => Promise<GetTokenHistoryOHLCResponse>
  getTokenHistoryVolume: (
    params: PartialMessage<GetTokenHistoryVolumeRequest>,
  ) => Promise<GetTokenHistoryVolumeResponse>
  getTokenHistoryTVL: (params: PartialMessage<GetTokenHistoryTVLRequest>) => Promise<GetTokenHistoryTVLResponse>
}

export function createDataApiServiceClientV2({ rpcClient }: DataApiServiceClientContext): DataApiServiceClientV2 {
  return {
    getWalletNfts: (params): Promise<GetWalletNftsResponse> => rpcClient.getWalletNfts(params),
    convertFiat: (params): Promise<ConvertFiatResponse> => rpcClient.convertFiat(params),
    listEarnVaults: (params): Promise<ListEarnVaultsResponse> => rpcClient.listEarnVaults(params),
    listEarnPositions: (params): Promise<ListEarnPositionsResponse> => rpcClient.listEarnPositions(params),
    getEarnPosition: (params): Promise<GetEarnPositionResponse> => rpcClient.getEarnPosition(params),
    getCategory: (params): Promise<GetCategoryResponse> => rpcClient.getCategory(params),
    listCategories: (params): Promise<ListCategoriesResponse> => rpcClient.listCategories(params),
    listPools: (params): Promise<ListPoolsResponse> => rpcClient.listPools(params),
    listTokens: (params): Promise<ListTokensResponse> => rpcClient.listTokens(params),
    listTokenGroups: (params): Promise<ListTokenGroupsResponse> => rpcClient.listTokenGroups(params),
    getTokenGroup: (params): Promise<GetTokenGroupResponse> => rpcClient.getTokenGroup(params),
    listTransactions: (params): Promise<ListTransactionsResponse> => rpcClient.listTransactions(params),
    getToken: (params): Promise<GetTokenResponse> => rpcClient.getToken(params),
    getTokens: (params): Promise<GetTokensResponse> => rpcClient.getTokens(params),
    getTokenMultiChain: (params): Promise<GetTokenMultiChainResponse> => rpcClient.getTokenMultiChain(params),
    getTokensMultiChain: (params): Promise<GetTokensMultiChainResponse> => rpcClient.getTokensMultiChain(params),
    getTokenMarkets: (params): Promise<GetTokenMarketsResponse> => rpcClient.getTokenMarkets(params),
    getTokenMarketsMultiChain: (params): Promise<GetTokenMarketsMultiChainResponse> =>
      rpcClient.getTokenMarketsMultiChain(params),
    getTokenHistoryPrice: (params): Promise<GetTokenHistoryPriceResponse> => rpcClient.getTokenHistoryPrice(params),
    getTokenHistoryOHLC: (params): Promise<GetTokenHistoryOHLCResponse> => rpcClient.getTokenHistoryOHLC(params),
    getTokenHistoryVolume: (params): Promise<GetTokenHistoryVolumeResponse> => rpcClient.getTokenHistoryVolume(params),
    getTokenHistoryTVL: (params): Promise<GetTokenHistoryTVLResponse> => rpcClient.getTokenHistoryTVL(params),
  }
}
