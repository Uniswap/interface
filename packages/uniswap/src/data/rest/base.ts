import { createConnectTransportWithDefaults } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { BASE_UNISWAP_HEADERS } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { isMobileApp } from 'utilities/src/platform'

/**
 * Connectrpc transports for Uniswap REST BE service
 */
export const uniswapGetTransport = createConnectTransportWithDefaults(
  {
    baseUrl: uniswapUrls.apiBaseUrlV2,
    // Mobile app needs to manually set headers
    additionalHeaders: isMobileApp ? BASE_UNISWAP_HEADERS : undefined,
  },
  { useHttpGet: true },
)

export const uniswapPostTransport = createConnectTransportWithDefaults({
  baseUrl: uniswapUrls.apiBaseUrlV2,
  // Mobile app needs to manually set headers
  additionalHeaders: isMobileApp ? BASE_UNISWAP_HEADERS : undefined,
})

/**
 * To add a ConnectRPC hook for a new BE client service:
 * 1. Create a new file in the appropriate directory with a name matching the service
 * 2. Copy the below template replacing `newService` with the service name
 *   a. The client service, Request, and Response types are imported from the generated client
 *   b. You can use exploreStats as a reference for how to structure the hook
 * export function useNewServiceQuery(
    input?: PartialMessage<NewServiceRequest>,
  ): UseQueryResult<NewServiceResponse, ConnectError> {
    return useQuery(newService, input, { transport: uniswapGetTransport })
  }
 */
