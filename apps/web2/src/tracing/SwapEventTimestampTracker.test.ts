import { SwapEventTimestampTracker, SwapEventType } from './SwapEventTimestampTracker'

jest.mock('./utils', () => ({
  calculateElapsedTimeWithPerformanceMarkMs: (mark: string) => {
    switch (mark) {
      case SwapEventType.FIRST_SWAP_ACTION:
        return 100
      case SwapEventType.FIRST_QUOTE_FETCH_STARTED:
        return 200
      case SwapEventType.FIRST_SWAP_SIGNATURE_REQUESTED:
        return 300
      case SwapEventType.FIRST_SWAP_SIGNATURE_COMPLETED:
        return 400
      case SwapEventType.FIRST_SWAP_SUCCESS:
        return 500
      default:
        return 0
    }
  },
}))

describe('SwapEventTimestampTracker', () => {
  it('should create a new instance', () => {
    const instance = SwapEventTimestampTracker.getInstance()
    expect(instance).toBeInstanceOf(SwapEventTimestampTracker)
  })

  it('should return the same instance', () => {
    const instance1 = SwapEventTimestampTracker.getInstance()
    const instance2 = SwapEventTimestampTracker.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should set and get elapsed time', () => {
    const instance = SwapEventTimestampTracker.getInstance()
    expect(instance.setElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS)).toEqual(500)
    expect(instance.getElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS)).toEqual(500)
  })

  it('should get elapsed time between two events', () => {
    const instance = SwapEventTimestampTracker.getInstance()
    expect(instance.setElapsedTime(SwapEventType.FIRST_SWAP_ACTION)).toEqual(100)
    expect(instance.getElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS, SwapEventType.FIRST_SWAP_ACTION)).toEqual(400)
  })

  it('should return undefined if event type not set', () => {
    const instance = SwapEventTimestampTracker.getInstance()
    expect(instance.getElapsedTime(SwapEventType.FIRST_QUOTE_FETCH_STARTED)).toBeUndefined()
  })
})
