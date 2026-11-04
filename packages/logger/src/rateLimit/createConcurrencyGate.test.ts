import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConcurrencyGate, SHED } from './createConcurrencyGate'

interface Deferred {
  promise: Promise<string>
  resolve: (value: string) => void
  reject: (error: Error) => void
}

function deferred(): Deferred {
  let resolve!: (value: string) => void
  let reject!: (error: Error) => void
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Lets queued microtasks (admissions, finally blocks) run. */
async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe('createConcurrencyGate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs tasks immediately while under maxConcurrent', async () => {
    const gate = createConcurrencyGate({ maxConcurrent: 2, maxPending: 0, pendingTimeoutMs: 1000 })
    const a = deferred()
    const b = deferred()
    const ra = gate.run(() => a.promise)
    const rb = gate.run(() => b.promise)
    expect(gate.stats()).toMatchObject({ active: 2, pending: 0 })

    a.resolve('a')
    b.resolve('b')
    await expect(ra).resolves.toBe('a')
    await expect(rb).resolves.toBe('b')
    expect(gate.stats()).toMatchObject({ active: 0, pending: 0, shedTotal: 0 })
  })

  it('queues beyond maxConcurrent and admits FIFO as slots free', async () => {
    const gate = createConcurrencyGate({ maxConcurrent: 1, maxPending: 2, pendingTimeoutMs: 10_000 })
    const first = deferred()
    const started: string[] = []
    const r1 = gate.run(() => first.promise)
    const r2 = gate.run(async () => {
      started.push('second')
      return 'second'
    })
    const r3 = gate.run(async () => {
      started.push('third')
      return 'third'
    })
    expect(gate.stats()).toMatchObject({ active: 1, pending: 2 })
    expect(started).toEqual([])

    first.resolve('first')
    await expect(r1).resolves.toBe('first')
    await flush()
    expect(started).toEqual(['second', 'third'])
    await expect(r2).resolves.toBe('second')
    await expect(r3).resolves.toBe('third')
  })

  it('sheds immediately once the queue is full, without running the task', async () => {
    const gate = createConcurrencyGate({ maxConcurrent: 1, maxPending: 1, pendingTimeoutMs: 1000 })
    const blocker = deferred()
    void gate.run(() => blocker.promise)
    void gate.run(async () => 'queued')

    const render = vi.fn(async () => 'never')
    await expect(gate.run(render)).resolves.toBe(SHED)
    expect(render).not.toHaveBeenCalled()
    expect(gate.stats().shedTotal).toBe(1)
    blocker.resolve('done')
  })

  it('sheds a queued task when its wait exceeds pendingTimeoutMs', async () => {
    const gate = createConcurrencyGate({ maxConcurrent: 1, maxPending: 1, pendingTimeoutMs: 1000 })
    const blocker = deferred()
    void gate.run(() => blocker.promise)
    const render = vi.fn(async () => 'never')
    const queued = gate.run(render)

    vi.advanceTimersByTime(1001)
    await expect(queued).resolves.toBe(SHED)
    expect(render).not.toHaveBeenCalled()
    expect(gate.stats()).toMatchObject({ pending: 0, shedTotal: 1 })

    // The slot itself is untouched — the next release admits normally.
    blocker.resolve('done')
    await flush()
    await expect(gate.run(async () => 'after')).resolves.toBe('after')
  })

  it('frees the slot when a task rejects, and rethrows to the caller', async () => {
    const gate = createConcurrencyGate({ maxConcurrent: 1, maxPending: 1, pendingTimeoutMs: 1000 })
    const failing = gate.run(async () => {
      throw new Error('render exploded')
    })
    const queued = gate.run(async () => 'recovered')

    await expect(failing).rejects.toThrow('render exploded')
    await expect(queued).resolves.toBe('recovered')
    expect(gate.stats()).toMatchObject({ active: 0, pending: 0 })
  })

  it('never over-admits when many tasks settle at once', async () => {
    const gate = createConcurrencyGate({ maxConcurrent: 2, maxPending: 10, pendingTimeoutMs: 10_000 })
    const blockers = [deferred(), deferred()]
    void gate.run(() => blockers[0]!.promise)
    void gate.run(() => blockers[1]!.promise)

    let peak = 0
    const observed: Array<Promise<unknown>> = []
    for (let i = 0; i < 6; i += 1) {
      observed.push(
        gate.run(async () => {
          peak = Math.max(peak, gate.stats().active)
          await Promise.resolve()
          return i
        }),
      )
    }
    blockers[0]!.resolve('a')
    blockers[1]!.resolve('b')
    await Promise.all(observed)
    expect(peak).toBeLessThanOrEqual(2)
  })
})
