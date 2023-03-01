import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useAllTokenBalances, useETHBalance } from 'state/wallet/hooks'
import { isTokenNative } from 'utils/tokenInfo'

// compare two token amounts with highest one coming first
function balanceComparator(
  balanceA?: TokenAmount | CurrencyAmount<Currency>,
  balanceB?: TokenAmount | CurrencyAmount<Currency>,
) {
  if (balanceA && balanceB) {
    return JSBI.greaterThan(
      JSBI.multiply(balanceA.quotient, balanceB.decimalScale),
      JSBI.multiply(balanceB.quotient, balanceA.decimalScale),
    )
      ? -1
      : balanceA.equalTo(balanceB)
      ? 0
      : 1
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
  chainId: ChainId,
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
export function useTokenComparator(inverted: boolean): (tokenA: Token, tokenB: Token) => number {
  const balances = useAllTokenBalances()
  const { chainId } = useActiveWeb3React()
  const ethBalance = useETHBalance()
  return useMemo(() => {
    const comparator = getTokenComparator(balances ?? {}, ethBalance, chainId)
    if (inverted) {
      return (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1
    }
    return comparator
  }, [balances, inverted, ethBalance, chainId])
}
