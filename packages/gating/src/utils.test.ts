import { getStatsigClient } from '@universe/gating/src/sdk/statsig'
import { isOverrideName, namedOverrideEntries, waitForStatsigReady } from '@universe/gating/src/utils'
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

function getValuesUpdatedHandler(client: { on: Mock }): EventHandler {
  const [firstCall] = client.on.mock.calls
  if (!firstCall) {
    throw new Error('expected waitForStatsigReady to register a values_updated listener')
  }
  return firstCall[1] as EventHandler
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
    const handler = getValuesUpdatedHandler(client)

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

    const handler = getValuesUpdatedHandler(client)

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

    const handler = getValuesUpdatedHandler(client)

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

describe('namedOverrideEntries', () => {
  it('drops the digits-only DJB2 mirror keys and keeps the named overrides', () => {
    expect(namedOverrideEntries({ gate_a: true, '1234567890': true, gate_b: false, '987654321': false })).toEqual([
      ['gate_a', true],
      ['gate_b', false],
    ])
  })

  it('keeps a name that merely starts with a digit', () => {
    expect(isOverrideName('1inch_gate')).toBe(true)
    expect(isOverrideName('42')).toBe(false)
    expect(namedOverrideEntries({ '1inch_gate': true, '42': true })).toEqual([['1inch_gate', true]])
  })

  it('is empty for an empty record', () => {
    expect(namedOverrideEntries({})).toEqual([])
  })
})
