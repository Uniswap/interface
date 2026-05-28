import { useCallback, useEffect, useRef, useState } from 'react'

type Semaphore = {
  /**
   * Request a slot. `onGrant` fires (synchronously if a slot is free, otherwise once one
   * frees up). The returned function releases the slot — or cancels the wait if a slot
   * was never granted. Calling it more than once is a no-op.
   *
   * If `timeoutMs` is provided, the slot is auto-released after that many milliseconds
   * from grant. Subsequent explicit releases become no-ops. The timer is cleared on an
   * explicit release.
   */
  acquire: (onGrant: () => void, timeoutMs?: number) => () => void
}

/**
 * Process-wide counting semaphore. Limits the number of concurrent holders to
 * `maxConcurrent`. Additional callers queue in FIFO order until a slot frees up.
 */
export function createSemaphore(maxConcurrent: number): Semaphore {
  let active = 0
  const waiters: Array<() => void> = []

  const processQueue = (): void => {
    while (active < maxConcurrent && waiters.length > 0) {
      const waiter = waiters.shift()
      if (waiter) {
        active++
        waiter()
      }
    }
  }

  return {
    acquire(onGrant, timeoutMs) {
      let cancelled = false
      let granted = false
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      const tryGrant = (): void => {
        if (cancelled) {
          // active was incremented by the direct path or by processQueue; release it.
          active--
          processQueue()
          return
        }
        granted = true
        if (timeoutMs !== undefined) {
          timeoutId = setTimeout(() => {
            if (cancelled) {
              return
            }
            cancelled = true
            granted = false
            active--
            processQueue()
          }, timeoutMs)
        }
        onGrant()
      }

      if (active < maxConcurrent) {
        active++
        tryGrant()
      } else {
        waiters.push(tryGrant)
      }

      return () => {
        if (cancelled) {
          return
        }
        cancelled = true
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
        if (granted) {
          granted = false
          active--
          processQueue()
        }
      }
    },
  }
}

/**
 * Gates a value through a semaphore. Returns the value once a slot is acquired and
 * `undefined` while queued. The slot is released when the consumer calls `release` or
 * when the component unmounts / the value changes.
 *
 * Useful for fan-out scenarios like image grids where unbounded parallel work can
 * exhaust memory or bandwidth.
 *
 * `value` is compared by reference identity (it's a `useEffect` dep). Pass primitives or
 * memoized references — a fresh object literal on every render will thrash the slot
 * (release + re-acquire each render) and defeat the gate.
 *
 * `options.timeoutMs` (optional) auto-releases the slot if the consumer never does —
 * guards against permanently leaked slots when the release signal (e.g. an image's
 * `onLoad`) never fires. The gated value is left intact on timeout; only the slot is
 * reclaimed.
 */
export function useSemaphoreGatedValue<T>(params: { value: T | undefined; semaphore: Semaphore; timeoutMs?: number }): {
  gatedValue: T | undefined
  release: () => void
} {
  const { value, semaphore, timeoutMs } = params
  const [granted, setGranted] = useState(false)
  const releaseRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setGranted(false)
    if (value === undefined) {
      return
    }

    const release = semaphore.acquire(() => {
      setGranted(true)
    }, timeoutMs)
    releaseRef.current = release

    // oxlint-disable-next-line typescript/consistent-return cleanup function
    return () => {
      release()
      releaseRef.current = null
    }
  }, [value, semaphore, timeoutMs])

  const release = useCallback((): void => {
    if (releaseRef.current) {
      releaseRef.current()
      releaseRef.current = null
    }
  }, [])

  return {
    gatedValue: granted ? value : undefined,
    release,
  }
}
