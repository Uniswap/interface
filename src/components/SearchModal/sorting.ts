import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useExistingRawPairs } from '../../data/Reserves'
import { useAllTokenBalances, useTokenBalances } from '../../state/wallet/hooks'
import { PairsSortingType } from '../Pool/ListFilter'

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

export function useAggregatedByToken0PairComparator(
  sortingType: PairsSortingType
): (
  pairA: { token0: Token; pairs: Pair[]; lpTokensBalance: BigNumber; remainingRewardsUSD: BigNumber },
  pairB: { token0: Token; pairs: Pair[]; lpTokensBalance: BigNumber; remainingRewardsUSD: BigNumber }
) => number {
  return useMemo(
    () =>
      function sortAggregatedByToken0Pairs(pairA, pairB): number {
        // -1 = a is first
        // 1 = b is first

        if (sortingType === PairsSortingType.RELEVANCE) {
          // sort by lp token balances (aggregated pairs in which the user has at
          // least a position are shown first, ordered by the absolute size of the
          // position in LP token amounts)
          const balanceA = pairA.lpTokensBalance
          const balanceB = pairB.lpTokensBalance
          const balanceComp = balanceA.isGreaterThan(balanceB) ? -1 : balanceA.isEqualTo(balanceB) ? 0 : 1
          if (balanceComp !== 0) return balanceComp
        }

        // sort by rewards
        return pairA.remainingRewardsUSD.isLessThan(pairB.remainingRewardsUSD) ? -1 : 1
      },
    [sortingType]
  )
}

export function usePairsComparator(inverted: boolean): (pairA: Pair, pairB: Pair) => number {
  const { account } = useWeb3React()
  const trackedTokenPairs = useExistingRawPairs()
  const balances = useTokenBalances(
    account || undefined,
    trackedTokenPairs.map(pair => pair.liquidityToken)
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
