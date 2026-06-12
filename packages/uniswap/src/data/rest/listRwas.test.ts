import { useQuery } from '@connectrpc/connect-query'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('@connectrpc/connect-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@connectrpc/connect-query')>()),
  useQuery: vi.fn(),
}))

const mockUseQuery = vi.mocked(useQuery)
const CHAIN_IDS = [1, 56]

beforeEach(() => {
  vi.clearAllMocks()
  mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>)
})

describe(useListRwasQuery, () => {
  it('omits includeCommodities by default so commodity-free callers keep an identical query key', () => {
    renderHook(() => useListRwasQuery({ chainIds: CHAIN_IDS }))
    const input = mockUseQuery.mock.calls[0]?.[1]
    expect(input).toEqual({ chainIds: CHAIN_IDS })
    expect(input).not.toHaveProperty('includeCommodities')
  })

  it('forwards includeCommodities when explicitly enabled', () => {
    renderHook(() => useListRwasQuery({ chainIds: CHAIN_IDS, includeCommodities: true }))
    expect(mockUseQuery.mock.calls[0]?.[1]).toEqual({ chainIds: CHAIN_IDS, includeCommodities: true })
  })

  it('forwards an explicit includeCommodities: false (not collapsed to the bare request)', () => {
    renderHook(() => useListRwasQuery({ chainIds: CHAIN_IDS, includeCommodities: false }))
    expect(mockUseQuery.mock.calls[0]?.[1]).toEqual({ chainIds: CHAIN_IDS, includeCommodities: false })
  })
})
