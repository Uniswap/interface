import { useTokenBalancesQuery } from 'graphql/data/apollo/TokenBalancesProvider'
import { GQL_MAINNET_CHAINS_MUTABLE } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import { TokenBalances } from 'lib/hooks/useTokenList/sorting'
import { useMemo } from 'react'
import {
  PortfolioTokenBalancePartsFragment,
  QuickTokenBalancePartsFragment,
  useQuickTokenBalancesWebQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { currencyKeyFromGraphQL } from 'utils/currencyKey'

/**
 * Returns the user's token balances via graphql as a map and list.
 */
export function useTokenBalances({ cacheOnly }: { cacheOnly?: boolean } = {}): {
  balanceMap: TokenBalances
  balanceList: readonly (QuickTokenBalancePartsFragment | PortfolioTokenBalancePartsFragment | undefined)[]
  loading: boolean
} {
  const account = useAccount()
  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  // Quick result is always available at pageload, but never refetched when stale
  const quickQueryResult = useQuickTokenBalancesWebQuery({
    variables: {
      ownerAddress: account.address ?? '',
      chains: GQL_MAINNET_CHAINS_MUTABLE,
    },
    skip: !account.address || !multichainUXEnabled,
    fetchPolicy: 'cache-first',
  })
  // Full query result is not available at pageload, but is refetched when needed in UI
  const fullQueryResult = useTokenBalancesQuery({ cacheOnly })
  const { data, loading } = fullQueryResult.data ? fullQueryResult : quickQueryResult

  return useMemo(() => {
    const balanceList = data?.portfolios?.[0]?.tokenBalances ?? []
    const balanceMap =
      balanceList?.reduce((balanceMap, tokenBalance) => {
        if (!tokenBalance?.token) {
          return balanceMap
        }

        const key = currencyKeyFromGraphQL({
          address: tokenBalance.token.address,
          chain: tokenBalance.token.chain,
          standard: tokenBalance.token.standard,
        })
        const usdValue = tokenBalance.denominatedValue?.value ?? 0
        const balance = tokenBalance.quantity ?? 0
        balanceMap[key] = { usdValue, balance }
        return balanceMap
      }, {} as TokenBalances) ?? {}
    return { balanceMap, balanceList, loading }
  }, [data?.portfolios, loading])
}
