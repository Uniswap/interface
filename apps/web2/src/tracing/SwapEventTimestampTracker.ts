import { calculateElapsedTimeWithPerformanceMarkMs } from './utils'

// These events should happen in this order.
export enum SwapEventType {
  /**
   * Full list of actions that can trigger the FIRST_SWAP_ACTION moment:
   * - “max” clicked for an input amount
   * - token selected (input or output)
   * - token amount typed (input or output)
   * - reverse button clicked
   */
  FIRST_SWAP_ACTION = 'FIRST_SWAP_ACTION',
  FIRST_QUOTE_FETCH_STARTED = 'FIRST_QUOTE_FETCH_STARTED',
  FIRST_SWAP_SIGNATURE_REQUESTED = 'FIRST_SWAP_SIGNATURE_REQUESTED',
  FIRST_SWAP_SIGNATURE_COMPLETED = 'FIRST_SWAP_SIGNATURE_COMPLETED',
  FIRST_SWAP_SUCCESS = 'FIRST_SWAP_SUCCESS',
}

export class SwapEventTimestampTracker {
  private static _instance: SwapEventTimestampTracker
  private createdAt = Date.now()
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

  public hasTimestamp(eventType: SwapEventType): boolean {
    return this.timestamps.has(eventType)
  }

  public setElapsedTime(eventType: SwapEventType): number | undefined {
    if (this.timestamps.has(eventType)) return undefined
    const elapsedTime = calculateElapsedTimeWithPerformanceMarkMs(eventType, this.createdAt)
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

export const timestampTracker = SwapEventTimestampTracker.getInstance()
