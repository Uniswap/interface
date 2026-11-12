import { useInfiniteQuery } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTokenPoolState } from '~/features/Toucan/Auction/hooks/useTokenPoolState'
import { getTokenListPoolsParams } from '~/utils/getTokenListPoolsParams'

vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useInfiniteQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: vi.fn((input) => input),
}))

const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery)
const mockGetListPoolsInfiniteQueryOptions = vi.mocked(getListPoolsInfiniteQueryOptions)
const mockRefetchPools = vi.fn()
const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const OTHER_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'
const DEFAULT_INPUT: Parameters<typeof useTokenPoolState>[0] = {
  chainId: UniverseChainId.Mainnet,
  tokenAddress: TOKEN_ADDRESS,
  enabled: true,
}

function mockPoolQuery({
  poolCount,
  isSuccess = false,
  isFetchedAfterMount = false,
  isError = false,
}: { poolCount?: number; isSuccess?: boolean; isFetchedAfterMount?: boolean; isError?: boolean } = {}): void {
  mockUseInfiniteQuery.mockReturnValue({
    data: poolCount === undefined ? undefined : { pages: [{ pools: Array(poolCount).fill({}) }], pageParams: [''] },
    isSuccess,
    isFetchedAfterMount,
    isError,
    refetch: mockRefetchPools,
  } as unknown as ReturnType<typeof useInfiniteQuery>)
}

function expectedParams(chainId: UniverseChainId, tokenAddress: string) {
  return getTokenListPoolsParams({
    chainId,
    tokenAddress,
    isNative: false,
    protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
    sort: { orderBy: PoolsOrderBy.TVL, ascending: false },
  })
}

function renderPoolState(overrides: Partial<Parameters<typeof useTokenPoolState>[0]> = {}) {
  const initialProps = { ...DEFAULT_INPUT, ...overrides }
  // A bare rerender() passes no props; keep the initial input.
  return renderHook((params?: typeof initialProps) => useTokenPoolState(params ?? initialProps), { initialProps })
}

describe('useTokenPoolState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefetchPools.mockResolvedValue(undefined)
    mockPoolQuery()
  })

  it('queries token pools sorted by TVL and refreshes once on mount', () => {
    const { rerender } = renderPoolState()

    expect(mockGetListPoolsInfiniteQueryOptions).toHaveBeenCalledExactlyOnceWith({
      params: expectedParams(UniverseChainId.Mainnet, TOKEN_ADDRESS),
      pageSize: 20,
      enabled: true,
    })
    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })

    rerender()

    expect(mockRefetchPools).toHaveBeenCalledTimes(1)
  })

  it('waits for a fresh response before trusting hydrated pool counts', () => {
    const { result, rerender } = renderPoolState()
    expect(result.current.poolState).toEqual({ status: 'loading' })

    const cachedEmptyQuery = { poolCount: 0, isSuccess: true }
    mockPoolQuery(cachedEmptyQuery)
    rerender()
    expect(result.current.poolState).toEqual({ status: 'loading' })

    mockPoolQuery({ ...cachedEmptyQuery, isFetchedAfterMount: true })
    rerender()
    expect(result.current.poolState).toEqual({ status: 'success', poolCount: 0 })

    mockPoolQuery({ ...cachedEmptyQuery, poolCount: 2, isFetchedAfterMount: true })
    rerender()
    expect(result.current.poolState).toEqual({ status: 'success', poolCount: 2 })
  })

  it('reports a failed refresh instead of trusting retained empty data', () => {
    mockPoolQuery({ poolCount: 0, isFetchedAfterMount: true, isError: true })

    const { result } = renderPoolState()

    expect(result.current.poolState).toEqual({ status: 'error' })
  })

  it('refreshes when the token, chain, or enabled state changes', () => {
    const { rerender } = renderPoolState()
    expect(mockRefetchPools).toHaveBeenCalledTimes(1)

    rerender({ ...DEFAULT_INPUT, tokenAddress: OTHER_TOKEN_ADDRESS })
    expect(mockRefetchPools).toHaveBeenCalledTimes(2)

    const otherChainInput: Parameters<typeof useTokenPoolState>[0] = {
      ...DEFAULT_INPUT,
      tokenAddress: OTHER_TOKEN_ADDRESS,
      chainId: UniverseChainId.Base,
    }
    rerender(otherChainInput)
    expect(mockRefetchPools).toHaveBeenCalledTimes(3)

    rerender({ ...otherChainInput, enabled: false })
    expect(mockRefetchPools).toHaveBeenCalledTimes(3)

    rerender(otherChainInput)
    expect(mockRefetchPools).toHaveBeenCalledTimes(4)
    expect(mockGetListPoolsInfiniteQueryOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: expectedParams(UniverseChainId.Base, OTHER_TOKEN_ADDRESS), enabled: true }),
    )
  })

  it.each([{ enabled: false }, { chainId: undefined }, { tokenAddress: undefined }, { tokenAddress: '' }])(
    'disables automatic and explicit refresh without eligible inputs %#',
    async (overrides) => {
      const { result } = renderPoolState(overrides)

      await act(async () => {
        await result.current.refetch()
      })

      expect(mockGetListPoolsInfiniteQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockRefetchPools).not.toHaveBeenCalled()
      expect(result.current.poolState).toEqual({ status: 'loading' })
    },
  )

  it('exposes an explicit refresh that does not cancel an in-flight request', async () => {
    const { result } = renderPoolState()
    mockRefetchPools.mockClear()

    await act(async () => {
      await expect(result.current.refetch()).resolves.toBeUndefined()
    })

    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })
  })
})
