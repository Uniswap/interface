import { createPromiseClient } from '@connectrpc/connect'
import { createUnitagsServiceApiClient, UnitagService } from '@universe/api'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/transport'

export const unitagsApiClient = createUnitagsServiceApiClient({
  // Always use production calls unless overridden locally to ensure stable name mapping
  rpcClient: createPromiseClient(UnitagService, entryGatewayProdPostTransport),
})
