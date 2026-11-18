import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type SearchService } from '@uniswap/client-data-api/dist/data/v2/search_connect'
import type { SearchRequest, SearchResponse } from '@uniswap/client-data-api/dist/data/v2/search_pb'

export interface SearchServiceClientContext {
  rpcClient: PromiseClient<typeof SearchService>
}

export interface SearchServiceClient {
  search: (params: PartialMessage<SearchRequest>) => Promise<SearchResponse>
}

export function createSearchServiceClient({ rpcClient }: SearchServiceClientContext): SearchServiceClient {
  return {
    search: (params): Promise<SearchResponse> => rpcClient.search(params),
  }
}
