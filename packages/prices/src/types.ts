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
}

/**
 * Key used to identify a token price in the store.
 * Format: "chainId-address" (e.g., "1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
 * Matches CurrencyId convention from uniswap/src/utils/currencyId.ts
 */
export type PriceKey = string

/**
 * Token identifier format used by the subscription API.
 */
export interface TokenSubscriptionParams {
  chainId: number
  tokenAddress: string
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
