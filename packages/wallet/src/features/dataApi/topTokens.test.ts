import { faker } from '@faker-js/faker'
import { ChainId } from 'wallet/src/constants/chains'
import { gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { token, tokenProject } from 'wallet/src/test/fixtures'
import { act, renderHook, waitFor } from 'wallet/src/test/test-utils'
import { createArray } from 'wallet/src/test/utils'
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
    const topToken = createArray(3, () =>
      token({
        // We have to provide the isSpam property as it is specified in the popular tokens query
        project: tokenProject({ isSpam: faker.datatype.boolean() }),
      })
    )
    const { result } = renderHook(() => usePopularTokens(ChainId.Mainnet), {
      resolvers: {
        Query: {
          topTokens: () => topToken,
        },
      },
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
