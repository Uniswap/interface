import type { TokenIdentifier, TokenPriceData } from '@universe/prices/src/types'

/**
 * Contract for fetching token prices via REST.
 * Implementations handle the actual transport (ConnectRPC, fetch, etc.).
 */
export interface RestPriceClient {
  /**
   * Fetches prices for a batch of tokens.
   * @returns Map keyed by price key ("chainId-address"), missing tokens omitted.
   */
  getTokenPrices(tokens: TokenIdentifier[]): Promise<Map<string, TokenPriceData>>
}
