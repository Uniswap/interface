import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { parseUSDValueFromAssetChange } from 'uniswap/src/features/activity/utils/remote'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ONE_DAY_MS } from 'utilities/src/time/time'

/**
 * Hook to fetch swap USD values from GraphQL for transactions from the last 7 days
 * Returns a map of transaction hash -> USD value
 */
export function useSwapUSDValuesFromGraphQL(
  address: string | undefined,
  chainIds: UniverseChainId[],
): Map<string, number> {
  const sevenDaysAgo = useMemo(() => Date.now() - 7 * ONE_DAY_MS, [])

  const gqlChains = useMemo(() => chainIds.map(toGraphQLChain), [chainIds])

  // Use the existing ActivityWeb query which includes transactedValue in TokenTransfer
  const { data } = GraphQLApi.useActivityWebQuery({
    variables: {
      account: address ?? '',
      chains: gqlChains,
      onRampTransactionIDs: [],
      includeOffChain: true,
      page: 1,
      pageSize: 100,
    },
    skip: !address || chainIds.length === 0,
  })

  const usdValueMap = useMemo(() => {
    const map = new Map<string, number>()

    if (!data?.portfolios?.[0]?.assetActivities) {
      return map
    }

    for (const activity of data.portfolios[0].assetActivities) {
      if (!activity) {
        continue
      }

      // Only process transactions from the last 7 days
      if (!activity.timestamp || activity.timestamp * 1000 < sevenDaysAgo) {
        continue
      }

      // Only process swap transactions
      if (activity.details.__typename !== 'TransactionDetails') {
        continue
      }

      const details = activity.details
      if (details.type !== GraphQLApi.TransactionType.Swap || !details.hash) {
        continue
      }

      // Find the sent TokenTransfer to get transactedValue
      const sentTransfer = details.assetChanges.find(
        (change) => change?.__typename === 'TokenTransfer' && change.direction === GraphQLApi.TransactionDirection.Out,
      )

      if (sentTransfer?.__typename === 'TokenTransfer' && sentTransfer.transactedValue) {
        const usdValue = parseUSDValueFromAssetChange(sentTransfer.transactedValue)
        if (usdValue !== undefined) {
          map.set(details.hash, usdValue)
        }
      }
    }

    return map
  }, [data, sevenDaysAgo])

  return usdValueMap
}
