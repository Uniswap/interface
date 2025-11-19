import {
  ActivityFilterType,
  filterTransactionDetailsFromActivityItems,
  getTransactionTypesForFilter,
} from 'pages/Portfolio/Activity/Filters/utils'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useSwapUSDValuesFromGraphQL } from 'pages/Portfolio/Overview/hooks/useSwapUSDValuesFromGraphQL'
import { useMemo } from 'react'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_DAY_MS } from 'utilities/src/time/time'

function filterSwapsTypeLast7Days(transactions: ActivityItem[]): TransactionDetails[] {
  const allowedTypes = getTransactionTypesForFilter(ActivityFilterType.Swaps)
  const now = Date.now()
  const sevenDaysAgo = now - 7 * ONE_DAY_MS

  return filterTransactionDetailsFromActivityItems(transactions)
    .filter((tx: TransactionDetails) => allowedTypes !== 'all' && allowedTypes.includes(tx.typeInfo.type))
    .filter((tx: TransactionDetails) => tx.addedTime >= sevenDaysAgo)
}

export function useSwapsThisWeek(activityData: ActivityRenderData) {
  const { sectionData, isLoading } = activityData
  const portfolioAddresses = usePortfolioAddresses()
  const { chainId } = usePortfolioRoutes()
  const { chains } = useEnabledChains()

  // Get the primary address (EVM takes precedence)
  const address = portfolioAddresses.evmAddress ?? portfolioAddresses.svmAddress
  const chainIds = chainId ? [chainId] : chains

  // Fetch USD values from GraphQL for swaps
  const graphQLUSDValues = useSwapUSDValuesFromGraphQL(address, chainIds)

  const swapsLast7Days = useMemo(() => (sectionData ? filterSwapsTypeLast7Days(sectionData) : []), [sectionData])

  const totalVolumeUSD = useMemo(() => {
    const getSwapUSDValue = (tx: TransactionDetails): number => {
      return tx.typeInfo.transactedUSDValue ?? (tx.hash ? graphQLUSDValues.get(tx.hash) : undefined) ?? 0
    }

    return swapsLast7Days.reduce((sum, tx) => sum + getSwapUSDValue(tx), 0)
  }, [swapsLast7Days, graphQLUSDValues])

  return { count: swapsLast7Days.length, totalVolumeUSD, isLoading }
}
