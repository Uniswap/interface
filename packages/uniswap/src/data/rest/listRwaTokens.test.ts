import { useQuery } from '@connectrpc/connect-query'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useListRwaTokensQuery } from 'uniswap/src/data/rest/listRwaTokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains, mockUseFeatureFlag } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseFeatureFlag: vi.fn(),
}))

vi.mock('@connectrpc/connect-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@connectrpc/connect-query')>()),
  useQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

const mockUseQuery = vi.mocked(useQuery)
const CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Base]

describe(useListRwaTokensQuery, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: CHAIN_IDS })
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>)
  })

  it('sets useSubstreamData to false when V2EndpointsTokens is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    renderHook(() =>
      useListRwaTokensQuery({ category: RwaCategory.COMMODITIES, chainIds: CHAIN_IDS, includeSparkline1d: false }),
    )

    expect(mockUseQuery.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ useSubstreamData: false }))
  })

  it('sets useSubstreamData to true when V2EndpointsTokens is enabled', () => {
    mockUseFeatureFlag.mockReturnValue(true)

    renderHook(() =>
      useListRwaTokensQuery({ category: RwaCategory.COMMODITIES, chainIds: CHAIN_IDS, includeSparkline1d: false }),
    )

    expect(mockUseQuery.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ useSubstreamData: true }))
  })
})
