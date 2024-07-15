import { usePopularTokens } from 'uniswap/src/features/dataApi/topTokens'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'
// TODO: https://linear.app/uniswap/issue/WEB-4376/move-universepackageswalletsrcfeaturesdataapi-tests-to-uniswap-pkg
import { token } from 'wallet/src/test/fixtures'
import { act, renderHook, waitFor } from 'wallet/src/test/test-utils'
import { createArray, queryResolvers } from 'wallet/src/test/utils'

describe(usePopularTokens, () => {
  it('returns loading true when data is being fetched', async () => {
    const { result } = renderHook(() => usePopularTokens(UniverseChainId.Mainnet))

    expect(result.current).toEqual({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: expect.any(Function),
    })

    await act(() => undefined)
  })

  it('returns error when data fetching fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    const { resolvers } = queryResolvers({
      topTokens: () => {
        throw new Error('test error')
      },
    })
    const { result } = renderHook(() => usePopularTokens(UniverseChainId.Mainnet), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        error: new Error('test error'),
        refetch: expect.any(Function),
      })
    })
  })

  it('returns data when data fetching succeeds', async () => {
    const topToken = createArray(3, token)
    const { resolvers } = queryResolvers({
      topTokens: () => topToken,
    })
    const { result } = renderHook(() => usePopularTokens(UniverseChainId.Mainnet), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        data: topToken.map(gqlTokenToCurrencyInfo),
        loading: false,
        error: undefined,
        refetch: expect.any(Function),
      })
    })
  })
})
