import { type CurrencyInfo, type PortfolioBalance } from 'uniswap/src/features/dataApi/types'

/**
 * Computes an aggregate PortfolioBalance by summing quantity and balanceUSD
 * across multiple per-chain balances. Used on TDP to show the total balance
 * of a token the user holds across all networks.
 */
export function computeAggregateBalance(
  balances: readonly PortfolioBalance[],
  representativeCurrencyInfo?: CurrencyInfo,
): PortfolioBalance | undefined {
  if (balances.length === 0) {
    return undefined
  }

  const firstBalance = balances[0]
  if (!firstBalance) {
    return undefined
  }
  const currencyInfo = representativeCurrencyInfo ?? firstBalance.currencyInfo
  const totalUsd = balances.reduce((sum, b) => sum + (typeof b.balanceUSD === 'number' ? b.balanceUSD : 0), 0)

  return {
    id: 'aggregate',
    cacheId: 'aggregate',
    quantity: balances.reduce((sum, b) => sum + Number(b.quantity), 0),
    balanceUSD: totalUsd === 0 ? undefined : totalUsd,
    currencyInfo,
    relativeChange24: undefined,
    isHidden: undefined,
  }
}

/** Sorts balances by USD value descending. Balances with no USD value sort after those with a value. */
export function sortBalancesByValue(balances: readonly PortfolioBalance[]): PortfolioBalance[] {
  return [...balances].sort((a, b) => {
    const aHasValue = a.balanceUSD != null
    const bHasValue = b.balanceUSD != null
    if (aHasValue !== bHasValue) {
      return aHasValue ? -1 : 1
    }
    return (b.balanceUSD ?? 0) - (a.balanceUSD ?? 0)
  })
}
