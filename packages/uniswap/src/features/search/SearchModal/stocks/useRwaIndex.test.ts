import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRwaIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIndex'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/rest/listRwas', () => ({ useListRwasQuery: vi.fn() }))
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({ useEnabledChains: vi.fn() }))

const mockUseListRwasQuery = vi.mocked(useListRwasQuery)
const mockUseEnabledChains = vi.mocked(useEnabledChains)
const CHAIN_IDS = [1, 56]

beforeEach(() => {
  vi.clearAllMocks()
  mockUseEnabledChains.mockReturnValue({ chains: CHAIN_IDS } as unknown as ReturnType<typeof useEnabledChains>)
  mockUseListRwasQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useListRwasQuery>)
})

describe(useRwaIndex, () => {
  it('requests commodities inline for the shared index when enabled', () => {
    renderHook(() => useRwaIndex(true))
    expect(mockUseListRwasQuery).toHaveBeenCalledWith({ chainIds: CHAIN_IDS, includeCommodities: true, enabled: true })
  })

  it('keeps the query disabled when the flag is off', () => {
    renderHook(() => useRwaIndex(false))
    expect(mockUseListRwasQuery).toHaveBeenCalledWith({ chainIds: CHAIN_IDS, includeCommodities: true, enabled: false })
  })
})
