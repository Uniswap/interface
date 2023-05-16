import { retry } from './retry'

jest.useFakeTimers()

describe('retry', () => {
  it('should successfully retry on failure and resolve the value', async () => {
    let attempts = 0

    const fn = async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Failure')
      }
      return 'Success'
    }

    const promise = retry(fn, 3, 100)()

    // Advance timers by total time
    jest.advanceTimersByTime(300)

    const result = await promise
    expect(attempts).toEqual(3)
    expect(result).toEqual('Success')
  })

  it('should fail after reaching the maximum number of retries', async () => {
    let attempts = 0

    const fn = async () => {
      attempts++
      throw new Error('Failure')
    }

    const promise = retry(fn, 3, 100)()

    // Advance timers by total time
    jest.advanceTimersByTime(300)

    await expect(promise).rejects.toThrow('Failure')
    expect(attempts).toEqual(3)
  })
})
