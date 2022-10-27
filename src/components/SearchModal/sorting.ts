import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { isTokenNative } from 'utils/tokenInfo'

import { useAllTokenBalances, useETHBalances } from '../../state/wallet/hooks'

// compare two token amounts with highest one coming first
function balanceComparator(
  balanceA?: TokenAmount | CurrencyAmount<Currency>,
  balanceB?: TokenAmount | CurrencyAmount<Currency>,
) {
  if (balanceA && balanceB) {
    return balanceA.greaterThan(balanceB) ? -1 : balanceA.equalTo(balanceB) ? 0 : 1
  } else if (balanceA && balanceA.greaterThan('0')) {
    return -1
  } else if (balanceB && balanceB.greaterThan('0')) {
    return 1
  }
  return 0
}

function getTokenComparator(
  balances: {
    [tokenAddress: string]: TokenAmount | undefined
  },
  ethBalance: CurrencyAmount<Currency> | undefined,
  chainId: ChainId | undefined,
): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances

    const balanceA = isTokenNative(tokenA, chainId) ? ethBalance : balances[tokenA.address]
    const balanceB = isTokenNative(tokenB, chainId) ? ethBalance : balances[tokenB.address]

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    if (tokenA.symbol && tokenB.symbol) {
      // sort by symbol
      return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
    } else {
      return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0
    }
  }
}
const EMPTY_ARRAY: any = []
export function useTokenComparator(inverted: boolean, containsETH = false): (tokenA: Token, tokenB: Token) => number {
  const balances = useAllTokenBalances()
  const { account, chainId } = useActiveWeb3React()
  const accounts = useMemo(() => (containsETH ? [account] : EMPTY_ARRAY), [containsETH, account])
  const ethBalance = useETHBalances(accounts)
  const value = Object.values(ethBalance)[0]
  // eslint-disable-next-line
  const memoEthBalance = useMemo(() => value, [value?.toExact()]) // do not put value dependency here
  return useMemo(() => {
    const comparator = getTokenComparator(balances ?? {}, memoEthBalance, chainId)
    if (inverted) {
      return (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1
    }
    return comparator
  }, [balances, inverted, memoEthBalance, chainId])
}
