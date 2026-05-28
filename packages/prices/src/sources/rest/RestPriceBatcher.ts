import { BATCH_DELAY_MS, MAX_BATCH_SIZE } from '@universe/prices/src/sources/rest/constants'
import type { RestPriceClient } from '@universe/prices/src/sources/rest/types'
import type { TokenIdentifier, TokenPriceData } from '@universe/prices/src/types'
import { createPriceKey } from '@universe/prices/src/utils/tokenIdentifier'

interface PendingRequest {
  token: TokenIdentifier
  resolve: (value: TokenPriceData | undefined) => void
  reject: (error: unknown) => void
}

/**
 * Timer-based batcher for REST price fetches.
 *
 * Individual `fetch(token)` calls are coalesced into a single batch REST
 * request within a short delay window (BATCH_DELAY_MS ≈ one frame). This
 * ensures requests from separate macrotasks (e.g. React Query refetchInterval
 * callbacks) are grouped together. Duplicate tokens share the same result.
 * Batches exceeding MAX_BATCH_SIZE are chunked into parallel requests.
 */
export class RestPriceBatcher {
  private readonly client: RestPriceClient
  private pending: PendingRequest[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(client: RestPriceClient) {
    this.client = client
  }

  /**
   * Request a price for a single token. Multiple calls within the same
   * batching window (BATCH_DELAY_MS) are batched into one REST request.
   *
   * @returns The price data, or undefined if the token has no price.
   */
  fetch(token: TokenIdentifier): Promise<TokenPriceData | undefined> {
    return new Promise<TokenPriceData | undefined>((resolve, reject) => {
      this.pending.push({
        token: { chainId: token.chainId, address: token.address.toLowerCase() },
        resolve,
        reject,
      })

      if (this.flushTimer === null) {
        this.flushTimer = setTimeout(() => this.flush(), BATCH_DELAY_MS)
      }
    })
  }

  private async flush(): Promise<void> {
    const batch = this.pending
    this.pending = []
    this.flushTimer = null

    if (batch.length === 0) {
      return
    }

    // Group resolvers by price key (deduplication)
    const resolversByKey = new Map<string, PendingRequest[]>()
    const uniqueTokens = new Map<string, TokenIdentifier>()

    for (const request of batch) {
      const key = createPriceKey(request.token.chainId, request.token.address)
      const existing = resolversByKey.get(key)
      if (existing) {
        existing.push(request)
      } else {
        resolversByKey.set(key, [request])
        uniqueTokens.set(key, request.token)
      }
    }

    const tokens = Array.from(uniqueTokens.values())

    // Chunk into batches of MAX_BATCH_SIZE
    const chunks: TokenIdentifier[][] = []
    for (let i = 0; i < tokens.length; i += MAX_BATCH_SIZE) {
      chunks.push(tokens.slice(i, i + MAX_BATCH_SIZE))
    }

    try {
      // Fetch all chunks in parallel
      const results = await Promise.all(chunks.map((chunk) => this.client.getTokenPrices(chunk)))

      // Merge all chunk results
      const merged = new Map<string, TokenPriceData>()
      for (const chunkResult of results) {
        for (const [key, value] of chunkResult) {
          merged.set(key, value)
        }
      }

      // Resolve all pending requests
      for (const [key, requests] of resolversByKey) {
        const data = merged.get(key)
        for (const request of requests) {
          request.resolve(data)
        }
      }
    } catch (error) {
      // On error, reject all pending promises (React Query retries individually)
      for (const requests of resolversByKey.values()) {
        for (const request of requests) {
          request.reject(error)
        }
      }
    }
  }
}
