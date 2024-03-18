import { preloadedMobileState } from 'src/test/fixtures'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import { SAMPLE_CURRENCY_ID_1, portfolio, portfolioBalances } from 'wallet/src/test/fixtures'
import { queryResolvers } from 'wallet/src/test/utils'
import { useBalances } from './balances'

const preloadedState = preloadedMobileState()

describe(useBalances, () => {
  it('returns null if no currency was specified', async () => {
    const { result } = renderHook(() => useBalances(undefined), {
      preloadedState,
    })

    await act(() => undefined)

    expect(result.current).toEqual(null)
  })

  it('returns empty array if no balances are available', async () => {
    const { result } = renderHook(() => useBalances([SAMPLE_CURRENCY_ID_1]), {
      preloadedState,
    })

    expect(result.current).toEqual(null) // null while data is loading

    await act(() => undefined)

    expect(result.current).toEqual([]) // empty array when data is loaded
  })

  it('returns balances for specified currencies if they exist in the portfolio', async () => {
    const Portfolio = portfolio()
    const balances = portfolioBalances({ portfolio: Portfolio })
    const { resolvers } = queryResolvers({
      portfolios: () => [Portfolio],
    })
    const { result } = renderHook(
      () => useBalances(balances.map(({ currencyInfo: { currencyId } }) => currencyId)),
      { preloadedState, resolvers }
    )

    await waitFor(() => {
      // The response contains only the first currency as the second one is not in the portfolio
      expect(result.current).toEqual(balances)
    })
  })
})
