import { createHashcashWorkerChannel } from '@universe/sessions/src/challenge-solvers/hashcash/worker/createHashcashWorkerChannel.web'
import { HashcashWorkerBootError } from '@universe/sessions/src/challenge-solvers/hashcash/worker/hashcashWorkerErrors'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `bidc`'s `createChannel(worker)` is the transport layer we wrap. In these
 * tests we only exercise the error-propagation and worker-reset behavior the
 * channel factory owns, so we stub `bidc` with a minimal fake.
 */
vi.mock('bidc', () => ({
  createChannel: (_worker: Worker) => ({
    send: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves — simulates worker hang
    onMessage: vi.fn(),
  }),
}))

/**
 * Minimal fake Worker that:
 * - records event listeners so tests can dispatch `error` / `messageerror` events
 * - implements `terminate` so the channel's cleanup path works
 */
class FakeWorker {
  private listeners = new Map<string, Array<(event: Event) => void>>()
  terminateCalled = 0

  addEventListener(type: string, handler: (event: Event) => void): void {
    const existing = this.listeners.get(type) ?? []
    existing.push(handler)
    this.listeners.set(type, existing)
  }

  removeEventListener(type: string, handler: (event: Event) => void): void {
    const existing = this.listeners.get(type) ?? []
    this.listeners.set(
      type,
      existing.filter((h) => h !== handler),
    )
  }

  terminate(): void {
    this.terminateCalled++
  }

  dispatchEvent(type: string, event: Event): void {
    for (const handler of this.listeners.get(type) ?? []) {
      handler(event)
    }
  }

  // Unused but required by Worker typing
  postMessage = vi.fn()
  onmessage = null
  onmessageerror = null
  onerror = null
}

describe('createHashcashWorkerChannel (web) — worker error propagation', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('rejects pending findProof when the worker emits an error event', async () => {
    const worker = new FakeWorker()
    const onWorkerError = vi.fn()
    const channel = createHashcashWorkerChannel({
      getWorker: () => worker as unknown as Worker,
      onWorkerError,
    })

    const solve = channel.api.findProof({
      challenge: {
        difficulty: 1,
        subject: 'test',
        algorithm: 'sha256',
        nonce: 'abc',
        max_proof_length: 100,
      },
    })

    // Simulate the `importScripts` NetworkError we saw in Medha's session
    const errorEvent = new Event('error') as ErrorEvent
    Object.defineProperty(errorEvent, 'message', { value: 'Failed to execute importScripts' })
    worker.dispatchEvent('error', errorEvent)

    await expect(solve).rejects.toBeInstanceOf(HashcashWorkerBootError)
    await expect(solve).rejects.toMatchObject({ message: expect.stringContaining('importScripts') })
    expect(onWorkerError).toHaveBeenCalledOnce()
    expect(onWorkerError.mock.calls[0]![0]).toBeInstanceOf(HashcashWorkerBootError)

    channel.terminate()
  })

  it('rejects pending findProof when the worker emits messageerror', async () => {
    const worker = new FakeWorker()
    const channel = createHashcashWorkerChannel({
      getWorker: () => worker as unknown as Worker,
    })

    const solve = channel.api.findProof({
      challenge: { difficulty: 1, subject: 'test', algorithm: 'sha256', nonce: 'abc', max_proof_length: 100 },
    })

    worker.dispatchEvent('messageerror', new Event('messageerror'))

    await expect(solve).rejects.toBeInstanceOf(HashcashWorkerBootError)
    channel.terminate()
  })

  it('recovers on subsequent channel creation after a dead worker is reset', async () => {
    const worker1 = new FakeWorker()
    const worker2 = new FakeWorker()
    let callCount = 0
    const getWorker = (): Worker => {
      callCount++
      return (callCount === 1 ? worker1 : worker2) as unknown as Worker
    }

    // First channel: simulate boot failure.
    const c1 = createHashcashWorkerChannel({ getWorker })
    const failingSolve = c1.api.findProof({
      challenge: { difficulty: 1, subject: 'test', algorithm: 'sha256', nonce: 'abc', max_proof_length: 100 },
    })
    worker1.dispatchEvent('error', new Event('error') as ErrorEvent)
    await expect(failingSolve).rejects.toBeInstanceOf(HashcashWorkerBootError)

    // Second channel: must use a fresh worker (worker2), not the poisoned worker1.
    const c2 = createHashcashWorkerChannel({ getWorker })
    expect(callCount).toBe(2)
    expect(worker2.terminateCalled).toBe(0)
    c2.terminate()
  })
})
