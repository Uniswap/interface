import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSystemAlertsDataSource } from '~/notification-service/data-sources/createSystemAlertsDataSource'

const mockGetDynamicConfigValue = vi.hoisted(() => vi.fn((): UniverseChainId | undefined => undefined))
const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()

  return {
    ...actual,
    getDynamicConfigValue: mockGetDynamicConfigValue,
  }
})

vi.mock('uniswap/src/i18n', () => ({
  default: {
    t: (key: string): string => key,
  },
}))

vi.mock('utilities/src/logger/logger', () => ({
  getLogger: () => mockLogger,
}))

const MAINNET_WARNING_MS = 10 * 60 * 1000
const POLL_INTERVAL_MS = 5000
const VISIBILITY_SETTLING_MS = 10000
const SYSTEM_ALERTS_SOURCE = 'system_alerts'

describe('createSystemAlertsDataSource', () => {
  let stalenessCheckTime: number
  let wallClockTime: number
  let blockTimestamp: bigint | undefined
  let blockTimestampUpdatedAt: number
  let isDocumentVisible: boolean
  let pathname: string
  let visibilityChangeListener: (() => void) | undefined

  beforeEach(() => {
    mockGetDynamicConfigValue.mockReturnValue(undefined)
    vi.useFakeTimers()
    stalenessCheckTime = Date.UTC(2026, 0, 1, 12)
    wallClockTime = stalenessCheckTime
    blockTimestamp = BigInt(Math.floor((stalenessCheckTime - MAINNET_WARNING_MS - 1000) / 1000))
    blockTimestampUpdatedAt = stalenessCheckTime
    isDocumentVisible = true
    pathname = '/swap'
    visibilityChangeListener = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  function createDataSource(): ReturnType<typeof createSystemAlertsDataSource> {
    return createSystemAlertsDataSource({
      getSwapInputChainId: () => UniverseChainId.Mainnet,
      getBlockTimestamp: () => blockTimestamp,
      getBlockTimestampUpdatedAt: () => blockTimestampUpdatedAt,
      getStalenessCheckTimeMs: () => stalenessCheckTime,
      getPathname: () => pathname,
      getIsDocumentVisible: () => isDocumentVisible,
      getWallClockTimeMs: () => wallClockTime,
      subscribeToVisibilityChange: (listener) => {
        visibilityChangeListener = listener
        return () => {
          visibilityChangeListener = undefined
        }
      },
      visibilitySettlingMs: VISIBILITY_SETTLING_MS,
      pollIntervalMs: POLL_INTERVAL_MS,
    })
  }

  it('shows the chain connectivity banner when a freshly fetched block timestamp is stale', async () => {
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:chain_connectivity:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('releases the chain connectivity banner suppression when the block timestamp refreshes after refocus', async () => {
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    isDocumentVisible = true
    visibilityChangeListener?.()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(onNotifications).not.toHaveBeenCalled()

    wallClockTime += POLL_INTERVAL_MS
    stalenessCheckTime = wallClockTime
    blockTimestamp = BigInt(Math.floor((stalenessCheckTime - MAINNET_WARNING_MS - 1000) / 1000))
    blockTimestampUpdatedAt = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:chain_connectivity:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('shows the chain connectivity banner when refocus settling expires without a block timestamp refresh', async () => {
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime

    isDocumentVisible = true
    visibilityChangeListener?.()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(onNotifications).not.toHaveBeenCalled()

    wallClockTime += VISIBILITY_SETTLING_MS + 1
    stalenessCheckTime = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:chain_connectivity:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('suppresses the chain connectivity banner after a large visible poll gap until the timestamp refreshes', async () => {
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).not.toHaveBeenCalled()

    wallClockTime += POLL_INTERVAL_MS
    stalenessCheckTime = wallClockTime
    blockTimestamp = BigInt(Math.floor((stalenessCheckTime - MAINNET_WARNING_MS - 1000) / 1000))
    blockTimestampUpdatedAt = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:chain_connectivity:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('restarts the chain connectivity banner suppression when a large poll gap occurs during settling', async () => {
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime

    isDocumentVisible = true
    visibilityChangeListener?.()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(onNotifications).not.toHaveBeenCalled()

    wallClockTime += VISIBILITY_SETTLING_MS + POLL_INTERVAL_MS + 1
    stalenessCheckTime = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).not.toHaveBeenCalled()

    await dataSource.stop()
  })

  it('preserves the listener-captured visibility timestamp when the first visible poll detects a large gap', async () => {
    // Regression test: the first visible poll after a long-hidden period sees a large poll gap
    // because hidden polls don't advance lastPollTimeMs. The controller must not overwrite the
    // visibilitychange-listener-captured visibleSinceMs in that case, otherwise a wagmi refetch
    // that landed between the listener event and the first poll would be missed.
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime

    // Listener fires on refocus — captures visibleSinceMs at this exact wall-clock time.
    isDocumentVisible = true
    visibilityChangeListener?.()

    // wagmi refetches shortly after the listener event, but BEFORE the first visible poll.
    // Block is still chain-stale, just freshly fetched.
    wallClockTime += 500
    stalenessCheckTime = wallClockTime
    blockTimestampUpdatedAt = wallClockTime
    blockTimestamp = BigInt(Math.floor((stalenessCheckTime - MAINNET_WARNING_MS - 1000) / 1000))

    // First visible poll fires a bit later — still inside the 10s settling window.
    wallClockTime += 1500
    stalenessCheckTime = wallClockTime
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    // Because the refetch happened AFTER the listener-captured visibleSinceMs, settling
    // should be released and the chain-connectivity banner should fire on this poll.
    // If the controller had overwritten visibleSinceMs to the first-poll time (the bug),
    // suppression would remain in effect and onNotifications would not be called yet.
    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:chain_connectivity:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('does not require a hidden poll before suppressing stale cached block timestamps after refocus', async () => {
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime

    isDocumentVisible = true
    visibilityChangeListener?.()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).not.toHaveBeenCalled()

    await dataSource.stop()
  })

  it('shows the chain connectivity banner when the page stays visible and the timestamp cannot refresh', async () => {
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    for (let elapsedMs = 0; elapsedMs <= MAINNET_WARNING_MS + 1000; elapsedMs += POLL_INTERVAL_MS) {
      wallClockTime += POLL_INTERVAL_MS
      stalenessCheckTime = wallClockTime
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    }

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:chain_connectivity:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('allows outage alerts when a visible poll observes refocus before the visibility listener runs', async () => {
    pathname = '/explore'
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime
    mockGetDynamicConfigValue.mockReturnValue(UniverseChainId.Mainnet)

    isDocumentVisible = true
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:outage:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('allows outage alerts during the visibility settling window', async () => {
    pathname = '/explore'
    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).not.toHaveBeenCalled()

    isDocumentVisible = false
    visibilityChangeListener?.()
    wallClockTime += MAINNET_WARNING_MS + 1000
    stalenessCheckTime = wallClockTime
    mockGetDynamicConfigValue.mockReturnValue(UniverseChainId.Mainnet)

    isDocumentVisible = true
    visibilityChangeListener?.()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).toHaveBeenCalledWith(
      [expect.objectContaining({ id: `local:session:outage:${UniverseChainId.Mainnet}` })],
      SYSTEM_ALERTS_SOURCE,
    )

    await dataSource.stop()
  })

  it('clears the system alert source when the active alert condition goes away', async () => {
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    expect(onNotifications).toHaveBeenCalledTimes(1)

    blockTimestamp = BigInt(Math.floor(stalenessCheckTime / 1000))
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).toHaveBeenLastCalledWith([], SYSTEM_ALERTS_SOURCE)

    await dataSource.stop()
  })

  it('does not evaluate alerts while the document is hidden', async () => {
    isDocumentVisible = false
    const onNotifications = vi.fn()
    const dataSource = createDataSource()

    dataSource.start(onNotifications)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(onNotifications).not.toHaveBeenCalled()

    await dataSource.stop()
  })
})
