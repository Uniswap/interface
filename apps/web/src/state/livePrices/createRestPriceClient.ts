import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { getEntryGatewayUrl, getTransport } from '@universe/api'
import type { RestPriceClient, TokenIdentifier, TokenPriceData } from '@universe/prices'
import { createPriceKey } from '@universe/prices'

// Route through the Entry Gateway (not the Cloudflare gateway) because
// GetTokenPrices is only registered on EGW, not on the CF gateway.
// Session cookies authenticate the request via the BFF proxy.
const dataApiTransport = getTransport({
  getBaseUrl: () => getEntryGatewayUrl(),
  options: {
    credentials: 'include',
  },
})

const dataApiClient = createPromiseClient(DataApiService, dataApiTransport)

/**
 * Creates a RestPriceClient that uses the ConnectRPC DataApiService
 * to fetch token prices via POST /data.v1.DataApiService/GetTokenPrices.
 */
export function createRestPriceClient(): RestPriceClient {
  return {
    async getTokenPrices(tokens: TokenIdentifier[]): Promise<Map<string, TokenPriceData>> {
      const response = await dataApiClient.getTokenPrices({
        tokens: tokens.map((t) => ({
          chainId: t.chainId,
          address: t.address.toLowerCase(),
        })),
      })

      const result = new Map<string, TokenPriceData>()

      for (const tp of response.tokenPrices) {
        if (tp.priceUsd != null) {
          const key = createPriceKey(tp.chainId, tp.address)
          result.set(key, {
            price: tp.priceUsd,
            timestamp: tp.updatedAt ? new Date(tp.updatedAt).getTime() : Date.now(),
          })
        }
      }

      return result
    },
  }
}
