import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v2/api_connect'
import { createDataApiServiceClientV2 } from '@universe/data-api'
import { entryGatewayPostTransport } from 'uniswap/src/data/transport'

export const DataApiV2ServiceClient = createPromiseClient(DataApiService, entryGatewayPostTransport)

export const dataApiServiceClientV2 = createDataApiServiceClientV2({
  rpcClient: DataApiV2ServiceClient,
})
