import type { ConnectionEstablishedMessage, RawTokenPriceMessage, TokenPriceMessage } from '@universe/prices/src/types'
import { createPriceKey } from '@universe/prices/src/utils/tokenIdentifier'

/**
 * Type guard for RawTokenPriceMessage
 */
export function isRawTokenPriceMessage(message: unknown): message is RawTokenPriceMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'token_price_update' &&
    'payload' in message &&
    typeof message.payload === 'object' &&
    message.payload !== null
  )
}

/**
 * Type guard for ConnectionEstablishedMessage
 */
export function isConnectionEstablishedMessage(message: unknown): message is ConnectionEstablishedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'connectionEstablished' in message &&
    typeof message.connectionEstablished === 'object' &&
    message.connectionEstablished !== null &&
    'connectionId' in message.connectionEstablished
  )
}

/**
 * Parses a raw WebSocket message into a typed price update.
 * Returns null if the message is not a price update.
 *
 * Used both as the `parseMessage` config for createWebSocketClient
 * and in the `onRawMessage` callback to write to React Query cache.
 */
export function parseTokenPriceMessage(raw: unknown): TokenPriceMessage | null {
  if (!isRawTokenPriceMessage(raw)) {
    return null
  }

  const { chainId, tokenAddress, priceUsd } = raw.payload
  const price = parseFloat(priceUsd)

  if (Number.isNaN(price)) {
    return null
  }

  const timestamp = new Date(raw.timestamp).getTime()
  const key = createPriceKey(chainId, tokenAddress)

  return {
    channel: 'token_price',
    key,
    data: {
      chainId,
      tokenAddress: tokenAddress.toLowerCase(),
      priceUsd: price,
      timestamp,
    },
  }
}

/**
 * Parses a raw WebSocket message for connection establishment.
 * Returns null if the message is not a connection message.
 */
export function parseConnectionMessage(raw: unknown): { connectionId: string } | null {
  if (!isConnectionEstablishedMessage(raw)) {
    return null
  }

  return {
    connectionId: raw.connectionEstablished.connectionId,
  }
}
