import { createPromiseClient } from '@connectrpc/connect'
import { LaunchService } from '@uniswap/client-launches/dist/launches/v1/api_connect'
import { createLaunchServiceClient } from '@universe/data-api'
import { entryGatewayPostTransport } from 'uniswap/src/data/transport'

export const LaunchServiceRpcClient = createPromiseClient(LaunchService, entryGatewayPostTransport)

export const launchServiceClient = createLaunchServiceClient({
  rpcClient: LaunchServiceRpcClient,
})
