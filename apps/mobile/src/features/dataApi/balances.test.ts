import { act, renderHook, waitFor } from 'src/test/test-utils'
import {
  mockWalletPreloadedState,
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_CURRENCY_ID_2,
} from 'wallet/src/test/fixtures'
import { Portfolio, PortfolioBalancesById } from 'wallet/src/test/gqlFixtures'
import { useBalances } from './balances'

describe(useBalances, () => {
  it('returns null if no currency was specified', async () => {
    const { result } = renderHook(() => useBalances(undefined), {
      preloadedState: mockWalletPreloadedState,
    })

    await act(() => undefined)

    expect(result.current).toEqual(null)
  })

  it('returns empty array if no balances are available', async () => {
    const { result } = renderHook(() => useBalances([SAMPLE_CURRENCY_ID_1]), {
      preloadedState: mockWalletPreloadedState,
    })

    expect(result.current).toEqual(null) // null while data is loading

    await act(() => undefined)

    expect(result.current).toEqual([]) // empty array when data is loaded
  })

  it('returns balances for specified currencies if they exist in the portfolio', async () => {
    const { result } = renderHook(() => useBalances([SAMPLE_CURRENCY_ID_1, SAMPLE_CURRENCY_ID_2]), {
      preloadedState: mockWalletPreloadedState,
      resolvers: {
        Query: {
          portfolios: () => [Portfolio],
        },
      },
    })

    await waitFor(() => {
      // The response contains only the first currency as the second one is not in the portfolio
      expect(result.current).toEqual([PortfolioBalancesById[SAMPLE_CURRENCY_ID_1]])
    })
  })
})
