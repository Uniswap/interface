import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { createDataApiServiceClient } from '@universe/api'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/transport'

export const DataApiV1ServiceClient = createPromiseClient(DataApiService, entryGatewayProdPostTransport)

export const dataApiServiceClientV1 = createDataApiServiceClient({
  rpcClient: DataApiV1ServiceClient,
})
