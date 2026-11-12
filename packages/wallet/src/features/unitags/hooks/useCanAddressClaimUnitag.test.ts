import { SharedQueryClient } from '@universe/api'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { getUnitagsClaimEligibilityQueryOptions } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsClaimEligibilityQuery'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'
import type { Mock } from 'vitest'
import {
  useCanAddressClaimUnitag,
  useResolveCanAddressClaimUnitag,
} from 'wallet/src/features/unitags/hooks/useCanAddressClaimUnitag'
import { act, renderHook, waitFor } from 'wallet/src/test/test-utils'

vi.mock('utilities/src/device/uniqueId', () => ({
  getUniqueId: vi.fn().mockResolvedValue('device-id'),
}))

// Mock only the network leg; the real query-options factory stays in play so a cache-key split
// between warm and resolve is observable.
vi.mock('uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient', () => ({
  unitagsApiClient: {
    fetchClaimEligibility: vi.fn(),
  },
}))

const fetchClaimEligibilityMock = unitagsApiClient.fetchClaimEligibility as Mock

function respondWith(canClaim: boolean, delayMs = 0): void {
  fetchClaimEligibilityMock.mockImplementation(async () => {
    if (delayMs > 0) {
      await sleep(delayMs)
    }
    return { canClaim, errorCode: undefined }
  })
}

/** The cold-start shape: the request is in flight and no answer has arrived. */
function neverAnswer(): void {
  fetchClaimEligibilityMock.mockImplementation(() => new Promise(() => {}))
}

describe('useCanAddressClaimUnitag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
  })

  it('reports false while eligibility is still in flight', async () => {
    neverAnswer()

    const { result } = renderHook(() => useCanAddressClaimUnitag())

    await waitFor(() => expect(fetchClaimEligibilityMock).toHaveBeenCalled())
    expect(result.current.canClaimUnitag).toBe(false)
  })
})

describe('useResolveCanAddressClaimUnitag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
  })

  it('resolves true once eligibility answers, even though the mounted query is still pending', async () => {
    respondWith(true)

    const { result } = renderHook(() => useResolveCanAddressClaimUnitag())

    await expect(result.current()).resolves.toBe(true)
  })

  it('waits for a slow answer rather than reporting the not-yet-answered value', async () => {
    respondWith(true, 50)

    const { result } = renderHook(() => useResolveCanAddressClaimUnitag())

    await expect(result.current()).resolves.toBe(true)
  })

  it('resolves false when the device is genuinely ineligible', async () => {
    respondWith(false)

    const { result } = renderHook(() => useResolveCanAddressClaimUnitag())

    await expect(result.current()).resolves.toBe(false)
  })

  it('warms the eligibility query with the resolved device id', async () => {
    respondWith(true)

    renderHook(() => useResolveCanAddressClaimUnitag('0xabc'))

    await waitFor(() =>
      expect(fetchClaimEligibilityMock).toHaveBeenCalledWith({ address: '0xabc', deviceId: 'device-id' }),
    )
  })

  it('resolves off the warmed cache entry instead of issuing a second request', async () => {
    respondWith(true)

    const { result } = renderHook(() => useResolveCanAddressClaimUnitag('0xabc'))

    // Let the on-mount warm issue its request before pressing.
    await waitFor(() => expect(fetchClaimEligibilityMock).toHaveBeenCalledTimes(1))

    await expect(result.current()).resolves.toBe(true)

    // If warm and resolve ever key differently, this count goes to 2.
    expect(fetchClaimEligibilityMock).toHaveBeenCalledTimes(1)
  })

  it('waits for a fresh answer instead of returning stale persisted eligibility', async () => {
    SharedQueryClient.setQueryData(
      getUnitagsClaimEligibilityQueryOptions({ address: '0xabc', deviceId: 'device-id' }).queryKey,
      { canClaim: false, errorCode: undefined },
      { updatedAt: Date.now() - 3 * ONE_MINUTE_MS },
    )
    respondWith(true, 50)

    const { result } = renderHook(() => useResolveCanAddressClaimUnitag('0xabc'))

    await expect(result.current()).resolves.toBe(true)
    expect(fetchClaimEligibilityMock).toHaveBeenCalledTimes(1)
  })

  it('cancels an in-flight answer so the next resolve starts a new request', async () => {
    fetchClaimEligibilityMock
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce({ canClaim: true, errorCode: undefined })

    const { result } = renderHook(() => useResolveCanAddressClaimUnitag('0xabc'))
    const queryKey = getUnitagsClaimEligibilityQueryOptions({
      address: '0xabc',
      deviceId: 'device-id',
    }).queryKey

    await waitFor(() => expect(fetchClaimEligibilityMock).toHaveBeenCalledTimes(1))

    const controller = new AbortController()
    const abandonedResolution = result.current(controller.signal)
    await Promise.resolve()
    await act(async () => {
      controller.abort()
      await expect(abandonedResolution).rejects.toBeDefined()
    })
    await waitFor(() => expect(SharedQueryClient.getQueryState(queryKey)?.fetchStatus).toBe('idle'))
    await expect(result.current()).resolves.toBe(true)
    expect(fetchClaimEligibilityMock).toHaveBeenCalledTimes(2)
  })
})
