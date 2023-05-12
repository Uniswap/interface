import { retry } from './retry'

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

    const result = await retry(fn, 3, 100)()
    expect(attempts).toEqual(3)
    expect(result).toEqual('Success')
  })

  it('should fail after reaching the maximum number of retries', async () => {
    let attempts = 0

    const fn = async () => {
      attempts++
      throw new Error('Failure')
    }

    try {
      await retry(fn, 3, 100)()
    } catch (error) {
      // Skip
    }

    expect(attempts).toEqual(3)
  })
})
