import type { SubscriptionHandler } from '@universe/websocket/src/types'

export interface SubscriptionEntry<TParams, TMessage> {
  channel: string
  params: TParams
  callbacks: Set<(message: TMessage) => void>
}

export interface SubscriptionManagerOptions<TParams> {
  handler: SubscriptionHandler<TParams>
  createKey: (channel: string, params: TParams) => string
  onError?: (error: unknown, operation: string) => void
  onSubscriptionCountChange?: (count: number) => void
}

export interface SubscribeInput<TParams, TMessage> {
  channel: string
  params: TParams
  callback?: (message: TMessage) => void
}
