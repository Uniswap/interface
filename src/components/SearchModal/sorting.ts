import { Token, CurrencyAmount, Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useAllTokenBalances } from '../../state/wallet/hooks'

// compare two token amounts with highest one coming first
function balanceComparator(balanceA?: CurrencyAmount<Currency>, balanceB?: CurrencyAmount<Currency>) {
  if (balanceA && balanceB) {
    return balanceA.greaterThan(balanceB) ? -1 : balanceA.equalTo(balanceB) ? 0 : 1
  } else if (balanceA && balanceA.greaterThan('0')) {
    return -1
  } else if (balanceB && balanceB.greaterThan('0')) {
    return 1
  }
  return 0
}

function getTokenComparator(balances: {
  [tokenAddress: string]: CurrencyAmount<Currency> | undefined
}): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: WrappedTokenInfo | Token, tokenB: WrappedTokenInfo | Token): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances
    const balanceA = balances[tokenA.address]
    const balanceB = balances[tokenB.address]

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    if ((tokenA as WrappedTokenInfo).list.name === (tokenB as WrappedTokenInfo).list.name) {
      const tokenAPosition = getPositionOnList(tokenA as WrappedTokenInfo)
      const tokenBPosition = getPositionOnList(tokenB as WrappedTokenInfo)
      return tokenAPosition < tokenBPosition ? -1 : 1
    }

    if (tokenA.symbol && tokenB.symbol) {
      // sort by symbol
      return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
    } else {
      return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0
    }
  }
}

function getPositionOnList(t: WrappedTokenInfo) {
  return t.list.tokens.map((t) => t.address).indexOf(t.address)
}

export function useTokenComparator(inverted: boolean): (tokenA: Token, tokenB: Token) => number {
  const balances = useAllTokenBalances()
  const comparator = useMemo(() => getTokenComparator(balances ?? {}), [balances])
  return useMemo(() => {
    if (inverted) {
      return (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1
    } else {
      return comparator
    }
  }, [inverted, comparator])
}
