import { createConnectTransport } from '@connectrpc/connect-web'
import { uniswapUrls } from 'uniswap/src/constants/urls'

/**
 * Connectrpc transport for Uniswap REST BE service
 * specifically makes GET requests for data
 */
export const uniswapGetTransport = createConnectTransport({
  baseUrl: uniswapUrls.apiBaseUrlV2,
  useHttpGet: true,
})

// The string arg to pass to the BE for chainId to get data for all networks
export const ALL_NETWORKS_ARG = 'ALL_NETWORKS'

/**
 * To add a ConnectRPC hook for a new BE client service:
 * 1. Create a new file in the `data/rest` directory with a name matching the service
 * 2. Copy the below template replacing `newService` with the service name
 *   a. The client service, Request, and Response types are imported from the generated client
 *   b. You can use exploreStats as a reference for how to structure the hook
 * export function useNewServiceQuery(
    input?: PartialMessage<NewServiceRequest>,
  ): UseQueryResult<NewServiceResponse, ConnectError> {
    return useQuery(newService, input, { transport: uniswapGetTransport })
  }
 */
