import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'

/**
 * Retrieves cached token balances, avoiding new fetches to reduce backend load.
 * Analytics should use balances from transaction flows instead of initiating fetches at pageload.
 */
export function useTotalBalancesUsdForAnalytics(): number | undefined {
  return useTokenBalancesQuery({ cacheOnly: true }).data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value
}
