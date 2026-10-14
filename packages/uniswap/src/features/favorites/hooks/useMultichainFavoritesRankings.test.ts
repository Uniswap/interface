import { RankedMultichainToken, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import {
  EXPLORE_LIST_TOKENS_PAGE_SIZE,
  useExploreListTokens,
} from 'uniswap/src/data/apiClients/dataApiService/explore/useExploreListTokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { buildLookupKey } from 'uniswap/src/features/favorites/canonicalFavoritesLookup'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/apiClients/dataApiService/explore/useExploreListTokens', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/explore/useExploreListTokens')>()),
  useExploreListTokens: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

const ENABLED_CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne]

function setListTokens({
  multichainTokens,
  hasData,
}: {
  multichainTokens: RankedMultichainToken[]
  hasData: boolean
}): void {
  vi.mocked(useExploreListTokens).mockReturnValue({
    multichainTokens,
    hasData,
  } as unknown as ReturnType<typeof useExploreListTokens>)
}

describe(useMultichainFavoritesRankings, () => {
  beforeEach(() => {
    vi.mocked(useEnabledChains).mockReturnValue({
      chains: ENABLED_CHAIN_IDS,
    } as unknown as ReturnType<typeof useEnabledChains>)
    setListTokens({ multichainTokens: [], hasData: false })
  })

  it('requests ListTokens with the Explore default parameters across every enabled chain', () => {
    renderHook(() => useMultichainFavoritesRankings())

    expect(useExploreListTokens).toHaveBeenCalledWith({
      chainIds: ENABLED_CHAIN_IDS,
      orderBy: TokensOrderBy.VOLUME_1D,
      ascending: false,
      pageSize: EXPLORE_LIST_TOKENS_PAGE_SIZE,
    })
  })

  it('returns empty maps and hasData: false while the query is pending', () => {
    const { result } = renderHook(() => useMultichainFavoritesRankings())

    expect(result.current.canonicalByKey.size).toBe(0)
    expect(result.current.networkCountByKey.size).toBe(0)
    expect(result.current.hasData).toBe(false)
  })

  it('builds the canonical lookup once the query resolves', () => {
    setListTokens({
      multichainTokens: [
        new RankedMultichainToken({ multichainToken: { addresses: { '1': '0xAAA', '42161': '0xAAA' } } }),
      ],
      hasData: true,
    })

    const { result } = renderHook(() => useMultichainFavoritesRankings())

    expect(result.current.hasData).toBe(true)
    expect(result.current.canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(result.current.canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(result.current.networkCountByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe(2)
  })
})
