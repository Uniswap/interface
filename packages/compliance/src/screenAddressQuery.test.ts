import {
  MutationObserver as QueryMutationObserver,
  onlineManager,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query'
import type { ComplianceV2Client } from '@universe/compliance/src/client'
import {
  fetchIsBlockedAddress,
  screenAddressMutationOptions,
  screenAddressQueryOptions,
} from '@universe/compliance/src/screenAddressQuery'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const screenAddress = vi.fn()
const client = { screenAddress } as unknown as ComplianceV2Client

const BLOCKED_ADDRESS = '0x7f367cc41522ce07553e823bf3be79a889debe1b'
const input = { address: BLOCKED_ADDRESS, chainId: 1 }

function newQueryClient(): QueryClient {
  return new QueryClient()
}

describe(fetchIsBlockedAddress, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports a blocked address', async () => {
    screenAddress.mockResolvedValue({ block: true })

    await expect(fetchIsBlockedAddress(input, { queryClient: newQueryClient(), client })).resolves.toBe(true)
  })

  it('reports a clean address', async () => {
    screenAddress.mockResolvedValue({ block: false })

    await expect(fetchIsBlockedAddress(input, { queryClient: newQueryClient(), client })).resolves.toBe(false)
  })

  it('skips the request with no address to screen', async () => {
    await expect(fetchIsBlockedAddress(undefined, { queryClient: newQueryClient(), client })).resolves.toBe(false)
    expect(screenAddress).not.toHaveBeenCalled()
  })

  it('fails open when the screen errors', async () => {
    screenAddress.mockRejectedValue(new Error('compliance unreachable'))

    await expect(fetchIsBlockedAddress(input, { queryClient: newQueryClient(), client })).resolves.toBe(false)
  })

  it('retries once before failing open, so a single blip does not lose the screen', async () => {
    screenAddress.mockRejectedValueOnce(new Error('transient')).mockResolvedValue({ block: true })

    await expect(fetchIsBlockedAddress(input, { queryClient: newQueryClient(), client })).resolves.toBe(true)
    expect(screenAddress).toHaveBeenCalledTimes(2)
  })

  it('answers from a fresh cache entry without a request', async () => {
    const queryClient = newQueryClient()
    queryClient.setQueryData(screenAddressQueryOptions(client, input).queryKey, true)

    await expect(fetchIsBlockedAddress(input, { queryClient, client })).resolves.toBe(true)
    expect(screenAddress).not.toHaveBeenCalled()
  })

  // Losing a known block to a transient outage is strictly worse than answering stale:
  // a mounted `useIsBlockedAddress` goes on rendering the cached verdict either way, so
  // returning `false` here would disagree with the UI the user is looking at.
  it('keeps a cached block when refreshing it fails', async () => {
    screenAddress.mockRejectedValue(new Error('compliance unreachable'))
    const queryClient = newQueryClient()
    queryClient.setQueryData(screenAddressQueryOptions(client, input).queryKey, true, {
      updatedAt: Date.now() - 10 * ONE_MINUTE_MS,
    })

    await expect(fetchIsBlockedAddress(input, { queryClient, client })).resolves.toBe(true)
    expect(screenAddress).toHaveBeenCalled()
  })

  it('still fails open when the screen errors with nothing cached', async () => {
    screenAddress.mockRejectedValue(new Error('compliance unreachable'))
    const queryClient = newQueryClient()

    await expect(fetchIsBlockedAddress(input, { queryClient, client })).resolves.toBe(false)
  })

  it('refetches a stale cache entry', async () => {
    screenAddress.mockResolvedValue({ block: true })
    const queryClient = newQueryClient()
    queryClient.setQueryData(screenAddressQueryOptions(client, input).queryKey, false, {
      updatedAt: Date.now() - 10 * ONE_MINUTE_MS,
    })

    await expect(fetchIsBlockedAddress(input, { queryClient, client })).resolves.toBe(true)
    expect(screenAddress).toHaveBeenCalledTimes(1)
  })
})

describe(screenAddressQueryOptions, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keys separate addresses apart and reuses one entry per address', () => {
    const other = { address: '0x0000000000000000000000000000000000000001', chainId: 1 }

    expect(screenAddressQueryOptions(client, input).queryKey).toEqual(
      screenAddressQueryOptions(client, { ...input }).queryKey,
    )
    expect(screenAddressQueryOptions(client, input).queryKey).not.toEqual(
      screenAddressQueryOptions(client, other).queryKey,
    )
  })

  it('does not fetch while disabled', async () => {
    const queryClient = newQueryClient()
    const observer = new QueryObserver(queryClient, { ...screenAddressQueryOptions(client, input), enabled: false })

    const unsubscribe = observer.subscribe(() => undefined)
    await Promise.resolve()

    expect(screenAddress).not.toHaveBeenCalled()
    unsubscribe()
  })

  // The web swap form relies on this: it stops screening at render but keeps reading the
  // verdict the press-time screen writes to the same entry.
  it('surfaces a press-time result to a disabled observer on the same key', async () => {
    screenAddress.mockResolvedValue({ block: true })
    const queryClient = newQueryClient()
    const observer = new QueryObserver(queryClient, { ...screenAddressQueryOptions(client, input), enabled: false })
    const unsubscribe = observer.subscribe(() => undefined)

    expect(observer.getCurrentResult().data).toBeUndefined()
    await fetchIsBlockedAddress(input, { queryClient, client })

    expect(observer.getCurrentResult().data).toBe(true)
    expect(screenAddress).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})

describe(screenAddressMutationOptions, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // `useMutation` defaults to `networkMode: 'online'` and the app QueryClient sets no
  // mutation defaults, so without the explicit mode an offline press parks until
  // reconnect — the button stays spinning, and the continuation fires long after the
  // user gave up. The query is already `'always'`, so the fetch underneath settles.
  it('settles an offline press instead of pausing until reconnect', async () => {
    screenAddress.mockResolvedValue({ block: true })
    const queryClient = newQueryClient()
    onlineManager.setOnline(false)

    try {
      const observer = new QueryMutationObserver(queryClient, screenAddressMutationOptions({ queryClient, client }))
      const settled = observer.mutate(input)

      expect(observer.getCurrentResult().isPaused).toBe(false)
      await expect(settled).resolves.toBe(true)
    } finally {
      onlineManager.setOnline(true)
    }
  })
})
