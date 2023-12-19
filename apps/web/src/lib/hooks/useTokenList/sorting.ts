import { ChainId, Token } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import { nativeOnChain } from 'constants/tokens'
import { PortfolioTokenBalancePartsFragment } from 'graphql/data/__generated__/types-and-hooks'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useMemo } from 'react'
import { splitHiddenTokens, SplitOptions } from 'utils/splitHiddenTokens'

/** Sorts currency amounts (descending). */
function balanceComparator(a?: number, b?: number) {
  if (a && b) {
    return a > b ? -1 : a === b ? 0 : 1
  } else if ((a ?? 0) > 0) {
    return -1
  } else if ((b ?? 0) > 0) {
    return 1
  }
  return 0
}

export type TokenBalances = { [tokenAddress: string]: { usdValue: number; balance: number } }

/** Sorts tokens by currency amount (descending), then safety, then symbol (ascending). */
function tokenComparator(balances: TokenBalances, a: Token, b: Token) {
  const aAddress = a.isNative ? 'ETH' : a.address?.toLowerCase()
  const bAddress = b.isNative ? 'ETH' : b.address?.toLowerCase()
  // Sorts by balances
  const balanceComparison = balanceComparator(balances[aAddress]?.usdValue, balances[bAddress]?.usdValue)
  if (balanceComparison !== 0) return balanceComparison

  // Sorts by symbol
  if (a.symbol && b.symbol) {
    return a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1
  }

  return -1
}

/** Given the results of the PortfolioTokenBalances query, returns a filtered list of tokens sorted by USD value. */
export function getSortedPortfolioTokens(
  portfolioTokenBalances: readonly PortfolioTokenBalancePartsFragment[] | undefined,
  balances: TokenBalances,
  chainId: ChainId | undefined,
  splitOptions?: SplitOptions
): Token[] {
  const validVisiblePortfolioTokens = splitHiddenTokens(portfolioTokenBalances ?? [], splitOptions)
    .visibleTokens.map((tokenBalance) => {
      const address = tokenBalance.token?.standard === 'ERC20' ? tokenBalance.token?.address?.toLowerCase() : 'ETH'
      if (!tokenBalance?.token?.chain || !tokenBalance.token?.decimals || !address) {
        return undefined
      }

      const tokenChainId = supportedChainIdFromGQLChain(tokenBalance.token?.chain) ?? ChainId.MAINNET
      if (tokenChainId !== chainId) {
        return undefined
      }

      if (address === 'ETH') {
        return nativeOnChain(tokenChainId)
      }

      const portfolioToken = new Token(
        tokenChainId,
        address,
        tokenBalance.token?.decimals,
        tokenBalance.token?.symbol,
        tokenBalance.token?.name
      )

      return portfolioToken
    })
    .filter((token) => !!token) as Token[]
  return validVisiblePortfolioTokens.sort(tokenComparator.bind(null, balances))
}

/** Sorts tokens by query, giving precedence to exact matches and partial matches. */
export function useSortTokensByQuery<T extends Token | TokenInfo>(query: string, tokens?: T[]): T[] {
  return useMemo(() => {
    if (!tokens) {
      return []
    }

    const matches = query
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    if (matches.length > 1) {
      return tokens
    }

    const exactMatches: T[] = []
    const symbolSubtrings: T[] = []
    const rest: T[] = []

    // sort tokens by exact match -> subtring on symbol match -> rest
    const trimmedQuery = query.toLowerCase().trim()
    tokens.map((token) => {
      const symbol = token.symbol?.toLowerCase()
      if (symbol === matches[0]) {
        return exactMatches.push(token)
      } else if (symbol?.startsWith(trimmedQuery)) {
        return symbolSubtrings.push(token)
      } else {
        return rest.push(token)
      }
    })

    return [...exactMatches, ...symbolSubtrings, ...rest]
  }, [tokens, query])
}
