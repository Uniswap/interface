import { useWeb3React } from '@web3-react/core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import {
  Chain,
  useQuickTokenBalancesWebQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(() => ({ account: '0x123', chainId: 1 })),
}))

jest.mock('graphql/data/apollo/AdaptiveTokenBalancesProvider', () => ({
  ...jest.requireActual('graphql/data/apollo/AdaptiveTokenBalancesProvider'),
  useTokenBalancesQuery: jest.fn(() => ({ data: {}, loading: false })),
}))

jest.mock('uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks', () => ({
  ...jest.requireActual('uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'),
  useQuickTokenBalancesWebQuery: jest.fn(() => ({ data: {}, loading: false })),
}))

describe('useTokenBalances', () => {
  it('should return empty balances when loading', () => {
    mocked(useTokenBalancesQuery).mockReturnValueOnce({ data: undefined, loading: true } as any)
    mocked(useQuickTokenBalancesWebQuery).mockReturnValueOnce({ data: undefined, loading: true } as any)

    const { loading, balanceList, balanceMap } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({})
    expect(loading).toEqual(true)
    expect(balanceList).toEqual([])
  })
  it('should return empty balances when user is not connected', () => {
    mocked(useWeb3React).mockReturnValueOnce({ account: undefined, chainId: undefined } as any)
    mocked(useTokenBalancesQuery).mockReturnValueOnce({ data: undefined, loading: false } as any)
    mocked(useQuickTokenBalancesWebQuery).mockReturnValueOnce({ data: undefined, loading: false } as any)
    const { loading, balanceList, balanceMap } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({})
    expect(loading).toEqual(false)
    expect(balanceList).toEqual([])
  })
  it('should return balance map when user is connected', () => {
    mocked(useTokenBalancesQuery).mockReturnValueOnce({
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
      '1-0x123': {
        balance: 123,
        usdValue: 123,
      },
      '1-native': {
        balance: 123,
        usdValue: 123,
      },
    })
    expect(loading).toEqual(false)
  })
})
