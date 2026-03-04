import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type {
  GetPortfolioRequest,
  GetPortfolioResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
  ListTopTokensRequest,
  ListTopTokensResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'

export interface DataApiServiceClientContext {
  rpcClient: PromiseClient<typeof DataApiService>
}

export interface DataApiServiceClient {
  getPortfolio: (params: PartialMessage<GetPortfolioRequest>) => Promise<GetPortfolioResponse>
  listTopTokens: (params: PartialMessage<ListTopTokensRequest>) => Promise<ListTopTokensResponse>
  listTopPools: (params: PartialMessage<ListTopPoolsRequest>) => Promise<ListTopPoolsResponse>
}

export function createDataApiServiceClient({ rpcClient }: DataApiServiceClientContext): DataApiServiceClient {
  return {
    getPortfolio: (params): Promise<GetPortfolioResponse> => rpcClient.getPortfolio(params),
    listTopTokens: (params): Promise<ListTopTokensResponse> => rpcClient.listTopTokens(params),
    listTopPools: (params): Promise<ListTopPoolsResponse> => rpcClient.listTopPools(params),
  }
}
