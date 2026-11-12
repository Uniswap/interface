import { act, renderHook } from '@testing-library/react'
import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_V2_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
import { useV2StatusFilter } from '~/features/Liquidity/hooks/useV2StatusFilter'
import { PortfolioTab } from '~/hooks/usePortfolioRoutes/types'
import { buildPortfolioUrl } from '~/hooks/usePortfolioRoutes/utils'
import { usePortfolioPoolsFilters } from '~/pages/Portfolio/Pools/usePortfolioPoolsFilters'
import { mocked } from '~/test-utils/mocked'

const navigate = vi.fn()

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}))

vi.mock('~/features/Liquidity/hooks/useV2StatusFilter', () => ({
  useV2StatusFilter: vi.fn(),
}))

const OWNER = '0x1111111111111111111111111111111111111111'
const ALL_NETWORKS_POOLS_URL = buildPortfolioUrl({ tab: PortfolioTab.Pools, externalAddress: undefined })

function renderFilters(chainId: UniverseChainId | undefined) {
  return renderHook(() =>
    usePortfolioPoolsFilters({ chainId, externalAddress: undefined, positionsOwnerAddress: OWNER }),
  )
}

describe('usePortfolioPoolsFilters clearFiltersAndSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useV2StatusFilter).mockReturnValue({
      v2StatusFilter: [...DEFAULT_V2_POSITION_STATUS_FILTER],
      toggleV2Status: vi.fn(),
      resetV2Status: vi.fn(),
    })
  })

  it('widens a chain-scoped portfolio back to all networks', () => {
    const { result } = renderFilters(UniverseChainId.Base)

    act(() => result.current.clearFiltersAndSearch())

    expect(navigate).toHaveBeenCalledWith(ALL_NETWORKS_POOLS_URL)
  })

  it('resets every dimension in one press: search, hidden toggle, and chain scope', () => {
    const { result } = renderFilters(UniverseChainId.Base)

    act(() => result.current.setSearch('weth'))
    act(() => result.current.setShowHiddenPositions(true))
    act(() => result.current.clearFiltersAndSearch())

    expect(result.current.search).toBe('')
    expect(result.current.showHiddenPositions).toBe(false)
    expect(navigate).toHaveBeenCalledWith(ALL_NETWORKS_POOLS_URL)
  })

  it('keeps the range tab selection when clearing, including a chain-scoped clear', () => {
    const { result } = renderFilters(UniverseChainId.Base)

    act(() => result.current.positionsTableControlBarProps.setRangeFilter([PositionStatus.IN_RANGE]))
    act(() => result.current.clearFiltersAndSearch())

    expect(result.current.statusFilter).toEqual([PositionStatus.IN_RANGE])
    expect(navigate).toHaveBeenCalledWith(ALL_NETWORKS_POOLS_URL)
  })

  it('never navigates without a chain scope', () => {
    const { result } = renderFilters(undefined)

    act(() => result.current.clearFiltersAndSearch())

    expect(navigate).not.toHaveBeenCalled()
  })

  it('carries the route chain into the control-bar props as an active filter', () => {
    const { result } = renderFilters(UniverseChainId.Base)

    expect(result.current.positionsTableControlBarProps.chainFilter).toBe(UniverseChainId.Base)
    expect(renderFilters(undefined).result.current.positionsTableControlBarProps.chainFilter).toBeNull()
  })
})
