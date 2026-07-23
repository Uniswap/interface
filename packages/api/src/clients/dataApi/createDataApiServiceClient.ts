import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type {
  GetPortfolioRequest,
  GetPortfolioResponse,
  GetWalletBalancesRequest,
  GetWalletBalancesResponse,
  GetWalletsBalancesRequest,
  GetWalletsBalancesResponse,
  ListTokensRequest,
  ListTokensResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'

export interface DataApiServiceClientContext {
  rpcClient: PromiseClient<typeof DataApiService>
}

export interface DataApiServiceClient {
  getPortfolio: (params: PartialMessage<GetPortfolioRequest>) => Promise<GetPortfolioResponse>
  getWalletBalances: (params: PartialMessage<GetWalletBalancesRequest>) => Promise<GetWalletBalancesResponse>
  getWalletsBalances: (params: PartialMessage<GetWalletsBalancesRequest>) => Promise<GetWalletsBalancesResponse>
  listTokens: (params: PartialMessage<ListTokensRequest>) => Promise<ListTokensResponse>
  listTopPools: (params: PartialMessage<ListTopPoolsRequest>) => Promise<ListTopPoolsResponse>
}

export function createDataApiServiceClient({ rpcClient }: DataApiServiceClientContext): DataApiServiceClient {
  return {
    getPortfolio: (params): Promise<GetPortfolioResponse> => rpcClient.getPortfolio(params),
    getWalletBalances: (params): Promise<GetWalletBalancesResponse> => rpcClient.getWalletBalances(params),
    getWalletsBalances: (params): Promise<GetWalletsBalancesResponse> => rpcClient.getWalletsBalances(params),
    listTokens: (params): Promise<ListTokensResponse> => rpcClient.listTokens(params),
    listTopPools: (params): Promise<ListTopPoolsResponse> => rpcClient.listTopPools(params),
  }
}
