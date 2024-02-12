interface Options {
  concurrency?: number
  maxQueueSize?: number
}

export default function makeConcurrencyLimited<Arguments extends unknown[], ReturnType>(
  function_: (...arguments_: Arguments) => PromiseLike<ReturnType>,
  options?: Options | number
): (...arguments_: Arguments) => Promise<ReturnType> {
  let concurrency = 2
  let maxQueueSize = 20
  if (typeof options == 'number') {
    concurrency = options
    maxQueueSize = options * 10
  } else {
    concurrency = options?.concurrency || 3
    maxQueueSize = options?.maxQueueSize || 100
  }

  if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up')
  }

  const queue: (() => Promise<void>)[] = []
  let activeCount = 0

  const next = () => {
    activeCount--

    if (queue.length > 0) {
      queue.shift()?.()
    }
  }

  const run = async (resolve: (value: ReturnType | PromiseLike<ReturnType>) => void, arguments_: Arguments) => {
    activeCount++

    const result = (async () => function_(...arguments_))()

    resolve(result)

    try {
      await result
    } catch {
      // ignore
    }

    next()
  }

  const enqueue = (resolve: (value: ReturnType | PromiseLike<ReturnType>) => void, arguments_: Arguments) => {
    queue.push(run.bind(undefined, resolve, arguments_))
    ;(async () => {
      // This function needs to wait until the next microtask before comparing
      // `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
      // when the run function is dequeued and called. The comparison in the if-statement
      // needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
      await Promise.resolve()

      if (activeCount < concurrency && queue.length > 0) {
        queue.shift()?.()
      }
    })()
  }

  return (...arguments_: Arguments) => {
    return new Promise((resolve, reject) => {
      if (queue.length > maxQueueSize) {
        reject(new Error('Too many task'))
      }
      enqueue(resolve, arguments_)
    })
  }
}
