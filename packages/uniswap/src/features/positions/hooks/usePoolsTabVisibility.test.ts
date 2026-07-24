import { renderHook } from '@testing-library/react'
import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { usePoolsTabVisibility } from 'uniswap/src/features/positions/hooks/usePoolsTabVisibility'

const { mockUseFeatureFlag, mockUsePortfolioBalancePart, mockUseWalletPositions, mockGetFeatureFlag } = vi.hoisted(
  () => ({
    mockUseFeatureFlag: vi.fn(),
    mockUsePortfolioBalancePart: vi.fn(),
    mockUseWalletPositions: vi.fn(),
    mockGetFeatureFlag: vi.fn(),
  }),
)

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
  // Visibility reads the flag via the exposure-disabled variant; the exposure itself is logged
  // separately via getFeatureFlag (spied to assert it fires only once the tab is visible).
  useFeatureFlagWithExposureLoggingDisabled: mockUseFeatureFlag,
  getFeatureFlag: mockGetFeatureFlag,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [1] }),
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/balances/balancesRest')>()),
  usePortfolioBalancePart: mockUsePortfolioBalancePart,
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/positions/hooks/useWalletPositions')>()),
  useWalletPositions: mockUseWalletPositions,
}))

// Minimal position shape — the hook only reads `status` and the array lengths.
const position = (status: PositionStatus = PositionStatus.IN_RANGE): { status: PositionStatus } => ({ status })

const positionsResult = (overrides: {
  positions?: unknown[]
  hiddenPositions?: unknown[]
  error?: unknown
}): { positions: unknown[]; hiddenPositions: unknown[]; error: unknown } => ({
  positions: overrides.positions ?? [],
  hiddenPositions: overrides.hiddenPositions ?? [],
  error: overrides.error ?? null,
})

describe('usePoolsTabVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(true)
    mockUsePortfolioBalancePart.mockReturnValue({ data: undefined })
    mockUseWalletPositions.mockReturnValue(positionsResult({}))
  })

  it('hides the tab when the feature flag is disabled, even if positions exist', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseWalletPositions.mockReturnValue(positionsResult({ positions: [position()] }))

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(false)
  })

  it('shows the tab when the balances pools count is positive', () => {
    mockUsePortfolioBalancePart.mockReturnValue({ data: { count: 2 } })

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(true)
  })

  it('shows the tab when visible positions exist', () => {
    mockUseWalletPositions.mockReturnValue(positionsResult({ positions: [position()] }))

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(true)
  })

  it('shows the tab when only hidden positions exist', () => {
    mockUseWalletPositions.mockReturnValue(positionsResult({ hiddenPositions: [position(PositionStatus.CLOSED)] }))

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(true)
  })

  it('shows the tab when the positions query errors', () => {
    mockUseWalletPositions.mockReturnValue(positionsResult({ error: new Error('boom') }))

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(true)
  })

  it('hides the tab when enabled but there is no count, positions, or error', () => {
    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(false)
  })

  it('counts only visible open positions for openPoolPositionsCount', () => {
    mockUseWalletPositions.mockReturnValue(
      positionsResult({
        positions: [
          position(PositionStatus.IN_RANGE),
          position(PositionStatus.OUT_OF_RANGE),
          position(PositionStatus.CLOSED),
        ],
        hiddenPositions: [position(PositionStatus.IN_RANGE)],
      }),
    )

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.openPoolPositionsCount).toBe(2)
  })

  it('logs an exposure only once the Pools tab becomes visible', () => {
    // Flag on but no count/positions/error -> tab hidden -> no exposure.
    const { rerender } = renderHook(() => usePoolsTabVisibility('0xabc'))
    expect(mockGetFeatureFlag).not.toHaveBeenCalled()

    // Positions arrive -> tab becomes visible -> exposure logged.
    mockUsePortfolioBalancePart.mockReturnValue({ data: { count: 1 } })
    rerender()
    expect(mockGetFeatureFlag).toHaveBeenCalled()
  })
})
