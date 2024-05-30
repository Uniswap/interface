import { fireEvent, screen } from '@testing-library/react'
import { useWeb3React } from '@web3-react/core'
import { mocked } from 'test-utils/mocked'
import { render, renderHook } from 'test-utils/render'
import { useOnAssetActivitySubscription } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { PrefetchBalancesWrapper, useTokenBalancesQuery } from './TokenBalancesProvider'

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
  usePortfolioBalancesWebLazyQuery: () => mockBalanceQueryResponse,
  useOnAssetActivitySubscription: jest.fn(),
}))

jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(),
}))

function triggerSubscriptionUpdate() {
  mocked(useOnAssetActivitySubscription).mockReturnValue({
    data: {}, // new object reference will cause state update
    loading: false,
    variables: { account: '0xaddress1', subscriptionId: '123' },
  })
}

describe('TokenBalancesProvider', () => {
  beforeEach(() => {
    mocked(useOnAssetActivitySubscription).mockReturnValue({
      data: undefined,
      loading: false,
      variables: { account: '0xaddress1', subscriptionId: '123' },
    })
    mocked(useFeatureFlag).mockImplementation((f) => f === FeatureFlags.Realtime)
    mocked(useWeb3React).mockReturnValue({ account: '0xaddress1', chainId: 1 } as any)
  })

  it('TokenBalancesProvider should not fetch balances without calls to useOnAssetActivitySubscription', () => {
    render(<div />)
    expect(mockLazyFetch).toHaveBeenCalledTimes(0)
  })

  describe('useTokenBalancesQuery', () => {
    it('should only refetch balances when stale', () => {
      const { rerender, unmount } = renderHook(() => useTokenBalancesQuery())

      // Rendering useTokenBalancesQuery should trigger a fetch
      expect(mockLazyFetch).toHaveBeenCalledTimes(1)

      // Rerender to clear staleness
      rerender()

      // Receiving a new value from subscription should trigger a fetch while useTokenBalancesQuery hooks are mounted
      triggerSubscriptionUpdate()
      rerender()
      expect(mockLazyFetch).toHaveBeenCalledTimes(2)

      // Unmounting the hooks should not trigger any fetches
      unmount()
      expect(mockLazyFetch).toHaveBeenCalledTimes(2)

      // Receiving a new value from subscription should NOT trigger a fetch if no useTokenBalancesQuery hooks are mounted
      triggerSubscriptionUpdate()
      expect(mockLazyFetch).toHaveBeenCalledTimes(2)
    })

    it('should use cached balances across multiple hook calls', () => {
      renderHook(() => ({
        hook1: useTokenBalancesQuery(),
        hook2: useTokenBalancesQuery(),
      }))

      // Rendering useTokenBalancesQuery twice should only trigger one fetch
      expect(mockLazyFetch).toHaveBeenCalledTimes(1)
    })

    it('should refetch when account changes', () => {
      const { rerender } = renderHook(() => useTokenBalancesQuery())

      expect(mockLazyFetch).toHaveBeenCalledTimes(1)

      // Rerender to clear staleness
      rerender()

      // Balances should refetch when account changes
      mocked(useWeb3React).mockReturnValue({ account: '0xaddress2', chainId: 1 } as any)
      rerender()

      expect(mockLazyFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('PrefetchBalancesWrapper', () => {
    it('should fetch balances when a PrefetchBalancesWrapper is hovered', () => {
      const { rerender } = render(
        <PrefetchBalancesWrapper>
          <div>hi</div>
        </PrefetchBalancesWrapper>
      )
      const wrappedComponent = screen.getByText('hi')

      // Rerender to account for initial stale flag being set
      rerender(
        <PrefetchBalancesWrapper>
          <div>hi</div>
        </PrefetchBalancesWrapper>
      )

      // Should not fetch balances before hover
      expect(mockLazyFetch).toHaveBeenCalledTimes(0)

      // Hovering component should trigger a fetch
      fireEvent.mouseEnter(wrappedComponent)
      fireEvent.mouseLeave(wrappedComponent)
      expect(mockLazyFetch).toHaveBeenCalledTimes(1)

      // Subsequent hover should not trigger a fetch
      fireEvent.mouseEnter(wrappedComponent)
      fireEvent.mouseLeave(wrappedComponent)
      expect(mockLazyFetch).toHaveBeenCalledTimes(1)

      // Subsequent hover should trigger a fetch if the subscription has updated
      triggerSubscriptionUpdate()
      rerender(
        <PrefetchBalancesWrapper>
          <div>hi</div>
        </PrefetchBalancesWrapper>
      )
      expect(mockLazyFetch).toHaveBeenCalledTimes(1)
      fireEvent.mouseEnter(wrappedComponent)
      fireEvent.mouseLeave(wrappedComponent)
      expect(mockLazyFetch).toHaveBeenCalledTimes(2)
    })
  })
})
