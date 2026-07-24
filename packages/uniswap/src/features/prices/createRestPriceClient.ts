import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { getEntryGatewayUrl, getTransport } from '@universe/api'
import type { RestPriceClient, TokenIdentifier, TokenPriceData } from '@universe/prices'
import { createPriceKey } from '@universe/prices'

// Route through the Entry Gateway because GetTokenPrices is only registered
// there. Use default credentials so web proxy builds avoid wildcard-CORS
// credential failures while native clients still attach session headers via
// getTransport.
const dataApiTransport = getTransport({
  getBaseUrl: () => getEntryGatewayUrl(),
})

const dataApiClient = createPromiseClient(DataApiService, dataApiTransport)

/**
 * Creates a RestPriceClient that uses DataApiService/GetTokenPrices.
 *
 * When preferQuotePrices is true, the backend returns TAPI quote prices.
 * Otherwise the request omits preferQuotePrices and the backend returns the
 * default remote price-service data.
 */
export function createRestPriceClient(options?: { preferQuotePrices?: boolean }): RestPriceClient {
  const preferQuotePrices = options?.preferQuotePrices === true
  const source: TokenPriceData['source'] = preferQuotePrices ? 'tapi_quote' : 'aurora_rest_fallback'

  return {
    async getTokenPrices(tokens: TokenIdentifier[]): Promise<Map<string, TokenPriceData>> {
      const response = await dataApiClient.getTokenPrices({
        tokens: tokens.map((t) => ({
          chainId: t.chainId,
          address: t.address.toLowerCase(),
        })),
        ...(preferQuotePrices ? { preferQuotePrices: true } : {}),
      })

      const result = new Map<string, TokenPriceData>()

      for (const tp of response.tokenPrices) {
        if (tp.priceUsd != null) {
          const key = createPriceKey(tp.chainId, tp.address)
          result.set(key, {
            price: tp.priceUsd,
            timestamp: tp.updatedAt ? new Date(tp.updatedAt).getTime() : Date.now(),
            source,
          })
        }
      }

      return result
    },
  }
}
