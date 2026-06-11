import { RankedRwa } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { useRwaTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseListRankedRwasQuery } = vi.hoisted(() => ({ mockUseListRankedRwasQuery: vi.fn() }))

vi.mock('uniswap/src/data/rest/listRankedRwas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/rest/listRankedRwas')>()),
  useListRankedRwasQuery: mockUseListRankedRwasQuery,
}))

function makeRwa(i: number): RankedRwa {
  return new RankedRwa({
    symbol: `T${i}`,
    name: `Token ${i}`,
    issuerTokens: [
      { symbol: `T${i}X`, name: `Token ${i} X`, chainTokens: [{ chainId: UniverseChainId.Bnb, address: `0x${i}` }] },
    ],
  })
}

describe('useRwaTokenOptions', () => {
  it('maps and caps the list to the first 10', () => {
    const rwas = Array.from({ length: 25 }, (_, i) => makeRwa(i))
    mockUseListRankedRwasQuery.mockReturnValue({ data: { rwas } })
    const { result } = renderHook(() => useRwaTokenOptions())
    expect(result.current).toHaveLength(10)
    expect(result.current[0]).toMatchObject({ type: OnchainItemListOptionType.Rwa, symbol: 'T0X' })
  })

  it('returns [] when there is no data', () => {
    mockUseListRankedRwasQuery.mockReturnValue({ data: undefined })
    const { result } = renderHook(() => useRwaTokenOptions())
    expect(result.current).toEqual([])
  })

  it('forwards chainFilter as a single-chain chainIds array and opts out of the sparkline', () => {
    mockUseListRankedRwasQuery.mockReturnValue({ data: undefined })
    renderHook(() => useRwaTokenOptions({ chainFilter: UniverseChainId.Bnb }))
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith(
      expect.objectContaining({ chainIds: [UniverseChainId.Bnb], includeSparkline1d: false }),
    )
  })

  it('passes an empty chainIds array and includeSparkline1d=false when chainFilter is not set', () => {
    mockUseListRankedRwasQuery.mockReturnValue({ data: undefined })
    renderHook(() => useRwaTokenOptions())
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith(
      expect.objectContaining({ chainIds: [], includeSparkline1d: false }),
    )
  })
})
