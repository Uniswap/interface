import { Token } from '@uniswap/sdk-core'
import { PortfolioBalance } from 'graphql/data/portfolios'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { currencyKey } from 'utils/currencyKey'
import { SplitOptions, splitHiddenTokens } from 'utils/splitHiddenTokens'

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
  const aAddress = currencyKey(a)
  const bAddress = currencyKey(b)
  // Sorts by balances
  const balanceComparison = balanceComparator(balances[aAddress]?.usdValue, balances[bAddress]?.usdValue)
  if (balanceComparison !== 0) {
    return balanceComparison
  }

  // Sorts by symbol
  if (a.symbol && b.symbol) {
    return a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1
  }

  return -1
}

/** Given the results of the PortfolioTokenBalances query, returns a filtered list of tokens sorted by USD value. */
export function getSortedPortfolioTokens(
  portfolioTokenBalances: readonly (PortfolioBalance | undefined)[] | undefined,
  balances: TokenBalances,
  chainId: UniverseChainId | undefined,
  splitOptions: SplitOptions,
): Token[] {
  const validVisiblePortfolioTokens = splitHiddenTokens(portfolioTokenBalances ?? [], splitOptions)
    .visibleTokens.map((tokenBalance) => {
      const address = tokenBalance.token?.standard === 'ERC20' ? tokenBalance.token?.address?.toLowerCase() : 'ETH'
      if (!tokenBalance?.token?.chain || !tokenBalance.token?.decimals || !address) {
        return undefined
      }

      const tokenChainId = supportedChainIdFromGQLChain(tokenBalance.token?.chain) ?? UniverseChainId.Mainnet
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
        tokenBalance.token?.name ?? tokenBalance.token?.project?.name,
      )

      return portfolioToken
    })
    .filter((token) => !!token) as Token[]
  return validVisiblePortfolioTokens.sort(tokenComparator.bind(null, balances))
}
