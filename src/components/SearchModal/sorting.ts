import { Pair, Token, TokenAmount } from '@swapr/sdk'
import { CurrencyAmount } from '@swapr/sdk/dist/entities/fractions/currencyAmount'
import { useCallback, useMemo } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { toDXSwapLiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useAllTokenBalances, useTokenBalances } from '../../state/wallet/hooks'

// compare two token amounts with highest one coming first
function balanceComparator(balanceA?: TokenAmount, balanceB?: TokenAmount) {
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
  [tokenAddress: string]: TokenAmount | undefined
}): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances
    const balanceA = balances[tokenA.address]
    const balanceB = balances[tokenB.address]

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

function getPairsComparator(balances: {
  [pairAddress: string]: TokenAmount | undefined
}): (pairA: Pair, pairB: Pair) => number {
  return function sortPairs(pairA: Pair, pairB: Pair): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances
    const balanceA = balances[pairA.liquidityToken.address]
    const balanceB = balances[pairB.liquidityToken.address]

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    if (pairA.token0.symbol && pairA.token1.symbol && pairB.token0.symbol && pairB.token1.symbol) {
      // sort by symbol
      if (pairA.equals(pairB)) {
        return pairA.token1.symbol.toLowerCase() < pairB.token1.symbol.toLowerCase() ? -1 : 1
      }
      return pairA.token0.symbol.toLowerCase() < pairB.token0.symbol.toLowerCase() ? -1 : 1
    } else {
      return pairA.token0.symbol ? -1 : pairB.token0.symbol ? -1 : 0
    }
  }
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

export function useAggregatedByToken0PairComparator(): (
  pairA: { liquidityUSD: CurrencyAmount },
  pairB: { liquidityUSD: CurrencyAmount }
) => number {
  return useCallback((pairA, pairB): number => {
    // sort by rewards
    if (pairA.liquidityUSD.equalTo(pairB.liquidityUSD)) return 0
    return pairA.liquidityUSD.lessThan(pairB.liquidityUSD) ? 1 : -1
  }, [])
}

export function usePairsComparator(inverted: boolean): (pairA: Pair, pairB: Pair) => number {
  const { account } = useActiveWeb3React()
  const trackedTokenPairs = useTrackedTokenPairs()
  const balances = useTokenBalances(
    account || undefined,
    trackedTokenPairs.map(rawPair => toDXSwapLiquidityToken(rawPair))
  )
  const comparator = useMemo(() => getPairsComparator(balances ?? {}), [balances])
  return useMemo(() => {
    if (inverted) {
      return (pairA: Pair, pairB: Pair) => comparator(pairA, pairB) * -1
    } else {
      return comparator
    }
  }, [inverted, comparator])
}
