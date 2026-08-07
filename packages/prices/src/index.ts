// Types

export {
  isConnectionEstablishedMessage,
  isRawPoolPriceMessage,
  isRawRealtimeTokenPriceMessage,
  isRawTokenPriceMessage,
  parseConnectionMessage,
  parseTokenPriceMessage,
} from '@universe/prices/src/sources/websocket/messageParser'
// Internals (testing / custom setups)
export { getTokenPriceSource } from '@universe/prices/src/getTokenPriceSource'
// Realtime channel (ETH-leg × ETH/USD join, version gating)
export {
  createRealtimePriceJoiner,
  REALTIME_RATE_TOKEN_ADDRESS,
  type RealtimePriceJoiner,
  type RealtimePriceUpdate,
} from '@universe/prices/src/sources/websocket/realtimeJoiner'
// Pool channel (base-in-quote × quote-USD join, per-room version gating)
export {
  createPoolPriceJoiner,
  type PoolPriceJoiner,
  type PoolPriceUpdate,
} from '@universe/prices/src/sources/websocket/poolPriceJoiner'
export { createPriceSubscriptionHandler } from '@universe/prices/src/sources/websocket/subscriptionApi'
export { withRealtimeRateSubscription } from '@universe/prices/src/sources/websocket/withRealtimeRateSubscription'
export type {
  ConnectionEstablishedMessage,
  Logger,
  PoolPriceRoute,
  PriceKey,
  PriceSource,
  RawPoolPriceMessage,
  RawRealtimeTokenPriceMessage,
  RawTokenPriceMessage,
  TokenIdentifier,
  TokenInput,
  TokenPrice,
  TokenPriceData,
  TokenPriceMessage,
  TokenSubscriptionParams,
} from '@universe/prices/src/types'
export {
  createPriceKey,
  createPriceKeyFromToken,
  createPriceSubscriptionKey,
  DEFAULT_NATIVE_ADDRESS,
  filterValidTokens,
  isCurrency,
  isTokenIdentifier,
  normalizeToken,
  parsePriceKey,
  toSubscriptionParams,
} from '@universe/prices/src/utils/tokenIdentifier'
export type { ConnectionStatus } from '@universe/websocket'
export { PriceServiceProvider, usePricesContext } from './context/PriceServiceContext'
export { useConnectionStatus } from './hooks/useConnectionStatus'
// Consumer hooks
// Backward-compat alias
export { usePrice, usePrice as useLivePrice } from './hooks/usePrice'
// Query utilities (advanced / UDL)
export { priceKeys } from './queries/priceKeys'
export { tokenPriceQueryOptions } from './queries/tokenPriceQueryOptions'
export { REST_POLL_INTERVAL_MS } from './sources/rest/constants'
// REST fallback
export { RestPriceBatcher } from './sources/rest/RestPriceBatcher'
export type { RestPriceClient } from './sources/rest/types'
