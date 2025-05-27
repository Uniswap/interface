import { fireEvent, screen, waitFor } from '@testing-library/react'
import { PrefetchBalancesWrapper, useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAccount } from 'hooks/useAccount'
import { mocked } from 'test-utils/mocked'
import { render, renderHook } from 'test-utils/render'
import { Flex } from 'ui/src'

// TODO(WEB-5370): Remove this delay + waitFor once we've integrated wallet's refetch logic
jest.setTimeout(10000)
const mockLazyFetch = jest.fn()
const mockBalanceQueryResponse = [
  mockLazyFetch,
  {
    data: undefined,
    loading: true,
  },
]

jest.mock('uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks.ts', () => ({
  ...jest.requireActual('uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks.ts'),
  usePortfolioBalancesLazyQuery: () => mockBalanceQueryResponse,
}))

jest.mock('hooks/useAccount', () => ({
  useAccount: jest.fn(),
}))

describe('TokenBalancesProvider', () => {
  beforeEach(() => {
    mocked(useAccount).mockReturnValue({ address: '0xaddress1', chainId: 1 } as any)
  })

  it('TokenBalancesProvider should not fetch balances without calls to useOnAssetActivitySubscription', async () => {
    render(<Flex />)
    await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(0), { timeout: 3500 })
  })

  describe('useTokenBalancesQuery', () => {
    it('should only refetch balances when stale', async () => {
      const { rerender, unmount } = renderHook(() => useTokenBalancesQuery())

      // Rendering useTokenBalancesQuery should trigger a fetch
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 3500 })

      // Rerender to clear staleness
      rerender()

      // Unmounting the hooks should not trigger any fetches
      unmount()
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 3500 })
    })

    it('should use cached balances across multiple hook calls', async () => {
      renderHook(() => ({
        hook1: useTokenBalancesQuery(),
        hook2: useTokenBalancesQuery(),
      }))

      // Rendering useTokenBalancesQuery twice should only trigger one fetch
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 3500 })
    })

    it('should refetch when account changes', async () => {
      const { rerender } = renderHook(() => useTokenBalancesQuery())

      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 3500 })

      // Rerender to clear staleness
      rerender()

      // Balances should refetch when account changes
      mocked(useAccount).mockReturnValue({ address: '0xaddress2', chainId: 1 } as any)
      rerender()

      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(2), { timeout: 3500 })
    })
  })

  describe('PrefetchBalancesWrapper', () => {
    it('should fetch balances when a PrefetchBalancesWrapper is hovered', async () => {
      const { rerender } = render(
        <PrefetchBalancesWrapper>
          <>hi</>
        </PrefetchBalancesWrapper>,
      )
      const wrappedComponent = screen.getByText('hi')

      // Rerender to account for initial stale flag being set
      rerender(
        <PrefetchBalancesWrapper>
          <>hi</>
        </PrefetchBalancesWrapper>,
      )

      // Should not fetch balances before hover
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(0), { timeout: 3500 })

      // Hovering component should trigger a fetch
      fireEvent.mouseEnter(wrappedComponent)
      fireEvent.mouseLeave(wrappedComponent)
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 4000 })

      // Subsequent hover should not trigger a fetch
      fireEvent.mouseEnter(wrappedComponent)
      fireEvent.mouseLeave(wrappedComponent)
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 4000 })

      // Subsequent hover should trigger a fetch if the subscription has updated
      mocked(useAccount).mockReturnValue({ address: '0xaddress2', chainId: 1 } as any)
      rerender(
        <PrefetchBalancesWrapper>
          <>hi</>
        </PrefetchBalancesWrapper>,
      )
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(1), { timeout: 4000 })
      fireEvent.mouseEnter(wrappedComponent)
      fireEvent.mouseLeave(wrappedComponent)
      await waitFor(() => expect(mockLazyFetch).toHaveBeenCalledTimes(2), { timeout: 4000 })
    })
  })
})
