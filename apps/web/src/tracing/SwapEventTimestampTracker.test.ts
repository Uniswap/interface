import { SwapEventTimestampTracker, SwapEventType } from './SwapEventTimestampTracker'

describe('SwapEventTimestampTracker', () => {
  let swapSuccessTime: number | undefined
  let swapActionTime: number | undefined
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
    swapSuccessTime = instance.setElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS)
    expect(instance.getElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS)).toEqual(swapSuccessTime)
  })

  it('should get elapsed time between two events', () => {
    const instance = SwapEventTimestampTracker.getInstance()
    swapActionTime = instance.setElapsedTime(SwapEventType.FIRST_SWAP_ACTION)
    expect(swapSuccessTime).toBeDefined()
    expect(swapActionTime).toBeDefined()
    expect(instance.getElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS, SwapEventType.FIRST_SWAP_ACTION)).toEqual(
      (swapSuccessTime as number) - (swapActionTime as number)
    )
  })

  it('should return undefined if event type not set', () => {
    const instance = SwapEventTimestampTracker.getInstance()
    expect(instance.getElapsedTime(SwapEventType.FIRST_QUOTE_FETCH_STARTED)).toBeUndefined()
  })
})
