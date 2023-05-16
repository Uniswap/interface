import { retry } from './retry'

describe('retry function', () => {
  let mockFn: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    mockFn = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should resolve when function is successful', async () => {
    const expectedResult = 'Success'
    mockFn.mockImplementation(() => Promise.resolve(expectedResult))
    const retryFn = retry(mockFn)
    const result = retryFn()
    jest.runOnlyPendingTimers()
    await expect(result).resolves.toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry the specified number of times before rejecting', async () => {
    const error = new Error('Failure')
    mockFn.mockImplementation(() => Promise.reject(error))
    const retryFn = retry(mockFn, 2)
    const result = retryFn()
    jest.runOnlyPendingTimers()
    await expect(result).rejects.toEqual(error)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should respect the delay between retries', () => {
    mockFn.mockImplementation(() => Promise.reject(new Error('Failure')))
    const retryFn = retry(mockFn, 2, 2000)
    retryFn()
    jest.advanceTimersByTime(1999)
    expect(mockFn).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(mockFn).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(3999)
    expect(mockFn).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(1)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })
})
