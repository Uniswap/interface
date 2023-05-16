import { retry } from './retry'

describe('retry function', () => {
  jest.useRealTimers()
  let mockFn: jest.Mock

  beforeEach(() => {
    mockFn = jest.fn()
  })

  it('should resolve when function is successful', async () => {
    const expectedResult = 'Success'
    mockFn.mockResolvedValue(expectedResult)
    const retryFn = retry(mockFn)
    const result = await retryFn()
    expect(result).toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry the specified number of times before rejecting', async () => {
    const error = new Error('Failure')
    mockFn.mockRejectedValue(error)
    const retryFn = retry(mockFn, 3, 1)
    await expect(retryFn()).rejects.toEqual(error)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should resolve when function is successful on the second attempt', async () => {
    const expectedResult = 'Success'
    mockFn.mockRejectedValueOnce(new Error('Failure')).mockResolvedValue(expectedResult)
    const retryFn = retry(mockFn, 3, 1)
    const result = await retryFn()
    expect(result).toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})
