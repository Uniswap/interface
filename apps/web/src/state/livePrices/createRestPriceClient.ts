import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { getEntryGatewayUrl, getTransport } from '@universe/api'
import type { RestPriceClient, TokenIdentifier, TokenPriceData } from '@universe/prices'
import { createPriceKey } from '@universe/prices'

// Route through the Entry Gateway (not the Cloudflare gateway) because
// GetTokenPrices is only registered on EGW, not on the CF gateway.
// Use default `same-origin` credentials so cookies flow through the BFF
// proxy but not cross-origin — staging and Vercel preview builds hit an
// upstream with wildcard CORS, which the browser blocks when credentials
// mode is 'include'.
const dataApiTransport = getTransport({
  getBaseUrl: () => getEntryGatewayUrl(),
})

const dataApiClient = createPromiseClient(DataApiService, dataApiTransport)

/**
 * Creates a RestPriceClient that uses the ConnectRPC DataApiService
 * to fetch token prices via POST /data.v1.DataApiService/GetTokenPrices.
 *
 * @param options.preferQuotePrices - When true, the backend returns TAPI quote
 *   prices and the cached entry is tagged `tapi_quote`. When false (default),
 *   the response is Aurora substreams data and is tagged `aurora_rest_fallback`.
 */
export function createRestPriceClient(options?: { preferQuotePrices?: boolean }): RestPriceClient {
  const preferQuotePrices = options?.preferQuotePrices ?? false
  const source: TokenPriceData['source'] = preferQuotePrices ? 'tapi_quote' : 'aurora_rest_fallback'

  return {
    async getTokenPrices(tokens: TokenIdentifier[]): Promise<Map<string, TokenPriceData>> {
      const response = await dataApiClient.getTokenPrices({
        tokens: tokens.map((t) => ({
          chainId: t.chainId,
          address: t.address.toLowerCase(),
        })),
        preferQuotePrices,
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
