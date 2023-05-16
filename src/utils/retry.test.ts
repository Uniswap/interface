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
    const result = await retry(mockFn)
    expect(result).toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry the specified number of times before rejecting', async () => {
    const error = new Error('Failure')
    mockFn.mockRejectedValue(error)
    await expect(retry(mockFn, 3, 1)).rejects.toEqual(error)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should resolve when function is successful on the second attempt', async () => {
    const expectedResult = 'Success'
    mockFn.mockRejectedValueOnce(new Error('Failure')).mockResolvedValue(expectedResult)
    const result = await retry(mockFn, 3, 1)
    expect(result).toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})
