import { useWeb3React } from '@web3-react/core'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'

import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useTokenBalances } from './useTokenBalances'

jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(() => ({ account: '0x123', chainId: 1 })),
}))

jest.mock('components/PrefetchBalancesWrapper/PrefetchBalancesWrapper', () => ({
  useCachedPortfolioBalancesQuery: jest.fn(() => ({ data: {}, loading: false })),
}))

describe('useTokenBalances', () => {
  it('should return empty balances when loading', () => {
    mocked(useCachedPortfolioBalancesQuery).mockReturnValueOnce({ data: undefined, loading: true } as any)
    const { loading, balanceList, balanceMap } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({})
    expect(loading).toEqual(true)
    expect(balanceList).toEqual([])
  })
  it('should return empty balances when user is not connected', () => {
    mocked(useWeb3React).mockReturnValueOnce({ account: undefined, chainId: undefined } as any)
    mocked(useCachedPortfolioBalancesQuery).mockReturnValueOnce({ data: undefined, loading: false } as any)
    const { loading, balanceList, balanceMap } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({})
    expect(loading).toEqual(false)
    expect(balanceList).toEqual([])
  })
  it('should return balance map when user is connected', () => {
    mocked(useCachedPortfolioBalancesQuery).mockReturnValueOnce({
      data: {
        portfolios: [
          {
            tokenBalances: [
              {
                token: {
                  standard: 'ERC20',
                  address: '0x123',
                  chain: Chain.Ethereum,
                },
                denominatedValue: {
                  value: 123,
                },
                quantity: 123,
              },
              {
                token: {
                  standard: NATIVE_CHAIN_ID,
                  chain: Chain.Ethereum,
                },
                denominatedValue: {
                  value: 123,
                },
                quantity: 123,
              },
            ],
          },
        ],
      },
      loading: false,
    } as any)
    const { balanceMap, loading } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({
      '0x123': {
        balance: 123,
        usdValue: 123,
      },
      ETH: {
        balance: 123,
        usdValue: 123,
      },
    })
    expect(loading).toEqual(false)
  })
})
