import { retry } from './retry'

describe('retry', () => {
  function makeFn<T>(fails: number, result: T): () => Promise<T> {
    return async () => {
      if (fails > 0) {
        fails--
        throw new Error('failure')
      }
      return result
    }
  }

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
