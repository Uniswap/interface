import { FeatureFlags } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  AVERAGE_L1_BLOCK_TIME_MS,
  AVERAGE_L2_BLOCK_TIME_MS,
  MIN_QUOTE_POLL_INTERVAL_MS,
  getRandomPollIntervalMs,
  usePollingIntervalByChain,
  useQuoteRefetchIntervalForChain,
} from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { renderHook } from 'uniswap/src/test/test-utils'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import type { Mock } from 'vitest'

const { mockUseFeatureFlag, mockUseDynamicConfigValue } = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseDynamicConfigValue: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: mockUseFeatureFlag,
    useDynamicConfigValue: mockUseDynamicConfigValue,
  }
})

beforeEach(() => {
  ;(mockUseFeatureFlag as Mock).mockReset()
  ;(mockUseFeatureFlag as Mock).mockReturnValue(false)
  ;(mockUseDynamicConfigValue as Mock).mockReset()
  ;(mockUseDynamicConfigValue as Mock).mockImplementation(
    ({ defaultValue }: { config: unknown; key: unknown; defaultValue: unknown }) => defaultValue,
  )
})

describe('getRandomPollIntervalMs', () => {
  it('returns a value within the inclusive [min, max] range', () => {
    const min = 1000
    const max = 12000
    for (let i = 0; i < 200; i++) {
      const value = getRandomPollIntervalMs(min, max)
      expect(value).toBeGreaterThanOrEqual(min)
      expect(value).toBeLessThanOrEqual(max)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('returns min when max <= min', () => {
    expect(getRandomPollIntervalMs(5000, 5000)).toBe(5000)
    expect(getRandomPollIntervalMs(5000, 4000)).toBe(5000)
  })

  it('honors the boundary values', () => {
    const randomSpy = vi.spyOn(Math, 'random')

    randomSpy.mockReturnValueOnce(0)
    expect(getRandomPollIntervalMs(1000, 12000)).toBe(1000)

    // Math.random() never returns 1, but the closest value should still map to max.
    randomSpy.mockReturnValueOnce(0.9999999999)
    expect(getRandomPollIntervalMs(1000, 12000)).toBe(12000)

    randomSpy.mockRestore()
  })
})

describe('usePollingIntervalByChain', () => {
  it('returns the L1 block time for mainnet by default', () => {
    const { result } = renderHook(() => usePollingIntervalByChain(UniverseChainId.Mainnet))
    expect(result.current).toBe(AVERAGE_L1_BLOCK_TIME_MS)
  })

  it('returns the L2 block time for non-mainnet chains by default', () => {
    const { result } = renderHook(() => usePollingIntervalByChain(UniverseChainId.ArbitrumOne))
    expect(result.current).toBe(AVERAGE_L2_BLOCK_TIME_MS)
  })

  it('returns 2s for L2s when TwoSecondSwapQuotePollingInterval is enabled', () => {
    ;(mockUseFeatureFlag as Mock).mockImplementation(
      (flag: FeatureFlags) => flag === FeatureFlags.TwoSecondSwapQuotePollingInterval,
    )

    const { result } = renderHook(() => usePollingIntervalByChain(UniverseChainId.ArbitrumOne))
    expect(result.current).toBe(2 * ONE_SECOND_MS)
  })

  it('does not apply the 2s L2 override to mainnet', () => {
    ;(mockUseFeatureFlag as Mock).mockImplementation(
      (flag: FeatureFlags) => flag === FeatureFlags.TwoSecondSwapQuotePollingInterval,
    )

    const { result } = renderHook(() => usePollingIntervalByChain(UniverseChainId.Mainnet))
    expect(result.current).toBe(AVERAGE_L1_BLOCK_TIME_MS)
  })
})

describe('useQuoteRefetchIntervalForChain', () => {
  it('returns the fixed L1 polling interval for mainnet when randomization is disabled', () => {
    const { result } = renderHook(() => useQuoteRefetchIntervalForChain(UniverseChainId.Mainnet))
    expect(result.current).toBe(AVERAGE_L1_BLOCK_TIME_MS)
  })

  it('returns the fixed L2 polling interval for non-mainnet chains when randomization is disabled', () => {
    const { result } = renderHook(() => useQuoteRefetchIntervalForChain(UniverseChainId.ArbitrumOne))
    expect(result.current).toBe(AVERAGE_L2_BLOCK_TIME_MS)
  })

  it('returns a function producing randomized intervals for mainnet when the flag is enabled', () => {
    ;(mockUseFeatureFlag as Mock).mockImplementation(
      (flag: FeatureFlags) => flag === FeatureFlags.RandomizeQuotePolling,
    )

    const { result } = renderHook(() => useQuoteRefetchIntervalForChain(UniverseChainId.Mainnet))
    const refetchInterval = result.current
    expect(typeof refetchInterval).toBe('function')

    if (typeof refetchInterval !== 'function') {
      throw new Error('expected refetchInterval to be a function')
    }

    const seen = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const value = refetchInterval()
      expect(value).toBeGreaterThanOrEqual(MIN_QUOTE_POLL_INTERVAL_MS)
      expect(value).toBeLessThanOrEqual(AVERAGE_L1_BLOCK_TIME_MS)
      seen.add(value)
    }
    // Sanity check: the function returns more than one distinct value across many calls.
    expect(seen.size).toBeGreaterThan(1)
  })

  it('returns a function producing randomized intervals for non-mainnet chains when the flag is enabled', () => {
    ;(mockUseFeatureFlag as Mock).mockImplementation(
      (flag: FeatureFlags) => flag === FeatureFlags.RandomizeQuotePolling,
    )

    // Tempo/Base/Avalanche all share the L2 default of AVERAGE_L2_BLOCK_TIME_MS;
    // pick one representative L2 chain for coverage. RFQ is rolling out across
    // these chains so randomization is no longer mainnet-only.
    const { result } = renderHook(() => useQuoteRefetchIntervalForChain(UniverseChainId.Base))
    const refetchInterval = result.current
    expect(typeof refetchInterval).toBe('function')

    if (typeof refetchInterval !== 'function') {
      throw new Error('expected refetchInterval to be a function')
    }

    for (let i = 0; i < 100; i++) {
      const value = refetchInterval()
      expect(value).toBeGreaterThanOrEqual(MIN_QUOTE_POLL_INTERVAL_MS)
      expect(value).toBeLessThanOrEqual(AVERAGE_L2_BLOCK_TIME_MS)
    }
  })

  it('returns a stable function reference across renders for the same chain', () => {
    ;(mockUseFeatureFlag as Mock).mockImplementation(
      (flag: FeatureFlags) => flag === FeatureFlags.RandomizeQuotePolling,
    )

    const { result, rerender } = renderHook(() => useQuoteRefetchIntervalForChain(UniverseChainId.Mainnet))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
