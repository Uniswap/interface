import { SwapEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'

import { calculateElapsedTimeWithPerformanceMark } from './utils'

export enum SwapEventType {
  FIRST_SWAP_INPUT = 'FIRST_SWAP_INPUT',
  FIRST_QUOTE_FETCH_STARTED = 'FIRST_QUOTE_FETCH_STARTED',
  FIRST_SWAP_SIGNATURE_REQUESTED = 'FIRST_SWAP_SIGNATURE_REQUESTED',
  FIRST_SWAP_SIGNATURE_COMPLETED = 'FIRST_SWAP_SIGNATURE_COMPLETED',
  FIRST_SWAP = 'FIRST_SWAP',
}

export class SwapEventTimestampTracker {
  private static _instance: SwapEventTimestampTracker
  private constructor() {
    // Private constructor to prevent direct construction calls with the `new` operator.
  }
  public static getInstance(): SwapEventTimestampTracker {
    if (!this._instance) {
      this._instance = new SwapEventTimestampTracker()
    }
    return this._instance
  }

  private timestamps: Map<SwapEventType, number | undefined> = new Map()

  public setElapsedTime(eventType: SwapEventType): number | undefined {
    if (this.timestamps.has(eventType)) return undefined
    const elapsedTime = calculateElapsedTimeWithPerformanceMark(eventType)
    if (elapsedTime) {
      this.timestamps.set(eventType, elapsedTime)
    }
    return this.timestamps.get(eventType)
  }

  /**
   * Returns the time elapsed between the given event and the start event,
   * or page load if the start event is not provided.
   */
  public getElapsedTime(eventType: SwapEventType, startEventType?: SwapEventType): number | undefined {
    const endTime = this.timestamps.get(eventType)
    if (!endTime) return undefined
    let startTime = 0
    if (startEventType) {
      startTime = this.timestamps.get(startEventType) ?? 0
    }
    return endTime - startTime
  }
}

const tracker = SwapEventTimestampTracker.getInstance()

export function logSwapSuccess(hash: string, chainId: number, analyticsContext: any) {
  const elapsedTime = tracker.getElapsedTime(SwapEventType.FIRST_SWAP)
  sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: elapsedTime ? undefined : tracker.setElapsedTime(SwapEventType.FIRST_SWAP),
    time_to_swap_since_first_input: tracker.getElapsedTime(SwapEventType.FIRST_SWAP, SwapEventType.FIRST_SWAP_INPUT),
    hash,
    chainId,
    ...analyticsContext,
  })
}

// We only log the time-to-first-swap-input metric for the first swap input of a session.
export function maybeLogFirstSwapInput(analyticsContext: any) {
  if (!tracker.getElapsedTime(SwapEventType.FIRST_SWAP_INPUT)) {
    const elapsedTime = tracker.setElapsedTime(SwapEventType.FIRST_SWAP_INPUT)
    // todo: get event name from shared package
    sendAnalyticsEvent('SWAP_INPUT_FIRST_USED', {
      time_to_first_swap_input: elapsedTime,
      ...analyticsContext,
    })
  }
}
