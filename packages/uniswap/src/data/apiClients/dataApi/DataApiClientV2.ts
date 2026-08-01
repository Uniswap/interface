import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v2/api_connect'
import { createDataApiServiceClientV2 } from '@universe/api'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'

export const DataApiV2ServiceClient = createPromiseClient(DataApiService, entryGatewayProdPostTransport)

export const dataApiServiceClientV2 = createDataApiServiceClientV2({
  rpcClient: DataApiV2ServiceClient,
})
