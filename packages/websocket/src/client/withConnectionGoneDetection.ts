import { ConnectionGoneError } from '@universe/websocket/src/errors'
import type { SubscriptionHandler } from '@universe/websocket/src/types'

/** Consecutive "connection gone" failures before the connection is declared dead.
 * One is not enough: server presence lapses briefly between heartbeats on a live socket. */
export const CONNECTION_GONE_STRIKES = 2

/** Reports a connection once its RPCs keep rejecting with ConnectionGoneError; results pass through unchanged.
 * A socket the server dropped can still read OPEN, so these failures are the client's only signal. */
export function withConnectionGoneDetection<TParams>(
  handler: SubscriptionHandler<TParams>,
  onConnectionGone: (connectionId: string) => void,
): SubscriptionHandler<TParams> {
  const strikes = new Map<string, number>()

  async function track(connectionId: string, call: Promise<void>): Promise<void> {
    try {
      await call
      strikes.delete(connectionId)
    } catch (error) {
      if (error instanceof ConnectionGoneError) {
        const count = (strikes.get(connectionId) ?? 0) + 1
        strikes.set(connectionId, count)
        if (count >= CONNECTION_GONE_STRIKES) {
          onConnectionGone(connectionId)
        }
      }
      throw error
    }
  }

  const { subscribeBatch, unsubscribeBatch, refreshSession } = handler

  return {
    subscribe: (connectionId, params) => track(connectionId, handler.subscribe(connectionId, params)),
    unsubscribe: (connectionId, params) => track(connectionId, handler.unsubscribe(connectionId, params)),
    ...(subscribeBatch && {
      subscribeBatch: (connectionId: string, params: TParams[]): Promise<void> =>
        track(connectionId, subscribeBatch(connectionId, params)),
    }),
    ...(unsubscribeBatch && {
      unsubscribeBatch: (connectionId: string, params: TParams[]): Promise<void> =>
        track(connectionId, unsubscribeBatch(connectionId, params)),
    }),
    ...(refreshSession && {
      refreshSession: (connectionId: string): Promise<void> => track(connectionId, refreshSession(connectionId)),
    }),
  }
}
