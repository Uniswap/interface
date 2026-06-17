import {
  ChainToken,
  TokenRankingsList,
  TokenRankingsResponse,
  TokenRankingsStat,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { buildLookupKey } from 'uniswap/src/features/favorites/canonicalFavoritesLookup'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/rest/tokenRankings', () => ({
  useTokenRankingsQuery: vi.fn(() => ({ data: undefined })),
}))

function makeChainToken(chainId: number, address: string): ChainToken {
  return { chainId, address, decimals: 18 } as unknown as ChainToken
}

function makeStat(chain: string, address: string, chainTokens: ChainToken[]): TokenRankingsStat {
  return { chain, address, chainTokens } as unknown as TokenRankingsStat
}

function makeResponse(tokens: TokenRankingsStat[]): TokenRankingsResponse {
  return {
    tokenRankings: {
      VOLUME: { tokens } as unknown as TokenRankingsList,
    },
  } as unknown as TokenRankingsResponse
}

function setQueryData(data: TokenRankingsResponse | undefined): void {
  vi.mocked(useTokenRankingsQuery).mockReturnValue({ data } as ReturnType<typeof useTokenRankingsQuery>)
}

describe(useMultichainFavoritesRankings, () => {
  beforeEach(() => {
    setQueryData(undefined)
  })

  it('always enables the query with ALL_NETWORKS_ARG + multichain: true', () => {
    renderHook(() => useMultichainFavoritesRankings())

    expect(useTokenRankingsQuery).toHaveBeenCalledWith({ chainId: ALL_NETWORKS_ARG, multichain: true })
  })

  it('returns empty maps but forwards undefined data while the query is pending', () => {
    setQueryData(undefined)

    const { result } = renderHook(() => useMultichainFavoritesRankings())

    expect(result.current.canonicalByKey.size).toBe(0)
    expect(result.current.networkCountByKey.size).toBe(0)
    expect(result.current.tokenRankingsData).toBeUndefined()
  })

  it('builds the canonical lookup and forwards data when the query resolves', () => {
    const data = makeResponse([
      makeStat('ETHEREUM', '0xAAA', [makeChainToken(1, '0xAAA'), makeChainToken(42161, '0xAAA')]),
    ])
    setQueryData(data)

    const { result } = renderHook(() => useMultichainFavoritesRankings())

    expect(result.current.tokenRankingsData).toBe(data)
    expect(result.current.canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(result.current.canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(result.current.networkCountByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe(2)
  })
})
