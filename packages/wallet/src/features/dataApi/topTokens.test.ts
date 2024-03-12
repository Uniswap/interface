import { ChainId } from 'wallet/src/constants/chains'
import { gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { TopTokens } from 'wallet/src/test/gqlFixtures'
import { act, renderHook, waitFor } from 'wallet/src/test/test-utils'
import { usePopularTokens } from './topTokens'

describe(usePopularTokens, () => {
  it('returns loading true when data is being fetched', async () => {
    const { result } = renderHook(() => usePopularTokens(ChainId.Mainnet))

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

    const { result } = renderHook(() => usePopularTokens(ChainId.Mainnet), {
      resolvers: {
        Query: {
          topTokens: () => {
            throw new Error('test error')
          },
        },
      },
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
    const { result } = renderHook(() => usePopularTokens(ChainId.Mainnet), {
      resolvers: {
        Query: {
          topTokens: () => TopTokens,
        },
      },
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        data: TopTokens.map((token) => {
          token.address = token?.address?.toLowerCase()
          return gqlTokenToCurrencyInfo(token)
        }),
        loading: false,
        error: undefined,
        refetch: expect.any(Function),
      })
    })
  })
})
