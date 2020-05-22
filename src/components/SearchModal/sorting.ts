import { Token, TokenAmount, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'

function getTokenComparator(
  weth: Token | undefined,
  balances: { [tokenAddress: string]: TokenAmount },
  invertSearchOrder: boolean
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

    if (balanceA?.greaterThan('0') && !balanceB?.greaterThan('0')) return !invertSearchOrder ? -1 : 1
    if (!balanceA?.greaterThan('0') && balanceB?.greaterThan('0')) return !invertSearchOrder ? 1 : -1
    if (balanceA?.greaterThan('0') && balanceB?.greaterThan('0')) {
      return balanceA.greaterThan(balanceB) ? (!invertSearchOrder ? -1 : 1) : !invertSearchOrder ? 1 : -1
    }

    // sort by symbol
    return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
  }
}

export function useTokenComparator(inverted: boolean): (tokenA: Token, tokenB: Token) => number {
  const { account, chainId } = useActiveWeb3React()
  const weth = WETH[chainId]
  const balances = useAllTokenBalancesTreatingWETHasETH()
  return useMemo(() => getTokenComparator(weth, balances[account] ?? {}, inverted), [account, balances, inverted, weth])
}
