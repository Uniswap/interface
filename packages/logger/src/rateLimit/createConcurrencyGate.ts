/**
 * Concurrency gate: `maxConcurrent` tasks run, `maxPending` more wait FIFO up
 * to `pendingTimeoutMs`, everything past that is shed for the caller to
 * answer itself (a 503). Shedding the overflow keeps the process alive to
 * serve everything else.
 *
 * Per-process state, like the rate limiter: on N tasks the effective ceiling
 * is N × maxConcurrent, which is the point — the budget protects each task's
 * own memory limit.
 */

export const SHED = Symbol('concurrency-gate-shed')

export interface ConcurrencyGateOptions {
  maxConcurrent: number
  maxPending: number
  pendingTimeoutMs: number
}

export interface ConcurrencyGateStats {
  active: number
  pending: number
  shedTotal: number
}

export interface ConcurrencyGate {
  /** Runs `task` inside the gate; resolves SHED instead of running it when over capacity. */
  run<T>(task: () => Promise<T>): Promise<T | typeof SHED>
  stats(): ConcurrencyGateStats
}

interface Waiter {
  admit: () => void
  timer: ReturnType<typeof setTimeout>
}

export function createConcurrencyGate({
  maxConcurrent,
  maxPending,
  pendingTimeoutMs,
}: ConcurrencyGateOptions): ConcurrencyGate {
  let active = 0
  let shedTotal = 0
  const queue: Waiter[] = []

  // The freed slot is handed to the queue head BEFORE the waiter resumes, so
  // a burst of settling tasks can never over-admit past maxConcurrent.
  function releaseSlot(): void {
    active -= 1
    const next = queue.shift()
    if (next) {
      clearTimeout(next.timer)
      active += 1
      next.admit()
    }
  }

  async function execute<T>(task: () => Promise<T>): Promise<T> {
    try {
      return await task()
    } finally {
      releaseSlot()
    }
  }

  return {
    async run(task) {
      if (active < maxConcurrent) {
        active += 1
        return execute(task)
      }
      if (queue.length >= maxPending) {
        shedTotal += 1
        return SHED
      }
      const admitted = await new Promise<boolean>((resolve) => {
        const waiter: Waiter = {
          admit: () => resolve(true),
          timer: setTimeout(() => {
            const index = queue.indexOf(waiter)
            if (index !== -1) {
              queue.splice(index, 1)
            }
            resolve(false)
          }, pendingTimeoutMs),
        }
        queue.push(waiter)
      })
      if (!admitted) {
        shedTotal += 1
        return SHED
      }
      // releaseSlot already took the slot (active was incremented on handoff).
      return execute(task)
    },
    stats() {
      return { active, pending: queue.length, shedTotal }
    },
  }
}
