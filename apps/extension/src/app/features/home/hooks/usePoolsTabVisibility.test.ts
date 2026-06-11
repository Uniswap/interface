import { renderHook } from '@testing-library/react'
import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { usePoolsTabVisibility } from 'src/app/features/home/hooks/usePoolsTabVisibility'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useFeatureFlag: jest.fn(),
}))

jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [1] }),
}))

jest.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioBalancePart: jest.fn(),
}))

jest.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: jest.fn(),
}))

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>
const mockUsePortfolioBalancePart = usePortfolioBalancePart as jest.MockedFunction<typeof usePortfolioBalancePart>
const mockUseWalletPositions = useWalletPositions as jest.MockedFunction<typeof useWalletPositions>

// Minimal position shape — the hook only reads `status` and the array lengths.
const position = (status: PositionStatus = PositionStatus.IN_RANGE): never => ({ status }) as never

const positionsResult = (overrides: {
  positions?: unknown[]
  hiddenPositions?: unknown[]
  error?: unknown
}): ReturnType<typeof useWalletPositions> =>
  ({
    positions: overrides.positions ?? [],
    hiddenPositions: overrides.hiddenPositions ?? [],
    error: overrides.error ?? null,
  }) as unknown as ReturnType<typeof useWalletPositions>

describe('usePoolsTabVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(true)
    mockUsePortfolioBalancePart.mockReturnValue({ data: undefined } as never)
    mockUseWalletPositions.mockReturnValue(positionsResult({}))
  })

  it('hides the tab when the feature flag is disabled, even if positions exist', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseWalletPositions.mockReturnValue(positionsResult({ positions: [position()] }))

    const { result } = renderHook(() => usePoolsTabVisibility('0xabc'))

    expect(result.current.shouldShowPoolsTab).toBe(false)
  })

  it('shows the tab when the balances pools count is positive', () => {
    mockUsePortfolioBalancePart.mockReturnValue({ data: { count: 2 } } as never)

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
})
