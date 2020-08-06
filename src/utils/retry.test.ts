import { retry, RetryableError } from './retry'

describe('retry', () => {
  function makeFn<T>(fails: number, result: T, retryable = true): () => Promise<T> {
    return async () => {
      if (fails > 0) {
        fails--
        throw retryable ? new RetryableError('failure') : new Error('bad failure')
      }
      return result
    }
  }

  it('fails for non-retryable error', async () => {
    await expect(retry(makeFn(1, 'abc', false), { n: 3, maxWait: 0, minWait: 0 }).promise).rejects.toThrow(
      'bad failure'
    )
  })

  it('works after one fail', async () => {
    await expect(retry(makeFn(1, 'abc'), { n: 3, maxWait: 0, minWait: 0 }).promise).resolves.toEqual('abc')
  })

  it('works after two fails', async () => {
    await expect(retry(makeFn(2, 'abc'), { n: 3, maxWait: 0, minWait: 0 }).promise).resolves.toEqual('abc')
  })

  it('throws if too many fails', async () => {
    await expect(retry(makeFn(4, 'abc'), { n: 3, maxWait: 0, minWait: 0 }).promise).rejects.toThrow('failure')
  })

  it('cancel causes promise to reject', async () => {
    const { promise, cancel } = retry(makeFn(2, 'abc'), { n: 3, minWait: 100, maxWait: 100 })
    cancel()
    await expect(promise).rejects.toThrow('Cancelled')
  })

  it('cancel no-op after complete', async () => {
    const { promise, cancel } = retry(makeFn(0, 'abc'), { n: 3, minWait: 100, maxWait: 100 })
    // defer
    setTimeout(cancel, 0)
    await expect(promise).resolves.toEqual('abc')
  })

  async function checkTime(fn: () => Promise<any>, min: number, max: number) {
    const time = new Date().getTime()
    await fn()
    const diff = new Date().getTime() - time
    expect(diff).toBeGreaterThanOrEqual(min)
    expect(diff).toBeLessThanOrEqual(max)
  }

  it('waits random amount of time between min and max', async () => {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        checkTime(
          () => expect(retry(makeFn(4, 'abc'), { n: 3, maxWait: 100, minWait: 50 }).promise).rejects.toThrow('failure'),
          150,
          305
        )
      )
    }
    await Promise.all(promises)
  })
})
