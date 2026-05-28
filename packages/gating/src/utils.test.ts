import { getStatsigClient } from '@universe/gating/src/sdk/statsig'
import { waitForStatsigReady } from '@universe/gating/src/utils'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('@universe/gating/src/sdk/statsig', () => ({
  getStatsigClient: vi.fn(),
  getOverrideAdapter: vi.fn(),
}))

type EventHandler = (event: { status: string }) => void

function createMockClient(loadingStatus: string): {
  loadingStatus: string
  on: Mock
  off: Mock
} {
  return {
    loadingStatus,
    on: vi.fn(),
    off: vi.fn(),
  }
}

describe('waitForStatsigReady', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('resolves immediately when client is already Ready', async () => {
    const client = createMockClient('Ready')
    vi.mocked(getStatsigClient).mockReturnValue(client as unknown as ReturnType<typeof getStatsigClient>)

    await waitForStatsigReady()

    expect(client.on).not.toHaveBeenCalled()
  })

  it('resolves when values_updated fires with Ready status', async () => {
    const client = createMockClient('Loading')
    vi.mocked(getStatsigClient).mockReturnValue(client as unknown as ReturnType<typeof getStatsigClient>)

    const promise = waitForStatsigReady()

    // Capture the handler registered via client.on
    expect(client.on).toHaveBeenCalledWith('values_updated', expect.any(Function))
    const handler = client.on.mock.calls[0][1] as EventHandler

    // Fire the event
    handler({ status: 'Ready' })

    await promise

    // Should have cleaned up the listener
    expect(client.off).toHaveBeenCalledWith('values_updated', handler)
  })

  it('ignores non-Ready status updates', async () => {
    const client = createMockClient('Loading')
    vi.mocked(getStatsigClient).mockReturnValue(client as unknown as ReturnType<typeof getStatsigClient>)

    const promise = waitForStatsigReady()

    const handler = client.on.mock.calls[0][1] as EventHandler

    // Fire a non-Ready event — should not resolve
    handler({ status: 'Loading' })

    // Verify promise hasn't resolved by racing it against a known value
    const result = await Promise.race([promise.then(() => 'resolved'), Promise.resolve('pending')])
    expect(result).toBe('pending')

    // Now fire Ready to clean up
    handler({ status: 'Ready' })
    await promise
  })

  it('resolves on timeout and cleans up listener', async () => {
    const client = createMockClient('Loading')
    vi.mocked(getStatsigClient).mockReturnValue(client as unknown as ReturnType<typeof getStatsigClient>)

    const promise = waitForStatsigReady(1000)

    const handler = client.on.mock.calls[0][1] as EventHandler

    // Advance past timeout
    vi.advanceTimersByTime(1000)

    await promise

    // Should have removed the listener on timeout
    expect(client.off).toHaveBeenCalledWith('values_updated', handler)
  })

  it('handles race condition when client becomes Ready between check and subscribe', async () => {
    const client = createMockClient('Loading')
    // Simulate race: loadingStatus changes to Ready when on() is called
    client.on.mockImplementation(() => {
      client.loadingStatus = 'Ready'
    })
    vi.mocked(getStatsigClient).mockReturnValue(client as unknown as ReturnType<typeof getStatsigClient>)

    await waitForStatsigReady()

    // Should have cleaned up both the timer and listener
    expect(client.off).toHaveBeenCalledWith('values_updated', expect.any(Function))
  })
})
