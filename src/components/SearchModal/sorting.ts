import { Token, TokenAmount, WETH, Pair } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { DUMMY_PAIRS_TO_PIN } from '../../constants'

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

// compare two pairs, favoring "pinned" pairs, and falling back to balances
export function pairComparator(pairA: Pair, pairB: Pair, balanceA?: TokenAmount, balanceB?: TokenAmount) {
  const aShouldBePinned =
    DUMMY_PAIRS_TO_PIN[pairA?.token0?.chainId]?.some(
      dummyPairToPin => dummyPairToPin.liquidityToken.address === pairA?.liquidityToken?.address
    ) ?? false
  const bShouldBePinned =
    DUMMY_PAIRS_TO_PIN[pairB?.token0?.chainId]?.some(
      dummyPairToPin => dummyPairToPin.liquidityToken.address === pairB?.liquidityToken?.address
    ) ?? false

  if (aShouldBePinned && !bShouldBePinned) {
    return -1
  } else if (!aShouldBePinned && bShouldBePinned) {
    return 1
  } else {
    return balanceComparator(balanceA, balanceB)
  }
}

function getTokenComparator(
  weth: Token | undefined,
  balances: { [tokenAddress: string]: TokenAmount }
): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    // -1 = a is first
    // 1 = b is first

    // sort ETH first
    if (weth) {
      if (tokenA.equals(weth)) return -1
      if (tokenB.equals(weth)) return 1
    }

    // sort by balances
    const balanceA = balances[tokenA.address]
    const balanceB = balances[tokenB.address]

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    // sort by symbol
    return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
  }
}

export function useTokenComparator(inverted: boolean): (tokenA: Token, tokenB: Token) => number {
  const { chainId } = useActiveWeb3React()
  const weth = WETH[chainId]
  const balances = useAllTokenBalancesTreatingWETHasETH()
  const comparator = useMemo(() => getTokenComparator(weth, balances ?? {}), [balances, weth])
  return useMemo(() => {
    if (inverted) {
      return (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1
    } else {
      return comparator
    }
  }, [inverted, comparator])
}
