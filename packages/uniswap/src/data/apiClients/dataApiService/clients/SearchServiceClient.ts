import { createPromiseClient } from '@connectrpc/connect'
import { SearchService } from '@uniswap/client-data-api/dist/data/v2/search_connect'
import { createSearchServiceClient } from '@universe/data-api'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/transport'

export const searchServiceClient = createSearchServiceClient({
  rpcClient: createPromiseClient(SearchService, entryGatewayProdPostTransport),
})
