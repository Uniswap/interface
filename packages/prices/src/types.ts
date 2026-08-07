import type { Currency } from '@uniswap/sdk-core'

/**
 * A token identifier with chain and address.
 * Can be used instead of a full Currency object.
 */
export interface TokenIdentifier {
  chainId: number
  address: string
}

/**
 * Which pipeline produced the cached price. Surfaced in analytics so we can
 * segment user behavior by data source without joining on the Statsig experiment.
 *
 *   aurora_ws            — pushed over the live WebSocket
 *   realtime_ws          — pushed over the realtime WebSocket channel (chain-position versioned)
 *   pool_ws              — pushed over the per-pool spot-price WebSocket channel, USD-composed client-side
 *   aurora_rest_fallback — fetched via GetTokenPrices without preferQuotePrices
 *   tapi_quote           — fetched via GetTokenPrices with preferQuotePrices=true
 */
export type PriceSource = 'aurora_ws' | 'realtime_ws' | 'pool_ws' | 'aurora_rest_fallback' | 'tapi_quote'

/**
 * Token price data with timestamp.
 */
export interface TokenPrice {
  price: number
  timestamp: number
}

/**
 * Shape stored in the React Query cache for each token price.
 */
export interface TokenPriceData {
  price: number
  timestamp: number
  source: PriceSource
}

/**
 * Key used to identify a token price in the store.
 * Format: "chainId-address" (e.g., "1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
 * Matches CurrencyId convention from uniswap/src/utils/currencyId.ts
 */
export type PriceKey = string

/**
 * A realtime pool-price room (pool_price channel) serving a token's spot
 * price. Rooms are keyed {chainId}:{protocolVersion}:{poolId} server-side;
 * chainId comes from the owning subscription params.
 */
export interface PoolPriceRoute {
  protocolVersion: 'v2' | 'v3' | 'v4'
  /** Pool address (0x + 40 hex) for v2/v3, or the 32-byte pool id (0x + 64 hex) for v4. */
  poolId: string
}

/**
 * Token identifier format used by the subscription API.
 */
export interface TokenSubscriptionParams {
  chainId: number
  tokenAddress: string
  /**
   * When set, the token's live price streams from this pool's room on the
   * pool_price channel (USD composed from the quote token's cached USD price)
   * instead of a token-keyed channel. Which pool represents a token is app
   * knowledge — injected here by the caller, the package stays feed-agnostic.
   */
  poolRoute?: PoolPriceRoute
}

/**
 * Parsed WebSocket message for token price updates.
 * Wraps channel, key, and the inner data payload.
 */
export interface TokenPriceMessage {
  channel: string
  key: string
  data: {
    chainId: number
    tokenAddress: string
    priceUsd: number
    timestamp: number
  }
}

/**
 * Raw WebSocket message format from server (strings, optional fields).
 * Parsed into {@link TokenPriceMessage} by messageParser before app consumption.
 */
export interface RawTokenPriceMessage {
  type: 'token_price_update'
  payload: {
    chainId: number
    tokenAddress: string
    priceUsd: string
    symbol?: string
    timestamp?: string
  }
  timestamp: string
}

/**
 * Raw WebSocket message from the realtime price channel (token_price_realtime_update).
 * Price legs are decimal strings; an empty string means the leg is absent (never zero).
 */
export interface RawRealtimeTokenPriceMessage {
  type: 'token_price_realtime_update'
  payload: {
    chainId: number
    tokenAddress: string
    /** USD leg. Present on directly-USD-priced tokens and on the zero-address rate room. */
    priceUsd: string
    /** ETH leg. Present on tokens the feed denominates in ETH. */
    priceEth: string
    /** Chain position (block_num·1e6 + log_index) as a positive-integer string; may exceed 2^53. */
    version: string
    feed?: string
    timestamp?: string
  }
  timestamp: string
}

/**
 * Raw WebSocket message from the per-pool spot-price channel (pool_price_update).
 * Both orientations are independently derived decimal strings (they need not
 * multiply to exactly 1); all addresses arrive lowercased.
 */
export interface RawPoolPriceMessage {
  type: 'pool_price_update'
  payload: {
    chainId: number
    /** "v2" | "v3" | "v4" (lowercased). */
    protocolVersion: string
    poolId: string
    token0Address: string
    token1Address: string
    /** Spot price of token0 denominated in token1, decimals-adjusted decimal string. */
    priceToken0InToken1: string
    /** Reciprocal orientation (token0 per token1). */
    priceToken1InToken0: string
    /** The pool's pinned quote token; empty = no quote pinned (no USD composable). */
    quoteTokenAddress: string
    /** Chain position (block_num·1e6 + block_index) as a positive-integer string; may exceed 2^53. */
    version: string
    /** Block timestamp of the swap that produced this observation (ISO string). */
    timestamp?: string
  }
  timestamp: string
}

/**
 * Connection established message from server.
 */
export interface ConnectionEstablishedMessage {
  connectionEstablished: {
    connectionId: string
    timestamp: string
  }
}

/**
 * Logger interface for optional logging.
 */
export interface Logger {
  debug: (tag: string, context: string, message: string, data?: unknown) => void
  warn: (tag: string, context: string, message: string, data?: unknown) => void
  error: (tag: string, context: string, message: string, data?: unknown) => void
}

/**
 * Type guard input - any token that can provide chain and address.
 */
export type TokenInput = TokenIdentifier | Currency
