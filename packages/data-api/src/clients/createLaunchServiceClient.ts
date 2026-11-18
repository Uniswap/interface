import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type LaunchService } from '@uniswap/client-launches/dist/launches/v1/api_connect'
import type {
  ListLaunchesRequest,
  ListLaunchesResponse,
  ListLaunchpadsRequest,
  ListLaunchpadsResponse,
} from '@uniswap/client-launches/dist/launches/v1/api_pb'

export interface LaunchServiceClientContext {
  rpcClient: PromiseClient<typeof LaunchService>
}

/**
 * Facade over launches.v1.LaunchService — the launches-service twin of the launch-scoped
 * reads previously served by data.v2.DataApiService (LP endpoint migration, phase 1).
 * The request/response messages are wire- and JSON-identical to their data.v2 twins.
 */
export interface LaunchServiceClient {
  listLaunchpads: (params: PartialMessage<ListLaunchpadsRequest>) => Promise<ListLaunchpadsResponse>
  listLaunches: (params: PartialMessage<ListLaunchesRequest>) => Promise<ListLaunchesResponse>
}

export function createLaunchServiceClient({ rpcClient }: LaunchServiceClientContext): LaunchServiceClient {
  return {
    listLaunchpads: (params): Promise<ListLaunchpadsResponse> => rpcClient.listLaunchpads(params),
    listLaunches: (params): Promise<ListLaunchesResponse> => rpcClient.listLaunches(params),
  }
}
