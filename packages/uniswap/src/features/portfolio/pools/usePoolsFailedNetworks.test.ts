import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { usePoolsFailedNetworks } from 'uniswap/src/features/portfolio/pools/usePoolsFailedNetworks'
import { renderHookWithProviders } from 'uniswap/src/test/render'

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioBalanceBreakdown: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

const ENABLED_CHAINS = [
  UniverseChainId.Mainnet,
  UniverseChainId.Base,
  UniverseChainId.Optimism,
  UniverseChainId.Polygon,
  UniverseChainId.ArbitrumOne,
]

function mockEnabledChains(chains: UniverseChainId[] = ENABLED_CHAINS): void {
  vi.mocked(useEnabledChains).mockReturnValue({ chains } as ReturnType<typeof useEnabledChains>)
}

function mockBreakdown({
  failedChainIds = [],
  poolsBalanceUSD,
  loaded = true,
}: {
  failedChainIds?: number[]
  poolsBalanceUSD?: number
  loaded?: boolean
}): void {
  vi.mocked(usePortfolioBalanceBreakdown).mockReturnValue({
    data: loaded ? { pools: { balanceUSD: poolsBalanceUSD }, failedChainIds } : undefined,
    requestedCategories: [WalletBalanceCategory.POOLS],
  } as ReturnType<typeof usePortfolioBalanceBreakdown>)
}

describe('usePoolsFailedNetworks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnabledChains()
  })

  it('is unresolved while the breakdown is still loading', () => {
    mockBreakdown({ loaded: false })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: true }))

    expect(result.current.hasResolved).toBe(false)
    expect(result.current.failedChainIds).toEqual([])
    expect(result.current.isPoolsUnavailable).toBe(false)
  })

  it('is resolved with failures once the breakdown returns failed chains', () => {
    mockBreakdown({ failedChainIds: [UniverseChainId.Mainnet] })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: true }))

    expect(result.current.hasResolved).toBe(true)
    expect(result.current.failedChainIds).toEqual([UniverseChainId.Mainnet])
  })

  it('is resolved with no failures when the breakdown returns an empty list', () => {
    mockBreakdown({ failedChainIds: [] })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: true }))

    expect(result.current.hasResolved).toBe(true)
    expect(result.current.failedChainIds).toEqual([])
  })

  it('drops failed chains that are not enabled or not supported', () => {
    mockEnabledChains([UniverseChainId.Mainnet])
    mockBreakdown({ failedChainIds: [UniverseChainId.Mainnet, UniverseChainId.Optimism, 99999999] })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: true }))

    expect(result.current.failedChainIds).toEqual([UniverseChainId.Mainnet])
  })

  it('reports pools unavailable when the pools balance is undefined', () => {
    mockBreakdown({ poolsBalanceUSD: undefined })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: true }))

    expect(result.current.isPoolsUnavailable).toBe(true)
  })

  it('does not report pools unavailable when the pools balance is present', () => {
    mockBreakdown({ poolsBalanceUSD: 100 })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: true }))

    expect(result.current.isPoolsUnavailable).toBe(false)
  })

  it('is unresolved when disabled even if the shared breakdown cache is populated', () => {
    mockBreakdown({ failedChainIds: [UniverseChainId.Mainnet], poolsBalanceUSD: undefined })

    const { result } = renderHookWithProviders(() => usePoolsFailedNetworks({ enabled: false }))

    expect(result.current.hasResolved).toBe(false)
    expect(result.current.failedChainIds).toEqual([])
    expect(result.current.isPoolsUnavailable).toBe(false)
  })
})
