import { retry } from './retry'

describe('retry function', () => {
  it('should resolve when function is successful', async () => {
    const expectedResult = 'Success'
    const mockFn = jest.fn().mockResolvedValue(expectedResult)
    const result = await retry(mockFn)
    expect(result).toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry the specified number of times before rejecting', async () => {
    const error = new Error('Failure')
    const mockFn = jest.fn().mockRejectedValue(error)
    await expect(retry(mockFn, 3, 1)).rejects.toEqual(error)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should resolve when function is successful on the second attempt', async () => {
    const expectedResult = 'Success'
    const mockFn = jest.fn().mockRejectedValueOnce(new Error('Failure')).mockResolvedValue(expectedResult)
    const result = await retry(mockFn, 3, 1)
    expect(result).toEqual(expectedResult)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})
