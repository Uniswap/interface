import { sortBalancesByName } from 'uniswap/src/features/dataApi/balances/utils'
import { PortfolioBalance, PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'

/**
 * Sorts multichain balances by totalValueUsd desc, then by name.
 * Defensive checks tolerate malformed API rows (e.g. empty `tokens`, missing `name`).
 */
/* oxlint-disable typescript/no-unnecessary-condition -- defensive checks for malformed API data */
export function sortMultichainBalances(
  balances: PortfolioMultichainBalance[],
  isTestnetModeEnabled: boolean,
): PortfolioMultichainBalance[] {
  const safeName = (b: PortfolioMultichainBalance): string => b.name ?? ''
  if (isTestnetModeEnabled) {
    const nativeBalances = balances.filter((b) => b.tokens[0] && b.tokens[0].currencyInfo.currency.isNative)
    const nonNative = balances.filter((b) => b.tokens[0] && !b.tokens[0].currencyInfo.currency.isNative)
    const sortedNative = [...nativeBalances].sort((a, b) => (b.tokens[0]?.quantity ?? 0) - (a.tokens[0]?.quantity ?? 0))
    const sortedNonNative = [...nonNative].sort((a, b) => safeName(a).localeCompare(safeName(b)))
    return [...sortedNative, ...sortedNonNative]
  }
  const withValue = balances.filter((b) => b.totalValueUsd != null && b.totalValueUsd > 0)
  const withoutValue = balances.filter((b) => !b.totalValueUsd || b.totalValueUsd === 0)
  return [
    ...withValue.sort((a, b) => (b.totalValueUsd ?? 0) - (a.totalValueUsd ?? 0)),
    ...withoutValue.sort((a, b) => safeName(a).localeCompare(safeName(b))),
  ]
}
/* oxlint-enable typescript/no-unnecessary-condition */

/**
 * Stable sort by descending balanceUSD – or native balance tokens in testnet mode –
 * followed by all other tokens sorted alphabetically.
 */
export function sortPortfolioBalances({
  balances,
  isTestnetModeEnabled,
}: {
  balances: PortfolioBalance[]
  isTestnetModeEnabled: boolean
}): PortfolioBalance[] {
  if (isTestnetModeEnabled) {
    const sortedNativeBalances = balances
      .filter((b) => b.currencyInfo.currency.isNative)
      .sort((a, b) => b.quantity - a.quantity)

    const sortedNonNativeBalances = sortBalancesByName(balances.filter((b) => !b.currencyInfo.currency.isNative))

    return [...sortedNativeBalances, ...sortedNonNativeBalances]
  }

  const balancesWithUSDValue = balances.filter((b) => b.balanceUSD)
  const balancesWithoutUSDValue = balances.filter((b) => !b.balanceUSD)

  return [
    ...balancesWithUSDValue.sort((a, b) => {
      if (!a.balanceUSD) {
        return 1
      }
      if (!b.balanceUSD) {
        return -1
      }
      return b.balanceUSD - a.balanceUSD
    }),
    ...sortBalancesByName(balancesWithoutUSDValue),
  ]
}

function sortPortfolioChainBalancesByName(tokens: PortfolioChainBalance[]): PortfolioChainBalance[] {
  return [...tokens].sort((a, b) => {
    const an = a.currencyInfo.currency.name
    const bn = b.currencyInfo.currency.name
    if (!an) {
      return 1
    }
    if (!bn) {
      return -1
    }
    return an.localeCompare(bn)
  })
}

/**
 * Per-chain rows for an expanded multichain token: same ordering as {@link sortPortfolioBalances}
 * (USD value descending, then name; in testnet mode, native by quantity then name).
 */
export function sortPortfolioChainBalances({
  tokens,
  isTestnetModeEnabled,
}: {
  tokens: PortfolioChainBalance[]
  isTestnetModeEnabled: boolean
}): PortfolioChainBalance[] {
  if (tokens.length <= 1) {
    return tokens
  }

  if (isTestnetModeEnabled) {
    const nativeTokens = tokens.filter((t) => t.currencyInfo.currency.isNative)
    const nonNativeTokens = tokens.filter((t) => !t.currencyInfo.currency.isNative)
    const sortedNative = [...nativeTokens].sort((a, b) => b.quantity - a.quantity)
    return [...sortedNative, ...sortPortfolioChainBalancesByName(nonNativeTokens)]
  }

  const withValue = tokens.filter((t) => t.valueUsd)
  const withoutValue = tokens.filter((t) => !t.valueUsd)

  return [
    ...withValue.sort((a, b) => {
      if (!a.valueUsd) {
        return 1
      }
      if (!b.valueUsd) {
        return -1
      }
      return b.valueUsd - a.valueUsd
    }),
    ...sortPortfolioChainBalancesByName(withoutValue),
  ]
}
